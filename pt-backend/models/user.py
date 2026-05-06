# TODO: Day 18 — implement user model
from pydantic import BaseModel


class User(BaseModel):
    id: str = ""
    email: str = ""
    name: str = ""
