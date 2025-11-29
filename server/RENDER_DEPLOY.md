# Deploying Restmage Backend to Render

This guide walks you through deploying the Restmage backend to [Render](https://render.com).

## Prerequisites

1. A [Render](https://render.com) account
2. A [MongoDB Atlas](https://www.mongodb.com/atlas) database (free tier works)
3. Your API keys (Gemini, OpenAI, HuggingFace as needed)

## Step 1: Set Up MongoDB Atlas

1. Create a free MongoDB Atlas cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user with read/write permissions
3. Add `0.0.0.0/0` to the IP Access List (allows all IPs - required for Render)
4. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/restmage`)

## Step 2: Deploy to Render

### Option A: Using render.yaml (Blueprint)

1. Push your code to GitHub/GitLab
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **New** → **Blueprint**
4. Connect your repository
5. Render will detect `render.yaml` and create the service
6. Fill in the environment variables when prompted

### Option B: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub/GitLab repository
4. Configure the service:
   - **Name**: `restmage-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your deployment branch)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. Add Environment Variables (see below)
6. Click **Create Web Service**

## Step 3: Configure Environment Variables

In the Render dashboard, add these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Set to production | `production` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Random secret for JWT tokens | Generate with `openssl rand -base64 32` |
| `CLIENT_URL` | Your frontend URL | `https://restmage.vercel.app` |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins | `https://restmage.vercel.app` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `GEMINI_API_MODEL` | Gemini model to use | `gemini-2.5-flash` |
| `OPENAI_API_KEY` | OpenAI API key (optional) | `sk-...` |
| `HUGGINGFACE_API_KEY` | HuggingFace API key (optional) | `hf_...` |

## Step 4: Verify Deployment

1. Wait for the build to complete (first build takes 2-5 minutes)
2. Click the generated URL (e.g., `https://restmage-api.onrender.com`)
3. Test the health endpoint: `https://your-app.onrender.com/api/health`
4. You should see: `{"status":"OK","timestamp":"..."}`

## Step 5: Update Frontend

Update your frontend's API URL to point to your Render backend:

```env
REACT_APP_API_URL=https://restmage-api.onrender.com
```

## Troubleshooting

### Cold Starts
Render's free tier has cold starts (service spins down after 15 minutes of inactivity). The first request after inactivity may take 30-60 seconds. Consider upgrading to a paid plan for always-on service.

### Connection Issues
- Ensure MongoDB Atlas IP Access List includes `0.0.0.0/0`
- Verify all environment variables are set correctly
- Check Render logs for error messages

### CORS Errors
- Make sure `CLIENT_URL` and `ALLOWED_ORIGINS` include your frontend's exact URL
- Include both `https://` prefix and no trailing slash

### WebSocket Issues
Render supports WebSockets on all plans. If you have issues:
- Ensure your frontend connects to the correct WebSocket URL
- Use `wss://` (secure WebSocket) for HTTPS deployments

## Health Check

Render uses the `/api/health` endpoint to monitor your service. This is configured in `render.yaml`.

## Logs

View logs in the Render dashboard:
1. Go to your service
2. Click **Logs** in the sidebar
3. Use filters to find specific issues

## Scaling

To handle more traffic:
1. Go to your service settings
2. Upgrade to a paid plan
3. Add more instances or increase resources
