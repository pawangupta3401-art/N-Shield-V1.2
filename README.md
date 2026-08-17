# Nagpur City Command Center

AI-Powered Urban Safety Intelligence dashboard for Nagpur City — built for hackathon demos with a cinematic dark-mode command center UI and a 3D Mapbox digital twin.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Lucide React** (icons)
- **React-Map-GL** + **Mapbox GL JS** (3D map)
- **Deck.gl** (sensor node overlay layer)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Mapbox API key

1. Create a free account at [mapbox.com](https://account.mapbox.com/auth/signup/)
2. Go to [Access Tokens](https://account.mapbox.com/access-tokens/)
3. Copy your **Default public token** (starts with `pk.`)
4. Create `.env.local` in the project root:

```bash
cp .env.local.example .env.local
```

5. Paste your token:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_actual_token_here
```

> **Note:** The token must be prefixed with `NEXT_PUBLIC_` so the client-side map can access it. Never commit `.env.local` to git.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the Command Center.

## Features

| Component | Description |
|-----------|-------------|
| **Collapsible Sidebar** | Overview, Live Map, CCTV Blind Spots, Deploy Forces, Event Predictor |
| **Live Header** | Real-time IST clock + pulsing "System Status: ACTIVE" indicator |
| **3D Digital Twin** | Mapbox dark-v11 style centered on Nagpur (21.1458°N, 79.0882°E) |
| **3D Buildings** | Extruded polygon layer for urban digital twin effect |
| **Deck.gl Overlay** | Glowing sensor nodes across key Nagpur zones |
| **Futuristic UI** | Floating map container with cyan/emerald glow animations |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (dark mode)
│   ├── page.tsx            # Command Center entry
│   └── globals.css         # Theme + glow animations
├── components/dashboard/
│   ├── CommandCenterLayout.tsx
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── NagpurMap3D.tsx     # 3D Mapbox + Deck.gl map
└── lib/
    └── constants.ts        # Nav items, Nagpur coordinates
```

## Mapbox Usage Notes

- Free tier includes **50,000 map loads/month** — sufficient for hackathon demos
- The map uses `mapbox://styles/mapbox/dark-v11` style
- 3D buildings require zoom level ≥ 14 (auto-configured)
- Click anywhere on the map to fly to that location in 3D

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## License

MIT — built for hackathon demonstration purposes.
