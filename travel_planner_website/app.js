const STORAGE_KEYS = {
  token: "orbitnest:token",
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const navToggle = $(".nav-toggle");
const navMenu = $("#nav-menu");
const authModal = $("#auth-modal");
const authForm = $("#auth-form");
const authStatus = $("#auth-status");
const itineraryForm = $("#itinerary-form");
const itineraryOutput = $("#itinerary-output");
const guestCounter = $("#guest-counter");
const savePlanButton = $("#save-plan");
const plannerForm = $("#custom-planner-form");
const plannerOutput = $("#planner-output");
const savedCount = $("#saved-count");
const todayFocus = $("#today-focus");
const blogForm = $("#blog-form");
const blogOutput = $("#blog-output");

let currentPlan = null;
let currentUser = null;
let savedPlans = [];
let savedPlanners = [];

function getToken() {
  return localStorage.getItem(STORAGE_KEYS.token);
}

function setToken(token) {
  localStorage.setItem(STORAGE_KEYS.token, token);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function api(path, options = {}) {
  const token = getToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Something went wrong.");
  }
  return payload;
}

function setStatus(message, isError = false) {
  authStatus.textContent = message;
  authStatus.style.color = isError ? "#b42318" : "";
}

function updateDashboard(guestGenerations = null, guestLimit = 3) {
  guestCounter.textContent = currentUser
    ? "Signed in: unlimited plans"
    : guestGenerations === null
      ? `${guestLimit} free plans`
      : `Free plans: ${guestGenerations}/${guestLimit}`;
  savedCount.textContent = `${savedPlans.length} saved itinerary${savedPlans.length === 1 ? "" : "ies"} · ${savedPlanners.length} planner${savedPlanners.length === 1 ? "" : "s"}`;
  todayFocus.textContent = savedPlans[0] ? `Review ${savedPlans[0].title}` : "Pick one priority";

  $$('[data-open-auth]').forEach((button) => {
    if (button.tagName === "BUTTON") {
      button.textContent = currentUser ? `Signed in as ${currentUser.email}` : button.dataset.authLabel || button.textContent;
    }
  });
}

async function loadAccount() {
  if (!getToken()) {
    updateDashboard();
    return;
  }

  try {
    const payload = await api("/api/me");
    currentUser = payload.user;
    savedPlans = payload.plans || [];
    savedPlanners = payload.planners || [];
    updateDashboard();
  } catch (error) {
    localStorage.removeItem(STORAGE_KEYS.token);
    currentUser = null;
    savedPlans = [];
    savedPlanners = [];
    updateDashboard();
  }
}

function renderItinerary(plan) {
  const safeTitle = escapeHtml(plan.title);
  itineraryOutput.className = "generated-plan";
  itineraryOutput.innerHTML = `
    <div>
      <p class="eyebrow">Your itinerary</p>
      <h3>${safeTitle}</h3>
      <p>Budget style: ${escapeHtml(plan.budget)}. Interests: ${escapeHtml(plan.interests.join(", "))}.</p>
    </div>
    ${plan.days
      .map(
        (day) => `
          <article class="day-card">
            <h4>Day ${escapeHtml(day.day)}</h4>
            <p><strong>Morning:</strong> ${escapeHtml(day.morning)}</p>
            <p><strong>Afternoon:</strong> ${escapeHtml(day.afternoon)}</p>
            <p><strong>Evening:</strong> ${escapeHtml(day.evening)}</p>
          </article>
        `,
      )
      .join("")}
    <div class="deal-row" aria-label="Sponsored travel booking links">
      <a href="${escapeHtml(plan.hotelUrl)}" target="_blank" rel="sponsored noopener">Compare hotels</a>
      <a href="${escapeHtml(plan.flightUrl)}" target="_blank" rel="sponsored noopener">Find flights</a>
    </div>
    <p class="helper-text">Share link after saving: <a href="${escapeHtml(plan.shareUrl)}" target="_blank" rel="noopener">${escapeHtml(plan.shareUrl)}</a></p>
  `;
}

async function saveCurrentPlan() {
  if (!currentPlan) {
    itineraryOutput.textContent = "Generate a plan before saving.";
    return;
  }

  if (!currentUser) {
    setStatus("Please log in to save this plan. You can try a few plans before signing in, but they are not saved.", true);
    authModal.showModal();
    return;
  }

  try {
    const payload = await api("/api/plans", {
      method: "POST",
      body: JSON.stringify({ plan: currentPlan }),
    });
    currentPlan = payload.plan;
    savedPlans = payload.plans;
    renderItinerary(currentPlan);
    updateDashboard();
    savePlanButton.textContent = "Saved ✓";
    setTimeout(() => {
      savePlanButton.textContent = "Save plan";
    }, 1800);
  } catch (error) {
    setStatus(error.message, true);
    authModal.showModal();
  }
}

navToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

$$('[data-open-auth]').forEach((button) => {
  button.dataset.authLabel = button.textContent;
  button.addEventListener("click", () => authModal.showModal());
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(authForm);

  try {
    const payload = await api("/api/auth/register-or-login", {
      method: "POST",
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });
    setToken(payload.token);
    currentUser = payload.user;
    setStatus(`Signed in as ${payload.user.email}. Your future plans will be saved to your account.`);
    await loadAccount();
    setTimeout(() => authModal.close(), 900);
  } catch (error) {
    setStatus(error.message, true);
  }
});

itineraryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(itineraryForm);
  const submitButton = itineraryForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Generating...";

  try {
    const payload = await api("/api/itineraries/generate", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });
    currentPlan = payload.plan;
    renderItinerary(currentPlan);
    updateDashboard(payload.guestGenerations, payload.guestLimit);
  } catch (error) {
    setStatus(error.message, true);
    authModal.showModal();
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Generate itinerary";
  }
});

savePlanButton.addEventListener("click", saveCurrentPlan);

plannerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(plannerForm);

  if (!currentUser) {
    setStatus("Log in to create and save custom planners.", true);
    authModal.showModal();
    return;
  }

  try {
    const payload = await api("/api/planners", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });
    savedPlanners = payload.planners;
    plannerOutput.style.placeItems = "start";
    plannerOutput.style.textAlign = "left";
    plannerOutput.innerHTML = `
      <div>
        <p class="eyebrow">${escapeHtml(payload.planner.plannerType)}</p>
        <h3>${escapeHtml(payload.planner.goal)}</h3>
        <ol>
          ${payload.planner.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ol>
      </div>
    `;
    updateDashboard();
  } catch (error) {
    setStatus(error.message, true);
    authModal.showModal();
  }
});


blogForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(blogForm);

  if (!currentUser) {
    setStatus("Log in to create and save articles.", true);
    authModal.showModal();
    return;
  }

  try {
    const payload = await api("/api/blog/generate", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });
    blogOutput.style.placeItems = "start";
    blogOutput.style.textAlign = "left";
    blogOutput.innerHTML = `
      <div>
        <p class="eyebrow">Article preview</p>
        <h3>${escapeHtml(payload.post.title)}</h3>
        <p><strong>Short summary:</strong> ${escapeHtml(payload.post.metaDescription)}</p>
        <ol>
          ${payload.post.outline.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ol>
        <p class="helper-text">Share link: <a href="${escapeHtml(payload.post.publicUrl)}" target="_blank" rel="noopener">${escapeHtml(payload.post.publicUrl)}</a></p>
      </div>
    `;
  } catch (error) {
    setStatus(error.message, true);
    authModal.showModal();
  }
});

loadAccount();
