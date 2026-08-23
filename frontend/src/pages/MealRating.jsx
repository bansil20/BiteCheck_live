import { API_BASE_URL } from "../utlis/api";
import { useEffect, useState } from "react";
import {Card, Col, Form, Row} from "react-bootstrap";
import { FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PageHeader from "../components/PageHeader/PageHeader";

function MealRating() {
  const [searchTerm, setSearchTerm] = useState("");
  const [foodItem, setFoodItem] = useState([]);
  const [ratings, setRatings] = useState({}); // store avg rating per foodid
    const [mealType, setMealType] = useState(""); // "", "Breakfast", "Lunch", "Dinner"


  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/get_foods`)
      .then((res) => {
        setFoodItem(res.data);
        // For each food, fetch its feedback to calculate avg
        res.data.forEach((food) => fetchAverageRating(food.foodid));
      })
      .catch((err) => {
        console.error("Error fetching foods:", err);
      });
  }, []);

  // ✅ Fetch average rating for each food
  const fetchAverageRating = async (foodid) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get_feedback/${foodid}`);
      const feedbacks = res.data;

      if (feedbacks.length === 0) {
        setRatings((prev) => ({ ...prev, [foodid]: 0 }));
        return;
      }

      // calculate overall average (consider avg_rating if grouped by date, else rating)
      const avg =
        feedbacks.reduce(
          (sum, f) => sum + (f.avg_rating ? Number(f.avg_rating) : Number(f.rating)),
          0
        ) / feedbacks.length;

      setRatings((prev) => ({ ...prev, [foodid]: avg }));
    } catch (err) {
      console.error(`Error fetching feedback for food ${foodid}:`, err);
    }
  };

  // ✅ Filter search
  const filteredFoods = foodItem.filter((food) => {
  const matchesSearch = food.foodname.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesMeal = mealType === "" || food.mealtype?.toLowerCase() === mealType.toLowerCase();
  return matchesSearch && matchesMeal;
});


  // ✅ Render stars for average rating
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

  return (
    <div className="container mt-4">
    <PageHeader PageTitle="Meal Rating"  />
          <div className="container mt-4">
            {/* Search */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                {/* Search box */}
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search food..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{maxWidth: "250px"}}
                />

                {/* Meal type dropdown */}
                <Form.Select
                    style={{maxWidth: "180px"}}
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                >
                    <option value="">All Meals</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                </Form.Select>
            </div>


            {/* Food Cards */}
            <Row>
              {filteredFoods.map((food, idx) => (
                <Col key={idx} md={4} sm={6} className="mb-4">
                  <Card
                    className="shadow-sm h-100"
                    style={{ cursor: "pointer", transition: "0.3s" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.02)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                    onClick={() =>
                      navigate(`/meal_average/${food.foodid}`, { state: { food } })
                    }
                  >
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        {/* Image */}
                        <img
                          src={food.foodimage}
                          alt={food.foodname}
                          style={{
                            height: "120px",
                            width: "120px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            marginRight: "15px",
                          }}
                        />

                        {/* Details */}
                        <div>
                          <Card.Title className="fw-bold">
                            {food.foodname}
                          </Card.Title>
                          <p className="mb-1">{food.fooddescription}</p>

                          {/* ✅ Show overall average */}
                          {ratings[food.foodid] > 0 ? (
                            <div className="d-flex align-items-center">
                              {renderStars(ratings[food.foodid])}
                              <span className="ms-2 fw-semibold">
                                {ratings[food.foodid].toFixed(1)} / 5
                              </span>
                            </div>
                          ) : (
                            <p className="text-muted mb-0">No ratings yet</p>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
    </div>
  );
}

export default MealRating;
