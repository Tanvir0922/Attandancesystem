// Face Recognition System using face-api.js

let faceDescriptors = {};
let faceDetectionModel = null;
let modelsLoaded = false;

// Initialize face detection models
async function initializeFaceDetection() {
  if (modelsLoaded) {
    console.log("Models already loaded");
    return true;
  }

  try {
    const MODEL_URL =
      "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";

    console.log("Loading face detection models from:", MODEL_URL);

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);

    modelsLoaded = true;
    console.log("Face detection models loaded successfully");
    return true;
  } catch (error) {
    console.error("Error loading face detection models:", error);
    modelsLoaded = false;
    return false;
  }
}

// Ensure models are loaded before any face operation
async function ensureModelsLoaded() {
  if (!modelsLoaded) {
    console.log("Models not loaded, loading now...");
    const loaded = await initializeFaceDetection();
    if (!loaded) {
      throw new Error("Failed to load face detection models");
    }
  }
  return true;
}

// Get employee face descriptor from uploaded image
async function getEmployeeFaceDescriptor(imageFile) {
  try {
    // Ensure models are loaded first
    await ensureModelsLoaded();

    console.log("Processing image file:", imageFile.name);

    // Convert file to image
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          console.log("Image loaded, detecting face...");

          // Use optimized detection options for better accuracy
          const detection = await faceapi
            .detectSingleFace(
              img,
              new faceapi.TinyFaceDetectorOptions({
                inputSize: 512, // Higher resolution for better feature extraction
                scoreThreshold: 0.4, // More lenient to handle various conditions
              })
            )
            .withFaceLandmarks()
            .withFaceDescriptor();

          URL.revokeObjectURL(url);

          if (!detection || !detection.descriptor) {
            throw new Error(
              "No face detected in the image. Please ensure face is clearly visible and well-lit."
            );
          }

          console.log(
            "Face detected, descriptor length:",
            detection.descriptor.length
          );
          resolve(detection.descriptor);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image file"));
      };

      img.src = url;
    });
  } catch (error) {
    console.error("Error processing employee image:", error);
    throw error;
  }
}

// Register employee face descriptor
async function registerEmployeeFace(employeeId, imageFile) {
  try {
    // Ensure models are loaded first
    await ensureModelsLoaded();

    console.log("Starting face registration for employee:", employeeId);

    // Get face descriptor from image
    const descriptor = await getEmployeeFaceDescriptor(imageFile);

    if (!descriptor || descriptor.length === 0) {
      throw new Error("Failed to extract face descriptor");
    }

    console.log("Descriptor extracted, uploading to database...");

    // Convert descriptor to array for storage
    const descriptorArray = Array.from(descriptor);

    // Get image as base64
    const imageUrl = await uploadFaceImage(employeeId, imageFile);

    // Store in Firebase
    await db.collection("employeeFaces").doc(employeeId).set({
      employeeId: employeeId,
      descriptor: descriptorArray,
      registeredDate: new Date().toISOString(),
      imageUrl: imageUrl,
    });

    console.log("Face registered successfully for:", employeeId);
    return true;
  } catch (error) {
    console.error("Error registering employee face:", error);
    throw error;
  }
}

// Upload face image to storage or encode as base64
async function uploadFaceImage(employeeId, imageFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      console.log("Image converted to base64");
      resolve(e.target.result);
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      reject(new Error("Failed to read image file"));
    };

    reader.readAsDataURL(imageFile);
  });
}

// Recognize face from webcam and match with employee
async function recognizeEmployeeFace(videoElement, expectedEmployeeId = null) {
  try {
    // Ensure models are loaded first
    await ensureModelsLoaded();

    // Check if video element is ready
    if (
      !videoElement ||
      videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA
    ) {
      return {
        success: false,
        error: "Video not ready",
        confidence: 0,
      };
    }

    console.log("Attempting to detect face from video...");
    if (expectedEmployeeId) {
      console.log("Expected employee ID:", expectedEmployeeId);
    }

    // Use SSD MobileNet for better detection in varying conditions
    const detection = await faceapi
      .detectSingleFace(
        videoElement,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 512, // Higher input size for better accuracy
          scoreThreshold: 0.2, // Lower threshold to detect faces in poor lighting
        })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection || !detection.descriptor) {
      return {
        success: false,
        error: "No face detected in video",
        confidence: 0,
      };
    }

    console.log("Face detected from video");

    // If expectedEmployeeId is provided, only check against that employee
    let employeeFaces = {};

    if (expectedEmployeeId) {
      // Only get the specific employee's face data
      const employeeFaceDoc = await db
        .collection("employeeFaces")
        .doc(expectedEmployeeId)
        .get();

      if (!employeeFaceDoc.exists) {
        console.warn(
          "Expected employee face not found in database:",
          expectedEmployeeId
        );
        return {
          success: false,
          error: "Your face is not registered. Please contact admin.",
          confidence: 0,
        };
      }

      const data = employeeFaceDoc.data();
      employeeFaces[expectedEmployeeId] = new Float32Array(data.descriptor);
      console.log("Checking against specific employee:", expectedEmployeeId);
    } else {
      // Get all employee faces from database (for general recognition)
      const employeeFacesSnapshot = await db.collection("employeeFaces").get();

      if (employeeFacesSnapshot.empty) {
        console.warn("No employee faces registered in database");
        return {
          success: false,
          error: "No employees registered for face recognition",
          confidence: 0,
        };
      }

      employeeFacesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        // Convert array back to Float32Array
        employeeFaces[data.employeeId] = new Float32Array(data.descriptor);
      });

      console.log(
        "Comparing with",
        Object.keys(employeeFaces).length,
        "registered employees"
      );
    }

    // Find matching employee
    const detectedDescriptor = detection.descriptor;
    let bestMatch = null;
    let bestDistance = Infinity;
    const MATCH_THRESHOLD = 0.2; // Strict threshold
    const MIN_CONFIDENCE = 80; // Minimum confidence percentage required

    for (const [empId, descriptor] of Object.entries(employeeFaces)) {
      const distance = faceapi.euclideanDistance(
        detectedDescriptor,
        descriptor
      );
      console.log("Distance to", empId, ":", distance.toFixed(4));

      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = empId;
      }
    }

    // Only accept match if below threshold
    if (bestMatch && bestDistance < MATCH_THRESHOLD) {
      const confidence = Math.max(0, (1 - bestDistance) * 100);

      // Additional confidence check
      if (confidence >= MIN_CONFIDENCE) {
        // If we're checking for a specific employee, verify it matches
        if (expectedEmployeeId && bestMatch !== expectedEmployeeId) {
          console.log(
            "Face detected but doesn't match expected employee.",
            "Expected:",
            expectedEmployeeId,
            "Got:",
            bestMatch
          );
          return {
            success: false,
            error:
              "Face doesn't match logged in employee. Please ensure you are the correct user.",
            confidence: 0,
          };
        }

        console.log(
          "Match found:",
          bestMatch,
          "Distance:",
          bestDistance.toFixed(4),
          "Confidence:",
          confidence.toFixed(2) + "%"
        );
        return {
          success: true,
          employeeId: bestMatch,
          confidence: confidence,
        };
      } else {
        console.log(
          "Match found but confidence too low:",
          confidence.toFixed(2) + "%",
          "(minimum required:",
          MIN_CONFIDENCE + "%)"
        );
        return {
          success: false,
          error:
            "Face match confidence too low. Please try again in better lighting.",
          confidence: 0,
        };
      }
    } else {
      if (expectedEmployeeId) {
        console.log(
          "Face doesn't match expected employee:",
          expectedEmployeeId,
          "Best distance:",
          bestDistance.toFixed(4)
        );
        return {
          success: false,
          error:
            "Your face doesn't match. Please ensure you are the logged in employee.",
          confidence: 0,
        };
      }

      console.log(
        "No match found. Best distance was:",
        bestDistance.toFixed(4),
        "(threshold:",
        MATCH_THRESHOLD + ")"
      );
      return {
        success: false,
        error: "Face not recognized. Please ensure you are registered.",
        confidence: 0,
      };
    }
  } catch (error) {
    console.error("Error recognizing face:", error);
    return {
      success: false,
      error: error.message,
      confidence: 0,
    };
  }
}

// Continuous face recognition with timeout
async function continuousFaceRecognition(
  videoElement,
  expectedEmployeeId = null,
  onSuccess,
  onTimeout,
  onError
) {
  const TIMEOUT_DURATION = 15000; // 15 seconds
  const ATTEMPT_INTERVAL = 500; // Try every 500ms

  let recognitionInterval = null;
  let timeoutTimer = null;
  let hasMatched = false;

  return new Promise((resolve, reject) => {
    // Start timeout timer
    timeoutTimer = setTimeout(() => {
      if (!hasMatched) {
        clearInterval(recognitionInterval);
        console.log("Face recognition timed out after 15 seconds");
        if (onTimeout) {
          onTimeout();
        }
        resolve({
          success: false,
          error: "Face not matched within 15 seconds. Please try again.",
          timedOut: true,
        });
      }
    }, TIMEOUT_DURATION);

    // Start continuous recognition attempts
    recognitionInterval = setInterval(async () => {
      try {
        const result = await recognizeEmployeeFace(
          videoElement,
          expectedEmployeeId
        );

        if (result.success) {
          // Match found!
          hasMatched = true;
          clearInterval(recognitionInterval);
          clearTimeout(timeoutTimer);

          console.log("Recognition successful:", result.employeeId);
          if (onSuccess) {
            onSuccess(result);
          }
          resolve(result);
        } else if (
          result.error !== "No face detected in video" &&
          result.error !== "Video not ready"
        ) {
          // Log other errors but continue trying
          console.log("Recognition attempt failed:", result.error);
        }
      } catch (error) {
        console.error("Error during recognition attempt:", error);
        if (onError) {
          onError(error);
        }
      }
    }, ATTEMPT_INTERVAL);
  });
}

// Stop continuous recognition
function stopContinuousFaceRecognition() {
  // This will be set by the continuousFaceRecognition function
  // Individual implementations should track and clear their intervals
  console.log("Stopping continuous face recognition");
}

// Get webcam stream
async function getWebcamStream(videoElement) {
  try {
    console.log("Requesting webcam access...");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user",
      },
      audio: false,
    });

    console.log("Webcam stream obtained");
    videoElement.srcObject = stream;
    return stream;
  } catch (error) {
    console.error("Error accessing webcam:", error);
    throw error;
  }
}

// Stop webcam stream
function stopWebcamStream(stream) {
  if (stream) {
    console.log("Stopping webcam stream");
    stream.getTracks().forEach((track) => {
      track.stop();
      console.log("Track stopped:", track.kind);
    });
  }
}

// Draw face detection box
async function drawFaceDetection(videoElement, canvasElement) {
  // Ensure models are loaded first
  await ensureModelsLoaded();

  const canvas = canvasElement;
  const displaySize = {
    width: videoElement.width,
    height: videoElement.height,
  };

  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    resizedDetections.forEach((detection) => {
      const box = detection.detection.box;
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    });
  }, 100);
}

// Pre-load models when page loads (add this to your app initialization)
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", async () => {
    console.log("Pre-loading face recognition models...");
    try {
      await initializeFaceDetection();
      console.log("Face recognition models ready");
    } catch (error) {
      console.error("Failed to pre-load face recognition models:", error);
    }
  });
}
