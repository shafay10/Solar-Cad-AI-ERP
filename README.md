# ⚡ Solar ERP Platform (C&I & Utility Scale)

[![Version](https://img.shields.io/badge/version-2.0.0--ENTERPRISE-emerald.svg?style=for-the-badge)](https://github.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-CAD_3D-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![License](https://img.shields.io/badge/license-Proprietary-blue.svg?style=for-the-badge)](#)

> **Next-Generation Solar Enterprise Resource Planning (ERP), CAD Simulation, and Engineering Platform** built for Commercial & Industrial (C&I) and Utility-Scale solar developers, EPC contractors, and design engineers.

---

## 🌟 Executive Overview

The **Solar ERP Platform** streamlines the entire solar project delivery lifecycle—from initial satellite photogrammetry and field survey to 2D/3D CAD solar string design, multi-tier Bill of Quantities (BOQ) generation, 25-year financial yield projection, cryptographic proposal sealing, and automated client-ready PDF generation.

Designed with an executive dark-glassmorphism theme, bilingual localization support (English & Urdu RTL), and zero-dummy-data architecture for high-stakes enterprise deployments.

---

## 🚀 Core Modules & Capabilities

### 📱 1. Mobile PWA Field Survey & Photogrammetry
* **High-Resolution Satellite Maps**: Dual-mode ESRI World Imagery and OpenStreetMap tile engines with GPS site coordinate locking.
* **Shoelace Polygon Engine**: Real-time vertex-by-vertex boundary tracing calculating usable rooftop/ground area in both $\text{sq ft}$ and $\text{m}^2$.
* **Hardware Gyroscope Integration**: Connects to the HTML5 `DeviceOrientationEvent` to read real-time rooftop pitch ($0^\circ–90^\circ$) and azimuth compass orientation ($0^\circ–360^\circ$) with fallback calibration sliders.
* **Categorized Site Media Vault**: 6 distinct photo dropzones (`Roof Surface`, `Electrical Panel`, `Cable Route`, `Inverter Location`, `Transformer`, `Obstructions`) with direct preview and geo-tag metadata.

### ☀️ 2. HelioScope CAD & 3D Shading Simulation
* **2D Canvas & 3D Viewport**: Interactive 2D layout planning combined with Three.js-powered 3D rooftop visualization with realistic lighting, shadows, and tilt adjustments.
* **N-Type TOPCon & Bifacial Module Library**: Tier-1 module database (550W, 585W, 650W, 700W) with bifaciality gain modeling ($10\%–25\%$).
* **Temperature-Corrected String Sizing**:
  * **Winter $V_{oc}$ Safety Check** (evaluated at $-5^\circ\text{C}$): Ensures open-circuit voltage never exceeds inverter limits ($V_{max} \le 1100\text{V}$).
  * **Summer $V_{mp}$ MPPT Window** (evaluated at $+55^\circ\text{C}$): Guarantees string operational voltage stays securely within the inverter MPPT tracker sweet spot ($500\text{V}–1000\text{V}$).
  * Temperature coefficient processing: $\gamma_{voc} = -0.28\%/^\circ\text{C}$.
* **Automated Inverter Sizing**: Recommends optimal inverter capacities, DC-to-AC ratios (1.15–1.35), and string configurations with single-click optimization.

### 📊 3. Dynamic L1 / L2 / L3 Multi-Tier BOQ Engine (PKR)
* **Dynamic Capacity Scaling**: Intelligently scales from 5 kW residential net-metered arrays to 50+ MW utility installations.
* **Hierarchical Detail Levels**:
  * **L1 (Executive Summary)**: Turnkey rates, price-per-watt ($\text{PKR/W}$), total investment capital.
  * **L2 (Component Level)**: PV modules, inverter units, HDG elevated steel mounting structure, DC/AC XLPO cabling, and switchgear.
  * **L3 (Industrial EPC Specification)**: SS304 mid/end clamps, perforated GI cable trays, chemical earthing pits ($< 1\,\Omega$), C25/30 reinforced plinths ($\text{m}^3$), lightning arrestors, and SCADA monitoring stations.

### 📈 4. 25-Year Financial Yield & ESG Analytics
* **Lifecycle Financial Modeling**:
  * Compounded annual module degradation ($0.5\%/\text{year}$).
  * Utility grid tariff escalation ($3.5\%–8\%/\text{year}$).
  * Scheduled OPEX and inverter replacement sinking fund ($1.2\%/\text{year}$).
* **Key Financial Metrics**:
  * **Net Present Value (NPV)** discounted at customizable weighted average cost of capital ($9.0\%–12\%$).
  * **Internal Rate of Return (IRR)** and **Levelized Cost of Energy (LCOE)** against utility baseline.
  * **Payback Period**: Accurate break-even calculation in years and months.
* **Environmental Impact (ESG)**: Lifetime and annual metric tons of $\text{CO}_2$ emissions avoided with equivalent tree plantation metrics.
* **Interactive Cash Flow Graph**: Visual break-even and cumulative cash flow trajectory.

### 🔒 5. Enterprise Security & Cryptographic Proposal Sealing
* **Role-Based Access Control (RBAC)**: Four strict user roles:
  * `SUPER_ADMIN` (Sole system authority)
  * `SURVEY_ENGINEER` (Field data & measurements)
  * `DESIGN_ENGINEER` (CAD layout & electrical stringing)
  * `SALES_MANAGER` (Quotations & client proposals)
* **Cryptographic Proposal Sealing**: Proposals are locked by executive password. When sealed (`is_locked = true`), capacities, pricing, and BOQ items cannot be tampered with.
* **Immutable Audit Trail**: Logs every administrative action, user ID, role, timestamp, client IP, and diff history.

### 📄 6. Branded PDF Proposal & Quotation Engine
* Automated vector PDF generation using `jsPDF` and `AutoTable`.
* Produces enterprise-grade proposals complete with company branding, executive summaries, stringing tables, detailed BOQ schedules, and financial forecasts.

### 🤖 7. AI Solar Copilot (Groq / Gemini)
* Real-time conversational AI drawer providing immediate solar design validation, engineering suggestions, string safety audits, and financial explanations.
* Dynamic model discovery with fallbacks between high-speed Groq LLaMA models and Google Gemini.

---

## 🏗️ Architecture & Tech Stack

```
solar-erp-platform/
├── backend/
│   ├── config/              # Server configuration and DB client
│   ├── database/            # SQL schema & local JSON store fallback
│   ├── middleware/          # JWT auth & RBAC validation middleware
│   ├── routes/              # Express REST API endpoints
│   ├── services/            # BOQ, Financial, and CAD calculation engines
│   ├── server.js            # Express application bootstrap
│   └── .env.example         # Backend environment template
│
├── frontend/
│   ├── public/              # Static assets, logos, and vector drawings
│   ├── src/
│   │   ├── components/      # UI Modules (CAD, BOQ, Survey, Financial, Copilot)
│   │   ├── context/         # Language and Theme context providers
│   │   ├── services/        # Frontend solar engines & 3D environments
│   │   ├── utils/           # PDF export, date formatters, and math helpers
│   │   ├── App.jsx          # Root dashboard controller
│   │   └── main.jsx         # Vite DOM entrypoint
│   ├── tailwind.config.js   # Custom dark glassmorphic design system
│   ├── vite.config.js       # Vite bundler configuration
│   └── .env.example         # Frontend environment template
│
├── SECURITY_HANDOVER.md     # Production handover & security instructions
├── package.json             # Root monorepo workspace orchestration
└── README.md                # Platform documentation
```

### Technology Matrix

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 18, Vite 5, Tailwind CSS |
| **CAD & Visualization** | Three.js, HTML5 2D Canvas, Leaflet.js (ESRI & OSM) |
| **Icons & UI** | Lucide React, Glassmorphic Design System |
| **Document Generation** | jsPDF, jsPDF-AutoTable, html2canvas |
| **Backend Runtime** | Node.js 18+, Express 4.x |
| **Security & Auth** | JWT (JSON Web Tokens), Bcrypt.js, RBAC Middleware |
| **Database Support** | PostgreSQL / Supabase (Prisma ORM) + JSON Store fallback |
| **AI Copilot** | Groq API / Google Gemini API |

---

## ⚙️ Quick Start Guide

### Prerequisites
* **Node.js** v18.0.0 or higher
* **npm** (v9+) or **yarn**
* *(Optional)* PostgreSQL 14+ or Supabase instance

---

### 1. Installation

Clone the repository and install dependencies for both frontend and backend:

```bash
# Clone the repository
git clone <YOUR_GITHUB_REPO_URL>
cd solar-erp-platform

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root directory
cd ..
```

---

### 2. Environment Configuration

#### Backend Setup:
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your settings:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/solar_erp?schema=public"
JWT_SECRET="your-super-secret-enterprise-jwt-key"
JWT_EXPIRES_IN="8h"
```

#### Frontend Setup:
```bash
cp frontend/.env.example frontend/.env
```
Edit `frontend/.env` (optional for AI Copilot):
```env
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

---

### 3. Running the Application

You can start both services from the root directory:

```bash
# Terminal 1: Start Backend Server (runs on http://localhost:5000)
npm run start:backend

# Terminal 2: Start Frontend Application (runs on http://localhost:3000)
npm run start:frontend
```

Or run them individually inside each folder:
```bash
# In /backend
npm start

# In /frontend
npm run dev
```

Open your browser at **`http://localhost:3000`** to access the Solar ERP Platform.

---

## 📡 REST API Reference

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health check and version status | Public |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT token | Public |
| `POST` | `/api/auth/register` | Register new user account | Public |
| `GET` | `/api/projects` | Fetch all solar projects | Authenticated |
| `POST` | `/api/projects` | Create a new solar project | Authenticated |
| `PUT` | `/api/projects/:id` | Update project parameters | Authenticated |
| `DELETE`| `/api/projects/:id` | Remove a project | SUPER_ADMIN |
| `POST` | `/api/surveys/calculate-area` | Shoelace formula polygon area calculation | Authenticated |
| `POST` | `/api/cad/validate-strings` | Validate temperature-corrected stringing voltages | Authenticated |
| `POST` | `/api/boq/calculate` | Compute L1/L2/L3 multi-scale bill of quantities | Authenticated |
| `POST` | `/api/financial/calculate` | 25-year financial ROI, NPV, IRR, and ESG yield | Authenticated |
| `POST` | `/api/proposals/seal` | Seal proposal with executive approval password | SUPER_ADMIN |
| `POST` | `/api/proposals/unlock` | Unlock sealed proposal | SUPER_ADMIN |
| `GET` | `/api/audit/logs` | Query immutable system audit trails | SUPER_ADMIN |

---

## 🔐 Security & Administration

For detailed administrative onboarding, default credentials, executive password change procedures, and security handover checklists, please refer to [`SECURITY_HANDOVER.md`](./SECURITY_HANDOVER.md).

> ⚠️ **Important**: Immediately change all default administrative passwords upon deploying to production.

---

## 🧪 Testing & Verification

Run the verification suites to validate mathematical models, string calculations, and database integrity:

```bash
# Run backend verification test
node backend/test-verification.mjs

# Verify frontend production build
npm run build:frontend
```

---

## 📄 License

This software is proprietary and confidential. Unauthorized copying, modification, or distribution is strictly prohibited.

**Built with ☀️ for Green Tech Power & Clean Energy Engineers.**

