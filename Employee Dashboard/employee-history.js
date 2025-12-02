// Employee History Functions

async function showEmployeeHistory() {
  const contentArea = document.getElementById("contentArea");
  contentArea.innerHTML = `
    <h2>My Attendance History</h2>
    <div class="form-group">
      <label>Filter by Date:</label>
      <input type="date" id="filterEmpDate" onchange="displayEmployeeHistory()" value="${
        new Date().toISOString().split("T")[0]
      }">
    </div>
    <table class="attendance-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody id="employeeAttendanceBody"><tr><td colspan="3"><div class="loading"><div class="spinner"></div></div></td></tr></tbody>
    </table>
  `;
  displayEmployeeHistory();
}

async function displayEmployeeHistory() {
  const tbody = document.getElementById("employeeAttendanceBody");
  const filterDate = document.getElementById("filterEmpDate").value;

  try {
    const snapshot = await db
      .collection("attendance")
      .where("employeeId", "==", currentUser.id)
      .get();

    let myAttendance = snapshot.docs.map((doc) => doc.data());

    myAttendance.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (filterDate) {
      const filterDateObj = new Date(filterDate).toDateString();
      myAttendance = myAttendance.filter(
        (att) => new Date(att.timestamp).toDateString() === filterDateObj
      );
    }

    if (myAttendance.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="3" style="text-align:center">No attendance records found</td></tr>';
      return;
    }

    tbody.innerHTML = myAttendance
      .map((att) => {
        const date = new Date(att.timestamp);
        const statusClass =
          att.status === "Check In" ? "status-present" : "status-absent";
        const icon = att.status === "Check In" ? "✓" : "✗";
        return `
          <tr>
            <td>${date.toLocaleDateString()}</td>
            <td>${date.toLocaleTimeString()}</td>
            <td class="${statusClass}">${icon} ${att.status}</td>
          </tr>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Error displaying history:", error);
    tbody.innerHTML =
      '<tr><td colspan="3" style="text-align:center">Error loading history</td></tr>';
  }
}
