// Admin Project Board Management (Kanban-style)
let projects = JSON.parse(localStorage.getItem("projects")) || [];
let projectTasks = JSON.parse(localStorage.getItem("projectTasks")) || [];
let employees = JSON.parse(localStorage.getItem("employees")) || [];

function showAdminProjects() {
  const content = document.getElementById("contentArea");
  if (!content) {
    console.error("contentArea element not found in DOM");
    return;
  }

  content.innerHTML = `
    <div class="dashboard-header">
      <h2>Project Management</h2>
      <button onclick="showAddProjectModal()" class="btn btn-success">
        <i class="fas fa-plus"></i> New Project
      </button>
    </div>

    <div class="project-stats">
      <div class="stat-card">
        <i class="fas fa-project-diagram"></i>
        <h3>${projects.length}</h3>
        <p>Total Projects</p>
      </div>
      <div class="stat-card">
        <i class="fas fa-tasks"></i>
        <h3>${projectTasks.length}</h3>
        <p>Project Tasks</p>
      </div>
      <div class="stat-card">
        <i class="fas fa-users"></i>
        <h3>${new Set(projects.flatMap((p) => p.teamMembers || [])).size}</h3>
        <p>Team Members</p>
      </div>
    </div>

    <div class="projects-list" id="projectsList"></div>

    <!-- Add Project Modal -->
    <div id="addProjectModal" class="modal-overlay">
      <div class="modal-box">
        <span class="modal-close" onclick="closeModal('addProjectModal')">&times;</span>
        <h2>Create New Project</h2>
        <form onsubmit="addProject(event)">
          <div class="form-group">
            <label>Project Name *</label>
            <input type="text" id="projectName" required>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="projectDescription" rows="3"></textarea>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Start Date *</label>
              <input type="date" id="projectStartDate" required>
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input type="date" id="projectEndDate">
            </div>
          </div>
          <div class="form-group">
            <label>Team Members</label>
            <select id="projectTeamMembers" multiple style="height: 120px;">
              ${employees
                .map(
                  (emp) =>
                    `<option value="${emp.id}">${emp.name} - ${emp.department}</option>`
                )
                .join("")}
            </select>
            <small>Hold Ctrl/Cmd to select multiple</small>
          </div>
          <div class="form-group">
            <label>Status *</label>
            <select id="projectStatus" required>
              <option value="planning">Planning</option>
              <option value="in-progress" selected>In Progress</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" onclick="closeModal('addProjectModal')" class="btn btn-danger">Cancel</button>
            <button type="submit" class="btn btn-success">Create Project</button>
          </div>
        </form>
      </div>
    </div>
  `;

  displayProjects();
}

function displayProjects() {
  const container = document.getElementById("projectsList");
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; padding: 40px; color: #999;">No projects yet. Create your first project!</p>';
    return;
  }

  container.innerHTML = projects
    .map((project) => {
      const tasks = projectTasks.filter((t) => t.projectId === project.id);
      const completedTasks = tasks.filter(
        (t) => t.status === "completed"
      ).length;
      const progress =
        tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

      return `
      <div class="project-card">
        <div class="project-header">
          <div>
            <h3>${project.name}</h3>
            <span class="status-badge ${project.status}">${
        project.status
      }</span>
          </div>
          <div class="project-actions">
            <button onclick="viewProjectBoard(${
              project.id
            })" class="btn btn-primary" style="padding: 8px 12px; font-size: 12px;">
              <i class="fas fa-columns"></i> Board
            </button>
            <button onclick="editProject(${project.id})" class="btn-icon">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteProject(${project.id})" class="btn-icon">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        ${
          project.description
            ? `<p class="project-description">${project.description}</p>`
            : ""
        }
        
        <div class="project-meta">
          <span><i class="fas fa-calendar"></i> ${formatDate(
            project.startDate
          )} - ${
        project.endDate ? formatDate(project.endDate) : "Ongoing"
      }</span>
          <span><i class="fas fa-tasks"></i> ${completedTasks}/${
        tasks.length
      } Tasks</span>
          <span><i class="fas fa-users"></i> ${
            project.teamMembers ? project.teamMembers.length : 0
          } Members</span>
        </div>
        
        <div class="progress-section">
          <div class="progress-header">
            <span>Progress</span>
            <span>${Math.round(progress)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
        </div>
        
        ${
          project.teamMembers && project.teamMembers.length > 0
            ? `
          <div class="team-avatars">
            ${project.teamMembers
              .slice(0, 5)
              .map((empId) => {
                const emp = employees.find((e) => e.id === empId);
                return emp
                  ? `<div class="avatar" title="${emp.name}">${emp.name.charAt(
                      0
                    )}</div>`
                  : "";
              })
              .join("")}
            ${
              project.teamMembers.length > 5
                ? `<div class="avatar">+${project.teamMembers.length - 5}</div>`
                : ""
            }
          </div>
        `
            : ""
        }
      </div>
    `;
    })
    .join("");
}

function showAddProjectModal() {
  document.getElementById("addProjectModal").style.display = "block";
}

function addProject(event) {
  event.preventDefault();

  const selectedMembers = Array.from(
    document.getElementById("projectTeamMembers").selectedOptions
  ).map((option) => parseInt(option.value));

  const project = {
    id: Date.now(),
    name: document.getElementById("projectName").value,
    description: document.getElementById("projectDescription").value,
    startDate: document.getElementById("projectStartDate").value,
    endDate: document.getElementById("projectEndDate").value,
    teamMembers: selectedMembers,
    status: document.getElementById("projectStatus").value,
    createdDate: new Date().toISOString(),
  };

  projects.push(project);
  localStorage.setItem("projects", JSON.stringify(projects));

  closeModal("addProjectModal");
  showAdminProjects();
  showNotification("Project created successfully!", "success");
}

function editProject(projectId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;
  showNotification("Edit functionality coming soon", "info");
}

function viewProjectBoard(projectId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;

  const tasks = projectTasks.filter((t) => t.projectId === projectId);
  const content = document.getElementById("contentArea");

  content.innerHTML = `
    <div class="dashboard-header">
      <div>
        <h2>${project.name}</h2>
        <p style="margin: 0; color: #666;">${project.description || ""}</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button onclick="showAddProjectTaskModal(${projectId})" class="btn btn-success">
          <i class="fas fa-plus"></i> Add Task
        </button>
        <button onclick="showAdminProjects()" class="btn btn-danger">Back</button>
      </div>
    </div>

    <div class="kanban-board">
      <div class="kanban-column">
        <div class="kanban-header">
          <h3>To Do</h3>
          <span class="task-count">${
            tasks.filter((t) => t.status === "todo").length
          }</span>
        </div>
        <div class="kanban-tasks" id="todoTasks"></div>
      </div>
      
      <div class="kanban-column">
        <div class="kanban-header">
          <h3>In Progress</h3>
          <span class="task-count">${
            tasks.filter((t) => t.status === "in-progress").length
          }</span>
        </div>
        <div class="kanban-tasks" id="inProgressTasks"></div>
      </div>
      
      <div class="kanban-column">
        <div class="kanban-header">
          <h3>Review</h3>
          <span class="task-count">${
            tasks.filter((t) => t.status === "review").length
          }</span>
        </div>
        <div class="kanban-tasks" id="reviewTasks"></div>
      </div>
      
      <div class="kanban-column">
        <div class="kanban-header">
          <h3>Completed</h3>
          <span class="task-count">${
            tasks.filter((t) => t.status === "completed").length
          }</span>
        </div>
        <div class="kanban-tasks" id="completedTasks"></div>
      </div>
    </div>

    <!-- Add Project Task Modal -->
    <div id="addProjectTaskModal" class="modal-overlay">
      <div class="modal-box">
        <span class="modal-close" onclick="closeModal('addProjectTaskModal')">&times;</span>
        <h2>Add Task to Project</h2>
        <form onsubmit="addProjectTask(event, ${projectId})">
          <div class="form-group">
            <label>Task Name *</label>
            <input type="text" id="projectTaskName" required>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="projectTaskDescription" rows="2"></textarea>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Assign To</label>
              <select id="projectTaskAssignee">
                <option value="">Unassigned</option>
                ${
                  project.teamMembers
                    ? project.teamMembers
                        .map((empId) => {
                          const emp = employees.find((e) => e.id === empId);
                          return emp
                            ? `<option value="${emp.id}">${emp.name}</option>`
                            : "";
                        })
                        .join("")
                    : ""
                }
              </select>
            </div>
            <div class="form-group">
              <label>Priority</label>
              <select id="projectTaskPriority">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Due Date</label>
            <input type="date" id="projectTaskDueDate">
          </div>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" onclick="closeModal('addProjectTaskModal')" class="btn btn-danger">Cancel</button>
            <button type="submit" class="btn btn-success">Add Task</button>
          </div>
        </form>
      </div>
    </div>
  `;

  displayKanbanTasks(projectId);
}

function displayKanbanTasks(projectId) {
  const tasks = projectTasks.filter((t) => t.projectId === projectId);

  const columns = {
    todo: document.getElementById("todoTasks"),
    "in-progress": document.getElementById("inProgressTasks"),
    review: document.getElementById("reviewTasks"),
    completed: document.getElementById("completedTasks"),
  };

  Object.values(columns).forEach((col) => (col.innerHTML = ""));

  tasks.forEach((task) => {
    const assignee = task.assigneeId
      ? employees.find((e) => e.id === task.assigneeId)
      : null;

    const taskCard = document.createElement("div");
    taskCard.className = "kanban-task";
    taskCard.draggable = true;
    taskCard.ondragstart = (e) => handleDragStart(e, task.id);

    taskCard.innerHTML = `
      <div class="kanban-task-header">
        <span class="priority-badge ${task.priority}">${task.priority}</span>
        <button onclick="deleteProjectTask(${
          task.id
        }, ${projectId})" class="btn-icon-small">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <h4>${task.name}</h4>
      ${task.description ? `<p>${task.description}</p>` : ""}
      <div class="kanban-task-footer">
        ${
          assignee
            ? `
          <div class="assignee-info">
            <div class="avatar small">${assignee.name.charAt(0)}</div>
            <span>${assignee.name}</span>
          </div>
        `
            : '<span style="color: #999;">Unassigned</span>'
        }
        ${
          task.dueDate
            ? `<small><i class="fas fa-calendar"></i> ${formatDate(
                task.dueDate
              )}</small>`
            : ""
        }
      </div>
    `;

    if (columns[task.status]) {
      columns[task.status].appendChild(taskCard);
    }
  });

  Object.entries(columns).forEach(([status, col]) => {
    col.ondragover = (e) => e.preventDefault();
    col.ondrop = (e) => handleDrop(e, status, projectId);
  });
}

let draggedTaskId = null;

function handleDragStart(event, taskId) {
  draggedTaskId = taskId;
  event.target.style.opacity = "0.5";
}

function handleDrop(event, newStatus, projectId) {
  event.preventDefault();

  if (!draggedTaskId) return;

  const taskIndex = projectTasks.findIndex((t) => t.id === draggedTaskId);
  if (taskIndex !== -1) {
    projectTasks[taskIndex].status = newStatus;
    localStorage.setItem("projectTasks", JSON.stringify(projectTasks));
    displayKanbanTasks(projectId);
    showNotification("Task moved!", "success");
  }

  draggedTaskId = null;
}

function showAddProjectTaskModal(projectId) {
  document.getElementById("addProjectTaskModal").style.display = "block";
}

function addProjectTask(event, projectId) {
  event.preventDefault();

  const assigneeId = document.getElementById("projectTaskAssignee").value;

  const task = {
    id: Date.now(),
    projectId: projectId,
    name: document.getElementById("projectTaskName").value,
    description: document.getElementById("projectTaskDescription").value,
    assigneeId: assigneeId ? parseInt(assigneeId) : null,
    priority: document.getElementById("projectTaskPriority").value,
    dueDate: document.getElementById("projectTaskDueDate").value,
    status: "todo",
    createdDate: new Date().toISOString(),
  };

  projectTasks.push(task);
  localStorage.setItem("projectTasks", JSON.stringify(projectTasks));

  closeModal("addProjectTaskModal");
  viewProjectBoard(projectId);
  showNotification("Task added to project!", "success");
}

function deleteProjectTask(taskId, projectId) {
  if (!confirm("Delete this task?")) return;

  projectTasks = projectTasks.filter((t) => t.id !== taskId);
  localStorage.setItem("projectTasks", JSON.stringify(projectTasks));
  displayKanbanTasks(projectId);
  showNotification("Task deleted!", "success");
}

function deleteProject(projectId) {
  if (!confirm("Delete this project and all its tasks?")) return;

  projects = projects.filter((p) => p.id !== projectId);
  projectTasks = projectTasks.filter((t) => t.projectId !== projectId);

  localStorage.setItem("projects", JSON.stringify(projects));
  localStorage.setItem("projectTasks", JSON.stringify(projectTasks));

  showAdminProjects();
  showNotification("Project deleted!", "success");
}

console.log("✅ Admin Projects Module Loaded");
