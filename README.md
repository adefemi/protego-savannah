# Protego History Sidepanel Chrome Extension

A Chrome extension that tracks your browsing history and displays page analytics in a convenient side panel. Built with React, FastAPI, and PostgreSQL.

## Disclaimer
Credentials are not stored in a .env file because I didn't deem it necessary. This is a simple project and I wanted to keep it as simple as possible.

## 🎯 Features

- **Automatic Page Tracking**: Records every page visit with timestamp
- **Page Analytics**: Displays real-time metrics:
  - Number of links (`<a>` tags)
  - Word count (visible text)
  - Number of images (`<img>` elements)
- **Visit History**: View all previous visits to the current page
- **Side Panel UI**: Clean, modern interface accessible from any tab
- **Local Backend**: All data stored locally in PostgreSQL

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   Chrome Extension (TypeScript)     │
│   • React 18 + TypeScript           │
│   • SCSS Styling                    │
│   • Modular Components              │
│   • Side Panel UI                   │
│   • Content Script                  │
│   • Background Service Worker       │
└──────────────┬──────────────────────┘
               │ HTTP API
               ↓
┌─────────────────────────────────────┐
│   FastAPI Backend                   │
│   • POST /api/visits                │
│   • GET  /api/visits?url=...        │
│   • GET  /api/metrics/current       │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   PostgreSQL Database               │
│   Table: page_visits                │
└─────────────────────────────────────┘
```

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js (v18 or higher)
- npm or yarn
- Chrome browser

## 🚀 Quick Start

### Automated Setup

Run the build script to set up everything:

```bash
./build.sh
```

This script will:
1. Build and start the Docker containers (PostgreSQL + FastAPI)
2. Install extension dependencies
3. Build the extension
4. Display instructions for loading the extension in Chrome

### Manual Setup

If you prefer manual setup or encounter issues:

#### 1. Start Backend Services

```bash
# Start PostgreSQL and FastAPI with Docker
docker-compose up -d --build

# Verify services are running
curl http://localhost:8000/health
```

#### 2. Build Extension

```bash
cd extension
npm install
npm run build
```

#### 3. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extension/dist` directory
5. The Protego extension should now appear in your extensions list

## 📖 Usage

### Opening the Side Panel

1. Click the Protego extension icon in the Chrome toolbar
2. The side panel will open on the right side of your browser
3. Navigate to any webpage to start tracking

### What Gets Tracked

When you visit any webpage, the extension automatically:
- Records the current timestamp
- Counts all links on the page
- Counts words in visible text
- Counts all images
- Sends this data to the local backend API

### Viewing History

The side panel displays:
- **Current Page**: The URL you're viewing
- **Page Metrics**: Current page statistics (links, words, images)
- **Visit History**: List of all previous visits to this URL with timestamps and metrics

### Refreshing Data

Click the 🔄 refresh button in the side panel to reload data for the current page.

## 🔧 Development

### Backend Development

```bash
# View backend logs
docker-compose logs -f backend

# Restart backend after code changes
docker-compose restart backend

# Access PostgreSQL
docker-compose exec db psql -U protego -d protego
```

### Extension Development

```bash
cd extension

# Install dependencies (first time only)
npm install

# Development mode with auto-rebuild
npm run dev

# Build for production (includes TypeScript compilation)
npm run build

# Preview build
npm run preview
```

After making changes:
1. Rebuild the extension with `npm run build`
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Protego extension

**TypeScript Features:**
- Strict type checking enabled
- Full IntelliSense support in VS Code
- Type-safe API calls and state management
- Component prop validation

## 📁 Project Structure

```
protego/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── crud.py          # Database operations
│   │   └── database.py      # Database connection
│   ├── Dockerfile
│   └── requirements.txt
├── extension/
│   ├── public/
│   │   ├── manifest.json    # Extension manifest v3
│   │   └── icons/           # Extension icons (SVG)
│   ├── src/
│   │   ├── types/
│   │   │   └── index.ts     # TypeScript definitions
│   │   ├── utils/
│   │   │   └── api.ts       # API utilities
│   │   ├── components/      # Modular React components
│   │   │   ├── Header/
│   │   │   ├── Loading/
│   │   │   ├── ErrorMessage/
│   │   │   ├── CurrentPage/
│   │   │   ├── MetricsGrid/
│   │   │   ├── VisitHistory/
│   │   │   └── Footer/
│   │   ├── sidepanel/       # React side panel
│   │   │   ├── App.tsx      # Main app (TypeScript)
│   │   │   ├── App.scss     # Global styles (SCSS)
│   │   │   └── main.tsx     # Entry point
│   │   ├── content/
│   │   │   └── content.ts   # Content script (TypeScript)
│   │   └── background/
│   │       └── background.ts # Service worker (TypeScript)
│   ├── package.json
│   ├── tsconfig.json        # TypeScript config
│   ├── vite.config.js       # Vite + TypeScript
│   └── sidepanel.html
├── docker-compose.yml
├── build.sh
├── README.md
└── ARCHITECTURE.md          # Detailed architecture docs
```

## 🔌 API Endpoints

### POST /api/visits
Store a new page visit with metrics.

**Request Body:**
```json
{
  "url": "https://example.com",
  "link_count": 42,
  "word_count": 1500,
  "image_count": 8
}
```

**Response:**
```json
{
  "id": 1,
  "url": "https://example.com",
  "datetime_visited": "2025-10-16T12:34:56.789Z",
  "link_count": 42,
  "word_count": 1500,
  "image_count": 8
}
```

### GET /api/visits?url={url}
Retrieve all visits for a specific URL.

**Response:**
```json
[
  {
    "id": 1,
    "url": "https://example.com",
    "datetime_visited": "2025-10-16T12:34:56.789Z",
    "link_count": 42,
    "word_count": 1500,
    "image_count": 8
  }
]
```

### GET /api/metrics/current?url={url}
Get the most recent metrics for a URL.

**Response:**
```json
{
  "link_count": 42,
  "word_count": 1500,
  "image_count": 8,
  "last_visited": "2025-10-16T12:34:56.789Z"
}
```

## 🧪 Testing

Test the extension on these reference websites:
- [UHCprovider.com](https://www.uhcprovider.com)
- [Ustekinumab - Aetna Medical Clinical Policy Bulletins](https://www.aetna.com/cpb/medical/data/600_699/0689.html)

### Manual Testing Steps

1. Load the extension in Chrome (developer mode)
2. Navigate to one of the test websites
3. Open the side panel by clicking the extension icon
4. Verify that:
   - Current page URL is displayed
   - Metrics are showing (links, words, images)
   - The visit is recorded in history
5. Refresh the page and open the side panel again
6. Verify that the new visit appears in history
7. Check that metrics are updated

## 🐛 Troubleshooting

### Backend not starting

```bash
# Check Docker logs
docker-compose logs backend

# Ensure PostgreSQL is healthy
docker-compose ps

# Restart services
docker-compose down
docker-compose up -d
```

### Extension not loading

1. Check that the build completed successfully
2. Ensure you're loading the `extension/dist` directory, not `extension`
3. Check browser console for errors (F12 → Console)
4. Try removing and re-adding the extension

### Side panel not showing data

1. Verify backend is running: `curl http://localhost:8000/health`
2. Check background worker console:
   - Go to `chrome://extensions/`
   - Click "Service worker" under the Protego extension
   - Check for error messages
3. Ensure CORS is properly configured in the backend

### Database connection issues

```bash
# Check if PostgreSQL is running
docker-compose ps db

# Access database directly
docker-compose exec db psql -U protego -d protego

# List tables
\dt

# Query page visits
SELECT * FROM page_visits LIMIT 10;
```

## 🛠️ Technologies Used

- **Frontend**: React 18, TypeScript 5.3, SCSS/Sass, Vite 5
- **Backend**: FastAPI, SQLAlchemy 2.0, Pydantic v2
- **Database**: PostgreSQL 15
- **DevOps**: Docker, Docker Compose
- **Chrome APIs**: Extension Manifest V3, Side Panel API, Content Scripts
- **Code Quality**: Strict TypeScript, ESM modules, modular components

## 📝 Design Decisions

- **TypeScript First**: Full type safety across the codebase for reliability
- **Modular Components**: Each component in its own directory with co-located styles
- **SCSS over CSS**: Better maintainability with nesting and variables
- **Single-user, local deployment**: No authentication or multi-user support needed
- **Full URL tracking**: URLs stored as complete strings (not hashed) for simplicity
- **Manifest V3**: Using service workers instead of background pages (Chrome requirement)
- **Component Structure**: Atomic design principles with clear separation of concerns
- **API Utilities**: Centralized API communication logic for consistency
- **Type Definitions**: Shared types across content script, background, and UI

## 📄 License

This project is for educational and evaluation purposes.

---

**Need help?** Check the troubleshooting section or review the Docker logs for detailed error messages.

