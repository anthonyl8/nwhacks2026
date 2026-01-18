from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: Optional[str] = None
    auth_id: str

class UserCreate(UserBase):
    pass

class UserOut(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Emotional Log Schemas
class EmotionalLogBase(BaseModel):
    stress_score: float
    vibe: Optional[str] = None
    note: Optional[str] = None

class EmotionalLogCreate(EmotionalLogBase):
    pass

class EmotionalLogOut(EmotionalLogBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Session Schemas
class SessionBase(BaseModel):
    pass
    
class SessionOut(SessionBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime]
    
    class Config:
        from_attributes = True
