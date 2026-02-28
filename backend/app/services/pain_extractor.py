import json
from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Account, PainProfile, SignalEvent
from app.services.providers.llm import LLMRouter
from app.services.utils import extract_first_json_object, now_utc


class PainExtractorService:
    def __init__(self) -> None:
        self.llm_router = LLMRouter()

    def _build_prompt(
        self,
        account: Account,
        signals: list[SignalEvent],
        persona_targets: list[str],
        max_items: int,
        user_annotations: dict[str, str] | None = None,
        is_hitl: bool = False,
        knowledge_context: str | None = None,
    ) -> str:
        signal_lines = [
            {
                "signal_id": s.id,
                "signal_type": s.signal_type,
                "signal_strength": s.signal_strength,
                "summary": s.summary,
                "source": s.source_name,
                "evidence_url": s.evidence_url,
                "event_date": s.event_date.isoformat() if s.event_date else None,
                # 附加業務員備註（若有）
                **({
                    "salesperson_note": user_annotations[str(s.id)]
                } if user_annotations and str(s.id) in user_annotations else {}),
            }
            for s in signals[:8]
        ]

        hitl_instruction = (
            "【重要】以下訊號均已由業務人員人工確認為高度相關。"
            " 你必須且只能引用這些訊號，絕對不可創造或推測額外事實。"
            " 若訊號附有 salesperson_note，請將其納入 reasoning 的考量。\n"
        ) if is_hitl else ""

        kb_section = f"\n{knowledge_context}\n" if knowledge_context else ""

        return (
            f"{hitl_instruction}"
            f"{kb_section}"
            "請為 B2B 技術型開發產出 pain profile（繁體中文為主，英文術語可保留）。\n"
            "回傳嚴格 JSON，根節點為 'items' 陣列。\n"
            "每筆 item 必須包含: persona, pain_statement, business_impact, technical_anchor, confidence, evidence_signal_ids, reasoning。\n"
            "evidence_signal_ids 必須是陣列，且只能引用上述訊號中的 signal_id（至少 1 個、最多 3 個）。\n"
            "reasoning 需簡短說明「訊號 -> 痛點」的推論鏈。\n"
            "confidence 必須在 0 到 1 之間。\n"
            "若訊號證據不足，請降低 confidence，不可虛構事實。\n"
            f"最多 {max_items} 筆。\n"
            f"目標 persona: {', '.join(persona_targets)}。\n"
            f"公司: {account.company_name}, segment: {account.segment}。\n"
            f"訊號: {json.dumps(signal_lines, ensure_ascii=True)}"
        )

    def _fallback_items(self, persona_targets: list[str], max_items: int, default_signal_ids: list[int]) -> list[dict]:
        items = []
        primary_signal_ids = default_signal_ids[:1]
        for persona in persona_targets[:max_items]:
            items.append(
                {
                    "persona": persona,
                    "pain_statement": "現行製程可能存在良率不穩定與設備稼動率不足問題。",
                    "business_impact": "良率偏低會提高報廢成本，設備停機則直接影響出貨交期與客戶滿意度。",
                    "technical_anchor": "製程控制設備精度、在線檢測覆蓋率與設備預防性維護能力。",
                    "confidence": 0.55,
                    "evidence_signal_ids": primary_signal_ids,
                    "reasoning": "依近期市場訊號顯示的擴產與製程升級壓力，推估良率管理與設備效率將成為關鍵瓶頸。",
                }
            )
        return items

    @staticmethod
    def _normalize_evidence_ids(raw_ids: object, available_ids: set[int], default_ids: list[int]) -> list[int]:
        ids: list[int] = []

        values: list[object] = []
        if isinstance(raw_ids, list):
            values = raw_ids
        elif raw_ids is not None:
            values = [raw_ids]

        for value in values:
            try:
                candidate = int(value)
            except (TypeError, ValueError):
                continue
            if candidate in available_ids and candidate not in ids:
                ids.append(candidate)
            if len(ids) >= 3:
                break

        if not ids:
            for fallback_id in default_ids:
                if fallback_id in available_ids and fallback_id not in ids:
                    ids.append(fallback_id)
                if len(ids) >= 1:
                    break
        return ids

    @staticmethod
    def _serialize_datetime(value: date | datetime | None) -> str | None:
        if not value:
            return None
        return value.isoformat()

    def _build_evidence_ref(
        self,
        signal_ids: list[int],
        signals_by_id: dict[int, SignalEvent],
        reasoning: str,
    ) -> str | None:
        if not signal_ids:
            return None
        evidence = []
        for signal_id in signal_ids:
            signal = signals_by_id.get(signal_id)
            if not signal:
                continue
            evidence.append(
                {
                    "signal_id": signal.id,
                    "signal_type": signal.signal_type,
                    "signal_strength": signal.signal_strength,
                    "summary": signal.summary,
                    "source_name": signal.source_name,
                    "evidence_url": signal.evidence_url,
                    "event_date": self._serialize_datetime(signal.event_date),
                    "fetched_at": self._serialize_datetime(signal.fetched_at),
                }
            )
        if not evidence:
            return None
        return json.dumps(
            {
                "signal_ids": signal_ids,
                "reasoning": reasoning,
                "evidence": evidence,
            },
            ensure_ascii=False,
        )

    @staticmethod
    def _normalize_confidence(raw_confidence: object, evidence_count: int) -> float:
        try:
            confidence = float(raw_confidence)
        except (TypeError, ValueError):
            confidence = 0.5
        confidence = max(0.0, min(1.0, confidence))
        if evidence_count == 0:
            return min(confidence, 0.45)
        if evidence_count == 1:
            return min(confidence, 0.78)
        return confidence

    def generate(
        self,
        db: Session,
        account_id: int,
        persona_targets: list[str],
        max_items: int,
        signal_ids: list[int] | None = None,
        user_annotations: dict[str, str] | None = None,
        use_knowledge_base: bool = True,
    ) -> tuple[int, str]:
        account = db.get(Account, account_id)
        if not account:
            raise ValueError(f"找不到 account {account_id}。")

        all_signals = (
            db.execute(
                select(SignalEvent)
                .where(SignalEvent.account_id == account_id)
                .order_by(SignalEvent.signal_strength.desc(), SignalEvent.fetched_at.desc())
            )
            .scalars()
            .all()
        )
        if not all_signals:
            raise RuntimeError("尚無市場訊號可供引用，請先到「市場訊號」分頁掃描後再生成痛點。")

        # HITL：若有指定 signal_ids，只使用業務員勾選的訊號
        is_hitl = bool(signal_ids)
        if is_hitl:
            signals = [s for s in all_signals if s.id in signal_ids]
            if not signals:
                raise RuntimeError("指定的訊號 IDs 在此 account 下找不到，請重新確認。")
        else:
            signals = list(all_signals)

        signals_by_id = {signal.id: signal for signal in all_signals}
        available_signal_ids = set(signals_by_id)
        default_signal_ids = [signals[0].id]

        knowledge_context = None
        if use_knowledge_base:
            from app.services.knowledge_service import KnowledgeService
            knowledge_context = KnowledgeService().build_context_for_account(db, account_id)

        system_prompt = (
            "你是半導體設備與工廠自動化領域的 B2B 技術型銷售策略顧問。"
            " 熟悉晶圓製程、封測、良率管理、設備採購流程。"
            " 請以繁體中文為主、重點精簡、避免虛構。"
        )
        user_prompt = self._build_prompt(
            account, signals, persona_targets, max_items,
            user_annotations=user_annotations,
            is_hitl=is_hitl,
            knowledge_context=knowledge_context,
        )

        llm_result = self.llm_router.generate(system_prompt=system_prompt, user_prompt=user_prompt)
        parsed = extract_first_json_object(llm_result.text)
        items = parsed.get("items", []) if parsed else []
        if not isinstance(items, list) or not items:
            items = self._fallback_items(
                persona_targets=persona_targets,
                max_items=max_items,
                default_signal_ids=default_signal_ids,
            )

        created_count = 0
        for item in items[:max_items]:
            evidence_signal_ids = self._normalize_evidence_ids(
                raw_ids=item.get("evidence_signal_ids"),
                available_ids=available_signal_ids,
                default_ids=default_signal_ids,
            )
            reasoning = str(item.get("reasoning", "")).strip()[:600]
            confidence = self._normalize_confidence(item.get("confidence", 0.5), len(evidence_signal_ids))
            evidence_ref = self._build_evidence_ref(
                signal_ids=evidence_signal_ids,
                signals_by_id=signals_by_id,
                reasoning=reasoning,
            )
            db.add(
                PainProfile(
                    account_id=account_id,
                    persona=str(item.get("persona", "RD")).upper()[:32],
                    pain_statement=str(item.get("pain_statement", ""))[:2000] or "未提供 pain statement。",
                    business_impact=str(item.get("business_impact", ""))[:2000] or "未提供 business impact。",
                    technical_anchor=str(item.get("technical_anchor", ""))[:2000] or "未提供 technical anchor。",
                    confidence=confidence,
                    evidence_ref=evidence_ref,
                    model_provider=llm_result.provider,
                    llm_latency_ms=llm_result.latency_ms,
                    llm_token_usage=llm_result.token_usage,
                    llm_fallback_used=1 if llm_result.fallback_used else 0,
                    created_at=now_utc(),
                )
            )
            created_count += 1
        db.commit()
        return created_count, llm_result.provider
