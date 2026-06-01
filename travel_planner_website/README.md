# OrbitNest Travel & Life Planner Website

OrbitNest is a complete full-stack website starter for a freemium planning product that combines:

- AI-style travel itinerary generation
- Custom planner templates
- Life organization dashboards
- Server-side email/password account creation and login
- Server-side saved itineraries, custom planners, public share pages, and guest usage limits
- Affiliate-ready hotel and flight recommendations
- Premium upgrade positioning
- Blog topics, public itinerary sharing hooks, `robots.txt`, and `sitemap.xml` for search discoverability

## What this project is now

This is no longer just static HTML/CSS. It includes a Node.js backend in `server.js` that serves the website and powers JSON API routes for accounts, itinerary generation, saved plans, custom planners, and public share pages.

The app intentionally avoids third-party dependencies so you can run it with Node alone. Runtime data is stored in `data/orbitnest-db.json`, which is created automatically and ignored by Git.

Project files:

```text
travel_planner_website/
├── server.js       # Node backend, API routes, auth, persistence, public share pages
├── package.json    # Start/check scripts
├── index.html      # Main website page
├── styles.css      # Responsive visual design
├── app.js          # Browser UI wired to the backend API
├── robots.txt      # Search crawler rules
├── sitemap.xml     # Search sitemap placeholder
└── data/           # Runtime JSON database lives here locally
```

## Run locally

You need Node.js 18 or newer.

From the repository root:

```bash
cd travel_planner_website
npm start
```

Then open <http://localhost:4173> in your browser.

To stop the server, press `Ctrl+C` in the terminal.

### Useful local checks

```bash
cd travel_planner_website
npm run check
```

You can also verify the backend is running:

```bash
curl http://localhost:4173/api/health
```

Expected response:

```json
{"ok":true,"app":"OrbitNest","mode":"full-stack"}
```

## What works in the full-stack app

- Guests can generate up to three itineraries before being asked to log in.
- Users can create or log in with email/password.
- Passwords are hashed with PBKDF2 before being stored in the local JSON database.
- Logged-in users can save generated itineraries.
- Saved itineraries get public share URLs like `/share/share_...`.
- Logged-in users can create and save custom planners.
- The dashboard reflects saved itineraries and planners from the backend.
- Affiliate hotel and flight links are generated for each itinerary.

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check for hosting platforms. |
| `GET` | `/api/me` | Returns the current user, saved plans, and saved planners. |
| `POST` | `/api/auth/register-or-login` | Creates an account or logs in with email/password. |
| `POST` | `/api/auth/logout` | Invalidates the current session token. |
| `POST` | `/api/itineraries/generate` | Generates an itinerary and enforces guest limits. |
| `POST` | `/api/plans` | Saves an itinerary for the logged-in user. |
| `POST` | `/api/planners` | Creates and saves a custom planner. |
| `GET` | `/share/:publicId` | Serves a public itinerary page. |

## Deploy the website

This version needs a Node-compatible host because it includes a backend. Use a platform that can run `node server.js`.

### Deploy with Render

1. Create a Render account.
2. Choose **New** → **Web Service**.
3. Connect the Git repository.
4. Use these settings:

```text
Root directory: travel_planner_website
Build command: npm install
Start command: npm start
```

5. Add an environment variable after you know your live URL:

```text
PUBLIC_BASE_URL=https://your-render-url.onrender.com
```

6. Deploy.

### Deploy with Railway

1. Create a Railway account.
2. Create a new project from the Git repository.
3. Set the service root directory to `travel_planner_website` if Railway asks.
4. Use this start command:

```text
npm start
```

5. Set `PUBLIC_BASE_URL` to your Railway public URL.
6. Deploy.

### Deploy with Fly.io

1. Install and log in to the Fly CLI.
2. From `travel_planner_website`, run `fly launch`.
3. Use `npm start` as the start command if prompted.
4. Set your public URL:

```bash
fly secrets set PUBLIC_BASE_URL=https://your-app.fly.dev
```

5. Deploy with:

```bash
fly deploy
```

### About Netlify, Vercel, Cloudflare Pages, and GitHub Pages

The previous static-only version could be dragged into static hosts. This full-stack version should be deployed to a Node server host instead. GitHub Pages cannot run the backend. Netlify/Vercel/Cloudflare can run serverless functions, but this repo currently uses a normal Node HTTP server, so Render, Railway, or Fly.io are the simplest deploy targets.

## After deployment: update SEO URLs

Before launching publicly, replace the placeholder domain `https://example.com/` with your real domain in:

- `index.html` canonical URL and Open Graph URL
- `robots.txt` sitemap URL
- `sitemap.xml` page URLs

Also set this environment variable on your host:

```text
PUBLIC_BASE_URL=https://your-domain.com
```

## How to make it reachable through Google Search

1. Deploy the site to a public URL.
2. Update all placeholder SEO URLs to your real domain.
3. Set `PUBLIC_BASE_URL` to your real domain.
4. Create or log in to Google Search Console.
5. Add your domain or URL-prefix property.
6. Submit your sitemap URL, for example:

```text
https://your-domain.com/sitemap.xml
```

7. Publish useful blog pages and public itinerary pages over time. The current blog cards are homepage previews; a production site should turn them into separate indexable pages.

## Important production notes

This is a working full-stack starter, but before a real paid launch you should add:

- A production database such as Postgres, Supabase, Neon, PlanetScale, or MongoDB Atlas instead of local JSON storage.
- Secure cookies or managed auth for sessions, plus password reset and email verification.
- Payment processing for premium plans, such as Stripe.
- Real affiliate IDs in hotel, flight, tour, and insurance links.
- A privacy policy, terms of service, cookie notice if needed, and affiliate disclosure.
- Server-side or build-time generated blog pages for stronger SEO.
- Monitoring, backups, rate limiting, spam prevention, and analytics.

## Revenue model

The app is designed around automatic revenue paths:

1. **Freemium conversion**: guests can generate three unsaved itineraries before account prompts.
2. **Affiliate commissions**: itinerary output includes sponsored links for hotel and flight searches.
3. **Premium features**: saved dashboards, unlimited plans, PDF exports, collaboration, and calendar sync are positioned as paid upgrades.

## SEO and discoverability

The landing page includes title/description tags, canonical URL, Open Graph/Twitter metadata, schema.org structured data, `robots.txt`, `sitemap.xml`, blog content cards, and public-share itinerary pages.
