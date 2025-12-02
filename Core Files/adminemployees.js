// Admin Employee Management Functions

async function showEmployeesSection() {
  const contentArea = document.getElementById("contentArea");
  contentArea.innerHTML = `
    <h2>Manage Employees</h2>
    <div id="empMessage"></div>
    <input type="text" id="empSearch" class="search-box" placeholder="Search employees by name or ID...">
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
      <h3 style="color: white; margin-bottom: 20px;">➕ Add New Employee with Face Recognition</h3>
      <form id="addEmployeeForm">
        <div class="grid-2">
          <div class="form-group">
            <label style="color: white;">Employee ID: <span style="color: #ffeb3b;">*</span></label>
            <input type="text" id="empId" required placeholder="e.g., EMP001">
          </div>
          <div class="form-group">
            <label style="color: white;">Name: <span style="color: #ffeb3b;">*</span></label>
            <input type="text" id="empName" required placeholder="Full Name">
          </div>
          <div class="form-group">
            <label style="color: white;">Email: <span style="color: #ffeb3b;">*</span></label>
            <input type="email" id="empEmail" required placeholder="email@company.com">
          </div>
          <div class="form-group">
            <label style="color: white;">Phone:</label>
            <input type="tel" id="empPhone" placeholder="Contact number">
          </div>
          <div class="form-group">
            <label style="color: white;">Department: <span style="color: #ffeb3b;">*</span></label>
            <input type="text" id="empDept" required placeholder="e.g., IT, HR">
          </div>
          <div class="form-group">
            <label style="color: white;">Position: <span style="color: #ffeb3b;">*</span></label>
            <input type="text" id="empPosition" required placeholder="e.g., Developer">
          </div>
          <div class="form-group">
            <label style="color: white;">Salary: <span style="color: #ffeb3b;">*</span></label>
            <input type="number" id="empSalary" required placeholder="Annual salary">
          </div>
          <div class="form-group">
            <label style="color: white;">Joining Date: <span style="color: #ffeb3b;">*</span></label>
            <input type="date" id="empJoinDate" required>
          </div>
        </div>

        <div class="form-group" style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; border: 2px dashed #ffeb3b; margin: 20px 0;">
          <label style="color: white; font-size: 1.1em; font-weight: bold;">
            📸 Employee Face Photo: <span style="color: #ffeb3b;">*REQUIRED</span>
          </label>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0; font-size: 0.95em;">
            Upload a clear front-facing photo of the employee for face recognition system
          </p>
          <input type="file" id="empFaceImage" accept="image/jpeg,image/png,image/jpg" required 
            style="padding: 15px; border: 2px solid white; border-radius: 8px; color: white; cursor: pointer; width: 100%; background: rgba(255,255,255,0.1);">
          <p style="color: rgba(255,255,255,0.8); margin-top: 10px; font-size: 0.9em;">
            ✓ Supported formats: JPG, PNG<br>
            ✓ Face should be clearly visible<br>
            ✓ Good lighting recommended<br>
            ✓ Minimum 300x300 pixels
          </p>
        </div>

        <button type="submit" class="btn btn-success" style="width: 100%; font-size: 1.1em; padding: 15px; background: #27ae60;">
          ✓ Add Employee & Register Face
        </button>
      </form>
    </div>
    
    <h3>Employee List</h3>
    <div id="employeeList" class="employee-list"><div class="loading"><div class="spinner"></div></div></div>
  `;

  document
    .getElementById("addEmployeeForm")
    .addEventListener("submit", addEmployeeWithFace);
  document
    .getElementById("empSearch")
    .addEventListener("keyup", filterEmployees);
  displayEmployees();
}

async function addEmployeeWithFace(e) {
  e.preventDefault();

  const faceImageFile = document.getElementById("empFaceImage").files[0];

  if (!faceImageFile) {
    showMessage("empMessage", "Please upload a face image", "error");
    return;
  }

  const employee = {
    id: document.getElementById("empId").value.trim(),
    name: document.getElementById("empName").value.trim(),
    email: document.getElementById("empEmail").value.trim(),
    phone: document.getElementById("empPhone").value.trim(),
    department: document.getElementById("empDept").value.trim(),
    position: document.getElementById("empPosition").value.trim(),
    salary: parseFloat(document.getElementById("empSalary").value),
    role: "employee",
    joinDate: document.getElementById("empJoinDate").value,
  };

  try {
    showMessage(
      "empMessage",
      "Processing employee and registering face...",
      "info"
    );

    // Check if employee already exists
    const empDoc = await db.collection("employees").doc(employee.id).get();
    if (empDoc.exists) {
      showMessage("empMessage", "Employee ID already exists!", "error");
      return;
    }

    // Add employee to database
    await db.collection("employees").doc(employee.id).set(employee);
    console.log("Employee added:", employee.name);

    // Register face
    try {
      await registerEmployeeFace(employee.id, faceImageFile);
      console.log("Face registered for:", employee.name);
    } catch (faceError) {
      console.error("Face registration error:", faceError);
      showMessage(
        "empMessage",
        "Employee added but face registration failed: " + faceError.message,
        "error"
      );
      e.target.reset();
      displayEmployees();
      return;
    }

    showMessage(
      "empMessage",
      "✓ Employee added and face registered successfully!",
      "success"
    );
    e.target.reset();
    displayEmployees();
  } catch (error) {
    console.error("Error adding employee:", error);
    showMessage(
      "empMessage",
      "Failed to add employee: " + error.message,
      "error"
    );
  }
}

async function displayEmployees() {
  const listDiv = document.getElementById("employeeList");

  try {
    const snapshot = await db
      .collection("employees")
      .where("role", "==", "employee")
      .get();

    if (snapshot.empty) {
      listDiv.innerHTML =
        "<p style='text-align: center; color: #999;'>No employees found. Add your first employee using the form above!</p>";
      return;
    }

    listDiv.innerHTML = snapshot.docs
      .map((doc) => {
        const emp = doc.data();
        return `
          <div class="employee-card">
            <h3>${emp.name}</h3>
            <p><strong>ID:</strong> ${emp.id}</p>
            <p><strong>Email:</strong> ${emp.email}</p>
            <p><strong>Phone:</strong> ${emp.phone || "N/A"}</p>
            <p><strong>Department:</strong> ${emp.department}</p>
            <p><strong>Position:</strong> ${emp.position}</p>
            <p><strong>Salary:</strong> ${emp.salary.toLocaleString()}</p>
            <div class="button-group">
              <button class="btn btn-info" onclick="viewEmployeeHistory('${
                emp.id
              }', '${emp.name}')">History</button>
              <button class="btn btn-warning" onclick="openEditModal('${
                emp.id
              }')">Edit</button>
              <button class="btn btn-danger" onclick="deleteEmployee('${
                emp.id
              }')">Delete</button>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Error displaying employees:", error);
    listDiv.innerHTML =
      '<div class="alert alert-error">Error loading employees. Check console for details.</div>';
  }
}

function filterEmployees() {
  const searchValue = document.getElementById("empSearch").value.toLowerCase();
  const cards = document.querySelectorAll(".employee-card");

  cards.forEach((card) => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(searchValue) ? "" : "none";
  });
}

async function openEditModal(empId) {
  try {
    editingEmployeeId = empId;
    const empDoc = await db.collection("employees").doc(empId).get();

    if (empDoc.exists) {
      const emp = empDoc.data();
      document.getElementById("editEmpName").value = emp.name;
      document.getElementById("editEmpEmail").value = emp.email;
      document.getElementById("editEmpDept").value = emp.department;
      document.getElementById("editEmpPosition").value = emp.position;
      document.getElementById("editEmpSalary").value = emp.salary;
      document.getElementById("editEmpPhone").value = emp.phone || "";

      document.getElementById("editEmployeeForm").onsubmit = async (e) => {
        e.preventDefault();
        await saveEmployeeChanges();
      };

      document.getElementById("editModal").classList.add("active");
    }
  } catch (error) {
    console.error("Error opening edit modal:", error);
    showMessage("empMessage", "Error opening edit form", "error");
  }
}

async function saveEmployeeChanges() {
  try {
    await db
      .collection("employees")
      .doc(editingEmployeeId)
      .update({
        name: document.getElementById("editEmpName").value.trim(),
        email: document.getElementById("editEmpEmail").value.trim(),
        department: document.getElementById("editEmpDept").value.trim(),
        position: document.getElementById("editEmpPosition").value.trim(),
        salary: parseFloat(document.getElementById("editEmpSalary").value),
        phone: document.getElementById("editEmpPhone").value.trim(),
      });

    showMessage("empMessage", "✓ Employee updated successfully!", "success");
    closeEditModal();
    displayEmployees();
  } catch (error) {
    console.error("Error updating employee:", error);
    showMessage(
      "empMessage",
      "Failed to update employee: " + error.message,
      "error"
    );
  }
}

async function deleteEmployee(id) {
  if (
    confirm(
      "Are you sure you want to delete this employee? This will also remove their face data."
    )
  ) {
    try {
      showMessage("empMessage", "Deleting employee...", "info");

      // Delete employee record
      await db.collection("employees").doc(id).delete();

      // Delete face data if exists
      try {
        await db.collection("employeeFaces").doc(id).delete();
      } catch (e) {
        console.log("No face data to delete");
      }

      showMessage("empMessage", "✓ Employee deleted successfully!", "success");
      displayEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      showMessage(
        "empMessage",
        "Failed to delete employee: " + error.message,
        "error"
      );
    }
  }
}
