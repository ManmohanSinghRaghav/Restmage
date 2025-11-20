# Restmage AI Agent Instructions

You are an AI developer working on **Restmage**, a full-stack real estate planning application. This project uses a **MERN stack** (MongoDB, Express, React, Node.js) with **TypeScript** on the frontend and **JavaScript** on the backend.

## 🏗 Architecture & Data Flow

### System Overview
- **Client**: React 18+ (TypeScript) with Material-UI and Leaflet.js.
- **Server**: Node.js/Express (JavaScript) with Mongoose.
- **AI**: Gemini API for floor plan generation.
- **Real-time**: Socket.IO for collaboration.

### AI Floor Plan Generation (Critical Path)
We moved from a client-side AI call to a secure server-side proxy pattern.
1. **Client**: `client/src/services/geminiFloorPlan.ts` calls `POST /api/floorplan/generate-ai`.
2. **Server Route**: `server/routes/floorplan.js` handles the request.
   - *Warning*: This file contains both a legacy algorithmic `generateFloorPlan` function and imports the new AI service. Be careful of name collisions.
3. **Server Service**: `server/services/geminiFloorPlan.js` constructs the prompt and calls Gemini.
4. **Parsing**: `server/utils/geminiResponseParser.js` cleans and parses the AI JSON response.

## 🛠 Tech Stack & Conventions

### Frontend (`client/`)
- **Language**: TypeScript.
- **State**: Context API (`AuthContext`, `SocketContext`).
- **API**: Use `src/services/api.ts`. It has "smart" base URL detection to handle localhost/LAN IPs automatically.
- **Maps**: `react-leaflet` for rendering floor plans.
- **Styling**: Material-UI (MUI) v5/v6.

### Backend (`server/`)
- **Language**: JavaScript (CommonJS).
- **Database**: MongoDB with Mongoose (`models/`).
- **Auth**: JWT-based, handled in `middleware/auth.js`.
- **Testing**: Jest (`npm test`).

## 🚀 Developer Workflows

### Starting the App
You need to run both client and server:
1. **Server**: `cd server && npm run dev` (runs on port 5000).
2. **Client**: `cd client && npm start` (runs on port 3000).

### Environment Variables
- **Server**: Requires `.env` with `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`.
- **Client**: Uses `REACT_APP_API_URL` (optional, defaults to smart detection).

## ⚠️ Critical Implementation Details

1. **API Base URL**: Do not hardcode `localhost:5000`. Use the exported `api` instance from `client/src/services/api.ts`.
2. **AI Prompts**: When modifying AI behavior, edit `server/utils/promptBuilder.js`. Do not hardcode prompts in the route handlers.
3. **Type Safety**: The frontend is strict TypeScript. Ensure `client/src/types/floorPlan.types.ts` matches the JSON structure returned by the backend AI service.
4. **Legacy Code**: `server/routes/floorplan.js` contains legacy algorithmic generation code (`POST /generate`). The new AI endpoint is `POST /generate-ai`. Distinguish between them carefully.
