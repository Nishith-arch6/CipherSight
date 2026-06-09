# seed_db.py
from app import app, db, Operator, AnalyticsLog

# Create the application context to interact with the database
with app.app_context():
    # 1. Create all the tables based on your models in app.py
    db.create_all()
    print("✅ Database tables created.")

    # 2. Seed the Operator Credentials (if they don't exist yet)
    if not Operator.query.filter_by(badge='ADMIN-X').first():
        admin = Operator(badge='ADMIN-X', passkey='root_cipher_zero', role='System Administrator', status='ACTIVE')
        cmd = Operator(badge='CMD-001', passkey='override_alpha', role='Dispatch Commander', status='ACTIVE')
        op = Operator(badge='OP-108', passkey='cipher2026', role='Grid Operator', status='ACTIVE')
        
        db.session.add(admin)
        db.session.add(cmd)
        db.session.add(op)
        print("✅ Operator credentials seeded.")

    # 3. Seed the Historical Analytics Data
    if AnalyticsLog.query.count() == 0:
        seed_data = [
            AnalyticsLog(time_label="00:00", response_time=6.5, congestion=10),
            AnalyticsLog(time_label="04:00", response_time=6.0, congestion=5),
            AnalyticsLog(time_label="08:00", response_time=14.2, congestion=85),
            AnalyticsLog(time_label="10:00", response_time=9.5, congestion=50),
            AnalyticsLog(time_label="12:00", response_time=8.5, congestion=40),
            AnalyticsLog(time_label="16:00", response_time=10.1, congestion=65),
            AnalyticsLog(time_label="18:00", response_time=15.5, congestion=90),
            AnalyticsLog(time_label="20:00", response_time=9.0, congestion=45),
            AnalyticsLog(time_label="23:00", response_time=7.2, congestion=20)
        ]
        db.session.bulk_save_objects(seed_data)
        print("✅ Historical analytics seeded.")

    # Save all changes to the database
    db.session.commit()
    print("🚀 Database is locked and loaded!")