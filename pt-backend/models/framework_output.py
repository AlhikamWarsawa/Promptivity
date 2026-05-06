# TODO: Day 6 — implement framework output model
from pydantic import BaseModel


class FrameworkOutputModel(BaseModel):
    framework_id: str
    is_recommended: bool = False
    recommendation_score: int = 0
    recommendation_reason: str = ""
    tasks: list = []
    today_actions: list = []
    raw_data: dict = {}
