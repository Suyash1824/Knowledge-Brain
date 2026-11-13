# Deploying Knowledge Brain to Vercel

Knowledge Brain is configured for turnkey deployment on **Vercel** with full-stack support for both the React/Vite flagship UI and the Python FastAPI backend.

---

## Architecture Overview

```
                   ┌───────────────────────────────────┐
                   │         Vercel Edge / CDN         │
                   └─────────────────┬─────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
                 ▼                                       ▼
    ┌─────────────────────────┐             ┌─────────────────────────┐
    │  React 18 SPA (Vite)    │             │ Serverless Python API   │
    │  frontend/dist/         │             │ api/index.py (FastAPI)  │
    │  Routes: /*             │             │ Routes: /api/*, /docs   │
    └─────────────────────────┘             └────────────┬────────────┘
                                                         │ (TLS / SSL)
                                                         ▼
                                            ┌─────────────────────────┐
                                            │ Neon Cloud PostgreSQL   │
                                            │ + pgvector Extension    │
                                            └─────────────────────────┘
```

---

## Method 1 — Deploy via Vercel Web Dashboard (Recommended)

### Step 1: Import Repository
1. Navigate to [vercel.com/new](https://vercel.com/new).
2. Select your GitHub account and import **`Suyash1824/Knowledge-Brain`**.

### Step 2: Configure Project Settings
The repository includes a root `vercel.json` and `package.json`, which automatically configures:
- **Framework Preset**: Vite / Other
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/dist`

*(If you choose to set **Root Directory** to `frontend` instead, `frontend/vercel.json` ensures Single Page Application routing works without 404s).*

### Step 3: Add Environment Variables
In the **Environment Variables** section on Vercel, add:

| Variable Name | Required | Description | Example / Note |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | Neon PostgreSQL connection string | `postgresql://<user>:<password>@<neon-host>/neondb?sslmode=require` |
| `SECRET_KEY` | **Yes** | Secret string for signing auth tokens | Any secure 32+ character random string |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Optional | JWT session validity duration | `60` |
| `VITE_API_URL` | Optional | Custom backend URL (if hosting backend elsewhere) | Leave blank to use integrated `/api` serverless functions |

### Step 4: Deploy
Click **Deploy**. Vercel will install dependencies, compile the React SPA, package the serverless API, and assign a production URL (e.g. `https://knowledge-brain.vercel.app`).

---

## Method 2 — Deploy via Vercel CLI

From your local project terminal:

```bash
# 1. Login to Vercel
npx vercel login

# 2. Deploy preview
npx vercel

# 3. Add environment variables
npx vercel env add DATABASE_URL
npx vercel env add SECRET_KEY

# 4. Deploy to production
npx vercel --prod
```

---

## Production Verification Checklist

Once deployed to Vercel, verify your live deployment:

1. **Frontend UI**: Visit `https://<your-project>.vercel.app/` — verify that the 3D core, Dashboard, and Memory Explorer load.
2. **API Health Endpoint**: Visit `https://<your-project>.vercel.app/api/health` — should return:
   ```json
   {
     "status": "healthy",
     "service": "Knowledge Brain API",
     "database": {
       "status": "connected",
       "pgvector_available": true
     }
   }
   ```
3. **Interactive Documentation**: Visit `https://<your-project>.vercel.app/docs` for Swagger UI.
