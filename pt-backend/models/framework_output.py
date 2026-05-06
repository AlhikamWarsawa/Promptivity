from pydantic import BaseModel, Field
from typing import Optional, Any

class Task(BaseModel):
    id:               str
    title:            str
    description:      Optional[str] = None
    priority:         str           = "medium"    # critical|high|medium|low
    estimatedMinutes: int           = 30
    deadline:         Optional[str] = None
    category:         str           = "general"
    isCompleted:      bool          = False
    framework:        str           = "gtd"

class FrameworkOutput(BaseModel):
    frameworkId:          str
    isRecommended:        bool    = False
    recommendationScore:  int     = 50        # 0-100
    recommendationReason: str     = ""
    tasks:                list    = Field(default_factory=list)
    todayActions:         list    = Field(default_factory=list)
    rawData:              dict    = Field(default_factory=dict)

class PTSession(BaseModel):
    sessionId:              str
    processedAt:            str
    topRecommendation:      str
    topRecommendationReason:str
    masterTaskList:         list  = Field(default_factory=list)
    todayPlan:              list  = Field(default_factory=list)
    frameworks:             list  = Field(default_factory=list)
    isDemo:                 bool  = False
