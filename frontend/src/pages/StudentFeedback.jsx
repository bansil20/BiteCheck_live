import { API_BASE_URL } from "../utlis/api";
import React, { useState, useEffect } from "react";
import axios from "axios";
import PageHeader from "../components/PageHeader/PageHeader";

const EMOJI_TO_RATING = {
  "😡": 1,
  "😒": 2,
  "😑": 3,
  "😊": 4,
  "😍": 5,
};

function StudentFeedback() {
  const [food, setFood] = useState(null);
  const [emojiFeedback, setEmojiFeedback] = useState("");
  const [comment, setComment] = useState("");
  const [wouldEatAgain, setWouldEatAgain] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState("");

  // Fetch current or upcoming food
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/get_current_food`)
      .then((res) => {
        setFood(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching current food:", err);
        setLoading(false);
      });
  }, []);

  // Countdown for upcoming meal
  useEffect(() => {
    if (food && food.status === "upcoming" && food.mealStartTime) {
      const updateCountdown = () => {
        const now = new Date();
        const startTime = new Date(food.mealStartTime);
        const diff = startTime - now;

        if (diff <= 0) {
          setCountdown("Starting soon!");
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setCountdown(`${hours}h ${minutes}m remaining`);
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 60000);
      return () => clearInterval(interval);
    }
  }, [food]);

  const handleSubmit = async () => {
    if (!emojiFeedback || wouldEatAgain === null || !studentName) {
      alert("⚠️ Please fill all fields before submitting.");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/submit_feedback`, {
        foodid: food.foodid,
        studentname: studentName,
        emoji: emojiFeedback,
        comment,
        would_eat_again: wouldEatAgain,
      });

      alert("✅ Feedback submitted successfully!");
      setEmojiFeedback("");
      setComment("");
      setWouldEatAgain(null);
      setStudentName("");
    } catch (err) {
      console.error(err);
      alert("❌ Error submitting feedback. Check backend.");
    }
  };

  if (loading)
    return <div className="text-center mt-5">Loading current food...</div>;

  if (!food)
    return (
      <div className="text-center mt-5">
        No food information available right now.
      </div>
    );

  return (
    <div className="container mt-4">
      <PageHeader PageTitle="Meal Feedback" />

      <div className="container mt-4 text-center">
        {/* Food Image */}
        <div className="mb-3">
          <img
            src={`${food.foodimage}`}
            style={{ width: "200px", height: "200px", objectFit: "cover" }}
            alt={food.foodname}
            className="img-fluid rounded shadow"
          />
        </div>

        {/* Food Info */}
        <h3 className="fw-bold">{food.foodname}</h3>
        <p className="text-muted">{food.fooddescription}</p>

        {/* If upcoming → show message + countdown only */}
        {food.status === "upcoming" ? (
          <div className="mt-3">
            <h5 className="fw-bold text-info">
              🍽 Upcoming meal — {food.meal}
            </h5>
            <p className="text-secondary">{countdown}</p>
            <p className="text-muted">
              Please come back during the meal time to give feedback.
            </p>
          </div>
        ) : (
          <>
            {/* Emoji Feedback */}
            <div className="text-center mb-4">
              <h5 className="fw-bold">How did you like it?</h5>
              {Object.keys(EMOJI_TO_RATING).map((emoji) => (
                <span
                  key={emoji}
                  style={{
                    fontSize: "2rem",
                    margin: "0 10px",
                    cursor: "pointer",
                    opacity: emojiFeedback === emoji ? 1 : 0.5,
                  }}
                  onClick={() => setEmojiFeedback(emoji)}
                >
                  {emoji}
                </span>
              ))}
            </div>

            {/* Comment + Name */}
            <div className="mb-4 text-start">
              <label className="form-label fw-bold">Your Comment:</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Write your review here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <label className="form-label fw-bold mt-3">Student Name:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>

            {/* Would Eat Again */}
            <div className="mb-4 text-center">
              <h5 className="fw-bold">Would you eat again?</h5>
              <button
                className={`btn me-2 ${
                  wouldEatAgain === true
                    ? "btn-success"
                    : "btn-outline-success"
                }`}
                onClick={() => setWouldEatAgain(true)}
              >
                👍🏻 Yes
              </button>
              <button
                className={`btn ${
                  wouldEatAgain === false ? "btn-danger" : "btn-outline-danger"
                }`}
                onClick={() => setWouldEatAgain(false)}
              >
                👎🏻 No
              </button>
            </div>

            {/* Submit */}
            <div className="text-center">
              <button className="btn btn-primary" onClick={handleSubmit}>
                Submit Feedback
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StudentFeedback;
