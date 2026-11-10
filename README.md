# SimpleShare

![Homepage](images/Homepage.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://www.typescriptlang.org)

SimpleShare is a modern web application that allows users to upload and share files easily. This project provides a simple and intuitive interface for file sharing with a clean, Vue.js 3 frontend and robust Node.js/TypeScript backend.

## Features

- **User-friendly interface** built with Vue.js 3 and Composition API
- **File upload functionality** with progress tracking and drag-and-drop support
- **User authentication and registration** system with secure session management
- **Dashboard for managing uploaded files** with intuitive UI
- **Responsive design** with Tailwind CSS and custom animations
- **Admin panel** for comprehensive user management
- **File sharing via unique codes** for secure access
- **Group file uploads** with batch operations
- **Real-time notifications** and user feedback
- **Quota management system** for storage control
- **Mobile-responsive design** optimized for all devices
- **Database migration system** for easy schema updates
- **Modern confirmation modal system** replacing browser alerts
- **Update screen** for maintenance mode during server updates
- **TypeScript support** throughout the codebase for better maintainability

## Technology Stack

- **Frontend**: Vue.js 3 (Composition API), Vue Router, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MariaDB with automated migration system
- **Authentication**: bcrypt for password hashing, secure session tokens
- **File Handling**: Multer for multipart uploads, Archiver for zip operations
- **Development Tools**: Concurrently, Nodemon, Prettier, TypeScript compiler
- **Styling**: Tailwind CSS v4 with custom animations and responsive design

## Interface Preview

The application features a clean, modern interface with intuitive navigation:

### Homepage
![Homepage](images/Homepage.png)

### Files Menu
![Files Menu](images/Files-menu.png)

### Links Menu
![Links Menu](images/Links-menu.png)

### Stats Menu
![Stats Menu](images/Stats-menu.png)

### Storage Menu
![Storage Menu](images/Storage-menu.png)

### Users Menu (Admin)
![Users Menu](images/Users-menu.png)

## Project Structure

```
simpleShare/
├── backend/                 # Backend API server (TypeScript)
│   ├── src/
│   │   ├── adminActions.ts  # Admin operations and user management
│   │   ├── auth.ts          # Authentication and session logic
│   │   ├── routes.ts        # API route definitions
│   │   ├── server.ts        # Express server setup
│   │   ├── uploadActions.ts # File upload and management
│   │   ├── userActions.ts   # User operations
│   │   ├── db.ts            # Database connection
│   │   ├── migration-runner.ts # Database migration system
│   │   └── controllers/     # API controllers
│   ├── migrations/          # Database migration files
│   └── tsconfig.json        # TypeScript configuration
├── client/                  # Frontend Vue.js application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable Vue components
│   │   │   ├── UpdateScreen.vue    # Maintenance/update screen
│   │   │   ├── Notification.vue    # Notification system
│   │   │   └── ConfirmModal.vue    # Confirmation modal
│   │   ├── composables/     # Vue composables (useConfirm, useUpdateStatus, etc.)
│   │   ├── views/           # Page views and routing
│   │   ├── App.vue          # Root component with global modals
│   │   └── main.js          # Application entry point
│   ├── index.html           # HTML template
│   ├── tailwind.config.js   # Tailwind configuration
│   └── vite.config.js       # Vite build configuration
├── uploads/                 # File storage directory
├── dist/                    # Compiled TypeScript output
├── .env.example             # Environment variables template
├── .gitignore              # Git ignore rules
├── MIGRATIONS.md           # Database migration documentation
├── Alert-box.md            # Confirmation modal system documentation
├── LICENSE                 # MIT License
├── README.md               # This file
└── package.json            # Dependencies and npm scripts
```

## Installation

### Method 1 - Manual Install (Recommended)

#### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MariaDB database server

#### Setup Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/cigoria/simpleShare.git
   cd simpleShare
   ```

2. **Install the dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` for your setup:
   ```
   DATABASE_URL="mysql://username:password@localhost:3306/mydb"
   DATABASE_USER="username"
   DATABASE_PASSWORD="password"
   DATABASE_NAME="mydb"
   DATABASE_HOST="localhost"
   DATABASE_PORT=3306

   PORT=3000
   UPLOAD_PATH=./uploads/

   DEFAULT_ADMIN_USERNAME=admin
   DEFAULT_ADMIN_PASSWORD=admin
   DEFAULT_ADMIN_QUOTA=10737418240
   ```

4. **Database Setup:**

   Create an empty database named `simpleShare` in MariaDB. The migration system will automatically create all necessary tables when you start the server.

5. **Build the application:**

   ```bash
   npm run build
   ```

6. **Start the production server:**

   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`

### Method 2 - Docker (Recommended for Production)

**Available Docker Images:**

- `ghcr.io/cigoria/simpleshare:latest`
- `registry.gitlab.com/cigoria/simpleshare:latest`

1. **docker-compose.yaml**

```yaml
---
services:
  db:
    image: mariadb:latest
    container_name: simpleShare_db
    restart: unless-stopped
    environment:
      MYSQL_USER: ${DBUSER}
      MYSQL_PASSWORD: ${DBPASS}
      MYSQL_DATABASE: ${DB}
      MYSQL_ROOT_PASSWORD: ${DBRPASS}
    volumes:
      - ${DBDATA}:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 5s
      timeout: 5s
      retries: 10

  simpleShare:
    image: registry.gitlab.com/cigoria/simpleshare:latest
    # image: ghcr.io/cigoria/simpleshare:latest
    container_name: simpleShare
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: mysql://${DBUSER}:${DBPASS}@${DBHOST}:${DBPORT}/${DB}
      DATABASE_USER: ${DBUSER}
      DATABASE_PASSWORD: ${DBPASS}
      DATABASE_NAME: ${DB}
      DATABASE_HOST: ${DBHOST}
      DATABASE_PORT: ${DBPORT}
      PORT: ${PORT}
      UPLOAD_PATH: ${UPLOAD}
      DEFAULT_ADMIN_USERNAME: ${DEFUSER}
      DEFAULT_ADMIN_PASSWORD: ${PASS}
      DEFAULT_ADMIN_QUOTA: ${QUOTA}
    ports:
      - 3000:3000

```

2. **Folder structure**

```bash
mkdir DB
touch .env
```

3. **Edit `.env` for your setup:**
```
DB=simpleshare
DBDATA=/Docker/simpleShare/DB/
DBHOST=db
DBPORT=3306
DBRPASS=simpleshare
DBUSER=simpleshare
DBPASS=simpleshare
PASS=admin
PORT=3000
QUOTA=10737418240
UPLOAD=./uploads/
DEFUSER=admin
```

4. **Start container**

```bash
docker compose up -d
```

5. **Open browser at:** [http://localhost:3000](http://localhost:3000)

## Development

### Development Mode with Hot Reload

For development with hot reload on both frontend and backend:

```bash
npm run dev
```

This command uses `concurrently` to run both frontend and backend development servers simultaneously.

### Individual Development Servers

If you prefer to run servers separately:

1. **Start the backend server with auto-reload:**

   ```bash
   npm run dev:backend
   ```

2. **In another terminal, start the frontend dev server:**

   ```bash
   npm run dev:frontend
   ```

### Development URLs

- **Frontend**: `http://localhost:5173` (Vite dev server)
- **Backend API**: `http://localhost:3000` (Express server)

### Available Scripts

- `npm run dev` - Run both frontend and backend in development mode
- `npm run dev:backend` - Run only backend with TypeScript compilation and auto-reload
- `npm run dev:frontend` - Run only frontend with Vite hot reload
- `npm run build` - Build both frontend and backend for production
- `npm run build:backend` - Compile TypeScript backend to `dist/`
- `npm run build:frontend` - Build Vue.js frontend for production
- `npm start` - Start production server from compiled files
- `npm run clean` - Remove compiled `dist/` directory
- `npm run update:start` - Show maintenance screen during updates
- `npm run update:stop` - Hide maintenance screen after updates

### Code Quality

The codebase follows these quality standards:

- **TypeScript**: Full type safety in backend, progressive adoption in frontend
- **Code Style**: Prettier configuration for consistent formatting
- **Vue.js Best Practices**: Composition API, proper component structure
- **Documentation**: Inline comments for complex logic, comprehensive README
- **Error Handling**: Modern confirmation modals instead of browser alerts

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | User login with email/password |
| POST | `/register` | User registration with validation |
| GET | `/logout` | User logout and session cleanup |
| GET | `/verifySession` | Verify active session token |

### File Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload single file with metadata |
| POST | `/upload-group` | Upload multiple files as a group |
| GET | `/files/:code` | Download file by unique code |
| GET | `/checkFile` | Check if file exists by code |
| GET | `/delete/:code` | Delete file by code (owner/admin only) |
| GET | `/getAllFiles` | Get all files for current user |
| GET | `/quota` | Get user quota and usage information |

### Admin Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List all users (admin only) |
| POST | `/admin/user/:id/ban` | Ban/unban user (admin only) |
| POST | `/admin/user/:id/quota` | Update user quota (admin only) |

### Update Status Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/update-status` | Get current update status |
| POST | `/api/update-status` | Set update status (maintenance mode) |

## Key Systems

### Database Migration System

The project uses an automated migration system for database schema management:

- **Migration files**: Located in `/backend/migrations/` with numeric prefixes
- **Automatic execution**: Migrations run automatically on server startup
- **Version tracking**: Applied migrations are tracked in the `migrations` table
- **Safe rollback**: Failed migrations are automatically rolled back

For detailed information, see [MIGRATIONS.md](MIGRATIONS.md).

### Confirmation Modal System

Modern confirmation dialogs replace browser alerts throughout the application:

- **Reusable components**: `ConfirmModal.vue` with `useConfirm` composable
- **Multiple types**: Info, warning, error, success dialogs
- **Customizable**: Custom buttons, icons, and messages
- **Accessible**: Keyboard navigation and proper focus management
- **Animated**: Smooth transitions and backdrop effects

For usage examples and documentation, see [Alert-box.md](Alert-box.md).

### Update Screen System

The application includes a maintenance screen that appears during server updates:

- **Automatic display**: Shows when server is in update mode
- **Real-time polling**: Frontend checks update status every 5 seconds
- **Clean UI**: Modern loading animation with informative messages
- **Easy control**: Simple npm scripts to toggle maintenance mode

**Usage:**

```bash
# Show maintenance screen
npm run update:start

# Hide maintenance screen
npm run update:stop
```

**Components:**

- `UpdateScreen.vue` - Maintenance screen component
- `useUpdateStatus.js` - Composable for status polling
- `updateStatus.ts` - Backend controller for status management

### Authentication & Security

- **Secure password hashing** using bcrypt
- **Session-based authentication** with secure tokens
- **Role-based access control** for admin features
- **File access control** via unique codes and ownership verification

## Contributing

We welcome contributions from the community! Here's how to get started:

### Development Workflow

1. **Fork the repository** on GitHub
2. **Create a feature branch** from the main branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** following our code standards
4. **Test your changes** thoroughly:
   - Run `npm run dev` to test in development mode
   - Test both frontend and backend functionality
   - Ensure database migrations work if you've modified the schema
5. **Format your code** using Prettier:

   ```bash
   npm run format
   ```

6. **Commit your changes** with clear, descriptive messages
7. **Push to your fork** and create a pull request

### Code Standards

- **TypeScript**: Use proper types in backend, consider types in frontend
- **Vue.js**: Use Composition API, follow component best practices
- **CSS**: Use Tailwind CSS classes, avoid inline styles
- **Comments**: Write clear comments in English for complex logic
- **Confirmation dialogs**: Use the `useConfirm` composable instead of browser alerts
- **Database changes**: Create migration files for any schema modifications

### Areas for Contribution

- **Frontend**: UI improvements, new components, accessibility enhancements
- **Backend**: API optimizations, new features, security improvements
- **Documentation**: Better documentation, examples, guides
- **Testing**: Unit tests, integration tests, end-to-end tests
- **Performance**: Optimization, caching, database improvements

### Pull Request Guidelines

- Provide a clear description of changes
- Reference any related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Keep PRs focused on a single feature or fix

## Getting Help

### Documentation

- **[MIGRATIONS.md](MIGRATIONS.md)** - Database migration system documentation
- **[Alert-box.md](Alert-box.md)** - Confirmation modal system guide
- **API Endpoints** - Listed above with descriptions
- **Project Structure** - Detailed directory overview

### Troubleshooting

**Common Issues:**

| Issue | Solution |
|-------|----------|
| **Database Connection Errors** | Ensure MariaDB is running, check `.env` configuration, verify database exists |
| **Migration Failures** | Check database permissions, ensure correct migration file naming, review SQL syntax |
| **Build Errors** | Run `npm install`, clear `dist/` with `npm run clean`, check Node.js version (v16+) |
| **File Upload Issues** | Ensure `uploads/` directory exists and is writable, check file size limits, verify disk space |

### Support

For questions, bug reports, or feature requests:

- [Create an issue on GitHub](https://github.com/cigoria/simpleShare/issues)
- [Check existing issues](https://github.com/cigoria/simpleShare/issues)
- Review documentation before asking questions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Contributors**: Thanks to all developers who have contributed to this project
- **Technologies**: Built with modern web technologies for optimal performance
- **Community**: Special thanks to our users for feedback and suggestions

## Project Creators

- **[zeti1223](https://github.com/zeti1223)** - Frontend development and UI/UX design
- **[FonixPython](https://github.com/FonixPython)** - Backend development
