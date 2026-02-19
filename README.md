# SimpleShare

SimpleShare is a web application that allows users to upload and share files easily. This project is designed to provide a simple and intuitive interface for file sharing.

## Features

- User-friendly interface built with Vue.js 3
- File upload functionality with progress tracking
- User authentication and registration
- Dashboard for managing uploaded files
- Responsive design with Tailwind CSS
- Admin panel for user management
- File sharing via unique codes

## Technology Stack

- **Frontend**: Vue.js 3, Vue Router, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MariaDB
- **Build Tool**: Vite
- **Authentication**: bcrypt

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
   cp src/.env.example src/.env
   ```

4. Configure your database settings in `src/.env`

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

## Folder Structure

```
└── 📁public
   ├── favicon.ico
└── 📁src
   └── 📁assets
   └── 📁components
      └── 📁admin
   └── 📁composables
   └── 📁router
   └── 📁views
      └── 📁admin
└── 📁uploads
```

## Contributing

Contributions are welcome! Please submit a pull request or open an issue to discuss changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors and users for their support!

## Creators

- [zeti1223](https://github.com/zeti1223)
- [FonixPython](https://github.com/FonixPython)
