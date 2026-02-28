# Deckible Zendesk + ChatGPT Copilot

A lightweight internal tool that connects directly to Zendesk and uses ChatGPT to suggest agent replies.

## What changed

- Prisma has been removed from the project.
- Tickets are loaded directly from Zendesk on each request.
- Suggested replies are generated directly from Zendesk ticket/comments using ChatGPT.
- The dashboard focuses on browsing tickets and regenerating response suggestions.

## Environment

Copy `.env.example` to `.env` and set:

- `ZENDESK_SUBDOMAIN`
- `ZENDESK_EMAIL`
- `ZENDESK_API_TOKEN`
- `LLM_API_KEY` (OpenAI key)
- `LLM_MODEL` (default `gpt-4.1-mini`)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH` (bcrypt hash)
- `SESSION_SECRET`

## Run locally

```bash
npm install
cp .env.example .env
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
