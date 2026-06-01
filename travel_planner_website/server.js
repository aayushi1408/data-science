const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "orbitnest-db.json");
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const GUEST_LIMIT = 3;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function ensureDatabase() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    writeDatabase({ users: [], sessions: [], plans: [], planners: [], guestUsage: {} });
  }
}

function readDatabase() {
  ensureDatabase();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDatabase(database) {
  fs.writeFileSync(DB_FILE, `${JSON.stringify(database, null, 2)}\n`);
}

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, originalHash] = storedHash.split(":");
  const attemptedHash = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(originalHash, "hex"), Buffer.from(attemptedHash, "hex"));
}

function sanitizeText(value, fallback = "") {
  return String(value || fallback).trim().slice(0, 180);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((cookie) => cookie.trim().split("="))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key, decodeURIComponent(value)]),
  );
}

function getBearerToken(request) {
  const authorization = request.headers.authorization || "";
  if (authorization.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }
  return null;
}

function getCurrentUser(request, database) {
  const token = getBearerToken(request);
  if (!token) return null;
  const session = database.sessions.find((item) => item.token === token);
  if (!session) return null;
  return database.users.find((user) => user.id === session.userId) || null;
}

function sendJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders,
  });
  response.end(JSON.stringify(payload));
}

function sendHtml(response, statusCode, html) {
  response.writeHead(statusCode, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function buildItinerary({ destination, days, budget, interests }) {
  const cleanDestination = sanitizeText(destination, "Your destination");
  const dayCount = Math.max(1, Math.min(Number(days) || 5, 21));
  const cleanBudget = sanitizeText(budget, "Smart value");
  const activities = sanitizeText(interests, "local food, culture, scenic walks")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
  const defaultActivities = activities.length ? activities : ["local food", "culture", "scenic walks"];

  return {
    id: randomId("plan"),
    publicId: randomId("share"),
    title: `${dayCount}-day ${cleanDestination} itinerary`,
    destination: cleanDestination,
    days: Array.from({ length: dayCount }, (_, index) => {
      const focus = defaultActivities[index % defaultActivities.length];
      return {
        day: index + 1,
        morning: `Start with a relaxed ${focus} experience near your stay.`,
        afternoon: `Choose a ${cleanBudget.toLowerCase()} lunch, then follow a low-stress route through top neighborhoods.`,
        evening: `Book a memorable dinner or sunset activity connected to ${focus}.`,
      };
    }),
    budget: cleanBudget,
    interests: defaultActivities,
    createdAt: new Date().toISOString(),
  };
}

function buildPlanner({ plannerType, goal }) {
  const cleanPlannerType = sanitizeText(plannerType, "Weekly reset");
  const cleanGoal = sanitizeText(goal, "Organize my week");
  return {
    id: randomId("planner"),
    plannerType: cleanPlannerType,
    goal: cleanGoal,
    checklist: [
      "Define the single outcome that would make this plan successful.",
      "Break the goal into three milestones with realistic deadlines.",
      "Schedule one focused block and one review block this week.",
      "Add a reward or reflection prompt so the plan feels sustainable.",
    ],
    createdAt: new Date().toISOString(),
  };
}

function planForClient(plan) {
  return {
    ...plan,
    shareUrl: `${PUBLIC_BASE_URL}/share/${plan.publicId}`,
    hotelUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(plan.destination)}`,
    flightUrl: `https://www.skyscanner.com/transport/flights-to/${encodeURIComponent(plan.destination.toLowerCase())}`,
  };
}

function publicPlanHtml(plan) {
  const title = escapeHtml(plan.title);
  const dayCards = plan.days
    .map(
      (day) => `
        <article class="day-card">
          <h2>Day ${escapeHtml(day.day)}</h2>
          <p><strong>Morning:</strong> ${escapeHtml(day.morning)}</p>
          <p><strong>Afternoon:</strong> ${escapeHtml(day.afternoon)}</p>
          <p><strong>Evening:</strong> ${escapeHtml(day.evening)}</p>
        </article>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} | OrbitNest</title>
  <meta name="description" content="A public OrbitNest travel itinerary for ${escapeHtml(plan.destination)}." />
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <main class="section-shell shared-page">
    <p class="eyebrow">Public itinerary</p>
    <h1>${title}</h1>
    <p class="hero-text">Budget: ${escapeHtml(plan.budget)} · Interests: ${escapeHtml(plan.interests.join(", "))}</p>
    <div class="generated-plan">${dayCards}</div>
    <div class="deal-row">
      <a href="${escapeHtml(planForClient(plan).hotelUrl)}" target="_blank" rel="sponsored noopener">Compare hotels</a>
      <a href="${escapeHtml(planForClient(plan).flightUrl)}" target="_blank" rel="sponsored noopener">Find flights</a>
    </div>
    <p><a class="primary-button" href="/">Create your own plan</a></p>
  </main>
</body>
</html>`;
}

function serveStatic(request, response, pathname) {
  const normalizedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(ROOT, normalizedPath));

  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendHtml(response, 404, "<h1>Not found</h1>");
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, { "Content-Type": MIME_TYPES[extension] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(response);
}

async function handleApi(request, response, pathname) {
  const database = readDatabase();
  const currentUser = getCurrentUser(request, database);

  if (request.method === "GET" && pathname === "/api/health") {
    sendJson(response, 200, { ok: true, app: "OrbitNest", mode: "full-stack" });
    return;
  }

  if (request.method === "GET" && pathname === "/api/me") {
    if (!currentUser) {
      sendJson(response, 200, { user: null });
      return;
    }
    const plans = database.plans.filter((plan) => plan.userId === currentUser.id).map(planForClient);
    const planners = database.planners.filter((planner) => planner.userId === currentUser.id);
    sendJson(response, 200, {
      user: { id: currentUser.id, email: currentUser.email, plan: currentUser.plan, joinedAt: currentUser.joinedAt },
      plans,
      planners,
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/auth/register-or-login") {
    const body = await readBody(request);
    const email = sanitizeText(body.email).toLowerCase();
    const password = String(body.password || "");

    if (!email.includes("@") || password.length < 6) {
      sendJson(response, 400, { error: "Enter a valid email and a password with at least 6 characters." });
      return;
    }

    let user = database.users.find((item) => item.email === email);
    if (user && !verifyPassword(password, user.passwordHash)) {
      sendJson(response, 401, { error: "That email already exists. Check the password and try again." });
      return;
    }

    if (!user) {
      user = {
        id: randomId("user"),
        email,
        passwordHash: hashPassword(password),
        plan: "free",
        joinedAt: new Date().toISOString(),
      };
      database.users.push(user);
    }

    const token = randomId("session");
    database.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
    writeDatabase(database);
    sendJson(response, 200, {
      token,
      user: { id: user.id, email: user.email, plan: user.plan, joinedAt: user.joinedAt },
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/auth/logout") {
    const token = getBearerToken(request);
    const nextDatabase = { ...database, sessions: database.sessions.filter((session) => session.token !== token) };
    writeDatabase(nextDatabase);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "POST" && pathname === "/api/itineraries/generate") {
    const body = await readBody(request);
    const cookies = parseCookies(request.headers.cookie);
    const guestId = cookies.orbitnest_guest || randomId("guest");

    if (!currentUser) {
      const used = database.guestUsage[guestId] || 0;
      if (used >= GUEST_LIMIT) {
        sendJson(response, 403, { error: "You used the free guest limit. Log in to keep creating and saving plans." });
        return;
      }
      database.guestUsage[guestId] = used + 1;
    }

    const plan = buildItinerary(body);
    writeDatabase(database);
    sendJson(
      response,
      200,
      {
        plan: planForClient(plan),
        guestGenerations: currentUser ? null : database.guestUsage[guestId],
        guestLimit: GUEST_LIMIT,
      },
      currentUser
        ? {}
        : { "Set-Cookie": `orbitnest_guest=${encodeURIComponent(guestId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000` },
    );
    return;
  }

  if (request.method === "POST" && pathname === "/api/plans") {
    if (!currentUser) {
      sendJson(response, 401, { error: "Log in to save plans." });
      return;
    }
    const body = await readBody(request);
    const plan = { ...body.plan, userId: currentUser.id, savedAt: new Date().toISOString() };
    if (!plan.id || !plan.publicId || !plan.destination) {
      sendJson(response, 400, { error: "Generate a valid itinerary before saving." });
      return;
    }
    database.plans = [plan, ...database.plans.filter((item) => item.id !== plan.id)];
    writeDatabase(database);
    sendJson(response, 200, { plan: planForClient(plan), plans: database.plans.filter((item) => item.userId === currentUser.id).map(planForClient) });
    return;
  }

  if (request.method === "POST" && pathname === "/api/planners") {
    if (!currentUser) {
      sendJson(response, 401, { error: "Log in to save custom planners." });
      return;
    }
    const body = await readBody(request);
    const planner = { ...buildPlanner(body), userId: currentUser.id };
    database.planners = [planner, ...database.planners];
    writeDatabase(database);
    sendJson(response, 200, { planner, planners: database.planners.filter((item) => item.userId === currentUser.id) });
    return;
  }

  sendJson(response, 404, { error: "API route not found." });
}

async function handleRequest(request, response) {
  try {
    const url = new URL(request.url, PUBLIC_BASE_URL);

    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url.pathname);
      return;
    }

    if (request.method === "GET" && url.pathname.startsWith("/share/")) {
      const publicId = url.pathname.split("/").pop();
      const database = readDatabase();
      const plan = database.plans.find((item) => item.publicId === publicId);
      if (!plan) {
        sendHtml(response, 404, "<h1>Shared itinerary not found</h1><p>This plan may not have been saved yet.</p>");
        return;
      }
      sendHtml(response, 200, publicPlanHtml(plan));
      return;
    }

    if (request.method === "GET") {
      serveStatic(request, response, url.pathname);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error." });
  }
}

ensureDatabase();
http.createServer(handleRequest).listen(PORT, () => {
  console.log(`OrbitNest full-stack app running at ${PUBLIC_BASE_URL}`);
});
