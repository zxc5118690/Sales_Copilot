import argparse
import csv
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.exc import OperationalError

from app.db.session import SessionLocal
from app.models import Account, BANTScorecard, Contact, OutreachDraft, PainProfile, PipelineItem, SignalEvent
from app.services.bant_scorer import BANTScorerService
from app.services.interaction_logger import InteractionLoggerService
from app.services.market_radar import MarketRadarService, rank_signal_for_top20
from app.services.outreach_generator import OutreachGeneratorService
from app.services.pain_extractor import PainExtractorService
from app.services.pipeline_console import PipelineConsoleService
from app.services.utils import now_utc


def _print(data) -> None:
    print(json.dumps(data, ensure_ascii=True, indent=2, default=str))


def _backend_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _run_subprocess(cmd: list[str]) -> None:
    subprocess.run(cmd, cwd=_backend_root(), check=True)


def _account_to_dict(item: Account) -> dict:
    return {
        "account_id": item.id,
        "company_name": item.company_name,
        "segment": item.segment,
        "region": item.region,
        "website": item.website,
        "source": item.source,
        "priority_tier": item.priority_tier,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


def _contact_to_dict(item: Contact) -> dict:
    return {
        "contact_id": item.id,
        "account_id": item.account_id,
        "full_name": item.full_name,
        "role_title": item.role_title,
        "channel_email": item.channel_email,
        "channel_linkedin": item.channel_linkedin,
        "contactability_score": item.contactability_score,
        "created_at": item.created_at,
    }


def _parse_csv_accounts(file_path: str) -> list[dict]:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    records: list[dict] = []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {"company_name", "segment"}
        if not reader.fieldnames or not required.issubset(set(reader.fieldnames)):
            raise ValueError("CSV must include headers: company_name,segment")
        for row in reader:
            company_name = (row.get("company_name") or "").strip()
            segment = (row.get("segment") or "").strip().upper()
            if not company_name or not segment:
                continue
            records.append(
                {
                    "company_name": company_name,
                    "segment": segment,
                    "region": (row.get("region") or "").strip() or None,
                    "website": (row.get("website") or "").strip() or None,
                    "source": (row.get("source") or "").strip() or "csv_import",
                    "priority_tier": (row.get("priority_tier") or "").strip() or "T3",
                }
            )
    return records


def cmd_import_accounts(args: argparse.Namespace) -> None:
    records = _parse_csv_accounts(args.file)
    inserted = 0
    updated = 0
    with SessionLocal() as db:
        for rec in records:
            existing = db.execute(select(Account).where(Account.company_name == rec["company_name"])).scalar_one_or_none()
            if existing:
                existing.segment = rec["segment"]
                existing.region = rec["region"]
                existing.website = rec["website"]
                existing.source = rec["source"]
                existing.priority_tier = rec["priority_tier"]
                existing.updated_at = now_utc()
                updated += 1
                continue
            db.add(
                Account(
                    company_name=rec["company_name"],
                    segment=rec["segment"],
                    region=rec["region"],
                    website=rec["website"],
                    source=rec["source"],
                    priority_tier=rec["priority_tier"],
                    created_at=now_utc(),
                    updated_at=now_utc(),
                )
            )
            inserted += 1
        db.commit()
    _print({"status": "ok", "inserted": inserted, "updated": updated, "total_rows": len(records)})


def cmd_list_accounts(args: argparse.Namespace) -> None:
    with SessionLocal() as db:
        stmt = select(Account).order_by(Account.updated_at.desc())
        if args.segment:
            stmt = stmt.where(Account.segment == args.segment.upper())
        rows = db.execute(stmt.offset(args.offset).limit(args.limit)).scalars().all()
    _print({"status": "ok", "items": [_account_to_dict(item) for item in rows]})


def cmd_create_account(args: argparse.Namespace) -> None:
    with SessionLocal() as db:
        existing = db.execute(select(Account).where(Account.company_name == args.company_name)).scalar_one_or_none()
        if existing:
            raise ValueError(f"Account '{args.company_name}' already exists.")
        account = Account(
            company_name=args.company_name,
            segment=args.segment.upper(),
            region=args.region,
            website=args.website,
            source=args.source or "manual_cli",
            priority_tier=args.priority_tier or "T3",
            created_at=now_utc(),
            updated_at=now_utc(),
        )
        db.add(account)
        db.commit()
        db.refresh(account)
    _print({"status": "ok", "item": _account_to_dict(account)})


def cmd_update_account(args: argparse.Namespace) -> None:
    with SessionLocal() as db:
        account = db.get(Account, args.account)
        if not account:
            raise ValueError(f"Account {args.account} not found.")

        data = {
            "company_name": args.company_name,
            "segment": args.segment.upper() if args.segment else None,
            "region": args.region,
            "website": args.website,
            "source": args.source,
            "priority_tier": args.priority_tier,
        }
        updates = {k: v for k, v in data.items() if v is not None}
        if not updates:
            raise ValueError("No update fields provided.")

        if "company_name" in updates:
            dup = db.execute(select(Account).where(Account.company_name == updates["company_name"])).scalar_one_or_none()
            if dup and dup.id != account.id:
                raise ValueError(f"Account '{updates['company_name']}' already exists.")

        for key, value in updates.items():
            setattr(account, key, value)
        account.updated_at = now_utc()
        db.commit()
        db.refresh(account)
    _print({"status": "ok", "item": _account_to_dict(account)})


def cmd_delete_account(args: argparse.Namespace) -> None:
    with SessionLocal() as db:
        account = db.get(Account, args.account)
        if not account:
            raise ValueError(f"Account {args.account} not found.")
        contacts = db.execute(select(Contact).where(Contact.account_id == args.account)).scalars().all()
        if contacts and not args.force:
            raise ValueError("Account has contacts. Use --force to delete contacts first.")
        for contact in contacts:
            db.delete(contact)
        db.delete(account)
        db.commit()
    _print({"status": "ok", "deleted_account_id": args.account, "deleted_contacts": len(contacts)})


def cmd_init_db(args: argparse.Namespace) -> None:
    _run_subprocess([sys.executable, "-m", "alembic", "upgrade", "head"])
    if args.seed:
        _run_subprocess([sys.executable, "scripts/seed.py"])
    _print({"status": "ok", "database": "initialized", "seeded": bool(args.seed)})


def _account_ids_from_arg(db, account: str | None) -> list[int]:
    if account:
        if "," in account:
            return [int(part.strip()) for part in account.split(",") if part.strip()]
        return [int(account)]
    return [row.id for row in db.execute(select(Account).order_by(Account.id.asc())).scalars().all()]


def cmd_scan_signals(args: argparse.Namespace) -> None:
    service = MarketRadarService()
    with SessionLocal() as db:
        account_ids = _account_ids_from_arg(db, args.account)
        if not account_ids:
            raise ValueError("No accounts found. Import or seed accounts first.")
        events_created = service.scan(
            db=db,
            account_ids=account_ids,
            lookback_days=args.lookback,
            max_results_per_account=args.max_results,
            use_tavily=True,
        )
    _print({"status": "ok", "accounts_processed": len(account_ids), "events_written": events_created})


def cmd_generate_pains(args: argparse.Namespace) -> None:
    service = PainExtractorService()
    personas = [p.strip().upper() for p in args.personas.split(",") if p.strip()]
    with SessionLocal() as db:
        created_count, provider = service.generate(
            db=db,
            account_id=args.account,
            persona_targets=personas or ["RD", "NPI"],
            max_items=args.max_items,
        )
    _print({"status": "ok", "account_id": args.account, "created_count": created_count, "provider": provider})


def cmd_draft_outreach(args: argparse.Namespace) -> None:
    service = OutreachGeneratorService()
    providers = [p.strip().upper() for p in args.providers.split(",") if p.strip()]
    with SessionLocal() as db:
        draft, provider = service.generate(
            db=db,
            contact_id=args.contact,
            channel=args.channel,
            intent=args.intent,
            tone=args.tone,
            provider_preference=providers,
        )
    _print(
        {
            "status": "ok",
            "draft_id": draft.id,
            "contact_id": draft.contact_id,
            "channel": draft.channel,
            "intent": draft.intent,
            "provider": provider,
        }
    )


def cmd_log_interaction(args: argparse.Namespace) -> None:
    service = InteractionLoggerService()
    occurred_at = datetime.fromisoformat(args.occurred_at) if args.occurred_at else None
    with SessionLocal() as db:
        interaction, stage, account_id = service.log(
            db=db,
            contact_id=args.contact,
            channel=args.channel,
            direction=args.direction,
            content_summary=args.summary,
            sentiment=args.sentiment,
            raw_ref=args.raw_ref,
            occurred_at=occurred_at,
        )
    _print(
        {
            "status": "ok",
            "interaction_id": interaction.id,
            "account_id": account_id,
            "pipeline_stage": stage,
        }
    )


def cmd_score_bant(args: argparse.Namespace) -> None:
    service = BANTScorerService()
    with SessionLocal() as db:
        scorecard = service.score(db=db, account_id=args.account, lookback_days=args.lookback)
    _print(
        {
            "status": "ok",
            "scorecard_id": scorecard.id,
            "account_id": scorecard.account_id,
            "total_score": scorecard.total_score,
            "grade": scorecard.grade,
            "next_action": scorecard.recommended_next_action,
        }
    )


def cmd_pipeline_board(args: argparse.Namespace) -> None:
    service = PipelineConsoleService()
    with SessionLocal() as db:
        board = service.board(db=db)
    _print({"status": "ok", "items": board})


def cmd_weekly_report(args: argparse.Namespace) -> None:
    service = PipelineConsoleService()
    with SessionLocal() as db:
        report = service.weekly_report(db=db)
    _print({"status": "ok", **report})


def cmd_list_contacts(args: argparse.Namespace) -> None:
    with SessionLocal() as db:
        stmt = select(Contact).order_by(Contact.id.asc())
        if args.account is not None:
            stmt = stmt.where(Contact.account_id == args.account)
        rows = db.execute(stmt).scalars().all()
    _print({"status": "ok", "items": [_contact_to_dict(item) for item in rows]})


def cmd_create_contact(args: argparse.Namespace) -> None:
    with SessionLocal() as db:
        account = db.get(Account, args.account)
        if not account:
            raise ValueError(f"Account {args.account} not found.")
        contact = Contact(
            account_id=args.account,
            full_name=args.full_name,
            role_title=args.role_title,
            channel_email=args.email,
            channel_linkedin=args.linkedin,
            contactability_score=args.score,
            created_at=now_utc(),
        )
        db.add(contact)
        db.commit()
        db.refresh(contact)
    _print({"status": "ok", "item": _contact_to_dict(contact)})


def cmd_update_contact(args: argparse.Namespace) -> None:
    with SessionLocal() as db:
        contact = db.get(Contact, args.contact)
        if not contact:
            raise ValueError(f"Contact {args.contact} not found.")
        data = {
            "full_name": args.full_name,
            "role_title": args.role_title,
            "channel_email": args.email,
            "channel_linkedin": args.linkedin,
            "contactability_score": args.score,
        }
        updates = {k: v for k, v in data.items() if v is not None}
        if not updates:
            raise ValueError("No update fields provided.")
        for key, value in updates.items():
            setattr(contact, key, value)
        db.commit()
        db.refresh(contact)
    _print({"status": "ok", "item": _contact_to_dict(contact)})


def cmd_delete_contact(args: argparse.Namespace) -> None:
    with SessionLocal() as db:
        contact = db.get(Contact, args.contact)
        if not contact:
            raise ValueError(f"Contact {args.contact} not found.")
        db.delete(contact)
        db.commit()
    _print({"status": "ok", "deleted_contact_id": args.contact})


def _render_demo_report(
    account: Account,
    signals: list[SignalEvent],
    pains: list[PainProfile],
    latest_draft: OutreachDraft | None,
    latest_bant: BANTScorecard | None,
    pipeline: PipelineItem | None,
    weekly: dict,
) -> str:
    lines: list[str] = []
    lines.append(f"# AI Sales Copilot 示範報告 - {account.company_name}")
    lines.append("")
    lines.append("## 1. 帳戶快照 (Account Snapshot)")
    lines.append(f"- 帳戶編號 Account ID: {account.id}")
    lines.append(f"- 產品分群 Segment: {account.segment}")
    lines.append(f"- 優先級 Priority Tier: {account.priority_tier or 'N/A'}")
    lines.append(f"- 區域 Region: {account.region or 'N/A'}")
    lines.append("")
    lines.append("## 2. 市場雷達 (Market Radar)")
    if signals:
        for item in signals[:5]:
            published = item.source_published_at.isoformat() if item.source_published_at else "N/A"
            lines.append(
                f"- [{item.signal_type}] 分數 score={item.signal_strength} | 來源 source={item.source_name or 'unknown'} | 發布時間 published={published}"
            )
            lines.append(f"  摘要 summary: {item.summary}")
    else:
        lines.append("- 尚未找到市場訊號。")
    lines.append("")
    lines.append("## 3. 客戶痛點 (Pain Profiles)")
    if pains:
        for item in pains[:5]:
            lines.append(f"- 對象 persona={item.persona} | 信心值 confidence={item.confidence:.2f}")
            lines.append(f"  痛點 pain: {item.pain_statement}")
            lines.append(f"  影響 impact: {item.business_impact}")
    else:
        lines.append("- 尚未產出 pain profile。")
    lines.append("")
    lines.append("## 4. 開發訊息草稿 (Outreach Draft)")
    if latest_draft:
        lines.append(
            f"- 草稿編號 Draft ID: {latest_draft.id} | 渠道 channel={latest_draft.channel} | 模型 provider={latest_draft.model_provider}"
        )
        if latest_draft.subject:
            lines.append(f"- 主旨 Subject: {latest_draft.subject}")
        lines.append(f"- 行動呼籲 CTA: {latest_draft.cta}")
    else:
        lines.append("- 尚未找到草稿。")
    lines.append("")
    lines.append("## 5. 商機資格與管道 (Qualification & Pipeline)")
    if latest_bant:
        lines.append(
            f"- BANT 分數 Score: {latest_bant.total_score} | 等級 Grade: {latest_bant.grade} | 建議行動 Action: {latest_bant.recommended_next_action}"
        )
    else:
        lines.append("- 尚未找到 BANT 評分。")
    if pipeline:
        lines.append(
            f"- Pipeline 階段 Stage: {pipeline.stage} | 機率 Probability: {pipeline.probability:.2f} | 到期日 Due: {pipeline.due_date.isoformat()}"
        )
        lines.append(f"- 下一步 Next Action: {pipeline.next_action}")
    else:
        lines.append("- 尚未找到 pipeline 項目。")
    lines.append("")
    lines.append("## 6. 週指標 (Weekly KPI)")
    lines.append(f"- 外撥 Outbound: {weekly.get('outbound_count', 0)}")
    lines.append(f"- 回覆 Inbound: {weekly.get('inbound_count', 0)}")
    lines.append(f"- 觸及帳戶 Accounts Touched: {weekly.get('accounts_touched', 0)}")
    lines.append(f"- 草稿數 Drafts Created: {weekly.get('drafts_created', 0)}")
    lines.append(
        f"- BANT A/B/C 比例: {weekly.get('bant_a_count', 0)}/{weekly.get('bant_b_count', 0)}/{weekly.get('bant_c_count', 0)}"
    )
    lines.append("")
    lines.append("## 7. 建議行動 (Recommendation)")
    lines.append("- 建議每 3-7 天更新一次該帳戶的市場訊號。")
    lines.append("- 後續訊息應綁定最高優先痛點與 NPI 時程。")
    lines.append("- 若下次互動確認 authority 與 timeline，可直接觸發 Titan handoff。")
    lines.append("")
    return "\n".join(lines)


def cmd_demo_report(args: argparse.Namespace) -> None:
    with SessionLocal() as db:
        account = db.get(Account, args.account)
        if not account:
            raise ValueError(f"Account {args.account} not found.")

        signals = (
            db.execute(
                select(SignalEvent)
                .where(SignalEvent.account_id == args.account)
                .order_by(SignalEvent.fetched_at.desc())
            )
            .scalars()
            .all()
        )
        signals = sorted(signals, key=rank_signal_for_top20, reverse=True)[:20]
        pains = (
            db.execute(
                select(PainProfile)
                .where(PainProfile.account_id == args.account)
                .order_by(PainProfile.created_at.desc(), PainProfile.confidence.desc())
                .limit(20)
            )
            .scalars()
            .all()
        )
        latest_bant = (
            db.execute(
                select(BANTScorecard)
                .where(BANTScorecard.account_id == args.account)
                .order_by(BANTScorecard.created_at.desc())
                .limit(1)
            )
            .scalars()
            .first()
        )
        pipeline = (
            db.execute(
                select(PipelineItem)
                .where(PipelineItem.account_id == args.account)
                .order_by(PipelineItem.updated_at.desc())
                .limit(1)
            )
            .scalars()
            .first()
        )
        latest_draft = (
            db.execute(
                select(OutreachDraft)
                .join(Contact, Contact.id == OutreachDraft.contact_id)
                .where(Contact.account_id == args.account)
                .order_by(OutreachDraft.created_at.desc())
                .limit(1)
            )
            .scalars()
            .first()
        )
        weekly = PipelineConsoleService().weekly_report(db=db)

    content = _render_demo_report(
        account=account,
        signals=signals,
        pains=pains,
        latest_draft=latest_draft,
        latest_bant=latest_bant,
        pipeline=pipeline,
        weekly=weekly,
    )
    output_path = Path(args.output) if args.output else _backend_root() / "demo_reports" / f"account_{args.account}_demo.md"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(content, encoding="utf-8")
    _print({"status": "ok", "report_path": str(output_path)})


def cmd_run_e2e(args: argparse.Namespace) -> None:
    with SessionLocal() as db:
        account = db.get(Account, args.account)
        if not account:
            raise ValueError(f"Account {args.account} not found.")

        contact_id = args.contact
        if contact_id is None:
            first_contact = (
                db.execute(
                    select(Contact)
                    .where(Contact.account_id == args.account)
                    .order_by(Contact.id.asc())
                    .limit(1)
                )
                .scalars()
                .first()
            )
            if not first_contact:
                raise ValueError("No contact found for account. Provide --contact or create-contact first.")
            contact_id = first_contact.id
        else:
            contact = db.get(Contact, contact_id)
            if not contact:
                raise ValueError(f"Contact {contact_id} not found.")
            if contact.account_id != args.account:
                raise ValueError(f"Contact {contact_id} does not belong to account {args.account}.")

        radar = MarketRadarService()
        pain = PainExtractorService()
        outreach = OutreachGeneratorService()
        logger = InteractionLoggerService()
        bant = BANTScorerService()
        console = PipelineConsoleService()

        scan_events = radar.scan(
            db=db,
            account_ids=[args.account],
            lookback_days=args.lookback,
            max_results_per_account=args.max_results,
            use_tavily=True,
        )
        pain_count, pain_provider = pain.generate(
            db=db,
            account_id=args.account,
            persona_targets=[item.strip().upper() for item in args.personas.split(",") if item.strip()] or ["RD", "NPI"],
            max_items=args.max_items,
        )
        draft, draft_provider = outreach.generate(
            db=db,
            contact_id=contact_id,
            channel=args.channel,
            intent=args.intent,
            tone=args.tone,
            provider_preference=[item.strip().upper() for item in args.providers.split(",") if item.strip()],
        )
        interaction, stage, _ = logger.log(
            db=db,
            contact_id=contact_id,
            channel=args.interaction_channel,
            direction=args.direction,
            content_summary=args.summary,
            sentiment=args.sentiment,
            raw_ref=None,
            occurred_at=None,
        )
        scorecard = bant.score(db=db, account_id=args.account, lookback_days=args.lookback_bant)
        board = console.board(db=db)
        weekly = console.weekly_report(db=db)
        draft_id = draft.id
        interaction_id = interaction.id
        scorecard_id = scorecard.id
        scorecard_grade = scorecard.grade
        scorecard_total = scorecard.total_score
        pipeline_item = next((item for item in board if item["account_id"] == args.account), None)

    _print(
        {
            "status": "ok",
            "account_id": args.account,
            "contact_id": contact_id,
            "signals_written": scan_events,
            "pain_profiles_created": pain_count,
            "pain_provider": pain_provider,
            "outreach_draft_id": draft_id,
            "outreach_provider": draft_provider,
            "interaction_id": interaction_id,
            "post_interaction_stage": stage,
            "bant_scorecard_id": scorecard_id,
            "bant_grade": scorecard_grade,
            "bant_total_score": scorecard_total,
            "pipeline_item": pipeline_item,
            "weekly_report": weekly,
        }
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="copilot", description="AI Sales Copilot CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    p_import = sub.add_parser("import-accounts", help="Import or update accounts from CSV.")
    p_import.add_argument("--file", required=True, help="CSV path with company_name,segment,... columns")
    p_import.set_defaults(func=cmd_import_accounts)

    p_init = sub.add_parser("init-db", help="Initialize database schema and optional seed data.")
    p_init.add_argument("--seed", dest="seed", action="store_true", default=True)
    p_init.add_argument("--no-seed", dest="seed", action="store_false")
    p_init.set_defaults(func=cmd_init_db)

    p_list_accounts = sub.add_parser("list-accounts", help="List accounts.")
    p_list_accounts.add_argument("--segment", default=None)
    p_list_accounts.add_argument("--limit", type=int, default=50)
    p_list_accounts.add_argument("--offset", type=int, default=0)
    p_list_accounts.set_defaults(func=cmd_list_accounts)

    p_create_account = sub.add_parser("create-account", help="Create a single account.")
    p_create_account.add_argument("--company-name", required=True)
    p_create_account.add_argument("--segment", required=True)
    p_create_account.add_argument("--region", default=None)
    p_create_account.add_argument("--website", default=None)
    p_create_account.add_argument("--source", default=None)
    p_create_account.add_argument("--priority-tier", default="T3")
    p_create_account.set_defaults(func=cmd_create_account)

    p_update_account = sub.add_parser("update-account", help="Update account fields.")
    p_update_account.add_argument("--account", type=int, required=True)
    p_update_account.add_argument("--company-name", default=None)
    p_update_account.add_argument("--segment", default=None)
    p_update_account.add_argument("--region", default=None)
    p_update_account.add_argument("--website", default=None)
    p_update_account.add_argument("--source", default=None)
    p_update_account.add_argument("--priority-tier", default=None)
    p_update_account.set_defaults(func=cmd_update_account)

    p_delete_account = sub.add_parser("delete-account", help="Delete account. Use --force to delete child contacts.")
    p_delete_account.add_argument("--account", type=int, required=True)
    p_delete_account.add_argument("--force", action="store_true")
    p_delete_account.set_defaults(func=cmd_delete_account)

    p_scan = sub.add_parser("scan-signals", help="Run market radar scan via Tavily.")
    p_scan.add_argument("--account", default=None, help="Account id or comma-separated account ids. Default: all.")
    p_scan.add_argument("--lookback", type=int, default=90)
    p_scan.add_argument("--max-results", type=int, default=8)
    p_scan.set_defaults(func=cmd_scan_signals)

    p_pains = sub.add_parser("generate-pains", help="Generate pain profiles from signals.")
    p_pains.add_argument("--account", type=int, required=True)
    p_pains.add_argument("--personas", default="RD,NPI")
    p_pains.add_argument("--max-items", type=int, default=3)
    p_pains.set_defaults(func=cmd_generate_pains)

    p_draft = sub.add_parser("draft-outreach", help="Generate outreach draft for contact.")
    p_draft.add_argument("--contact", type=int, required=True)
    p_draft.add_argument("--channel", choices=["EMAIL", "LINKEDIN"], default="EMAIL")
    p_draft.add_argument("--intent", choices=["FIRST_TOUCH", "FOLLOW_UP", "REPLY"], default="FIRST_TOUCH")
    p_draft.add_argument("--tone", choices=["TECHNICAL", "CONSULTATIVE", "EXECUTIVE"], default="TECHNICAL")
    p_draft.add_argument("--providers", default="GEMINI,OPENAI")
    p_draft.set_defaults(func=cmd_draft_outreach)

    p_log = sub.add_parser("log-interaction", help="Log inbound/outbound interaction.")
    p_log.add_argument("--contact", type=int, required=True)
    p_log.add_argument("--channel", choices=["EMAIL", "LINKEDIN", "MEETING", "CALL"], required=True)
    p_log.add_argument("--direction", choices=["OUTBOUND", "INBOUND"], required=True)
    p_log.add_argument("--summary", required=True)
    p_log.add_argument("--sentiment", choices=["POSITIVE", "NEUTRAL", "NEGATIVE"], default=None)
    p_log.add_argument("--raw-ref", default=None)
    p_log.add_argument("--occurred-at", default=None, help="ISO8601 datetime")
    p_log.set_defaults(func=cmd_log_interaction)

    p_bant = sub.add_parser("score-bant", help="Generate BANT scorecard for account.")
    p_bant.add_argument("--account", type=int, required=True)
    p_bant.add_argument("--lookback", type=int, default=60)
    p_bant.set_defaults(func=cmd_score_bant)

    p_board = sub.add_parser("pipeline-board", help="Display pipeline board.")
    p_board.set_defaults(func=cmd_pipeline_board)

    p_weekly = sub.add_parser("weekly-report", help="Display weekly summary report.")
    p_weekly.set_defaults(func=cmd_weekly_report)

    p_contacts = sub.add_parser("list-contacts", help="List contacts and ids.")
    p_contacts.add_argument("--account", type=int, default=None)
    p_contacts.set_defaults(func=cmd_list_contacts)

    p_create_contact = sub.add_parser("create-contact", help="Create contact under account.")
    p_create_contact.add_argument("--account", type=int, required=True)
    p_create_contact.add_argument("--full-name", default=None)
    p_create_contact.add_argument("--role-title", default=None)
    p_create_contact.add_argument("--email", default=None)
    p_create_contact.add_argument("--linkedin", default=None)
    p_create_contact.add_argument("--score", type=int, default=None)
    p_create_contact.set_defaults(func=cmd_create_contact)

    p_update_contact = sub.add_parser("update-contact", help="Update contact fields.")
    p_update_contact.add_argument("--contact", type=int, required=True)
    p_update_contact.add_argument("--full-name", default=None)
    p_update_contact.add_argument("--role-title", default=None)
    p_update_contact.add_argument("--email", default=None)
    p_update_contact.add_argument("--linkedin", default=None)
    p_update_contact.add_argument("--score", type=int, default=None)
    p_update_contact.set_defaults(func=cmd_update_contact)

    p_delete_contact = sub.add_parser("delete-contact", help="Delete a contact.")
    p_delete_contact.add_argument("--contact", type=int, required=True)
    p_delete_contact.set_defaults(func=cmd_delete_contact)

    p_e2e = sub.add_parser("run-e2e", help="Run end-to-end flow for one account and contact.")
    p_e2e.add_argument("--account", type=int, required=True)
    p_e2e.add_argument("--contact", type=int, default=None)
    p_e2e.add_argument("--lookback", type=int, default=90)
    p_e2e.add_argument("--max-results", type=int, default=8)
    p_e2e.add_argument("--personas", default="RD,NPI")
    p_e2e.add_argument("--max-items", type=int, default=3)
    p_e2e.add_argument("--channel", choices=["EMAIL", "LINKEDIN"], default="EMAIL")
    p_e2e.add_argument("--intent", choices=["FIRST_TOUCH", "FOLLOW_UP", "REPLY"], default="FIRST_TOUCH")
    p_e2e.add_argument("--tone", choices=["TECHNICAL", "CONSULTATIVE", "EXECUTIVE"], default="TECHNICAL")
    p_e2e.add_argument("--providers", default="GEMINI,OPENAI")
    p_e2e.add_argument("--interaction-channel", choices=["EMAIL", "LINKEDIN", "MEETING", "CALL"], default="EMAIL")
    p_e2e.add_argument("--direction", choices=["OUTBOUND", "INBOUND"], default="INBOUND")
    p_e2e.add_argument("--sentiment", choices=["POSITIVE", "NEUTRAL", "NEGATIVE"], default="POSITIVE")
    p_e2e.add_argument(
        "--summary",
        default="Customer discusses capex, pilot timeline, and quality improvements for NPI.",
    )
    p_e2e.add_argument("--lookback-bant", type=int, default=60)
    p_e2e.set_defaults(func=cmd_run_e2e)

    p_demo = sub.add_parser("demo-report", help="Generate a markdown demo report for one account.")
    p_demo.add_argument("--account", type=int, required=True)
    p_demo.add_argument("--output", default=None, help="Output markdown file path")
    p_demo.set_defaults(func=cmd_demo_report)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    try:
        args.func(args)
    except OperationalError as exc:
        message = str(exc)
        if "no such table" in message:
            _print(
                {
                    "status": "error",
                    "detail": "Database schema is not initialized. Run: alembic upgrade head",
                    "next_step": "Then run: PYTHONPATH=. python scripts/seed.py",
                }
            )
            raise SystemExit(1) from exc
        _print({"status": "error", "detail": message})
        raise SystemExit(1) from exc
    except ValueError as exc:
        _print({"status": "error", "detail": str(exc)})
        raise SystemExit(1) from exc
    except Exception as exc:  # noqa: BLE001
        _print({"status": "error", "detail": str(exc)})
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
