from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from models import Task
from schemas import (
    TaskCreate,
    TaskResponse,
    TaskStatusUpdate,
    InterviewCreate,
    InterviewResponse
)
from crud import (
    create_task,
    get_task,
    update_task_st,
    create_interview,
    get_interview
)


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Salrite Virtual HR API try12",
    description="Backend Api for virtual Hr and ats_checking",
    version="1.0.0"
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://salarite-virtual-hr-ffiv.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Salarite Virtual Hr Api is running"
    }


@app.get("/test-db")
def test_db():
    try:
        with engine.connect():
            return {
                "status": "success",
                "message": "Mysql connected successfully!"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


@app.post("/tasks", response_model=TaskResponse)
def add_task(
        task: TaskCreate,
        db: Session = Depends(get_db)
):
    return create_task(db, task)


@app.get("/tasks", response_model=list[TaskResponse])
def read_tasks(
        db: Session = Depends(get_db)
):
    return get_task(db)


@app.put("/tasks/{task_id}/status", response_model=TaskResponse)
def update_st(
        task_id: int,
        data: TaskStatusUpdate,
        db: Session = Depends(get_db)
):
    task = update_task_st(db, task_id, data.status)

    if not task:
        return {"message": "Task not found"}

    return task


@app.post("/interviews", response_model=InterviewResponse)
def add_interviews(
        interview: InterviewCreate,
        db: Session = Depends(get_db)
):
    return create_interview(db, interview)


@app.get("/interviews", response_model=list[InterviewResponse])
def read_interviews(
        db: Session = Depends(get_db)
):
    return get_interview(db)

# @app.get("/test")
# def test():
#     return{
#         "status":"sohsvsvs",
#         "message":"vsfvsvoshvovhsodhsovs"
#     }
