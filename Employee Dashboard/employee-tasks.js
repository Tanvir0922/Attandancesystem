// Employee Task View and Management with Firestore Integration
let employeeTasks = [];

async function showEmployeeTasks() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const employeeId = currentUser ? currentUser.id : null;

  if (!employeeId) {
    const content = document.getElementById("contentArea");
    if (content) {
      content.innerHTML =
        '<div class="alert alert-error">Please login to view tasks</div>';
    }
    return;
  }

  const content = document.getElementById("contentArea");
  if (!content) {
    console.error("contentArea element not found");
    return;
  }

  // Load tasks from localStorage
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  employeeTasks = tasks.filter((t) => t.assigneeId === employeeId);

  content.innerHTML = `
    <div class="dashboard-header">
      <h2>My Tasks</h2>
    </div>

    <div class="task-stats">
      <div class="stat-card">
        <i class="fas fa-clipboard-list"></i>
        <h3>${employeeTasks.length}</h3>
        <p>Total Tasks</p>
      </div>
      <div class="stat-card">
        <i class="fas fa-hourglass-half"></i>
        <h3>${
          employeeTasks.filter(
            (t) => t.status === "pending" || t.status === "todo"
          ).length
        }</h3>
        <p>Pending</p>
      </div>
      <div class="stat-card">
        <i class="fas fa-spinner"></i>
        <h3>${
          employeeTasks.filter((t) => t.status === "in-progress").length
        }</h3>
        <p>In Progress</p>
      </div>
      <div class="stat-card">
        <i class="fas fa-check-circle"></i>
        <h3>${employeeTasks.filter((t) => t.status === "completed").length}</h3>
        <p>Completed</p>
      </div>
    </div>

    <div class="filters-section">
      <div class="filter-group">
        <label>Filter by Status:</label>
        <select id="filterTaskStatus" onchange="filterEmployeeTasks()">
          <option value="">All Tasks</option>
          <option value="pending">Pending</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Filter by Priority:</label>
        <select id="filterTaskPriority" onchange="filterEmployeeTasks()">
          <option value="">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>
    </div>

    <div class="tasks-container" id="employeeTasksContainer"></div>

    <!-- Time Log Modal -->
    <div id="timeLogModal" class="modal-overlay">
      <div class="modal-box">
        <span class="modal-close" onclick="closeModal('timeLogModal')">&times;</span>
        <h2>Log Time</h2>
        <form onsubmit="logTime(event)">
          <input type="hidden" id="logTaskId">
          <div class="form-group">
            <label>Hours Spent *</label>
            <input type="number" id="logHours" step="0.5" min="0.5" required>
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea id="logNotes" rows="3" placeholder="What did you work on?"></textarea>
          </div>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" onclick="closeModal('timeLogModal')" class="btn btn-danger">Cancel</button>
            <button type="submit" class="btn btn-success">Log Time</button>
          </div>
        </form>
      </div>
    </div>
  `;

  displayEmployeeTasks();
}

function displayEmployeeTasks(filteredTasks = null) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const employeeId = currentUser ? currentUser.id : null;

  if (!employeeId) return;

  const container = document.getElementById("employeeTasksContainer");
  if (!container) return;

  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const myTasks =
    filteredTasks || tasks.filter((t) => t.assigneeId === employeeId);

  if (myTasks.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; padding: 40px; color: #999;">No tasks assigned yet</p>';
    return;
  }

  // Sort by deadline
  myTasks.sort((a, b) => {
    if (!a.deadline || !b.deadline) return 0;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  container.innerHTML = myTasks
    .map((task) => {
      const isOverdue =
        task.deadline &&
        new Date(task.deadline) < new Date() &&
        task.status !== "completed";

      const progress =
        task.estimatedHours && task.estimatedHours > 0
          ? Math.min((task.timeSpent || 0 / task.estimatedHours) * 100, 100)
          : 0;

      return `
        <div class="task-card ${isOverdue ? "overdue" : ""}">
          <div class="task-header">
            <div>
              <h3>${task.name}</h3>
              <span class="status-badge ${task.status}">${task.status}</span>
            </div>
            <div class="task-actions">
              <button onclick="updateTaskStatus(${
                task.id
              }, 'in-progress')" class="btn-icon" title="Start Task">
                <i class="fas fa-play"></i>
              </button>
              <button onclick="updateTaskStatus(${
                task.id
              }, 'completed')" class="btn-icon" title="Complete Task">
                <i class="fas fa-check"></i>
              </button>
            </div>
          </div>
          
          ${
            task.description
              ? `<p class="task-description">${task.description}</p>`
              : ""
          }
          
          <div class="task-meta">
            ${
              task.deadline
                ? `
              <span>
                <i class="fas fa-calendar"></i>
                Due: ${formatDateTime(task.deadline)}
              </span>
            `
                : ""
            }
            ${
              task.estimatedHours
                ? `
              <span>
                <i class="fas fa-clock"></i>
                ${task.timeSpent || 0} / ${task.estimatedHours} hrs
              </span>
            `
                : ""
            }
          </div>
          
          ${
            task.estimatedHours && task.estimatedHours > 0
              ? `
            <div class="progress-section">
              <div class="progress-header">
                <span>Progress</span>
                <span>${Math.round(progress)}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
              </div>
            </div>
          `
              : ""
          }
          
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <select onchange="updateTaskStatus(${
              task.id
            }, this.value)" class="status-select ${
        task.status
      }" style="flex: 1;">
              <option value="pending" ${
                task.status === "pending" ? "selected" : ""
              }>Pending</option>
              <option value="todo" ${
                task.status === "todo" ? "selected" : ""
              }>To Do</option>
              <option value="in-progress" ${
                task.status === "in-progress" ? "selected" : ""
              }>In Progress</option>
              <option value="completed" ${
                task.status === "completed" ? "selected" : ""
              }>Completed</option>
            </select>
            <button onclick="showTimeLogModal(${
              task.id
            })" class="btn btn-success" style="padding: 10px 15px; font-size: 12px;">
              <i class="fas fa-plus"></i> Log Time
            </button>
          </div>
          
          ${
            task.timeLogs && task.timeLogs.length > 0
              ? `
            <div class="task-time-logs" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
              <strong style="display: block; margin-bottom: 10px;">Recent Time Logs:</strong>
              ${task.timeLogs
                .slice(-3)
                .reverse()
                .map(
                  (log) => `
                  <div class="time-log-entry" style="margin-bottom: 8px; padding: 8px; background: #f5f5f5; border-radius: 4px;">
                    <span style="display: block; font-weight: 500;">${formatDateTime(
                      log.date
                    )} - ${log.hours} hrs</span>
                    ${
                      log.notes
                        ? `<small style="color: #666;">${log.notes}</small>`
                        : ""
                    }
                  </div>
                `
                )
                .join("")}
            </div>
          `
              : ""
          }

          ${
            isOverdue
              ? `
            <div class="alert alert-warning" style="margin-top: 10px; padding: 8px;">
              <i class="fas fa-exclamation-triangle"></i> This task is overdue!
            </div>
          `
              : ""
          }
        </div>
      `;
    })
    .join("");
}

function filterEmployeeTasks() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const employeeId = currentUser ? currentUser.id : null;

  if (!employeeId) return;

  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const status = document.getElementById("filterTaskStatus").value;
  const priority = document.getElementById("filterTaskPriority").value;

  let filtered = tasks.filter((t) => t.assigneeId === employeeId);

  if (status) {
    filtered = filtered.filter((t) => t.status === status);
  }

  if (priority) {
    filtered = filtered.filter((t) => t.priority === priority);
  }

  displayEmployeeTasks(filtered);
}

function updateTaskStatus(taskId, newStatus) {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const taskIndex = tasks.findIndex((t) => t.id === taskId);

  if (taskIndex !== -1) {
    tasks[taskIndex].status = newStatus;

    if (newStatus === "completed") {
      tasks[taskIndex].completedDate = new Date().toISOString();
    }

    localStorage.setItem("tasks", JSON.stringify(tasks));
    showNotification("Task status updated!", "success");
    displayEmployeeTasks();
  }
}

function showTimeLogModal(taskId) {
  document.getElementById("logTaskId").value = taskId;
  document.getElementById("timeLogModal").style.display = "block";
}

function logTime(event) {
  event.preventDefault();

  const taskId = parseInt(document.getElementById("logTaskId").value);
  const hours = parseFloat(document.getElementById("logHours").value);
  const notes = document.getElementById("logNotes").value;

  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const taskIndex = tasks.findIndex((t) => t.id === taskId);

  if (taskIndex !== -1) {
    if (!tasks[taskIndex].timeLogs) {
      tasks[taskIndex].timeLogs = [];
    }

    tasks[taskIndex].timeLogs.push({
      date: new Date().toISOString(),
      hours: hours,
      notes: notes,
    });

    tasks[taskIndex].timeSpent = (tasks[taskIndex].timeSpent || 0) + hours;

    localStorage.setItem("tasks", JSON.stringify(tasks));

    closeModal("timeLogModal");
    document.getElementById("logHours").value = "";
    document.getElementById("logNotes").value = "";

    showNotification("Time logged successfully!", "success");
    displayEmployeeTasks();
  }
}

function formatDateTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

console.log("✅ Employee Tasks Module Loaded");
