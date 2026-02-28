import csv
import os
from pathlib import Path
from datetime import datetime
from app.models import Account
from app.services.utils import now_utc

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
CLIENTS_CSV = DATA_DIR / "clients.csv"

def get_accounts_from_csv():
    if not CLIENTS_CSV.exists():
        return []
    
    accounts = []
    with open(CLIENTS_CSV, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            accounts.append({
                "id": int(row["id"]),
                "company_name": row["company_name"],
                "segment": row["segment"],
                "region": row.get("region"),
                "website": row.get("website"),
                "source": row.get("source"),
                "priority_tier": row.get("priority_tier"),
                "created_at": datetime.now(), # Default for response
                "updated_at": datetime.now()
            })
    return accounts

def sync_csv_to_db(db):
    if not CLIENTS_CSV.exists():
        return
    
    with open(CLIENTS_CSV, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            acc_id = int(row["id"])
            existing = db.get(Account, acc_id)
            if existing:
                existing.company_name = row["company_name"]
                existing.segment = row["segment"].upper()
                existing.region = row.get("region")
                existing.website = row.get("website")
                existing.source = row.get("source")
                existing.priority_tier = row.get("priority_tier")
                existing.updated_at = now_utc()
            else:
                db.add(Account(
                    id=acc_id,
                    company_name=row["company_name"],
                    segment=row["segment"].upper(),
                    region=row.get("region"),
                    website=row.get("website"),
                    source=row.get("source"),
                    priority_tier=row.get("priority_tier"),
                    created_at=now_utc(),
                    updated_at=now_utc()
                ))
        db.commit()
