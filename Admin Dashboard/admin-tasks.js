// Admin Task Management with Firestore Integration
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let employees = [];
let currentEditTaskId = null;

// Load employees from Firestore when this module loads
async function loadEmployeesForTasks() {
  try {
    const employeeSnapshot = await db.collection("employees").get();
    employees = [];
    employeeSnapshot.forEach((doc) => {
      employees.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    console.log("✅ Employees loaded for tasks:", employees.length);
    return employees;
  } catch (error) {
    console.error("Error loading employees for tasks:", error);
    showNotification("Failed to load employees", "error");
    return [];
  }
}

async function showAdminTasks() {
  // Load employees first
  await loadEmployeesForTasks();

  const content = document.getElementById("contentArea");
  if (!content) {
    console.error("contentArea element not found");
    return;
  }

  content.innerHTML = `
    <div class="dashboard-header">
      <h2>Task Management</h2>
      <button onclick="showAddTaskModal()" class="btn btn-success">
        <i class="fas fa-plus"></i> New Task
      </button>
    </div>

    <div class="task-stats">
      <div class="stat-card">
        <i class="fas fa-tasks"></i>
        <h3>${tasks.length}</h3>
        <p>Total Tasks</p>
      </div>
      <div class="stat-card">
        <i class="fas fa-hourglass-half"></i>
        <h3>${
          tasks.filter((t) => t.status === "pending" || t.status === "todo")
            .length
        }</h3>
        <p>Pending Tasks</p>
      </div>
      <div class="stat-card">
        <i class="fas fa-spinner"></i>
        <h3>${tasks.filter((t) => t.status === "in-progress").length}</h3>
        <p>In Progress</p>
      </div>
      <div class="stat-card">
        <i class="fas fa-check-circle"></i>
        <h3>${tasks.filter((t) => t.status === "completed").length}</h3>
        <p>Completed</p>
      </div>
    </div>

    <div class="filters-section">
      <div class="filter-group">
        <label>Filter by Status:</label>
        <select id="statusFilter" onchange="filterTasks()">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Filter by Priority:</label>
        <select id="priorityFilter" onchange="filterTasks()">
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
    </div>

    <div class="tasks-list" id="tasksList"></div>

    <!-- Add Task Modal -->
    <div id="addTaskModal" class="modal-overlay">
      <div class="modal-box">
        <span class="modal-close" onclick="closeModal('addTaskModal')">&times;</span>
        <h2>Create New Task</h2>
        <form onsubmit="addTask(event)">
          <div class="form-group">
            <label>Task Name *</label>
            <input type="text" id="taskName" required>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="taskDescription" rows="3"></textarea>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Assign To</label>
              <select id="taskAssignee">
                <option value="">Unassigned</option>
                ${employees
                  .map(
                    (emp) =>
                      `<option value="${emp.id}">${emp.name} - ${
                        emp.department || ""
                      }</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="form-group">
              <label>Priority *</label>
              <select id="taskPriority" required>
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Start Date</label>
              <input type="date" id="taskStartDate">
            </div>
            <div class="form-group">
              <label>Deadline *</label>
              <input type="date" id="taskDeadline" required>
            </div>
          </div>
          <div class="form-group">
            <label>Status *</label>
            <select id="taskStatus" required>
              <option value="pending">Pending</option>
              <option value="todo" selected>To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" onclick="closeModal('addTaskModal')" class="btn btn-danger">Cancel</button>
            <button type="submit" class="btn btn-success">Create Task</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Task Modal -->
    <div id="editTaskModal" class="modal-overlay">
      <div class="modal-box">
        <span class="modal-close" onclick="closeModal('editTaskModal')">&times;</span>
        <h2>Edit Task</h2>
        <form onsubmit="updateTask(event)">
          <div class="form-group">
            <label>Task Name *</label>
            <input type="text" id="editTaskName" required>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="editTaskDescription" rows="3"></textarea>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Assign To</label>
              <select id="editTaskAssignee">
                <option value="">Unassigned</option>
                ${employees
                  .map(
                    (emp) =>
                      `<option value="${emp.id}">${emp.name} - ${
                        emp.department || ""
                      }</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="form-group">
              <label>Priority *</label>
              <select id="editTaskPriority" required>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Start Date</label>
              <input type="date" id="editTaskStartDate">
            </div>
            <div class="form-group">
              <label>Deadline *</label>
              <input type="date" id="editTaskDeadline" required>
            </div>
          </div>
          <div class="form-group">
            <label>Status *</label>
            <select id="editTaskStatus" required>
              <option value="pending">Pending</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" onclick="closeModal('editTaskModal')" class="btn btn-danger">Cancel</button>
            <button type="submit" class="btn btn-success">Update Task</button>
          </div>
        </form>
      </div>
    </div>
  `;

  displayTasks();
}

function displayTasks() {
  const container = document.getElementById("tasksList");
  if (!container) return;

  const statusFilter = document.getElementById("statusFilter")?.value || "";
  const priorityFilter = document.getElementById("priorityFilter")?.value || "";

  let filteredTasks = tasks;

  if (statusFilter) {
    filteredTasks = filteredTasks.filter((t) => t.status === statusFilter);
  }

  if (priorityFilter) {
    filteredTasks = filteredTasks.filter((t) => t.priority === priorityFilter);
  }

  if (filteredTasks.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; padding: 40px; color: #999;">No tasks found.</p>';
    return;
  }

  container.innerHTML = filteredTasks
    .map((task) => {
      const assignee = task.assigneeId
        ? employees.find((e) => e.id === task.assigneeId)
        : null;

      const isOverdue =
        task.status !== "completed" &&
        task.deadline &&
        new Date(task.deadline) < new Date();

      return `
        <div class="task-card ${isOverdue ? "overdue" : ""}">
          <div class="task-header">
            <div>
              <h3>${task.name}</h3>
              <span class="status-badge ${task.status}">${task.status}</span>
            </div>
            <div class="task-actions">
              <button onclick="editTaskModal(${
                task.id
              })" class="btn-icon" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="deleteTask(${
                task.id
              })" class="btn-icon" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          
          ${
            task.description
              ? `<p class="task-description">${task.description}</p>`
              : ""
          }
          
          <div class="task-meta">
            <span class="priority-badge ${task.priority}">${
        task.priority
      }</span>
            ${
              task.startDate
                ? `<span><i class="fas fa-calendar"></i> Start: ${formatDate(
                    task.startDate
                  )}</span>`
                : ""
            }
            ${
              task.deadline
                ? `<span class="${
                    isOverdue ? "overdue-text" : ""
                  }"><i class="fas fa-hourglass-end"></i> Due: ${formatDate(
                    task.deadline
                  )}</span>`
                : ""
            }
          </div>

          ${
            assignee
              ? `
            <div class="task-assignee">
              <div class="avatar">${assignee.name.charAt(0)}</div>
              <div>
                <small>Assigned to</small>
                <p>${assignee.name}</p>
              </div>
            </div>
          `
              : '<p style="color: #999; font-size: 12px;"><i class="fas fa-exclamation-circle"></i> Unassigned</p>'
          }

          ${
            isOverdue
              ? '<div class="alert alert-warning" style="margin-top: 10px; padding: 8px;"><i class="fas fa-exclamation-triangle"></i> This task is overdue!</div>'
              : ""
          }
        </div>
      `;
    })
    .join("");
}

function filterTasks() {
  displayTasks();
}

function showAddTaskModal() {
  document.getElementById("addTaskModal").style.display = "block";
}

async function addTask(event) {
  event.preventDefault();

  const assigneeId = document.getElementById("taskAssignee").value;

  const task = {
    id: Date.now(),
    name: document.getElementById("taskName").value,
    description: document.getElementById("taskDescription").value,
    assigneeId: assigneeId ? assigneeId : null,
    priority: document.getElementById("taskPriority").value,
    startDate: document.getElementById("taskStartDate").value,
    deadline: document.getElementById("taskDeadline").value,
    status: document.getElementById("taskStatus").value,
    createdDate: new Date().toISOString(),
  };

  tasks.push(task);
  localStorage.setItem("tasks", JSON.stringify(tasks));

  closeModal("addTaskModal");
  showAdminTasks();
  showNotification("Task created successfully!", "success");
}

async function editTaskModal(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  currentEditTaskId = taskId;

  document.getElementById("editTaskName").value = task.name;
  document.getElementById("editTaskDescription").value = task.description || "";
  document.getElementById("editTaskAssignee").value = task.assigneeId || "";
  document.getElementById("editTaskPriority").value = task.priority;
  document.getElementById("editTaskStartDate").value = task.startDate || "";
  document.getElementById("editTaskDeadline").value = task.deadline;
  document.getElementById("editTaskStatus").value = task.status;

  document.getElementById("editTaskModal").style.display = "block";
}

async function updateTask(event) {
  event.preventDefault();

  if (!currentEditTaskId) return;

  const taskIndex = tasks.findIndex((t) => t.id === currentEditTaskId);
  if (taskIndex === -1) return;

  const assigneeId = document.getElementById("editTaskAssignee").value;

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    name: document.getElementById("editTaskName").value,
    description: document.getElementById("editTaskDescription").value,
    assigneeId: assigneeId ? assigneeId : null,
    priority: document.getElementById("editTaskPriority").value,
    startDate: document.getElementById("editTaskStartDate").value,
    deadline: document.getElementById("editTaskDeadline").value,
    status: document.getElementById("editTaskStatus").value,
    updatedDate: new Date().toISOString(),
  };

  localStorage.setItem("tasks", JSON.stringify(tasks));
  closeModal("editTaskModal");
  showAdminTasks();
  showNotification("Task updated successfully!", "success");
}

function deleteTask(taskId) {
  if (!confirm("Delete this task?")) return;

  tasks = tasks.filter((t) => t.id !== taskId);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  displayTasks();
  showNotification("Task deleted!", "success");
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

console.log("✅ Admin Tasks Module Loaded");
