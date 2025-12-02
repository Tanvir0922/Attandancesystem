// Employee Project View
function showEmployeeProjects() {
  const employeeId = parseInt(localStorage.getItem("currentUser"));
  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const projectTasks = JSON.parse(localStorage.getItem("projectTasks")) || [];

  // Get projects where employee is a team member
  const myProjects = projects.filter(
    (p) => p.teamMembers && p.teamMembers.includes(employeeId)
  );

  // Get tasks assigned to employee
  const myTasks = projectTasks.filter((t) => t.assigneeId === employeeId);

  const content = document.getElementById("content");
  content.innerHTML = `
        <div class="dashboard-header">
            <h2>My Projects</h2>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <i class="fas fa-project-diagram"></i>
                <h3>${myProjects.length}</h3>
                <p>Active Projects</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-tasks"></i>
                <h3>${myTasks.length}</h3>
                <p>My Tasks</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-check-circle"></i>
                <h3>${
                  myTasks.filter((t) => t.status === "completed").length
                }</h3>
                <p>Completed</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-exclamation-circle"></i>
                <h3>${
                  myTasks.filter((t) => t.status === "in-progress").length
                }</h3>
                <p>In Progress</p>
            </div>
        </div>

        <div class="projects-container" id="employeeProjectsContainer"></div>
    `;

  displayEmployeeProjects(myProjects, myTasks);
}

function displayEmployeeProjects(projects, allTasks) {
  const container = document.getElementById("employeeProjectsContainer");

  if (projects.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; padding: 40px;">You are not assigned to any projects yet</p>';
    return;
  }

  container.innerHTML = projects
    .map((project) => {
      const employeeId = parseInt(localStorage.getItem("currentUser"));
      const projectTasks = allTasks.filter((t) => t.projectId === project.id);
      const myProjectTasks = projectTasks.filter(
        (t) => t.assigneeId === employeeId
      );
      const completedTasks = myProjectTasks.filter(
        (t) => t.status === "completed"
      ).length;
      const progress =
        myProjectTasks.length > 0
          ? (completedTasks / myProjectTasks.length) * 100
          : 0;

      return `
            <div class="project-card">
                <div class="project-header">
                    <div>
                        <h3>${project.name}</h3>
                        <span class="status-badge ${project.status}">${
        project.status
      }</span>
                    </div>
                    <button onclick="viewEmployeeProjectDetails(${
                      project.id
                    })" class="btn-primary btn-small">
                        View Details
                    </button>
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
        myProjectTasks.length
      } My Tasks</span>
                </div>
                
                <div class="progress-section">
                    <div class="progress-header">
                        <span>My Progress</span>
                        <span>${Math.round(progress)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                
                ${
                  myProjectTasks.length > 0
                    ? `
                    <div class="task-preview">
                        <strong>My Tasks:</strong>
                        ${myProjectTasks
                          .slice(0, 3)
                          .map(
                            (task) => `
                            <div class="task-preview-item">
                                <span class="priority-badge ${task.priority}">${task.priority}</span>
                                <span>${task.name}</span>
                                <span class="status-badge ${task.status}">${task.status}</span>
                            </div>
                        `
                          )
                          .join("")}
                        ${
                          myProjectTasks.length > 3
                            ? `<small>+${
                                myProjectTasks.length - 3
                              } more tasks</small>`
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

function viewEmployeeProjectDetails(projectId) {
  const employeeId = parseInt(localStorage.getItem("currentUser"));
  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const projectTasks = JSON.parse(localStorage.getItem("projectTasks")) || [];
  const employees = JSON.parse(localStorage.getItem("employees")) || [];

  const project = projects.find((p) => p.id === projectId);
  if (!project) return;

  const myTasks = projectTasks.filter(
    (t) => t.projectId === projectId && t.assigneeId === employeeId
  );

  const content = document.getElementById("content");
  content.innerHTML = `
        <div class="dashboard-header">
            <div>
                <h2>${project.name}</h2>
                <p style="margin: 0; color: #666;">${
                  project.description || ""
                }</p>
            </div>
            <button onclick="showEmployeeProjects()" class="btn-secondary">Back</button>
        </div>

        <div class="project-details-container">
            <div class="detail-section">
                <h3>Project Information</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge ${project.status}">${
    project.status
  }</span>
                    </div>
                    <div class="detail-item">
                        <label>Duration:</label>
                        <span>${formatDate(project.startDate)} - ${
    project.endDate ? formatDate(project.endDate) : "Ongoing"
  }</span>
                    </div>
                    <div class="detail-item">
                        <label>Team Size:</label>
                        <span>${
                          project.teamMembers ? project.teamMembers.length : 0
                        } members</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3>My Tasks (${myTasks.length})</h3>
                <div class="tasks-list">
                    ${
                      myTasks.length > 0
                        ? myTasks
                            .map((task) => {
                              const isOverdue =
                                task.dueDate &&
                                new Date(task.dueDate) < new Date() &&
                                task.status !== "completed";
                              return `
                            <div class="task-item ${
                              isOverdue ? "overdue" : ""
                            }">
                                <div class="task-item-header">
                                    <div>
                                        <h4>${task.name}</h4>
                                        ${
                                          task.description
                                            ? `<p>${task.description}</p>`
                                            : ""
                                        }
                                    </div>
                                    <div class="task-badges">
                                        <span class="priority-badge ${
                                          task.priority
                                        }">${task.priority}</span>
                                        <span class="status-badge ${
                                          task.status
                                        }">${task.status}</span>
                                    </div>
                                </div>
                                ${
                                  task.dueDate
                                    ? `
                                    <div class="task-meta">
                                        <i class="fas fa-calendar"></i> Due: ${formatDate(
                                          task.dueDate
                                        )}
                                        ${
                                          isOverdue
                                            ? '<span class="overdue-label">OVERDUE</span>'
                                            : ""
                                        }
                                    </div>
                                `
                                    : ""
                                }
                                <div class="task-actions">
                                    <select onchange="updateEmployeeTaskStatus(${
                                      task.id
                                    }, this.value, ${projectId})" class="status-select ${
                                task.status
                              }">
                                        <option value="todo" ${
                                          task.status === "todo"
                                            ? "selected"
                                            : ""
                                        }>To Do</option>
                                        <option value="in-progress" ${
                                          task.status === "in-progress"
                                            ? "selected"
                                            : ""
                                        }>In Progress</option>
                                        <option value="review" ${
                                          task.status === "review"
                                            ? "selected"
                                            : ""
                                        }>Review</option>
                                        <option value="completed" ${
                                          task.status === "completed"
                                            ? "selected"
                                            : ""
                                        }>Completed</option>
                                    </select>
                                </div>
                            </div>
                        `;
                            })
                            .join("")
                        : '<p style="text-align: center; padding: 20px; color: #999;">No tasks assigned yet</p>'
                    }
                </div>
            </div>

            <div class="detail-section">
                <h3>Team Members</h3>
                <div class="team-members-list">
                    ${
                      project.teamMembers
                        ? project.teamMembers
                            .map((empId) => {
                              const emp = employees.find((e) => e.id === empId);
                              if (!emp) return "";
                              const empTasks = projectTasks.filter(
                                (t) =>
                                  t.projectId === projectId &&
                                  t.assigneeId === empId
                              );
                              const completed = empTasks.filter(
                                (t) => t.status === "completed"
                              ).length;
                              return `
                            <div class="team-member-card">
                                <div class="avatar">${emp.name.charAt(0)}</div>
                                <div class="member-info">
                                    <strong>${emp.name}</strong>
                                    <small>${emp.department}</small>
                                </div>
                                <div class="member-stats">
                                    <span>${completed}/${
                                empTasks.length
                              } tasks</span>
                                </div>
                            </div>
                        `;
                            })
                            .join("")
                        : "<p>No team members assigned</p>"
                    }
                </div>
            </div>
        </div>
    `;
}

function updateEmployeeTaskStatus(taskId, newStatus, projectId) {
  const projectTasks = JSON.parse(localStorage.getItem("projectTasks")) || [];
  const taskIndex = projectTasks.findIndex((t) => t.id === taskId);

  if (taskIndex !== -1) {
    projectTasks[taskIndex].status = newStatus;

    if (newStatus === "completed") {
      projectTasks[taskIndex].completedDate = new Date().toISOString();
    }

    localStorage.setItem("projectTasks", JSON.stringify(projectTasks));
    showNotification("Task status updated!", "success");
    viewEmployeeProjectDetails(projectId);
  }
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
