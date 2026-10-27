# Task Management Planner

A beginner-friendly full-stack task planner for first-year B.Tech students. It lets users create, search, edit, prioritize, complete, and delete tasks, set due dates, and track overall progress.

## Problem statement

Students often manage classes, assignments, exams, and personal work in different places. This app keeps tasks in one simple workspace and makes upcoming and overdue work easier to spot.

## Objectives

- Organize tasks with descriptions, due dates, and priorities.
- Track progress using completion status and a progress bar.
- Search tasks and filter by due date, completion, or priority.
- Store tasks persistently in Supabase PostgreSQL.

## Target users and roles

The MVP is a single shared task board intended for a local classroom demonstration. It does **not** include user accounts or per-user privacy. Do not deploy this version publicly as a multi-user service until authentication, authorization, and user ownership have been added.

## Features

- Create, edit, complete/reopen, and delete tasks.
- Filter all tasks, due-today tasks, upcoming tasks, and completed tasks.
- Search by title or description.
- Filter by Low, Medium, or High priority.
- Summary cards for total, in-progress, completed, and overdue tasks.
- Responsive layout and validation feedback.
- Health endpoint for server/database status.

## Technology stack

- HTML5, CSS3, Vanilla JavaScript
- Node.js and Express.js
- Supabase PostgreSQL
- Git and GitHub
- npm packages: `express`, `@supabase/supabase-js`, `dotenv`, and `helmet`

## Folder structure

```text
Task-Management-Planner/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── supabase.js
│   ├── routes/
│   │   └── tasks.js
│   ├── middleware/
│   ├── utils/
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   └── .env                 # create locally; do not commit
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

## Prerequisites

Install these on your computer:

- [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js LTS](https://nodejs.org/)
- [Git](https://git-scm.com/)
- A free [Supabase](https://supabase.com/) account

Verify installations in a new VS Code terminal:

```bash
node --version
npm --version
git --version
```

Each command should print a version number.

## Setup instructions (Windows / VS Code)

### 1. Open the project

Open the `Task-Management-Planner` folder in VS Code. In VS Code choose **Terminal → New Terminal**.

### 2. Create a Supabase project and database table

1. Sign in to Supabase and create a project.
2. Open **SQL Editor** in the project dashboard.
3. Open this repository's `database/schema.sql`, copy all its SQL, paste it into SQL Editor, and click **Run**.
4. Open **Table Editor** and confirm that a `tasks` table exists with columns such as `id`, `title`, `due_date`, `priority`, and `completed`.

### 3. Set environment variables

In the VS Code Explorer, create `backend/.env` by copying `backend/.env.example`. Replace the example values with the project's actual values from Supabase's project API settings:

```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SECRET_KEY
```

Use the server-side secret key only on your own backend. Depending on your Supabase dashboard/key format, the key may be called a secret key; older projects may show a `service_role` key. Never place it in `frontend/`, never commit it, and never share it in screenshots. Do not use the public anon/publishable key as the privileged server key for this starter.

### 4. Install backend dependencies

Run these commands from the project root:

```bash
cd backend
npm install
```

`npm install` reads `package.json` and downloads the required packages into `backend/node_modules/`. That folder is ignored by Git.

### 5. Start the server

While your terminal is in `backend/`, run:

```bash
npm start
```

Expected terminal message:

```text
Task Management Planner running at http://localhost:3000
```

Keep this terminal running.

### 6. Open the application

Visit [http://localhost:3000](http://localhost:3000) in your browser. Do not double-click `index.html` or use a separate Live Server port: the Express server serves the frontend and its `/api` requests.

### 7. Verify the backend and database

Open [http://localhost:3000/api/health](http://localhost:3000/api/health). When configured successfully, the JSON should include `"status":"ok"` and `"database":"connected"`. If it says `not_configured`, check `backend/.env` and restart the server. If it says `error`, check the terminal, URL, key, and whether `schema.sql` was run.

## API endpoints

All endpoints return JSON except the frontend static files.

| Method | Path | Purpose | Request |
|---|---|---|---|
| GET | `/api/health` | Server and DB status | None |
| GET | `/api/tasks` | List tasks | None |
| POST | `/api/tasks` | Create a task | JSON: `title`, `due_date`; optional `description`, `priority` |
| PATCH | `/api/tasks/:id` | Update fields or completion | JSON with one or more of `title`, `description`, `due_date`, `priority`, `completed` |
| DELETE | `/api/tasks/:id` | Delete a task | None |

Successful responses include `{ "tasks": [...] }`, `{ "task": {...} }`, or a confirmation message. Invalid input returns HTTP 400; missing task IDs return HTTP 404; unconfigured database returns HTTP 503.

### Example create request

```json
{
  "title": "Prepare for exam",
  "description": "Revise lecture notes",
  "due_date": "2026-12-15",
  "priority": "High"
}
```

## Architecture

1. The browser displays `frontend/index.html` and loads CSS and JavaScript.
2. `frontend/app.js` calls the Express API using `fetch()`.
3. `backend/server.js` validates and routes requests.
4. `backend/routes/tasks.js` validates fields and reads/writes the `tasks` table through `backend/supabase.js`.
5. Supabase PostgreSQL stores tasks persistently.

## Security notes and limitations

- This is a classroom MVP with a **shared task list and no login system**.
- The backend uses a server-only Supabase secret/service-role key, which bypasses RLS. The API therefore grants access to anyone who can reach it. Use only for local learning; do not expose it to the public internet.
- Before public deployment, implement authentication, per-user ownership, backend authorization, request rate limiting, and an appropriate RLS design. Keep all privileged credentials on the server.
- The CSS imports Google Fonts for visual styling; the application functionality does not depend on those fonts.

## Manual testing checklist

1. Open the app and confirm the dashboard loads.
2. Create a task with a title, due date, and High priority; confirm it appears.
3. Refresh the browser; confirm the task remains (database persistence).
4. Search for part of its title; confirm filtering works.
5. Change the priority filter; confirm only matching tasks appear.
6. Mark a task complete; confirm the completed count and progress bar update.
7. Select **Completed** in the sidebar; confirm the task appears.
8. Edit the task and save; confirm the updated fields appear.
9. Delete the task and confirm the confirmation prompt appears.
10. Submit a blank title or invalid API body; confirm validation rejects it.
11. Resize the browser to mobile width; confirm the layout adapts.
12. Open `/api/health`; confirm database status is `connected`.

## Troubleshooting

- **`node` or `npm` not recognized:** install Node.js LTS, close and reopen VS Code, then retry the version commands.
- **`git` not recognized:** install Git and restart VS Code.
- **Port 3000 is busy:** set another `PORT` in `backend/.env`, then restart and use that port in the browser.
- **Database not configured:** ensure `.env` is in `backend/`, the values are real, and the server was restarted.
- **Relation `tasks` does not exist:** execute `database/schema.sql` in Supabase SQL Editor.
- **Invalid API key / permission error:** verify the project URL and server-side key. Never paste keys into chat or GitHub.
- **Changes do not appear:** hard-refresh the browser and check the VS Code terminal for errors.

## GitHub upload

Run the following from the project root. If this folder is already a Git repository connected to GitHub, skip `git init` and `git remote add origin` as appropriate.

```bash
git status
git add .
git status
git commit -m "Build Task Management Planner"
git branch -M main
git remote -v
```

If no remote is listed, add your actual GitHub repository URL:

```bash
git remote add origin https://github.com/YOUR-USERNAME/Task-Management-Planner.git
git push -u origin main
```

Replace the example URL with your real repository URL. If the remote already exists, do not add it again; use `git remote set-url origin YOUR_REAL_REPOSITORY_URL` only if you need to correct it.

Before pushing, check that `backend/.env`, any real keys, and `node_modules/` are not staged. `.env.example` should be included. A `.gitignore` file does not erase a secret that was committed earlier; rotate exposed keys immediately and clean repository history if needed.

## Future improvements

- Add Supabase Auth and private task ownership.
- Add task categories, reminders, and calendar views.
- Add automated API tests.
- Add deployment with secure environment variables and access controls.
