// Employee Dashboard Functions

function showEmployeeDashboard() {
  const navButtons = `
    <button onclick="showEmployeeSection('dashboard')" class="active" id="nav-emp-dashboard">
      <i class="fas fa-home"></i> Dashboard
    </button>
    <button onclick="showEmployeeSection('enter-code')" id="nav-emp-enter-code">
      <i class="fas fa-qrcode"></i> Enter Code
    </button>
    <button onclick="showEmployeeSection('history')" id="nav-emp-history">
      <i class="fas fa-calendar-check"></i> My Attendance
    </button>
    <button onclick="showEmployeeSection('request-leave')" id="nav-emp-leave">
      <i class="fas fa-calendar-times"></i> Request Leave
    </button>
    <button onclick="showEmployeeSection('tasks')" id="nav-emp-tasks">
      <i class="fas fa-tasks"></i> My Tasks
    </button>
    <button onclick="showEmployeeSection('projects')" id="nav-emp-projects">
      <i class="fas fa-project-diagram"></i> My Projects
    </button>
  `;
  document.getElementById("navButtons").innerHTML = navButtons;
  showEmployeeSection("dashboard");
}

async function showEmployeeSection(section) {
  document
    .querySelectorAll(".nav button")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById("nav-emp-" + section)?.classList.add("active");

  const contentArea = document.getElementById("contentArea");

  if (section === "dashboard") {
    contentArea.innerHTML =
      '<div class="loading"><div class="spinner"></div><p>Loading dashboard...</p></div>';

    try {
      const snapshot = await db
        .collection("attendance")
        .where("employeeId", "==", currentUser.id)
        .get();
      const myAttendance = snapshot.docs.map((doc) => doc.data());

      const today = new Date().toDateString();
      const todayRecords = myAttendance.filter(
        (att) => new Date(att.timestamp).toDateString() === today
      );

      const todayCheckIns = todayRecords.filter(
        (att) => att.status === "Check In"
      ).length;
      const todayCheckOuts = todayRecords.filter(
        (att) => att.status === "Check Out"
      ).length;

      const lastRecord = todayRecords.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      )[0];

      const currentStatus = lastRecord ? lastRecord.status : "Not Checked In";

      // Get task statistics
      const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      const myTasks = tasks.filter((t) => t.employeeId === currentUser.id);
      const myCompletedTasks = myTasks.filter(
        (t) => t.status === "completed"
      ).length;
      const myPendingTasks = myTasks.filter(
        (t) => t.status === "pending" || t.status === "in-progress"
      ).length;

      // Get project statistics
      const projects = JSON.parse(localStorage.getItem("projects")) || [];
      const myProjects = projects.filter(
        (p) => p.teamMembers && p.teamMembers.includes(currentUser.id)
      );

      contentArea.innerHTML = `
        <div class="welcome-banner">
          <h2>Welcome, ${currentUser.name}!</h2>
          <p>${currentUser.position} - ${currentUser.department}</p>
          <p style="font-size: 1.2em; margin-top: 10px;">
            <strong>Current Status:</strong> ${currentStatus}
          </p>
        </div>

        <div class="dashboard-stats">
          <div class="stat-card">
            <i class="fas fa-sign-in-alt" style="color: #4CAF50;"></i>
            <h3>${todayCheckIns}</h3>
            <p>Check-Ins Today</p>
          </div>
          <div class="stat-card">
            <i class="fas fa-sign-out-alt" style="color: #f44336;"></i>
            <h3>${todayCheckOuts}</h3>
            <p>Check-Outs Today</p>
          </div>
          <div class="stat-card">
            <i class="fas fa-tasks" style="color: #2196F3;"></i>
            <h3>${myPendingTasks}</h3>
            <p>Pending Tasks</p>
          </div>
          <div class="stat-card">
            <i class="fas fa-project-diagram" style="color: #9c27b0;"></i>
            <h3>${myProjects.length}</h3>
            <p>Active Projects</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-top: 30px;">
          <!-- Today's Activity -->
          <div class="dashboard-section">
            <h3 style="color: #667eea; margin-bottom: 15px;">
              <i class="fas fa-clock"></i> Today's Activity
            </h3>
            <div id="dashboardActivity"></div>
          </div>

          <!-- Quick Task Overview -->
          <div class="dashboard-section">
            <h3 style="color: #667eea; margin-bottom: 15px;">
              <i class="fas fa-tasks"></i> My Tasks Overview
            </h3>
            <div id="dashboardTasks"></div>
          </div>
        </div>

        <!-- Recent Projects -->
        ${
          myProjects.length > 0
            ? `
          <div class="dashboard-section" style="margin-top: 30px;">
            <h3 style="color: #667eea; margin-bottom: 15px;">
              <i class="fas fa-project-diagram"></i> Recent Projects
            </h3>
            <div id="dashboardProjects"></div>
          </div>
        `
            : ""
        }
      `;

      // Display today's attendance activity
      const activityDiv = document.getElementById("dashboardActivity");
      if (todayRecords.length === 0) {
        activityDiv.innerHTML =
          '<div class="info-box">No activity recorded yet today. Go to "Enter Code" to mark your attendance.</div>';
      } else {
        const sortedRecords = todayRecords.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        activityDiv.innerHTML = `
          <table class="attendance-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${sortedRecords
                .map((att) => {
                  const time = new Date(att.timestamp);
                  const statusClass =
                    att.status === "Check In"
                      ? "status-present"
                      : "status-absent";
                  const icon = att.status === "Check In" ? "✓" : "✗";
                  return `
                    <tr>
                      <td>${time.toLocaleTimeString()}</td>
                      <td class="${statusClass}">${icon} ${att.status}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        `;
      }

      // Display task overview
      const tasksDiv = document.getElementById("dashboardTasks");
      if (myTasks.length === 0) {
        tasksDiv.innerHTML =
          '<div class="info-box">No tasks assigned yet.</div>';
      } else {
        const urgentTasks = myTasks
          .filter((t) => {
            const isUrgent = t.priority === "high" && t.status !== "completed";
            const isOverdue =
              t.deadline &&
              new Date(t.deadline) < new Date() &&
              t.status !== "completed";
            return isUrgent || isOverdue;
          })
          .slice(0, 5);

        if (urgentTasks.length === 0) {
          tasksDiv.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #4CAF50;">
              <i class="fas fa-check-circle" style="font-size: 48px; margin-bottom: 10px;"></i>
              <p>All caught up! No urgent tasks.</p>
              <p style="font-size: 14px; color: #666; margin-top: 5px;">
                Completed: ${myCompletedTasks} / ${myTasks.length} tasks
              </p>
            </div>
          `;
        } else {
          tasksDiv.innerHTML = `
            <div class="task-quick-list">
              ${urgentTasks
                .map((task) => {
                  const isOverdue =
                    task.deadline &&
                    new Date(task.deadline) < new Date() &&
                    task.status !== "completed";
                  return `
                  <div class="task-quick-item ${isOverdue ? "overdue" : ""}">
                    <div class="task-quick-info">
                      <span class="priority-badge ${task.priority}">${
                    task.priority
                  }</span>
                      <strong>${task.name}</strong>
                      ${
                        isOverdue
                          ? '<span class="overdue-label">OVERDUE</span>'
                          : ""
                      }
                    </div>
                    <div class="task-quick-meta">
                      <small><i class="fas fa-calendar"></i> ${formatDate(
                        task.deadline
                      )}</small>
                    </div>
                  </div>
                `;
                })
                .join("")}
            </div>
            <button onclick="showEmployeeSection('tasks')" class="btn-primary" style="width: 100%; margin-top: 15px;">
              View All Tasks
            </button>
          `;
        }
      }

      // Display recent projects
      if (myProjects.length > 0) {
        const projectsDiv = document.getElementById("dashboardProjects");
        const projectTasks =
          JSON.parse(localStorage.getItem("projectTasks")) || [];

        projectsDiv.innerHTML = `
          <div class="project-quick-list">
            ${myProjects
              .slice(0, 3)
              .map((project) => {
                const tasks = projectTasks.filter(
                  (t) =>
                    t.projectId === project.id &&
                    t.assigneeId === currentUser.id
                );
                const completed = tasks.filter(
                  (t) => t.status === "completed"
                ).length;
                const progress =
                  tasks.length > 0 ? (completed / tasks.length) * 100 : 0;

                return `
                <div class="project-quick-item">
                  <div class="project-quick-header">
                    <strong>${project.name}</strong>
                    <span class="status-badge ${project.status}">${
                  project.status
                }</span>
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
                  <div class="project-quick-meta">
                    <small><i class="fas fa-tasks"></i> ${completed}/${
                  tasks.length
                } tasks completed</small>
                  </div>
                </div>
              `;
              })
              .join("")}
          </div>
          <button onclick="showEmployeeSection('projects')" class="btn-primary" style="width: 100%; margin-top: 15px;">
            View All Projects
          </button>
        `;
      }
    } catch (error) {
      contentArea.innerHTML =
        '<div class="alert alert-error">Error loading dashboard</div>';
    }
  } else if (section === "enter-code") {
    showEnterCodeSection();
  } else if (section === "history") {
    showEmployeeHistory();
  } else if (section === "request-leave") {
    showLeaveRequestForm();
  } else if (section === "tasks") {
    showEmployeeTasks();
  } else if (section === "projects") {
    showEmployeeProjects();
  }
}

// Helper function for date formatting
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
