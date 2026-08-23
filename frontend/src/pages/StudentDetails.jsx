import { API_BASE_URL } from "../utlis/api";
import React, {useEffect, useState} from "react";
import {
    Row,
    Col,
    Card,
    Form
} from "react-bootstrap";
import {FaPlus} from "react-icons/fa";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import PATHS from "../utlis/constants/Path";
import PageHeader from "../components/PageHeader/PageHeader";

function StudentDetails() {
    const navigate = useNavigate();

    const [student, setStudent] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchStudents = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/get_student`);
            setStudent(res.data);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                console.log(err.response.data.message);
                setStudent([]); // Clear list if none
            } else {
                console.error("Error fetching students:", err);
            }
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    // ✅ Live search logic (matches name, course, or phone)
    const filteredStudents = student.filter((stud) => {
        const term = searchTerm.toLowerCase();
        return (
            stud.name?.toLowerCase().includes(term) ||
            stud.course?.toLowerCase().includes(term) ||
            stud.phone?.toString().includes(term)
        );
    });

    return (
        <div className="container mt-4">
            <PageHeader PageTitle="Students Details" />
            <br/>

            {/* 🔍 Top bar with search and total count */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <Form.Control
                    type="text"
                    placeholder="Search by name, course or phone"
                    style={{maxWidth: "300px"}}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <h5>Total Students: {filteredStudents.length}</h5>
            </div>

            {filteredStudents.length === 0 ? (
                <h5 className="text-center text-muted mt-4">❌ No students found</h5>
            ) : (
                <Row>
                    {filteredStudents.map((stud, idx) => (
                        <Col key={idx} md={4} sm={6} className="mb-4">
                            <Card
                                className="shadow-sm h-100"
                                onClick={() => navigate(PATHS.STUDENTPROFILE, {state: {student: stud}})}
                                style={{cursor: "pointer"}}
                            >
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        {/* Image on left */}
                                        <img
                                            src={stud.face?.base64}
                                            alt={stud.name}
                                            style={{
                                                height: "120px",
                                                width: "100px",
                                                objectFit: "cover",
                                                borderRadius: "8px",
                                                marginRight: "15px"
                                            }}
                                        />

                                        {/* Details on right */}
                                        <div>
                                            <Card.Title>{stud.name}</Card.Title>
                                            <p className="mb-1">
                                                <strong>Course:</strong> {stud.course}
                                            </p>
                                            <p className="mb-1">
                                                <strong>Hostel Room:</strong> {stud.hostelroom}
                                            </p>
                                            <p className="mb-2">
                                                <strong>Phone:</strong> {stud.phone}
                                            </p>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* ➕ Floating Add Button */}
            <button
                className="btn btn-primary rounded-circle shadow-lg"
                style={{
                    position: "fixed",
                    bottom: "20px",
                    right: "20px",
                    width: "60px",
                    height: "60px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000
                }}
                onClick={() => navigate(`/add_student_profile`)}
            >
                <FaPlus size={20}/>
            </button>
        </div>
    );
}

export default StudentDetails;
