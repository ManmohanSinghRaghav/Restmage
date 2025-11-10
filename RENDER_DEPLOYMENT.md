# Render Deployment - Environment Variables

## Copy these values to Render Dashboard

When setting up your service on Render, add these environment variables:

### 1. MONGODB_URI
```
mongodb+srv://manmohansingh:4eNk4BVjRAfLjAV@restmage.miwkua8.mongodb.net/?appName=restmage
```

### 2. JWT_SECRET
```
restmage_jwt_secret_key_2024_production_change_this_in_prod
```
**⚠️ IMPORTANT:** Generate a new secure secret for production using:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. GEMINI_API_KEY
```
AIzaSyA45Rm7jU6L5edtbAjE0jGBrj_xv2P1UlU
```

### 4. ENVIRONMENT
```
production
```

### 5. CORS_ORIGINS
```
https://restmage.vercel.app,http://localhost:3000
```

### 6. DEBUG
```
false
```

---

## After Deployment

Once your Render backend is live at `https://restmage-api.onrender.com` (or similar):

1. **Update Vercel Frontend Environment Variables:**
   ```bash
   cd r:\MiniPro\Restmage
   npx vercel env rm REACT_APP_API_URL production
   npx vercel env add REACT_APP_API_URL production
   # Enter: https://restmage-api.onrender.com/api
   
   npx vercel env rm REACT_APP_SOCKET_URL production
   npx vercel env add REACT_APP_SOCKET_URL production
   # Enter: https://restmage-api.onrender.com
   ```

2. **Redeploy Frontend:**
   ```bash
   npx vercel --prod
   ```

3. **Test the APIs:**
   - Health Check: https://restmage-api.onrender.com/api/health
   - API Docs: https://restmage-api.onrender.com/api/docs
   - Root: https://restmage-api.onrender.com/

---

## Local Development

Your local `.env` files are configured and ready:
- ✅ `backend/.env` - Local development with MongoDB Atlas
- ✅ `frontend/.env` - Points to localhost:5000
- ✅ `frontend/.env.production` - Template for production URLs

To run locally:
```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py

# Frontend (new terminal)
cd frontend
npm install
npm start
```
