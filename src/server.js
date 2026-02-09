const express = require("express");
const path = require("path");
const os = require("os");
const fs = require("fs").promises;
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
  charset: 'utf8mb4',
});
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "./public")));

async function verifyCredentials(username, password) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM users WHERE username = ?", [username]);

    if (rows.length === 0) {
      return { valid: false, user_id: null };
    }
    const isMatch = await bcrypt.compare(password, rows[0].password_hash);

    if (isMatch) {
      return {
        valid: true,
        user_id: rows[0].id
      };
    } else {
      return {
        valid: false,
        user_id: rows[0].id
      };
    }

  } catch (err) {
    console.error("Database error:", err);
    return { valid: false, user_id: null };
  } finally {
    if (conn) conn.release();
  }
}

async function retrieveUsersWithFiles(username) {
  let conn;
  try {
    let return_obj = []
    conn = await pool.getConnection();
    let users = await conn.query("SELECT * FROM users");
    for (let user of users) {
      let curr_obj = {}
      curr_obj.user_id = user.id;
      curr_obj.username = user.username;
      curr_obj.quota = user.quota_in_bytes;
      curr_obj.is_admin= user.is_admin;
      curr_obj.creation_date = user.date_of_creation
      curr_obj.files = []
      let curr_files_result = await conn.query("SELECT FROM file_index WHERE user_id = ? ", [user.id]);
      for (let file of curr_files_result) {
        curr_file_obj = {}
        curr_file_obj.id = file.id;
        curr_file_obj.visibility = file.visibility;
        curr_file_obj.size = file.file_size_in_bytes;
        curr_file_obj.originalname = file.original_name;
        curr_file_obj.mimetype = file.mime_type;
        curr_obj.files.push(curr_file_obj);
      }
    }
  }
  finally {
    if (conn) conn.release();
  }
}

async function getPermissions(token) {
  let conn;
  try {
    conn = await pool.getConnection();
    let res1 = await conn.query("SELECT * FROM session_tokens WHERE token = ?", [
      token,
    ]);
    if (res1.length > 0) {
      if (res1[0].is_valid !== 1){
        return "none"
      }
      let res2 = await conn.query("SELECT * FROM users WHERE id = ?", [res1[0].user_id]);
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

async function logout(token) {
  let conn;
  try {
    conn = await pool.getConnection();
    return await conn.query("DELETE FROM session_tokens WHERE token = ?", [token]);
  }
  finally {
    if (conn) {
      conn.release();
    }
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
        if (res2.length > 0) {
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

async function getTotalQuota(user_id) {
  let conn;
  try {
    conn = await pool.getConnection();
    let result = await conn.query("SELECT * FROM users WHERE id = ?", [user_id])
    if (result.length > 0) {
      return result[0].quota_in_bytes
    }
    else {
      return null;
    }
  }
  finally {
    if (conn) {conn.release();}
  }
}

async function getUsedQuota(user_id) {
  let conn;
  try {
    conn = await pool.getConnection();
    let used_res = await conn.query(
        "SELECT SUM(file_size_in_bytes) AS total_used FROM file_index WHERE user_id = ?",
        [user_id]
    );
    return used_res[0];
  }
  finally {
    if (conn) {conn.release();}
  }
}

async function calculateRemainFromQuota(user_id) {
  let conn;
  try {
    conn = await pool.getConnection();

    let result = await conn.query("SELECT quota_in_bytes FROM users WHERE id = ?", [user_id]);
    if (result.length === 0) return 0;

    let quota = BigInt(result[0].quota_in_bytes);
    if (quota == 0n) return null;

    let used_res = await conn.query(
        "SELECT SUM(file_size_in_bytes) AS total_used FROM file_index WHERE user_id = ?",
        [user_id]
    );

    let used_up = BigInt(used_res[0].total_used || 0);

    return Number(quota - used_up);
  } finally {
    if (conn) conn.release();
  }
}

async function prepareUploadContext(req, res, next) {
  const code = await generateUniqueFileID(6);
  req.fileCode = code;
  let remaining = await calculateRemainFromQuota(req.user.id);
  if (remaining !== null) {
    req.maxUploadSize = remaining;
  }
  next();
}

async function userChangePassword(token, cur_password, new_password) {
  let conn;
  try {
    conn = await pool.getConnection();
    let token_perm = await getPermissions(token);
    let user_id = await validateToken(token);
    if (token_perm !== "none" && user_id !== false) {
      let cur_db_entry = await conn.query("SELECT * FROM users WHERE id = ?", [user_id]);
      if (cur_db_entry.length > 0) {
        const isMatch = await bcrypt.compare(cur_password, cur_db_entry[0].password_hash);
        const isMatch_toNew = await bcrypt.compare(new_password, cur_db_entry[0].password_hash);
        if (isMatch_toNew) {
          return 1; // Error New password cannot be the same as the old
        }

        if (isMatch) {
          let new_password_hash = await bcrypt.hash(new_password, 10);
          let change_query = await conn.query("UPDATE users SET password_hash =? WHERE id = ?", [new_password_hash,user_id])
          let delete_active_query = await conn.query("DELETE FROM session_tokens WHERE user_id = ?", [user_id]);
          return 0; // Everything was a success
        }
        else {
          return 2; // Invalid current password
        }
        }
      else {
        return 3 // Invalid credentials
      }
    }
    else {
      return 3; // Invalid credentials
    }
  }
  finally {
    if (conn) {conn.release();}
  }
}

const uploadMiddleware = (req, res, next) => {
  const limits = {};
  if (req.maxUploadSize) {
    limits.fileSize = req.maxUploadSize;
  }

  const upload = multer({
    storage: storage,
    limits: limits,
  }).single("file");

  upload(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

async function authenticateUser(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.sendStatus(401);
  let user_id = await validateToken(auth);
  if (user_id === false) {
    return res.sendStatus(401);
  }
  req.user = { id: user_id };
  next();
}

async function retrieveFileInfo(file_code) {
  let conn;
  try {
    conn = await pool.getConnection();
    let result = await conn.query("SELECT * FROM file_index WHERE id = ?", [file_code])
    if (result.length === 0) {return null}
    if (result.length > 1) {return null}
    else {return result[0]}
  }
  finally {
    if (conn) {conn.release();}
  }
}

async function registerUploadInIndex(req) {
  let conn;
  try {
    conn = await pool.getConnection();

    let res = await conn.query(
        "INSERT INTO file_index(id, mime_type, stored_filename, original_name, file_size_in_bytes, user_id) VALUES (?,?,?,?,?,?)",
        [
          req.fileCode,
          req.file.mimetype,
          req.file.filename,
          req.file.originalname,
          req.file.size,
          req.user.id,
        ],
    );
    return !!res;
  } finally {
    if (conn) conn.release();
  }
}

async function getAllUserFiles(user_id) {
  let conn;
  try {
    conn = await pool.getConnection();
    let results = await conn.query("SELECT * FROM file_index WHERE user_id = ?", [user_id]);
    let return_list = []
    for (let file in results) {
      return_list.push({code:results[file].id,name:results[file].original_name,mimetype:results[file].mime_type,size:results[file].file_size_in_bytes,date:results[file].date_added});
    }
    return return_list;
  }
  finally {
    if (conn) {conn.release();}
  }
}

async function deleteFile(file_code) {
  let conn;
  try {
    conn = await pool.getConnection();
    let file_data = await conn.query("SELECT * FROM file_index WHERE id = ?", [file_code]);
    if (file_data.length === 0) {return "no file found"}
    try {
      await fs.unlink(process.env.UPLOAD_PATH + file_data[0].stored_filename)
    }
    catch(err) {
      console.log(err);
      return err
    }
    await conn.query("DELETE FROM file_index WHERE id = ?", [file_code]);
    return true
  }
  finally {
    if (conn) {conn.release();}
  }
}

const storage = multer.diskStorage({
  destination: process.env.UPLOAD_PATH || "./uploads",
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${req.fileCode}${ext}`;
    cb(null, filename);
  },
});

const upload = (req, res, next) => {
  multer({
    storage: storage,
    limits: { fileSize: req.maxUploadSize },
  }).single("file")(req, res, next);
};

app.post("/verifySession", async (req, res, next) => {
  let token = req.body.token
  if (!token) return res.sendStatus(401);

  let result = await getPermissions(token);
  if (result !== "none") {
    return res.json({permission:result})
  }
  else {
    return res.sendStatus(401)
  }
})

app.get("/files/:file_code",async (req, res) => {
  let file_code = req.params.file_code;
  if (file_code.length !== 6){return res.sendStatus(400)}
  let regex =/\d/
  if (regex.test(file_code)){return res.sendStatus(400)}
  let db_result = await retrieveFileInfo(file_code);
  if (db_result === null) {
    return res.sendStatus(404)
  }
  if (db_result !== null) {
    let stored_name = db_result.stored_filename;
    let original_name = db_result.original_name;
    return res.download(process.env.UPLOAD_PATH+stored_name, original_name);
  }
})

app.get("/delete/:file_code",async (req, res) => {
  if (!req.headers.authorization) {return res.sendStatus(401)}
  let file_code = req.params.file_code;
  if (file_code.length !== 6){return res.sendStatus(400)}
  let regex =/\d/
  if (regex.test(file_code)){return res.sendStatus(400)}
  let perms = await getPermissions(req.headers.authorization);
  let user_id = await validateToken(req.headers.authorization);
  if (perms === "none") {
    return res.sendStatus(401)
  }
  if (perms === "user") {
    let file_info = await retrieveFileInfo(file_code);
    if (file_info.user_id === user_id) {
      let result = await deleteFile(file_code);
      if (result === true) {
        return res.sendStatus(200)
      }
      else {
        return res.status(500).json({error: result})
      }
    }
  }
  if (perms === "admin") {
    let result = await deleteFile(file_code);
    if (result === true) {
      return res.sendStatus(200)
    }
    else {
      return res.status(500).json({error: result})
    }
  }
})

app.get("/admin/getAllUsersWithFiles",async (req, res) => {
  if (!req.headers.authorization) {return res.sendStatus(401)}
  let perms = await getPermissions(req.headers.authorization);
  let user_id = await validateToken(req.headers.authorization);
  if (perms === "none") {
    return res.sendStatus(401)
  }
  if (perms === "user") {
    let file_info = await retrieveFileInfo(file_code);
    if (file_info.user_id === user_id) {
      let result = await deleteFile(file_code);
      if (result === true) {
        return res.sendStatus(200)
      }
      else {
        return res.status(500).json({error: result})
      }
    }
  }
  if (perms === "admin") {
    let result = await retrieveFileInfo();
    if (result === true) {
      console.log(result)
    }
    else {
      return res.status(500).json({error: result})
    }
  }
})

app.post("/quota", async (req, res) => {
  if (!req.body.token) return res.sendStatus(401)
  let token = req.body.token;
  let user_id = await validateToken(token);
  if (await getPermissions(token) === "none" || !user_id) {
    return res.sendStatus(401)
  }
  let total_quota = await getTotalQuota(user_id)
  let used_quota = await getUsedQuota(user_id)
  used_quota = used_quota.total_used
  used_quota = used_quota.toString()
  total_quota = total_quota.toString()

  return res.status(200).json({
    "total": total_quota ? Number(total_quota) : total_quota,
    "used": used_quota.total_used ? Number(used_quota.total_used) : used_quota.total_used
  });

})

app.post("/getAllFiles", async (req, res) => {
  if (!req.body.token) return res.sendStatus(400)
  let token = req.body.token;
  let user_id = await validateToken(token);
  if (await getPermissions(token) === "none" || !user_id) {
    return res.sendStatus(401)
  }
  let results = await getAllUserFiles(user_id);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).json(results);
})

app.post("/upload", authenticateUser,prepareUploadContext, uploadMiddleware, async (req, res) => {

      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      let result = await registerUploadInIndex(req);

      if (result == true) {
        res.status(200).json({
          error: null,
          message: "Successfully uploaded file!",
          code: req.fileCode,
        });
      } else {
        res.status(500).json({ error: "Database registration failed" });
      }
    }
);
// Error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File too large" });
    }
  }
  if (err) {
    console.log(err);
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

app.post("/logout", async (req, res) => {
  if (!req.body.token){return res.status(400)}
  let result = await logout(req.body.token)
  res.sendStatus(200)
})

app.post("/userChangePassword", async (req, res) => {
  if (!req.body.token || !req.body.cur_password || !req.body.new_password){
    return res.status(400).json({message: "Invalid request!"})
  }

  let result = await userChangePassword(req.body.token,req.body.cur_password ,req.body.new_password);
  if (result === 0) {
    return res.status(200).json({message: "Password changed successfully!"});
  }
  if (result === 1) {
    return res.status(400).json({message: "New password cannot be the same as the old password!"});
  }
  if (result === 2) {
    return res.status(401).json({message: "Invalid current password!"});
  }
  if (result === 3) {
    return res.status(401).json({message: "Invalid token!"});
  }
})

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
  res.sendFile(path.join(__dirname, "./public/index.html"));
});

app.get("/admin/dashboard/:token", async (req, res) => {
  if (!req.params.token) {return res.sendStatus(401)}
  console.log(req.params.token);
  let perms = await getPermissions(req.params.token);
  let user_id = await validateToken(req.params.token);
  if (perms === "none") {
    return res.sendStatus(401)
  }
  if (perms === "user") {
    let file_info = await retrieveFileInfo(file_code);
    if (file_info.user_id === user_id) {
      let result = await deleteFile(file_code);
      if (result === true) {
        return res.sendStatus(200)
      }
      else {
        return res.status(500).json({error: result})
      }
    }
  }
  if (perms === "admin") {
    res.sendFile(path.join(__dirname, "./public/index.html"));
  }
})


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
