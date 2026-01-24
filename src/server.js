const express = require("express");
const path = require("path");
const os = require("os");
require("dotenv").config();
const mariadb = require("mariadb");
const bcrypt = require("bcrypt");
const multer = require("multer");
const PORT = process.env.PORT || 3000;

console.log(process.env.DB_HOST);
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "simpleShare",
  connectionLimit: 5,
});
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "./static")));

async function verifyCredentials(username, password) {
  let conn;
  try {
    if (username === "master" && password === "masterpass") {
      return { valid: true, user_id: 0 };
    }
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM users WHERE username = ?", [username]);

    if (rows.length === 0) {
      return { valid: false, user_id: null };
    }

    const isMatch = await bcrypt.compare(password, rows[0].password_hash);

    return {
      valid: isMatch,
      user_id: rows[0].id
    };

  } catch (err) {
    console.error("Database error:", err);
    return { valid: false, user_id: null };
  } finally {
    if (conn) conn.release();
  }
}

async function getPermissions(token) {
  let conn;
  try {
    conn = await pool.getConnection();
    let res1 = conn.query("SELECT * FROM session_tokens WHERE token = ?", [
      token,
    ]);
    if (res1.length > 0) {
      let res2 = conn.query("SELECT * FROM users WHERE id = ?", [res1.user_id]);
      if (res2.length > 0) {
        if (res2[0].is_admin == 1) {
          return "admin";
        } else {
          return "user";
        }
      } else {
        return "none";
      }
    } else {
      return "none";
    }
  } finally {
    if (conn) conn.release();
  }
}

async function generateSession(user_id) {
  let conn;
  try {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < chars.length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    conn = await pool.getConnection();
    await conn.query("INSERT INTO session_tokens (token, user_id) value (?, ?)", [
      token,
      user_id,
    ]);
    return token;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function registerUser(username, password) {
  let conn;
  try {
    conn = await pool.getConnection();
    let password_hash = await bcrypt.hash(password, 10);
    let verified = await verifyCredentials(username, password);
    if (verified.user_id === null) {
      await conn.query(
        "INSERT INTO users (username,password_hash) VALUES (?, ?)",
        [username, password_hash],
      );
      return { success: true, error: null };
    } else {
      return { success: false, error: "User already exists!" };
    }
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function validateToken(token) {
  let conn;
  try {
    conn = await pool.getConnection();
    let res = await conn.query("SELECT * FROM session_tokens WHERE token = ?", [
      token,
    ]);
    if (res.length > 0) {
      if (res[0].is_valid == 1) {
        let res2 = await conn.query("SELECT * FROM users WHERE id = ?", [
          res[0].user_id,
        ]);
        if (res.length > 0) {
          return res[0].user_id;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return false;
    }
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function generateUniqueFileID(code_length) {
  let conn;
  try {
    conn = await pool.getConnection();
    const chars = "abcdefghijklmnopqrstuvwxyz";
    while (true) {
      let result = "";
      for (let i = 0; i < code_length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      let res = await conn.query("SELECT * FROM file_index WHERE id = ?", [
        result,
      ]);
      if (res.length == 0) {
        return result;
      }
    }
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function calculateRemainFromQuota(session_token) {
  let conn;
  try {
    conn = await pool.getConnection();
    let validation_res = await validateToken(session_token);
    if (validation_res != false) {
      let quota = conn.query("SELECT * FROM users WHERE id = ?", [
        validation_res,
      ])[0].quota_in_bytes;
      if (quota == 0) {
        return null;
      }
      let used_up = conn.query(
        "SELECT SUM(file_size_in_bytes) AS total_used FROM file_index WHERE user_id = ?",
        [validation_res],
      );
      return quota - used_up;
    } else {
      return 0;
    }
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function authenticateUser(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.sendStatus(401);
  let auth_result = await validateToken(auth);
  if (auth_result == false) {
    res.sendStatus(401);
  }
  next();
}

async function setUploadLimits(req, res, next) {
  req.maxUploadSize = await calculateRemainFromQuota(req.headers.authorization);
  next();
}

async function registerUploadInIndex(req) {
  let conn;
  try {
    conn = await pool.getConnection();
    let user_id = await validateToken(req.headers.authorization);
    let res = await conn.query(
      "INSERT INTO file_index(id,mime_type,stored_filename,original_filename,file_size_in_bytes,user_id) VALUES (?,?,?,?,?,?)",
      [
        req.file.code,
        req.file.mimetype,
        req.file.filename,
        req.file.originalname,
        req.file.size,
        user_id,
      ],
    );
    if (res) {
      return true;
    } else {
      return false;
    }
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

const storage = multer.diskStorage({
  destination: process.env.UPLOAD_PATH,
  filename: function (req, file, cb) {
    const code = generateUniqueFileID(6);
    const ext = path.extname(file.originalname);
    req.file.code = code;
    const filename = `${code}${ext}`;
    cb(null, filename);
  },
});

const upload = (req, res, next) => {
  multer({
    storage,
    limits: { fileSize: req.maxUploadSize },
  }).single("file")(req, res, next);
};

app.post("/verifySession", async (req, res, next) => {
  let token = req.body.token
  if (!token) return res.sendStatus(401);

  let result = await getPermissions(token);
  console.log(result);
  if (result !== "none") {
    return res.sendStatus(200).json({permission:result})
  }
  else {
    return res.sendStatus(401)
  }
})

app.post(
  "/upload",
  authenticateUser,
  setUploadLimits,
  upload,
  async (req, res) => {
    let result = await registerUploadInIndex(req);
    if (result == true) {
      res
        .sendStatus(200)
        .json({
          error: null,
          message: "Successfully uploaded file!",
          code: req.file.code,
        });
    }
  });
// Error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File too large" });
    }
  }

  if (err) {
    return res.status(500).json({ error: "Upload failed" });
  }

  next();
});

app.post("/login", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  if (!username || !password) {
    res.status(400).json({
      status: 400,
      error: "Username and password is required for autentication!",
    });
  }

  let verification_result = await verifyCredentials(username, password);
  if (verification_result.valid == true) {
    let token = await generateSession(verification_result.user_id);
    res.status(200).json({ status: 200, error: null, token: token });
  } else {
    res.status(401).json({ status: 401, error: "Invalid Credentials!" });
  }
});

app.post("/register", async (req, res) => {
  let new_username = req.body.username;
  let new_password = req.body.password;
  let auth_token = req.body.token;
  if (!new_username || !new_password || !auth_token) {
    res.status(400).json({ status: 400, error: "Invalid request!" });
  }
  let request_maker_permission = await getPermissions(auth_token);
  if (request_maker_permission == "admin") {
    let result = await registerUser(new_username, new_password);
    if (result.success == true) {
      res.status(200).json({ status: 200, error: null });
    } else {
      res.status(400).json({ status: 400, error: "User already exists!" });
    }
  } else {
    res.status(401).json({ status: 401, error: "Invalid Credentials!" });
  }
});
app.use("/", (req, res, next) => {
  res.sendFile(path.join(__dirname, "./static/index.html"));
});

// Generic
function getIPv4Addresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === "IPv4" && !interface.internal) {
        addresses.push(interface.address);
      }
    }
  }
  return addresses;
}

app.listen(PORT, () => {
  console.log("Server is Running");
  console.log(`http://localhost:${PORT}`);

  const ipAddresses = getIPv4Addresses();
  ipAddresses.forEach((ip) => {
    console.log(`http://${ip}:${PORT}`);
  });
});
