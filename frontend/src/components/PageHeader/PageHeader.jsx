import React, { useState, useRef, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function PageHeader({ PageTitle = "Page Title", PageDescription = "" }) {
  const [showMenu, setShowMenu] = useState(false);
  const [username, setUsername] = useState(""); // 👈 store username
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // ✅ Load username when component mounts
  useEffect(() => {
    const storedName = localStorage.getItem("username");
    if (storedName) {
      setUsername(storedName);
    } else {
      setUsername("User");
    }
  }, []);

  // ✅ Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Logout and clear data
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/"); // Redirect to login
  };

  return (
    <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
      {/* Left side: Page title */}
      <div>
        <h5 className="mb-0 fw-bold h2">{PageTitle}</h5>
        {PageDescription && <small className="text-muted">{PageDescription}</small>}
      </div>

      {/* Right side: User dropdown */}
      <div className="dropdown" ref={menuRef}>
        <button
          className="btn btn-outline-secondary d-flex align-items-center gap-2"
          type="button"
          id="userMenuButton"
          onClick={() => setShowMenu(!showMenu)}
        >
          <FaUser />
          <span>{username}</span> {/* 👈 Dynamic username */}
        </button>

        {showMenu && (
          <ul
            className="dropdown-menu dropdown-menu-end show mt-2"
            aria-labelledby="userMenuButton"
            style={{ position: "absolute" }}
          >
            <li>
              <button className="dropdown-item" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
