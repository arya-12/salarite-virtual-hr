from sqlalchemy import Column,Integer,String,Text,DateTime
from datetime import datetime
from database import Base

class Task(Base):
    __tablename__ = "tasks"
    id=Column(Integer,primary_key=True,index=True)
    title=Column(String(200),nullable=False)
    description=Column(Text,nullable=True)
    status=Column(String(50),default="pending")
    assigned_to=Column(String(50),nullable=True)
    created_at=Column(DateTime,default=datetime.utcnow)

class Interview(Base):
    __tablename__ = "interview"
    id=Column(Integer,primary_key=True,index=True)
    candidate_name=Column(String(100),nullable=True)
    scheduled_at=Column(DateTime,nullable=True)
    mode=Column(String(20),nullable=False)
    status=Column(String(50),default="Scheduled")
