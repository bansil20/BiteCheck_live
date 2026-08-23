import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { FaUsers, FaBullseye, FaEye, FaHeart } from "react-icons/fa";
import PageHeader from "../components/PageHeader/PageHeader";

function About() {
  return (
    <div className="container mt-4">
        <PageHeader PageTitle="About"  />
      {/* Hero Section */}
      <div
        style={{
          backgroundImage: "url('/about-bg.jpg')", // Replace with your image path
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "100px 20px",
          color: "white",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            background: "rgba(0, 0, 0, 0.5)",
            borderRadius: "12px",
            padding: "40px",
            display: "inline-block",
          }}
        >
          <h1 className="fw-bold mb-3">About Our App</h1>
          <p className="lead">
            Empowering better food experiences with transparency, feedback, and technology.
          </p>
        </div>
      </div>

      {/* About Info */}
      <Container className="my-5">

        <Row className="justify-content-center text-center mb-5">
          <Col lg={8}>
            <h2 className="fw-bold">Who We Are</h2>
            <p className="text-muted">
              We’re a passionate team of developers, designers, and food lovers dedicated to making
              dining experiences smarter. Our goal is to bridge the gap between food service and
              student feedback through technology.
            </p>
          </Col>
        </Row>

        {/* Cards Section */}
        <Row className="text-center g-4">
          <Col md={4}>
            <Card className="shadow border-0 h-100 p-3 hover-card">
              <FaBullseye size={40} className="text-primary mb-3" />
              <Card.Title className="fw-bold">Our Mission</Card.Title>
              <Card.Text>
                To create an efficient feedback system that helps improve meal quality and enhance
                satisfaction for every user.
              </Card.Text>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="shadow border-0 h-100 p-3 hover-card">
              <FaEye size={40} className="text-success mb-3" />
              <Card.Title className="fw-bold">Our Vision</Card.Title>
              <Card.Text>
                To become the most trusted and insightful meal feedback platform, promoting healthy
                and transparent dining environments.
              </Card.Text>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="shadow border-0 h-100 p-3 hover-card">
              <FaHeart size={40} className="text-danger mb-3" />
              <Card.Title className="fw-bold">Our Values</Card.Title>
              <Card.Text>
                We value honesty, innovation, and empathy in every interaction with users and
                partners.
              </Card.Text>
            </Card>
          </Col>
        </Row>

        {/* Team Section (optional) */}
        <Row className="justify-content-center text-center mt-5">
          <Col lg={8}>
            <FaUsers size={50} className="text-warning mb-3" />
            <h3 className="fw-bold">Meet the Team</h3>
            <p className="text-muted">
              A small team with big ambitions — combining design, development, and data insights to
              create impactful solutions.
            </p>
          </Col>
        </Row>
      </Container>

      {/* Footer */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "30px 0",
          textAlign: "center",
          borderTop: "1px solid #ddd",
        }}
      >
        <p className="mb-0 text-muted">
          © {new Date().getFullYear()} Smart Meal Feedback System. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}

export default About;
