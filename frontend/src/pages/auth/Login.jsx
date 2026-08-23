import { API_BASE_URL } from "../../utlis/api";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false
  });

  const navigate = useNavigate();

  // ✅ Auto-login if user is remembered
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("rememberedUser"));
    if (savedUser) {
      localStorage.setItem("username", savedUser.username);
      localStorage.setItem("userid", savedUser.userid);
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 👈 includes cookies for sessions
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ " + data.message);

        // ✅ Store username and userid locally
        localStorage.setItem("username", data.username);
        localStorage.setItem("userid", data.userid);

        // ✅ Remember user if checkbox selected
        if (formData.remember) {
          localStorage.setItem("rememberedUser", JSON.stringify(data));
        } else {
          localStorage.removeItem("rememberedUser");
        }

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
        background: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)"
      }}
    >
      <div
        className="card shadow-lg p-4"
        style={{
          width: "30rem",
          borderRadius: "15px",
          backgroundColor: "white"
        }}
      >
        <h3 className="text-center mb-4 text-primary fw-bold">
          Smart Attendance - Login
        </h3>

        <form onSubmit={handleSubmit}>
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

          <div className="mb-3">
            <label className="form-label fw-semibold">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="rememberMe"
              name="remember"
              checked={formData.remember}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="rememberMe">
              Remember Me
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 fw-semibold"
            style={{ borderRadius: "10px" }}
          >
            Login
          </button>

          <div className="text-center mt-3">
            <small>
              Don’t have an account?{" "}
              <a href="/register" className="text-decoration-none fw-semibold">
                Register here
              </a>
            </small>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
