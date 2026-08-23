import { invalidateCache } from "../utlis/cacheHelper";
import { API_BASE_URL } from "../utlis/api";
import React, {useState, useRef} from "react";
import {Button, Col, Form, Row} from "react-bootstrap";
import Webcam from "react-webcam";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import PageHeader from "../components/PageHeader/PageHeader";

function AddStudentProfile() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        studname: "",
        studpnr: "",
        studphone: "",
        studcourse: "",
        studemail: "",
        studremark: "",
        studhostelroom: "",
        studbloodgrp: "",
        studface: null, // temporary storage of captured face
    });

    const [showCamera, setShowCamera] = useState(false);
    const [message, setMessage] = useState("");


    const [capturing, setCapturing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [facesList, setFacesList] = useState([]);  // store 20 images


    const webcamRef = useRef(null);
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData({...formData, [name]: value});
    };


    const handleCaptureFace = async () => {
        if (!webcamRef.current) return;

        setCapturing(true);
        setProgress(0);
        const images = [];

        for (let i = 0; i < 20; i++) {
            const imgSrc = webcamRef.current.getScreenshot();
            if (imgSrc) {
                images.push(imgSrc);
            }

            setProgress(i + 1);
            await new Promise((r) => setTimeout(r, 200)); // wait 200ms between captures
        }

        setFacesList(images);

        // Save first image for preview + formData
        setFormData({...formData, studface: images[0]});

        setCapturing(false);
        setMessage("✅ 20 face images captured successfully!");
        setShowCamera(false);
    };


    const handleSubmit = async (e) => {
        e.preventDefault(); // prevent page reload
        console.log("foemsddfsdfsdf");

        try {
            const payload = {
                ...formData,
                studface_list: facesList.length > 0 ? facesList : null,
            };

            const res = await axios.post(`${API_BASE_URL}/add_student`, payload);
            console.log("rem", res.data);

            alert(res.data.message);
            invalidateCache();
            navigate("/dashboard");
        } catch (err) {
            console.error(err);
            alert("❌ Error saving student");
        }
    };


    return (
        <div className="container mt-4">
            <PageHeader PageTitle="Add Student"/>

            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="studname"
                                value={formData.studname}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Enrollment Number</Form.Label>
                            <Form.Control
                                type="number"
                                name="studpnr"
                                value={formData.studpnr}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Phone</Form.Label>
                            <Form.Control
                                type="number"
                                name="studphone"
                                value={formData.studphone}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                name="studemail"
                                value={formData.studemail}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>
                    </Col>

                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Course</Form.Label>
                            <Form.Select
                                name="studcourse"
                                value={formData.studcourse}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Course</option>
                                <option value="B.Tech">B.Tech</option>
                                <option value="MBA">MBA</option>
                                <option value="MCA">MCA</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Hostel Room No.</Form.Label>
                            <Form.Control
                                type="text"
                                name="studhostelroom"
                                value={formData.studhostelroom}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Blood Group: </Form.Label>
                            <Form.Control
                                type="text"
                                name="studbloodgrp"
                                value={formData.studblodgrp}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Remark</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="studremark"
                                value={formData.studremark}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        {/* Camera Button */}
                        <div className="mt-3">
                            {/* Open Camera Button */}
                            <Button variant="primary" onClick={() => setShowCamera(true)}>
                                Open Camera
                            </Button>
                        </div>

                        {/* Show Camera and Register Face Button */}
                        {showCamera && (<div className="mt-3 text-center">
                            <Webcam
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                width={640}
                                height={480}
                            />
                            <Button
                                variant="success"
                                className="mt-2"
                                disabled={capturing}
                                onClick={handleCaptureFace}
                            >
                                {capturing ? "Capturing..." : "Capture 20 Photos"}
                            </Button>

                            {capturing && (
                                <p className="mt-2 fw-bold">
                                    Capturing... {progress}/20
                                </p>
                            )}


                        </div>)}

                        {message && <p className="mt-2 text-center">{message}</p>}
                    </Col>
                </Row>

                {/* Save Student Button */}
                <div className="text-center mt-4">
                    <Button variant="success" type="submit">
                        Save Student
                    </Button>
                </div>
                <Button
                    variant="secondary"
                    className="ms-2"
                    onClick={() => navigate("/dashboard")}
                >
                    Cancel
                </Button>


            </Form>
        </div>);
}

export default AddStudentProfile;
