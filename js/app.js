const CATEGORIES = ["Tech", "Cultural", "Workshop", "Sports", "General"];

let events = [];
let myRegs = [];
let activeCategory = "All";

function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
function fmtDate(d) {
  return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

// ---------- INIT ----------
(async function init() {
  const session = await requireAuth();
  if (!session) return;

  const name = session.profile?.name || session.user.email;
  document.getElementById("userName").textContent = "👤 " + name;
  document.getElementById("welcomeText").textContent = `Hello, ${name}! 🎟️`;
  if (session.profile?.role === "admin") {
    document.getElementById("adminLink").style.display = "inline-block";
  }

  renderChips();
  document.getElementById("searchInput").addEventListener("input", renderEvents);

  await loadRegistrations();
  await loadEvents();
})();

// ---------- CATEGORY CHIPS ----------
function renderChips() {
  const all = ["All", ...CATEGORIES];
  document.getElementById("chips").innerHTML = all
    .map((c) => `<button class="chip ${c === activeCategory ? "active" : ""}" onclick="setCategory('${c}')">${c}</button>`)
    .join("");
}
function setCategory(c) {
  activeCategory = c;
  renderChips();
  renderEvents();
}

// ---------- EVENTS ----------
async function loadEvents() {
  const { data, error } = await db.from("events").select("*").order("event_date", { ascending: true });
  if (error) return alert(error.message);
  events = data;
  renderEvents();
}

function renderEvents() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  const registeredIds = myRegs.map((r) => r.event_id);

  const list = events.filter((e) =>
    (activeCategory === "All" || e.category === activeCategory) &&
    (e.title.toLowerCase().includes(q) ||
      (e.venue || "").toLowerCase().includes(q) ||
      (e.description || "").toLowerCase().includes(q))
  );

  const grid = document.getElementById("eventsGrid");
  if (list.length === 0) {
    grid.innerHTML = `<p class="empty">No events found.</p>`;
    return;
  }

  grid.innerHTML = list.map((e) => {
    const joined = registeredIds.includes(e.id);
    return `
      <div class="event-card">
        <span class="tag">${esc(e.category)}</span>
        <h3>${esc(e.title)}</h3>
        <p>${esc(e.description)}</p>
        <div class="meta">📅 ${fmtDate(e.event_date)}</div>
        <div class="meta">📍 ${esc(e.venue || "TBA")}</div>
        <div class="meta">👥 Capacity: ${e.capacity ?? "-"}</div>
        ${joined
          ? `<button class="btn-joined" disabled>✅ Registered</button>`
          : `<button onclick="registerForEvent('${e.id}')">Register</button>`}
      </div>`;
  }).join("");
}

// ---------- REGISTRATIONS ----------
async function loadRegistrations() {
  const { data, error } = await db
    .from("registrations")
    .select("id, event_id, created_at, events(title, venue, event_date, category)")
    .order("created_at", { ascending: false });
  if (error) return alert(error.message);
  myRegs = data;
  renderRegistrations();
  renderEvents();
}

function renderRegistrations() {
  const ul = document.getElementById("regList");
  if (myRegs.length === 0) {
    ul.innerHTML = `<p class="empty">You haven't registered for any events yet.</p>`;
    return;
  }
  ul.innerHTML = myRegs.map((r) => `
    <li class="reg-item">
      <span>
        <strong>${esc(r.events?.title)}</strong>
        <small>📅 ${r.events ? fmtDate(r.events.event_date) : ""} · 📍 ${esc(r.events?.venue || "TBA")}</small>
      </span>
      <button class="btn-delete" onclick="cancelRegistration('${r.id}')">Cancel</button>
    </li>`).join("");
}

async function registerForEvent(eventId) {
  const { error } = await db.from("registrations").insert({ event_id: eventId });
  if (error) {
    if (error.code === "23505") return alert("You are already registered for this event.");
    return alert(error.message);
  }
  await loadRegistrations();
}

async function cancelRegistration(regId) {
  if (!confirm("Cancel this registration?")) return;
  const { error } = await db.from("registrations").delete().eq("id", regId);
  if (error) return alert(error.message);
  await loadRegistrations();
}