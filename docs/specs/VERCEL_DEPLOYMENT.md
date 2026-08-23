# Vercel Deployment Guide — Uni - Logger AI

This guide provides step-by-step instructions for deploying the **Uni - Logger AI** platform to [Vercel](https://vercel.com).

---

## Architecture on Vercel

```
┌────────────────────────────────────────────────────────┐
│               Vercel Edge & CDN Network               │
│  - Serves compiled React 18 + Vite SPA from /dist      │
│  - Rewrites all client-side routes (/* -> /index.html) │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
   [ Option A: Same-Origin ]     [ Option B: Decoupled Backend ]
   Vercel Serverless Function     Backend deployed on Render/
   (api/index.py routes /api/*)   Railway/AWS/EC2
                                  (Configured via VITE_API_URL)
```

---

## Method 1: Deploying via Vercel Web Dashboard (Recommended)

### Step 1: Import Your GitHub Repository
1. Log into your account at [vercel.com](https://vercel.com).
2. Click **"Add New..."** $\rightarrow$ **"Project"**.
3. Under **Import Git Repository**, select:
   `mini288777-source/UNIHACK-HACKATHON-UNILOG-HACK2SKILL`

### Step 2: Configure Project Settings
In the Vercel project configuration screen:

* **Framework Preset**: `Vite`
* **Root Directory**: `frontend` *(or leave as `./` — both are pre-configured!)*
* **Build Command**: `npm run build`
* **Output Directory**: `dist` (or `frontend/dist` if root directory is `./`)

### Step 3: Configure Environment Variables (Optional)
Under the **Environment Variables** section, you can optionally configure:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of your deployed backend API (leave empty if using same-origin or local proxy) | `https://your-backend.onrender.com` |
| `OPENAI_API_KEY` | (Optional) OpenAI API Key for unstructured PDF extraction | `sk-...` |

### Step 4: Deploy
Click **"Deploy"**. Vercel will automatically build the React application and deploy it to a live production URL (e.g., `https://unihack-hackathon-unilog-hack2skill.vercel.app`).

---

## Method 2: Deploying via Vercel CLI

You can also deploy directly from your local terminal using the Vercel CLI:

```bash
# 1. Install Vercel CLI globally (if not already installed)
npm install -g vercel

# 2. Navigate to project root
cd "d:\UNIHACK PROJECT"

# 3. Log in and deploy
vercel

# 4. Deploy to production
vercel --prod
```

---

## Pre-Configured Vercel Deliverables Included

1. **[`vercel.json`](file:///d:/UNIHACK%20PROJECT/vercel.json)**: Root configuration file mapping build commands and rewrites.
2. **[`frontend/vercel.json`](file:///d:/UNIHACK%20PROJECT/frontend/vercel.json)**: Frontend-specific configuration for clean client-side routing.
3. **[`api/index.py`](file:///d:/UNIHACK%20PROJECT/api/index.py)**: Serverless function wrapper for FastAPI backend endpoints.
4. **[`api/requirements.txt`](file:///d:/UNIHACK%20PROJECT/api/requirements.txt)**: Serverless Python dependencies manifest.
5. **[`frontend/src/vite-env.d.ts`](file:///d:/UNIHACK%20PROJECT/frontend/src/vite-env.d.ts)**: Dynamic `VITE_API_URL` environment variable typing.
