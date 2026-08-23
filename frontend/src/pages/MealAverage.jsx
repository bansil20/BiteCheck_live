import { API_BASE_URL } from "../utlis/api";
import React, { useState, useEffect } from "react";
import { Card, Col, Container, Row } from "react-bootstrap";
import { FaStar } from "react-icons/fa";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import PageHeader from "../components/PageHeader/PageHeader";

function MealAverage() {
  const { id } = useParams(); // food id
  const { state } = useLocation();
  const mealFromState = state?.food || null;
  const navigate = useNavigate();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/get_feedback/${id}`)
      .then((res) => {
        setFeedbacks(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const mealName = mealFromState?.foodname || `Meal #${id}`;
  const mealHeroImage =
    `${mealFromState?.foodimage}` ||
    "https://via.placeholder.com/600x240";

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar
          key={i}
          color={i <= Math.round(rating) ? "#FFD700" : "#ddd"}
          className="me-1"
        />
      );
    }
    return stars;
  };

  // ✅ Calculate overall average rating
  const overallAvg =
    feedbacks && feedbacks.length > 0
      ? feedbacks.reduce((sum, e) => sum + (e.avg_rating || 0), 0) /
        feedbacks.length
      : 0;

  return (
 <div className="container mt-4">
    <PageHeader PageTitle=""  />
      {/* ✅ Hero Section with Overall Average */}
      <div
        style={{
          backgroundImage: `url(${mealHeroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "60px 20px",
          color: "white",
          position: "relative",
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.5)",
            borderRadius: "12px",
            padding: "30px",
            maxWidth: "700px",
            margin: "auto",
            textAlign: "center",
          }}
        >
          <h2 className="fw-bold mb-2">{mealName}</h2>

          {/* ✅ Overall Average Rating */}
          <div className="d-flex justify-content-center align-items-center mt-2">
            {renderStars(overallAvg)}
            <span className="ms-2 fw-semibold">
              {overallAvg > 0
                ? `${overallAvg.toFixed(1)}/5 Overall`
                : "No ratings yet"}
            </span>
          </div>
        </div>
      </div>

      {/* ✅ Main Content */}
      <Container className="my-5">
        <h4 className="mb-4 fw-semibold">
          📅 Past Meal Feedback (Grouped by Date)
        </h4>
        <Row>
          {loading ? (
            <Col>
              <p>Loading...</p>
            </Col>
          ) : feedbacks.length === 0 ? (
            <Col>
              <Card className="shadow-sm border-0 text-center p-4">
                <Card.Body>No feedback available for this meal.</Card.Body>
              </Card>
            </Col>
          ) : (
            feedbacks.map((entry, idx) => (
              <Col md={6} lg={4} key={idx} className="mb-4">
                <Card
                  className="shadow border-0 h-100"
                  style={{
                    cursor: "pointer",
                    transition: "0.3s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.03)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                  onClick={() =>
                    navigate(`/meal_feedback_details/${id}/${entry.date}`, {
                      state: { food: mealFromState },
                    })
                  }
                >
                  <Card.Img
                    variant="top"
                    src={mealHeroImage}
                    style={{ height: "180px", objectFit: "cover" }}
                  />
                  <Card.Body>
                    <Card.Title className="fw-bold">{entry.date}</Card.Title>
                    <div className="d-flex align-items-center mt-2">
                      {renderStars(entry.avg_rating)}
                      <span className="ms-2 fw-semibold">
                        {entry.avg_rating}/5 (Avg from {entry.count} feedbacks)
                      </span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>
      </Container>
    </div>
  );
}

export default MealAverage;
