"""
API routes for compliance management
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database import get_db
from backend.models import Compliance

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/compliances", tags=["compliances"])


class ComplianceCreateRequest(BaseModel):
    id: Optional[str] = None
    name: str
    full_name: str
    description: str
    details: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None


class ComplianceUpdateRequest(BaseModel):
    name: Optional[str] = None
    full_name: Optional[str] = None
    description: Optional[str] = None
    details: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None


class ComplianceResponse(BaseModel):
    id: str
    name: str
    full_name: str
    description: str
    details: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


@router.get("", response_model=List[ComplianceResponse])
async def list_compliances(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all compliances with optional filtering"""
    query = db.query(Compliance)
    
    if category:
        query = query.filter(Compliance.category == category)
    
    compliances = query.order_by(Compliance.created_at.desc()).all()
    return compliances


@router.get("/{compliance_id}", response_model=ComplianceResponse)
async def get_compliance(
    compliance_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific compliance by ID"""
    compliance = db.query(Compliance).filter(Compliance.id == compliance_id).first()
    if not compliance:
        raise HTTPException(status_code=404, detail=f"Compliance {compliance_id} not found")
    return compliance


@router.post("", response_model=ComplianceResponse)
async def create_compliance(
    request: ComplianceCreateRequest,
    db: Session = Depends(get_db)
):
    """Create a new compliance"""
    compliance_id = request.id or f"compliance-{request.name.lower().replace(' ', '-')}"
    
    # Check if ID already exists
    existing = db.query(Compliance).filter(Compliance.id == compliance_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Compliance with ID {compliance_id} already exists")
    
    compliance = Compliance(
        id=compliance_id,
        name=request.name,
        full_name=request.full_name,
        description=request.description,
        details=request.details,
        category=request.category,
        region=request.region
    )
    
    db.add(compliance)
    db.commit()
    db.refresh(compliance)
    
    logger.info(f"Created compliance: {compliance.name} (ID: {compliance.id})")
    return compliance


@router.put("/{compliance_id}", response_model=ComplianceResponse)
async def update_compliance(
    compliance_id: str,
    request: ComplianceUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update an existing compliance"""
    compliance = db.query(Compliance).filter(Compliance.id == compliance_id).first()
    if not compliance:
        raise HTTPException(status_code=404, detail=f"Compliance {compliance_id} not found")
    
    if request.name is not None:
        compliance.name = request.name
    if request.full_name is not None:
        compliance.full_name = request.full_name
    if request.description is not None:
        compliance.description = request.description
    if request.details is not None:
        compliance.details = request.details
    if request.category is not None:
        compliance.category = request.category
    if request.region is not None:
        compliance.region = request.region
    
    db.commit()
    db.refresh(compliance)
    
    logger.info(f"Updated compliance: {compliance.name} (ID: {compliance.id})")
    return compliance


@router.delete("/{compliance_id}")
async def delete_compliance(
    compliance_id: str,
    db: Session = Depends(get_db)
):
    """Delete a compliance"""
    compliance = db.query(Compliance).filter(Compliance.id == compliance_id).first()
    if not compliance:
        raise HTTPException(status_code=404, detail=f"Compliance {compliance_id} not found")
    
    db.delete(compliance)
    db.commit()
    
    logger.info(f"Deleted compliance: {compliance.name} (ID: {compliance_id})")
    return {"success": True, "message": f"Compliance {compliance_id} deleted"}
