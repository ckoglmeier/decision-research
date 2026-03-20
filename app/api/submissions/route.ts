import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { saveSubmission, getSubmission, saveResponse } from "@/lib/storage";
import { MODULE_IDS } from "@/lib/types";
import type { Submission, ModuleId } from "@/lib/types";

// POST /api/submissions — create a new in-progress submission
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, consentGiven } = body;

    if (!name || !email || !consentGiven) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const submission: Submission = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participant: { name, email, consentGiven },
      responses: {},
      status: "in_progress",
    };

    await saveSubmission(submission);
    return NextResponse.json({ id: submission.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/submissions error:", err);
    return NextResponse.json({ error: "Internal server error", detail: String(err) }, { status: 500 });
  }
}

// PATCH /api/submissions — save a module text response, or mark as submitted
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, moduleId, text } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    if (moduleId && typeof text === "string") {
      // Validate moduleId before touching any storage
      if (!MODULE_IDS.includes(moduleId as ModuleId)) {
        return NextResponse.json({ error: "Invalid moduleId" }, { status: 400 });
      }

      // Save response directly to its own file — no read-modify-write
      await saveResponse(id, moduleId as ModuleId, {
        text,
        uploadedAt: new Date().toISOString(),
      });
    } else {
      // Mark the whole submission as submitted — must read meta to update status
      const submission = await getSubmission(id);
      if (!submission) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 });
      }
      submission.status = "submitted";
      submission.updatedAt = new Date().toISOString();
      await saveSubmission(submission);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/submissions error:", err);
    return NextResponse.json({ error: "Internal server error", detail: String(err) }, { status: 500 });
  }
}
