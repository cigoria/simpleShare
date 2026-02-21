import { isEmptyBindingElement, PollingWatchKind } from "typescript";
const mariadb = require("mariadb");
require("dotenv").config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "simpleShare",
  connectionLimit: 5,
  charset: "utf8mb4",
});

export async function getTotalQuota(user_id:string | null): Promise<Number> {
  let conn;
  try {
    if (user_id === null) {return 1}
    conn = await pool.getConnection();
    let user_result = await conn.query("SELECT * FROM users WHERE id = ?", [user_id]);
    return user_result[0].quota_in_bytes;
  } finally {if (conn) {conn.release();}}
}

export async function getUsedQuota(user_id:string | null) {
  let conn;
  try {
    if (user_id === null) {return 1}
    conn = await pool.getConnection();
    let used_res = await conn.query("SELECT SUM(file_size_in_bytes) AS total_used FROM file_index WHERE user_id = ?",[user_id]);
    return used_res[0].total_used;
  } finally {if (conn) {conn.release();}}
}