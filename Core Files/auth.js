// Authentication Functions

// Global variables
let userRole = null;
let currentUser = null;

async function init() {
  try {
    console.log("Initializing system...");

    const adminDoc = await db.collection("employees").doc("admin").get();
    if (!adminDoc.exists) {
      console.log("Creating default admin user...");
      await db.collection("employees").doc("admin").set({
        id: "admin",
        name: "System Admin",
        email: "admin@company.com",
        department: "IT",
        position: "Administrator",
        role: "admin",
        joinDate: new Date().toISOString(),
        phone: "",
        salary: 0,
      });
      console.log("Default admin created successfully");
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    console.error("Error initializing admin:", error);
  }
}

function selectRole(role) {
  document
    .querySelectorAll(".role-btn")
    .forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");
  userRole = role;
  document.getElementById("loginLabel").textContent =
    role === "admin" ? "Admin ID:" : "Employee ID:";
  console.log("Role selected:", role);
}

document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const loginId = document.getElementById("loginId").value.trim();
    const loginMessage = document.getElementById("loginMessage");

    if (!loginId) {
      showMessage("loginMessage", "Please enter an ID", "error");
      return;
    }

    if (!userRole) {
      showMessage("loginMessage", "Please select a role", "error");
      return;
    }

    try {
      console.log("Login attempt - ID:", loginId, "Role:", userRole);
      showLoading("loginMessage", true);

      const empDoc = await db.collection("employees").doc(loginId).get();

      if (!empDoc.exists) {
        console.log("User not found:", loginId);
        showMessage(
          "loginMessage",
          "User not found! Please check your ID.",
          "error"
        );
        return;
      }

      const employee = empDoc.data();
      console.log("Employee found:", employee);

      // Check role match
      if (userRole === "admin") {
        if (employee.role !== "admin") {
          console.log("Role mismatch: expected admin, got", employee.role);
          showMessage(
            "loginMessage",
            "Invalid credentials! You don't have admin access.",
            "error"
          );
          return;
        }
      } else if (userRole === "employee") {
        if (employee.role === "admin") {
          console.log("Admin trying to login as employee");
          showMessage(
            "loginMessage",
            "Invalid credentials! Please login as Admin.",
            "error"
          );
          return;
        }
      }

      // Login successful
      currentUser = employee;

      // Store current user in localStorage for task/project management
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          id: employee.id,
          name: employee.name,
          email: employee.email,
          department: employee.department,
          position: employee.position,
          role: employee.role,
        })
      );

      console.log("Login successful:", currentUser.name);
      showMessage("loginMessage", `Welcome ${employee.name}!`, "success");

      setTimeout(() => {
        showApp(userRole);
      }, 500);
    } catch (error) {
      console.error("Login error:", error);
      showMessage("loginMessage", "Login failed: " + error.message, "error");
    } finally {
      showLoading("loginMessage", false);
    }
  });

async function showApp(role) {
  console.log("Showing app for role:", role);
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("mainApp").style.display = "block";

  if (role === "admin") {
    showAdminDashboard();
  } else {
    showEmployeeDashboard();
  }
}

function logout() {
  // Clear session data
  currentUser = null;
  userRole = null;
  localStorage.removeItem("currentUser");

  // Hide main app and show login screen
  document.getElementById("mainApp").style.display = "none";
  document.getElementById("loginScreen").style.display = "block";

  // Reset login form
  document.getElementById("loginForm").reset();
  document
    .querySelectorAll(".role-btn")
    .forEach((btn) => btn.classList.remove("active"));

  console.log("User logged out");
  showNotification("Logged out successfully", "info");
}

function showMessage(elementId, message, type) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.className = type === "error" ? "error-message" : "success-message";
    element.style.display = "block";

    // Auto-hide message after 5 seconds
    setTimeout(() => {
      element.style.display = "none";
    }, 5000);
  }
}

function showLoading(elementId, show) {
  const element = document.getElementById(elementId);
  if (element) {
    if (show) {
      element.textContent = "Loading...";
      element.className = "loading-message";
      element.style.display = "block";
    } else {
      element.style.display = "none";
    }
  }
}

// Check for existing session on page load
function checkSession() {
  const storedUser = localStorage.getItem("currentUser");
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
      userRole = currentUser.role === "admin" ? "admin" : "employee";
      console.log("Session restored for:", currentUser.name);
      showApp(userRole);
    } catch (error) {
      console.error("Error restoring session:", error);
      localStorage.removeItem("currentUser");
    }
  }
}

// Initialize when page loads
console.log("Auth.js loaded");
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    init();
    checkSession();
  });
} else {
  init();
  checkSession();
}

// Make functions globally available
window.logout = logout;
window.selectRole = selectRole;
