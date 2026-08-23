import { API_BASE_URL } from "../../utlis/api";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("⚠️ Passwords do not match!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ " + data.message);

        // ✅ Save username and userid locally
        localStorage.setItem("username", data.username);
        localStorage.setItem("userid", data.userid);

        // ✅ Optionally also remember the user (auto-login)
        localStorage.setItem("rememberedUser", JSON.stringify(data));

        navigate("/dashboard");
      } else {
        alert("❌ " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Server error, please try again later!");
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)"
      }}
    >
      <div
        className="card shadow-lg p-4"
        style={{ width: "30rem", borderRadius: "15px", backgroundColor: "white" }}
      >
        <h3 className="text-center mb-4 text-primary fw-bold">
          Smart Attendance - Register
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Full Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter full name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Email address</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="row">
            <div className="col">
              <label className="form-label fw-semibold">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col">
              <label className="form-label fw-semibold">Confirm Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Confirm Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-success w-100 mt-4 fw-semibold"
            style={{ borderRadius: "10px" }}
          >
            Register
          </button>

          <div className="text-center mt-3">
            <small>
              Already have an account?{" "}
              <a href="/" className="text-decoration-none fw-semibold">
                Login here
              </a>
            </small>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
