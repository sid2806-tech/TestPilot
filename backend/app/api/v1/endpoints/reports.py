"""
Report generation — PDF, JSON, CSV.
"""

import csv
import io
import json
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response
from fpdf import FPDF

from app.core.auth import get_current_user, AuthenticatedUser
from app.services import firestore_service as fs

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_run_data(run_id: str, owner_id: str) -> dict:
    run = fs.get_run(run_id, owner_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")
    run["test_case_results"] = fs.get_test_case_results(run_id)
    return run


def _serialize_ts(v):
    if hasattr(v, "isoformat"):
        return v.isoformat()
    return v


@router.get("/{run_id}/json")
async def download_json(run_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    run = _get_run_data(run_id, user.uid)
    # Sanitize timestamps
    serialized = json.dumps(run, default=_serialize_ts, indent=2)
    return Response(
        content=serialized,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="testpilot-{run_id}.json"'},
    )


@router.get("/{run_id}/csv")
async def download_csv(run_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    run = _get_run_data(run_id, user.uid)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Run ID", "Test Name", "URL", "Status", "Started At", "Completed At"])
    writer.writerow([
        run.get("id", ""), run.get("test_name", ""), run.get("target_url", ""),
        run.get("status", ""), _serialize_ts(run.get("started_at", "")),
        _serialize_ts(run.get("completed_at", "")),
    ])
    writer.writerow([])
    writer.writerow(["Test Case ID", "Title", "Status", "Duration (ms)", "Objective"])
    for tc in run.get("test_case_results", []):
        writer.writerow([
            tc.get("test_case_id", ""), tc.get("title", ""),
            tc.get("status", ""), tc.get("duration_ms", ""), tc.get("objective", ""),
        ])
        writer.writerow(["", "Step ID", "Action", "Status", "Observation"])
        for step in tc.get("step_results", []):
            writer.writerow([
                "", step.get("step_id", ""), step.get("action", ""),
                step.get("status", ""), step.get("actual_observation", "")[:200],
            ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="testpilot-{run_id}.csv"'},
    )


@router.get("/{run_id}/pdf")
async def download_pdf(run_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    run = _get_run_data(run_id, user.uid)
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Header
    pdf.set_font("Helvetica", "B", 20)
    pdf.cell(0, 12, "TestPilot AI — Test Report", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", ln=True)
    pdf.ln(4)

    # Run metadata
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "Run Summary", ln=True)
    pdf.set_font("Helvetica", "", 10)
    for label, key in [
        ("Run ID", "id"), ("Test Name", "test_name"),
        ("URL", "target_url"), ("Status", "status"),
    ]:
        val = str(run.get(key, ""))[:100]
        pdf.cell(40, 6, f"{label}:", ln=False)
        pdf.cell(0, 6, val, ln=True)

    summary = run.get("summary") or {}
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 7, "Results", ln=True)
    pdf.set_font("Helvetica", "", 10)
    for k, v in summary.items():
        pdf.cell(40, 6, f"  {k.title()}:", ln=False)
        pdf.cell(0, 6, str(v), ln=True)

    # Test Cases
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "Test Cases", ln=True)

    for tc in run.get("test_case_results", []):
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 7, f"[{tc.get('status','').upper()}] {tc.get('title', '')}", ln=True)
        pdf.set_font("Helvetica", "", 9)
        pdf.multi_cell(0, 5, f"Objective: {tc.get('objective', '')}")
        for step in tc.get("step_results", []):
            status_mark = "✓" if step.get("status") == "passed" else "✗"
            obs = (step.get("actual_observation") or "")[:120]
            pdf.cell(8, 5, status_mark, ln=False)
            pdf.multi_cell(0, 5, f"{step.get('action','')} — {obs}")
        if tc.get("console_errors"):
            pdf.set_font("Helvetica", "I", 8)
            pdf.multi_cell(0, 4, f"Console errors: {'; '.join(tc['console_errors'][:3])}")
        pdf.ln(2)

    content = pdf.output(dest="S").encode("latin-1")
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="testpilot-{run_id}.pdf"'},
    )
