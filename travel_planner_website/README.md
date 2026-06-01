# OrbitNest Travel & Life Planner Website

OrbitNest is a static, SEO-ready website prototype for a freemium planning product that combines:

- AI-style travel itinerary generation
- Custom planner templates
- Life organization dashboards
- Guest usage limits and local email/password account simulation
- Affiliate-ready hotel and flight recommendations
- Premium upgrade positioning
- Blog topics and public itinerary sharing hooks for search discoverability

## What this project is

This website is a **static front-end prototype**. It does not need Node, React, a database, or a backend server to preview. The login, guest-generation counter, saved plans, and dashboard counts are simulated with browser `localStorage`, so they work on your device for demo purposes only.

Project files:

```text
travel_planner_website/
├── index.html      # Main website page
├── styles.css      # Responsive visual design
├── app.js          # Itinerary/planner interactions and local demo auth
├── robots.txt      # Search crawler rules
├── sitemap.xml     # Search sitemap placeholder
└── README.md       # Run/deploy instructions
```

## Run locally

### Option 1: Open the file directly

You can double-click `travel_planner_website/index.html` and open it in a browser. This is the fastest preview option.

### Option 2: Run a local server (recommended)

From the repository root:

```bash
cd travel_planner_website
python3 -m http.server 4173
```

Then open <http://localhost:4173> in your browser.

To stop the server, press `Ctrl+C` in the terminal.

## Deploy the website

Because this is a static website, you can deploy it on any static hosting service. The deploy folder is:

```text
travel_planner_website
```

### Deploy with Netlify

1. Create a Netlify account.
2. Choose **Add new site** → **Deploy manually**.
3. Drag the entire `travel_planner_website` folder into Netlify.
4. Netlify will give you a live URL.
5. Optional: connect your custom domain in **Site configuration** → **Domain management**.

For Git-based Netlify deploys, use these settings:

```text
Base directory: travel_planner_website
Build command: leave blank
Publish directory: .
```

### Deploy with Vercel

1. Create a Vercel account.
2. Import this Git repository.
3. Set the project root or output directory to `travel_planner_website`.
4. Leave the build command blank because there is no build step.
5. Deploy and connect a custom domain if desired.

Suggested Vercel settings:

```text
Framework preset: Other
Root directory: travel_planner_website
Build command: leave blank
Output directory: .
```

### Deploy with GitHub Pages

GitHub Pages works best if the site is served from the repository root or from a `/docs` folder. Since this prototype lives in `travel_planner_website`, use one of these approaches:

- Move the contents of `travel_planner_website` to the repo root before enabling Pages.
- Or copy the contents into a `docs/` folder and set GitHub Pages to publish from `docs/`.
- Or use a GitHub Actions workflow to publish `travel_planner_website` as the Pages artifact.

### Deploy with Cloudflare Pages

1. Create a Cloudflare Pages project.
2. Connect the Git repository.
3. Use these build settings:

```text
Framework preset: None
Build command: leave blank
Build output directory: travel_planner_website
```

4. Deploy and add a custom domain in the Pages dashboard.

## After deployment: update SEO URLs

Before launching publicly, replace the placeholder domain `https://example.com/` with your real domain in:

- `index.html` canonical URL and Open Graph URL
- `robots.txt` sitemap URL
- `sitemap.xml` page URLs

For example, if your domain is `https://orbitnest.com`, update the URLs to use that domain.

## How to make it reachable through Google Search

1. Deploy the site to a public URL.
2. Update all placeholder SEO URLs to your real domain.
3. Create or log in to Google Search Console.
4. Add your domain or URL-prefix property.
5. Submit your sitemap URL, for example:

```text
https://your-domain.com/sitemap.xml
```

6. Publish useful blog pages and public itinerary pages over time. The current blog cards are homepage previews; a production site should turn them into separate indexable pages.

## Important production notes

The current account system is only a front-end demo. For a real launch, add:

- Real authentication, such as Supabase Auth, Firebase Auth, Auth0, or a custom backend.
- A database for user accounts, saved itineraries, planner templates, and public shares.
- Payment processing for premium plans, such as Stripe.
- Real affiliate IDs in hotel, flight, tour, and insurance links.
- A privacy policy, terms of service, cookie notice if needed, and affiliate disclosure.
- Server-side or build-time generated public itinerary pages for stronger SEO.

## Revenue model

The prototype is designed around automatic revenue paths:

1. **Freemium conversion**: guests can generate three unsaved itineraries before account prompts.
2. **Affiliate commissions**: itinerary output includes sponsored links for hotel and flight searches.
3. **Premium features**: saved dashboards, unlimited plans, PDF exports, collaboration, and calendar sync are positioned as paid upgrades.

## SEO and discoverability

The landing page includes title/description tags, canonical URL, Open Graph/Twitter metadata, schema.org structured data, `robots.txt`, `sitemap.xml`, blog content cards, and public-share URL previews.
