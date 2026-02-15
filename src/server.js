const express = require("express");
const path = require("path");
const os = require("os");
const fs = require("fs").promises;
require("dotenv").config();
const mariadb = require("mariadb");
const bcrypt = require("bcrypt");
const multer = require("multer");
const PORT = process.env.PORT || 3000;

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "simpleShare",
  connectionLimit: 5,
  charset: "utf8mb4",
});
const app = express();

// Set proper encoding headers
app.use((req, res, next) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  next();
});

app.use(express.json({ charset: "utf-8" }));
app.use(express.static(path.join(__dirname, "./public")));

async function verifyCredentials(username, password) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (rows.length === 0) {
      return { valid: false, user_id: null };
    }
    const isMatch = await bcrypt.compare(password, rows[0].password_hash);

    if (isMatch) {
      return {
        valid: true,
        user_id: rows[0].id,
      };
    } else {
      return {
        valid: false,
        user_id: rows[0].id,
      };
    }
  } catch (err) {
    console.error("Database error:", err);
    return { valid: false, user_id: null };
  } finally {
    if (conn) conn.release();
  }
}

async function retrieveUsersWithFiles() {
  let conn;
  try {
    let return_obj = [];
    conn = await pool.getConnection();
    let users = await conn.query("SELECT * FROM users");
    for (let user of users) {
      let curr_obj = {};
      curr_obj.user_id = user.id;
      curr_obj.username = user.username;
      curr_obj.quota = user.quota_in_bytes;
      curr_obj.is_admin = user.is_admin;
      curr_obj.creation_date = user.date_of_creation;
      curr_obj.files = [];
      let curr_files_result = await conn.query(
        "SELECT * FROM file_index WHERE user_id = ? ",
        [user.id],
      );
      for (let file of curr_files_result) {
        curr_file_obj = {};
        curr_file_obj.id = file.id;
        curr_file_obj.visibility = file.visibility;
        curr_file_obj.size = file.file_size_in_bytes;
        curr_file_obj.originalname = file.original_name;
        curr_file_obj.mimetype = file.mime_type;
        curr_file_obj.date_added = file.date_added;
        curr_obj.files.push(curr_file_obj);
      }
      return_obj.push(curr_obj);
    }
    return return_obj;
  } finally {
    if (conn) conn.release();
  }
}

async function getPermissions(token) {
  let conn;
  try {
    conn = await pool.getConnection();
    let res1 = await conn.query(
      "SELECT * FROM session_tokens WHERE token = ?",
      [token],
    );
    if (res1.length > 0) {
      if (res1[0].is_valid !== 1) {
        return "none";
      }
      let res2 = await conn.query("SELECT * FROM users WHERE id = ?", [
        res1[0].user_id,
      ]);
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
    return await conn.query("DELETE FROM session_tokens WHERE token = ?", [
      token,
    ]);
  } finally {
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
    await conn.query(
      "INSERT INTO session_tokens (token, user_id) value (?, ?)",
      [token, user_id],
    );
    return token;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function registerUser(
  username,
  password,
  isAdmin = false,
  quota = 52428800,
) {
  let conn;
  try {
    conn = await pool.getConnection();
    let password_hash = await bcrypt.hash(password, 10);
    let verified = await verifyCredentials(username, password);
    if (verified.user_id === null) {
      await conn.query(
        "INSERT INTO users (username, password_hash, is_admin, quota_in_bytes) VALUES (?, ?, ?, ?)",
        [username, password_hash, isAdmin ? 1 : 0, quota],
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
    let result = await conn.query("SELECT * FROM users WHERE id = ?", [
      user_id,
    ]);
    if (result.length > 0) {
      return result[0].quota_in_bytes;
    } else {
      return null;
    }
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function getUsedQuota(user_id) {
  let conn;
  try {
    conn = await pool.getConnection();
    let used_res = await conn.query(
      "SELECT SUM(file_size_in_bytes) AS total_used FROM file_index WHERE user_id = ?",
      [user_id],
    );
    return used_res[0];
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function calculateRemainFromQuota(user_id) {
  let conn;
  try {
    conn = await pool.getConnection();

    let result = await conn.query(
      "SELECT quota_in_bytes FROM users WHERE id = ?",
      [user_id],
    );
    if (result.length === 0) return 0;

    let quota = BigInt(result[0].quota_in_bytes);
    if (quota == 0n) return null;

    let used_res = await conn.query(
      "SELECT SUM(file_size_in_bytes) AS total_used FROM file_index WHERE user_id = ?",
      [user_id],
    );

    let used_up = BigInt(used_res[0].total_used || 0);

    return Number(quota - used_up);
  } finally {
    if (conn) conn.release();
  }
}

async function countAdmins() {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query("SELECT COUNT(*) as admin_count FROM users WHERE is_admin = 1");
    return result[0].admin_count;
  } finally {
    if (conn) conn.release();
  }
}

async function getTotalStorageUsed() {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query("SELECT SUM(file_size_in_bytes) AS total_used FROM file_index");
    return Number(result[0].total_used || 0);
  } finally {
    if (conn) conn.release();
  }
}

async function getGlobalStorageLimit() {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query("SELECT num_value FROM settings WHERE name = ?", [
      "global-storage-limit",
    ]);
    return result.length > 0 ? Number(BigInt(result[0].num_value)) : 0;
  } finally {
    if (conn) conn.release();
  }
}

async function setGlobalStorageLimit(limit) {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // First check if the setting already exists
    const existing = await conn.query("SELECT * FROM settings WHERE name = ?", [
      "global-storage-limit",
    ]);
    
    if (existing.length > 0) {
      // Update existing record
      await conn.query("UPDATE settings SET num_value = ? WHERE name = ?", [
        limit, "global-storage-limit"
      ]);
    } else {
      // Insert new record
      await conn.query("INSERT INTO settings (name, num_value) VALUES (?, ?)", [
        "global-storage-limit", limit
      ]);
    }
    
    return true;
  } finally {
    if (conn) conn.release();
  }
}

async function calculateRemainingGlobalStorage() {
  const totalLimit = await getGlobalStorageLimit();
  if (totalLimit === 0) return null; // Unlimited
  const totalUsed = await getTotalStorageUsed();
  return totalLimit - totalUsed;
}

async function prepareUploadContext(req, res, next) {
  const code = await generateUniqueFileID(6);
  req.fileCode = code;

  // Check global storage limit first
  const globalRemaining = await calculateRemainingGlobalStorage();
  if (globalRemaining !== null && globalRemaining <= 0) {
    return res.status(500).json({ error: "Global storage limit reached" });
  }
  
  // Check user quota
  let remaining = await calculateRemainFromQuota(req.user.id);
  if (remaining < 0) {return res.sendStatus(413)}
  if (remaining !== null) {
    req.maxUploadSize = remaining;
  }
  else if(globalRemaining !== null && remaining === null) {
    if(globalRemaining <= 0) {
      res.sendStatus(500);
    }
    else {
      req.maxUploadSize = globalRemaining;
    }
  }
  
  // Apply global storage limit to max upload size if it's more restrictive
  if (globalRemaining !== null && remaining > globalRemaining) {
    if (globalRemaining <= 0) {
      res.sendStatus(500)
    } else {
      req.maxUploadSize = globalRemaining;
    }
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
      let cur_db_entry = await conn.query("SELECT * FROM users WHERE id = ?", [
        user_id,
      ]);
      if (cur_db_entry.length > 0) {
        const isMatch = await bcrypt.compare(
          cur_password,
          cur_db_entry[0].password_hash,
        );
        const isMatch_toNew = await bcrypt.compare(
          new_password,
          cur_db_entry[0].password_hash,
        );
        if (isMatch_toNew) {
          return 1; // Error New password cannot be the same as the old
        }

        if (isMatch) {
          let new_password_hash = await bcrypt.hash(new_password, 10);
          let change_query = await conn.query(
            "UPDATE users SET password_hash =? WHERE id = ?",
            [new_password_hash, user_id],
          );
          let delete_active_query = await conn.query(
            "DELETE FROM session_tokens WHERE user_id = ?",
            [user_id],
          );
          return 0; // Everything was a success
        } else {
          return 2; // Invalid current password
        }
      } else {
        return 3; // Invalid credentials
      }
    } else {
      return 3; // Invalid credentials
    }
  } finally {
    if (conn) {
      conn.release();
    }
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
    let result = await conn.query("SELECT * FROM file_index WHERE id = ?", [
      file_code,
    ]);
    if (result.length === 0) {
      return null;
    }
    if (result.length > 1) {
      return null;
    } else {
      return result[0];
    }
  } finally {
    if (conn) {
      conn.release();
    }
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
    let results = await conn.query(
      "SELECT * FROM file_index WHERE user_id = ?",
      [user_id],
    );
    let return_list = [];
    for (let file in results) {
      return_list.push({
        code: results[file].id,
        name: results[file].original_name,
        mimetype: results[file].mime_type,
        size: results[file].file_size_in_bytes,
        date: results[file].date_added,
      });
    }
    return return_list;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function deleteFile(file_code) {
  let conn;
  try {
    conn = await pool.getConnection();
    let file_data = await conn.query("SELECT * FROM file_index WHERE id = ?", [
      file_code,
    ]);
    if (file_data.length === 0) {
      return "no file found";
    }
    try {
      await fs.unlink(process.env.UPLOAD_PATH + file_data[0].stored_filename);
    } catch (err) {
      // File deletion error - continue with database cleanup
      console.log("File deletion error:", err);
    }
    await conn.query("DELETE FROM file_index WHERE id = ?", [file_code]);
    return true;
  } finally {
    if (conn) {
      conn.release();
    }
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

app.post("/verifySession", async (req, res, next) => {
  let token = req.body.token;
  if (!token) return res.sendStatus(401);

  let result = await getPermissions(token);
  if (result !== "none") {
    return res.json({ permission: result });
  } else {
    return res.sendStatus(401);
  }
});

app.get("/files/:file_code", async (req, res) => {
  let file_code = req.params.file_code;
  if (file_code.length !== 6) {
    return res.sendStatus(400);
  }
  let regex = /\d/;
  if (regex.test(file_code)) {
    return res.sendStatus(400);
  }
  let db_result = await retrieveFileInfo(file_code);
  if (db_result === null) {
    return res.sendStatus(404);
  }
  if (db_result !== null) {
    let stored_name = db_result.stored_filename;
    let original_name = db_result.original_name;
    return res.download(process.env.UPLOAD_PATH + stored_name, original_name);
  }
});

app.get("/delete/:file_code", async (req, res) => {
  if (!req.headers.authorization) {
    return res.sendStatus(401);
  }
  let file_code = req.params.file_code;
  if (file_code.length !== 6) {
    return res.sendStatus(400);
  }
  let regex = /\d/;
  if (regex.test(file_code)) {
    return res.sendStatus(400);
  }
  let perms = await getPermissions(req.headers.authorization);
  let user_id = await validateToken(req.headers.authorization);
  if (perms === "none") {
    return res.sendStatus(401);
  }
  if (perms === "user") {
    let file_info = await retrieveFileInfo(file_code);
    if (file_info.user_id === user_id) {
      let result = await deleteFile(file_code);
      if (result === true) {
        return res.sendStatus(200);
      } else {
        return res.status(500).json({ error: result });
      }
    }
  }
  if (perms === "admin") {
    let result = await deleteFile(file_code);
    if (result === true) {
      return res.sendStatus(200);
    } else {
      return res.status(500).json({ error: result });
    }
  }
});

app.get("/admin/getAllUsersWithFiles", async (req, res) => {
  if (!req.headers.authorization) {
    return res.sendStatus(401);
  }
  let perms = await getPermissions(req.headers.authorization);
  if (perms === "none") {
    return res.sendStatus(401);
  }
  if (perms === "user") {
    return res.sendStatus(403);
  }
  if (perms === "admin") {
    let result = await retrieveUsersWithFiles();
    if (result) {
      // Convert BigInt values to regular numbers for JSON serialization
      result = JSON.parse(
        JSON.stringify(result, (key, value) =>
          typeof value === "bigint" ? Number(value) : value,
        ),
      );
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).json(result);
    } else {
      return res.status(500).json({ error: "Failed to retrieve data" });
    }
  }
});

app.get("/admin/getTables", async (req, res) => {
  if (!req.headers.authorization) {
    return res.sendStatus(401);
  }
  let perms = await getPermissions(req.headers.authorization);
  if (perms === "none") {
    return res.sendStatus(401);
  }
  if (perms === "user") {
    return res.sendStatus(403);
  }
  if (perms === "admin") {
    try {
      const conn = await pool.getConnection();
      const result = await conn.execute("SHOW TABLES");
      conn.release();
      
      // The result is already the array of rows, not [rows, fields]
      const rows = result;
      
      if (!Array.isArray(rows)) {
        console.error("Rows is not an array:", rows);
        return res.status(500).json({ error: "Invalid query result format" });
      }
      
      // Extract table names from the result
      const tables = rows.map(row => {
        // MySQL SHOW TABLES returns objects with key like "Tables_in_databaseName"
        const keys = Object.keys(row);
        return row[keys[0]];
      });
      
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).json(tables);
    } catch (error) {
      console.error("Error getting tables:", error);
      return res.status(500).json({ error: "Failed to retrieve tables" });
    }
  }
});

app.get("/admin/getTableData", async (req, res) => {
  if (!req.headers.authorization) {
    return res.sendStatus(401);
  }
  let perms = await getPermissions(req.headers.authorization);
  if (perms === "none") {
    return res.sendStatus(401);
  }
  if (perms === "user") {
    return res.sendStatus(403);
  }
  if (perms === "admin") {
    try {
      const tableName = req.query.table;
      if (!tableName) {
        return res.status(400).json({ error: "Table name is required" });
      }
      
      const conn = await pool.getConnection();
      
      // Get column information
      const columns = await conn.execute(`DESCRIBE ${tableName}`);
      const columnNames = columns.map(col => col.Field);
      
      // Get table data
      const rows = await conn.execute(`SELECT * FROM ${tableName} LIMIT 100`);
      conn.release();
      
      // Convert rows to array format and handle BigInt
      const data = rows.map(row => {
        return columnNames.map(col => {
          const value = row[col];
          return typeof value === 'bigint' ? Number(value) : value;
        });
      });
      
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).json({
        columns: columnNames,
        rows: data
      });
    } catch (error) {
      console.error("Error getting table data:", error);
      return res.status(500).json({ error: "Failed to retrieve table data" });
    }
  }
});

app.get("/admin/getTableSchema", async (req, res) => {
  if (!req.headers.authorization) {
    return res.sendStatus(401);
  }
  let perms = await getPermissions(req.headers.authorization);
  if (perms === "none") {
    return res.sendStatus(401);
  }
  if (perms === "user") {
    return res.sendStatus(403);
  }
  if (perms === "admin") {
    try {
      const tableName = req.query.table;
      if (!tableName) {
        return res.status(400).json({ error: "Table name is required" });
      }
      
      const conn = await pool.getConnection();
      const columns = await conn.execute(`DESCRIBE ${tableName}`);
      conn.release();
      
      const schema = columns.map(col => ({
        name: col.Field,
        type: col.Type,
        nullable: col.Null,
        key: col.Key,
        default: col.Default,
        extra: col.Extra
      }));
      
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).json(schema);
    } catch (error) {
      console.error("Error getting table schema:", error);
      return res.status(500).json({ error: "Failed to retrieve table schema" });
    }
  }
});

app.get("/admin/getGlobalStorageStats", async (req, res) => {
  if (!req.headers.authorization) {
    return res.sendStatus(401);
  }
  let perms = await getPermissions(req.headers.authorization);
  if (perms === "none") {
    return res.sendStatus(401);
  }
  if (perms === "user") {
    return res.sendStatus(403);
  }
  if (perms === "admin") {
    try {
      const totalLimit = await getGlobalStorageLimit();
      const totalUsed = await getTotalStorageUsed();
      const remaining = totalLimit === 0 ? null : totalLimit - totalUsed;
      
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).json({
        limit: totalLimit,
        used: totalUsed,
        remaining: remaining,
        percentage: totalLimit === 0 ? 0 : Math.round((totalUsed / totalLimit) * 100)
      });
    } catch (error) {
      console.error("Error getting global storage stats:", error);
      return res.status(500).json({ error: "Failed to retrieve storage statistics" });
    }
  }
});

app.post("/admin/setGlobalStorageLimit", async (req, res) => {
  if (!req.headers.authorization) {
    return res.sendStatus(401);
  }
  let perms = await getPermissions(req.headers.authorization);
  if (perms === "none") {
    return res.sendStatus(401);
  }
  if (perms === "user") {
    return res.sendStatus(403);
  }
  if (perms === "admin") {
    try {
      const { limit } = req.body;
      
      // Validate limit (0 for unlimited, or between 100MB and 1TB)
      if (limit !== 0 && (limit < 104857600 || limit > 1099511627776)) {
        return res.status(400).json({ 
          error: "Storage limit must be 0 (unlimited) or between 100MB and 1TB" 
        });
      }
      
      await setGlobalStorageLimit(limit);
      return res.status(200).json({ 
        success: true, 
        message: "Global storage limit updated successfully",
        limit: limit 
      });
    } catch (error) {
      console.error("Error setting global storage limit:", error);
      return res.status(500).json({ error: "Failed to update storage limit" });
    }
  }
});

app.post("/quota", async (req, res) => {
  if (!req.body.token) return res.sendStatus(401);
  let token = req.body.token;
  let user_id = await validateToken(token);
  if ((await getPermissions(token)) === "none" || !user_id) {
    return res.sendStatus(401);
  }
  let total_quota = await getTotalQuota(user_id);
  let used_quota = await getUsedQuota(user_id);

  // Handle case where user has no files (used_quota is null/undefined)
  let used_quota_value =
    used_quota && used_quota.total_used ? used_quota.total_used : 0;
  let total_quota_value = total_quota ? total_quota : 0;

  return res.status(200).json({
    total: Number(total_quota_value),
    used: Number(used_quota_value),
  });
});

app.post("/checkFile", async (req, res) => {
  let file_code = req.body.code;
  if (!file_code || file_code.length !== 6) {
    return res.status(400).json({ exists: false });
  }
  let regex = /\d/;
  if (regex.test(file_code)) {
    return res.status(400).json({ exists: false });
  }
  let db_result = await retrieveFileInfo(file_code);
  if (db_result === null) {
    return res.status(200).json({ exists: false });
  } else {
    // Fix encoding for special characters
    let filename = db_result.original_name;
    try {
      // Try to decode if it's double-encoded
      filename = decodeURIComponent(escape(filename));
    } catch (e) {
      // If decoding fails, use original
      filename = db_result.original_name;
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json({
      exists: true,
      filename: filename,
    });
  }
});

app.post("/getAllFiles", async (req, res) => {
  if (!req.body.token) return res.sendStatus(400);
  let token = req.body.token;
  let user_id = await validateToken(token);
  if ((await getPermissions(token)) === "none" || !user_id) {
    return res.sendStatus(401);
  }
  let results = await getAllUserFiles(user_id);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(200).json(results);
});

app.post(
  "/upload",
  authenticateUser,
  prepareUploadContext,
  uploadMiddleware,
  async (req, res) => {
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
  },
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
  if (!req.body.token) {
    return res.status(400);
  }
  let result = await logout(req.body.token);
  res.sendStatus(200);
});

app.post("/userChangePassword", async (req, res) => {
  if (!req.body.token || !req.body.cur_password || !req.body.new_password) {
    return res.status(400).json({ message: "Invalid request!" });
  }

  let result = await userChangePassword(
    req.body.token,
    req.body.cur_password,
    req.body.new_password,
  );
  if (result === 0) {
    return res.status(200).json({ message: "Password changed successfully!" });
  }
  if (result === 1) {
    return res.status(400).json({
      message: "New password cannot be the same as the old password!",
    });
  }
  if (result === 2) {
    return res.status(401).json({ message: "Invalid current password!" });
  }
  if (result === 3) {
    return res.status(401).json({ message: "Invalid token!" });
  }
});

app.post("/register", async (req, res) => {
  let new_username = req.body.username;
  let new_password = req.body.password;
  let auth_token = req.body.token;
  let is_admin = req.body.isAdmin || false;
  let quota = req.body.quota || 52428800; // Default to 50MB

  if (!new_username || !new_password || !auth_token) {
    res.status(400).json({ status: 400, error: "Invalid request!" });
  }
  let request_maker_permission = await getPermissions(auth_token);
  if (request_maker_permission == "admin") {
    let result = await registerUser(
      new_username,
      new_password,
      is_admin,
      quota,
    );
    if (result.success == true) {
      res.status(200).json({ status: 200, error: null });
    } else {
      res.status(400).json({ status: 400, error: "User already exists!" });
    }
  } else {
    res.status(401).json({ status: 401, error: "Invalid Credentials!" });
  }
});

app.get("/admin/dashboard/:token", async (req, res) => {
  if (!req.params.token) {
    return res.sendStatus(401);
  }
  let perms = await getPermissions(req.params.token);
  let user_id = await validateToken(req.params.token);
  if (perms === "none") {
    return res.sendStatus(401);
  }
  if (perms === "user") {
    return res.sendStatus(403);
  }
  if (perms === "admin") {
    res.sendFile(path.join(__dirname, "./public/admin.html"));
  }
});

app.post("/admin/deleteUser", async (req, res) => {
  if (!req.headers.authorization) {
    return res.sendStatus(401);
  }

  const { userId, adminPassword } = req.body;

  if (!userId || !adminPassword) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Verify admin permissions and password
    const adminToken = req.headers.authorization;
    const adminUserId = await validateToken(adminToken);

    if (adminUserId === false) {
      return res.sendStatus(401);
    }

    const adminPerms = await getPermissions(adminToken);
    if (adminPerms !== "admin") {
      return res.sendStatus(403);
    }

    // Get admin user data to verify password
    const adminData = await conn.query("SELECT * FROM users WHERE id = ?", [
      adminUserId,
    ]);
    if (adminData.length === 0) {
      return res.status(401).json({ error: "Admin user not found" });
    }

    // Verify admin password
    const isPasswordValid = await bcrypt.compare(
      adminPassword,
      adminData[0].password_hash,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    // Prevent admin from deleting themselves
    if (userId === adminUserId.toString()) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Get user's files to delete from filesystem
    const userFiles = await conn.query(
      "SELECT * FROM file_index WHERE user_id = ?",
      [userId],
    );

    // Delete files from filesystem
    for (const file of userFiles) {
      try {
        await fs.unlink(process.env.UPLOAD_PATH + file.stored_filename);
      } catch (err) {
        console.log("File deletion error:", err);
        // Continue even if file deletion fails
      }
    }

    // Delete user's files from database
    await conn.query("DELETE FROM file_index WHERE user_id = ?", [userId]);

    // Delete user's session tokens
    await conn.query("DELETE FROM session_tokens WHERE user_id = ?", [userId]);

    // Delete user account
    await conn.query("DELETE FROM users WHERE id = ?", [userId]);

    return res
      .status(200)
      .json({ message: "User and all associated data deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

app.post("/admin/changePassword", async (req, res) => {
  if (!req.headers.authorization) {
    return res.sendStatus(401);
  }

  const { userId, newPassword, adminPassword } = req.body;

  if (!userId || !newPassword || !adminPassword) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Verify admin permissions and password
    const adminToken = req.headers.authorization;
    const adminUserId = await validateToken(adminToken);

    if (adminUserId === false) {
      return res.sendStatus(401);
    }

    const adminPerms = await getPermissions(adminToken);
    if (adminPerms !== "admin") {
      return res.sendStatus(403);
    }

    // Get admin user data to verify password
    const adminData = await conn.query("SELECT * FROM users WHERE id = ?", [
      adminUserId,
    ]);
    if (adminData.length === 0) {
      return res.status(401).json({ error: "Admin user not found" });
    }

    // Verify admin password
    const isPasswordValid = await bcrypt.compare(
      adminPassword,
      adminData[0].password_hash,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    // Check if target user exists
    const targetUser = await conn.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (targetUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await conn.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      newPasswordHash,
      userId,
    ]);

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

app.post("/admin/changeUsername", async (req, res) => {
  if (!req.headers.authorization) {
    return res.sendStatus(401);
  }

  const { userId, newUsername, adminPassword } = req.body;

  if (!userId || !newUsername || !adminPassword) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (newUsername.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters long" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Verify admin permissions and password
    const adminToken = req.headers.authorization;
    const adminUserId = await validateToken(adminToken);

    if (adminUserId === false) {
      return res.sendStatus(401);
    }

    const adminPerms = await getPermissions(adminToken);
    if (adminPerms !== "admin") {
      return res.sendStatus(403);
    }

    // Get admin user data to verify password
    const adminData = await conn.query("SELECT * FROM users WHERE id = ?", [
      adminUserId,
    ]);
    if (adminData.length === 0) {
      return res.status(401).json({ error: "Admin user not found" });
    }

    // Verify admin password
    const isPasswordValid = await bcrypt.compare(
      adminPassword,
      adminData[0].password_hash,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    // Check if target user exists
    const targetUser = await conn.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (targetUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if new username is already taken
    const existingUser = await conn.query("SELECT * FROM users WHERE username = ?", [newUsername]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Update username
    await conn.query("UPDATE users SET username = ? WHERE id = ?", [
      newUsername,
      userId,
    ]);

    return res.status(200).json({ message: "Username changed successfully" });
  } catch (error) {
    console.error("Error changing username:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

app.post("/admin/changeQuota", async (req, res) => {
  if (!req.headers.authorization) {
    return res.sendStatus(401);
  }

  const { userId, newQuota, adminPassword } = req.body;

  if (!userId || newQuota === undefined || !adminPassword) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate quota (must be a non-negative number, 0 means unlimited)
  const quotaNum = parseInt(newQuota);
  if (isNaN(quotaNum) || quotaNum < 0) {
    return res.status(400).json({ error: "Quota must be a non-negative number (0 for unlimited)" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Verify admin permissions and password
    const adminToken = req.headers.authorization;
    const adminUserId = await validateToken(adminToken);

    if (adminUserId === false) {
      return res.sendStatus(401);
    }

    const adminPerms = await getPermissions(adminToken);
    if (adminPerms !== "admin") {
      return res.sendStatus(403);
    }

    // Get admin user data to verify password
    const adminData = await conn.query("SELECT * FROM users WHERE id = ?", [
      adminUserId,
    ]);
    if (adminData.length === 0) {
      return res.status(401).json({ error: "Admin user not found" });
    }

    // Verify admin password
    const isPasswordValid = await bcrypt.compare(
      adminPassword,
      adminData[0].password_hash,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    // Check if target user exists
    const targetUser = await conn.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (targetUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user quota
    await conn.query("UPDATE users SET quota_in_bytes = ? WHERE id = ?", [
      quotaNum,
      userId,
    ]);

    return res.status(200).json({ message: "Quota changed successfully" });
  } catch (error) {
    console.error("Error changing quota:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

app.post("/admin/changeAdminStatus", async (req, res) => {
  // Set proper content type for JSON responses
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  
  if (!req.headers.authorization) {
    return res.status(401).json({ error: "Authorization required" });
  }

  const { userId, isAdmin, adminPassword } = req.body;

  if (!userId || isAdmin === undefined || !adminPassword) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Verify admin permissions and password
    const adminToken = req.headers.authorization;
    const adminUserId = await validateToken(adminToken);

    if (adminUserId === false) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const adminPerms = await getPermissions(adminToken);
    if (adminPerms !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Get admin user data to verify password
    const adminData = await conn.query("SELECT * FROM users WHERE id = ?", [
      adminUserId,
    ]);
    if (adminData.length === 0) {
      return res.status(401).json({ error: "Admin user not found" });
    }

    // Verify admin password
    const isPasswordValid = await bcrypt.compare(
      adminPassword,
      adminData[0].password_hash,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    // Check if target user exists
    const targetUser = await conn.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (targetUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent admin from changing their own admin status
    if (userId === adminUserId.toString()) {
      return res.status(400).json({ error: "Cannot change your own admin status" });
    }

    // If trying to remove admin status, check if this would leave zero admins
    if (!isAdmin && targetUser[0].is_admin === 1) {
      const adminCount = await countAdmins();
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Cannot remove admin status: there must be at least one admin on the server" });
      }
    }

    // Update user admin status
    await conn.query("UPDATE users SET is_admin = ? WHERE id = ?", [
      isAdmin ? 1 : 0,
      userId,
    ]);

    const action = isAdmin ? "promoted to admin" : "demoted to user";
    return res.status(200).json({ message: `User ${action} successfully` });
  } catch (error) {
    console.error("Error changing admin status:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "./public/admin.html"));
});

app.get("/database", (req, res) => {
  res.sendFile(path.join(__dirname, "./public/database.html"));
});

app.use("/", (req, res, next) => {
  if (req.method === "GET") {
    res.sendFile(path.join(__dirname, "./public/index.html"));
  } else {
    next();
  }
});

app.post("/admin/updateCell", async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  
  if (!req.headers.authorization) {
    return res.status(401).json({ error: "Authorization required" });
  }
  
  let perms = await getPermissions(req.headers.authorization);
  if (perms === "none") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (perms === "user") {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  if (perms === "admin") {
    try {
      const { table, rowIndex, cellIndex, value } = req.body;
      
      if (!table || rowIndex === undefined || cellIndex === undefined) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      const conn = await pool.getConnection();
      
      // Get column names
      const columns = await conn.execute(`DESCRIBE ${table}`);
      const columnNames = columns.map(col => col.Field);
      
      if (cellIndex >= columnNames.length) {
        conn.release();
        return res.status(400).json({ error: "Invalid cell index" });
      }
      
      const columnName = columnNames[cellIndex];
      
      // Get primary key to identify the row
      const primaryKeyInfo = await conn.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY'
      `, [table]);
      
      let whereClause;
      if (primaryKeyInfo.length > 0) {
        // Use primary key
        const primaryKey = primaryKeyInfo[0].COLUMN_NAME;
        const rowData = await conn.execute(`SELECT ${primaryKey} FROM ${table} LIMIT 1 OFFSET ?`, [rowIndex]);
        if (rowData.length === 0) {
          conn.release();
          return res.status(404).json({ error: "Row not found" });
        }
        whereClause = `${primaryKey} = ${conn.escape(rowData[0][primaryKey])}`;
      } else {
        // Fallback to LIMIT/OFFSET (not ideal but works for simple cases)
        whereClause = `1 LIMIT 1 OFFSET ${rowIndex}`;
      }
      
      // Update the cell
      const updateQuery = `UPDATE ${table} SET ${columnName} = ${value === null ? 'NULL' : conn.escape(value)} WHERE ${whereClause}`;
      await conn.execute(updateQuery);
      
      conn.release();
      return res.status(200).json({ message: "Cell updated successfully" });
    } catch (error) {
      console.error("Error updating cell:", error);
      return res.status(500).json({ error: "Failed to update cell" });
    }
  }
});

app.post("/admin/insertRow", async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  
  if (!req.headers.authorization) {
    return res.status(401).json({ error: "Authorization required" });
  }
  
  let perms = await getPermissions(req.headers.authorization);
  if (perms === "none") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (perms === "user") {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  if (perms === "admin") {
    try {
      const { table, values } = req.body;
      
      if (!table || !values) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      const conn = await pool.getConnection();
      
      // Get column names and types
      const columns = await conn.execute(`DESCRIBE ${table}`);
      
      // Build INSERT query
      const columnNames = Object.keys(values);
      const columnValues = Object.values(values);
      
      const placeholders = columnValues.map(() => '?').join(', ');
      const query = `INSERT INTO ${table} (${columnNames.join(', ')}) VALUES (${placeholders})`;
      
      await conn.execute(query, columnValues);
      conn.release();
      
      return res.status(200).json({ message: "Row inserted successfully" });
    } catch (error) {
      console.error("Error inserting row:", error);
      return res.status(500).json({ error: "Failed to insert row" });
    }
  }
});

app.post("/admin/deleteRow", async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  
  if (!req.headers.authorization) {
    return res.status(401).json({ error: "Authorization required" });
  }
  
  let perms = await getPermissions(req.headers.authorization);
  if (perms === "none") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (perms === "user") {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  if (perms === "admin") {
    try {
      const { table, rowIndex, adminPassword } = req.body;
      
      if (!table || rowIndex === undefined || !adminPassword) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      // Verify admin password
      const adminUserId = jwt.decode(req.headers.authorization).userId;
      const [adminData] = await pool.query("SELECT password_hash FROM users WHERE id = ?", [adminUserId]);
      if (adminData.length === 0) {
        return res.status(401).json({ error: "Admin user not found" });
      }
      
      const isPasswordValid = await bcrypt.compare(adminPassword, adminData[0].password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid admin password" });
      }
      
      const conn = await pool.getConnection();
      
      // Get primary key to identify the row
      const primaryKeyInfo = await conn.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY'
      `, [table]);
      
      let whereClause;
      if (primaryKeyInfo.length > 0) {
        // Use primary key
        const primaryKey = primaryKeyInfo[0].COLUMN_NAME;
        const rowData = await conn.execute(`SELECT ${primaryKey} FROM ${table} LIMIT 1 OFFSET ?`, [rowIndex]);
        if (rowData.length === 0) {
          conn.release();
          return res.status(404).json({ error: "Row not found" });
        }
        whereClause = `${primaryKey} = ${conn.escape(rowData[0][primaryKey])}`;
      } else {
        // Fallback to LIMIT/OFFSET
        whereClause = `1 LIMIT 1 OFFSET ${rowIndex}`;
      }
      
      // Delete the row
      const deleteQuery = `DELETE FROM ${table} WHERE ${whereClause}`;
      await conn.execute(deleteQuery);
      
      conn.release();
      return res.status(200).json({ message: "Row deleted successfully" });
    } catch (error) {
      console.error("Error deleting row:", error);
      return res.status(500).json({ error: "Failed to delete row" });
    }
  }
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
