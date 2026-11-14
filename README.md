# MANGALURU BUS CONNECT 🚌📍
### AI-Powered City Bus Journey Planner for Mangaluru, Karnataka, India

> **Tagline:** *Your City. Your Route. Your Journey.*

---

## 1. Project Overview

**Mangaluru Bus Connect** is a full-stack, intelligent city transit journey planner engineered specifically for the public transportation ecosystem in Mangaluru (Kudla), Karnataka, India.

### The Problem
Commuters, students, and visitors in Mangaluru frequently struggle to navigate the extensive network of private city buses (governed by the Dakshina Kannada Bus Operators' Association — DKBOA) and KSRTC city services:
- Bus timings and direct vs. connecting options are rarely mapped digitally.
- Commuters frequently do not know where to transfer (e.g., Hampankatta, State Bank, or Lalbagh).
- Waiting durations between transfers can lead to missed connections.
- Existing general transit applications either lack private city bus coverage or misrepresent illustrative schedules as fake "live GPS tracking".

### The Solution
Mangaluru Bus Connect provides:
- **Instant Search Between Any Two Bus Stops** across urban and suburban Mangaluru.
- **Stage 1 — Direct Bus Discovery**: Finds non-stop routes between origin and destination.
- **Stage 2 — One-Transfer Graph Search**: Detects transfer points with realistic connection buffers (minimum 5-minute wait).
- **Stage 3 — Time-Dependent Multi-Criteria Ranking**: Sorts candidate journeys by earliest arrival time, total journey duration, fewest transfers, and fare.
- **Stage 4 — Fallback & Alternative Advice**: Intelligently suggests nearby boarding and destination stops within walking distance when no direct or 1-transfer schedule matches.
- **Interactive Leaflet & OpenStreetMap**: Visualizes route lines, boarding points, transfer hubs, and stop markers with real geographic coordinates.
- **Honest Uncertainty & Delay Indicators**: Clearly distinguishes published schedules, peak-hour traffic warnings, and demonstration data without fake GPS tracking claims.
- **Admin Management Portal**: Role-based portal for transport authorities to manage bus stops, routes, sequential stops, and timetable departures.
- **Commuter Features**: User registration, login, favorite journey bookmarks, and search history.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React icons, React Router v6 |
| **Mapping** | Leaflet.js, React-Leaflet, OpenStreetMap |
| **Backend** | Python 3.9+, Flask, Flask-RESTful patterns, Flask-CORS |
| **Database & ORM** | SQLite (development) / PostgreSQL (production), SQLAlchemy 2.x |
| **Authentication** | JWT (JSON Web Tokens), Werkzeug password hashing (PBKDF2 SHA-256) |
| **Testing** | Pytest, Flask Test Client, automated integration test suites |

---

## 3. Project Structure

```
mangaluru-bus-connect/
├── backend/
│   ├── app/
│   │   ├── __init__.py           # Flask app factory, CORS, and blueprint registration
│   │   ├── config.py             # App config, database URIs, JWT secrets
│   │   ├── models/               # SQLAlchemy database models
│   │   │   ├── __init__.py
│   │   │   ├── user.py           # User model with password hashing and JWT
│   │   │   ├── stop.py           # BusStop model with lat/lng coordinates
│   │   │   ├── route.py          # BusRoute, RouteStop sequence, BusService
│   │   │   └── user_data.py      # SavedJourneys and SearchHistory
│   │   ├── algorithms/
│   │   │   ├── __init__.py
│   │   │   └── journey_planner.py# Directed graph, direct & 1-transfer routing
│   │   ├── routes/               # REST API blueprints
│   │   │   ├── __init__.py
│   │   │   ├── auth.py           # /api/auth (register, login, me)
│   │   │   ├── stops.py          # /api/stops (CRUD for bus stops)
│   │   │   ├── routes.py         # /api/routes (routes, stops, timetables)
│   │   │   ├── journeys.py       # /api/journey (journey search, stats)
│   │   │   ├── user.py           # /api/user (favorites, search history)
│   │   │   └── admin.py          # /api/admin (stats, users, timetable verification)
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   └── auth_helpers.py   # JWT decorators: @token_required, @admin_required
│   │   └── seeds/
│   │       ├── __init__.py
│   │       └── seed_data.py      # Authentic Mangaluru seed data & demo accounts
│   ├── tests/
│   │   ├── test_planner.py       # Pytest unit tests for the routing engine
│   │   └── integration_check.py  # End-to-end integration check script
│   ├── requirements.txt
│   ├── run.py                    # Backend server entry point
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js         # Fetch client with auto JWT authorization header
│   │   │   └── services.js       # Modular service calls (auth, stops, routes, journey)
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global authentication state provider
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Responsive navigation with branding and mobile menu
│   │   │   ├── Footer.jsx        # Footer with Mangaluru hub information
│   │   │   ├── SearchCard.jsx    # Autocomplete stop search with swap & time picker
│   │   │   ├── JourneyCard.jsx   # Direct vs 1-transfer cards with step-by-step view
│   │   │   ├── LeafletMap.jsx    # Interactive OpenStreetMap with color-coded segments
│   │   │   ├── UncertaintyBadge.jsx# On Time, Possible Delay, and Demo badges
│   │   │   ├── DemoDataNotice.jsx# Transparent disclaimer banner
│   │   │   └── ProtectedRoute.jsx# Route protection for user profile and admin
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Hero, search, stats, popular hubs, how it works
│   │   │   ├── JourneyResults.jsx# Journey planner results with sticky Leaflet map
│   │   │   ├── BusRoutes.jsx     # Route directory with filter and sequential timeline
│   │   │   ├── About.jsx         # Mangaluru transit context and routing architecture
│   │   │   ├── Contact.jsx       # Helpdesk, transit helpline, feedback form
│   │   │   ├── Login.jsx         # Sign in with 1-click demo account fill
│   │   │   ├── Register.jsx      # Commuter registration form
│   │   │   ├── Profile.jsx       # Saved journeys and search history
│   │   │   └── AdminDashboard.jsx# Full CRUD on stops, routes, timetables, verify toggle
│   │   ├── App.jsx               # React Router layout
│   │   ├── main.jsx
│   │   └── index.css             # Tailwind & custom Leaflet map styling
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── README.md
├── .gitignore
└── .env.example
```

---

## 4. Demonstration Data & Built-in Accounts

The database auto-seeds upon initial startup with realistic Mangaluru bus stops, verified GPS coordinates, routes, and departure schedules.

### Verified Bus Stops in Mangaluru Network
- **State Bank** (`12.8617, 74.8378`) — Primary City Bus Terminal Hub
- **Hampankatta** (`12.8698, 74.8431`) — Commercial Center & Central Transit Point
- **Mangaluru Central** (`12.8633, 74.8465`) — Central Railway Station (MAQ), Attavar
- **Mangaluru Junction** (`12.8623, 74.8872`) — Railway Station (MAJN), Kankanady
- **Kankanady** (`12.8647, 74.8624`) — Fr Muller Hospital & Market
- **Pumpwell** (`12.8615, 74.8724`) — Mahaveera Circle / NH-66 Intersection
- **Kadri** (`12.8841, 74.8583`) — Kadri Manjunatha Temple & Kadri Park
- **Bejai** (`12.8856, 74.8485`) — KSRTC Inter-state Bus Terminal
- **Lalbagh** (`12.8795, 74.8427`) — Mangaluru City Corporation (MCC) & MG Road
- **Ladyhill** (`12.8885, 74.8360`) — Ladyhill Circle / St. Aloysius Urwa
- **Urwa Market** (`12.8943, 74.8322`) — Urwa Stores & Residential Market
- **Kottara Chowki** (`12.9056, 74.8385`) — NH-66 Intersection & Infosys
- **Surathkal** (`13.0113, 74.7937`) — NITK Campus, Lighthouse & Beach Road
- **Ullal** (`12.8062, 74.8569`) — Rani Abbakka Circle & Summer Sands
- **Bunder** (`12.8631, 74.8335`) — Old Port & Fisheries Dock
- **Pilikula** (`12.9287, 74.9015`) — Pilikula Nisargadhama Biological Park

### Pre-Configured Demo Accounts
| Role | Email | Password | Access |
|---|---|---|---|
| **Administrator** | `admin@mangaluru.gov.in` | `admin123` | Full admin portal, add/edit stops, routes, timetables, toggle verification |
| **Commuter** | `commuter@mangaluru.in` | `user123` | Save favorite journeys, view search history, plan trips |

*(Quick-fill buttons are provided on the Login page for 1-click testing).*

---

## 5. Local Setup and Installation

### Prerequisites
- **Python 3.9+**
- **Node.js v18+** & **npm**

### Step 1: Clone or Navigate to Project
```bash
cd "mangaluru bus connect"
```

### Step 2: Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start Flask Backend (Default Port: 5001)
PORT=5001 python3 run.py
```
*The database `mangaluru_bus.db` is initialized and seeded automatically.*

### Step 3: Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install

# Start Vite Development Server (Port: 5173)
npm run dev
```

Open your browser at **`http://localhost:5173`**. The Vite proxy automatically forwards `/api/*` calls to the backend on `http://localhost:5001`.

---

## 6. Running the Automated Tests

### Backend Unit Tests (Pytest)
```bash
PYTHONPATH=backend backend/venv/bin/pytest backend/tests
```
**Test coverage includes:**
- Direct bus connection discovery (e.g., State Bank ➔ Kadri).
- 1-transfer connection discovery (e.g., Kadri ➔ Surathkal via Lalbagh or Hampankatta).
- Same source and destination input validation.
- Fallback suggestions when no scheduled service is active (late night).
- Time format conversions and calculation of waiting intervals.
- User authentication, JWT issuance, and favorite saving.

### Full-Stack Integration Verification
```bash
PYTHONPATH=backend backend/venv/bin/python3 backend/tests/integration_check.py
```

### Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 7. Core REST API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new commuter account
- `POST /api/auth/login` — Sign in and obtain JWT access token
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Get authenticated user details

### Bus Stops
- `GET /api/stops` — List all active bus stops (supports `?query=` filter)
- `GET /api/stops/:id` — Get bus stop details
- `POST /api/stops` — *Admin:* Add new bus stop with coordinates
- `PUT /api/stops/:id` — *Admin:* Update bus stop
- `DELETE /api/stops/:id` — *Admin:* Remove bus stop

### Bus Routes & Timetables
- `GET /api/routes` — List all routes with sequential stops and departures
- `GET /api/routes/:id` — Detailed route information
- `POST /api/routes` — *Admin:* Create a new route
- `PUT /api/routes/:id` — *Admin:* Update route details
- `DELETE /api/routes/:id` — *Admin:* Delete route
- `POST /api/routes/:id/stops` — *Admin:* Add stop to sequence with offset minutes
- `POST /api/routes/:id/services` — *Admin:* Add scheduled departure trip

### Journey Planner
- `POST /api/journey/search` — Execute graph route discovery:
  ```json
  {
    "source_stop_id": 1,
    "destination_stop_id": 6,
    "departure_time": "08:30",
    "day_of_week": "Mon"
  }
  ```
- `GET /api/journey/stats` — Real-time database metrics (stops, routes, services)

### User Profile
- `GET /api/user/favorites` — Get commuter's saved journeys
- `POST /api/user/favorites` — Bookmark a journey
- `DELETE /api/user/favorites/:id` — Remove saved journey
- `GET /api/user/history` — Get recent search logs
- `DELETE /api/user/history/clear` — Clear search history

### Admin Operations
- `GET /api/admin/dashboard` — Platform overview stats and verification breakdown
- `GET /api/admin/users` — List registered commuters
- `PUT /api/admin/services/:id/verify` — Toggle between `DEMO DATA` and `VERIFIED`
- `DELETE /api/admin/services/:id` — Remove timetable departure

---

## 8. Deployment Guide

### Backend Deployment (Render)
1. Push repository to GitHub.
2. In Render Dashboard, click **New + ➔ Web Service**.
3. Set **Root Directory** to `backend`.
4. Set **Build Command** to:
   ```bash
   pip install -r requirements.txt
   ```
5. Set **Start Command** to:
   ```bash
   gunicorn run:app
   ```
6. Set Environment Variables:
   - `SECRET_KEY`: `<secure-random-string>`
   - `JWT_SECRET`: `<secure-jwt-key>`
   - `DATABASE_URL`: PostgreSQL connection string (or Render Managed PostgreSQL)
   - `FLASK_DEBUG`: `false`

### Frontend Deployment (Vercel)
1. In Vercel Dashboard, import the Git repository.
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Add Environment Variable:
   - `VITE_API_URL`: `https://your-render-backend-url.onrender.com`
5. Click **Deploy**.

---

## 9. Data Integrity & Transparent Uncertainty

- **No Fabricated Live Tracking**: Unlike apps that fake moving bus icons on a map, Mangaluru Bus Connect clearly labels arrival times as **"Schedule-Based Estimates"**.
- **Peak-Hour Traffic Awareness**: Searches departing during Mangaluru morning rush (`08:30 – 10:30 AM`) or evening rush (`17:00 – 19:30 PM`) display a **"Possible Delay"** warning.
- **Demonstration Data Notice**: All unverified schedules carry a visible **DEMO DATA** notice so passengers and reviewers understand data origin. Administrators can toggle records to **VERIFIED** as official timetable data is updated.

---

## 10. License & Acknowledgements
- Developed for **Mangaluru Bus Connect**.
- Map data by © [OpenStreetMap](https://www.openstreetmap.org) contributors.
- Inspired by the vibrant public bus network of Dakshina Kannada, Karnataka.
