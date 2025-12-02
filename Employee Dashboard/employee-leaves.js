// Employee Leave Request Functions

function showLeaveRequestForm() {
  const contentArea = document.getElementById("contentArea");
  contentArea.innerHTML = `
    <h2>Request Leave</h2>
    <div id="leaveMessage"></div>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; max-width: 600px;">
      <form id="leaveForm">
        <div class="form-group">
          <label>Leave Type:</label>
          <select id="leaveType" required>
            <option value="">Select leave type</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Casual Leave">Casual Leave</option>
            <option value="Annual Leave">Annual Leave</option>
            <option value="Maternity Leave">Maternity Leave</option>
            <option value="Bereavement Leave">Bereavement Leave</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>From Date:</label>
            <input type="date" id="leaveFromDate" required>
          </div>
          <div class="form-group">
            <label>To Date:</label>
            <input type="date" id="leaveToDate" required>
          </div>
        </div>
        <div class="form-group">
          <label>Reason:</label>
          <textarea id="leaveReason" rows="4" required placeholder="Please provide reason for your leave request"></textarea>
        </div>
        <button type="submit" class="btn btn-success" style="width: 100%;">Submit Request</button>
      </form>
    </div>

    <h3 style="color: #667eea; margin: 30px 0 15px;">Your Leave History</h3>
    <div id="myLeaveHistory"></div>
  `;

  document
    .getElementById("leaveForm")
    .addEventListener("submit", submitLeaveRequest);
  displayMyLeaveRequests();
}

async function submitLeaveRequest(e) {
  e.preventDefault();

  const leaveData = {
    employeeId: currentUser.id,
    employeeName: currentUser.name,
    type: document.getElementById("leaveType").value,
    fromDate: document.getElementById("leaveFromDate").value,
    toDate: document.getElementById("leaveToDate").value,
    reason: document.getElementById("leaveReason").value,
    status: "pending",
    requestDate: new Date().toISOString(),
  };

  try {
    await db.collection("leaves").add(leaveData);
    showMessage(
      "leaveMessage",
      "Leave request submitted successfully!",
      "success"
    );
    document.getElementById("leaveForm").reset();
    displayMyLeaveRequests();
  } catch (error) {
    console.error("Error submitting leave:", error);
    showMessage("leaveMessage", "Failed to submit leave request.", "error");
  }
}

async function displayMyLeaveRequests() {
  const historyDiv = document.getElementById("myLeaveHistory");
  historyDiv.innerHTML =
    '<div class="loading"><div class="spinner"></div></div>';

  try {
    const snapshot = await db
      .collection("leaves")
      .where("employeeId", "==", currentUser.id)
      .get();

    const leaves = snapshot.docs.map((doc) => doc.data());

    if (leaves.length === 0) {
      historyDiv.innerHTML = "<p>No leave requests yet.</p>";
      return;
    }

    historyDiv.innerHTML = `
      <table class="attendance-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>From Date</th>
            <th>To Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${leaves
            .map((leave) => {
              let badgeClass = "";
              if (leave.status === "approved") badgeClass = "badge-success";
              else if (leave.status === "rejected") badgeClass = "badge-danger";
              else badgeClass = "badge-info";

              return `
                <tr>
                  <td>${leave.type}</td>
                  <td>${leave.fromDate}</td>
                  <td>${leave.toDate}</td>
                  <td><span class="badge ${badgeClass}">${
                leave.status.charAt(0).toUpperCase() + leave.status.slice(1)
              }</span></td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error("Error loading leaves:", error);
    historyDiv.innerHTML =
      '<div class="alert alert-error">Error loading leave history</div>';
  }
}
