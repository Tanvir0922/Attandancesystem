// Admin Attendance Management Functions

async function showAttendanceSection() {
  const contentArea = document.getElementById("contentArea");
  contentArea.innerHTML = `
    <h2>Attendance Records</h2>
    <div style="margin-bottom: 20px;">
      <label>Filter by Date:</label>
      <input type="date" id="filterDate" onchange="displayAttendance()" value="${
        new Date().toISOString().split("T")[0]
      }">
      <button onclick="exportAttendanceData()" class="export-btn" style="margin-left: 10px;">Export to CSV</button>
    </div>
    <table class="attendance-table">
      <thead>
        <tr>
          <th>Employee ID</th>
          <th>Name</th>
          <th>Date</th>
          <th>Time</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody id="attendanceBody"><tr><td colspan="5"><div class="loading"><div class="spinner"></div></div></td></tr></tbody>
    </table>
  `;
  displayAttendance();
}

async function displayAttendance() {
  const tbody = document.getElementById("attendanceBody");
  const filterDate = document.getElementById("filterDate").value;

  try {
    const snapshot = await db.collection("attendance").get();
    let attendanceRecords = snapshot.docs.map((doc) => doc.data());

    attendanceRecords.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    if (filterDate) {
      const filterDateObj = new Date(filterDate).toDateString();
      attendanceRecords = attendanceRecords.filter(
        (att) => new Date(att.timestamp).toDateString() === filterDateObj
      );
    }

    if (attendanceRecords.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center">No attendance records found</td></tr>';
      return;
    }

    tbody.innerHTML = attendanceRecords
      .map((att) => {
        const date = new Date(att.timestamp);
        const statusClass =
          att.status === "Check In" ? "status-present" : "status-absent";
        const icon = att.status === "Check In" ? "✓" : "✗";
        return `
          <tr>
            <td>${att.employeeId}</td>
            <td>${att.employeeName}</td>
            <td>${date.toLocaleDateString()}</td>
            <td>${date.toLocaleTimeString()}</td>
            <td class="${statusClass}">${icon} ${att.status}</td>
          </tr>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Error displaying attendance:", error);
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center">Error loading attendance</td></tr>';
  }
}

function exportAttendanceData() {
  const table = document.querySelector(".attendance-table");
  let csv = [];

  table.querySelectorAll("tr").forEach((row) => {
    let cells = [];
    row.querySelectorAll("td, th").forEach((cell) => {
      cells.push('"' + cell.textContent.replace(/"/g, '""') + '"');
    });
    csv.push(cells.join(","));
  });

  const link = document.createElement("a");
  link.href =
    "data:text/csv;charset=utf-8," + encodeURIComponent(csv.join("\n"));
  link.download =
    "attendance_" + new Date().toISOString().split("T")[0] + ".csv";
  link.click();
}

async function generateCodeForEmployee(empId) {
  try {
    const empDoc = await db.collection("employees").doc(empId).get();
    if (!empDoc.exists) return;

    const employee = empDoc.data();
    const sixDigitCode = generateSixDigitCode();

    const codeData = {
      employeeId: empId,
      code: sixDigitCode,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      used: false,
    };

    await db.collection("activeCodes").doc(empId).set(codeData);

    document.getElementById("codeModal").classList.add("active");
    document.getElementById(
      "modalEmployeeName"
    ).textContent = `Code for ${employee.name}`;
    document.getElementById("attendanceCode").textContent = sixDigitCode;

    startCodeTimer(empId, codeData.expiresAt);
  } catch (error) {
    console.error("Error generating code:", error);
    alert("Failed to generate code");
  }
}

function startCodeTimer(empId, expiresAt) {
  clearInterval(activeCodeTimers[empId]);
  const timerDiv = document.getElementById("modalTimer");

  activeCodeTimers[empId] = setInterval(async () => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const remaining = expiry - now;

    if (remaining <= 0) {
      timerDiv.innerHTML = "Code Expired!";
      timerDiv.style.color = "#e74c3c";

      try {
        await db.collection("activeCodes").doc(empId).delete();
      } catch (error) {
        console.error("Error deleting code:", error);
      }

      clearInterval(activeCodeTimers[empId]);
    } else {
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      timerDiv.innerHTML = `Expires in: ${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
      timerDiv.style.color = "#667eea";
    }
  }, 1000);
}

function viewEmployeeHistory(empId, empName) {
  selectedEmployeeForHistory = { id: empId, name: empName };
  document.getElementById(
    "historyModalTitle"
  ).textContent = `Attendance History - ${empName}`;
  document.getElementById("historyFilterDate").value = new Date()
    .toISOString()
    .split("T")[0];
  document.getElementById("historyModal").classList.add("active");
  displayEmployeeHistoryInModal();
}

async function displayEmployeeHistoryInModal() {
  if (!selectedEmployeeForHistory) return;

  const tbody = document.getElementById("historyModalBody");
  const filterDate = document.getElementById("historyFilterDate").value;

  try {
    const snapshot = await db
      .collection("attendance")
      .where("employeeId", "==", selectedEmployeeForHistory.id)
      .get();

    let records = snapshot.docs.map((doc) => doc.data());
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (filterDate) {
      const filterDateObj = new Date(filterDate).toDateString();
      records = records.filter(
        (att) => new Date(att.timestamp).toDateString() === filterDateObj
      );
    }

    if (records.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="3" style="text-align:center">No attendance records found</td></tr>';
      return;
    }

    tbody.innerHTML = records
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
