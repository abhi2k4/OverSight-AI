"""
API routes for violation management
"""
import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database import get_db
from backend.models import Violation, ViolationStatus
from backend.services.violation_detector import detect_violations

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/violations", tags=["violations"])


class ViolationResponse(BaseModel):
    id: int
    agent_id: Optional[str]
    policy_id: Optional[int]
    compliance_id: Optional[str]
    violation_type: str
    severity: str
    description: str
    query_text: Optional[str]
    response_text: Optional[str]
    langfuse_trace_id: Optional[str]
    status: str
    detected_at: str
    resolved_at: Optional[str] = None
    policy_name: Optional[str] = None
    compliance_name: Optional[str] = None

    class Config:
        from_attributes = True


class ViolationCreateRequest(BaseModel):
    agent_id: Optional[str] = None
    policy_id: Optional[int] = None
    compliance_id: Optional[str] = None
    violation_type: str
    severity: str
    description: str
    query_text: Optional[str] = None
    response_text: Optional[str] = None
    langfuse_trace_id: Optional[str] = None


class ViolationStatusUpdate(BaseModel):
    status: str


@router.get("", response_model=List[ViolationResponse])
async def list_violations(
    status: Optional[str] = None,
    agent_id: Optional[str] = None,
    policy_id: Optional[int] = None,
    severity: Optional[str] = None,
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """List violations with optional filtering"""
    from backend.models import Policy, Compliance
    
    query = db.query(Violation)
    
    if status:
        try:
            status_enum = ViolationStatus(status.lower())
            query = query.filter(Violation.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    if agent_id:
        query = query.filter(Violation.agent_id == agent_id)
    
    if policy_id:
        query = query.filter(Violation.policy_id == policy_id)
    
    if severity:
        query = query.filter(Violation.severity == severity.lower())
    
    violations = query.order_by(Violation.detected_at.desc()).offset(offset).limit(limit).all()
    
    # Enhance violations with policy/compliance names
    enhanced_violations = []
    for violation in violations:
        violation_dict = {
            "id": violation.id,
            "agent_id": violation.agent_id,
            "policy_id": violation.policy_id,
            "compliance_id": violation.compliance_id,
            "violation_type": violation.violation_type,
            "severity": violation.severity,
            "description": violation.description,
            "query_text": violation.query_text,
            "response_text": violation.response_text,
            "langfuse_trace_id": violation.langfuse_trace_id,
            "status": violation.status.value,
            "detected_at": violation.detected_at.isoformat() if violation.detected_at else datetime.now().isoformat(),
            "resolved_at": violation.resolved_at.isoformat() if violation.resolved_at else None,
            "policy_name": None,
            "compliance_name": None,
        }
        
        # Add policy/compliance names if available
        if violation.policy_id:
            policy = db.query(Policy).filter(Policy.id == violation.policy_id).first()
            if policy:
                violation_dict["policy_name"] = policy.name
        
        if violation.compliance_id:
            compliance = db.query(Compliance).filter(Compliance.id == violation.compliance_id).first()
            if compliance:
                violation_dict["compliance_name"] = compliance.name
        
        enhanced_violations.append(violation_dict)
    
    # Return as list of ViolationResponse (Pydantic will validate)
    return [ViolationResponse(**v) for v in enhanced_violations]


@router.get("/{violation_id}", response_model=ViolationResponse)
async def get_violation(
    violation_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific violation by ID"""
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail=f"Violation {violation_id} not found")
    return violation


@router.post("", response_model=ViolationResponse)
async def create_violation(
    request: ViolationCreateRequest,
    db: Session = Depends(get_db)
):
    """Create a new violation record"""
    violation = Violation(
        agent_id=request.agent_id,
        policy_id=request.policy_id,
        compliance_id=request.compliance_id,
        violation_type=request.violation_type,
        severity=request.severity.lower(),
        description=request.description,
        query_text=request.query_text,
        response_text=request.response_text,
        langfuse_trace_id=request.langfuse_trace_id,
        status=ViolationStatus.ACTIVE
    )
    
    db.add(violation)
    db.commit()
    db.refresh(violation)
    
    logger.info(f"Created violation: {violation.description[:50]}... (ID: {violation.id})")
    return violation


class ViolationDetectionRequest(BaseModel):
    query: str
    response: str
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    langfuse_trace_id: Optional[str] = None


@router.post("/detect", response_model=List[ViolationResponse])
async def detect_and_create_violations(
    request: ViolationDetectionRequest = Body(...),
    db: Session = Depends(get_db)
):
    """Detect violations and create violation records"""
    violations_data = await detect_violations(
        query=request.query,
        response=request.response,
        agent_id=request.agent_id,
        agent_name=request.agent_name,
        db=db,
        langfuse_trace_id=request.langfuse_trace_id
    )
    
    violations = []
    for violation_data in violations_data:
        violation = Violation(**violation_data)
        db.add(violation)
        violations.append(violation)
    
    if violations:
        db.commit()
        for v in violations:
            db.refresh(v)
        logger.info(f"Created {len(violations)} violation records")
    
    return violations


@router.put("/{violation_id}/status", response_model=ViolationResponse)
async def update_violation_status(
    violation_id: int,
    request: ViolationStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update violation status"""
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail=f"Violation {violation_id} not found")
    
    try:
        new_status = ViolationStatus(request.status.lower())
        violation.status = new_status
        
        if new_status == ViolationStatus.RESOLVED:
            from datetime import datetime
            violation.resolved_at = datetime.now()
        
        db.commit()
        db.refresh(violation)
        
        logger.info(f"Updated violation {violation_id} status to {new_status.value}")
        return violation
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {request.status}")


@router.post("/test/create", response_model=List[ViolationResponse])
async def create_test_violations(
    violations: List[ViolationCreateRequest] = Body(...),
    update_langfuse: bool = Query(True, description="Update Langfuse trace if available"),
    db: Session = Depends(get_db)
):
    """
    Create test violations directly (bypasses LLM detection).
    Useful for testing the alerts dashboard and Langfuse integration.
    """
    import os
    
    # Initialize Langfuse if available and requested
    langfuse = None
    if update_langfuse:
        try:
            from langfuse import Langfuse
            if os.getenv("LANGFUSE_SECRET_KEY") and os.getenv("LANGFUSE_PUBLIC_KEY"):
                langfuse = Langfuse(
                    secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
                    public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
                    host=os.getenv("LANGFUSE_BASE_URL", "http://localhost:3000"),
                )
        except ImportError:
            logger.warning("Langfuse not installed. Skipping trace updates.")
        except Exception as e:
            logger.warning(f"Langfuse initialization failed: {e}")
    
    created_violations = []
    
    try:
        for violation_data in violations:
            # Create violation in database
            violation = Violation(
                agent_id=violation_data.agent_id,
                policy_id=violation_data.policy_id,
                compliance_id=violation_data.compliance_id,
                violation_type=violation_data.violation_type,
                severity=violation_data.severity.lower(),
                description=violation_data.description,
                query_text=violation_data.query_text,
                response_text=violation_data.response_text,
                langfuse_trace_id=violation_data.langfuse_trace_id,
                status=ViolationStatus.ACTIVE
            )
            
            db.add(violation)
            created_violations.append(violation)
        
        db.commit()
        
        # Refresh all violations to get IDs
        for v in created_violations:
            db.refresh(v)
        
        # Update Langfuse traces if available
        if langfuse and update_langfuse:
            for violation in created_violations:
                if violation.langfuse_trace_id:
                    try:
                        trace = langfuse.trace(id=violation.langfuse_trace_id)
                        
                        # Get existing violations for this trace
                        existing_violations = db.query(Violation).filter(
                            Violation.langfuse_trace_id == violation.langfuse_trace_id
                        ).all()
                        
                        violations_metadata = []
                        for v in existing_violations:
                            violations_metadata.append({
                                "policy_id": v.policy_id,
                                "compliance_id": v.compliance_id,
                                "violation_type": v.violation_type,
                                "severity": v.severity,
                                "description": v.description[:200] if v.description else ""
                            })
                        
                        trace.update(
                            metadata={
                                "violations": violations_metadata,
                                "violations_count": len(existing_violations),
                                "test_violations": True  # Mark as test violations
                            },
                            level="WARNING" if violations_metadata else "DEFAULT",
                            status_message=f"{len(existing_violations)} test violation(s) created"
                        )
                        langfuse.flush()
                    except Exception as e:
                        logger.warning(f"Failed to update Langfuse trace {violation.langfuse_trace_id}: {e}")
        
        logger.info(f"Created {len(created_violations)} test violation(s)")
        
        # Enhance violations with policy/compliance names
        from backend.models import Policy, Compliance
        enhanced_violations = []
        for violation in created_violations:
            violation_dict = {
                "id": violation.id,
                "agent_id": violation.agent_id,
                "policy_id": violation.policy_id,
                "compliance_id": violation.compliance_id,
                "violation_type": violation.violation_type,
                "severity": violation.severity,
                "description": violation.description,
                "query_text": violation.query_text,
                "response_text": violation.response_text,
                "langfuse_trace_id": violation.langfuse_trace_id,
                "status": violation.status.value,
                "detected_at": violation.detected_at.isoformat() if violation.detected_at else datetime.now().isoformat(),
                "resolved_at": violation.resolved_at.isoformat() if violation.resolved_at else None,
                "policy_name": None,
                "compliance_name": None,
            }
            
            # Add policy/compliance names if available
            if violation.policy_id:
                policy = db.query(Policy).filter(Policy.id == violation.policy_id).first()
                if policy:
                    violation_dict["policy_name"] = policy.name
            
            if violation.compliance_id:
                compliance = db.query(Compliance).filter(Compliance.id == violation.compliance_id).first()
                if compliance:
                    violation_dict["compliance_name"] = compliance.name
            
            enhanced_violations.append(violation_dict)
        
        return [ViolationResponse(**v) for v in enhanced_violations]
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating test violations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create test violations: {str(e)}")
