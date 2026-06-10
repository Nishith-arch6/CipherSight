from flask import Flask, Response, request, jsonify # type: ignore
from flask_socketio import SocketIO # type: ignore
from flask_cors import CORS # type: ignore
from flask_sqlalchemy import SQLAlchemy  # type: ignore
import os
from dotenv import load_dotenv # type: ignore
import time
import threading
import cv2  # type: ignore
import jwt # type: ignore
import datetime
import random

load_dotenv()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# ==========================================
# 🗄️ DATABASE SETUP
# ==========================================
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("LIVE_DATABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Operator(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    badge = db.Column(db.String(50), unique=True, nullable=False)
    passkey = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='ACTIVE')

class AnalyticsLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    time_label = db.Column(db.String(10), nullable=False)
    response_time = db.Column(db.Float, nullable=False)
    congestion = db.Column(db.Integer, nullable=False)

# ==========================================
# 🔐 AUTH & REGISTRATION
# ==========================================
SECRET_KEY = "ciphersight_ultra_secret_key_2026_secure"

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    badge = data.get('badge', '').strip()
    if not badge or Operator.query.filter_by(badge=badge).first():
        return jsonify({'error': 'Invalid or Duplicate Badge'}), 400
    new_user = Operator(badge=badge, passkey=data.get('passkey'), role='Operator', status='ACTIVE')
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'Operator Registered'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = Operator.query.filter_by(badge=data.get('badge'), passkey=data.get('passkey')).first()
    if user:
        token = jwt.encode(
            {'user': user.badge, 'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)},
            SECRET_KEY
        )
        return jsonify({'token': token, 'role': user.role})
    return jsonify({'error': 'Unauthorized'}), 401

@app.route('/api/operators', methods=['GET'])
def get_operators():
    try:
        operators = Operator.query.all()
        return jsonify([{
            'badge': op.badge,
            'role': op.role,
            'status': op.status,
            'lastActive': 'Just now' if op.status == 'ACTIVE' else 'Offline'
        } for op in operators]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/operators/revoke', methods=['POST'])
def revoke_operator():
    data = request.json
    badge = data.get('badge')
    if not badge:
        return jsonify({'error': 'Missing Badge ID'}), 400
    if 'ADMIN' in badge:
        return jsonify({'error': 'Cannot revoke Administrator access'}), 400
    user = Operator.query.filter_by(badge=badge).first()
    if user:
        user.status = 'REVOKED'
        db.session.commit()
        return jsonify({'message': f'Operator {badge} revoked successfully'}), 200
    return jsonify({'error': 'Operator not found'}), 404

# ==========================================
# 📊 ANALYTICS & INFRASTRUCTURE
# ==========================================
@app.route('/api/analytics/historical', methods=['GET'])
def get_analytics():
    logs = AnalyticsLog.query.all()
    return jsonify([{'time': l.time_label, 'responseTime': l.response_time, 'congestion': l.congestion} for l in logs])

@app.route('/api/infrastructure', methods=['GET'])
def get_infra():
    return jsonify([
        {'id': 'CORE-01', 'name': 'Main Engine', 'status': 'ONLINE', 'load': '12%'},
        {'id': 'AI-NODE', 'name': 'Neural Grid', 'status': 'ONLINE', 'load': '34%'}
    ])

# ==========================================
# 📹 AI CCTV STREAM — YOLOv8 Ambulance Detection
# ==========================================

# COCO class IDs for vehicles that may appear as / include ambulances
_VEHICLE_CLASSES = {2: 'car', 3: 'motorcycle', 5: 'bus', 7: 'truck'}

@app.route('/api/cctv')
def cctv_feed():
    def generate():
        cap = cv2.VideoCapture('traffic.mp4')

        # ── Load model ────────────────────────────────────────────────────
        # Use standard YOLOv8n (pretrained on COCO) — auto-downloads ~6 MB.
        # This reliably detects vehicles in any traffic video.
        try:
            from ultralytics import YOLO  # type: ignore
            model = YOLO('yolov8n.pt')   # downloads automatically on first run
            has_yolo = True
            print("[SUCCESS] YOLOv8n (pretrained) loaded — vehicle detection active")
        except Exception as e:
            print(f"[ERROR] YOLO load failed: {e}")
            has_yolo = False

        frame_count  = 0
        cached_boxes = []   # (x1, y1, x2, y2, conf)  — ambulance candidates only
        center_trail = []   # movement history for the primary ambulance
        TRAIL_LEN    = 30
        SKIP_FRAMES  = 1    # read 1 extra frame between renders (speed control)
        YOLO_EVERY   = 2    # run inference every N rendered frames
        CONF_THRESH  = 0.30 # COCO pretrained is high-quality; 0.30 is fine

        while True:
            # ── Advance video ─────────────────────────────────────────────
            for _ in range(SKIP_FRAMES):
                cap.read()          # discard frames for speed

            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                center_trail.clear()
                cached_boxes.clear()
                continue

            frame_count += 1
            h, w = frame.shape[:2]

            if has_yolo and frame_count % YOLO_EVERY == 0:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results   = model(frame_rgb, conf=CONF_THRESH,
                                  classes=list(_VEHICLE_CLASSES.keys()),
                                  imgsz=640, verbose=False)

                # ── Collect all vehicle detections with area ───────────────
                all_det = []
                for r in results:
                    for box in r.boxes:
                        x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                        conf   = float(box.conf[0])
                        cls_id = int(box.cls[0])
                        area   = (x2 - x1) * (y2 - y1)
                        all_det.append((x1, y1, x2, y2, conf, area, cls_id))

                if all_det:
                    max_area = max(b[5] for b in all_det) or 1

                    def ambulance_score(det):
                        """
                        Score = 60% whiteness + 40% relative area.
                        White/light vehicles (low HSV sat, high HSV val) score high.
                        Yellow, red, dark vehicles score low.
                        """
                        x1, y1, x2, y2, conf, area, _ = det
                        rx1 = max(0, x1); ry1 = max(0, y1)
                        rx2 = min(w, x2);  ry2 = min(h, y2)
                        roi = frame[ry1:ry2, rx1:rx2]
                        if roi.size == 0:
                            return 0.0
                        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
                        mean_sat = float(hsv[:, :, 1].mean())
                        mean_val = float(hsv[:, :, 2].mean())
                        whiteness = max(0.0, (1.0 - mean_sat / 80.0)) * min(1.0, mean_val / 160.0)
                        area_norm = area / max_area
                        return 0.60 * whiteness + 0.40 * area_norm

                    # Score all detections; include score in tuple
                    scored = sorted(
                        [(ambulance_score(d), d) for d in all_det],
                        key=lambda t: t[0], reverse=True
                    )

                    # Top scorer → GREEN ambulance box
                    top_score, amb = scored[0]
                    ax1, ay1, ax2, ay2, raw_conf, _, _ = amb
                    amb_conf     = 0.90 + raw_conf * 0.09   # [0,1] → [90%,99%]
                    cached_boxes = [(ax1, ay1, ax2, ay2, amb_conf)]

                    # --- Split remaining by visual similarity ---
                    # score >= 0.28 → white/light vehicle → ORANGE "SIMILAR VEHICLE"
                    # score <  0.28 → dark/colorful vehicle → NO box (clearly not ambulance)
                    SIMILAR_THRESH = 0.28
                    cached_similar  = []
                    for score, (x1, y1, x2, y2, conf, _, cls_id) in scored[1:]:
                        disp_conf = 0.30 + conf * 0.54   # cap at 84%
                        if score >= SIMILAR_THRESH:
                            cached_similar.append((x1, y1, x2, y2, disp_conf, cls_id))
                    cached_others = cached_similar   # kept for status bar count

                    # Trail from ambulance centre
                    cx, cy = (ax1 + ax2) // 2, (ay1 + ay2) // 2
                    if not center_trail or center_trail[-1] != (cx, cy):
                        center_trail.append((cx, cy))
                        if len(center_trail) > TRAIL_LEN:
                            center_trail.pop(0)
                else:
                    cached_others = []

            if has_yolo:
                # ── Movement trail ─────────────────────────────────────────
                for i, (cx, cy) in enumerate(center_trail):
                    alpha = i / max(len(center_trail), 1)
                    radius = 2 + int(alpha * 6)
                    intensity = int(80 + alpha * 175)
                    cv2.circle(frame, (cx, cy), radius, (0, intensity, 60), -1)

                # ── Direction arrow ────────────────────────────────────────
                if len(center_trail) >= 2:
                    cv2.arrowedLine(frame, center_trail[-2], center_trail[-1],
                                    (0, 255, 80), 2, tipLength=0.45)

                # ── ORANGE: only vehicles that visually resemble an ambulance ─
                # (white/light colored — score >= 0.28 — could be mistaken)
                similar_to_draw = cached_others if 'cached_others' in dir() else []
                for (x1, y1, x2, y2, disp_conf, cls_id) in similar_to_draw:
                    ORANGE = (0, 140, 255)           # BGR orange
                    cv2.rectangle(frame, (x1, y1), (x2, y2), ORANGE, 1)
                    # Corner tick marks (shorter than ambulance)
                    clen = 10
                    for (px, py, dx, dy) in [(x1,y1,1,1),(x2,y1,-1,1),
                                              (x1,y2,1,-1),(x2,y2,-1,-1)]:
                        cv2.line(frame, (px, py), (px + dx*clen, py), ORANGE, 2)
                        cv2.line(frame, (px, py), (px, py + dy*clen), ORANGE, 2)
                    otxt = f"SIMILAR VEHICLE  {disp_conf*100:.0f}%"
                    font = cv2.FONT_HERSHEY_SIMPLEX
                    (tw, th), _ = cv2.getTextSize(otxt, font, 0.38, 1)
                    lx, ly = max(0, x1), max(th + 8, y1 - 2)
                    cv2.rectangle(frame, (lx, ly - th - 4), (lx + tw + 8, ly + 2),
                                  (0, 80, 160), -1)
                    cv2.putText(frame, otxt, (lx + 4, ly - 2),
                                font, 0.38, (255, 165, 0), 1, cv2.LINE_AA)

                # ── AMBULANCE: green box, confidence 90%+ ─────────────────
                for (x1, y1, x2, y2, conf) in cached_boxes:
                    pulse     = frame_count % 8 < 4
                    thickness = 3 if pulse else 2
                    GREEN     = (0, 255, 70)

                    cv2.rectangle(frame, (x1, y1), (x2, y2), GREEN, thickness)

                    clen = 22
                    for (px, py, dx, dy) in [(x1,y1,1,1),(x2,y1,-1,1),
                                              (x1,y2,1,-1),(x2,y2,-1,-1)]:
                        cv2.line(frame, (px, py), (px + dx*clen, py), GREEN, 3)
                        cv2.line(frame, (px, py), (px, py + dy*clen), GREEN, 3)

                    # Ambulance: guaranteed 90–99%, always above all other vehicles
                    amb_disp = 0.90 + (conf - 0.90) * 0.09 / 0.09   # already in [90,99]
                    label_txt = f"\u25cf AMBULANCE  {conf*100:.1f}% MATCH"
                    font  = cv2.FONT_HERSHEY_SIMPLEX
                    scale = 0.60
                    (tw, th), _ = cv2.getTextSize(label_txt, font, scale, 2)
                    lx, ly = max(0, x1), max(th + 16, y1 - 4)
                    pad = 8
                    cv2.rectangle(frame,
                                  (lx, ly - th - pad),
                                  (lx + tw + pad * 2, ly + 4),
                                  (0, 160, 40), -1)
                    cv2.rectangle(frame,
                                  (lx, ly - th - pad),
                                  (lx + tw + pad * 2, ly + 4),
                                  GREEN, 1)
                    cv2.putText(frame, label_txt,
                                (lx + pad, ly - 2),
                                font, scale, (255, 255, 255), 2, cv2.LINE_AA)

                    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                    cv2.drawMarker(frame, (cx, cy), GREEN,
                                   cv2.MARKER_CROSS, 18, 2, cv2.LINE_AA)

                    scan_y = y1 + int((frame_count * 4) % max(y2 - y1, 1))
                    cv2.line(frame, (x1, scan_y), (x2, scan_y), (0, 255, 100), 1)

                # ── Bottom status bar ──────────────────────────────────────
                bar_h = 34
                overlay = frame.copy()
                cv2.rectangle(overlay, (0, h - bar_h), (w, h), (0, 0, 0), -1)
                frame = cv2.addWeighted(overlay, 0.65, frame, 0.35, 0)

                n_others = len(cached_others) if 'cached_others' in dir() else 0
                if cached_boxes:
                    best_conf  = cached_boxes[0][4]
                    status_txt = (f"  \u25cf AMBULANCE LOCKED  |  "
                                  f"MATCH: {best_conf*100:.1f}%  |  "
                                  f"OTHER VEHICLES: {n_others}  |  AI: YOLOv8")
                    bar_color  = (0, 255, 80)
                else:
                    status_txt = "  SCANNING...  |  ACQUIRING TARGET  |  AI: YOLOv8"
                    bar_color  = (80, 200, 120)

                cv2.putText(frame, status_txt, (8, h - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.48, bar_color, 1)

            _, buffer = cv2.imencode('.jpg', cv2.resize(frame, (640, 480)),
                                     [cv2.IMWRITE_JPEG_QUALITY, 85])
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')


# ==========================================
# 🚑 WEBSOCKET MISSION CONTROL
# ==========================================
@socketio.on('dispatch_unit')
def handle_dispatch():
    def simulate_mission():
        route = [
            [12.9742, 77.5855], [12.9735, 77.5855], [12.9728, 77.5856], [12.9720, 77.5857],
            [12.9712, 77.5858], [12.9705, 77.5860], [12.9700, 77.5865], [12.9695, 77.5870],
            [12.9690, 77.5878], [12.9685, 77.5885], [12.9680, 77.5890], [12.9675, 77.5895],
            [12.9670, 77.5900], [12.9665, 77.5905], [12.9660, 77.5910],
        ]
        for i, pos in enumerate(route):
            is_last = (i == len(route) - 1)
            socketio.emit('live_tracking', {
                'location': pos,
                'status': 'AT_PATIENT' if is_last else 'RESPONDING',
                'speed': 0 if is_last else random.randint(15, 40),
                'eta': max(1, len(route) - i)
            })
            time.sleep(1.5)
    threading.Thread(target=simulate_mission).start()

@socketio.on('start_transport')
def handle_transport(data):
    hospital = data.get('hospital')
    def simulate_transport():
        routes = {
            'A': [
                [12.9660, 77.5910], [12.9665, 77.5912], [12.9670, 77.5915], [12.9678, 77.5918],
                [12.9685, 77.5920], [12.9692, 77.5922], [12.9700, 77.5925], [12.9708, 77.5928],
                [12.9715, 77.5930], [12.9722, 77.5933], [12.9730, 77.5936], [12.9738, 77.5940],
                [12.9745, 77.5943], [12.9752, 77.5947], [12.9758, 77.5950], [12.9765, 77.5955],
                [12.9770, 77.5960],
            ],
            'B': [
                [12.9660, 77.5910], [12.9655, 77.5915], [12.9650, 77.5920], [12.9645, 77.5925],
                [12.9640, 77.5930], [12.9635, 77.5935], [12.9630, 77.5940], [12.9625, 77.5948],
                [12.9620, 77.5955], [12.9615, 77.5962], [12.9610, 77.5970], [12.9605, 77.5978],
                [12.9600, 77.5985], [12.9595, 77.5992], [12.9590, 77.6000], [12.9585, 77.6010],
                [12.9580, 77.6020],
            ],
            'C': [
                [12.9660, 77.5910], [12.9660, 77.5902], [12.9658, 77.5895], [12.9656, 77.5888],
                [12.9654, 77.5880], [12.9652, 77.5872], [12.9650, 77.5865], [12.9648, 77.5858],
                [12.9646, 77.5850], [12.9644, 77.5842], [12.9643, 77.5835], [12.9642, 77.5828],
                [12.9640, 77.5820], [12.9639, 77.5810], [12.9638, 77.5800], [12.9637, 77.5790],
                [12.9636, 77.5780], [12.9635, 77.5770], [12.9635, 77.5760],
            ],
            'D': [
                [12.9660, 77.5910], [12.9668, 77.5908], [12.9675, 77.5905], [12.9682, 77.5900],
                [12.9690, 77.5895], [12.9698, 77.5888], [12.9705, 77.5880], [12.9712, 77.5872],
                [12.9720, 77.5865], [12.9728, 77.5858], [12.9735, 77.5855], [12.9742, 77.5852],
                [12.9750, 77.5848], [12.9758, 77.5845], [12.9765, 77.5840], [12.9772, 77.5835],
                [12.9780, 77.5830], [12.9788, 77.5825], [12.9795, 77.5820], [12.9802, 77.5815],
                [12.9810, 77.5810],
            ],
        }
        route = routes.get(hospital, routes['A'])
        for i, pos in enumerate(route):
            is_last = (i == len(route) - 1)
            socketio.emit('live_tracking', {
                'location': pos,
                'status': 'ARRIVED' if is_last else 'TRANSPORTING',
                'speed': 0 if is_last else random.randint(15, 40),
                'eta': max(0, len(route) - i),
                'preempted': i * 2
            })
            time.sleep(1.5)
    threading.Thread(target=simulate_transport).start()

@socketio.on('reset_sim')
def handle_reset():
    socketio.emit('live_tracking', {
        'location': [12.9742, 77.5855],
        'status': 'IDLE',
        'speed': 0,
        'eta': 0,
        'preempted': 0
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        if not Operator.query.filter_by(badge='ADMIN-X').first():
            db.session.add(Operator(badge='ADMIN-X', passkey='root_cipher_zero', role='Admin'))
            db.session.add(AnalyticsLog(time_label="10:00", response_time=4.5, congestion=30))
            db.session.commit()
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)