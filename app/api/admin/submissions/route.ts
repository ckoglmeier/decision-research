import { NextRequest, NextResponse } from "next/server";
import { listSubmissions, getSubmission, saveSubmission } from "@/lib/storage";

function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  return token === process.env.ADMIN_TOKEN;
}

// GET /api/admin/submissions — list all submissions
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submissions = await listSubmissions();
  return NextResponse.json(submissions);
}

// PATCH /api/admin/submissions — update admin notes
export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, adminNotes } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const submission = await getSubmission(id);
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  submission.adminNotes = adminNotes ?? "";
  submission.updatedAt = new Date().toISOString();
  await saveSubmission(submission);

  return NextResponse.json({ ok: true });
}
