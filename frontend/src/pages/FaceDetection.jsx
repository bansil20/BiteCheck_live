import { API_BASE_URL } from "../utlis/api";
import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import PageHeader from "../components/PageHeader/PageHeader";

function FaceDetection() {
    const webcamRef = useRef(null);
    const [message, setMessage] = useState("");
    const [secret, setSecret] = useState("");

    // Auto Scan
    useEffect(() => {
        const id = setInterval(() => {
            captureAndRecognize();
        }, 2000);

        return () => clearInterval(id);
    }, []);

    // FACE SCAN FUNCTION
    const captureAndRecognize = async () => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        try {
            const res = await axios.post(`${API_BASE_URL}/recognize_face`, {
                image: imageSrc,
            });

            // Always show message (success OR already marked)
            setMessage(res.data.message || "");

        } catch (err) {
            // Do NOT stop scanning — just show message
            setMessage(err.response?.data?.message || "❌ Error recognizing face");
        }
    };

    // SECRET CODE FUNCTION
    const submitCode = async () => {
        if (!secret.trim()) {
            setMessage("❌ Please enter your 6-digit code");
            return;
        }

        try {
            const res = await axios.post(`${API_BASE_URL}/recognize_face`, {
                code: secret
            });

            setMessage(res.data.message);
            setSecret("");

        } catch (err) {
            setMessage(err.response?.data?.message || "❌ Error marking attendance");
        }
    };

    return (
        <div className="container mt-4">
            <PageHeader PageTitle="Face Attendance" />

            <div className="text-center mt-4">

                <h3 style={{ fontSize: "30px" }}>📸 Face Recognition</h3>

                {/* Webcam */}
                <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    style={{
                        width: "48%",
                        borderRadius: "10px",
                        marginBottom: "10px",
                        border: "2px solid #ccc"
                    }}
                />

                {/* Message */}
                <div
                    className="alert alert-info mt-3"
                    style={{
                        width: "48%",
                        margin: "auto",
                        padding: "8px",
                        fontSize: "16px"
                    }}
                >
                    <b>{message}</b>
                </div>

                {/* Secret Code Box */}
                <div
                    className="card shadow p-3 mt-4"
                    style={{
                        width: "330px",
                        margin: "auto",
                        borderRadius: "12px"
                    }}
                >
                    <h5 className="mb-3">Use Secret Code</h5>

                    <input
                        type="text"
                        maxLength="6"
                        className="form-control text-center"
                        placeholder="Enter 6-digit code"
                        value={secret}
                        onChange={(e) => setSecret(e.target.value)}
                        style={{ height: "42px", fontSize: "16px" }}
                    />

                    <button
                        className="btn btn-primary mt-3 w-100"
                        onClick={submitCode}
                        style={{ height: "42px", fontSize: "16px" }}
                    >
                        Submit Code
                    </button>
                </div>

            </div>
        </div>
    );
}

export default FaceDetection;
