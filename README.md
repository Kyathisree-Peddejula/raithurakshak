# ⚡ RaithuRakshak — Farmer Lightning Safety Platform

> *"Rakshak"* means **Protector** in Telugu and Hindi.
> RaithuRakshak is a digital guardian for India's farming communities against the silent killer — **lightning strikes**.

---

## 🌾 Project Overview

**RaithuRakshak** is a full-stack web application designed for district-level emergency management teams to monitor, protect, and respond to lightning-related emergencies in rural farming communities across India.

The platform gives district officers a command center to:
- Register farmers with GPS coordinates and emergency contacts
- Monitor real-time weather and lightning risk by district
- Issue district-wide lightning risk alerts with severity levels
- Track farmer last-known locations
- Report and resolve emergencies (lightning strikes, medical incidents, missing persons)
- View a live dashboard with critical metrics

The system is purpose-built for low-bandwidth, high-urgency operational environments — keeping the UI clear, fast, and actionable.

---

## 🌩️ Real-World Inspiration

India accounts for roughly **33–40% of global lightning deaths** each year. The majority of victims are **farmers working in open fields** during monsoon season — particularly in states like Andhra Pradesh, Telangana, Odisha, Bihar, and Jharkhand.

Key facts that inspired this project:
- India records **2,000–2,500 lightning deaths annually**, with farmers making up the largest victim group (India Meteorological Department data)
- Many farmers are unreachable by conventional warning systems — no smartphones, no reliable internet, no early warning
- District emergency teams often have **no centralized system** to know which farmers are in high-risk zones at any given moment
- Family members often learn of incidents hours later, with no emergency contact system in place

RaithuRakshak addresses the **information gap** between meteorological data and the people on the ground who need to act on it.

---

## ❗ Problem Statement

Existing weather warning systems in India are designed for urban populations and smartphone users. They fail rural farming communities for three reasons:

1. **No farmer-level visibility** — Governments know a district has a lightning risk, but not which specific farmers are currently in fields
2. **No emergency response chain** — When a farmer is struck, there is no system to alert family members or log the incident for official response
3. **No operational command tool** — District officers manage emergencies over phone calls and paper registers, with no real-time dashboard

There is a critical need for a **lightweight, web-based operational platform** that works on any device, centralizes farmer data, and enables rapid emergency response — without requiring farmers themselves to own smartphones.

---

## 🎯 Objectives

1. Build a **centralized farmer registry** with GPS coordinates and emergency contact information
2. Provide **district-level weather and lightning risk monitoring** to identify high-danger zones
3. Enable **rapid alert issuance** so district officers can broadcast warnings by severity level
4. Create a **real-time emergency reporting and resolution workflow** for field incidents
5. Track **last-known locations** of registered farmers for search and rescue operations
6. Deliver a **responsive, accessible dashboard** usable on any device, including basic laptops and tablets

---

## ✨ Features

### 🏠 District Command Dashboard
- Live summary cards: active farmers, active emergencies, lightning alerts, critical districts
- District Risk Assessment table with color-coded severity levels
- Recent Alerts Feed combining lightning and emergency events in chronological order

### 👨‍🌾 Farmer Registry
- Register farmers with name, phone, Aadhaar ID (optional), village, district, state, and GPS coordinates
- View, edit, and deactivate farmer profiles
- Search and filter across all registered farmers
- Full farmer detail view with linked family members

### 👨‍👩‍👦 Family Member Management
- Link multiple family members to each farmer as emergency contacts
- Store relationship type and contact number
- View all family contacts across the system from a single page

### 🌤️ Weather Radar
- Per-district weather cards showing temperature, humidity, wind speed, and overall condition
- Lightning risk level displayed prominently on each card (Critical / High / Medium / Low)
- Color-coded cards to highlight dangerous districts at a glance

### ⚡ Lightning Risk Alerts
- Issue district-wide lightning alerts with severity: Critical, High, Medium, or Low
- Write detailed alert messages for broadcast
- Activate and deactivate alerts as conditions change
- Full alert history with timestamps

### 🚨 Emergency Alerts
- Report emergencies linked to specific registered farmers
- Three emergency types: Lightning Strike, Medical, Missing Person
- Attach GPS coordinates to each emergency
- Resolve emergencies with one click and maintain a full resolution history

### 📍 Live Locations
- Record and view last-known GPS coordinates for all active farmers
- Location table with district, village, coordinates, and time of last update
- Update a farmer's location from a simple input form

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Browser (React)                       │
│  Dashboard | Farmers | Weather | Alerts | Locations       │
│                   React Query Hooks                       │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP / JSON
                         ▼
┌──────────────────────────────────────────────────────────┐
│            Reverse Proxy / API Gateway                   │
│          Routes /api/* → Port 8080                        │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│               Express.js API Server                       │
│  /api/farmers   /api/weather   /api/locations             │
│  /api/alerts    /api/dashboard /api/family                │
│         Zod validation on all inputs/outputs              │
└────────────────────────┬─────────────────────────────────┘
                         │ Drizzle ORM
                         ▼
┌──────────────────────────────────────────────────────────┐
│              PostgreSQL Database                           │
│  farmers | family_members | locations                     │
│  lightning_alerts | emergency_alerts | weather_data       │
└──────────────────────────────────────────────────────────┘
```

### Contract-First API Design

The API is defined first in a single OpenAPI specification (`lib/api-spec/openapi.yaml`). From this file, typed React Query hooks and Zod validation schemas are **auto-generated** using Orval. This means the frontend and backend are always in sync — if the API changes, the types update automatically.

```
openapi.yaml  →  codegen  →  TypeScript hooks + Zod schemas
                              (used by both frontend and backend)
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI component framework |
| Vite | Development server and build tool |
| TypeScript | Type-safe JavaScript |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Accessible UI component library |
| React Query (TanStack) | Server state management and caching |
| Wouter | Lightweight client-side routing |
| date-fns | Date formatting |

### Backend
| Technology | Purpose |
|---|---|
| Node.js 24 | JavaScript runtime |
| Express 5 | HTTP server framework |
| TypeScript | Type-safe server code |
| Zod | Request/response validation |
| Pino | Structured JSON logging |
| esbuild | Fast production bundler |

### Database & ORM
| Technology | Purpose |
|---|---|
| PostgreSQL | Relational database |
| Drizzle ORM | Type-safe database queries |
| drizzle-zod | Auto-generates Zod schemas from DB tables |
| drizzle-kit | Schema migration and push tooling |

### API & Code Generation
| Technology | Purpose |
|---|---|
| OpenAPI 3.1 | API contract specification |
| Orval | Generates React Query hooks from OpenAPI spec |

### Monorepo & Tooling
| Technology | Purpose |
|---|---|
| pnpm workspaces | Monorepo package management |
| TypeScript project references | Cross-package type safety |

---

## 🗄️ Database Design

### Entity Relationship Overview

```
farmers (1) ──────< family_members
farmers (1) ──────< locations
farmers (1) ──────< emergency_alerts
districts  ────── lightning_alerts (by district name)
districts  ────── weather_data (by district name)
```

### Table Definitions

#### `farmers`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | Auto-increment ID |
| `name` | TEXT NOT NULL | Full name |
| `phone` | TEXT NOT NULL | Contact number |
| `aadhaar` | TEXT | Aadhaar ID (optional) |
| `village` | TEXT NOT NULL | Village name |
| `district` | TEXT NOT NULL | District name |
| `state` | TEXT NOT NULL | State name |
| `lat` | NUMERIC | GPS latitude |
| `lng` | NUMERIC | GPS longitude |
| `is_active` | BOOLEAN | Whether farmer is currently active |
| `registered_at` | TIMESTAMP | Registration timestamp |

#### `family_members`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | Auto-increment ID |
| `farmer_id` | INTEGER (FK → farmers) | Linked farmer |
| `name` | TEXT NOT NULL | Family member name |
| `relationship` | TEXT NOT NULL | e.g. Wife, Son, Brother |
| `phone` | TEXT NOT NULL | Contact number |

#### `locations`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | Auto-increment ID |
| `farmer_id` | INTEGER (FK → farmers) | Linked farmer |
| `lat` | NUMERIC NOT NULL | GPS latitude |
| `lng` | NUMERIC NOT NULL | GPS longitude |
| `recorded_at` | TIMESTAMP | When location was recorded |

#### `lightning_alerts`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | Auto-increment ID |
| `district` | TEXT NOT NULL | Target district |
| `severity` | TEXT NOT NULL | critical / high / medium / low |
| `message` | TEXT NOT NULL | Alert message |
| `is_active` | BOOLEAN | Whether alert is still active |
| `created_at` | TIMESTAMP | When alert was issued |

#### `emergency_alerts`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | Auto-increment ID |
| `farmer_id` | INTEGER (FK → farmers) | Affected farmer |
| `type` | TEXT NOT NULL | lightning_strike / medical / missing |
| `message` | TEXT NOT NULL | Incident description |
| `lat` | NUMERIC | Incident GPS latitude |
| `lng` | NUMERIC | Incident GPS longitude |
| `is_resolved` | BOOLEAN | Whether emergency has been resolved |
| `created_at` | TIMESTAMP | When incident was reported |

#### `weather_data`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | Auto-increment ID |
| `district` | TEXT UNIQUE NOT NULL | District name (one row per district) |
| `temperature` | NUMERIC | Temperature in °C |
| `humidity` | NUMERIC | Humidity percentage |
| `wind_speed` | NUMERIC | Wind speed in km/h |
| `lightning_risk` | TEXT | critical / high / medium / low |
| `condition` | TEXT | Human-readable condition string |
| `updated_at` | TIMESTAMP | Last update timestamp |

---

## 🔌 API Structure

All endpoints are prefixed with `/api`.

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Active farmers, emergencies, alerts counts |
| GET | `/api/dashboard/district-risk` | Per-district risk assessment |
| GET | `/api/dashboard/recent-alerts` | Latest 10 lightning + emergency alerts |

### Farmers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/farmers` | List all farmers |
| POST | `/api/farmers` | Register a new farmer |
| GET | `/api/farmers/:id` | Get a farmer by ID |
| PUT | `/api/farmers/:id` | Update farmer details |
| DELETE | `/api/farmers/:id` | Remove a farmer |

### Family Members
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/farmers/:id/family` | List family members for a farmer |
| POST | `/api/farmers/:id/family` | Add a family member |
| DELETE | `/api/family/:id` | Remove a family member |

### Locations
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/locations` | Latest location for every farmer |
| POST | `/api/locations` | Record a new location entry |

### Lightning Alerts
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/alerts/lightning` | List all lightning alerts |
| POST | `/api/alerts/lightning` | Issue a new lightning alert |
| PUT | `/api/alerts/lightning/:id` | Update an alert (activate/deactivate) |
| DELETE | `/api/alerts/lightning/:id` | Delete an alert |

### Emergency Alerts
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/alerts/emergency` | List all emergency alerts |
| POST | `/api/alerts/emergency` | Report a new emergency |
| PUT | `/api/alerts/emergency/:id` | Update (e.g. mark as resolved) |
| DELETE | `/api/alerts/emergency/:id` | Delete an emergency record |

### Weather
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/weather` | Get weather data for all districts |
| POST | `/api/weather` | Add or update weather for a district |

---

## 🚀 Installation Guide

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or higher
- [pnpm](https://pnpm.io/) v9 or higher
- A PostgreSQL database (local or cloud)

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/Kyathisree-Peddejula/raithurakshak.git
cd raithurakshak
```

**2. Install dependencies**
```bash
pnpm install
```

**3. Set up environment variables**

Create a `.env` file in the root (or set in your hosting provider):
```
DATABASE_URL=postgresql://username:password@localhost:5432/raithurakshak
SESSION_SECRET=your-random-secret-string
```

**4. Push the database schema**
```bash
pnpm --filter @workspace/db run push
```

**5. Start the API server**
```bash
pnpm --filter @workspace/api-server run dev
```

**6. Start the frontend (in a new terminal)**
```bash
pnpm --filter @workspace/raithu-rakshak run dev
```

**7. Open the app**

Navigate to `http://localhost:23658` in your browser.

### Optional: Regenerate API code after spec changes

If you edit `lib/api-spec/openapi.yaml`, regenerate the TypeScript hooks:
```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## 🔭 Future Enhancements

| Enhancement | Description |
|---|---|
| **SMS Alerts** | Integrate Twilio or MSG91 to send SMS warnings directly to farmers' family members when a critical alert is issued |
| **Live Weather API** | Connect to India Meteorological Department (IMD) or OpenWeatherMap to auto-populate weather data instead of manual entry |
| **Mobile App** | React Native / Expo companion app for field officers to log locations and report emergencies from the field |
| **GPS Map View** | Replace the location table with an interactive Leaflet.js map showing all farmer positions and high-risk zones |
| **Role-Based Access** | Separate login roles for district officers, state supervisors, and field workers with different permissions |
| **Alert Broadcasting** | WhatsApp/IVR (Interactive Voice Response) integration to reach farmers directly in local languages |
| **Historical Analytics** | Charts showing lightning incident trends by district, month, and crop season |
| **Offline Mode** | Progressive Web App (PWA) with service worker caching so field officers can log data without internet and sync later |
| **AI Risk Prediction** | Train a model on historical lightning + weather data to predict high-risk windows 24–48 hours in advance |
| **Multi-language Support** | Telugu, Hindi, Kannada, and Odia UI translations for district staff who prefer regional languages |

---

## 📊 Project Stats

| Metric | Count |
|---|---|
| Database Tables | 6 |
| API Endpoints | 22 |
| Frontend Pages | 9 |
| Supported Districts | Unlimited |
| Emergency Types | 3 (Lightning Strike, Medical, Missing) |
| Alert Severity Levels | 4 (Critical, High, Medium, Low) |


---

<div align="center">

**Built with ❤️ to protect India's farmers.**

*RaithuRakshak — Because every farmer deserves a guardian.*

</div>
