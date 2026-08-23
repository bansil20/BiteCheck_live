import { fetchWithCache } from "../utlis/cacheHelper";
import { API_BASE_URL } from "../utlis/api";
import {Container, Table} from "react-bootstrap";
import "./Dashboard.css";
import React, {useEffect, useState} from "react";
import axios from "axios";
import PageHeader from "../components/PageHeader/PageHeader";


function TimeTable() {
    const [timetable, setTimetable] = useState([]);
    const [grouped, setGrouped] = useState({});

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = () => {
        fetchWithCache(`${API_BASE_URL}/get_timetable`, "timetable_list", (data) => {
            if (Array.isArray(data)) {
                setTimetable(data);
                const groupedData = {};
                data.forEach(item => {
                    if (!groupedData[item.day]) groupedData[item.day] = {};
                    groupedData[item.day][item.mealtype] = item.food;
                });
                setGrouped(groupedData);
            }
        }).catch((err) => {
            console.error("Error fetching timetable:", err);
        });
    };
    };
    return (
        <div className="container mt-4">
            <PageHeader PageTitle="TimeTable"/>
            <div className="main-content flex-grow-1">

                <br/>
                <br/>
                <Container className="p-4">
                    <div className="card shadow-lg border-0 rounded-4 bg-light">
                        <div
                            className="card-header text-white text-center rounded-top"
                            style={{
                                background: "linear-gradient(90deg, #43a047, #00bfa5, #8bc34a)",
                            }}
                        >
                            <h5 className="mb-0 fw-semibold">Healthy Meal Schedule Overview</h5>
                        </div>

                        <div className="card-body p-0">
                            <Table
                                bordered
                                hover
                                responsive
                                className="align-middle mb-0 text-center"
                                style={{fontSize: "1.05rem"}}
                            >
                                <thead
                                    style={{
                                        background: "linear-gradient(90deg, #ffb300, #ffca28)",
                                        color: "#004d40",
                                        fontWeight: "bold",
                                    }}
                                >
                                <tr style={{height: "65px"}}>
                                    <th>📅 Day</th>
                                    <th>🥣 Breakfast</th>
                                    <th>🍛 Lunch</th>
                                    <th>🍲 Dinner</th>
                                </tr>
                                </thead>

                                <tbody>
                                {Object.keys(grouped).map((day, idx) => (
                                    <tr key={idx} style={{height: "70px"}}>
                                        <td className="fw-bold text-success bg-white">{day}</td>
                                        <td
                                            className="fw-semibold"
                                            style={{
                                                backgroundColor: "#e8f5e9", // light green
                                                color: "#2e7d32",
                                            }}
                                        >
                                            {grouped[day].Breakfast || "-"}
                                        </td>
                                        <td
                                            className="fw-semibold"
                                            style={{
                                                backgroundColor: "#fffde7", // soft lemon
                                                color: "#f9a825",
                                            }}
                                        >
                                            {grouped[day].Lunch || "-"}
                                        </td>
                                        <td
                                            className="fw-semibold"
                                            style={{
                                                backgroundColor: "#e0f7fa", // aqua blue
                                                color: "#00796b",
                                            }}
                                        >
                                            {grouped[day].Dinner || "-"}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        </div>

                    </div>
                </Container>
            </div>
        </div>
    );


}

export default TimeTable;
