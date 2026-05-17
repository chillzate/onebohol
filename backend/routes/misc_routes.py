# ============================================
# ZAVARA MISC ROUTES
# Rides, Jobs, SOS, Notifications
# ============================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, RideRequest, JobPost, SosAlert
from schemas import (
    RideRequestCreate, RideResponse,
    JobPostCreate, JobPostResponse,
    SosAlertCreate, SosAlertResponse
)
from typing import List
import httpx

router = APIRouter(tags=["Misc"])


# ============================================
# NOTIFICATIONS
# ============================================
@router.post("/notifications/save-token")
async def save_push_token(
    user_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    user.push_token = token
    db.commit()
    return {
        "message": "✅ Push token saved!",
        "user_id": user_id
    }


@router.post("/notifications/send")
async def send_notification(
    user_id: int,
    title: str,
    body: str,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()
    if not user or not user.push_token:
        raise HTTPException(
            status_code=404,
            detail="User or push token not found"
        )
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                "https://exp.host/--/api/v2/push/send",
                json={
                    "to": user.push_token,
                    "title": title,
                    "body": body,
                    "sound": "default",
                    "badge": 1,
                    "data": {"type": "manual"}
                },
                headers={"Content-Type": "application/json"}
            )
            result = res.json()
            if "errors" in result:
                raise HTTPException(
                    status_code=500,
                    detail=f"Push failed: {result['errors']}"
                )
            return {
                "message": "✅ Notification sent!",
                "result": result
            }
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=500,
            detail="Push notification timeout"
        )


# ============================================
# RIDES
# ============================================
@router.post("/rides", response_model=RideResponse)
def request_ride(
    ride: RideRequestCreate,
    passenger_id: int,
    db: Session = Depends(get_db)
):
    new_ride = RideRequest(
        passenger_id=passenger_id,
        pickup_location=ride.pickup_location,
        dropoff_location=ride.dropoff_location,
        ride_type=ride.ride_type
    )
    db.add(new_ride)
    db.commit()
    db.refresh(new_ride)
    return new_ride


@router.get(
    "/rides",
    response_model=List[RideResponse]
)
def get_rides(db: Session = Depends(get_db)):
    return db.query(RideRequest).all()


# ============================================
# JOBS
# ============================================
@router.post("/jobs", response_model=JobPostResponse)
def create_job(
    job: JobPostCreate,
    poster_id: int,
    db: Session = Depends(get_db)
):
    new_job = JobPost(
        poster_id=poster_id,
        title=job.title,
        description=job.description,
        location=job.location,
        salary=job.salary,
        job_type=job.job_type
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job


@router.get(
    "/jobs",
    response_model=List[JobPostResponse]
)
def get_jobs(db: Session = Depends(get_db)):
    return db.query(JobPost).filter(
        JobPost.is_active == True
    ).all()


@router.delete("/jobs/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    job = db.query(JobPost).filter(
        Job.id == job_id
    ).first()
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )
    db.delete(job)
    db.commit()
    return {"message": "✅ Job deleted!"}


# ============================================
# SOS
# ============================================
@router.post("/sos", response_model=SosAlertResponse)
def create_sos(
    sos: SosAlertCreate,
    user_id: int,
    db: Session = Depends(get_db)
):
    new_sos = SosAlert(
        user_id=user_id,
        location=sos.location,
        alert_type=sos.alert_type
    )
    db.add(new_sos)
    db.commit()
    db.refresh(new_sos)
    return new_sos


@router.get(
    "/sos",
    response_model=List[SosAlertResponse]
)
def get_sos_alerts(db: Session = Depends(get_db)):
    return db.query(SosAlert).filter(
        SosAlert.status == "active"
    ).all()