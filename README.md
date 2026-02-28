# Deckible Zendesk + ChatGPT Copilot

A lightweight internal tool that connects directly to Zendesk and uses ChatGPT to suggest agent replies.

## Environment

Copy `.env.example` to `.env` and set:

- `ZENDESK_SUBDOMAIN`
- `ZENDESK_EMAIL`
- `ZENDESK_API_TOKEN`
- `LLM_API_KEY` (OpenAI key)
- `LLM_MODEL` (default `gpt-4.1-mini`)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH` (bcrypt hash)
- `APP_BASE_URL` (`https://deckiblesupport.vercel.app` in production, `http://localhost:3000` locally)
- `SESSION_SECRET` (long random secret used to sign session cookies)

## Run locally

```bash
npm install
cp .env.example .env
# for local dev, set APP_BASE_URL=http://localhost:3000
npm run dev
```

## Main API routes

- `GET /api/tickets` – unresolved tickets from Zendesk search.
- `GET /api/tickets/:id` – ticket, comments, and ChatGPT suggestion.
- `POST /api/tickets/:id/draft/regenerate` – regenerate suggestion with current draft context.
- `GET /api/zendesk/connection` – test Zendesk credentials.

## Notes

- The app does not auto-send replies.
- Keep all Zendesk and OpenAI credentials server-side only.
- Auth is cookie-based and enforced for dashboard and ticket APIs.
