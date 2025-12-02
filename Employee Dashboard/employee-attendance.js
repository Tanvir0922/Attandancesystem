// Employee Attendance Code Submission Functions

function showEnterCodeSection() {
  const contentArea = document.getElementById("contentArea");
  contentArea.innerHTML = `
    <h2>Mark Attendance</h2>
    <div id="codeMessage"></div>
    <div class="info-box">
      <h3 style="margin-bottom: 10px;">Instructions:</h3>
      <p>1. Ask your admin to generate a 6-digit attendance code for you</p>
      <p>2. Enter the code below within 5 minutes</p>
      <p>3. Your attendance will be marked automatically</p>
    </div>
    <div class="code-entry-container">
      <h3 style="color: #667eea; margin-bottom: 20px;">Enter Your 6-Digit Code</h3>
      <input type="text" 
             id="codeInput" 
             class="code-input" 
             maxlength="6" 
             placeholder="000000"
             inputmode="numeric"
             pattern="[0-9]*">
      <br>
      <button onclick="submitAttendanceCode()" class="btn btn-success" style="font-size: 1.2em; padding: 15px 40px; margin-top: 20px;">
        Submit Code
      </button>
    </div>
  `;

  document.getElementById("codeInput").focus();

  document.getElementById("codeInput").addEventListener("input", function (e) {
    this.value = this.value.replace(/[^0-9]/g, "");
  });
}

async function submitAttendanceCode() {
  const codeInput = document.getElementById("codeInput").value.trim();

  if (codeInput.length !== 6) {
    showMessage("codeMessage", "Please enter a valid 6-digit code", "error");
    return;
  }

  try {
    showMessage("codeMessage", "Verifying code...", "info");

    const codeDoc = await db
      .collection("activeCodes")
      .doc(currentUser.id)
      .get();

    if (!codeDoc.exists) {
      showMessage(
        "codeMessage",
        "No active code found for your account. Ask admin to generate one.",
        "error"
      );
      return;
    }

    const activeCode = codeDoc.data();

    if (activeCode.used) {
      showMessage(
        "codeMessage",
        "This code has already been used. Ask admin to generate a new one.",
        "error"
      );
      return;
    }

    if (activeCode.code !== codeInput) {
      showMessage(
        "codeMessage",
        "Invalid code! Please check and try again.",
        "error"
      );
      return;
    }

    if (new Date() > new Date(activeCode.expiresAt)) {
      showMessage(
        "codeMessage",
        "This code has expired! Ask admin to generate a new one.",
        "error"
      );
      await db.collection("activeCodes").doc(currentUser.id).delete();
      return;
    }

    const today = new Date().toDateString();
    const todaySnapshot = await db
      .collection("attendance")
      .where("employeeId", "==", currentUser.id)
      .get();

    const todayRecords = todaySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((att) => new Date(att.timestamp).toDateString() === today)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const lastRecord = todayRecords[0];
    const lastAction = lastRecord ? lastRecord.status : null;

    showCheckInOutOptions(codeInput, lastAction, todayRecords.length);
  } catch (error) {
    console.error("Error submitting code:", error);
    showMessage("codeMessage", "Error: " + error.message, "error");
  }
}

function showCheckInOutOptions(code, lastAction, recordCount) {
  const contentArea = document.getElementById("contentArea");

  let statusMessage = "";
  let suggestedAction = "";

  if (!lastAction) {
    statusMessage = "Good morning! Start your day by checking in.";
    suggestedAction = "Check In";
  } else if (lastAction === "Check In") {
    statusMessage = "Ready for a break or leaving? Check out below.";
    suggestedAction = "Check Out";
  } else if (lastAction === "Check Out") {
    statusMessage = "Back from break? Check in again.";
    suggestedAction = "Check In";
  }

  contentArea.innerHTML = `
    <h2>Mark Attendance</h2>
    <div id="actionMessage"></div>
    
    <div class="welcome-banner" style="margin-bottom: 30px;">
      <h2>Code Verified Successfully!</h2>
      <p style="font-size: 1.1em; margin-top: 10px;">${statusMessage}</p>
    </div>

    <div class="info-box" style="background: #fff3cd; border-color: #ffc107;">
      <h3 style="color: #856404; margin-bottom: 10px;">Today's Summary</h3>
      <p style="color: #856404;"><strong>Total Records:</strong> ${recordCount}</p>
      <p style="color: #856404;"><strong>Last Action:</strong> ${
        lastAction || "None"
      }</p>
      <p style="color: #856404;"><strong>Suggested Next Action:</strong> ${suggestedAction}</p>
    </div>

    <div class="code-entry-container">
      <h3 style="color: #667eea; margin-bottom: 30px;">Choose Your Action</h3>
      
      <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
        <button onclick="markAttendance('${code}', 'Check In')" class="btn btn-success" style="font-size: 1.3em; padding: 20px 50px; min-width: 200px;">
          Check In
        </button>
        <button onclick="markAttendance('${code}', 'Check Out')" class="btn btn-danger" style="font-size: 1.3em; padding: 20px 50px; min-width: 200px;">
          Check Out
        </button>
      </div>

      <p style="margin-top: 30px; color: #666; font-size: 0.95em;">
        You can check in and out multiple times throughout the day
      </p>
    </div>

    <div style="margin-top: 30px;">
      <h3 style="color: #667eea; margin-bottom: 15px;">Today's Activity Log</h3>
      <div id="todayActivityLog"></div>
    </div>
  `;

  displayTodayActivity();
}

async function displayTodayActivity() {
  const logDiv = document.getElementById("todayActivityLog");

  try {
    const today = new Date().toDateString();
    const snapshot = await db
      .collection("attendance")
      .where("employeeId", "==", currentUser.id)
      .get();

    const todayRecords = snapshot.docs
      .map((doc) => doc.data())
      .filter((att) => new Date(att.timestamp).toDateString() === today)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (todayRecords.length === 0) {
      logDiv.innerHTML =
        '<p style="text-align: center; color: #666;">No activity recorded yet today</p>';
      return;
    }

    logDiv.innerHTML = `
      <table class="attendance-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${todayRecords
            .map((att) => {
              const time = new Date(att.timestamp);
              const statusClass =
                att.status === "Check In" ? "status-present" : "status-absent";
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
  } catch (error) {
    console.error("Error loading activity:", error);
    logDiv.innerHTML =
      '<p style="color: #e74c3c;">Error loading activity log</p>';
  }
}

async function markAttendance(code, action) {
  try {
    showMessage("actionMessage", `Marking ${action}...`, "success");

    await db.collection("activeCodes").doc(currentUser.id).update({
      used: true,
    });

    const attendanceData = {
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      timestamp: new Date().toISOString(),
      code: code,
      status: action,
    };

    await db.collection("attendance").add(attendanceData);

    await db.collection("activeCodes").doc(currentUser.id).delete();

    showMessage(
      "actionMessage",
      `Success! ${action} recorded at ${new Date().toLocaleTimeString()}`,
      "success"
    );

    setTimeout(() => {
      displayTodayActivity();
    }, 500);

    setTimeout(() => {
      const contentArea = document.getElementById("contentArea");
      const backButton = `
        <div style="text-align: center; margin-top: 30px;">
          <button onclick="showEmployeeSection('dashboard')" class="btn" style="font-size: 1.1em; padding: 15px 40px;">
            Back to Dashboard
          </button>
        </div>
      `;
      contentArea.innerHTML += backButton;
    }, 1000);
  } catch (error) {
    console.error("Error marking attendance:", error);
    showMessage("actionMessage", "Error: " + error.message, "error");
  }
}
