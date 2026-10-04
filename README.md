# ☁️🎟️ Cloud-Based EventConnect: Event Registration & Management System

A cloud-based web app where students can browse college events, register for them and cancel registrations, while admins manage events and see who has registered. All data is stored in the cloud using Supabase.

🔗 **Live Demo:** [https://danyaramesh1647-lang.github.io/Cloud-Based-EventConnect/](https://danyaramesh1647-lang.github.io/Cloud-Based-EventConnect/)

## ✨ Features

**User side**
- Register and log in (Supabase Authentication)
- Browse events with date, time, venue and capacity
- Search events and filter by category
- Register for an event (duplicate registrations are blocked)
- View and cancel my registrations

**Admin side**
- Role-based access (admin and user)
- Add, edit and delete events
- View the list of registered users for each event
- Live registration count per event

**Security**
- Row Level Security (RLS): users see only their own registrations, and only admins can create, edit or delete events

## 🛠️ Technologies
| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Authentication | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Hosting | GitHub Pages |
| Version control | Git and GitHub |

## ☁️ Cloud Architecture
```
User → HTML + CSS + JavaScript → Supabase JS Client
        → Supabase Authentication
        → Supabase Cloud Database (profiles, events, registrations)
```
There is no separate backend server. Supabase provides authentication, database and APIs.

## 🗄️ Database Schema
- **profiles:** id, name, email, role, created_at
- **events:** id, title, description, category, venue, event_date, capacity, created_at
- **registrations:** id, user_id, event_id, created_at (unique per user and event)

## 📁 Project Structure
```
Cloud-Based-EventConnect/
├── index.html
├── login.html
├── register.html
├── admin.html
├── css/style.css
├── js/
│   ├── supabase.js
│   ├── auth.js
│   ├── app.js
│   └── admin.js
└── README.md
```

## 🚀 Run Locally
1. Clone the repo
2. Create a Supabase project and run the SQL for the tables, trigger and RLS policies
3. Add your Project URL and publishable key in `js/supabase.js`
4. Make an account an admin: `update profiles set role = 'admin' where email = 'you@example.com';`
5. Open `login.html` with VS Code Live Server

## 👩‍💻 Author
Danya