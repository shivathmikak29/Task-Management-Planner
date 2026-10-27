const API_BASE = "/api/tasks";
const taskList = document.getElementById("taskList");
const dialog = document.getElementById("taskDialog");
const form = document.getElementById("taskForm");
const toast = document.getElementById("toast");
let tasks = [];
let activeFilter = "all";
let editingId = null;
let toastTimer;

const localDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const today = localDate(new Date());
document.getElementById("dateLabel").textContent = new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}).toUpperCase();

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function escapeHTML(value="") {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
async function request(url, options={}) {
  const response = await fetch(url, {headers:{"Content-Type":"application/json",...(options.headers||{})},...options});
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Something went wrong. Please try again.");
  return body;
}
async function loadTasks() {
  taskList.innerHTML = '<div class="empty-state"><p>Loading your tasks…</p></div>';
  try {
    const data = await request(API_BASE);
    tasks = data.tasks || [];
    render();
  } catch (error) {
    taskList.innerHTML = `<div class="empty-state"><div class="empty-art">!</div><h3>Could not load tasks</h3><p>${escapeHTML(error.message)}<br>Make sure the backend and Supabase are configured.</p><button class="secondary-btn" id="retryBtn">Try again</button></div>`;
    document.getElementById("retryBtn").addEventListener("click", loadTasks);
  }
}
function visibleTasks() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const priority = document.getElementById("priorityFilter").value;
  return tasks.filter(task => {
    const isToday = task.due_date === today;
    const isUpcoming = task.due_date > today;
    const isOverdue = task.due_date < today && !task.completed;
    const matchesFilter = activeFilter === "all" ||
      (activeFilter === "today" && isToday && !task.completed) ||
      (activeFilter === "upcoming" && isUpcoming && !task.completed) ||
      (activeFilter === "completed" && task.completed);
    const matchesSearch = `${task.title} ${task.description || ""}`.toLowerCase().includes(query);
    return matchesFilter && matchesSearch && (priority === "all" || task.priority === priority);
  });
}
function render() {
  const completed = tasks.filter(t => t.completed).length;
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  document.getElementById("allCount").textContent = tasks.length;
  document.getElementById("totalStat").textContent = tasks.length;
  document.getElementById("progressStat").textContent = tasks.length - completed;
  document.getElementById("completedStat").textContent = completed;
  document.getElementById("overdueStat").textContent = tasks.filter(t => !t.completed && t.due_date < today).length;
  document.getElementById("progressLabel").textContent = `${progress}%`;
  document.getElementById("progressBar").style.width = `${progress}%`;
  document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.filter === activeFilter));
  const list = visibleTasks().sort((a,b) => Number(a.completed)-Number(b.completed) || a.due_date.localeCompare(b.due_date));
  if (!list.length) {
    taskList.innerHTML = `<div class="empty-state"><div class="empty-art">${tasks.length ? "⌕" : "✓"}</div><h3>${tasks.length ? "No matching tasks" : "Your next achievement starts here"}</h3><p>${tasks.length ? "Try another search or filter." : "Add a task to begin planning your day."}</p><button class="primary-btn" id="emptyAddBtn">＋ ${tasks.length ? "Add a task" : "Create your first task"}</button></div>`;
    document.getElementById("emptyAddBtn").addEventListener("click", openCreateDialog);
    return;
  }
  taskList.innerHTML = list.map(task => {
    const overdue = !task.completed && task.due_date < today;
    const due = new Date(`${task.due_date}T00:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
    return `<article class="task-row ${task.completed ? "is-complete" : ""}">
      <input class="task-check" type="checkbox" aria-label="Mark ${escapeHTML(task.title)} complete" data-action="toggle" data-id="${task.id}" ${task.completed ? "checked" : ""}>
      <div class="task-main"><p class="task-title">${escapeHTML(task.title)}</p>${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ""}<div class="task-meta"><span class="priority ${escapeHTML(task.priority)}">${escapeHTML(task.priority)} priority</span><span class="due-date ${overdue ? "overdue" : ""}">${overdue ? "Overdue · " : "Due "}${escapeHTML(due)}</span></div></div>
      <div class="task-actions"><button class="icon-btn" title="Edit task" aria-label="Edit ${escapeHTML(task.title)}" data-action="edit" data-id="${task.id}">✎</button><button class="icon-btn" title="Delete task" aria-label="Delete ${escapeHTML(task.title)}" data-action="delete" data-id="${task.id}">⌫</button></div>
    </article>`;
  }).join("");
}
function openCreateDialog() {
  editingId = null;
  form.reset();
  document.getElementById("dialogTitle").textContent = "Create a task";
  document.getElementById("saveTaskBtn").textContent = "Save task";
  document.getElementById("taskDueDate").value = today;
  document.getElementById("formError").textContent = "";
  dialog.showModal();
  document.getElementById("taskTitle").focus();
}
function openEditDialog(task) {
  editingId = task.id;
  form.elements.title.value = task.title;
  form.elements.description.value = task.description || "";
  form.elements.dueDate.value = task.due_date;
  form.elements.priority.value = task.priority;
  document.getElementById("dialogTitle").textContent = "Edit task";
  document.getElementById("saveTaskBtn").textContent = "Save changes";
  document.getElementById("formError").textContent = "";
  dialog.showModal();
  document.getElementById("taskTitle").focus();
}
async function handleSubmit(event) {
  event.preventDefault();
  const title = form.elements.title.value.trim();
  const description = form.elements.description.value.trim();
  const dueDate = form.elements.dueDate.value;
  const priority = form.elements.priority.value;
  const errorBox = document.getElementById("formError");
  if (!title || !dueDate) { errorBox.textContent = "Please enter a title and due date."; return; }
  if (dueDate < today && !editingId) { errorBox.textContent = "Choose today or a future date for a new task."; return; }
  const button = document.getElementById("saveTaskBtn");
  button.disabled = true; button.textContent = "Saving…"; errorBox.textContent = "";
  try {
    if (editingId) {
      const data = await request(`${API_BASE}/${editingId}`, {method:"PATCH",body:JSON.stringify({title,description,due_date:dueDate,priority})});
      tasks = tasks.map(t => t.id === editingId ? data.task : t);
      showToast("Task updated successfully.");
    } else {
      const data = await request(API_BASE, {method:"POST",body:JSON.stringify({title,description,due_date:dueDate,priority})});
      tasks.unshift(data.task);
      showToast("Task created successfully.");
    }
    dialog.close(); render();
  } catch (error) { errorBox.textContent = error.message; }
  finally { button.disabled = false; button.textContent = editingId ? "Save changes" : "Save task"; }
}
async function handleTaskAction(event) {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const id = control.dataset.id;
  const task = tasks.find(t => String(t.id) === String(id));
  if (!task) return;
  try {
    if (control.dataset.action === "toggle") {
      const data = await request(`${API_BASE}/${id}`, {method:"PATCH",body:JSON.stringify({completed:control.checked})});
      tasks = tasks.map(t => String(t.id) === String(id) ? data.task : t);
      showToast(data.task.completed ? "Task completed — well done!" : "Task moved back to in progress.");
    } else if (control.dataset.action === "edit") {
      openEditDialog(task); return;
    } else if (control.dataset.action === "delete") {
      if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
      await request(`${API_BASE}/${id}`, {method:"DELETE"});
      tasks = tasks.filter(t => String(t.id) !== String(id));
      showToast("Task deleted.");
    }
    render();
  } catch (error) { showToast(error.message); await loadTasks(); }
}
document.getElementById("addTaskTop").addEventListener("click", openCreateDialog);
document.getElementById("closeDialog").addEventListener("click", () => dialog.close());
document.getElementById("cancelDialog").addEventListener("click", () => dialog.close());
document.getElementById("emptyAddBtn")?.addEventListener("click", openCreateDialog);
form.addEventListener("submit", handleSubmit);
taskList.addEventListener("click", handleTaskAction);
taskList.addEventListener("change", handleTaskAction);
document.getElementById("searchInput").addEventListener("input", render);
document.getElementById("priorityFilter").addEventListener("change", render);
document.querySelectorAll(".nav-item").forEach(button => button.addEventListener("click", () => { activeFilter = button.dataset.filter; render(); }));
loadTasks();
