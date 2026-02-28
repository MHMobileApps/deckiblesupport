# Deckible Support Copilot

Production-ready support triage and draft assistant for Zendesk Support (`deckible.zendesk.com`).

## Security model

- Zendesk and LLM secrets are server-side only.
- No `NEXT_PUBLIC` secrets are used.
- No secrets are persisted in SQLite/Postgres.
- Zendesk API calls execute only in API routes/server code.
- Secure `httpOnly` session cookies with `sameSite=lax` and `secure` in production.
- CSP and hardening headers are configured in `next.config.mjs`.
- The app **never auto-sends**. Sending requires manual approval and confirmation.

## Features

- Email+password admin login with bcrypt hash verification.
- Unresolved ticket sync from Zendesk search API.
- Ticket detail view with conversation thread.
- AI summary and language-aware suggested reply draft.
- Regenerate, save draft (versioned), compare diff, one-click copy.
- Send public reply only after explicit confirmation.
- Add internal note and update status.
- Per-ticket `Do Not Send` and local snooze.
- Blocked email domain safeguard with `BLOCKED_EMAIL_DOMAINS`.
- Audit logging with CSV export for last 30 days.

## Environment

Copy `.env.example` to `.env`.

Required:

- `ZENDESK_SUBDOMAIN="deckible"`
- `ZENDESK_EMAIL="YOUR_ZENDESK_AGENT_EMAIL"`
- `ZENDESK_API_TOKEN="YOUR_ZENDESK_API_TOKEN"`
- `ADMIN_EMAIL="admin@local"`
- `ADMIN_PASSWORD_HASH="bcrypt-hash-here"`
- `LLM_PROVIDER="openai"`
- `LLM_API_KEY="YOUR_LLM_KEY"`
- `LLM_MODEL="gpt-4.1-mini"`
- `APP_BASE_URL="http://localhost:3000"`
- `LOG_LEVEL="info"`
- `SESSION_SECRET="long-random-value"`

Database:

- Database (PostgreSQL for local and production):
  - `DATABASE_URL="postgresql://..."`

Optional:

- `BLOCKED_EMAIL_DOMAINS="mailinator.com,tempmail.com"`

## Setup

```bash
npm install
cp .env.example .env
# set ADMIN_PASSWORD_HASH with bcrypt
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

## Zendesk token safety

1. Create token in Zendesk Admin Center -> Apps and integrations -> APIs -> Zendesk API.
2. Paste token into local `.env` or Vercel environment vars only.
3. Never commit `.env`.
4. If token exposure is suspected, revoke and reissue immediately.

### Token rotation

1. Create new token in Zendesk.
2. Update Vercel and local env vars.
3. Redeploy/restart.
4. Revoke old token.

## Deployment (Vercel)

- Use Node runtime (default in API routes).
- Set all secrets in Vercel Project Environment Variables.
- Do not create any sensitive `NEXT_PUBLIC_*` variables.
- Run Prisma migrations in deploy workflow.

## API routes

- `GET /api/tickets?status=unresolved&cursor=...`
- `GET /api/tickets/:id`
- `POST /api/tickets/:id/sync`
- `POST /api/tickets/:id/draft/save`
- `POST /api/tickets/:id/draft/regenerate`
- `POST /api/tickets/:id/send-reply`
- `POST /api/tickets/:id/add-note`
- `POST /api/tickets/:id/update-status`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/audit?from=...&to=...`

## Troubleshooting

- **401 from Zendesk**: verify `ZENDESK_EMAIL`, token, and that auth format is `{email}/token:{api_token}`.
- **429 rate limits**: client uses retry with backoff and respects `Retry-After`.
- **Pagination**: unresolved ticket fetch supports `next_page` cursor.
- **Missing comments**: hit per-ticket Refresh. Comments are conditionally refreshed by `updated_at`.

## Testing

```bash
npm run test
```

Includes:

- Zendesk auth header format test.
- LLM output zod validation test.
- Send-reply guard test for auth and `doNotSend` behavior.
