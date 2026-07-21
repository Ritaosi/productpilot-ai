# ProductPilot AI

Autonomous AI agents that turn customer research into product decisions —
drafting and refining insights, opportunities, PRDs, and competitive briefs,
with a human approval checkpoint at every step.

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing, SSR) + [Vite](https://vite.dev)
- [Nitro](https://nitro.build) for the server build, deployed to [Vercel](https://vercel.com)
- [Supabase](https://supabase.com) — Postgres, auth, row-level security
- [Groq](https://groq.com) via the [Vercel AI SDK](https://ai-sdk.dev) (OpenAI-compatible) for generation
- [Firecrawl](https://firecrawl.dev) for competitor web search
- Tailwind CSS v4 + shadcn/radix UI components

## Features

- **Projects** — the top-level container for a product's research and artifacts
- **Research** — upload/parse source material and extract structured insights
- **Opportunities** — AI-suggested opportunities generated from insights
- **PRDs** — AI-drafted PRD sections built from approved opportunities
- **Competitive intel** — AI-suggested competitors plus a live web-search refresh (Firecrawl) summarized into signals, overlaps, and whitespace

## Getting started

### Prerequisites

- Node.js 20+ (or [Bun](https://bun.sh), both lockfiles are kept in sync)
- A [Supabase](https://supabase.com) project
- A free [Groq](https://console.groq.com) API key
- A free [Firecrawl](https://firecrawl.dev) API key (optional — only needed for competitive intel)

### Setup

```bash
npm install       # or: bun install
cp .env.example .env
```

Fill in `.env` — see [Environment variables](#environment-variables) below.

If you're starting from a fresh Supabase project, apply the schema:

```bash
npx supabase db push   # or paste supabase/migrations/*.sql into the SQL editor
```

Then run the dev server:

```bash
npm run dev
```

The app runs at `http://localhost:8080`.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (outputs Vercel's Build Output API v3 to `.vercel/output`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |

## Environment variables

| Variable | Where to get it | Notes |
| --- | --- | --- |
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | Supabase dashboard → Settings → API | Same value in both |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase dashboard → Settings → API | Safe to expose client-side |
| `SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID` | Supabase dashboard → Settings → General | |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API | Server-only, bypasses RLS — never expose to the client |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys | Powers all AI generation (insights, opportunities, PRDs, competitive signals) |
| `FIRECRAWL_API_KEY` | [firecrawl.dev](https://firecrawl.dev) → API Keys | Only needed for "Refresh competitive intel" |

Google sign-in works out of the box via Supabase's native OAuth — enable the
Google provider and add your own OAuth client credentials in the Supabase
dashboard under **Authentication → Providers**.

## Deployment

This project builds to Vercel's Build Output API v3 (via the Nitro `vercel`
preset), so Vercel picks it up with no `vercel.json` required:

1. Push to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new). Framework preset:
   **Other**; build command `npm run build` (auto-detected).
3. Add the environment variables above in the Vercel project settings.
4. Deploy.

## Database

Schema changes live in `supabase/migrations/`. Apply them with the
[Supabase CLI](https://supabase.com/docs/guides/cli) (`supabase db push`) or
by pasting them into the SQL editor in order.
