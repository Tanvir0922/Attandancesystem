// Admin Payroll Functions

async function showPayrollSection() {
  const contentArea = document.getElementById("contentArea");
  contentArea.innerHTML =
    '<div class="loading"><div class="spinner"></div><p>Loading payroll...</p></div>';

  try {
    const snapshot = await db
      .collection("employees")
      .where("role", "==", "employee")
      .get();
    const employees = snapshot.docs.map((doc) => doc.data());

    const totalSalary = employees.reduce(
      (sum, emp) => sum + (emp.salary || 0),
      0
    );
    const avgSalary = employees.length > 0 ? totalSalary / employees.length : 0;

    contentArea.innerHTML = `
      <h2>Payroll Management</h2>
      <div class="dashboard-stats">
        <div class="stat-card">
          <h3>${totalSalary.toLocaleString()}</h3>
          <p>Total Monthly Salary</p>
        </div>
        <div class="stat-card">
          <h3>${Math.round(avgSalary).toLocaleString()}</h3>
          <p>Average Salary</p>
        </div>
        <div class="stat-card">
          <h3>${employees.length}</h3>
          <p>Total Employees</p>
        </div>
      </div>

      <h3 style="color: #667eea; margin: 30px 0 15px;">Salary Breakdown</h3>
      <table class="attendance-table">
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Position</th>
            <th>Department</th>
            <th>Salary</th>
          </tr>
        </thead>
        <tbody>
          ${employees
            .map(
              (emp) => `
              <tr>
                <td>${emp.id}</td>
                <td>${emp.name}</td>
                <td>${emp.position}</td>
                <td>${emp.department}</td>
                <td><strong>${emp.salary.toLocaleString()}</strong></td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error("Error loading payroll:", error);
    contentArea.innerHTML =
      '<div class="alert alert-error">Error loading payroll</div>';
  }
}
