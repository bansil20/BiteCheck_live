import { API_BASE_URL } from "../utlis/api";
import { useEffect, useState } from "react";
import { Card, Col, Form, Row } from "react-bootstrap";
import { FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader/PageHeader";
import { fetchWithCache } from "../utlis/cacheHelper";

function MealRating() {
  const [searchTerm, setSearchTerm] = useState("");
  const [foodItem, setFoodItem] = useState([]);
  const [mealType, setMealType] = useState(""); // "", "Breakfast", "Lunch", "Dinner"

  const navigate = useNavigate();

  useEffect(() => {
    fetchWithCache(`${API_BASE_URL}/get_foods`, "foods_rating_list", (data) => {
      if (Array.isArray(data)) {
        setFoodItem(data);
      }
    });
  }, []);

  // Filter search
  const filteredFoods = foodItem.filter((food) => {
    const matchesSearch = food.foodname?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMeal = mealType === "" || food.mealtype?.toLowerCase() === mealType.toLowerCase();
    return matchesSearch && matchesMeal;
  });

  // Render stars for average rating
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
      <PageHeader PageTitle="Meal Rating" />
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
            style={{ maxWidth: "250px" }}
          />

          {/* Meal type dropdown */}
          <Form.Select
            style={{ maxWidth: "180px" }}
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

                      {/* Show overall average */}
                      {food.avg_rating > 0 ? (
                        <div className="d-flex align-items-center">
                          {renderStars(food.avg_rating)}
                          <span className="ms-2 fw-semibold">
                            {Number(food.avg_rating).toFixed(1)} / 5
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
