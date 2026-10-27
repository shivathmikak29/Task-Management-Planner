const express = require("express");
const router = express.Router();
const { supabase } = require("../supabase");

const priorities = new Set(["Low", "Medium", "High"]);
const validDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0,10) === value;
function ensureDatabase(req, res, next) {
  if (!supabase) return res.status(503).json({ error: "Database is not configured. Add Supabase credentials to backend/.env and restart the server." });
  next();
}
function validateFields(body, partial=false) {
  const errors = [];
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 120) errors.push("Title is required and must be 1–120 characters.");
  }
  if (!partial || body.description !== undefined) {
    if (body.description !== undefined && (typeof body.description !== "string" || body.description.length > 1000)) errors.push("Description must be 1000 characters or fewer.");
  }
  if (!partial || body.due_date !== undefined) {
    if (!validDate(body.due_date)) errors.push("A valid due_date in YYYY-MM-DD format is required.");
  }
  if (body.priority !== undefined && !priorities.has(body.priority)) errors.push("Priority must be Low, Medium, or High.");
  if (body.completed !== undefined && typeof body.completed !== "boolean") errors.push("completed must be true or false.");
  if (partial && !["title","description","due_date","priority","completed"].some(k => body[k] !== undefined)) errors.push("Provide at least one field to update.");
  return errors;
}
function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

router.use(ensureDatabase);

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("tasks").select("id,title,description,due_date,priority,completed,created_at,updated_at").order("completed").order("due_date");
    if (error) throw error;
    res.json({ tasks: data });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  const errors = validateFields(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });
  try {
    const payload = { title:req.body.title.trim(), description:(req.body.description || "").trim(), due_date:req.body.due_date, priority:req.body.priority || "Medium" };
    const { data, error } = await supabase.from("tasks").insert(payload).select().single();
    if (error) throw error;
    res.status(201).json({ task:data });
  } catch (error) { next(error); }
});

router.patch("/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error:"Task ID must be a positive integer." });
  const errors = validateFields(req.body || {}, true);
  if (errors.length) return res.status(400).json({ error:errors.join(" ") });
  const payload = {};
  for (const field of ["title","description","due_date","priority","completed"]) {
    if (req.body[field] !== undefined) payload[field] = field === "title" || field === "description" ? req.body[field].trim() : req.body[field];
  }
  try {
    const { data, error } = await supabase.from("tasks").update(payload).eq("id", id).select().maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error:"Task not found." });
    res.json({ task:data });
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error:"Task ID must be a positive integer." });
  try {
    const { data, error } = await supabase.from("tasks").delete().eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error:"Task not found." });
    res.json({ message:"Task deleted successfully." });
  } catch (error) { next(error); }
});

module.exports = router;
