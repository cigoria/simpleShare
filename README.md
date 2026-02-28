# SimpleShare

SimpleShare is a web application that allows users to upload and share files easily. This project is designed to provide a simple and intuitive interface for file sharing with a clean, modern frontend and robust backend.

## Features

- User-friendly interface built with Vue.js 3
- File upload functionality with progress tracking and drag-and-drop support
- User authentication and registration system
- Dashboard for managing uploaded files
- Responsive design with Tailwind CSS
- Admin panel for user management
- File sharing via unique codes
- Group file uploads
- Real-time notifications
- Quota management system
- Mobile-responsive design

## Technology Stack

- **Frontend**: Vue.js 3, Vue Router, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MariaDB
- **Authentication**: bcrypt
- **File Handling**: Multer
- **Styling**: Tailwind CSS with custom animations

## Project Structure

```
simpleShare/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── adminActions.ts  # Admin operations
│   │   ├── auth.ts          # Authentication logic
│   │   ├── routes.ts        # API routes
│   │   └── ...              # Other backend files
│   └── tsconfig.json        # TypeScript configuration
├── client/                  # Frontend Vue.js application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Vue components
│   │   ├── composables/     # Vue composables
│   │   ├── views/           # Page views
│   │   ├── App.vue          # Root component
│   │   └── main.js          # Application entry point
│   ├── index.html           # HTML template
│   ├── tailwind.config.js   # Tailwind configuration
│   └── vite.config.js       # Vite configuration
├── .env.example             # Environment variables template
├── .gitignore              # Git ignore rules
├── LICENSE                 # MIT License
├── README.md               # This file
└── package.json            # Dependencies and scripts
```

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/cigoria/simpleShare.git
   cd simpleShare
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Copy environment file:

   ```bash
   cp .env.example .env
   ```

4. Configure your database settings in `.env`

5. Build the frontend:

   ```bash
   npm run build
   ```

6. Start the server:

   ```bash
   npm start
   ```

## Development

For development with hot reload:

1. Start the backend server:
   ```bash
   npm start
   ```

2. In another terminal, start the frontend dev server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:3000`.

## Code Quality

The frontend codebase has been optimized for maintainability:
- All comments are in English
- Unnecessary comments have been removed
- Helpful comments explain complex logic
- Code follows Vue.js best practices
- Components are well-structured and reusable

## API Endpoints

### Authentication
- `POST /login` - User login
- `POST /register` - User registration
- `GET /logout` - User logout
- `GET /verifySession` - Verify session token

### File Operations
- `POST /upload` - Upload single file
- `POST /upload-group` - Upload multiple files as group
- `GET /files/:code` - Download file
- `GET /checkFile` - Check if file exists
- `GET /delete/:code` - Delete file
- `GET /getAllFiles` - Get all user files
- `GET /quota` - Get user quota information

### Admin Operations
- Various admin endpoints for user management

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

Please ensure your code follows the existing style and conventions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors and users for their support!
- Built with modern web technologies for optimal performance

## Creators

- [zeti1223](https://github.com/zeti1223)
- [FonixPython](https://github.com/FonixPython)
