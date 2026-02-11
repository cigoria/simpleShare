const mariadb = require("mariadb");
const bcrypt = require("bcrypt");
require("dotenv").config();

async function createAdminUser() {
  const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "simpleShare",
    connectionLimit: 5,
    charset: "utf8mb4",
  });

  let conn;
  try {
    conn = await pool.getConnection();

    const adminUsername = "admin";
    const adminPassword = "admin123"; // Change to a secure password!

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    await conn.query(
      "INSERT INTO users (username, password_hash, is_admin, quota_in_bytes) VALUES (?, ?, ?, ?)",
      [adminUsername, passwordHash, 1, 1073741824], // 1GB quota
    );

    console.log("✅ Admin user created successfully!");
    console.log(`📝 Username: ${adminUsername}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log("⚠️  Please change the default password immediately!");
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      console.log("⚠️  Admin user already exists!");
    } else {
      console.error("❌ Error occurred:", error);
    }
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

createAdminUser();
