# Local Environment Setup Tutorial

This tutorial will help you set up the simpleShare project in a local environment with MariaDB database.

## Prerequisites

### 1. Node.js Installation

Make sure Node.js is installed on your system:

```bash
node --version
npm --version
```

If not installed, download from the [official website](https://nodejs.org/).

### 2. MariaDB Installation

#### Linux (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install mariadb-server mariadb-client
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

#### Linux (Arch Linux):

```bash
sudo pacman -Syu mariadb
sudo systemctl enable mariadb
sudo systemctl start mariadb
sudo mysql_install_db --user=mysql --basedir=/usr --datadir=/var/lib/mysql
```

#### Linux (Fedora/CentOS):

```bash
sudo dnf install mariadb-server mariadb
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

#### macOS (Homebrew):

```bash
brew install mariadb
brew services start mariadb
```

#### Windows:

Download from the [MariaDB official website](https://mariadb.org/download/) and install using the Windows installer.

## Database Setup

### 1. MariaDB Security Configuration

```bash
sudo mysql_secure_installation
```

Follow the instructions:

- Set root password
- Remove anonymous users
- Disable remote root access
- Remove test database

### 2. Database Creation

Log in to MariaDB:

```bash
sudo mysql -u root -p
```

Create the database and user:

```sql
CREATE DATABASE simpleShare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'simpleshare_user'@'localhost' IDENTIFIED BY 'strong_password123';
GRANT ALL PRIVILEGES ON simpleShare.* TO 'simpleshare_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Table Creation

Connect to the database:

```bash
mysql -u simpleshare_user -p simpleShare
```

Run the following SQL commands:

```sql
-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    quota_in_bytes BIGINT DEFAULT 52428800,
    date_of_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session tokens table
CREATE TABLE session_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- File index table
CREATE TABLE file_index (
    id VARCHAR(6) PRIMARY KEY,
    mime_type VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size_in_bytes BIGINT NOT NULL,
    user_id INT NOT NULL,
    visibility BOOLEAN DEFAULT TRUE,
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_file_index_user_id ON file_index(user_id);
CREATE INDEX idx_session_tokens_token ON session_tokens(token);
CREATE INDEX idx_session_tokens_user_id ON session_tokens(user_id);
```

## Project Setup

### 1. Clone and Install Project

```bash
git clone https://github.com/cigoria/simpleShare.git
cd simpleShare
npm install
```

### 2. Environment Variables Setup

Copy the example .env file:

```bash
cp src/.env.example src/.env
```

Edit the `src/.env` file with your local settings:

```env
# Database connection
DB_HOST=localhost
DB_PORT=3306
DB_USER=simpleshare_user
DB_PASSWORD=strong_password123

# Server settings
PORT=3000

# File upload path
UPLOAD_PATH=./uploads/
```

### 3. Create Upload Directory

```bash
mkdir -p uploads
chmod 755 uploads
```

## Default Admin User Creation

Run the following command to create the admin user:

```bash
node create_admin.js
```

**Important:** The script creates an `admin` user with `admin123` password. Change the default password immediately after first login!

## Server Startup

### 1. Development Mode

```bash
node src/server.js
```

### 2. With Auto-restart (for development)

Install nodemon:

```bash
npm install -g nodemon
nodemon src/server.js
```

## Verification

### 1. Access Server

Open in your browser:

- `http://localhost:3000` - Main page
- `http://localhost:3000/admin` - Admin interface

### 2. Login

Use the admin credentials:

- Username: `admin`
- Password: `admin123`

### 3. Test Functions

- **File upload:** Try uploading a file
- **File download:** Use the provided code to download the file
- **Admin interface:** Manage users and files

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution:** Check if MariaDB is running:

```bash
sudo systemctl status mariadb
sudo systemctl start mariadb
```

#### 2. Access Error

```
Error: ER_ACCESS_DENIED_ERROR
```

**Solution:** Check database username and password in `.env` file.

#### 3. Database Not Found

```
Error: ER_BAD_DB_ERROR
```

**Solution:** Check if `simpleShare` database exists:

```bash
mysql -u root -p -e "SHOW DATABASES;"
```

#### 4. Port Already in Use

```
Error: listen EADDRINUSE :::3000
```

**Solution:** Change port in `.env` file or close the occupied port:

```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Log Checking

Server logs will show problems:

```bash
node src/server.js 2>&1 | tee server.log
```

## Security Recommendations

### 1. Passwords

- Change default admin password
- Use strong passwords for database users
- Don't store passwords in plain text

### 2. Database

- Limit database user permissions
- Use SSL for database connection (in production)
- Regular backups

### 3. Server

- Use HTTPS (behind reverse proxy)
- Configure firewall
- Regular dependency updates

## Development Tips

### 1. Environment Variables

Create different `.env` files for different environments:

- `.env.development`
- `.env.production`

### 2. Database Migrations

Use database migration scripts for schema changes.

### 3. Testing

Write unit tests for database functions.

## Summary

With this tutorial, you have successfully set up the simpleShare project in a local environment with MariaDB database. The system is now ready for development and testing.

If you encounter any problems, check the troubleshooting section or visit the project's GitHub issues page.
