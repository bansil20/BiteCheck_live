import { API_BASE_URL } from "../utlis/api";
import React, {useEffect, useState} from "react";
import {Row, Col, Card} from "react-bootstrap";
import {FaCalendarCheck, FaUserFriends, FaBan} from "react-icons/fa";
import "./Dashboard.css";

import PageHeader from "../components/PageHeader/PageHeader";


import {Line} from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale);


function Dashboard() {
    const [foodData, setFoodData] = React.useState({});
    const [totalStudents, setTotalStudents] = React.useState(null);
    const [mealStats, setMealStats] = React.useState(null);
    const [todayMealCounts, setTodayMealCounts] = React.useState({
        Breakfast: {present: 0, total: 0},
        Lunch: {present: 0, total: 0},
        Dinner: {present: 0, total: 0}
    });
    const [selectedMeal, setSelectedMeal] = React.useState("Dinner");
    const [mealGraphData, setMealGraphData] = React.useState([]);
    const [bestFood, setBestFood] = useState(null);


    const loadMealStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/meal_attendance_stats`);
            if (res.ok) {
                const data = await res.json();
                setMealStats(data);
                if (data.total !== undefined && data.total > 0) {
                    setTotalStudents(data.total);
                }
            }
        } catch (err) {
            console.error("Error loading meal stats:", err);
        }
    };

    const loadFoodDetails = async () => {
        try {
            const foodRes = await fetch(`${API_BASE_URL}/get_current_food`);
            if (foodRes.ok) {
                const currentFood = await foodRes.json();
                if (currentFood && currentFood.foodid) {
                    let sugText = "Serving standard meal menu.";
                    try {
                        const sugRes = await fetch(`${API_BASE_URL}/get_food_suggestion/${currentFood.foodid}`);
                        if (sugRes.ok) {
                            const suggestion = await sugRes.json();
                            sugText = suggestion.suggestion_paragraph || sugText;
                        }
                    } catch (e) {
                        console.warn("Could not fetch suggestion:", e);
                    }

                    setFoodData({
                        foodname: currentFood.foodname || "Scheduled Meal",
                        foodimage: currentFood.foodimage,
                        suggestion_paragraph: sugText,
                        currentFood: currentFood.status === "current" ? "Current Meal" : "Upcoming Meal"
                    });
                }
            }
        } catch (err) {
            console.error("Error loading food details:", err);
        }
    };

    const loadTotalStudents = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/total_students`);
            if (res.ok) {
                const data = await res.json();
                setTotalStudents(data.total_students);
            }
        } catch (err) {
            console.error("Error loading total students:", err);
        }
    };

    const loadTodayMealCounts = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/meal_today_counts`);
            if (res.ok) {
                const data = await res.json();
                setTodayMealCounts(data);
            }
        } catch (err) {
            console.error("Error loading today meal counts:", err);
        }
    };

    const loadBestFood = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/best_food_last7`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.name) {
                    setBestFood({
                        name: data.name,
                        image: data.image,
                        avg_rating: data.avg_rating,
                        reviews: data.reviews
                    });
                } else {
                    setBestFood(null);
                }
            }
        } catch (err) {
            console.error("Error loading best food:", err);
        }
    };

    const loadMealGraph = async (meal) => {
        try {
            const res = await fetch(`${API_BASE_URL}/last7_meal_attendance/${meal}`);
            if (res.ok) {
                const data = await res.json();
                setMealGraphData(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Error loading meal graph:", err);
        }
    };


    useEffect(() => {
        loadFoodDetails();
        loadTotalStudents();
        loadMealStats();
        loadTodayMealCounts();
        loadBestFood();
    }, []);


    useEffect(() => {
        loadMealGraph(selectedMeal);
    }, [selectedMeal]);

    return (
        <div className="container mt-4">

            {/* PAGE HEADER */}
            <PageHeader PageTitle="Welcome Admin"/>

            {/* SECTION TITLE */}
            <h4 className="fw-semibold mt-3 mb-3">Overview</h4>

            {/* TOP KPI CARDS */}
            <Row className="g-4">

                {/* Total Students */}
                <Col md={4}>
                    <Card className="shadow-sm rounded-4 border-0 p-3">
                        <div className="d-flex justify-content-between">
                            <div>
                                <p className="text-muted mb-1 small">Total Students</p>
                                <h2 className="fw-bold mb-1">
                                    {totalStudents ?? "–"}
                                </h2>
                                <small className="text-secondary">All registered students</small>
                            </div>
                            <div className="d-flex align-items-center fs-1 text-primary opacity-75">
                                <FaUserFriends/>
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* Present Today Current Meal */}
                <Col md={4}>
                    <Card className="shadow-sm rounded-4 border-0 p-3">
                        <div className="d-flex justify-content-between">
                            <div>
                                <p className="text-muted mb-1 small">
                                    {mealStats ? `${mealStats.meal} Present` : "Loading..."}
                                </p>
                                <h2 className="fw-bold mb-1">
                                    {mealStats?.present ?? "–"}
                                </h2>
                                <small className="text-secondary">Students marked present</small>
                            </div>
                            <div className="d-flex align-items-center fs-1 text-success opacity-75">
                                <FaCalendarCheck/>
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* Absent Today */}
                <Col md={4}>
                    <Card className="shadow-sm rounded-4 border-0 p-3">
                        <div className="d-flex justify-content-between">
                            <div>
                                <p className="text-muted mb-1 small">
                                    {mealStats ? `${mealStats.meal} Absent` : "Loading..."}
                                </p>
                                <h2 className="fw-bold mb-1">
                                    {mealStats?.absent ?? "–"}
                                </h2>
                                <small className="text-secondary">Students absent this meal</small>
                            </div>
                            <div className="d-flex align-items-center fs-1 text-danger opacity-75">
                                <FaBan/>
                            </div>
                        </div>
                    </Card>
                </Col>

            </Row>

            {/* MEAL + SUGGESTION SECTION */}
            <h4 className="fw-semibold mt-5 mb-3">Today's Meal</h4>

            <Row className="g-4">

                {/* Current Meal & Suggestion Card */}
                <Col md={4}>
                    <Card className="shadow-lg rounded-4 border-0">
                        <Card.Body className="p-4">
                        <span className="text-uppercase text-muted small fw-bold">
                            {foodData.currentFood}
                        </span>

                            <h3 className="fw-bold mt-1">{foodData.foodname || "Loading..."}</h3>

                            <div
                                className="p-3 mt-3 rounded-3"
                                style={{
                                    background: "#f8f9fa",
                                    borderLeft: "4px solid #ff7e5f",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                                }}
                            >
                                <h6 className="fw-semibold mb-1">Suggestion</h6>
                                <p className="text-secondary small mb-0">
                                    {foodData.suggestion_paragraph || "Fetching..."}
                                </p>
                            </div>

                            <div className="mt-3 d-flex justify-content-center">
                                <img
                                    src={foodData.foodimage}
                                    alt={foodData.foodname}
                                    className="rounded-4 shadow"
                                    style={{
                                        width: "100px",
                                        height: "100px",
                                        objectFit: "cover"
                                    }}
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* GRAPH CARD */}
                <Col md={8}>
                    <Card className="shadow-sm rounded-4 border-0">
                        <Card.Body className="p-3">

                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="mb-0 fw-semibold">
                                    Last 7 Days {selectedMeal} Attendance
                                </h6>

                                <select
                                    className="form-select w-auto"
                                    value={selectedMeal}
                                    onChange={(e) => setSelectedMeal(e.target.value)}
                                >
                                    <option value="Breakfast">Breakfast</option>
                                    <option value="Lunch">Lunch</option>
                                    <option value="Dinner">Dinner</option>
                                </select>
                            </div>

                            {/* GRAPH HEIGHT FIXED TO CARD */}
                            <div
                                style={{
                                    width: "100%",
                                    height: "280px",
                                    padding: "5px 0",
                                    position: "relative"
                                }}
                                className="graph-wrapper"
                            >
                                {mealGraphData.length > 0 ? (
                                    <Line
                                        data={{
                                            labels: mealGraphData.map(item =>
                                                new Date(item.date).toLocaleDateString("en-IN", {
                                                    day: "2-digit",
                                                    month: "short"
                                                })
                                            ),
                                            datasets: [
                                                {
                                                    label: `${selectedMeal} Attendance`,
                                                    data: mealGraphData.map(item => item.present),

                                                    // Gorgeous gradient stroke
                                                    borderColor: "rgba(56, 132, 255, 1)",
                                                    borderWidth: 3,
                                                    tension: 0.45,

                                                    // Gradient fill (blue → transparent)
                                                    backgroundColor: function (context) {
                                                        const chart = context.chart;
                                                        const {ctx, chartArea} = chart;
                                                        if (!chartArea) return null;

                                                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                                                        gradient.addColorStop(0, "rgba(56, 132, 255, 0.35)");
                                                        gradient.addColorStop(1, "rgba(56, 132, 255, 0)");
                                                        return gradient;
                                                    },

                                                    fill: true,

                                                    // Clean circular points
                                                    pointRadius: 4,
                                                    pointBackgroundColor: "#ffffff",
                                                    pointBorderColor: "#3884ff",
                                                    pointBorderWidth: 2,
                                                    pointHoverRadius: 7,
                                                },
                                            ]
                                        }}

                                        options={{
                                            maintainAspectRatio: false,
                                            responsive: true,

                                            plugins: {
                                                legend: {display: false},
                                                tooltip: {
                                                    backgroundColor: "rgba(0, 0, 0, 0.85)",
                                                    titleColor: "#fff",
                                                    bodyColor: "#fff",
                                                    borderWidth: 0,
                                                    padding: 10,
                                                    cornerRadius: 8,
                                                    displayColors: false
                                                }
                                            },

                                            scales: {
                                                x: {
                                                    grid: {display: false},
                                                    ticks: {
                                                        color: "#6c757d",
                                                        font: {size: 12, weight: "500"},
                                                    }
                                                },
                                                y: {
                                                    beginAtZero: true,
                                                    grid: {
                                                        color: "rgba(0,0,0,0.05)",
                                                        drawBorder: false
                                                    },
                                                    ticks: {
                                                        color: "#6c757d",
                                                        font: {size: 12, weight: "500"},
                                                        stepSize: 1
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                ) : (
                                    <p className="text-center mt-4 text-muted">Loading graph…</p>
                                )}
                            </div>

                        </Card.Body>
                    </Card>
                </Col>

            </Row>

            {/* BOTTOM GRID: BREAKFAST / LUNCH / DINNER / BEST */}
            <Row className="g-4 mt-4">

                {/* Breakfast */}
                <Col md={3}>
                    <Card className="shadow-sm rounded-4 border-0 p-3 text-center">
                        <h6 className="fw-semibold">Breakfast</h6>
                        <h2 className="fw-bold">
                            {todayMealCounts.Breakfast.present}
                            <span className="text-muted small"> / {totalStudents}</span>
                        </h2>
                    </Card>
                </Col>

                {/* Lunch */}
                <Col md={3}>
                    <Card className="shadow-sm rounded-4 border-0 p-3 text-center">
                        <h6 className="fw-semibold">Lunch</h6>
                        <h2 className="fw-bold">
                            {todayMealCounts.Lunch.present}
                            <span className="text-muted small"> / {totalStudents}</span>
                        </h2>
                    </Card>
                </Col>

                {/* Dinner */}
                <Col md={3}>
                    <Card className="shadow-sm rounded-4 border-0 p-3 text-center">
                        <h6 className="fw-semibold">Dinner</h6>
                        <h2 className="fw-bold">
                            {todayMealCounts.Dinner.present}
                            <span className="text-muted small"> / {totalStudents}</span>
                        </h2>
                    </Card>
                </Col>

                {/* Best Food Card */}
                <Col md={3}>
                    <Card className="shadow-sm rounded-4 border-0 p-3">
                        <h6 className="fw-semibold mb-3">⭐ Best Food (Last 7 Days)</h6>

                        {bestFood && bestFood.name ? (
                            <div className="d-flex align-items-center">
                                <img
                                    src={bestFood.image}
                                    alt={bestFood.name}
                                    className="rounded-4 shadow"
                                    style={{
                                        width: "60px",
                                        height: "60px",
                                        objectFit: "cover",
                                        marginRight: "12px"
                                    }}
                                />

                                <div>
                                    <h6 className="fw-bold mb-1">{bestFood.name}</h6>
                                    <small className="text-muted">
                                        ⭐ {bestFood.avg_rating} ({bestFood.reviews} reviews)
                                    </small>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted">No data available</p>
                        )}
                    </Card>
                </Col>

            </Row>

        </div>
    );

}

export default Dashboard;
