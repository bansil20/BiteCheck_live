import { API_BASE_URL } from "../utlis/api";
import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import PageHeader from "../components/PageHeader/PageHeader";

function FaceDetection() {
    const webcamRef = useRef(null);
    const [message, setMessage] = useState("Position your face inside the camera frame");
    const [statusType, setStatusType] = useState("info"); // "info", "success", "warning", "danger"
    const [secret, setSecret] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [lastRecognized, setLastRecognized] = useState(null);

    // Auto Scan every 1.5 seconds
    useEffect(() => {
        const id = setInterval(() => {
            captureAndRecognize();
        }, 1500);

        return () => clearInterval(id);
    }, []);

    // FACE SCAN FUNCTION
    const captureAndRecognize = async () => {
        if (!webcamRef.current || isScanning) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setIsScanning(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/recognize_face`, {
                image: imageSrc,
            });

            const data = res.data;
            if (data.recognized) {
                setStatusType("success");
                setMessage(data.message || `✅ Attendance marked for ${data.name}!`);
                setLastRecognized({
                    name: data.name,
                    meal: data.meal,
                    food: data.food
                });
            } else {
                setStatusType("warning");
                setMessage(data.message || "Face not recognized. Please stand still.");
            }
        } catch (err) {
            const msg = err.response?.data?.message;
            if (msg && !msg.includes("No face detected")) {
                setStatusType("danger");
                setMessage(msg);
            }
        } finally {
            setIsScanning(false);
        }
    };

    // SECRET CODE FUNCTION
    const submitCode = async (e) => {
        if (e) e.preventDefault();
        if (!secret.trim()) {
            setStatusType("warning");
            setMessage("⚠️ Please enter your 6-digit code");
            return;
        }

        try {
            const res = await axios.post(`${API_BASE_URL}/recognize_face`, {
                code: secret.trim()
            });

            const data = res.data;
            setStatusType("success");
            setMessage(data.message || "✅ Attendance marked successfully!");
            setLastRecognized({
                name: data.name,
                meal: data.meal,
                food: data.food
            });
            setSecret("");
        } catch (err) {
            setStatusType("danger");
            setMessage(err.response?.data?.message || "❌ Invalid Secret Code");
        }
    };

    return (
        <div className="container mt-4">
            <PageHeader PageTitle="Face Attendance" />

            <div className="text-center mt-3">
                <div className="row justify-content-center">
                    <div className="col-md-7 col-lg-6">
                        {/* Camera Container with Scanning Overlay */}
                        <div
                            className="position-relative shadow-lg rounded-4 overflow-hidden mb-3 bg-dark"
                            style={{
                                border: statusType === "success" ? "3px solid #28a745" : "3px solid #00bfa5",
                                maxHeight: "380px"
                            }}
                        >
                            <Webcam
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{
                                    facingMode: "user",
                                    width: 640,
                                    height: 480
                                }}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover"
                                }}
                            />

                            {/* Scanning Guide Box Overlay */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    width: "220px",
                                    height: "260px",
                                    border: statusType === "success" ? "2px solid #28a745" : "2px dashed rgba(255,255,255,0.7)",
                                    borderRadius: "16px",
                                    pointerEvents: "none",
                                    boxShadow: statusType === "success" ? "0 0 20px #28a745" : "none"
                                }}
                            />
                        </div>

                        {/* Status Message Alert */}
                        <div
                            className={`alert alert-${statusType} shadow-sm fw-semibold`}
                            style={{ fontSize: "16px", transition: "0.3s" }}
                        >
                            {message}
                        </div>

                        {/* Last Recognized Student Banner */}
                        {lastRecognized && (
                            <div className="card shadow-sm border-0 bg-light p-2 mb-3 text-start">
                                <div className="d-flex align-items-center justify-content-between px-2">
                                    <div>
                                        <h6 className="mb-0 text-success fw-bold">✓ {lastRecognized.name}</h6>
                                        <small className="text-muted">{lastRecognized.meal}: {lastRecognized.food || "Meal Served"}</small>
                                    </div>
                                    <span className="badge bg-success">Marked Present</span>
                                </div>
                            </div>
                        )}

                        {/* Secret Code Alternative Form */}
                        <div className="card shadow-sm border-0 p-3 mt-2 rounded-4">
                            <h6 className="fw-bold mb-2">Or Use Student Secret Code</h6>
                            <form onSubmit={submitCode} className="d-flex gap-2">
                                <input
                                    type="text"
                                    maxLength="6"
                                    className="form-control text-center fw-bold fs-5"
                                    placeholder="6-digit code"
                                    value={secret}
                                    onChange={(e) => setSecret(e.target.value)}
                                />
                                <button type="submit" className="btn btn-primary px-4 fw-semibold">
                                    Submit
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FaceDetection;
