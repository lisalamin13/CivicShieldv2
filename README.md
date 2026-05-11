# 🛡️ CivicShield
### AI-Powered SaaS Framework for Secure Anonymous Reporting & Compliance

> MCA Final Year Project — Assam Don Bosco University, Guwahati  
> Student: Lisawanny Lamin | ID: DC2024MCA0040

---

##  Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [System Architecture](#-system-architecture)
4. [Prerequisites](#-prerequisites)
5. [Step-by-Step Local Setup](#-step-by-step-local-setup)
6. [Environment Variables Guide](#-environment-variables-guide)
7. [Seeding Demo Data](#-seeding-demo-data)
8. [Running the Application](#-running-the-application)
9. [Demo Login Credentials](#-demo-login-credentials)
10. [All Features & Pages](#-all-features--pages)
11. [Deployment Guide (Go Live)](#-deployment-guide-go-live)
12. [Project Folder Structure](#-project-folder-structure)
13. [Troubleshooting](#-troubleshooting)

---

##  Project Overview

CivicShield is a multi-tenant AI-powered SaaS grievance reporting platform that provides:

-  **Absolute Anonymity** — AES-256 encryption, metadata stripping, zero IP logging
-  **AI Ethics Advisor** — Local AI-powered chatbot guides reporters through organizational policies
-  **Three Role Dashboards** — SuperAdmin, OrgAdmin/Investigator, Reporter
-  **Multi-Tenant Architecture** — Multiple organizations, fully isolated data
-  **OTP Authentication** — Twilio-based phone verification for admin staff
-  **AI Report Analysis** — Local NLP summary, urgency scoring, sentiment analysis
-  **Secure Messaging** — Encrypted 2-way chat between reporters and investigators
-  **DaisyUI + Tailwind** — Mobile-responsive dark theme UI

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, DaisyUI, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (NoSQL) |
| AI Engine | Local FastAPI + Transformers (DistilBART, SmolLM2) |
| OTP Verification | Twilio Verify |
| Authentication | JWT (JSON Web Tokens) |
| Encryption | AES-256-CBC (Node.js crypto) |
| File Uploads | Multer + Sharp (metadata stripping) |

---

##  System Architecture

```
civicshield/
├── backend/          ← Node.js + Express API
├── frontend/         ← React + Vite app
└── ai_engine/        ← Python + FastAPI Local AI Brain
```

The backend runs on **port 5000**, the frontend on **port 5173**, and the AI engine on **port 8000**.

---

## Prerequisites

Install these before anything else:

### 1. Node.js (v18 or higher)
```bash
# Check if installed:
node --version   # Should show v18.x.x or higher

# If not installed, download from:
# https://nodejs.org/en/download
```

### 2. Git
```bash
# Check:
git --version

# Download: https://git-scm.com/downloads
```

### 3. MongoDB Atlas Account (Free)
> You mentioned you have one. If not: https://www.mongodb.com/atlas

### 4. Python 3.10+ (for Local AI)
> Download from: https://www.python.org/downloads/  
> Required for running the local NLP analysis engine.

### 5. Twilio Account (for OTP)
> Sign up at: https://www.twilio.com  
> **Note:** In TEST MODE (no Twilio setup), OTP is always `123456`

---

##  Step-by-Step Local Setup

### Step 1 — Get the Project Files

If you have the files on your computer already, navigate to them:
```bash
cd path/to/civicshield
```

Or if using GitHub (after uploading):
```bash
git clone https://github.com/YOUR_USERNAME/civicshield.git
cd civicshield
```

---

### Step 2 — Set Up MongoDB Atlas

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click **"Build a Database"** → Choose **FREE** tier → Select any region
3. Create a username and password (save these!)
4. Under **Network Access** → Click **"Add IP Address"** → Click **"Allow Access from Anywhere"** → Confirm
5. Go back to your cluster → Click **"Connect"** → **"Drivers"**
6. Copy the connection string — it looks like:
   ```
   mongodb+srv://myuser:mypassword@cluster0.abcd123.mongodb.net/
   ```
7. Replace `<password>` with your actual password

---

### Step 3 — Configure Backend Environment Variables

```bash
# Navigate to backend folder
cd backend

# Copy the example env file
cp .env.example .env
```

Now open `.env` in any text editor (Notepad, VS Code, etc.) and fill in:

```env
PORT=5000
NODE_ENV=development

# Paste your MongoDB Atlas connection string here:
MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/civicshield?retryWrites=true&w=majority

# Generate a random secret (copy-paste this exactly):
JWT_SECRET=civicshield_super_secret_jwt_2024_change_in_production_min32chars

# Generate an encryption key — run this in terminal:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Paste the output here (64 hex characters):
ENCRYPTION_KEY=paste_your_64_character_hex_key_here

# Twilio (leave as-is for TEST MODE — OTP will be 123456):
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
FRONTEND_URL=http://localhost:5173
```

**Generating the ENCRYPTION_KEY:**
```bash
# Run this in your backend folder:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output and paste as ENCRYPTION_KEY value
```

---

### Step 4 — Install Backend Dependencies

```bash
# Make sure you're in the backend folder
cd backend

npm install
```

This installs: Express, Mongoose, JWT, bcrypt, Multer, Twilio, Gemini SDK, etc.

---

### Step 5 — Install Frontend Dependencies

```bash
# Go to frontend folder (from project root)
cd ../frontend

npm install
```

This installs: React, Vite, Tailwind CSS, DaisyUI, Recharts, Axios, React Router.

---

### Step 6 — Set Up Local AI Engine (The Brain)

```bash
# Navigate to ai_engine folder
cd ../ai_engine

# Install Python requirements
pip install -r requirements.txt
```

### Step 7 — Seed the Database with Demo Data

```bash
# From the backend folder:
cd ../backend

npm run seed
```

You should see:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
🌱 Starting CivicShield database seed...
🗑️  Cleared existing data.
🏢 Created 3 organizations (tenants).
👔 Created 4 staff accounts.
📝 Created 1 reporter account.
📋 Created policies for all organizations.
📊 Created 5 sample reports with tracking IDs.

════════════════════════════════════════════════════════════
✅  CIVICSHIELD SEED COMPLETE
════════════════════════════════════════════════════════════

🔐 DEMO LOGIN CREDENTIALS:

SUPER ADMIN:
  Phone    : +919100000001
  Password : Super@1234
  OTP      : 123456  (test mode)
  Role     : SuperAdmin
...
```

---

## 🔐 Environment Variables Guide

| Variable | What It Is | How to Get It |
|----------|-----------|---------------|
| `MONGODB_URI` | Your Atlas connection string | MongoDB Atlas → Connect → Drivers |
| `JWT_SECRET` | Any long random string | Make one up (32+ chars) |
| `ENCRYPTION_KEY` | 64-char hex key | Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `TWILIO_ACCOUNT_SID` | Twilio account ID | https://console.twilio.com (optional) |
| `TWILIO_AUTH_TOKEN` | Twilio secret | https://console.twilio.com (optional) |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify SID | Twilio Console → Verify → Services |

> ⚠️ **Without Twilio configured, OTP always shows as `123456` in the UI (test mode). This is fine for development.**

---

## ▶️ Running the Application

Open **two separate terminal windows**:

### Terminal 1 — Start Backend:
```bash
cd civicshield/backend
npm run dev
```
You should see:
```
🚀 CivicShield Backend running on http://localhost:5000
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
```

### Terminal 2 — Start Frontend:
```bash
cd civicshield/frontend
npm run dev
```
You should see:
```
  VITE v5.x.x  ready in 500 ms
  ➜  Local:   http://localhost:5173/
```

### Terminal 3 — Start Local AI Engine:
```bash
cd civicshield/ai_engine
python main.py
```
You should see:
```
--- 🚀 CIVICSHIELD ULTRA-LIGHT AI v5.9 (Full Suite) ---
✨ ULTRA-LIGHT BRAIN ONLINE!
```

### Open in Browser:
```
http://localhost:5173
```

---

## 🧪 Demo Login Credentials

All test passwords, OTP is always `123456` in test mode.

| Role | Phone | Password | Dashboard |
|------|-------|----------|-----------|
| **Super Admin** | `+919100000001` | `Super@1234` | `/superadmin` |
| **OrgAdmin (ADBU)** | `+919100000002` | `Admin@1234` | `/orgadmin` |
| **Investigator (ADBU)** | `+919100000003` | `Invest@1234` | `/orgadmin` |
| **OrgAdmin (TechCorp)** | `+919100000004` | `Admin@1234` | `/orgadmin` |
| **Reporter** | `+919200000001` | `Report@1234` | `/reporter` |

**Anonymous Reporting (no login needed):**  
Go to `http://localhost:5173/report`

**Track a Report (no login needed):**  
Go to `http://localhost:5173/track`

---

## 🎯 All Features & Pages

### Public Pages (No Login Required)
| Page | URL | Description |
|------|-----|-------------|
| Landing | `/` | Hero, features, how it works |
| Login | `/login` | Staff (OTP) + Reporter login |
| Register | `/register` | Create reporter account |
| Report Portal | `/report` | AI chatbot + anonymous report submission |
| Track Report | `/track` | Status lookup by tracking ID |

### SuperAdmin Dashboard (`/superadmin`)
| Page | Feature |
|------|---------|
| Dashboard | Global stats: orgs, reports, staff, activity log |
| Organizations | Create/suspend orgs, manage staff, view details |
| Analytics | Global analytics chart |

### OrgAdmin Dashboard (`/orgadmin`)
| Page | Feature |
|------|---------|
| Dashboard | Report stats, category breakdown, recent reports |
| Reports | Full report list with filters, search, pagination |
| Report Detail | Decrypted content, status update, AI summary, messaging, evidence |
| Policies | Create/edit/delete compliance rules (AI-connected) |
| Analytics | Charts: monthly trend, category, status, priority breakdown |
| Staff | Add/activate/deactivate staff members |

### Reporter Dashboard (`/reporter`)
| Page | Feature |
|------|---------|
| Dashboard | Stats, quick actions, recent reports |
| My Reports | All reports with inline messaging and tracking |

---

## 🌐 Deployment Guide (Go Live)

This section explains how to make CivicShield publicly accessible so anyone on the internet can use it.

---

### Option A — Deploy on Render (Backend) + Vercel (Frontend)
**Recommended — Both are FREE tiers**

#### Step 1: Push to GitHub
```bash
# In the civicshield root directory:
git init
git add .
git commit -m "Initial CivicShield deployment"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/civicshield.git
git push -u origin main
```

#### Step 2: Deploy Backend on Render
1. Go to [render.com](https://render.com) → Sign up/Login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Click **"Environment"** tab → Add all your `.env` variables:
   - `MONGODB_URI`, `JWT_SECRET`, `ENCRYPTION_KEY`, `GEMINI_API_KEY`, etc.
   - Set `FRONTEND_URL` = `https://your-app.vercel.app` (you'll get this after Step 3)
   - Set `NODE_ENV` = `production`
6. Click **"Create Web Service"**
7. Wait 3-5 minutes. Your backend URL will be like: `https://civicshield-backend.onrender.com`

#### Step 3: Deploy Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) → Sign up/Login with GitHub
2. Click **"New Project"** → Import your GitHub repo
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variable:
   - Key: `VITE_API_URL` — Value: `https://civicshield-backend.onrender.com`
5. Update `frontend/vite.config.js` for production:

```js
// vite.config.js — update the proxy target or use env var
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_API_URL || 'http://localhost:5000',
      changeOrigin: true,
    }
  }
}
```

6. Click **"Deploy"**
7. Your live URL will be: `https://civicshield.vercel.app`

#### Step 4: Update CORS
Go back to Render → Your backend → Environment:
- Update `FRONTEND_URL` = `https://civicshield.vercel.app`
- Redeploy

---

### Option B — Deploy on a VPS (DigitalOcean / AWS EC2)

#### Step 1: Get a Server
- [DigitalOcean](https://digitalocean.com) — $4/month Droplet (Ubuntu 22.04)
- [AWS EC2](https://aws.amazon.com) — Free tier t2.micro

#### Step 2: Server Setup
```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (web server)
sudo apt install nginx -y

# Clone your project
git clone https://github.com/YOUR_USERNAME/civicshield.git
cd civicshield
```

#### Step 3: Build and Start
```bash
# Backend
cd backend
cp .env.example .env
nano .env  # Fill in all your values
npm install
npm run seed  # Optional: seed demo data
pm2 start server.js --name civicshield-api
pm2 save

# Frontend
cd ../frontend
npm install
npm run build  # Creates dist/ folder
```

#### Step 4: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/civicshield
```

Paste this config:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Frontend (serve built React app)
    root /root/civicshield/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads/ {
        proxy_pass http://localhost:5000;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/civicshield /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 5: Add HTTPS (Free SSL)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d YOUR_DOMAIN.com
```

Your app is now live at: `https://YOUR_DOMAIN.com`

---

### Option C — Quick Deploy with Railway
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add backend service (root: `backend`)
4. Add environment variables
5. Railway gives you a public URL automatically

---

## 📁 Project Folder Structure

```
civicshield/
├── README.md
│
├── backend/
│   ├── server.js              ← Express app entry point
│   ├── package.json
│   ├── .env.example           ← Copy to .env and fill in
│   ├── .env                   ← YOUR SECRETS (never commit this)
│   ├── .gitignore
│   ├── config/
│   │   └── db.js              ← MongoDB connection
│   ├── controllers/           ← Business logic
│   │   ├── authController.js
│   │   ├── reportController.js
│   │   ├── tenantController.js
│   │   ├── policyController.js
│   │   ├── chatController.js
│   │   ├── analyticsController.js
│   │   ├── conversationController.js
│   │   └── staffController.js
│   ├── middleware/
│   │   ├── auth.js            ← JWT verification, RBAC
│   │   └── upload.js          ← Multer + metadata stripping
│   ├── models/                ← MongoDB schemas
│   │   ├── Tenant.js
│   │   ├── StaffUser.js
│   │   ├── Reporter.js
│   │   ├── Report.js
│   │   ├── Evidence.js
│   │   ├── AccessKey.js
│   │   ├── Conversation.js
│   │   ├── Policy.js
│   │   ├── AuditLog.js
│   │   └── IncidentGroup.js
│   ├── routes/                ← API route definitions
│   │   ├── auth.js
│   │   ├── reports.js
│   │   ├── tenants.js
│   │   ├── policies.js
│   │   ├── chat.js
│   │   ├── analytics.js
│   │   ├── conversations.js
│   │   └── staff.js
│   ├── services/
│   │   ├── geminiService.js   ← Google Gemini AI integration
│   │   └── twilioService.js   ← OTP via Twilio Verify
│   ├── utils/
│   │   ├── crypto.js          ← AES-256, SHA-256, tracking ID
│   │   └── seed.js            ← Demo data seeder
│   └── uploads/               ← Uploaded evidence files (local)
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js     ← DaisyUI civicshield theme
    ├── postcss.config.js
    └── src/
        ├── App.jsx             ← All routes
        ├── main.jsx            ← React entry
        ├── index.css           ← Global styles + DaisyUI
        ├── api/
        │   └── axios.js        ← API client with JWT
        ├── context/
        │   └── AuthContext.jsx ← Global auth state
        ├── components/
        │   ├── DashboardLayout.jsx
        │   ├── Sidebar.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Landing.jsx
            ├── Login.jsx       ← OTP flow for staff
            ├── Register.jsx
            ├── ReportPortal.jsx ← AI chatbot + form
            ├── TrackReport.jsx
            ├── superadmin/
            │   ├── Dashboard.jsx
            │   └── Organizations.jsx
            ├── orgadmin/
            │   ├── Dashboard.jsx
            │   ├── Reports.jsx
            │   ├── ReportDetail.jsx
            │   ├── Policies.jsx
            │   ├── Analytics.jsx
            │   └── Staff.jsx
            └── reporter/
                ├── Dashboard.jsx
                └── MyReports.jsx
```

---

## 🔧 Troubleshooting

### ❌ "Cannot connect to MongoDB"
- Check your `MONGODB_URI` is correct in `.env`
- In MongoDB Atlas, go to **Network Access** → ensure `0.0.0.0/0` is whitelisted
- Check your username/password has no special characters that need URL encoding

### ❌ "Seed fails / duplicate key error"
```bash
# The seed script clears everything — just run it again:
npm run seed
```

### ❌ "OTP always fails"
- In test mode (no Twilio), use OTP: `123456`
- Make sure Twilio credentials are correct if configured
- Twilio free accounts can only send to verified numbers

### ❌ "CORS error in browser"
- Ensure `FRONTEND_URL=http://localhost:5173` in backend `.env`
- Backend must be running on port 5000
- Restart the backend after any `.env` changes

### ❌ "Local AI Engine not responding"
- Ensure `python main.py` is running in the `ai_engine` folder
- Check if port 8000 is open and not being used by another app
- The system will fallback to mock responses if the engine is down

### ❌ "npm install fails"
```bash
# Clear cache and retry:
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### ❌ "Port already in use"
```bash
# Kill whatever is on port 5000:
npx kill-port 5000
# Kill frontend port:
npx kill-port 5173
```

---

## 🛡️ Security Notes

- **Never commit `.env`** — it contains secrets
- The `uploads/` folder is excluded from git via `.gitignore`
- All report content is AES-256 encrypted before storage
- No IP addresses or device identifiers are stored with reports
- JWT tokens expire in 7 days

---

## 📞 Support

For questions about this project:
- **Student:** Lisawanny Lamin (DC2024MCA0040)
- **Institution:** Assam Don Bosco University, Guwahati
- **Department:** MCA, School of Technology

---

*Built with 🔒 for absolute whistleblower protection.*
