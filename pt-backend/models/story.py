from pydantic import BaseModel
from typing import Optional

class PersonalizationData(BaseModel):
    name:            str            = "Friend"
    role:            str            = "lainnya"
    bigGoal:         Optional[str]  = None
    currentProblem:  Optional[str]  = None
    energyPattern:   str            = "variable"    # morning | night | variable
    preferredStyle:  str            = "flexible"    # structured | flexible

class ProcessStoryRequest(BaseModel):
    story:           str
    personalization: Optional[PersonalizationData] = None
