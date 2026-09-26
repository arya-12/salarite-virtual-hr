from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskCreate(BaseModel):
    title:str
    description: Optional[str]=None
    assigned_to: Optional[str]=None


class TaskResponse(BaseModel):
    id:int
    title:str
    description: Optional[str]=None
    status: str
    assigned_to: Optional[str]=None

    class Config:
        from_attributes=True


class TaskStatusUpdate(BaseModel):
    status:str

class InterviewCreate(BaseModel):
    candidate_name:str
    scheduled_at:datetime
    mode:str

class InterviewResponse(BaseModel):
    id:int
    candidate_name: str
    scheduled_at: datetime
    mode: str
    status:str
    class Config:
        from_attributes=True