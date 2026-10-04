const CATEGORIES = ["Tech", "Cultural", "Workshop", "Sports", "General"];

let events = [];
let editingId = null;

function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
function fmtDate(d) {
  return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
// ISO date -> value for <input type="datetime-local">
function toLocalInput(d) {
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 16);
}

// ---------- INIT ----------
(async function init() {
  const session = await requireAdmin();
  if (!session) return;

  document.getElementById("userName").textContent = "👤 " + (session.profile?.name || session.user.email);
  document.getElementById("evCategory").innerHTML =
    CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");

  await loadEvents();
})();

// ---------- EVENTS ----------
async function loadEvents() {
  const { data, error } = await db
    .from("events")
    .select("*, registrations(count)")
    .order("event_date", { ascending: true });
  if (error) return alert(error.message);
  events = data;
  renderEvents();
}

function renderEvents() {
  const grid = document.getElementById("adminGrid");
  if (events.length === 0) {
    grid.innerHTML = `<p class="empty">No events yet. Click "+ Add Event".</p>`;
    return;
  }
  grid.innerHTML = events.map((e) => {
    const count = e.registrations?.[0]?.count ?? 0;
    return `
      <div class="event-card">
        <span class="tag">${esc(e.category)}</span>
        <h3>${esc(e.title)}</h3>
        <p>${esc(e.description)}</p>
        <div class="meta">📅 ${fmtDate(e.event_date)}</div>
        <div class="meta">📍 ${esc(e.venue || "TBA")}</div>
        <div class="meta">👥 ${count} / ${e.capacity ?? "-"} registered</div>
        <div class="card-actions">
          <button class="btn-small" onclick="viewRegistrants('${e.id}')">Users</button>
          <button class="btn-small" onclick="openEventModal('${e.id}')">Edit</button>
          <button class="btn-delete" onclick="deleteEvent('${e.id}')">Delete</button>
        </div>
      </div>`;
  }).join("");
}

function openEventModal(id = null) {
  editingId = id;
  const e = id ? events.find((x) => x.id === id) : null;
  document.getElementById("modalTitle").textContent = e ? "Edit Event ✏️" : "New Event 🎉";
  document.getElementById("evTitle").value = e ? e.title : "";
  document.getElementById("evDesc").value = e ? e.description || "" : "";
  document.getElementById("evCategory").value = e ? e.category : "General";
  document.getElementById("evVenue").value = e ? e.venue || "" : "";
  document.getElementById("evDate").value = e ? toLocalInput(e.event_date) : "";
  document.getElementById("evCapacity").value = e ? e.capacity : 100;
  document.getElementById("eventModal").classList.add("show");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("show");
}

async function saveEvent() {
  const title = document.getElementById("evTitle").value.trim();
  const dateVal = document.getElementById("evDate").value;
  if (!title || !dateVal) return alert("Title and date are required");

  const payload = {
    title,
    description: document.getElementById("evDesc").value.trim(),
    category: document.getElementById("evCategory").value,
    venue: document.getElementById("evVenue").value.trim(),
    event_date: new Date(dateVal).toISOString(),
    capacity: parseInt(document.getElementById("evCapacity").value) || 100
  };

  let error;
  if (editingId) {
    ({ error } = await db.from("events").update(payload).eq("id", editingId));
  } else {
    ({ error } = await db.from("events").insert(payload));
  }
  if (error) return alert(error.message);

  closeModal("eventModal");
  loadEvents();
}

async function deleteEvent(id) {
  if (!confirm("Delete this event? All its registrations will also be removed.")) return;
  const { error } = await db.from("events").delete().eq("id", id);
  if (error) return alert(error.message);
  loadEvents();
}

// ---------- REGISTERED USERS ----------
async function viewRegistrants(eventId) {
  const ev = events.find((x) => x.id === eventId);
  document.getElementById("regModalTitle").textContent = "👥 " + ev.title;

  const { data, error } = await db
    .from("registrations")
    .select("id, created_at, profiles(name, email)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) return alert(error.message);

  const ul = document.getElementById("regUsers");
  ul.innerHTML = data.length === 0
    ? `<p class="empty">No one has registered yet.</p>`
    : data.map((r) => `
        <li class="reg-item">
          <span>
            <strong>${esc(r.profiles?.name || "Unnamed")}</strong>
            <small>${esc(r.profiles?.email)}</small>
          </span>
        </li>`).join("");

  document.getElementById("regModal").classList.add("show");
}