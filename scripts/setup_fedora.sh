#!/bin/bash

# SimpleShare Setup Script for Fedora/CentOS/RHEL
# This script sets up the complete environment for simpleShare

set -e

echo "🚀 Setting up SimpleShare on Fedora/CentOS/RHEL..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons."
   echo "Please run as a regular user with sudo privileges."
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo dnf update -y

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    sudo dnf module install -y nodejs:18
else
    print_status "Node.js is already installed: $(node --version)"
fi

# Install MariaDB
print_status "Installing MariaDB..."
sudo dnf install -y mariadb-server mariadb

# Start and enable MariaDB
print_status "Starting MariaDB service..."
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Secure MariaDB installation
print_status "Securing MariaDB installation..."
print_warning "You will be prompted to set up MariaDB security settings."
sudo mysql_secure_installation

# Get database credentials
echo ""
print_status "Setting up database credentials..."
read -p "Enter database password for simpleshare_user: " DB_PASSWORD
if [[ -z "$DB_PASSWORD" ]]; then
    DB_PASSWORD="simpleshare123"
    print_warning "Using default password: $DB_PASSWORD"
fi

# Create database and user
print_status "Creating database and user..."
sudo mysql -u root -p <<EOF
CREATE DATABASE IF NOT EXISTS simpleShare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'simpleshare_user'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON simpleShare.* TO 'simpleshare_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Create tables
print_status "Creating database tables..."
mysql -u simpleshare_user -p$DB_PASSWORD simpleShare <<'EOF'
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    quota_in_bytes BIGINT DEFAULT 52428800,
    date_of_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session tokens table
CREATE TABLE IF NOT EXISTS session_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- File index table
CREATE TABLE IF NOT EXISTS file_index (
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
CREATE INDEX IF NOT EXISTS idx_file_index_user_id ON file_index(user_id);
CREATE INDEX IF NOT EXISTS idx_session_tokens_token ON session_tokens(token);
CREATE INDEX IF NOT EXISTS idx_session_tokens_user_id ON session_tokens(user_id);
EOF

# Clone or update project
if [ ! -d "simpleShare" ]; then
    print_status "Cloning simpleShare repository..."
    git clone https://github.com/cigoria/simpleShare.git
    cd simpleShare
else
    print_status "Updating existing simpleShare repository..."
    cd simpleShare
    git pull
fi

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install

# Create .env file
print_status "Creating environment configuration..."
cat > src/.env <<EOF
DB_HOST=localhost
DB_PORT=3306
DB_USER=simpleshare_user
DB_PASSWORD=$DB_PASSWORD
PORT=3000
UPLOAD_PATH=./uploads/
EOF

# Create uploads directory
print_status "Creating uploads directory..."
mkdir -p uploads
chmod 755 uploads

# Create admin user
print_status "Creating admin user..."
node create_admin.js

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
print_status "✅ Setup completed successfully!"
echo ""
echo "📋 Summary:"
echo "   • Database: simpleShare"
echo "   • Database User: simpleshare_user"
echo "   • Admin Username: admin"
echo "   • Admin Password: admin123 (CHANGE THIS!)"
echo ""
echo "🚀 To start the server:"
echo "   cd simpleShare"
echo "   node src/server.js"
echo ""
echo "🌐 Access the application:"
echo "   • Local: http://localhost:3000"
echo "   • Network: http://$SERVER_IP:3000"
echo "   • Admin: http://localhost:3000/admin"
echo ""
print_warning "IMPORTANT: Change the default admin password immediately!"
