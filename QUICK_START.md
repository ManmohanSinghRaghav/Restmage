# Quick Start Guide - Restmage with MapEditor

## 🚀 Getting Started in 5 Minutes

### Prerequisites Check
- ✅ Node.js installed (v16.20.1 or higher)
- ✅ MongoDB running (local or Atlas)
- ✅ Git installed

### Step 1: Install Dependencies
```bash
# From project root
npm run install
```

### Step 2: Configure Environment (Optional)
Create `server/.env` if not exists:
```env
MONGODB_URI=mongodb://localhost:27017/restmage
JWT_SECRET=your_secret_key_here
PORT=5000
CLIENT_URL=http://localhost:3000

# Optional: For AI floor plan generation
GEMINI_API_KEY=your_gemini_api_key_here
```

**Note:** If you don't set `GEMINI_API_KEY`, the app will automatically use a fallback floor plan generator.

### Step 3: Start the Application
```bash
# Start both frontend and backend
npm run dev
```

This will start:
- **Backend API** at http://localhost:5000
- **Frontend App** at http://localhost:3000

### Step 4: Try the New Workflow

1. **Open Browser**: Go to http://localhost:3000

2. **Register/Login**:
   - Create a new account or login
   - Automatic redirect to dashboard

3. **Generate Floor Plan**:
   - Click "Floor Plan Generator" from sidebar
   - Enter property dimensions (e.g., 50ft x 40ft)
   - Add rooms (bedrooms, bathrooms, kitchen, etc.)
   - Click "Generate Floor Plan"

4. **Choose Your Path**:
   - Modal appears with two options:
     - **Generate Floor Plan** → AI-powered map editor
     - **Get Price Prediction** → ML-based pricing

5. **Edit Floor Plan** (if you chose Generate Map):
   - Interactive canvas editor opens
   - Drag and drop rooms
   - Add walls, doors, windows
   - Click **Save** to save changes
   - Click **Export as Image** for PNG download
   - Click **Export as PDF** for PDF download
   - Click **Get Pricing** to get cost estimate

6. **Get Pricing** (if you chose pricing):
   - View ML-based price prediction
   - See detailed cost breakdown
   - Export pricing report as PDF

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run with Coverage
```bash
npm run test:coverage
```

### Run Health Check
```bash
node scripts/health-check.js
```

## 🔍 Troubleshooting

### MongoDB Connection Failed
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

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
# Reinstall all dependencies
rm -rf node_modules client/node_modules server/node_modules
npm run install
```

### Canvas Not Rendering
- Check browser console for errors
- Ensure modern browser (Chrome/Firefox/Edge)
- Clear browser cache

### Gemini API Not Working
- Check if API key is set in `.env`
- App will automatically use fallback generator
- No action needed if you don't have API key

## 📊 Features to Try

### 1. AI Floor Plan Generation
- Uses Google Gemini AI (if API key set)
- Automatic room placement optimization
- Intelligent wall and door positioning
- Falls back to basic generator if API unavailable

### 2. Interactive Map Editor
- Canvas-based editing
- Drag-and-drop rooms
- Add/remove walls, doors, windows
- Real-time rendering
- Undo/Redo support

### 3. Export Options
- **PNG Image**: High-quality floor plan image
- **PDF Document**: Professional formatted PDF
- **Pricing Report**: Detailed cost breakdown PDF

### 4. Price Prediction
- ML-based property valuation
- Area, location, amenities factors
- Detailed cost breakdown
- PDF export support

### 5. Real-Time Collaboration
- WebSocket-based updates
- Multi-user editing support
- Live project synchronization

## 🎯 Quick Commands Reference

```bash
# Development
npm run dev              # Start both frontend and backend
npm run server           # Start backend only
npm run client           # Start frontend only

# Building
npm run build            # Build production frontend

# Testing
npm test                 # Run all tests
npm run test:server      # Server tests only
npm run test:client      # Client tests only
npm run test:coverage    # With coverage report

# Code Quality
npm run lint             # Check code quality
npm run lint:fix         # Auto-fix issues

# Health Check
node scripts/health-check.js
```

## 📚 Documentation

- **Main README**: [README.md](README.md)
- **Integration Guide**: [MAPEDITOR_INTEGRATION.md](MAPEDITOR_INTEGRATION.md)
- **Summary**: [INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md)

## 🆘 Need Help?

### Common Issues
1. **App won't start**: Check MongoDB is running
2. **Tests failing**: Run `npm run install` again
3. **Map not loading**: Check browser console
4. **Export not working**: Verify canvas is rendered

### Check Logs
- Server logs: `server/logs/combined.log`
- Error logs: `server/logs/error.log`
- Browser console: F12 in browser

### Still Stuck?
1. Run health check: `node scripts/health-check.js`
2. Check all dependencies: `npm run install`
3. Restart servers: Stop (Ctrl+C) and run `npm run dev` again

## 🎉 You're Ready!

The application is fully integrated with:
- ✅ AI-powered floor plan generation
- ✅ Interactive map editor
- ✅ Export to PNG/PDF
- ✅ Price prediction
- ✅ Real-time collaboration
- ✅ Automated testing
- ✅ Comprehensive logging

**Enjoy building amazing real estate floor plans!** 🏠
