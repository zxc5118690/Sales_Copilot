from datetime import date

from pydantic import BaseModel


class WeeklyReportResponse(BaseModel):
    start_date: date
    end_date: date
    outbound_count: int
    inbound_count: int
    accounts_touched: int
    drafts_created: int
    bant_a_count: int
    bant_b_count: int
    bant_c_count: int

