# Restmage - Real Estate Map Generator

A full-stack web application for real estate planning, visualization, and cost estimation. Built with React, Node.js, Express, and MongoDB.

## Features

- 🏠 **Property Management**: Create and manage real estate projects with detailed property information
- 🗺️ **Interactive Maps**: Generate interactive maps and floorplans using Leaflet.js
- 🤖 **AI-Powered Floor Plans**: Generate floor plans using Google Gemini AI with automatic room placement
- ✏️ **Advanced Map Editor**: Drag-and-drop floor plan editor with rooms, walls, doors, and windows
- 💰 **Cost Estimation**: Automated cost calculation with material pricing and labor estimates
- � **Price Prediction**: ML-based property price prediction with detailed breakdowns
- 🤖 **AI Chatbot**: Interactive chatbot for real estate advice and queries
- �🔄 **Real-time Collaboration**: Live updates using WebSockets for multi-user editing
- 🔐 **Authentication**: Secure user authentication with JWT tokens
- 📄 **Export Options**: Export floor plans and pricing reports to PDF, PNG, CSV, and JSON formats
- 📱 **Responsive Design**: Mobile-friendly interface using Material-UI
- 🧪 **Automated Testing**: Comprehensive test suite with Jest and React Testing Library

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Material-UI (MUI) v7** for UI components
- **Leaflet.js** for interactive maps
- **Canvas API** for floor plan rendering
- **Socket.IO Client** for real-time updates
- **Axios** for API communication
- **jsPDF & html2canvas** for PDF/image export

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Google Gemini AI** for floor plan generation
- **Socket.IO** for WebSocket connections
- **JWT** for authentication
- **Winston** for logging and debugging
- **PDFKit** for server-side PDF generation
- **Bcrypt** for password hashing

## New Workflow

1. **Input Requirements** → Enter property dimensions and room preferences
2. **Choose Path** → Select either "Generate Floor Plan" or "Get Price Prediction"
3. **AI Generation** → Gemini AI generates optimized floor plan layout
4. **Interactive Editing** → Edit floor plan with drag-and-drop interface
5. **Export & Share** → Download as PNG, PDF, or get pricing estimates

See [MAPEDITOR_INTEGRATION.md](MAPEDITOR_INTEGRATION.md) for detailed integration guide.

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
   MONGODB_URI=mongodb://localhost:27017/restmage
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   CLIENT_URL=http://localhost:3000
   
   # Optional: For AI floor plan generation
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   > ℹ️ If you don't set `GEMINI_API_KEY`, the app will automatically use a fallback floor plan generator.

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

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - API Health Check: http://localhost:5000/api/health

## Usage

### Creating a Floor Plan

1. **Login/Register** at http://localhost:3000
2. Navigate to **Floor Plan Generator** from the sidebar
3. Enter property dimensions (e.g., 50ft x 40ft)
4. Add rooms (bedrooms, bathrooms, kitchen, living room, etc.)
5. Click **"Generate Floor Plan"**
6. Choose your path:
   - **Generate Floor Plan** → AI-powered map editor
   - **Get Price Prediction** → ML-based pricing estimate

### Using the Map Editor

- **Edit Rooms**: Drag and drop to reposition
- **Add Elements**: Use toolbar to add walls, doors, windows
- **Save**: Click save button to update project
- **Export**: Download as PNG image or PDF document
- **Get Pricing**: Click pricing button for cost estimates

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run health check
node scripts/health-check.js

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Floor Plans & AI
- `POST /api/gemini/generate-map` - Generate AI floor plan
- `POST /api/floorplan/generate` - Generate basic floor plan
- `POST /api/floorplan/optimize` - Optimize layout

### Pricing & Prediction
- `POST /api/price-prediction/predict` - Get price prediction
- `POST /api/cost/:projectId/calculate` - Calculate costs

### Export
- `POST /api/export/pricing-pdf` - Export pricing as PDF
- `POST /api/export/map-pdf` - Export floor plan as PDF
- `GET /api/export/:projectId/csv` - Export to CSV
- `GET /api/export/:projectId/json` - Export to JSON

### Maps
- `GET /api/maps/:projectId` - Get map data
- `POST /api/maps/:projectId/layers` - Add map layer

### Chatbot
- `POST /api/chatbot/ask` - Ask chatbot a question

## Project Structure

```
Restmage/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Auth/         # Login, Register
│   │   │   ├── Dashboard/    # Main dashboard
│   │   │   ├── FloorPlan/    # Floor plan generator
│   │   │   ├── MapEditor/    # Interactive map editor
│   │   │   ├── PricePrediction/  # ML price prediction
│   │   │   ├── Chatbot/      # AI chatbot
│   │   │   ├── Project/      # Project management
│   │   │   └── Layout/       # Header, Sidebar
│   │   ├── contexts/         # React contexts (Auth, Socket, Notification)
│   │   ├── services/         # API service (Axios)
│   │   └── types/            # TypeScript definitions
│   └── package.json
├── server/                    # Node.js backend
│   ├── middleware/           # Auth, validation
│   ├── models/              # MongoDB models (User, Project)
│   ├── routes/              # API endpoints
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── gemini.js        # AI floor plan generation
│   │   ├── floorplan.js
│   │   ├── price-prediction.js
│   │   ├── chatbot.js
│   │   ├── export-pdf.js
│   │   └── maps.js
│   ├── tests/               # Jest tests
│   ├── utils/               # Logger, helpers
│   └── server.js            # Main entry point
├── scripts/                  # Utility scripts
│   └── health-check.js      # System validation
├── package.json             # Root dependencies
└── README.md
```

 ------------------------------------------------------------------------------
## Development

### NPM Scripts
```bash
# Installation
npm run install              # Install all dependencies

# Development
npm run dev                  # Start both frontend and backend
npm run server              # Start backend only
npm run client              # Start frontend only

# Testing
npm test                    # Run all tests
npm run test:server         # Server tests only
npm run test:client         # Client tests only
npm run test:coverage       # With coverage report

# Code Quality
npm run lint                # Check code quality
npm run lint:fix            # Auto-fix issues

# Production
npm run build               # Build for production
npm start                   # Start production server

# Utilities
node scripts/health-check.js  # Validate setup
```
<<<<<<< HEAD

## Troubleshooting
=======
 ------------------------------------------------------------------------------
### Building for Production
```bash
# Build the React app
npm run build
>>>>>>> dceb6dae1088e5f0355a178a71a60b696405bfa6

### MongoDB Connection Failed
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```
<<<<<<< HEAD

### Port Already in Use
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Missing Dependencies
```bash
rm -rf node_modules client/node_modules server/node_modules
npm run install
```

## Documentation

- **[QUICK_START.md](QUICK_START.md)** - Quick 5-minute setup guide
- **[MAPEDITOR_INTEGRATION.md](MAPEDITOR_INTEGRATION.md)** - MapEditor integration details
- **[INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md)** - Complete feature summary
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

## Architecture

### Frontend Architecture
- **React 19** with functional components and hooks
- **TypeScript** for type safety
- **Material-UI v7** for consistent design
- **Context API** for state management
- **Socket.IO** for real-time updates
- **Axios** for API calls

### Backend Architecture
- **Express.js** REST API
- **MongoDB** with Mongoose ODM
- **JWT** authentication
- **Winston** logging
- **Socket.IO** WebSocket server
- **PDFKit** for server-side PDF generation

=======
 ------------------------------------------------------------------------------
>>>>>>> dceb6dae1088e5f0355a178a71a60b696405bfa6
## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Input validation and sanitization
- Helmet.js security headers
 ------------------------------------------------------------------------------
## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
 ------------------------------------------------------------------------------
## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please open an issue on GitHub or contact the development team.

---
