import { API_BASE_URL } from "../utlis/api";
import React, { useEffect, useState, useRef } from "react";
import { Table, Spinner } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import axios from "axios";
import PageHeader from "../components/PageHeader/PageHeader";

function StudentProfile() {
    const location = useLocation();
    const student = location.state?.student || {};

    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(8);
    const observerRef = useRef(null);

    useEffect(() => {
        if (!student.id && !student.studid) {
            setLoading(false);
            return;
        }
        const sid = student.id || student.studid;
        axios.get(`${API_BASE_URL}/get_attendance/${sid}`)
            .then((res) => {
                setAttendance(Array.isArray(res.data) ? res.data : []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching attendance:", err);
                setLoading(false);
            });
    }, [student.id, student.studid]);

    // Infinite Scroll using IntersectionObserver (Triggers when bottom of table is reached)
    useEffect(() => {
        if (loading || visibleCount >= attendance.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) => Math.min(prev + 8, attendance.length));
                }
            },
            { threshold: 0.1, rootMargin: "100px" }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => {
            if (observerRef.current) {
                observer.unobserve(observerRef.current);
            }
        };
    }, [loading, visibleCount, attendance.length]);

    const handleLoadMore = () => {
        setVisibleCount((prev) => Math.min(prev + 8, attendance.length));
    };

    const handleDownloadPDF = async () => {
        const sid = student.id || student.studid;
        try {
            const response = await axios.get(
                `${API_BASE_URL}/download_attendance_pdf/${sid}`,
                { responseType: "blob" }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `${student.name || "student"}_attendance.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error downloading PDF:", error);
            alert("❌ Failed to download attendance PDF");
        }
    };

    return (
        <div className="container mt-4">
            <PageHeader PageTitle="Student Profile" />
            <div className="container mt-4">

                {/* Row 1 - Image + Name + PDF Download */}
                <div className="card shadow-sm border-0 p-3 mb-4 rounded-4 bg-white">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div className="d-flex align-items-center">
                            <img
                                src={student.face?.base64 || student.studface?.base64 || "https://placehold.co/100x120?text=No+Photo"}
                                alt="Student"
                                style={{
                                    height: "110px",
                                    width: "95px",
                                    objectFit: "cover",
                                    borderRadius: "12px",
                                    marginRight: "18px",
                                    border: "2px solid #e0e0e0"
                                }}
                            />
                            <div>
                                <h3 className="fw-bold mb-1 text-dark">{student.name || student.studname}</h3>
                                <span className="badge bg-primary px-3 py-1 fs-6">{student.course || student.studcourse}</span>
                            </div>
                        </div>

                        <button
                            className="btn btn-outline-primary fw-semibold px-3 py-2 rounded-3"
                            onClick={handleDownloadPDF}
                        >
                            📥 Download Attendance PDF
                        </button>
                    </div>
                </div>

                {/* Row 2 - Remarks & Attendance Records + Details */}
                <div className="row">
                    {/* Left Side */}
                    <div className="col-md-8 mb-3">
                        {/* Remarks Card */}
                        <div className="card shadow-sm border-0 mb-4 rounded-4">
                            <div className="card-header bg-light fw-bold">Remarks</div>
                            <div className="card-body">
                                <p className="mb-0 text-secondary">{student.remark || student.studremark || "No remarks entered."}</p>
                            </div>
                        </div>

                        {/* Attendance Table Card with Infinite Scroll (8 at a time) */}
                        <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                            <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                <span className="fw-bold">Attendance Records</span>
                                {attendance.length > 0 && (
                                    <span className="badge bg-secondary-subtle text-dark fw-semibold">
                                        Showing {Math.min(visibleCount, attendance.length)} of {attendance.length}
                                    </span>
                                )}
                            </div>
                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="text-center p-4">
                                        <Spinner animation="border" variant="primary" />
                                    </div>
                                ) : attendance.length > 0 ? (
                                    <>
                                        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                                            <Table hover responsive className="align-middle mb-0 text-center">
                                                <thead className="table-light sticky-top" style={{ zIndex: 1 }}>
                                                    <tr>
                                                        <th className="py-3">Date & Time</th>
                                                        <th className="py-3">Day & Meal</th>
                                                        <th className="py-3">Food</th>
                                                        <th className="py-3">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {attendance.slice(0, visibleCount).map((att, idx) => (
                                                        <tr key={idx}>
                                                            <td className="fw-semibold text-secondary">{att.timestamp}</td>
                                                            <td>{`${att.day} - ${att.meal}`}</td>
                                                            <td className="fw-medium">{att.food}</td>
                                                            <td>
                                                                <span className="badge bg-success-subtle text-success px-3 py-1 rounded-pill">
                                                                    {att.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>

                                            {/* Intersection Observer Trigger */}
                                            <div ref={observerRef} style={{ height: "20px" }} />
                                        </div>

                                        {/* Clickable or Auto-load footer button */}
                                        {visibleCount < attendance.length && (
                                            <div className="text-center py-2 bg-light border-top">
                                                <button
                                                    className="btn btn-sm btn-link text-decoration-none fw-semibold text-primary"
                                                    onClick={handleLoadMore}
                                                >
                                                    ⬇️ Load More Records ({attendance.length - visibleCount} remaining)
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-center text-muted p-4 mb-0">No attendance records found.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Student Details */}
                    <div className="col-md-4 mb-3">
                        <div className="card shadow-sm border-0 rounded-4">
                            <div className="card-header bg-light fw-bold">Student Details</div>
                            <div className="card-body">
                                <p className="mb-2"><strong>Student ID (PNR):</strong> {student.pnr || student.studpnr}</p>
                                <p className="mb-2"><strong>Phone:</strong> +91 {student.phone || student.studphone}</p>
                                <p className="mb-2"><strong>Course:</strong> {student.course || student.studcourse}</p>
                                <p className="mb-2"><strong>Email:</strong> {student.email || student.studemail}</p>
                                <p className="mb-2"><strong>Hostel Room:</strong> {student.hostelroom || student.studhostelroom}</p>
                                <p className="mb-2"><strong>Blood Group:</strong> {student.bloodgrp || student.studbloodgrp}</p>
                                <p className="mb-0"><strong>Student Secret Code:</strong> <span className="badge bg-dark fs-6">{student.studsecretcode || student.secret_code}</span></p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default StudentProfile;
