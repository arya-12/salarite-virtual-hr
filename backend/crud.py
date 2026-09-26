from sqlalchemy.orm import Session
from models import  Task,Interview
from schemas import TaskCreate,InterviewCreate

def create_task(db:Session,task: TaskCreate):
    new_task=Task(
        title=task.title,
        description=task.description,
        assigned_to=task.assigned_to
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task
def get_task(db:Session):
    return db.query(Task).all()
def update_task_st(db:Session,task_id:int,status:str):
    task=db.query(Task).filter(Task.id==task_id).first()
    if not task:
        return None
    task.status=status

    db.commit()
    db.refresh(task)
    return task

def create_interview(db:Session,interview: InterviewCreate):
    new_interview=Interview(
        candidate_name=interview.candidate_name,
        scheduled_at=interview.scheduled_at,
        mode=interview.mode
    )
    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)

    return new_interview

def get_interview(db: Session):
    return db.query(Interview).all()