const STORAGE_KEYS = {
  user: "orbitnest:user",
  plans: "orbitnest:plans",
  guestGenerations: "orbitnest:guestGenerations",
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

let currentPlan = null;

function getJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function setJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUser() {
  return getJson(STORAGE_KEYS.user, null);
}

function getPlans() {
  return getJson(STORAGE_KEYS.plans, []);
}

function getGuestGenerations() {
  return Number(localStorage.getItem(STORAGE_KEYS.guestGenerations) || 0);
}

function setGuestGenerations(value) {
  localStorage.setItem(STORAGE_KEYS.guestGenerations, String(value));
  updateDashboard();
}

function updateDashboard() {
  const user = getUser();
  const plans = getPlans();
  const guestCount = getGuestGenerations();

  guestCounter.textContent = user ? "Logged in: unlimited" : `Guest generations: ${guestCount}/3`;
  savedCount.textContent = `${plans.length} saved plan${plans.length === 1 ? "" : "s"}`;
  todayFocus.textContent = plans[0] ? `Review ${plans[0].title}` : "Pick one priority";

  $$('[data-open-auth]').forEach((button) => {
    if (button.tagName === "BUTTON" && user) {
      button.textContent = "Account active";
    }
  });
}

function buildItinerary({ destination, days, budget, interests }) {
  const interestList = interests
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const dayCount = Math.min(Number(days), 21);
  const activities = interestList.length ? interestList : ["local food", "culture", "scenic walks"];

  return {
    id: crypto.randomUUID(),
    title: `${dayCount}-day ${destination} itinerary`,
    destination,
    days: Array.from({ length: dayCount }, (_, index) => {
      const focus = activities[index % activities.length];
      return {
        day: index + 1,
        morning: `Start with a relaxed ${focus} experience near your stay.`,
        afternoon: `Choose a ${budget.toLowerCase()} lunch, then follow a low-stress route through top neighborhoods.`,
        evening: `Book a memorable dinner or sunset activity connected to ${focus}.`,
      };
    }),
    budget,
    interests: activities,
    createdAt: new Date().toISOString(),
  };
}

function renderItinerary(plan) {
  const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encodeURIComponent(plan.id)}`;
  itineraryOutput.className = "generated-plan";
  itineraryOutput.innerHTML = `
    <div>
      <p class="eyebrow">Generated itinerary</p>
      <h3>${plan.title}</h3>
      <p>Budget style: ${plan.budget}. Interests: ${plan.interests.join(", ")}.</p>
    </div>
    ${plan.days
      .map(
        (day) => `
          <article class="day-card">
            <h4>Day ${day.day}</h4>
            <p><strong>Morning:</strong> ${day.morning}</p>
            <p><strong>Afternoon:</strong> ${day.afternoon}</p>
            <p><strong>Evening:</strong> ${day.evening}</p>
          </article>
        `,
      )
      .join("")}
    <div class="deal-row" aria-label="Sponsored travel booking links">
      <a href="https://www.booking.com/searchresults.html?ss=${encodeURIComponent(plan.destination)}" target="_blank" rel="sponsored noopener">Compare hotels</a>
      <a href="https://www.skyscanner.com/transport/flights-to/${encodeURIComponent(plan.destination.toLowerCase())}" target="_blank" rel="sponsored noopener">Find flights</a>
    </div>
    <p class="helper-text">Public share preview: ${shareUrl}</p>
  `;
}

function saveCurrentPlan() {
  if (!currentPlan) {
    itineraryOutput.textContent = "Generate a plan before saving.";
    return;
  }

  if (!getUser()) {
    authStatus.textContent = "Please log in to save this plan. Guests can generate plans, but they are not saved.";
    authModal.showModal();
    return;
  }

  const plans = getPlans();
  setJson(STORAGE_KEYS.plans, [currentPlan, ...plans.filter((plan) => plan.id !== currentPlan.id)]);
  updateDashboard();
  savePlanButton.textContent = "Saved ✓";
  setTimeout(() => {
    savePlanButton.textContent = "Save plan";
  }, 1800);
}

navToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

$$('[data-open-auth]').forEach((button) => {
  button.addEventListener("click", () => authModal.showModal());
});

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(authForm);
  const email = formData.get("email");
  setJson(STORAGE_KEYS.user, { email, joinedAt: new Date().toISOString(), plan: "free" });
  authStatus.textContent = `Signed in as ${email}. Your future plans can now be saved locally.`;
  updateDashboard();
  setTimeout(() => authModal.close(), 900);
});

itineraryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const user = getUser();
  const guestCount = getGuestGenerations();

  if (!user && guestCount >= 3) {
    authStatus.textContent = "You used the free guest limit. Log in to keep creating and saving plans.";
    authModal.showModal();
    return;
  }

  const formData = new FormData(itineraryForm);
  currentPlan = buildItinerary(Object.fromEntries(formData.entries()));
  renderItinerary(currentPlan);

  if (!user) {
    setGuestGenerations(guestCount + 1);
  }
});

savePlanButton.addEventListener("click", saveCurrentPlan);

plannerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(plannerForm);
  const plannerType = formData.get("plannerType");
  const goal = formData.get("goal");
  plannerOutput.style.placeItems = "start";
  plannerOutput.style.textAlign = "left";
  plannerOutput.innerHTML = `
    <div>
      <p class="eyebrow">${plannerType}</p>
      <h3>${goal}</h3>
      <ol>
        <li>Define the single outcome that would make this plan successful.</li>
        <li>Break the goal into three milestones with realistic deadlines.</li>
        <li>Schedule one focused block and one review block this week.</li>
        <li>Add a reward or reflection prompt so the plan feels sustainable.</li>
      </ol>
    </div>
  `;
});

updateDashboard();
