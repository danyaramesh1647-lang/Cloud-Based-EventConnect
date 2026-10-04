// Register
async function registerUser(name, email, password) {
  const { error } = await db.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });
  if (error) return alert(error.message);
  alert("Registered successfully! 🎟️");
  window.location.href = "index.html";
}

// Login (admin goes to admin.html, everyone else to index.html)
async function loginUser(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);

  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  window.location.href = profile?.role === "admin" ? "admin.html" : "index.html";
}

// Logout
async function logoutUser() {
  await db.auth.signOut();
  window.location.href = "login.html";
}

// Protect user pages. Returns { user, profile }
async function requireAuth() {
  const { data } = await db.auth.getSession();
  if (!data.session) {
    window.location.href = "login.html";
    return null;
  }
  const user = data.session.user;
  const { data: profile } = await db.from("profiles").select("*").eq("id", user.id).single();
  return { user, profile };
}

// Protect admin page. Non-admins get sent back to index.html
async function requireAdmin() {
  const session = await requireAuth();
  if (!session) return null;
  if (session.profile?.role !== "admin") {
    alert("Admins only!");
    window.location.href = "index.html";
    return null;
  }
  return session;
}