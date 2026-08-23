import { API_BASE_URL } from "../utlis/api";
import {useLocation} from "react-router-dom";
import React, {useEffect, useState} from "react";
import axios from "axios";
import {Table, Spinner} from "react-bootstrap";
import PageHeader from "../components/PageHeader/PageHeader";


function StudentProfile() {

    const {student} = useLocation().state; // student object passed
    console.log("sadkasdn", student);

    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/get_attendance/${student.id}`)
            .then((res) => {
                setAttendance(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching attendance:", err);
                setLoading(false);
            });
    }, [student.id]);

    const handleDownloadPDF = async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/download_attendance_pdf/${student.id}`,
                {responseType: "blob"} // important for binary files
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `${student.name}_attendance.pdf`);
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
            <PageHeader PageTitle="Student Profile"/>
            <div className="container mt-4">

                {/* Row 1 - Image + Name */}
                <div className="row align-items-center mb-4">
                    <div className="col-auto" style={{border: 1}}>
                        <img
                            src={student.face?.base64}
                            alt="Student"
                            style={{
                                height: "120px",
                                width: "100px",
                                objectFit: "cover",
                                borderRadius: "8px",
                                marginRight: "15px"
                            }}
                        />

                    </div>
                    <div className="col">
                        <h3 className="fw-bold mb-0">{student.name}</h3>
                    </div>
                    {/*download attendence of particular student*/}
                    <div className="card-header d-flex justify-content-between align-items-center fw-bold">
                        <span>Attendance Records</span>
                        <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleDownloadPDF()}
                        >
                            📄 Download PDF
                        </button>
                    </div>

                </div>

                {/* Row 2 - Remarks + Details */}
                <div className="row">
                    {/* Left Side */}
                    <div className="col-md-8 mb-3">
                        <div className="card">
                            <div className="card-header fw-bold">Remarks</div>
                            <div className="card-body">
                                <p>
                                    {student.remark}
                                </p>
                            </div>
                        </div>
                        {/*attendance table*/}
                        <div className="card mt-4">
                            <div className="card-header fw-bold">Attendance Records</div>
                            <div className="card-body">
                                {loading ? (
                                    <Spinner animation="border"/>
                                ) : attendance.length > 0 ? (
                                    <Table striped bordered hover responsive>
                                        <thead>
                                        <tr>
                                            <th>Date & Time</th>
                                            <th>Day & Meal</th>
                                            <th>Food</th>
                                            <th>Status</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {attendance.map((att, idx) => (
                                            <tr key={idx}>
                                                <td>{att.timestamp}</td>
                                                <td>{`${att.day} - ${att.meal}`}</td>
                                                <td>{att.food}</td>
                                                <td>{att.status}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <p>No attendance records found.</p>
                                )}
                            </div>
                        </div>

                        {/*<div className="card mt-4">*/}
                        {/*    <div className="card-header fw-bold">Attendance Records</div>*/}
                        {/*    <div className="card-body">*/}
                        {/*        {loading ? (*/}
                        {/*            <Spinner animation="border"/>*/}
                        {/*        ) : attendance.length > 0 ? (*/}
                        {/*            <Table striped bordered hover responsive>*/}
                        {/*                <thead>*/}
                        {/*                <tr>*/}
                        {/*                    <th>Date & Time</th>*/}
                        {/*                    <th>Food</th>*/}
                        {/*                    <th>Status</th>*/}
                        {/*                </tr>*/}
                        {/*                </thead>*/}
                        {/*                <tbody>*/}
                        {/*                {attendance.map((att, idx) => (*/}
                        {/*                    <tr key={idx}>*/}
                        {/*                        <td>{att.timestamp}</td>*/}
                        {/*                        <td>{att.food}</td>*/}
                        {/*                        <td>{att.status}</td>*/}
                        {/*                    </tr>*/}
                        {/*                ))}*/}
                        {/*                </tbody>*/}
                        {/*            </Table>*/}
                        {/*        ) : (*/}
                        {/*            <p>No attendance records found.</p>*/}
                        {/*        )}*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                    </div>

                    {/* Right Side */}
                    <div className="col-md-4 mb-3">
                        <div className="card">
                            <div className="card-header fw-bold">Details</div>
                            <div className="card-body">
                                <p><strong>Student ID:</strong> {student.pnr}</p>
                                <p><strong>Phone:</strong> +91 {student.phone}</p>
                                <p><strong>Course:</strong> {student.course}</p>
                                <p><strong>Email:</strong> {student.email}</p>
                                <p><strong>Hostel Room:</strong> {student.hostelroom}</p>
                                <p><strong>Blood Group:</strong> {student.bloodgrp}</p>
                                <p><strong>Student Secret Code:</strong> {student.studsecretcode}</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        </div>

    );
}

export default StudentProfile;