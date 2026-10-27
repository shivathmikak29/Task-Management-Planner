require("dotenv").config();
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const taskRoutes = require("./routes/tasks");
const { supabase } = require("./supabase");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit:"20kb" }));
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.get("/api/health", async (req, res) => {
  const result = { status:"ok", server:"running", databaseConfigured:Boolean(supabase) };
  if (supabase) {
    const { error } = await supabase.from("tasks").select("id", { count:"exact", head:true });
    result.database = error ? "error" : "connected";
  } else {
    result.database = "not_configured";
  }
  res.status(result.database === "error" ? 503 : 200).json(result);
});
app.use("/api/tasks", taskRoutes);
app.use("/api", (req, res) => res.status(404).json({ error:"API endpoint not found." }));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, "..", "frontend", "index.html")));
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error("Request failed:", err.message);
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  res.status(status).json({ error: status === 500 ? "A server or database error occurred. Check the backend terminal and Supabase setup." : err.message });
});

app.listen(PORT, () => console.log(`Task Management Planner running at http://localhost:${PORT}`));
