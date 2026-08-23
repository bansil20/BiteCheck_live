import os
import sys
from pymongo import MongoClient, ReturnDocument, ASCENDING
from dotenv import load_dotenv
import pytz

# Ensure UTF-8 output encoding for Windows consoles
try:
    if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception:
    pass

ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=ENV_PATH)

IST = pytz.timezone("Asia/Kolkata")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/bitecheck")
client = MongoClient(MONGO_URI)

# Get database name from URI or default to 'bitecheck'
try:
    default_db_name = client.get_default_database().name
except Exception:
    default_db_name = "bitecheck"

db = client[default_db_name]

# Collections
users_col = db["users"]
students_col = db["students"]
foods_col = db["foods"]
timetables_col = db["timetables"]
attendances_col = db["attendances"]
feedbacks_col = db["feedbacks"]
counters_col = db["counters"]


def get_next_sequence_value(sequence_name: str) -> int:
    """
    Generate atomic auto-increment integer ID for collections
    (preserves compatibility with OpenCV LBPH and frontend integer expectations).
    """
    counter = counters_col.find_one_and_update(
        {"_id": sequence_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    return int(counter["seq"])


def init_db():
    """Create indexes and initialize counters if needed."""
    try:
        users_col.create_index([("email", ASCENDING)], unique=True)
        users_col.create_index([("userid", ASCENDING)], unique=True)

        students_col.create_index([("studid", ASCENDING)], unique=True)
        students_col.create_index([("enrollment_no", ASCENDING)], unique=True, sparse=True)

        foods_col.create_index([("foodid", ASCENDING)], unique=True)
        timetables_col.create_index([("ttid", ASCENDING)], unique=True)
        attendances_col.create_index([("attid", ASCENDING)], unique=True)
        attendances_col.create_index([("studid", ASCENDING)])
        attendances_col.create_index([("food_id", ASCENDING)])
        attendances_col.create_index([("timestamp", ASCENDING)])

        feedbacks_col.create_index([("fbid", ASCENDING)], unique=True)
        feedbacks_col.create_index([("foodid", ASCENDING)])
        feedbacks_col.create_index([("created_at", ASCENDING)])

        # Initialize sequence counters from max IDs if not already initialized
        init_counters()
        print("[SUCCESS] MongoDB collections & indexes initialized successfully.")
    except Exception as e:
        print(f"[WARNING] MongoDB init error: {e}")


def init_counters():
    """Ensure counters have at least the current max ID in collections."""
    for seq_name, col, id_field in [
        ("userid", users_col, "userid"),
        ("studid", students_col, "studid"),
        ("foodid", foods_col, "foodid"),
        ("ttid", timetables_col, "ttid"),
        ("attid", attendances_col, "attid"),
        ("fbid", feedbacks_col, "fbid"),
    ]:
        max_doc = col.find_one(sort=[(id_field, -1)])
        max_id = max_doc[id_field] if max_doc and id_field in max_doc and isinstance(max_doc[id_field], int) else 0
        existing_counter = counters_col.find_one({"_id": seq_name})
        if not existing_counter or existing_counter.get("seq", 0) < max_id:
            counters_col.update_one(
                {"_id": seq_name},
                {"$set": {"seq": max_id}},
                upsert=True
            )
