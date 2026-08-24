<div align="center">

# 🍽️ BiteCheck

### Smart Hostel Mess Food & AI Face Attendance System

Automated student attendance and hostel food tracking, powered by OpenCV facial recognition, Machine Learning, and MongoDB Atlas.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-brightgreen?style=for-the-badge&logo=vercel&logoColor=white)](https://bite-check-bdev.vercel.app/)
![React](https://img.shields.io/badge/-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Flask](https://img.shields.io/badge/-Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![MongoDB](https://img.shields.io/badge/-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![OpenCV](https://img.shields.io/badge/-OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)

</div>

---

## 📖 About

**BiteCheck** is a full-stack, cloud-hosted smart campus solution designed to solve two major everyday hostel challenges: **tracking student mess attendance** and **managing food quality & meal feedback** through seamless automation.

Instead of slow and error-prone manual paper roll calls, BiteCheck uses **OpenCV LBPH facial recognition with CLAHE lighting normalization** to mark attendance in under **0.1 seconds**. On the food management side, it features **NLP feedback analysis** and **machine learning models** to evaluate meal quality, generate actionable food suggestions, and eliminate food wastage.

---

## ✨ Features

- 🧑‍💻 **AI Face Recognition Attendance** — Real-time biometric attendance using OpenCV LBPH + CLAHE contrast normalization. Features instant 1-click photo registration and fallback 6-digit student secret code verification.
- 🍛 **Smart Meal & Feedback Insights** — Machine learning & NLP models analyze student reviews to compute ratings and generate kitchen preparation suggestions.
- 🕒 **IST Timezone Sync** — Complete Indian Standard Time (IST) synchronization for meal schedules (Breakfast, Lunch, Dinner).
- 📜 **Infinite Scroll Student Profile** — Real-time student attendance history with smooth 8-records-per-scroll pagination and one-click PDF report downloads.
- ⚡ **Ultra-Fast Performance & Smart Caching** — Zero-latency (0ms) client-side caching with background revalidation and MongoDB batch aggregations.
- ☁️ **Fully Cloud Deployed** — Hosted with automated CI/CD pipelines across Vercel (Frontend), Render (Backend API), and MongoDB Atlas (Database).

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, React Router, React Bootstrap, Chart.js, React Webcam, Axios |
| **Backend** | Flask (Python 3.10), PyMongo, OpenCV (`opencv-contrib-python-headless`), ReportLab (PDF) |
| **Database** | MongoDB Atlas (Cloud NoSQL Database) |
| **AI / ML** | LBPH Face Recognizer, CLAHE Image Processing, Scikit-Learn NLP Classifier |
| **Cloud Hosting** | Vercel (Frontend CDN), Render (Backend Web Service), MongoDB Atlas (Cloud Cluster) |

---

## 📁 Project Structure

```
BiteCheck_live/
├── backend/
│   ├── app.py                     # Flask API routes, face recognition engine, and business logic
│   ├── db_mongo.py                # MongoDB Atlas connection and collection handlers
│   ├── requirements.txt           # Python dependencies (OpenCV, Flask, PyMongo, etc.)
│   ├── trainer.yml                # Trained LBPH facial recognition model
│   ├── ml_models/                 # NLP sentiment model, vectorizer, and binarizer
│   └── static/food_images/        # Static assets for hostel mess meal dishes
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Dashboard, FaceDetection, StudentProfile, MealRating, etc.
│   │   ├── utlis/                 # API configuration, cache helpers (0ms stale-while-revalidate)
│   │   └── components/            # Reusable UI headers, navigation, and badges
│   ├── package.json               # Node.js dependencies
│   └── .env                       # Frontend environment variables
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Python**: 3.10.x
- **Node.js**: v18+ & npm
- **MongoDB Atlas** account (or local MongoDB instance)

---

### Installation & Local Setup

#### 1. Clone the repository
```bash
git clone https://github.com/bansil20/BiteCheck_live.git
cd BiteCheck_live
```

#### 2. Set up the Backend
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` directory:
```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/bitecheck?retryWrites=true&w=majority
SECRET_KEY=your_secret_key
PORT=5000
```

Start the backend server:
```bash
python app.py
```

#### 3. Set up the Frontend
In a new terminal:
```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend/` directory:
```env
REACT_APP_API_BASE_URL=http://localhost:5000
CI=false
```

Start the React development server:
```bash
npm start
```

Visit `http://localhost:3000` to interact with BiteCheck locally!

---

## 🌐 Live Demo

👉 **[bite-check-bdev.vercel.app](https://bite-check-bdev.vercel.app/)**

---

## 👤 Author

**Bansil Pabari**  
[![GitHub](https://img.shields.io/badge/GitHub-bansil20-181717?style=flat&logo=github)](https://github.com/bansil20)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Bansil_Pabari-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/bansil-pabari-204948296/)  
📧 bansilpabari02@gmail.com

---

<div align="center">
⭐ If you found this project useful, feel free to give it a star!
</div>
