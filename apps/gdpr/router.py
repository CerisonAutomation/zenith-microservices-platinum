"""
GDPR Compliance Router
Implements Data Subject Access Requests, Consent Management, and Data Portability
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
import json
import uuid
from typing import Optional, List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from gdpr.models import (
    ConsentLog, DataSubjectRequest, DeletionSchedule, AuditLog,
    DataExport, BreachNotification, DataProcessingRecord, ConsentType
)
from gdpr.schemas import (
    ConsentRequest, DataSubjectAccessRequest, ExportDataResponse,
    ConsentStatusResponse
)

router = APIRouter(prefix="/api/v1/gdpr", tags=["GDPR"])


# ============================================================================
# CONSENT MANAGEMENT
# ============================================================================

@router.post("/consent/give")
async def give_consent(
    request: ConsentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record user consent for marketing, analytics, or data sharing.
    GDPR Article 7: Consent must be freely given, specific, informed, and unambiguous.
    """
    consent = ConsentLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        consent_type=request.consent_type,
        given=True,
        timestamp=datetime.utcnow(),
        legal_basis="consent",
        language=request.language or "en",
        version=request.policy_version or "1.0"
    )
    
    db.add(consent)
    
    # Update user preferences
    if request.consent_type == ConsentType.MARKETING:
        current_user.marketing_consent = True
    elif request.consent_type == ConsentType.ANALYTICS:
        current_user.analytics_consent = True
    
    # Log audit event
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="CONSENT_GIVEN",
        resource_type="consent",
        new_values=json.dumps({"type": request.consent_type, "given": True}),
        timestamp=datetime.utcnow(),
        status="success"
    )
    db.add(audit)
    db.commit()
    
    return {
        "status": "consent_recorded",
        "consent_id": consent.id,
        "timestamp": consent.timestamp
    }


@router.post("/consent/withdraw")
async def withdraw_consent(
    consent_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    GDPR Article 7(3): User can withdraw consent at any time.
    Withdrawal must be as easy as giving consent.
    """
    # Find and update latest consent record
    latest_consent = db.query(ConsentLog).filter(
        and_(
            ConsentLog.user_id == current_user.id,
            ConsentLog.consent_type == consent_type,
            ConsentLog.given == True,
            ConsentLog.withdrawn_at == None
        )
    ).order_by(ConsentLog.timestamp.desc()).first()
    
    if not latest_consent:
        raise HTTPException(status_code=404, detail="No active consent found")
    
    # Record withdrawal
    latest_consent.withdrawn_at = datetime.utcnow()
    latest_consent.given = False
    
    # Update user preferences
    if consent_type == ConsentType.MARKETING:
        current_user.marketing_consent = False
    elif consent_type == ConsentType.ANALYTICS:
        current_user.analytics_consent = False
    
    # Audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="CONSENT_WITHDRAWN",
        resource_type="consent",
        new_values=json.dumps({"type": consent_type, "withdrawn": True}),
        timestamp=datetime.utcnow(),
        status="success"
    )
    db.add(audit)
    db.commit()
    
    return {
        "status": "consent_withdrawn",
        "timestamp": datetime.utcnow()
    }


@router.get("/consent/status")
async def get_consent_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ConsentStatusResponse:
    """
    Get user's current consent status for all data processing activities.
    Transparency: User needs to know what they've consented to.
    """
    consents = db.query(ConsentLog).filter(
        and_(
            ConsentLog.user_id == current_user.id,
            ConsentLog.withdrawn_at == None
        )
    ).all()
    
    return {
        "consents": [
            {
                "type": c.consent_type,
                "given": c.given,
                "timestamp": c.timestamp,
                "version": c.version
            }
            for c in consents
        ],
        "processing_activities": [
            {
                "purpose": "Service provision",
                "legal_basis": "Contract (Article 6(1)(b))",
                "data_categories": ["Profile", "Bookings", "Payments", "Communications"],
                "retention": "Duration of contract + 3 years for legal compliance",
                "recipients": ["Internal systems", "Payment processors", "Email service"],
                "consent_required": False
            },
            {
                "purpose": "Marketing communications",
                "legal_basis": "Consent (Article 6(1)(a))",
                "data_categories": ["Email", "Usage patterns", "Preferences"],
                "retention": "Until consent withdrawn",
                "recipients": ["Marketing automation platform"],
                "consent_required": True,
                "consent_given": current_user.marketing_consent or False
            },
            {
                "purpose": "Analytics and service improvement",
                "legal_basis": "Consent (Article 6(1)(a))",
                "data_categories": ["Usage data", "Device info", "Location"],
                "retention": "13 months",
                "recipients": ["Analytics platform"],
                "consent_required": True,
                "consent_given": current_user.analytics_consent or False
            }
        ]
    }


# ============================================================================
# RIGHT TO DATA PORTABILITY (GDPR Article 20)
# ============================================================================

@router.post("/data/export")
async def request_data_export(
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    GDPR Article 20: Right to Data Portability
    User can request all their data in machine-readable format (JSON/CSV/XML)
    Must be provided within 30 days
    """
    export = DataExport(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        requested_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=30),
        status="processing"
    )
    db.add(export)
    
    # Log request
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="DATA_EXPORT_REQUESTED",
        resource_type="export",
        new_values=json.dumps({"export_id": export.id}),
        timestamp=datetime.utcnow(),
        status="success"
    )
    db.add(audit)
    db.commit()
    
    # Queue background export job
    if background_tasks:
        background_tasks.add_task(
            generate_data_export,
            user_id=current_user.id,
            export_id=export.id,
            db=db
        )
    
    return {
        "status": "processing",
        "export_id": export.id,
        "message": "Your data export is being prepared. You will receive an email with download link within 24 hours.",
        "deadline": export.expires_at
    }


async def generate_data_export(user_id: str, export_id: str, db: Session):
    """
    Background task: Generate comprehensive data export
    """
    # Collect all user data
    user_data = {
        "export_timestamp": datetime.utcnow().isoformat(),
        "profile": {
            # Fetch from user model
        },
        "bookings": [],
        "messages": [],
        "payments": [],
        "reviews": [],
        "preferences": {},
        "consent_history": [],
        "access_log": []
    }
    
    # Export to JSON
    export_json = json.dumps(user_data, indent=2, default=str)
    
    # Store URL (in production: upload to S3 or secure storage)
    export = db.query(DataExport).filter(DataExport.id == export_id).first()
    export.status = "ready"
    export.completed_at = datetime.utcnow()
    db.commit()
    
    # Send email with download link
    # In production: send secure download link


@router.get("/data/export/{export_id}")
async def download_data_export(
    export_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download previously requested data export
    """
    export = db.query(DataExport).filter(
        and_(
            DataExport.id == export_id,
            DataExport.user_id == current_user.id
        )
    ).first()
    
    if not export:
        raise HTTPException(status_code=404, detail="Export not found")
    
    if export.status != "ready":
        raise HTTPException(status_code=400, detail="Export not ready yet")
    
    if export.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Export link expired")
    
    export.download_count += 1
    db.commit()
    
    # Return download URL or file
    return {"download_url": export.file_url}


# ============================================================================
# RIGHT TO BE FORGOTTEN (GDPR Article 17)
# ============================================================================

@router.post("/data/delete-account")
async def request_account_deletion(
    password_confirmation: str,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    GDPR Article 17: Right to be Forgotten
    Initiate account deletion with 30-day grace period
    """
    # Verify password
    # In production: verify password hash
    
    # Check if already pending deletion
    existing = db.query(DeletionSchedule).filter(
        and_(
            DeletionSchedule.user_id == current_user.id,
            DeletionSchedule.status == "pending"
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Deletion already scheduled"
        )
    
    # Schedule deletion
    deletion = DeletionSchedule(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        requested_at=datetime.utcnow(),
        scheduled_deletion=datetime.utcnow() + timedelta(days=30),
        can_reactivate_until=datetime.utcnow() + timedelta(days=30),
        reason=reason
    )
    db.add(deletion)
    
    # Audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="DELETION_REQUESTED",
        resource_type="account",
        timestamp=datetime.utcnow(),
        status="success"
    )
    db.add(audit)
    db.commit()
    
    return {
        "status": "deletion_scheduled",
        "deletion_date": deletion.scheduled_deletion,
        "message": "Your account will be permanently deleted in 30 days. All data will be irreversibly removed.",
        "can_cancel_until": deletion.can_reactivate_until
    }


@router.post("/data/cancel-deletion")
async def cancel_account_deletion(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel a pending account deletion during grace period
    """
    deletion = db.query(DeletionSchedule).filter(
        and_(
            DeletionSchedule.user_id == current_user.id,
            DeletionSchedule.status == "pending"
        )
    ).first()
    
    if not deletion:
        raise HTTPException(status_code=404, detail="No deletion scheduled")
    
    if deletion.can_reactivate_until < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Grace period expired")
    
    deletion.status = "cancelled"
    
    # Audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="DELETION_CANCELLED",
        resource_type="account",
        timestamp=datetime.utcnow(),
        status="success"
    )
    db.add(audit)
    db.commit()
    
    return {"status": "deletion_cancelled"}


# ============================================================================
# DATA SUBJECT ACCESS REQUESTS (GDPR Article 15)
# ============================================================================

@router.post("/dsar/access")
async def data_subject_access_request(
    request: DataSubjectAccessRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    GDPR Article 15: Right of Access
    Must provide response within 30 days (extendable to 90 days)
    """
    dsar = DataSubjectRequest(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        request_type="access",
        status="processing",
        requested_at=datetime.utcnow(),
        deadline=datetime.utcnow() + timedelta(days=30),
        reason=request.reason,
        data_categories=json.dumps(request.data_categories or [])
    )
    db.add(dsar)
    
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="DSAR_ACCESS_REQUEST",
        timestamp=datetime.utcnow(),
        status="success"
    )
    db.add(audit)
    db.commit()
    
    return {
        "status": "received",
        "dsar_id": dsar.id,
        "deadline": dsar.deadline,
        "message": "Your access request has been received. We will respond within 30 days."
    }


@router.get("/dsar/{dsar_id}")
async def get_dsar_status(
    dsar_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check status of Data Subject Access Request
    """
    dsar = db.query(DataSubjectRequest).filter(
        and_(
            DataSubjectRequest.id == dsar_id,
            DataSubjectRequest.user_id == current_user.id
        )
    ).first()
    
    if not dsar:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {
        "dsar_id": dsar.id,
        "request_type": dsar.request_type,
        "status": dsar.status,
        "requested_at": dsar.requested_at,
        "deadline": dsar.deadline,
        "completed_at": dsar.completed_at
    }


# ============================================================================
# AUDIT TRAIL & TRANSPARENCY
# ============================================================================

@router.get("/audit-log")
async def get_audit_log(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Show user all access to their data (transparency requirement)
    GDPR Article 15: Access to information about processing
    """
    logs = db.query(AuditLog).filter(
        AuditLog.user_id == current_user.id
    ).order_by(AuditLog.timestamp.desc()).limit(100).all()
    
    return {
        "audit_log": [
            {
                "action": log.action,
                "resource_type": log.resource_type,
                "timestamp": log.timestamp,
                "actor": log.actor_id or "system",
                "status": log.status
            }
            for log in logs
        ]
    }
