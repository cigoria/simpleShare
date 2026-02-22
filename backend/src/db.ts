const mariadb = require("mariadb");
require("dotenv").config();

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    connectionLimit: 12,
    charset: "utf8mb4",
});

// Create database structure!
const file_groups:string = `CREATE TABLE \`file_groups\` (
  \`id\` varchar(255) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`file_ids\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(\`file_ids\`)),
  \`user_id\` varchar(255) NOT NULL,
  \`created_at\` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`user_id\` (\`user_id\`),
  CONSTRAINT \`1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci`

const file_index:string = `CREATE TABLE \`file_index\` (
  \`id\` varchar(6) NOT NULL,
  \`visibility\` int(11) NOT NULL DEFAULT 1,
  \`date_added\` timestamp NULL DEFAULT curtime(),
  \`file_size_in_bytes\` int(11) DEFAULT NULL,
  \`stored_filename\` text NOT NULL,
  \`original_name\` text NOT NULL,
  \`mime_type\` text NOT NULL,
  \`user_id\` text NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci`

const session_tokens:string = `CREATE TABLE \`session_tokens\` (
  \`token\` varchar(200) NOT NULL,
  \`user_id\` text NOT NULL,
  \`is_valid\` tinyint(1) DEFAULT 1,
  \`user_agent\` text DEFAULT NULL,
  \`added_on\` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`token\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci`

const settings:string = `CREATE TABLE \`settings\` (
  \`name\` text NOT NULL,
  \`num_value\` bigint(20) DEFAULT NULL,
  \`text_value\` text DEFAULT NULL,
  \`comment\` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci`

const users:string = `CREATE TABLE \`users\` (
  \`id\` varchar(255) NOT NULL DEFAULT uuid(),
  \`username\` varchar(255) NOT NULL,
  \`password_hash\` text NOT NULL,
  \`quota_in_bytes\` bigint(20) NOT NULL DEFAULT 500000000,
  \`is_admin\` tinyint(1) NOT NULL DEFAULT 0,
  \`date_of_creation\` timestamp NOT NULL DEFAULT curtime(),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`username\` (\`username\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci`

pool.query(file_groups)
pool.query(file_index)
pool.query(session_tokens)
pool.query(settings)
pool.query(users)

module.exports = pool;