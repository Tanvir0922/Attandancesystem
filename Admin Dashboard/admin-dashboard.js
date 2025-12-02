// Admin Dashboard Functions with Proper Module Loading

function showAdminDashboard() {
  const navButtons = document.getElementById("navButtons");
  navButtons.innerHTML = "";

  const buttons = [
    { text: "Dashboard", id: "dashboard", icon: "fa-home" },
    { text: "Manage Employees", id: "employees", icon: "fa-users" },
    { text: "Attendance Records", id: "attendance", icon: "fa-calendar-check" },
    { text: "Leave Requests", id: "leaves", icon: "fa-calendar-times" },
    { text: "Task Management", id: "tasks", icon: "fa-tasks" },
    { text: "Projects", id: "projects", icon: "fa-project-diagram" },
    { text: "Analytics", id: "analytics", icon: "fa-chart-line" },
    { text: "Reports", id: "reports", icon: "fa-file-alt" },
    { text: "Payroll", id: "payroll", icon: "fa-money-bill-wave" },
  ];

  buttons.forEach((btn) => {
    const button = document.createElement("button");
    button.innerHTML = `<i class="fas ${btn.icon}"></i> ${btn.text}`;
    button.id = "nav-" + btn.id;
    if (btn.id === "dashboard") button.className = "active";
    button.onclick = function () {
      showAdminSection(btn.id);
    };
    navButtons.appendChild(button);
  });

  showAdminSection("dashboard");
}

async function showAdminSection(section) {
  document
    .querySelectorAll(".nav button")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById("nav-" + section)?.classList.add("active");

  const contentArea = document.getElementById("contentArea");

  if (section === "dashboard") {
    contentArea.innerHTML =
      '<div class="loading"><div class="spinner"></div><p>Loading dashboard...</p></div>';

    try {
      const employeesSnapshot = await db
        .collection("employees")
        .where("role", "==", "employee")
        .get();
      const totalEmployees = employeesSnapshot.size;

      const today = new Date().toDateString();
      const attendanceSnapshot = await db.collection("attendance").get();
      const todayAttendance = attendanceSnapshot.docs.filter(
        (doc) => new Date(doc.data().timestamp).toDateString() === today
      ).length;

      const leaveSnapshot = await db
        .collection("leaves")
        .where("status", "==", "pending")
        .get();
      const pendingLeaves = leaveSnapshot.size;

      // Get task and project statistics
      const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      const projects = JSON.parse(localStorage.getItem("projects")) || [];
      const projectTasks =
        JSON.parse(localStorage.getItem("projectTasks")) || [];

      const allTasks = [...tasks, ...projectTasks];
      const pendingTasks = allTasks.filter(
        (t) =>
          t.status === "pending" ||
          t.status === "todo" ||
          t.status === "in-progress"
      ).length;
      const completedTasks = allTasks.filter(
        (t) => t.status === "completed"
      ).length;
      const activeProjects = projects.filter(
        (p) => p.status === "in-progress"
      ).length;

      // Get overdue tasks
      const overdueTasks = allTasks.filter((t) => {
        if (t.status === "completed") return false;
        const deadline = t.deadline || t.dueDate;
        return deadline && new Date(deadline) < new Date();
      });

      contentArea.innerHTML = `
        <div class="welcome-banner">
          <h2>Welcome, ${currentUser.name}!</h2>
          <p>Dashboard Overview</p>
          <p style="font-size: 14px; margin-top: 10px; opacity: 0.9;">
            <i class="fas fa-calendar"></i> ${new Date().toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            )}
          </p>
        </div>

        <div class="dashboard-stats">
          <div class="stat-card">
            <i class="fas fa-users" style="color: #2196F3;"></i>
            <h3>${totalEmployees}</h3>
            <p>Total Employees</p>
          </div>
          <div class="stat-card">
            <i class="fas fa-user-check" style="color: #4CAF50;"></i>
            <h3>${todayAttendance}</h3>
            <p>Present Today</p>
          </div>
          <div class="stat-card">
            <i class="fas fa-calendar-times" style="color: #ff9800;"></i>
            <h3>${pendingLeaves}</h3>
            <p>Pending Leaves</p>
          </div>
          <div class="stat-card">
            <i class="fas fa-tasks" style="color: #9c27b0;"></i>
            <h3>${pendingTasks}</h3>
            <p>Active Tasks</p>
          </div>
          <div class="stat-card">
            <i class="fas fa-project-diagram" style="color: #00bcd4;"></i>
            <h3>${activeProjects}</h3>
            <p>Active Projects</p>
          </div>
          <div class="stat-card">
            <i class="fas fa-check-circle" style="color: #8bc34a;"></i>
            <h3>${completedTasks}</h3>
            <p>Completed Tasks</p>
          </div>
        </div>

        ${
          overdueTasks.length > 0
            ? `
          <div class="alert-section">
            <div class="alert alert-warning">
              <i class="fas fa-exclamation-triangle"></i>
              <strong>Attention:</strong> ${overdueTasks.length} task(s) are overdue and need immediate attention.
              <button onclick="showAdminSection('tasks')" class="btn-link">View Tasks</button>
            </div>
          </div>
        `
            : ""
        }

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-top: 30px;">
          <!-- Recent Employees -->
          <div class="dashboard-section">
            <h3 style="color: #667eea; margin-bottom: 15px;">
              <i class="fas fa-users"></i> Recent Employees
            </h3>
            <div id="dashboardEmployees"></div>
          </div>

          <!-- Task Overview -->
          <div class="dashboard-section">
            <h3 style="color: #667eea; margin-bottom: 15px;">
              <i class="fas fa-tasks"></i> Task Overview
            </h3>
            <div id="dashboardTasks"></div>
          </div>
        </div>

        <!-- Projects Overview -->
        ${
          projects.length > 0
            ? `
          <div class="dashboard-section" style="margin-top: 30px;">
            <h3 style="color: #667eea; margin-bottom: 15px;">
              <i class="fas fa-project-diagram"></i> Active Projects
            </h3>
            <div id="dashboardProjects"></div>
          </div>
        `
            : ""
        }
      `;

      // Display recent employees
      const empListDiv = document.getElementById("dashboardEmployees");
      if (employeesSnapshot.empty) {
        empListDiv.innerHTML =
          '<div class="info-box">No employees registered yet.</div>';
      } else {
        empListDiv.innerHTML = employeesSnapshot.docs
          .slice(0, 4)
          .map((doc) => {
            const emp = doc.data();
            return `
              <div class="employee-card-mini">
                <div class="employee-info">
                  <div class="avatar">${emp.name.charAt(0)}</div>
                  <div>
                    <strong>${emp.name}</strong>
                    <small>${emp.department} - ${emp.position}</small>
                  </div>
                </div>
                <div class="button-group-mini">
                  <button class="btn-icon" onclick="generateCodeForEmployee('${
                    emp.id
                  }')" title="Generate Code">
                    <i class="fas fa-qrcode"></i>
                  </button>
                  <button class="btn-icon" onclick="viewEmployeeHistory('${
                    emp.id
                  }', '${emp.name}')" title="View History">
                    <i class="fas fa-history"></i>
                  </button>
                </div>
              </div>
            `;
          })
          .join("");
      }

      // Display task overview
      const tasksDiv = document.getElementById("dashboardTasks");
      if (allTasks.length === 0) {
        tasksDiv.innerHTML =
          '<div class="info-box">No tasks created yet.</div>';
      } else {
        const tasksByStatus = {
          pending: allTasks.filter(
            (t) => t.status === "pending" || t.status === "todo"
          ).length,
          inProgress: allTasks.filter((t) => t.status === "in-progress").length,
          review: allTasks.filter((t) => t.status === "review").length,
          completed: allTasks.filter((t) => t.status === "completed").length,
        };

        const completionRate =
          allTasks.length > 0
            ? ((tasksByStatus.completed / allTasks.length) * 100).toFixed(1)
            : 0;

        tasksDiv.innerHTML = `
          <div class="task-stats-mini">
            <div class="task-stat-item">
              <span class="task-stat-number" style="color: #ff9800;">${
                tasksByStatus.pending
              }</span>
              <span class="task-stat-label">Pending</span>
            </div>
            <div class="task-stat-item">
              <span class="task-stat-number" style="color: #2196F3;">${
                tasksByStatus.inProgress
              }</span>
              <span class="task-stat-label">In Progress</span>
            </div>
            <div class="task-stat-item">
              <span class="task-stat-number" style="color: #9c27b0;">${
                tasksByStatus.review
              }</span>
              <span class="task-stat-label">Review</span>
            </div>
            <div class="task-stat-item">
              <span class="task-stat-number" style="color: #4CAF50;">${
                tasksByStatus.completed
              }</span>
              <span class="task-stat-label">Completed</span>
            </div>
          </div>
          
          <div class="completion-rate">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 13px; color: #666;">Overall Completion Rate</span>
              <span style="font-size: 14px; font-weight: 600; color: #4CAF50;">${completionRate}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${completionRate}%"></div>
            </div>
          </div>

          ${
            overdueTasks.length > 0
              ? `
            <div class="overdue-alert">
              <i class="fas fa-exclamation-circle"></i>
              <span>${overdueTasks.length} overdue task(s)</span>
            </div>
          `
              : ""
          }

          <button onclick="showAdminSection('tasks')" class="btn btn-primary" style="width: 100%; margin-top: 15px;">
            Manage All Tasks
          </button>
        `;
      }

      // Display projects overview
      if (projects.length > 0) {
        const projectsDiv = document.getElementById("dashboardProjects");
        const recentProjects = projects
          .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
          .slice(0, 3);

        projectsDiv.innerHTML = `
          <div class="project-mini-list">
            ${recentProjects
              .map((project) => {
                const tasks = projectTasks.filter(
                  (t) => t.projectId === project.id
                );
                const completed = tasks.filter(
                  (t) => t.status === "completed"
                ).length;
                const progress =
                  tasks.length > 0 ? (completed / tasks.length) * 100 : 0;

                return `
                <div class="project-mini-card">
                  <div class="project-mini-header">
                    <div>
                      <strong>${project.name}</strong>
                      <small>${
                        project.teamMembers ? project.teamMembers.length : 0
                      } members</small>
                    </div>
                    <span class="status-badge ${project.status}">${
                  project.status
                }</span>
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
                  <div class="project-mini-meta">
                    <small><i class="fas fa-tasks"></i> ${completed}/${
                  tasks.length
                } tasks</small>
                    <small><i class="fas fa-calendar"></i> Due: ${
                      project.endDate ? formatDate(project.endDate) : "Ongoing"
                    }</small>
                  </div>
                </div>
              `;
              })
              .join("")}
          </div>
          <button onclick="showAdminSection('projects')" class="btn btn-primary" style="width: 100%; margin-top: 15px;">
            View All Projects
          </button>
        `;
      }
    } catch (error) {
      console.error("Dashboard error:", error);
      contentArea.innerHTML =
        '<div class="alert alert-error">Error loading dashboard</div>';
    }
  } else if (section === "employees") {
    if (typeof showEmployeesSection === "function") {
      showEmployeesSection();
    } else {
      contentArea.innerHTML = "<p>Employees module not loaded</p>";
    }
  } else if (section === "attendance") {
    if (typeof showAttendanceSection === "function") {
      showAttendanceSection();
    } else {
      contentArea.innerHTML = "<p>Attendance module not loaded</p>";
    }
  } else if (section === "leaves") {
    if (typeof showLeavesSection === "function") {
      showLeavesSection();
    } else {
      contentArea.innerHTML = "<p>Leaves module not loaded</p>";
    }
  } else if (section === "tasks") {
    if (typeof showAdminTasks === "function") {
      showAdminTasks();
    } else {
      contentArea.innerHTML = "<p>Tasks module not loaded</p>";
    }
  } else if (section === "projects") {
    if (typeof showAdminProjects === "function") {
      showAdminProjects();
    } else {
      contentArea.innerHTML = "<p>Projects module not loaded</p>";
    }
  } else if (section === "analytics") {
    if (typeof showProductivityAnalytics === "function") {
      showProductivityAnalytics();
    } else {
      contentArea.innerHTML = "<p>Analytics module not loaded</p>";
    }
  } else if (section === "reports") {
    if (typeof showReportsSection === "function") {
      showReportsSection();
    } else {
      contentArea.innerHTML = "<p>Reports module not loaded</p>";
    }
  } else if (section === "payroll") {
    if (typeof showPayrollSection === "function") {
      showPayrollSection();
    } else {
      contentArea.innerHTML = "<p>Payroll module not loaded</p>";
    }
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

console.log("✅ Admin Dashboard Loaded");
