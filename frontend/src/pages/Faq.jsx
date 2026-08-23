import React, { useState } from "react";
import { Container, Accordion } from "react-bootstrap";
import PageHeader from "../components/PageHeader/PageHeader";

function FAQ() {
  const [faqs] = useState([
    {
      question: "How is the meal rating calculated?",
      answer:
        "Meal ratings are calculated based on the average of all student feedback ratings for each food item.",
    },
    {
      question: "Can I edit or delete a feedback entry?",
      answer:
        "Currently, feedback entries cannot be edited or deleted to maintain data integrity. However, admin can view all feedback details.",
    },
    {
      question: "How are food images uploaded?",
      answer:
        "Images are uploaded when adding a new food item via the admin panel. Supported formats are JPG and PNG.",
    },
    {
      question: "What does 'Overall Rating' mean on the Meal Rating page?",
      answer:
        "It represents the average rating of all reviews across all dates for that food item.",
    },
    {
      question: "Why do some foods show 'No feedback'?",
      answer:
        "If no student has rated that food on the selected date, it will display 'No feedback available'.",
    },
  ]);

  return (

<div className="container mt-4">
    <PageHeader PageTitle="FAQ"  />
    {/* FAQ Content */}
        <Container className="mt-5">

          <h3 className="mb-4 fw-bold">Frequently Asked Questions</h3>

          <Accordion defaultActiveKey="0">
            {faqs.map((faq, index) => (
              <Accordion.Item eventKey={index.toString()} key={index}>
                <Accordion.Header>{faq.question}</Accordion.Header>
                <Accordion.Body>{faq.answer}</Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Container>
</div>


  );
}

export default FAQ;
