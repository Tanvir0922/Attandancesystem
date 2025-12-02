// Employee Face Recognition Attendance Functions

let webcamStream = null;
let detectionInterval = null;

async function showEnterCodeSection() {
  const contentArea = document.getElementById("contentArea");
  contentArea.innerHTML = `
    <h2>Mark Attendance with Face Recognition</h2>
    <div id="codeMessage"></div>
    <div class="info-box">
      <h3 style="margin-bottom: 10px;">Instructions:</h3>
      <p>1. Click "Start Recognition" button</p>
      <p>2. Allow camera access when prompted</p>
      <p>3. Position your face clearly in front of the camera</p>
      <p>4. Make sure there is adequate lighting</p>
      <p>5. Hold still while face is being recognized</p>
    </div>
    <div class="code-entry-container" style="text-align: center;">
      <h3 style="color: #667eea; margin-bottom: 20px;">Face Recognition Camera</h3>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; position: relative; display: inline-block;">
        <video id="webcam" autoplay playsinline muted style="
          width: 100%;
          max-width: 500px;
          height: auto;
          border: 3px solid #667eea;
          border-radius: 10px;
          display: block;
          transform: scaleX(-1);
          background: #000;
        "></video>
        <div id="videoStatus" style="color: #666; margin-top: 10px; font-size: 0.9em;">Camera is off</div>
      </div>

      <canvas id="detectionCanvas" width="500" height="375" style="display: none;"></canvas>

      <div style="margin: 20px 0; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <button onclick="startFaceRecognition()" class="btn btn-success" style="font-size: 1.1em; padding: 15px 40px;">
          ▶ Start Recognition
        </button>
        <button onclick="stopFaceRecognition()" class="btn btn-danger" style="font-size: 1.1em; padding: 15px 40px;">
          ⏹ Stop
        </button>
      </div>

      <div id="recognitionStatus" style="
        text-align: center;
        margin-top: 20px;
        font-size: 1.1em;
        color: #667eea;
        font-weight: bold;
        min-height: 30px;
      "></div>
    </div>
  `;
}

async function startFaceRecognition() {
  try {
    showMessage("codeMessage", "Requesting camera access...", "info");

    const videoElement = document.getElementById("webcam");

    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showMessage(
        "codeMessage",
        "Your browser does not support camera access",
        "error"
      );
      return;
    }

    // Initialize face detection models
    showMessage("codeMessage", "Loading face detection models...", "info");
    const modelsLoaded = await initializeFaceDetection();
    if (!modelsLoaded) {
      showMessage(
        "codeMessage",
        "Failed to load face detection models",
        "error"
      );
      return;
    }

    // Request camera access
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      videoElement.srcObject = webcamStream;

      // Ensure video plays
      videoElement.onloadedmetadata = () => {
        videoElement.play().catch((err) => {
          console.error("Video play error:", err);
          showMessage("codeMessage", "Could not start video playback", "error");
        });
      };

      document.getElementById("videoStatus").textContent =
        "Camera is ON - detecting face...";
      showMessage("codeMessage", "Camera started. Please wait...", "info");
    } catch (cameraError) {
      console.error("Camera access error:", cameraError);
      if (cameraError.name === "NotAllowedError") {
        showMessage(
          "codeMessage",
          "Camera permission denied. Please allow camera access.",
          "error"
        );
      } else if (cameraError.name === "NotFoundError") {
        showMessage("codeMessage", "No camera found on this device", "error");
      } else {
        showMessage(
          "codeMessage",
          "Camera error: " + cameraError.message,
          "error"
        );
      }
      return;
    }

    // Start face recognition loop
    let detectionAttempts = 0;
    const maxAttempts = 60; // 60 seconds timeout

    detectionInterval = setInterval(async () => {
      detectionAttempts++;

      try {
        // Check if video is ready
        if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
          return;
        }

        const result = await recognizeEmployeeFace(videoElement);

        if (result.success) {
          clearInterval(detectionInterval);
          document.getElementById(
            "recognitionStatus"
          ).innerHTML = `<span style="color: #27ae60; font-size: 1.2em;">✓ Face Recognized!</span><br><span style="font-size: 0.9em;">Confidence: ${result.confidence.toFixed(
            2
          )}%</span>`;

          setTimeout(() => {
            stopFaceRecognition();
            handleFaceRecognitionSuccess(result.employeeId);
          }, 1500);
        } else {
          const remaining = maxAttempts - detectionAttempts;
          document.getElementById(
            "recognitionStatus"
          ).innerHTML = `Scanning... (${remaining}s remaining)<br><span style="font-size: 0.9em; color: #999;">Position face clearly in frame</span>`;
        }

        // Timeout after max attempts
        if (detectionAttempts >= maxAttempts) {
          clearInterval(detectionInterval);
          stopFaceRecognition();
          showMessage(
            "codeMessage",
            "Face recognition timeout. Please try again.",
            "error"
          );
        }
      } catch (error) {
        console.error("Recognition error:", error);
      }
    }, 1000);
  } catch (error) {
    console.error("Error starting face recognition:", error);
    showMessage("codeMessage", "Error: " + error.message, "error");
  }
}

function stopFaceRecognition() {
  try {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      detectionInterval = null;
    }

    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => {
        track.stop();
      });
      webcamStream = null;
    }

    const videoElement = document.getElementById("webcam");
    if (videoElement) {
      videoElement.srcObject = null;
      document.getElementById("videoStatus").textContent = "Camera is off";
    }

    document.getElementById("recognitionStatus").innerHTML = "";
  } catch (error) {
    console.error("Error stopping camera:", error);
  }
}

async function handleFaceRecognitionSuccess(employeeId) {
  try {
    const empDoc = await db.collection("employees").doc(employeeId).get();

    if (!empDoc.exists) {
      showMessage("codeMessage", "Employee not found in database", "error");
      return;
    }

    const employee = empDoc.data();

    const today = new Date().toDateString();
    const todaySnapshot = await db
      .collection("attendance")
      .where("employeeId", "==", employeeId)
      .get();

    const todayRecords = todaySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((att) => new Date(att.timestamp).toDateString() === today)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const lastRecord = todayRecords[0];
    const lastAction = lastRecord ? lastRecord.status : null;

    showCheckInOutOptions(
      employeeId,
      employee.name,
      lastAction,
      todayRecords.length
    );
  } catch (error) {
    console.error("Error:", error);
    showMessage("codeMessage", "Error: " + error.message, "error");
  }
}

function showCheckInOutOptions(empId, empName, lastAction, recordCount) {
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
      <h2>✓ Face Recognized!</h2>
      <h3 style="margin: 15px 0;">Welcome, ${empName}</h3>
      <p style="font-size: 1.1em; margin-top: 10px;">${statusMessage}</p>
    </div>

    <div class="info-box" style="background: #fff3cd; border-color: #ffc107;">
      <h3 style="color: #856404; margin-bottom: 10px;">Today's Summary</h3>
      <p style="color: #856404;"><strong>Total Records:</strong> ${recordCount}</p>
      <p style="color: #856404;"><strong>Last Action:</strong> ${
        lastAction || "None"
      }</p>
      <p style="color: #856404;"><strong>Suggested Action:</strong> ${suggestedAction}</p>
    </div>

    <div class="code-entry-container">
      <h3 style="color: #667eea; margin-bottom: 30px;">Choose Your Action</h3>
      
      <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
        <button onclick="markAttendanceFace('${empId}', 'Check In')" class="btn btn-success" style="font-size: 1.3em; padding: 20px 50px; min-width: 200px;">
          ✓ Check In
        </button>
        <button onclick="markAttendanceFace('${empId}', 'Check Out')" class="btn btn-danger" style="font-size: 1.3em; padding: 20px 50px; min-width: 200px;">
          ✗ Check Out
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
            <th>Recognition Type</th>
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
                  <td><span class="badge badge-info">Face Recognition</span></td>
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

async function markAttendanceFace(empId, action) {
  try {
    showMessage("actionMessage", `Marking ${action}...`, "success");

    const attendanceData = {
      employeeId: empId,
      employeeName: currentUser.name,
      timestamp: new Date().toISOString(),
      status: action,
      recognitionMethod: "Face Recognition",
    };

    await db.collection("attendance").add(attendanceData);

    showMessage(
      "actionMessage",
      `✓ Success! ${action} recorded at ${new Date().toLocaleTimeString()}`,
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
