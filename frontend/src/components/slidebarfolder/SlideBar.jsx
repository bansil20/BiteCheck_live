import {Nav} from "react-bootstrap";
import {Link, useLocation} from "react-router-dom";
import {useEffect, useState} from "react";
import PATHS from "../../utlis/constants/Path";
import {MdFace, MdFeedback, MdQrCodeScanner} from "react-icons/md";
import {
    FaRegClock,
    FaStar,
    FaTachometerAlt,
    FaUserGraduate,
    FaBars,
    FaQuestion,
    FaInfoCircle
} from "react-icons/fa";
import "./Slidebar.css";

function SlideBar() {
    const location = useLocation();

    const [collapsed, setCollapsed] = useState(
        () => JSON.parse(localStorage.getItem("sidebar-collapsed")) || false
    );

    useEffect(() => {
        localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
    }, [collapsed]);

    const menuItems = [
        {title: "Face Attendance", icon: <MdFace/>, path: PATHS.FACEDETECTION},
        {title: "Dashboard", icon: <FaTachometerAlt/>, path: PATHS.DASHBOARD},
        {title: "Student Details", icon: <FaUserGraduate/>, path: PATHS.STUDENTDETAILS},
        {title: "Meal Feedback", icon: <MdFeedback/>, path: PATHS.STUDENTFEEDBACK},
        // {title: "Download Report", icon: <FaDownload/>, path: "#"},
        {title: "Meal Time Table", icon: <FaRegClock/>, path: PATHS.TIMETABLE},
        {title: "Meal Rating", icon: <FaStar/>, path: PATHS.MEALRATING},
        {title: "Scan and Pay", icon: <MdQrCodeScanner/>, path: PATHS.SCANANDPAY},
        {title: "FAQ", icon: <FaQuestion/>, path: PATHS.FAQ},
        {title: "About", icon: <FaInfoCircle />, path: PATHS.ABOUT},
    ];

    return (
        <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
            {/* Header */}
            <div className="sidebar-header">
                <div className="brand">
                    <h3 className="brand-name">BiteCheck</h3>
                </div>
                <button
                    className="btn btn-sm btn-outline-light toggle-btn"
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label="Toggle sidebar"
                >
                    <FaBars/>
                </button>
            </div>

            <hr className="sidebar-divider"/>

            <div className="main-menu-label">Main Menu</div>

            {/* Menu */}
            <Nav className="flex-column">
                {menuItems.map((item) => (
                    <Nav.Item key={item.title}>
                        <Link
                            to={item.path}
                            title={collapsed ? item.title : undefined} /* helpful tooltip when collapsed */
                            className={`nav-link d-flex align-items-center sidebar-link ${
                                location.pathname === item.path ? "active" : ""
                            }`}
                        >
                            <span className="icon-wrap">{item.icon}</span>
                            <span className="label">{item.title}</span>
                        </Link>
                    </Nav.Item>
                ))}
            </Nav>
        </div>
    );
}

export default SlideBar;
