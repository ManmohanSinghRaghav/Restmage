# Restmage - Real Estate Map Generator

A full-stack web application for real estate planning, visualization, and cost estimation. Built with React, Node.js, Express, and MongoDB.

## Features

- 🏠 **Property Management**: Create and manage real estate projects with detailed property information
- 🗺️ **Interactive Maps**: Generate interactive maps and floorplans using Leaflet.js
- 💰 **Cost Estimation**: Automated cost calculation with material pricing and labor estimates
- 🔄 **Real-time Collaboration**: Live updates using WebSockets for multi-user editing
- 🔐 **Authentication**: Secure user authentication with JWT tokens
- 📄 **Export Options**: Export projects to PDF, CSV, and JSON formats
- 📱 **Responsive Design**: Mobile-friendly interface using Material-UI

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Material-UI (MUI)** for UI components
- **Leaflet.js** for interactive maps
- **Socket.IO Client** for real-time updates
- **Axios** for API communication

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for WebSocket connections
- **JWT** for authentication
- **Puppeteer** for PDF generation
- **Bcrypt** for password hashing

## Quick Start

### Prerequisites
- Node.js (v18 or higher recommended; minimum v16.20.1)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ManmohanSinghRaghav/Restmage.git
   cd Restmage
   ```

2. **Install dependencies**
   ```bash
   npm run install
   ```

3. **Environment Setup**
   
   **Server Configuration** (`server/.env`):
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@restmage.xxxxxx.mongodb.net/restmage?retryWrites=true&w=majority&appName=restmage
   MONGODB_PING_DB=admin
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   CLIENT_URL=http://localhost:3000
   ```

   > ℹ️ Replace `<username>` and `<password>` with your MongoDB Atlas credentials. Keep this file out of version control—use the provided `server/.env.example` as a template and store real secrets only in your local `.env`.

   **Client Configuration** (`client/.env`):
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SERVER_URL=http://localhost:5000
   ```

4. **Start the development servers**
   ```bash
   # Start both client and server concurrently
   npm run dev
   
   # OR start them separately:
   npm run server  # Backend on port 5000
   npm run client  # Frontend on port 3000
   ```

   The backend must be able to reach the MongoDB cluster defined in `MONGODB_URI`. If you're using MongoDB Atlas, allow your IP address in the Atlas Network Access settings or use a trusted VPN.

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - API Health Check: http://localhost:5000/api/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Projects
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Cost Estimation
- `GET /api/cost/materials` - Get material prices
- `POST /api/cost/:projectId/calculate` - Calculate project costs
- `GET /api/cost/:projectId` - Get cost estimation

### Maps
- `GET /api/maps/:projectId` - Get map data
- `POST /api/maps/:projectId/layers` - Add map layer
- `DELETE /api/maps/:projectId/layers/:layerId` - Delete layer

### Export
- `GET /api/export/:projectId/csv` - Export to CSV
- `GET /api/export/:projectId/pdf` - Export to PDF
- `GET /api/export/:projectId/json` - Export to JSON

## Project Structure

```
Restmage/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts for state management
│   │   ├── services/       # API service functions
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   └── package.json
├── server/                 # Node.js backend application
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── tests/            # Test files
│   ├── utils/            # Utility functions
│   └── server.js         # Main server file
├── package.json          # Root package.json
└── README.md
```

## Development

### Running Tests
```bash
# Run server tests
npm run test:server

# Run client tests
npm run test:client

# Run all tests
npm test
```

### Building for Production
```bash
# Build the React app
npm run build

# Start production server
npm start
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Input validation and sanitization
- Helmet.js security headers

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please open an issue on GitHub or contact the development team.

---

Built with ❤️ by Aman Kushwah