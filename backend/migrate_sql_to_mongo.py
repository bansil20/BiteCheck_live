import os
import sys
import re
from datetime import datetime

backend_dir = r"f:\Microsoft Edge\mern work\BiteCheck_live\backend"
sys.path.insert(0, backend_dir)

from db_mongo import (
    db,
    users_col,
    students_col,
    foods_col,
    timetables_col,
    attendances_col,
    feedbacks_col,
    counters_col,
    init_db
)

def parse_sql_values(values_text):
    records = []
    i = 0
    n = len(values_text)
    
    while i < n:
        while i < n and values_text[i] != '(':
            i += 1
        if i >= n:
            break
        i += 1  # skip '('
        
        current_val = []
        current_record = []
        in_quotes = False
        escape = False
        
        while i < n:
            c = values_text[i]
            
            if escape:
                current_val.append(c)
                escape = False
                i += 1
                continue
                
            if c == '\\':
                escape = True
                i += 1
                continue
                
            if c == "'" and not in_quotes:
                in_quotes = True
                i += 1
                continue
            elif c == "'" and in_quotes:
                if i + 1 < n and values_text[i + 1] == "'":
                    current_val.append("'")
                    i += 2
                    continue
                else:
                    in_quotes = False
                    i += 1
                    continue
                    
            if c == ',' and not in_quotes:
                val = "".join(current_val).strip()
                current_record.append(val)
                current_val = []
                i += 1
                continue
                
            if c == ')' and not in_quotes:
                val = "".join(current_val).strip()
                current_record.append(val)
                records.append(current_record)
                i += 1
                break
                
            current_val.append(c)
            i += 1
            
    return records

def clean_val(v):
    if v is None:
        return None
    v = v.strip()
    if v.upper() == 'NULL':
        return None
    if v.startswith("'") and v.endswith("'"):
        v = v[1:-1]
    return v

def clean_int(v, default=0):
    cv = clean_val(v)
    if cv is None:
        return default
    try:
        return int(cv)
    except:
        return default

def clean_float(v, default=0.0):
    cv = clean_val(v)
    if cv is None:
        return default
    try:
        return float(cv)
    except:
        return default

def clean_date(v):
    cv = clean_val(v)
    if not cv:
        return None
    for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d"]:
        try:
            return datetime.strptime(cv, fmt)
        except ValueError:
            pass
    return cv

def migrate():
    sql_file = r"f:\Microsoft Edge\mern work\BiteCheck_live\database\bitecheck_latest23-08-26.sql"
    if not os.path.exists(sql_file):
        sql_file = r"f:\Microsoft Edge\mern work\BiteCheck_live\database\bitecheck.sql"

    print("Reading latest SQL dump from:", sql_file)
    with open(sql_file, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()

    print("Dropping old MongoDB collections to wipe past data...")
    for col_name in ["users", "students", "foods", "timetables", "attendances", "feedbacks", "counters"]:
        db[col_name].drop()

    user_count = 0
    student_count = 0
    food_count = 0
    tt_count = 0
    att_count = 0
    fb_count = 0

    max_userid = 0
    max_studid = 0
    max_foodid = 0
    max_ttid = 0
    max_attid = 0
    max_fbid = 0

    i = 0
    n = len(lines)
    while i < n:
        line = lines[i].strip()
        
        if line.startswith("INSERT INTO"):
            # Determine which table
            tbl_match = re.search(r"INSERT\s+INTO\s+[`\"]?([a-zA-Z0-9_]+)[`\"]?\s*\((.*?)\)\s*VALUES", line, re.IGNORECASE)
            if not tbl_match:
                # might span multiple lines for definition
                def_line = line
                while i + 1 < n and "VALUES" not in def_line:
                    i += 1
                    def_line += " " + lines[i].strip()
                tbl_match = re.search(r"INSERT\s+INTO\s+[`\"]?([a-zA-Z0-9_]+)[`\"]?\s*\((.*?)\)\s*VALUES", def_line, re.IGNORECASE)

            if tbl_match:
                tbl_name = tbl_match.group(1).lower()
                cols_str = tbl_match.group(2)
                cols = [c.strip(" `\"") for c in cols_str.split(',')]
                
                # Gather all value lines until statement terminates with ';'
                val_lines = []
                while i + 1 < n:
                    i += 1
                    curr = lines[i].strip()
                    if not curr or curr.startswith("--"):
                        continue
                    val_lines.append(curr)
                    if curr.endswith(";"):
                        break
                
                full_val_text = "\n".join(val_lines).rstrip(';')
                rows = parse_sql_values(full_val_text)
                
                for row in rows:
                    if len(row) == len(cols):
                        rec = dict(zip(cols, row))
                        
                        if tbl_name == "user":
                            uid = clean_int(rec.get("userid"))
                            max_userid = max(max_userid, uid)
                            users_col.insert_one({
                                "userid": uid,
                                "username": clean_val(rec.get("username")),
                                "password": clean_val(rec.get("password")),
                                "email": clean_val(rec.get("email"))
                            })
                            user_count += 1
                            
                        elif tbl_name == "student":
                            import json as json_lib
                            sid = clean_int(rec.get("studid"))
                            max_studid = max(max_studid, sid)
                            pnr = clean_val(rec.get("studpnr"))
                            name = clean_val(rec.get("studname"))
                            raw_face = clean_val(rec.get("studface"))
                            try:
                                face_obj = json_lib.loads(raw_face) if raw_face else {}
                            except Exception:
                                face_obj = {"base64": raw_face} if raw_face and raw_face.startswith("data:image") else {}

                            students_col.insert_one({
                                "studid": sid,
                                "name": name,
                                "studname": name,
                                "enrollment_no": pnr,
                                "studpnr": pnr,
                                "phone": clean_val(rec.get("studphone")),
                                "course": clean_val(rec.get("studcourse")),
                                "email": clean_val(rec.get("studemail")),
                                "remark": clean_val(rec.get("studremark")),
                                "hostel_room": clean_val(rec.get("studhostelroom")),
                                "blood_group": clean_val(rec.get("studbloodgrp")),
                                "secret_code": clean_val(rec.get("studsecretcode")),
                                "photos": raw_face,
                                "studface": face_obj,
                                "face": face_obj
                            })
                            student_count += 1
                            
                        elif tbl_name == "food":
                            fid = clean_int(rec.get("foodid"))
                            max_foodid = max(max_foodid, fid)
                            foods_col.insert_one({
                                "foodid": fid,
                                "foodname": clean_val(rec.get("foodname")),
                                "fooddescription": clean_val(rec.get("fooddescription")),
                                "foodimage": clean_val(rec.get("foodimage"))
                            })
                            food_count += 1
                            
                        elif tbl_name == "timetable":
                            tid = clean_int(rec.get("ttid"))
                            max_ttid = max(max_ttid, tid)
                            timetables_col.insert_one({
                                "ttid": tid,
                                "foodid": clean_int(rec.get("foodid")),
                                "day": clean_val(rec.get("day")),
                                "mealtype": clean_val(rec.get("mealtype"))
                            })
                            tt_count += 1
                            
                        elif tbl_name == "attendance":
                            aid = clean_int(rec.get("attid"))
                            max_attid = max(max_attid, aid)
                            attendances_col.insert_one({
                                "attid": aid,
                                "studid": clean_int(rec.get("studid")),
                                "student_id": clean_int(rec.get("studid")),
                                "timestamp": clean_date(rec.get("timestamp")),
                                "status": clean_val(rec.get("status")),
                                "food_id": clean_int(rec.get("food_id"))
                            })
                            att_count += 1
                            
                        elif tbl_name == "feedback":
                            fbid = clean_int(rec.get("fbid"))
                            max_fbid = max(max_fbid, fbid)
                            feedbacks_col.insert_one({
                                "fbid": fbid,
                                "foodid": clean_int(rec.get("foodid")),
                                "studentname": clean_val(rec.get("studentname")),
                                "rating": clean_float(rec.get("rating")),
                                "comment": clean_val(rec.get("comment")),
                                "eat_again": clean_val(rec.get("eat_again")),
                                "created_at": clean_date(rec.get("created_at"))
                            })
                            fb_count += 1
        i += 1

    # Initialize counters for sequence IDs
    counters_col.insert_many([
        {"_id": "userid", "seq": max_userid},
        {"_id": "studid", "seq": max_studid},
        {"_id": "foodid", "seq": max_foodid},
        {"_id": "ttid", "seq": max_ttid},
        {"_id": "attid", "seq": max_attid},
        {"_id": "fbid", "seq": max_fbid}
    ])

    init_db()

    print("\n==========================================")
    print("  SQL TO MONGODB FULL MIGRATION COMPLETE")
    print("==========================================")
    print(f"Users migrated:       {user_count}")
    print(f"Students migrated:    {student_count}")
    print(f"Foods migrated:       {food_count}")
    print(f"Timetable slots:      {tt_count}")
    print(f"Attendance records:   {att_count}")
    print(f"Feedback records:     {fb_count}")

if __name__ == "__main__":
    migrate()
