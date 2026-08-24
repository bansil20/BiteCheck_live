import os
import base64
import math
import random
import io
import cv2
import numpy as np
from datetime import datetime, date, timedelta
from flask import Flask, request, jsonify, session, send_file, send_from_directory
from flask_cors import CORS
from PIL import Image
from dotenv import load_dotenv
from reportlab.lib.pagesizes import A4, letter
from reportlab.pdfgen import canvas

from db_mongo import (
    db, users_col, students_col, foods_col,
    timetables_col, attendances_col, feedbacks_col,
    get_next_sequence_value, init_db, IST
)
from feedback_ml import (
    predict_labels_for_comments,
    aggregate_labels_from_labellists,
    models_exist,
    combine_with_sentiment,
    auto_train_if_needed
)

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "bitecheck_secret_key_2026")
CORS(app, supports_credentials=True)

# Initialize MongoDB indexes and sequences
init_db()

# ================= FACE DATA CONFIG =================
DATASET_PATH = os.path.join(os.path.dirname(__file__), "faces_dataset")
if not os.path.exists(DATASET_PATH):
    os.makedirs(DATASET_PATH, exist_ok=True)

HAAR_CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
EYE_CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
TRAINER_PATH = os.path.join(os.path.dirname(__file__), "trainer.yml")

GLOBAL_RECOGNIZER = None

def get_or_load_recognizer():
    global GLOBAL_RECOGNIZER
    if GLOBAL_RECOGNIZER is not None:
        return GLOBAL_RECOGNIZER
    
    if os.path.exists(TRAINER_PATH):
        try:
            rec = cv2.face.LBPHFaceRecognizer_create()
            rec.read(TRAINER_PATH)
            GLOBAL_RECOGNIZER = rec
            return GLOBAL_RECOGNIZER
        except Exception as e:
            print(f"Error reading trainer.yml: {e}")
            
    # Auto-train from MongoDB Atlas student faces
    print("🔄 Auto-building LBPH face recognition model from MongoDB Atlas...")
    students = list(students_col.find({}))
    face_samples = []
    ids = []
    
    for s in students:
        studid = s.get("studid")
        if not studid:
            continue
        face_doc = s.get("studface") or s.get("face") or s.get("photos") or {}
        b64 = None
        if isinstance(face_doc, dict):
            b64 = face_doc.get("base64")
        elif isinstance(face_doc, str) and face_doc.startswith("data:image"):
            b64 = face_doc
            
        if not b64:
            continue
            
        img = decode_image(b64)
        if img is None:
            continue
        face_img = preprocess_face_gray(img)
        if face_img is None:
            continue
            
        # Add primary crop + augmentations
        face_samples.append(face_img)
        ids.append(int(studid))
        
        flipped = cv2.flip(face_img, 1)
        face_samples.append(flipped)
        ids.append(int(studid))
        
        bright = cv2.convertScaleAbs(face_img, alpha=1.1, beta=15)
        face_samples.append(bright)
        ids.append(int(studid))
        
        dim = cv2.convertScaleAbs(face_img, alpha=0.9, beta=-15)
        face_samples.append(dim)
        ids.append(int(studid))
        
    if len(face_samples) > 0:
        rec = cv2.face.LBPHFaceRecognizer_create()
        rec.train(face_samples, np.array(ids))
        os.makedirs(os.path.dirname(TRAINER_PATH), exist_ok=True)
        rec.write(TRAINER_PATH)
        GLOBAL_RECOGNIZER = rec
        print(f"✅ Auto-trained model for {len(set(ids))} students from MongoDB Atlas!")
        return GLOBAL_RECOGNIZER
        
    return None

EMOJI_TO_RATING = {
    "😡": 1,
    "😒": 2,
    "😑": 3,
    "😊": 4,
    "😍": 5
}

# -------------------- HELPERS --------------------
def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def decode_base64_image(b64):
    try:
        if "," in b64:
            b64 = b64.split(",")[1]
        img_bytes = base64.b64decode(b64)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img
    except Exception:
        return None


def decode_image(img_data):
    """Convert base64 from React to OpenCV image"""
    try:
        if "," in img_data:
            img_data = img_data.split(",")[1]
        nparr = np.frombuffer(base64.b64decode(img_data), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception:
        return None


def build_food_image_url(filename):
    if not filename:
        return ""
    if filename.startswith("http://") or filename.startswith("https://"):
        return filename
    
    # Dynamically determine backend base URL
    backend_url = os.environ.get("BACKEND_URL")
    if not backend_url:
        try:
            from flask import request, has_request_context
            if has_request_context():
                backend_url = request.host_url.rstrip("/")
            else:
                backend_url = "https://bitecheck-backend-p2c1.onrender.com"
        except Exception:
            backend_url = "https://bitecheck-backend-p2c1.onrender.com"
            
    if "onrender.com" in backend_url and backend_url.startswith("http://"):
        backend_url = backend_url.replace("http://", "https://", 1)
        
    return f"{backend_url}/static/food_images/{filename}"


def generate_secret_code():
    return f"{random.randint(0, 999999):06d}"


def preprocess_face_gray(image):
    """
    1. Convert to gray
    2. Detect biggest face
    3. Detect eyes inside face
    4. Rotate face so eyes are horizontal (alignment)
    5. Resize + equalize histogram
    Returns: aligned 200x200 grayscale face or None
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = HAAR_CASCADE.detectMultiScale(gray, 1.3, 5)
    if len(faces) == 0:
        return None

    x, y, w, h = sorted(faces, key=lambda b: b[2] * b[3], reverse=True)[0]
    face_gray = gray[y:y + h, x:x + w]

    eyes = EYE_CASCADE.detectMultiScale(face_gray, 1.1, 5)
    if len(eyes) >= 2:
        eyes = sorted(eyes, key=lambda e: e[2] * e[3], reverse=True)[:2]
        if eyes[0][0] > eyes[1][0]:
            eye_right, eye_left = eyes[0], eyes[1]
        else:
            eye_left, eye_right = eyes[0], eyes[1]

        lx, ly, lw, lh = eye_left
        rx, ry, rw, rh = eye_right

        left_center = (lx + lw / 2, ly + lh / 2)
        right_center = (rx + rw / 2, ry + rh / 2)

        dy = right_center[1] - left_center[1]
        dx = right_center[0] - left_center[0]
        angle = math.degrees(math.atan2(dy, dx))

        center = (w / 2, h / 2)
        rot_mat = cv2.getRotationMatrix2D(center, angle, 1.0)
        aligned_face = cv2.warpAffine(face_gray, rot_mat, (w, h))
        face_crop = aligned_face
    else:
        face_crop = face_gray

    face_resized = cv2.resize(face_crop, (200, 200))
    face_equalized = cv2.equalizeHist(face_resized)
    return face_equalized


def train_or_update_recognizer(_unused=None):
    """
    Train LBPH on ALL faces in faces_dataset.
    Each folder is: <studid>_<studname>/face_*.jpg
    """
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    face_samples = []
    ids = []

    if not os.path.exists(DATASET_PATH):
        return

    for folder in os.listdir(DATASET_PATH):
        try:
            student_id = int(folder.split("_")[0])
        except ValueError:
            continue

        folder_path = os.path.join(DATASET_PATH, folder)
        if not os.path.isdir(folder_path):
            continue

        for image_name in os.listdir(folder_path):
            img_path = os.path.join(folder_path, image_name)
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                continue

            faces = HAAR_CASCADE.detectMultiScale(img, 1.3, 5)
            for (x, y, w, h) in faces:
                face = img[y:y + h, x:x + w]
                face = cv2.resize(face, (200, 200))
                face = cv2.equalizeHist(face)
                face_samples.append(face)
                ids.append(student_id)

    if len(face_samples) == 0:
        print("❌ No faces found in dataset. Train aborted.")
        return

    recognizer.train(face_samples, np.array(ids))
    recognizer.write(TRAINER_PATH)
    global GLOBAL_RECOGNIZER
    GLOBAL_RECOGNIZER = recognizer
    print(f"✅ LBPH model trained & cached. Total students: {len(set(ids))}")


# -------------------- AUTH ROUTES --------------------
@app.route("/register", methods=["POST"])
def register_user():
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"success": False, "message": "All fields are required"}), 400

    existing_user = users_col.find_one({"email": email})
    if existing_user:
        return jsonify({"success": False, "message": "Email already registered"}), 400

    new_userid = get_next_sequence_value("userid")
    user_doc = {
        "userid": new_userid,
        "username": username,
        "email": email,
        "password": password,
        "created_at": datetime.now(IST)
    }
    users_col.insert_one(user_doc)

    return jsonify({
        "success": True,
        "message": "Registration successful!",
        "username": username,
        "userid": new_userid
    }), 201


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    user = users_col.find_one({"email": email, "password": password})
    if user:
        session["user_id"] = user["userid"]
        return jsonify({
            "success": True,
            "message": f"Welcome {user['username']}!",
            "username": user["username"],
            "userid": user["userid"]
        })
    else:
        return jsonify({"success": False, "message": "Invalid email or password"})


@app.route("/current_user", methods=["GET"])
def current_user():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"username": None}), 401

    user = users_col.find_one({"userid": int(user_id)})
    if not user:
        return jsonify({"username": None}), 404

    return jsonify({"username": user["username"]})


@app.route("/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    return jsonify({"message": "Logged out"})


# -------------------- STUDENT ROUTES --------------------
@app.route("/add_student", methods=["POST"])
def add_student():
    data = request.get_json() or {}

    faces_b64_list = data.get("studface_list")
    single_face_b64 = data.get("studface")

    if faces_b64_list and isinstance(faces_b64_list, list):
        images_b64 = faces_b64_list
    elif single_face_b64:
        images_b64 = [single_face_b64]
    else:
        return jsonify({"message": "❌ No face image provided"}), 400

    new_studid = get_next_sequence_value("studid")
    secret_code = generate_secret_code()

    student_doc = {
        "studid": new_studid,
        "studname": data.get("studname"),
        "studpnr": int(data.get("studpnr", 0)),
        "studphone": int(data.get("studphone", 0)),
        "studcourse": data.get("studcourse"),
        "studemail": data.get("studemail"),
        "studbloodgrp": data.get("studbloodgrp"),
        "studremark": data.get("studremark"),
        "studhostelroom": data.get("studhostelroom"),
        "studface": {"base64": images_b64[0]},
        "studsecretcode": secret_code,
        "created_at": datetime.now(IST)
    }
    students_col.insert_one(student_doc)

    student_folder = os.path.join(DATASET_PATH, f"{new_studid}_{student_doc['studname']}")
    os.makedirs(student_folder, exist_ok=True)

    saved_count = 0
    saved_count = 0
    img = decode_image(images_b64[0])
    if img is not None:
        face_img = preprocess_face_gray(img)
        if face_img is not None:
            # 1. Primary aligned face crop
            cv2.imwrite(os.path.join(student_folder, "face_0.jpg"), face_img)
            saved_count += 1

            # 2. Slight variations in memory for high LBPH accuracy from 1 photo
            flipped = cv2.flip(face_img, 1)
            cv2.imwrite(os.path.join(student_folder, "face_1.jpg"), flipped)
            saved_count += 1

            bright = cv2.convertScaleAbs(face_img, alpha=1.1, beta=15)
            cv2.imwrite(os.path.join(student_folder, "face_2.jpg"), bright)
            saved_count += 1

            dim = cv2.convertScaleAbs(face_img, alpha=0.9, beta=-15)
            cv2.imwrite(os.path.join(student_folder, "face_3.jpg"), dim)
            saved_count += 1

    if saved_count == 0:
        return jsonify({"message": "❌ No valid face detected in provided photo"}), 400

    train_or_update_recognizer(new_studid)

    return jsonify({
        "message": f"✅ Student registered with LBPH ({saved_count} faces saved)",
        "secretCode": secret_code
    }), 200


def format_student_doc(s):
    face_val = s.get("face") or s.get("studface") or s.get("photos") or {}
    if isinstance(face_val, str):
        try:
            import json as json_lib
            face_val = json_lib.loads(face_val.replace('\"', '"'))
        except Exception:
            face_val = {"base64": face_val} if face_val.startswith("data:image") else {}

    return {
        "id": s.get("studid"),
        "studid": s.get("studid"),
        "name": s.get("name") or s.get("studname", ""),
        "studname": s.get("name") or s.get("studname", ""),
        "pnr": s.get("enrollment_no") or s.get("studpnr", ""),
        "studpnr": s.get("enrollment_no") or s.get("studpnr", ""),
        "enrollment_no": s.get("enrollment_no") or s.get("studpnr", ""),
        "phone": s.get("phone") or s.get("studphone", ""),
        "studphone": s.get("phone") or s.get("studphone", ""),
        "course": s.get("course") or s.get("studcourse", ""),
        "studcourse": s.get("course") or s.get("studcourse", ""),
        "email": s.get("email") or s.get("studemail", ""),
        "studemail": s.get("email") or s.get("studemail", ""),
        "bloodgrp": s.get("blood_group") or s.get("studbloodgrp", ""),
        "studbloodgrp": s.get("blood_group") or s.get("studbloodgrp", ""),
        "blood_group": s.get("blood_group") or s.get("studbloodgrp", ""),
        "remark": s.get("remark") or s.get("studremark", ""),
        "studremark": s.get("remark") or s.get("studremark", ""),
        "hostelroom": s.get("hostel_room") or s.get("studhostelroom", ""),
        "studhostelroom": s.get("hostel_room") or s.get("studhostelroom", ""),
        "hostel_room": s.get("hostel_room") or s.get("studhostelroom", ""),
        "studsecretcode": s.get("secret_code") or s.get("studsecretcode", ""),
        "secret_code": s.get("secret_code") or s.get("studsecretcode", ""),
        "face": face_val,
        "studface": face_val
    }


@app.route("/get_student", methods=["GET"])
def get_students():
    students = list(students_col.find({}, {"_id": 0}))
    if not students:
        return jsonify({"message": "No students registered yet"}), 404

    return jsonify([format_student_doc(s) for s in students]), 200


@app.route("/get_student/<int:student_id>", methods=["GET"])
def get_student_by_id(student_id):
    student = students_col.find_one({"studid": student_id}, {"_id": 0})
    if not student:
        return jsonify({"error": "Student not found"}), 404

    return jsonify(format_student_doc(student)), 200


@app.route("/total_students", methods=["GET"])
def total_students():
    try:
        count = students_col.count_documents({})
        return jsonify({"total_students": count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------- ATTENDANCE & FACE RECOGNITION --------------------
@app.route("/recognize_face", methods=["POST"])
def recognize_face():
    data = request.get_json() or {}

    # 1️⃣ SECRET CODE ATTENDANCE
    secret_code = data.get("code")
    if secret_code:
        student = students_col.find_one({"studsecretcode": secret_code})
        if not student:
            return jsonify({"recognized": False, "message": "❌ Invalid Secret Code"}), 404
        return mark_attendance(student, via="code")

    # 2️⃣ FACE ATTENDANCE (LBPH)
    img_b64 = data.get("image")
    if not img_b64:
        return jsonify({"recognized": False, "message": "❌ No image provided"}), 400

    img = decode_base64_image(img_b64)
    if img is None:
        return jsonify({"recognized": False, "message": "❌ Invalid image"}), 400

    face_img = preprocess_face_gray(img)
    if face_img is None:
        return jsonify({"recognized": False, "message": "❌ No face detected"}), 400

    recognizer = get_or_load_recognizer()
    if recognizer is None:
        return jsonify({"recognized": False, "message": "❌ No student faces registered yet"}), 400

    label, confidence = recognizer.predict(face_img)
    match_score = max(0, min(100, int((1.0 - confidence / 100.0) * 100)))
    print(f"LBPH prediction: label={label}, confidence={confidence:.1f}, match={match_score}%")

    THRESHOLD = 85.0

    if confidence < THRESHOLD:
        student = students_col.find_one({"studid": int(label)})
        if not student:
            return jsonify({"recognized": False, "message": "❌ Unknown student"}), 404
        return mark_attendance(student, via="face", confidence=confidence)

    return jsonify({
        "recognized": False,
        "message": "❌ Face not recognized"
    }), 400


def mark_attendance(student, via="face", confidence=None):
    now = datetime.now(IST)
    today = now.date()
    current_day = now.strftime("%A")
    current_time = now.time()

    # Detect meal slot
    if datetime.strptime("06:00", "%H:%M").time() <= current_time < datetime.strptime("10:30", "%H:%M").time():
        meal = "Breakfast"
    elif datetime.strptime("11:00", "%H:%M").time() <= current_time < datetime.strptime("17:30", "%H:%M").time():
        meal = "Lunch"
    elif datetime.strptime("18:30", "%H:%M").time() <= current_time < datetime.strptime("23:59", "%H:%M").time():
        meal = "Dinner"
    else:
        return jsonify({
            "recognized": True,
            "name": student["studname"],
            "message": "⚠️ Not meal time"
        }), 200

    # Find food for that meal
    timetable_entry = timetables_col.find_one({"day": current_day, "mealtype": meal})
    if not timetable_entry:
        return jsonify({
            "recognized": True,
            "name": student["studname"],
            "message": f"⚠️ No {meal} found in timetable"
        }), 200

    food_id = timetable_entry["foodid"]
    food_item = foods_col.find_one({"foodid": food_id})
    food_name = food_item["foodname"] if food_item else "N/A"

    # Check if already marked today
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())

    existing = attendances_col.find_one({
        "studid": student["studid"],
        "food_id": food_id,
        "timestamp": {"$gte": start_of_day, "$lte": end_of_day}
    })

    if existing:
        return jsonify({
            "recognized": True,
            "name": student["studname"],
            "meal": meal,
            "message": f"⚠️ {student['studname']} Attendance already marked for this meal"
        }), 200

    new_attid = get_next_sequence_value("attid")
    attendances_col.insert_one({
        "attid": new_attid,
        "studid": student["studid"],
        "food_id": food_id,
        "status": "Present",
        "timestamp": datetime.now(IST)
    })

    return jsonify({
        "recognized": True,
        "name": student["studname"],
        "meal": meal,
        "food": food_name,
        "message": f"✅ {student['studname']} Attendance marked successfully ({via})"
    }), 200


# -------------------- TIMETABLE & FOOD ROUTES --------------------
@app.route("/get_timetable", methods=["GET"])
def get_timetable():
    timetables = list(timetables_col.find({}, {"_id": 0}))
    food_ids = list(set(item["foodid"] for item in timetables if "foodid" in item))
    foods = list(foods_col.find({"foodid": {"$in": food_ids}}, {"foodid": 1, "foodname": 1, "_id": 0}))
    food_map = {f["foodid"]: f.get("foodname", "N/A") for f in foods}

    data = [{
        "ttid": item.get("ttid"),
        "day": item.get("day"),
        "mealtype": item.get("mealtype"),
        "food": food_map.get(item.get("foodid"), "N/A")
    } for item in timetables]
    return jsonify(data)


@app.route("/get_foods", methods=["GET"])
def get_foods():
    timetables = list(timetables_col.find({}, {"_id": 0}))
    food_ids = list(set(t["foodid"] for t in timetables))
    foods = list(foods_col.find({"foodid": {"$in": food_ids}}, {"_id": 0}))
    food_map = {f["foodid"]: f for f in foods}

    # Pre-calculate ratings in 1 single aggregation query
    try:
        pipeline = [
            {"$group": {"_id": "$foodid", "avg_rating": {"$avg": "$rating"}, "total_reviews": {"$sum": 1}}}
        ]
        rating_stats = list(feedbacks_col.aggregate(pipeline))
        rating_map = {r["_id"]: round(float(r["avg_rating"]), 1) for r in rating_stats}
    except Exception:
        rating_map = {}

    result = []
    for t in timetables:
        f = food_map.get(t["foodid"])
        if f:
            fid = f["foodid"]
            result.append({
                "foodid": fid,
                "foodname": f["foodname"],
                "fooddescription": f.get("fooddescription", ""),
                "foodimage": build_food_image_url(f.get("foodimage")),
                "mealtype": t["mealtype"],
                "avg_rating": rating_map.get(fid, 0)
            })
    return jsonify(result)


@app.route("/get_attendance/<int:studid>", methods=["GET"])
def get_attendance_in_stdprofile(studid):
    attendance_records = list(attendances_col.find({"studid": studid}, {"_id": 0}).sort("timestamp", -1))
    food_ids = list(set(att["food_id"] for att in attendance_records if "food_id" in att))
    foods = list(foods_col.find({"foodid": {"$in": food_ids}}, {"foodid": 1, "foodname": 1, "_id": 0}))
    timetables = list(timetables_col.find({"foodid": {"$in": food_ids}}, {"foodid": 1, "day": 1, "mealtype": 1, "_id": 0}))

    food_map = {f["foodid"]: f.get("foodname", "N/A") for f in foods}
    tt_map = {t["foodid"]: t for t in timetables}

    result = []
    for att in attendance_records:
        fid = att.get("food_id")
        tt = tt_map.get(fid, {})
        ts = att.get("timestamp")
        ts_str = ts.strftime("%Y-%m-%d %H:%M:%S") if isinstance(ts, datetime) else str(ts)

        result.append({
            "timestamp": ts_str,
            "day": tt.get("day", "N/A"),
            "meal": tt.get("mealtype", "N/A"),
            "food": food_map.get(fid, "N/A"),
            "status": att.get("status", "Present"),
        })
    return jsonify(result)


def _fetch_current_or_upcoming_food_data():
    now = datetime.now(IST)
    current_time = now.time()
    current_day = now.strftime("%A")

    meal_schedule = [
        ("Breakfast", "06:00", "10:30"),
        ("Lunch", "11:00", "17:30"),
        ("Dinner", "18:30", "23:59")
    ]

    current_meal = None
    upcoming_meal = None

    for meal, start, end in meal_schedule:
        start_t = datetime.strptime(start, "%H:%M").time()
        end_t = datetime.strptime(end, "%H:%M").time()

        if start_t <= current_time < end_t:
            current_meal = meal
            break
        elif current_time < start_t and not upcoming_meal:
            upcoming_meal = (meal, start)

    if current_meal:
        entry = timetables_col.find_one({"day": current_day, "mealtype": current_meal})
        if entry:
            food_item = foods_col.find_one({"foodid": entry["foodid"]})
            if food_item:
                return {
                    "status": "current",
                    "meal": current_meal,
                    "foodid": food_item["foodid"],
                    "foodname": food_item["foodname"],
                    "fooddescription": food_item.get("fooddescription") or "Delicious food",
                    "foodimage": build_food_image_url(food_item.get("foodimage"))
                }

    if upcoming_meal:
        meal, start = upcoming_meal
        entry = timetables_col.find_one({"day": current_day, "mealtype": meal})
        if entry:
            food_item = foods_col.find_one({"foodid": entry["foodid"]})
            if food_item:
                meal_start_datetime = f"{now.strftime('%Y-%m-%d')} {start}"
                return {
                    "status": "upcoming",
                    "meal": meal,
                    "mealStartTime": meal_start_datetime,
                    "foodid": food_item["foodid"],
                    "foodname": food_item["foodname"],
                    "fooddescription": food_item.get("fooddescription") or "Delicious food",
                    "foodimage": build_food_image_url(food_item.get("foodimage"))
                }

    # Fallback to first available timetable entry
    fallback_entry = timetables_col.find_one({"day": current_day}) or timetables_col.find_one()
    if fallback_entry:
        food_item = foods_col.find_one({"foodid": fallback_entry["foodid"]})
        if food_item:
            return {
                "status": "upcoming",
                "meal": fallback_entry.get("mealtype", "Breakfast"),
                "foodid": food_item["foodid"],
                "foodname": food_item["foodname"],
                "fooddescription": food_item.get("fooddescription") or "Delicious food",
                "foodimage": build_food_image_url(food_item.get("foodimage"))
            }

    return None


@app.route('/get_current_food', methods=['GET'])
def get_current_food():
    data = _fetch_current_or_upcoming_food_data()
    if data:
        return jsonify(data), 200
    return jsonify({"message": "No meal or upcoming food found."}), 404


@app.route("/meal_attendance_stats", methods=["GET"])
def meal_attendance_stats():
    now_ist = datetime.now(IST)
    today = now_ist.date()
    start_today = datetime.combine(today, datetime.min.time())
    end_today = datetime.combine(today, datetime.max.time())

    current_food = _fetch_current_or_upcoming_food_data()
    meal_order = ["Breakfast", "Lunch", "Dinner"]

    if current_food and current_food.get("status") == "current":
        meal = current_food["meal"]
        foodid = current_food["foodid"]
    else:
        upcoming = current_food.get("meal") if current_food else "Breakfast"
        try:
            idx = meal_order.index(upcoming)
            meal = meal_order[idx - 1] if idx > 0 else "Dinner"
        except Exception:
            meal = "Dinner"

        entry = timetables_col.find_one({"day": today.strftime("%A"), "mealtype": meal})
        if not entry:
            entry = timetables_col.find_one({"mealtype": meal}) or timetables_col.find_one()
        
        foodid = entry["foodid"] if entry else 1

    present_count = attendances_col.count_documents({
        "food_id": foodid,
        "status": "Present",
        "timestamp": {"$gte": start_today, "$lte": end_today}
    })

    total_students = students_col.count_documents({})
    absent_count = max(0, total_students - present_count)

    return jsonify({
        "meal": meal,
        "foodid": foodid,
        "present": present_count,
        "absent": absent_count,
        "foodname": current_food.get("foodname") if current_food else "Meal",
        "total": total_students
    }), 200



@app.route("/meal_today_counts", methods=["GET"])
def meal_today_counts():
    now_ist = datetime.now(IST)
    today = now_ist.date()
    start_today = datetime.combine(today, datetime.min.time())
    end_today = datetime.combine(today, datetime.max.time())

    meal_types = ["Breakfast", "Lunch", "Dinner"]
    counts = {}
    total_students = students_col.count_documents({})

    for meal in meal_types:
        entry = timetables_col.find_one({"day": today.strftime("%A"), "mealtype": meal})
        if not entry:
            counts[meal] = {"present": 0, "total": total_students}
            continue

        foodid = entry["foodid"]
        present_count = attendances_col.count_documents({
            "food_id": foodid,
            "status": "Present",
            "timestamp": {"$gte": start_today, "$lte": end_today}
        })
        counts[meal] = {"present": present_count, "total": total_students}

    return jsonify(counts)


@app.route("/last7_meal_attendance/<mealtype>", methods=["GET"])
def last7_meal_attendance(mealtype):
    today = date.today()
    result = []
    mealtype = mealtype.capitalize()

    for i in range(7):
        day_date = today - timedelta(days=i)
        day_name = day_date.strftime("%A")
        start_day = datetime.combine(day_date, datetime.min.time())
        end_day = datetime.combine(day_date, datetime.max.time())

        entry = timetables_col.find_one({"day": day_name, "mealtype": mealtype})
        if not entry:
            result.append({"date": str(day_date), "present": 0})
            continue

        foodid = entry["foodid"]
        present_count = attendances_col.count_documents({
            "food_id": foodid,
            "status": "Present",
            "timestamp": {"$gte": start_day, "$lte": end_day}
        })
        result.append({"date": str(day_date), "present": present_count})

    result.reverse()
    return jsonify(result)


@app.route("/best_food_last7", methods=["GET"])
def best_food_last7():
    today = datetime.now(IST).date()
    seven_days_ago = datetime.combine(today - timedelta(days=7), datetime.min.time())

    pipeline = [
        {"$match": {"created_at": {"$gte": seven_days_ago}}},
        {"$group": {
            "_id": "$foodid",
            "avg_rating": {"$avg": "$rating"},
            "total_reviews": {"$sum": 1}
        }}
    ]

    results = list(feedbacks_col.aggregate(pipeline))
    if not results:
        return jsonify({
            "message": "No feedback in last 7 days",
            "food": None
        })

    best_row = None
    best_score = -1

    for row in results:
        avg_rating = float(row["avg_rating"])
        review_count = int(row["total_reviews"])
        score = avg_rating + (0.35 * np.log1p(review_count))

        if score > best_score:
            best_score = score
            best_row = row

    food_obj = foods_col.find_one({"foodid": best_row["_id"]})
    if not food_obj:
        return jsonify({"message": "food not found", "food": None})

    return jsonify({
        "message": "success",
        "foodid": food_obj["foodid"],
        "name": food_obj["foodname"],
        "image": build_food_image_url(food_obj.get("foodimage")),
        "avg_rating": round(float(best_row["avg_rating"]), 2),
        "reviews": int(best_row["total_reviews"])
    })


@app.route("/food_images/<path:filename>")
def serve_food_image(filename):
    return send_from_directory(os.path.join(app.root_path, "static/food_images"), filename)


# -------------------- FEEDBACK ROUTES --------------------
@app.route("/submit_feedback", methods=["POST"])
def submit_feedback():
    data = request.get_json() or {}
    foodid = data.get("foodid")
    emoji = data.get("emoji")
    comment = data.get("comment")
    would_eat_again = data.get("would_eat_again")
    studentname = data.get("studentname", "")

    if not all([foodid, emoji, comment, would_eat_again is not None]):
        return jsonify({"message": "Missing required fields"}), 400

    rating = EMOJI_TO_RATING.get(emoji, 3)
    new_fbid = get_next_sequence_value("fbid")

    feedback_doc = {
        "fbid": new_fbid,
        "foodid": int(foodid),
        "studentname": studentname,
        "rating": rating,
        "comment": comment,
        "eat_again": "Yes" if would_eat_again else "No",
        "created_at": datetime.now(IST)
    }
    feedbacks_col.insert_one(feedback_doc)

    return jsonify({"message": "Feedback submitted successfully"}), 200


@app.route("/get_feedback/<int:foodid>", methods=["GET"])
def get_feedback(foodid):
    feedbacks = list(feedbacks_col.find({"foodid": foodid}, {"_id": 0}).sort("created_at", 1))
    if not feedbacks:
        return jsonify([])

    grouped = {}
    for fb in feedbacks:
        created = fb.get("created_at")
        if isinstance(created, datetime):
            date_str = created.strftime("%Y-%m-%d")
        else:
            date_str = str(created)[:10]

        if date_str not in grouped:
            grouped[date_str] = {"total": 0, "count": 0}
        grouped[date_str]["total"] += fb.get("rating", 3)
        grouped[date_str]["count"] += 1

    result = []
    for date_str, data in grouped.items():
        avg = round(data["total"] / data["count"], 1)
        result.append({
            "date": date_str,
            "avg_rating": avg,
            "count": data["count"]
        })

    result.sort(key=lambda x: x["date"], reverse=True)
    return jsonify(result)


@app.route("/get_feedback_by_date/<int:foodid>/<string:date>", methods=["GET"])
def get_feedback_by_date(foodid, date):
    start_date = datetime.strptime(date, "%Y-%m-%d")
    end_date = start_date + timedelta(days=1)

    feedbacks = list(feedbacks_col.find({
        "foodid": foodid,
        "created_at": {"$gte": start_date, "$lt": end_date}
    }, {"_id": 0}))

    result = []
    for fb in feedbacks:
        eat_again_val = fb.get("eat_again", "No")
        result.append({
            "id": fb["fbid"],
            "rating": fb["rating"],
            "comment": fb["comment"],
            "eat_again": True if str(eat_again_val).lower() == "yes" else False,
            "studentname": fb.get("studentname", ""),
        })

    return jsonify(result)


# -------------------- PDF REPORTS --------------------
def get_attendance_data(student_id):
    records = list(attendances_col.find({"studid": student_id}, {"_id": 0}).sort("timestamp", -1))
    out = []
    for r in records:
        food_item = foods_col.find_one({"foodid": r["food_id"]})
        tt_item = timetables_col.find_one({"foodid": r["food_id"]})
        ts = r.get("timestamp")
        ts_str = ts.strftime("%Y-%m-%d %H:%M") if isinstance(ts, datetime) else str(ts)
        out.append({
            "timestamp": ts_str,
            "status": r.get("status", "Present"),
            "food": food_item["foodname"] if food_item else "N/A",
            "mealtype": tt_item["mealtype"] if tt_item else "N/A",
            "day": tt_item["day"] if tt_item else "N/A"
        })
    return out


@app.route('/download_attendance_pdf/<int:student_id>')
def download_attendance_pdf(student_id):
    student = students_col.find_one({"studid": student_id})
    if not student:
        return jsonify({"error": "Student not found"}), 404

    attendance_records = get_attendance_data(student_id)
    if not attendance_records:
        return jsonify({"error": "No attendance records found"}), 404

    pdf_buffer = io.BytesIO()
    p = canvas.Canvas(pdf_buffer, pagesize=A4)
    p.setFont("Helvetica", 12)
    p.drawString(50, 800, f"Attendance Report for {student['studname']} ({student['studpnr']})")

    y = 770
    for record in attendance_records:
        line = f"{record['timestamp']} | {record['day']} - {record['mealtype']} | {record['food']} | {record['status']}"
        p.drawString(50, y, line)
        y -= 20
        if y < 50:
            p.showPage()
            y = 800
    p.save()
    pdf_buffer.seek(0)
    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name=f"{student['studname']}_attendance.pdf",
        mimetype="application/pdf"
    )


@app.route("/download_feedback_pdf/<date>/<foodname>", methods=["GET"])
def download_feedback_pdf(date, foodname):
    food_obj = foods_col.find_one({"foodname": foodname})
    if not food_obj:
        return jsonify({"message": f"❌ Food '{foodname}' not found"}), 404

    feedbacks = list(feedbacks_col.find({"foodid": food_obj["foodid"]}))
    if not feedbacks:
        return jsonify({"message": f"❌ No feedback found for {foodname} on {date}"}), 404

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(180, height - 50, "Meal Feedback Report")

    pdf.setFont("Helvetica", 12)
    pdf.drawString(50, height - 80, f"Date: {date}")
    pdf.drawString(50, height - 100, f"Food: {foodname}")
    pdf.line(50, height - 110, 550, height - 110)

    y = height - 140
    count = 1

    for fb in feedbacks:
        if y < 100:
            pdf.showPage()
            pdf.setFont("Helvetica", 12)
            y = height - 80

        pdf.drawString(50, y, f"{count}. Student: {fb.get('studentname') or 'N/A'}")
        y -= 20
        pdf.drawString(70, y, f"Rating: {fb.get('rating')} ")
        y -= 20
        pdf.drawString(70, y, f"Comment: {fb.get('comment')}")
        y -= 20
        pdf.drawString(70, y, f"Eat Again: {fb.get('eat_again')}")
        y -= 30
        count += 1

    pdf.save()
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"Feedback_{foodname}_{date}.pdf",
        mimetype="application/pdf"
    )


# -------------------- ML FEEDBACK SUGGESTION --------------------
@app.route("/get_food_suggestion/<int:foodid>", methods=["GET"])
def get_food_suggestion(foodid):
    auto_train_if_needed()

    feedbacks = list(feedbacks_col.find({"foodid": foodid}))
    if not feedbacks:
        return jsonify({
            "foodid": foodid,
            "issues": {},
            "suggestion_paragraph": "No feedback available for this food.",
            "num_feedbacks_analyzed": 0
        })

    # Find latest feedback date
    latest_fb = feedbacks_col.find_one({"foodid": foodid}, sort=[("created_at", -1)])
    if not latest_fb or not latest_fb.get("created_at"):
        return jsonify({
            "foodid": foodid,
            "issues": {},
            "suggestion_paragraph": "No feedback found for last serving date.",
            "num_feedbacks_analyzed": 0
        })

    latest_dt = latest_fb["created_at"]
    if isinstance(latest_dt, datetime):
        latest_date_str = latest_dt.strftime("%Y-%m-%d")
        start_dt = datetime.combine(latest_dt.date(), datetime.min.time())
        end_dt = datetime.combine(latest_dt.date(), datetime.max.time())
    else:
        latest_date_str = str(latest_dt)[:10]
        start_dt = datetime.strptime(latest_date_str, "%Y-%m-%d")
        end_dt = start_dt + timedelta(days=1)

    same_date_feedbacks = list(feedbacks_col.find({
        "foodid": foodid,
        "created_at": {"$gte": start_dt, "$lte": end_dt}
    }))

    comments = [fb["comment"] for fb in same_date_feedbacks if fb.get("comment")]

    if not models_exist():
        return jsonify({
            "foodid": foodid,
            "last_served_date": latest_date_str,
            "num_feedbacks_analyzed": len(comments),
            "issues": {},
            "top_issues": [],
            "suggestion_paragraph": "ML model not trained yet. Run train_feedback_model.py."
        })

    labels_per_comment, _ = predict_labels_for_comments(comments)
    issue_counts, sorted_list = aggregate_labels_from_labellists(labels_per_comment)
    suggestion_text = combine_with_sentiment(issue_counts, comments)

    return jsonify({
        "foodid": foodid,
        "last_served_date": latest_date_str,
        "num_feedbacks_analyzed": len(comments),
        "issues": issue_counts,
        "top_issues": [issue for issue, count in sorted_list],
        "suggestion_paragraph": suggestion_text
    })


if __name__ == "__main__":
    if os.path.exists(TRAINER_PATH):
        print("✅ LBPH model loaded from trainer.yml")
    else:
        print("⚠️ No LBPH model yet. It will be created after first student registration.")
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
