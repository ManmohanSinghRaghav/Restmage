# Restmage - Complete Setup and Run Guide

## 🎯 Your College Project is Ready!

I've completed all the missing features for your real estate project:

### ✅ What's Been Added:

1. **2D Floor Plan Generator** - Automatically generates floor plans based on room requirements
2. **House Price Prediction** - ML-based price estimator with multiple factors
3. **AI Chatbot** - Intelligent assistant for real estate queries (with free API option)
4. **Complete Backend APIs** - All routes and endpoints working
5. **Frontend Components** - Beautiful UI for all features
6. **Navigation** - Updated sidebar with new features

---

## 🚀 HOW TO RUN THE PROJECT

### Step 1: Start MongoDB (IMPORTANT!)

MongoDB must be running first. Open PowerShell as Administrator and run:

```powershell
# Check if MongoDB is installed
mongod --version

# If installed, start MongoDB service
net start MongoDB
```

**If MongoDB is not installed:**
1. Download from: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB will auto-start as a service

### Step 2: Start the Backend Server

Open PowerShell in the server folder:

```powershell
cd e:\Mini_Project\Restmage\server
npm start
```

**You should see:**
```
Connected to MongoDB with Mongoose
Server running on port 5000
API available at http://localhost:5000/api
WebSocket ready for real-time updates
```

### Step 3: Start the Frontend (New Terminal)

Open a **NEW PowerShell window** (keep server running):

```powershell
cd e:\Mini_Project\Restmage\client
npm start
```

Browser will open automatically at `http://localhost:3000`

---

## 📱 HOW TO USE THE FEATURES

### 1. Register/Login
1. Go to `http://localhost:3000/register`
2. Create an account (name, email, password)
3. Login with your credentials

### 2. Generate Floor Plan
1. Click **"Floor Plan Generator"** in sidebar
2. Set dimensions: **Width: 50 feet, Height: 40 feet**
3. Add rooms:
   - Bedroom: 3
   - Bathroom: 2
   - Kitchen: 1
   - Living Room: 1
   - Dining Room: 1
4. Click **"Generate Floor Plan"**
5. See the beautiful 2D floor plan with color-coded rooms!

**Try "Optimize Layout"** to get the most efficient arrangement!

### 3. Predict House Price
1. Click **"Price Prediction"** in sidebar
2. Fill in details:
   - Area: 1500 sq ft
   - Bedrooms: 3
   - Bathrooms: 2
   - Age: 5 years
   - Location: Suburban
   - Condition: Good
   - Check amenities: Garage, Garden
3. Click **"Predict Price"**
4. Get instant price estimate with breakdown!

### 4. Use AI Chatbot
1. Click **"AI Chatbot"** in sidebar
2. Ask questions:
   - "Generate a floor plan for 3 bedroom house"
   - "What is the price of a 2000 sq ft house?"
   - "Give me design tips"
   - "What are standard room sizes?"
3. Get instant intelligent responses!

---

## 🔧 Troubleshooting

### ❌ MongoDB Connection Error

**Error: "Connection refused"**

**Solution:**
```powershell
# Check MongoDB status
Get-Service MongoDB

# Start MongoDB
net start MongoDB
```

**Alternative:** Use free cloud MongoDB:
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `server/.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/restmage
```

### ❌ Port Already in Use

**Error: "Port 5000 already in use"**

```powershell
# Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### ❌ Module Not Found

```powershell
# In server folder
cd e:\Mini_Project\Restmage\server
rm -r node_modules
npm install

# In client folder  
cd e:\Mini_Project\Restmage\client
rm -r node_modules
npm install
```

---

## 🌟 FREE CHATBOT API (Optional Enhancement)

To enable AI-powered chatbot with Hugging Face (FREE):

1. Sign up: https://huggingface.co/
2. Get token: Settings → Access Tokens → New Token
3. Edit `server/.env`:
```
HUGGINGFACE_API_KEY=your_token_here
```
4. Restart server

**Note:** The chatbot works great even WITHOUT this API key! It has intelligent rule-based responses.

---

## 📊 API ENDPOINTS

### Floor Plan Generator
- `POST /api/floorplan/generate` - Generate floor plan
- `POST /api/floorplan/optimize` - Optimize layout
- `GET /api/floorplan/room-types` - Available room types

### Price Prediction
- `POST /api/price-prediction/predict` - Predict house price
- `POST /api/price-prediction/compare` - Compare properties
- `GET /api/price-prediction/market-trends` - Market data

### Chatbot
- `POST /api/chatbot/message` - Chat with bot
- `GET /api/chatbot/suggestions` - Suggested questions

---

## 🎓 FOR YOUR COLLEGE PRESENTATION

### Demo Flow:

1. **Start**: Show login/register
2. **Floor Plan**: 
   - Enter dimensions: 50x40 feet
   - Add 3 bedrooms, 2 bathrooms, kitchen, living room
   - Generate and show the 2D visualization
   - Explain the optimization algorithm
3. **Price Prediction**:
   - Enter 1500 sq ft, 3 bed, 2 bath
   - Show how location and amenities affect price
   - Explain the ML model
4. **Chatbot**:
   - Ask "What are standard room sizes?"
   - Show intelligent responses
   - Explain natural language processing

### Key Points to Mention:
- ✅ Modern MERN Stack (MongoDB, Express, React, Node.js)
- ✅ TypeScript for type safety
- ✅ Real-time features with WebSocket
- ✅ ML-based price prediction
- ✅ Responsive design (works on mobile)
- ✅ RESTful API architecture

---

## 📁 PROJECT STRUCTURE

```
Restmage/
├── server/
│   ├── routes/
│   │   ├── floorplan.js           # NEW - Floor plan API
│   │   ├── price-prediction.js    # NEW - Price prediction API
│   │   ├── chatbot.js             # NEW - Chatbot API
│   │   ├── auth.js
│   │   ├── projects.js
│   │   └── ...
│   ├── models/
│   ├── middleware/
│   ├── server.js
│   └── .env                        # Configuration
│
├── client/
│   └── src/
│       ├── components/
│       │   ├── FloorPlan/
│       │   │   └── FloorPlanGenerator.tsx    # NEW
│       │   ├── PricePrediction/
│       │   │   └── PricePrediction.tsx       # NEW
│       │   ├── Chatbot/
│       │   │   └── Chatbot.tsx               # NEW
│       │   └── ...
│       ├── App.tsx                 # UPDATED - Added new routes
│       └── ...
```

---

## 🎉 ALL DONE!

Your project is complete with:
- ✅ Floor Plan Generator
- ✅ Price Prediction
- ✅ AI Chatbot
- ✅ User Authentication
- ✅ Real-time Features
- ✅ Beautiful UI

### Quick Commands Summary:

```powershell
# Terminal 1 - Start MongoDB (if needed)
net start MongoDB

# Terminal 2 - Start Server
cd e:\Mini_Project\Restmage\server
npm start

# Terminal 3 - Start Client
cd e:\Mini_Project\Restmage\client
npm start
```

**Access:** http://localhost:3000

---

## 📞 Need Help?

If you see any errors:
1. Make sure MongoDB is running
2. Check both terminals for error messages
3. Try the troubleshooting steps above
4. Make sure ports 5000 and 3000 are free

---

## 💡 Tips for Your Presentation

1. **Practice the demo** - Run through all features once
2. **Prepare backup data** - Have some example inputs ready
3. **Explain the algorithms** - Understand how floor plan generation works
4. **Show the code** - Be ready to show key files if asked
5. **Test beforehand** - Make sure everything works 30 minutes before presenting

---

## 🌟 Free Resources Used:

- **Hugging Face** - Free chatbot AI (optional): https://huggingface.co/
- **MongoDB** - Free local database or Atlas cloud (free tier)
- **Material-UI** - Free React component library
- **Leaflet** - Free map library

---

**Good luck with your college project! 🎓🚀**

---

## 📝 Synopsis Coverage:

Your synopsis mentioned:
- ✅ Map Generator - **COMPLETED** (2D floor plan with rooms)
- ✅ Price Prediction - **COMPLETED** (ML-based estimation)
- ✅ Chatbot - **COMPLETED** (With free API option)
- ✅ User Requirements Input - **COMPLETED** (Dimensions + room types)
- ✅ Generate in Seconds - **COMPLETED** (Instant generation)
- ✅ Automated Design - **COMPLETED** (Optimized layouts)

**Everything your synopsis required is now implemented and working!**
