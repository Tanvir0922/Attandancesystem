// Admin Reports Functions

async function showReportsSection() {
  const contentArea = document.getElementById("contentArea");
  contentArea.innerHTML = `
    <h2>Reports & Analytics</h2>
    <div class="dashboard-stats" style="margin-bottom: 30px;">
      <button onclick="generateAbsenteeReport()" class="btn btn-info" style="font-size: 16px; padding: 20px;">
        Absentee Report
      </button>
      <button onclick="generateAttendanceReport()" class="btn btn-info" style="font-size: 16px; padding: 20px;">
        Attendance Summary
      </button>
      <button onclick="generateDepartmentReport()" class="btn btn-info" style="font-size: 16px; padding: 20px;">
        Department Report
      </button>
    </div>
    <div id="reportContent"></div>
  `;
}

async function generateAbsenteeReport() {
  const reportDiv = document.getElementById("reportContent");
  reportDiv.innerHTML =
    '<div class="loading"><div class="spinner"></div></div>';

  try {
    const snapshot = await db.collection("attendance").get();
    const employees = await db
      .collection("employees")
      .where("role", "==", "employee")
      .get();

    const today = new Date().toDateString();
    const presentToday = new Set(
      snapshot.docs
        .filter(
          (doc) => new Date(doc.data().timestamp).toDateString() === today
        )
        .map((doc) => doc.data().employeeId)
    );

    const absentees = employees.docs
      .filter((doc) => !presentToday.has(doc.id))
      .map((doc) => doc.data());

    reportDiv.innerHTML = absentees.length
      ? `
          <h3>Absentees Today</h3>
          <table class="attendance-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Position</th>
              </tr>
            </thead>
            <tbody>
              ${absentees
                .map(
                  (emp) => `
                  <tr>
                    <td>${emp.id}</td>
                    <td>${emp.name}</td>
                    <td>${emp.department}</td>
                    <td>${emp.position}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
      `
      : '<div class="alert alert-info">All employees are present today!</div>';
  } catch (error) {
    reportDiv.innerHTML =
      '<div class="alert alert-error">Error generating report</div>';
  }
}

async function generateAttendanceReport() {
  const reportDiv = document.getElementById("reportContent");
  reportDiv.innerHTML =
    '<div class="loading"><div class="spinner"></div></div>';

  try {
    const empSnapshot = await db
      .collection("employees")
      .where("role", "==", "employee")
      .get();
    const attSnapshot = await db.collection("attendance").get();

    const attendanceMap = {};
    empSnapshot.docs.forEach((doc) => {
      attendanceMap[doc.id] = { name: doc.data().name, count: 0 };
    });

    attSnapshot.docs.forEach((doc) => {
      const empId = doc.data().employeeId;
      if (attendanceMap[empId]) {
        attendanceMap[empId].count++;
      }
    });

    const report = Object.entries(attendanceMap)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, data]) => ({ id, ...data }));

    reportDiv.innerHTML = `
      <h3>Attendance Summary</h3>
      <table class="attendance-table">
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Total Attendance</th>
          </tr>
        </thead>
        <tbody>
          ${report
            .map(
              (r) => `
              <tr>
                <td>${r.id}</td>
                <td>${r.name}</td>
                <td><strong>${r.count}</strong></td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } catch (error) {
    reportDiv.innerHTML =
      '<div class="alert alert-error">Error generating report</div>';
  }
}

async function generateDepartmentReport() {
  const reportDiv = document.getElementById("reportContent");
  reportDiv.innerHTML =
    '<div class="loading"><div class="spinner"></div></div>';

  try {
    const empSnapshot = await db
      .collection("employees")
      .where("role", "==", "employee")
      .get();
    const deptMap = {};

    empSnapshot.docs.forEach((doc) => {
      const emp = doc.data();
      if (!deptMap[emp.department]) {
        deptMap[emp.department] = { count: 0, employees: [] };
      }
      deptMap[emp.department].count++;
      deptMap[emp.department].employees.push(emp.name);
    });

    reportDiv.innerHTML = `
      <h3>Department Overview</h3>
      <table class="attendance-table">
        <thead>
          <tr>
            <th>Department</th>
            <th>Employee Count</th>
            <th>Employees</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(deptMap)
            .map(
              ([dept, data]) => `
              <tr>
                <td><strong>${dept}</strong></td>
                <td>${data.count}</td>
                <td>${data.employees.join(", ")}</td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } catch (error) {
    reportDiv.innerHTML =
      '<div class="alert alert-error">Error generating report</div>';
  }
}
