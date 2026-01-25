"""
API routes for policy management
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database import get_db
from backend.models import Policy, PolicyStatus, PolicyCategory, PolicySeverity

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/policies", tags=["policies"])


class PolicyCreateRequest(BaseModel):
    name: str
    description: str
    category: str
    severity: str
    status: Optional[str] = "active"


class PolicyUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None


class PolicyResponse(BaseModel):
    id: int
    name: str
    description: str
    category: str
    severity: str
    status: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


@router.get("", response_model=List[PolicyResponse])
async def list_policies(
    status: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all policies with optional filtering"""
    query = db.query(Policy)
    
    if status:
        try:
            status_enum = PolicyStatus(status.lower())
            query = query.filter(Policy.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    if category:
        try:
            category_enum = PolicyCategory(category)
            query = query.filter(Policy.category == category_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid category: {category}")
    
    policies = query.order_by(Policy.created_at.desc()).all()
    return policies


@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(
    policy_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific policy by ID"""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy {policy_id} not found")
    return policy


@router.post("", response_model=PolicyResponse)
async def create_policy(
    request: PolicyCreateRequest,
    db: Session = Depends(get_db)
):
    """Create a new policy"""
    try:
        category_enum = PolicyCategory(request.category)
        severity_enum = PolicySeverity(request.severity)
        status_enum = PolicyStatus(request.status.lower()) if request.status else PolicyStatus.ACTIVE
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid enum value: {str(e)}")
    
    policy = Policy(
        name=request.name,
        description=request.description,
        category=category_enum,
        severity=severity_enum,
        status=status_enum
    )
    
    db.add(policy)
    db.commit()
    db.refresh(policy)
    
    logger.info(f"Created policy: {policy.name} (ID: {policy.id})")
    return policy


@router.put("/{policy_id}", response_model=PolicyResponse)
async def update_policy(
    policy_id: int,
    request: PolicyUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update an existing policy"""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy {policy_id} not found")
    
    if request.name is not None:
        policy.name = request.name
    if request.description is not None:
        policy.description = request.description
    if request.category is not None:
        try:
            policy.category = PolicyCategory(request.category)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid category: {request.category}")
    if request.severity is not None:
        try:
            policy.severity = PolicySeverity(request.severity)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid severity: {request.severity}")
    if request.status is not None:
        try:
            policy.status = PolicyStatus(request.status.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {request.status}")
    
    db.commit()
    db.refresh(policy)
    
    logger.info(f"Updated policy: {policy.name} (ID: {policy.id})")
    return policy


@router.delete("/{policy_id}")
async def delete_policy(
    policy_id: int,
    db: Session = Depends(get_db)
):
    """Delete a policy"""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy {policy_id} not found")
    
    db.delete(policy)
    db.commit()
    
    logger.info(f"Deleted policy: {policy.name} (ID: {policy_id})")
    return {"success": True, "message": f"Policy {policy_id} deleted"}
