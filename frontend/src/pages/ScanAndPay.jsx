import { API_BASE_URL } from "../utlis/api";
import React from "react";

function ScanAndPay() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">

      <div className="card shadow-lg p-4 text-center" style={{ width: "360px" }}>

        <h4 className="fw-bold mb-1 text-primary">College Canteen</h4>
        <p className="text-muted mb-3">Scan & Pay Securely</p>

        {/* QR Box */}
        <div className="border rounded p-3 bg-white mb-3">
          <img
            src={`${API_BASE_URL}/static/ScanAndPay.png`}
            alt="QR Code"
            className="img-fluid"
            style={{ width: "220px", height: "220px" }}
          />
        </div>

        <h6 className="text-muted mb-0">Amount</h6>
        <h3 className="mb-3">Per Plate 75 Rs </h3>

        <p className="small text-secondary">Use any UPI app to scan this code</p>



      </div>

    </div>
  );
}

export default ScanAndPay;
