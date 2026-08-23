import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import PATHS from "./utlis/constants/Path";
import StudentDetails from "./pages/StudentDetails";
import LayoutSlideBar from "./components/slidebarfolder/LayoutSlideBar";
import StudentProfile from "./pages/StudentProfile";
import StudentFeedback from "./pages/StudentFeedback";
import MealRating from "./pages/MealRating";
import MealAverage from "./pages/MealAverage";
import AddStudentProfile from "./pages/AddStudentProfile";
import Aos from "aos";
import FaceDetection from "./pages/FaceDetection";
import TimeTable from "./pages/TimeTable";
import MealFeedbackDetails from "./pages/MealFeedbackDetails";
import Faq from "./pages/Faq";
import About from "./pages/About";
import ScanAndPay from "./pages/ScanAndPay";

function App() {

  useEffect(() => {
        Aos.init({duration: 1000});
    }, []);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path={PATHS.REGISTER} element={<Register />} />
        {/* <Route path={PATHS.DASHBOARD} element={<Dashboard />} /> */}
        <Route path={PATHS.DASHBOARD} element={<LayoutSlideBar><Dashboard /></LayoutSlideBar>}/>
        <Route path={PATHS.STUDENTDETAILS} element={<LayoutSlideBar><StudentDetails/></LayoutSlideBar>} />
        <Route path={PATHS.STUDENTPROFILE} element={<LayoutSlideBar><StudentProfile /></LayoutSlideBar>} />
        <Route path={PATHS.ADDSTUDENTPROFILE} element={<LayoutSlideBar><AddStudentProfile/></LayoutSlideBar>} />
        <Route path={PATHS.STUDENTFEEDBACK} element={<LayoutSlideBar><StudentFeedback /></LayoutSlideBar>} />
        <Route path={PATHS.MEALRATING} element={<LayoutSlideBar><MealRating/></LayoutSlideBar>} />
        <Route path={PATHS.MEALAVERAGE} element={<LayoutSlideBar><MealAverage /></LayoutSlideBar>} />
        <Route path={PATHS.FACEDETECTION} element={<LayoutSlideBar><FaceDetection /></LayoutSlideBar>} />
        <Route path={PATHS.TIMETABLE} element={<LayoutSlideBar><TimeTable /></LayoutSlideBar>} />
        <Route path={PATHS.MEALFEEDBACKDETAILS} element={<LayoutSlideBar><MealFeedbackDetails /></LayoutSlideBar>} />
        <Route path={PATHS.SCANANDPAY} element={<LayoutSlideBar><ScanAndPay /></LayoutSlideBar>} />
        <Route path={PATHS.FAQ} element={<LayoutSlideBar><Faq /></LayoutSlideBar>} />
        <Route path={PATHS.ABOUT} element={<LayoutSlideBar><About /></LayoutSlideBar>} />


      </Routes>
    </Router>
  );
}

export default App;
