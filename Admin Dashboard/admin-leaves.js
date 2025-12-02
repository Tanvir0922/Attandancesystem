// Admin Leave Management Functions

async function showLeavesSection() {
  const contentArea = document.getElementById("contentArea");
  contentArea.innerHTML =
    '<div class="loading"><div class="spinner"></div><p>Loading leave requests...</p></div>';

  try {
    const snapshot = await db.collection("leaves").get();
    const leaves = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const pending = leaves.filter((l) => l.status === "pending");
    const approved = leaves.filter((l) => l.status === "approved");
    const rejected = leaves.filter((l) => l.status === "rejected");

    contentArea.innerHTML = `
      <h2>Leave Management</h2>
      
      <h3 style="color: #667eea; margin: 30px 0 15px;">Pending Requests (${pending.length})</h3>
      <div id="pendingLeaves"></div>

      <h3 style="color: #667eea; margin: 30px 0 15px;">Approved (${approved.length})</h3>
      <div id="approvedLeaves"></div>

      <h3 style="color: #667eea; margin: 30px 0 15px;">Rejected (${rejected.length})</h3>
      <div id="rejectedLeaves"></div>
    `;

    document.getElementById("pendingLeaves").innerHTML = pending.length
      ? pending
          .map(
            (l) => `
              <div class="employee-card">
                <h3>${l.employeeName}</h3>
                <p><strong>Type:</strong> ${l.type}</p>
                <p><strong>From:</strong> ${l.fromDate}</p>
                <p><strong>To:</strong> ${l.toDate}</p>
                <p><strong>Reason:</strong> ${l.reason}</p>
                <div class="button-group">
                  <button class="btn btn-success" onclick="updateLeaveStatus('${l.id}', 'approved')">Approve</button>
                  <button class="btn btn-danger" onclick="updateLeaveStatus('${l.id}', 'rejected')">Reject</button>
                </div>
              </div>
          `
          )
          .join("")
      : "<p>No pending requests</p>";

    document.getElementById("approvedLeaves").innerHTML = approved.length
      ? approved
          .map(
            (l) => `
              <div class="employee-card">
                <h3>${l.employeeName} <span class="badge badge-success">Approved</span></h3>
                <p><strong>Type:</strong> ${l.type}</p>
                <p><strong>From:</strong> ${l.fromDate}</p>
                <p><strong>To:</strong> ${l.toDate}</p>
              </div>
          `
          )
          .join("")
      : "<p>No approved leaves</p>";

    document.getElementById("rejectedLeaves").innerHTML = rejected.length
      ? rejected
          .map(
            (l) => `
              <div class="employee-card">
                <h3>${l.employeeName} <span class="badge badge-danger">Rejected</span></h3>
                <p><strong>Type:</strong> ${l.type}</p>
                <p><strong>From:</strong> ${l.fromDate}</p>
                <p><strong>To:</strong> ${l.toDate}</p>
              </div>
          `
          )
          .join("")
      : "<p>No rejected leaves</p>";
  } catch (error) {
    console.error("Error loading leaves:", error);
    contentArea.innerHTML =
      '<div class="alert alert-error">Error loading leave requests</div>';
  }
}

async function updateLeaveStatus(leaveId, status) {
  try {
    await db.collection("leaves").doc(leaveId).update({ status });
    showAdminSection("leaves");
  } catch (error) {
    console.error("Error updating leave:", error);
  }
}

async function viewEmployeeLeaves(empId, empName) {
  try {
    const snapshot = await db
      .collection("leaves")
      .where("employeeId", "==", empId)
      .get();

    const leaves = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const pending = leaves.filter((l) => l.status === "pending");
    const approved = leaves.filter((l) => l.status === "approved");
    const rejected = leaves.filter((l) => l.status === "rejected");

    const leaveModal = document.getElementById("leaveModal");
    const container = document.getElementById("leaveRequestsContainer");

    let content = `
      <h3 style="margin-bottom: 20px;">Leave Requests - ${empName}</h3>
      
      <h4 style="color: #667eea; margin-top: 20px; margin-bottom: 10px;">Pending Requests (${pending.length})</h4>
    `;

    if (pending.length > 0) {
      content += `
        <div style="margin-bottom: 20px;">
          ${pending
            .map(
              (leave) => `
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 5px solid #f39c12;">
                <p><strong>Type:</strong> ${leave.type}</p>
                <p><strong>From:</strong> ${leave.fromDate} <strong>To:</strong> ${leave.toDate}</p>
                <p><strong>Reason:</strong> ${leave.reason}</p>
                <div class="button-group" style="margin-top: 10px;">
                  <button class="btn btn-success" onclick="updateLeaveStatus('${leave.id}', 'approved')">Approve</button>
                  <button class="btn btn-danger" onclick="updateLeaveStatus('${leave.id}', 'rejected')">Reject</button>
                </div>
              </div>
            `
            )
            .join("")}
        </div>
      `;
    } else {
      content += '<p style="color: #666;">No pending requests</p>';
    }

    content += `<h4 style="color: #667eea; margin-top: 20px; margin-bottom: 10px;">Approved Requests (${approved.length})</h4>`;

    if (approved.length > 0) {
      content += `
        <div style="margin-bottom: 20px;">
          ${approved
            .map(
              (leave) => `
              <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 5px solid #27ae60;">
                <p><strong>Type:</strong> ${leave.type}</p>
                <p><strong>From:</strong> ${leave.fromDate} <strong>To:</strong> ${leave.toDate}</p>
                <p><strong>Reason:</strong> ${leave.reason}</p>
                <span class="badge badge-success">Approved</span>
              </div>
            `
            )
            .join("")}
        </div>
      `;
    } else {
      content += '<p style="color: #666;">No approved requests</p>';
    }

    content += `<h4 style="color: #667eea; margin-top: 20px; margin-bottom: 10px;">Rejected Requests (${rejected.length})</h4>`;

    if (rejected.length > 0) {
      content += `
        <div>
          ${rejected
            .map(
              (leave) => `
              <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 5px solid #e74c3c;">
                <p><strong>Type:</strong> ${leave.type}</p>
                <p><strong>From:</strong> ${leave.fromDate} <strong>To:</strong> ${leave.toDate}</p>
                <p><strong>Reason:</strong> ${leave.reason}</p>
                <span class="badge badge-danger">Rejected</span>
              </div>
            `
            )
            .join("")}
        </div>
      `;
    } else {
      content += '<p style="color: #666;">No rejected requests</p>';
    }

    container.innerHTML = content;
    leaveModal.classList.add("active");
  } catch (error) {
    console.error("Error viewing employee leaves:", error);
    alert("Error loading leave requests");
  }
}
