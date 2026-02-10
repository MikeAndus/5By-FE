# Five-By Frontend (FE-0)

React 18 + Vite + TypeScript strict scaffold for the Five-By web frontend.

## Requirements

- Node.js 20+
- npm 10+

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

## Environment Variables

Create a local `.env` file from `.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## Scripts

- `npm run dev` - Start local dev server
- `npm run build` - Typecheck and production build
- `npm run preview` - Preview built app
- `npm run lint` - Run ESLint
- `npm run format` - Run Prettier
- `npm run typecheck` - Run TypeScript check

## Healthcheck Smoke Test

1. Start backend server with `GET /health` available.
2. Start frontend with `npm run dev`.
3. Open `http://localhost:5173`.
4. Click `Check backend health`.
5. Expected success toast includes backend service name and DB status.
