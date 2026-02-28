import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Account, Contact, OutreachDraft, PainProfile
from app.services.providers.llm import LLMRouter
from app.services.utils import extract_first_json_object, now_utc


class OutreachGeneratorService:
    def __init__(self) -> None:
        self.llm_router = LLMRouter()

    def _build_prompt(
        self,
        account: Account,
        contact: Contact,
        pains: list[PainProfile],
        channel: str,
        intent: str,
        tone: str,
    ) -> str:
        pain_payload = [
            {
                "persona": p.persona,
                "pain_statement": p.pain_statement,
                "business_impact": p.business_impact,
                "technical_anchor": p.technical_anchor,
            }
            for p in pains[:3]
        ]
        return (
            "請為 B2B 半導體設備與自動化解決方案產出開發訊息草稿（繁體中文為主，英文術語可保留）。\n"
            "回傳嚴格 JSON，欄位需包含: subject, body, cta。\n"
            f"Channel: {channel}; intent: {intent}; tone: {tone}。\n"
            f"Company: {account.company_name}; segment: {account.segment}。\n"
            f"Contact role: {contact.role_title or 'unknown'}。\n"
            f"Pain inputs: {json.dumps(pain_payload, ensure_ascii=True)}\n"
            "限制: 內容須真實、精簡、不虛構，並包含明確 CTA。"
        )

    def _fallback_content(self, channel: str, intent: str) -> dict:
        if channel == "LINKEDIN":
            return {
                "subject": None,
                "body": (
                    "您好，我們協助半導體製造團隊透過先進檢測設備與自動化解決方案提升良率與設備稼動率。"
                    "若您有興趣，我可以提供一份製程優化 benchmark checklist。"
                ),
                "cta": "下週是否方便安排 15 分鐘技術交流？",
            }
        subject = "半導體製程良率提升方案建議"
        if intent == "FOLLOW_UP":
            subject = "Follow-up：製程檢測與設備稼動率優化方案"
        return {
            "subject": subject,
            "body": (
                "我們協助晶圓製造與封測團隊，透過智慧化缺陷檢測與製程自動化整合提升良率穩定度與設備 OEE。"
                "依照貴司製程需求，可先從 in-line inspection 與設備預防性維護找到短期可落地的改善點。"
            ),
            "cta": "本週是否可安排 20 分鐘 technical discovery call？",
        }

    def generate(
        self,
        db: Session,
        contact_id: int,
        channel: str,
        intent: str,
        tone: str,
        provider_preference: list[str],
    ) -> tuple[OutreachDraft, str]:
        contact = db.get(Contact, contact_id)
        if not contact:
            raise ValueError(f"找不到聯絡人 Contact {contact_id}。")
        account = db.get(Account, contact.account_id)
        if not account:
            raise ValueError(f"找不到 Contact {contact_id} 對應的 account。")

        pains = (
            db.execute(
                select(PainProfile)
                .where(PainProfile.account_id == account.id)
                .order_by(PainProfile.confidence.desc(), PainProfile.created_at.desc())
            )
            .scalars()
            .all()
        )

        system_prompt = "你是 B2B 半導體設備與工廠自動化解決方案的技術型業務開發助手，熟悉台灣半導體產業生態系，請以繁體中文輸出。"
        user_prompt = self._build_prompt(
            account=account,
            contact=contact,
            pains=pains,
            channel=channel,
            intent=intent,
            tone=tone,
        )
        llm_result = self.llm_router.generate(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            preferred_order=provider_preference,
        )
        parsed = extract_first_json_object(llm_result.text)
        if not parsed:
            parsed = self._fallback_content(channel=channel, intent=intent)

        draft = OutreachDraft(
            contact_id=contact_id,
            channel=channel,
            intent=intent,
            subject=parsed.get("subject"),
            body=str(parsed.get("body", ""))[:4000] or self._fallback_content(channel, intent)["body"],
            cta=str(parsed.get("cta", ""))[:1000] or self._fallback_content(channel, intent)["cta"],
            tone=tone,
            model_provider=llm_result.provider,
            llm_latency_ms=llm_result.latency_ms,
            llm_token_usage=llm_result.token_usage,
            llm_fallback_used=1 if llm_result.fallback_used else 0,
            status="DRAFT",
            created_at=now_utc(),
        )
        db.add(draft)
        db.commit()
        db.refresh(draft)
        return draft, llm_result.provider
