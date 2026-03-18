import { NextRequest, NextResponse } from "next/server";
import { getSubmission, saveSubmission } from "@/lib/storage";
import type { ModuleId } from "@/lib/types";

const VALID_MODULE_IDS = ["m1", "m2", "m3", "m4", "m5"];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

async function storeVideo(file: File, path: string): Promise<string> {
  if (USE_BLOB) {
    const { put } = await import("@vercel/blob");
    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = await put(path, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || "video/webm",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  // Local dev: write to .local-data/videos/
  const { promises: fs } = await import("fs");
  const nodePath = await import("path");
  const dir = nodePath.join(process.cwd(), ".local-data", nodePath.dirname(path));
  await fs.mkdir(dir, { recursive: true });
  const dest = nodePath.join(process.cwd(), ".local-data", path);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buffer);
  // Return a URL pointing to our local serve endpoint
  return `/api/local-video/${path}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const submissionId = formData.get("submissionId") as string | null;
    const moduleId = formData.get("moduleId") as string | null;

    if (!file || !submissionId || !moduleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!VALID_MODULE_IDS.includes(moduleId)) {
      return NextResponse.json({ error: "Invalid moduleId" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 500 MB)" }, { status: 413 });
    }

    const submission = await getSubmission(submissionId);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const ext = file.name.split(".").pop() || "webm";
    const url = await storeVideo(file, `videos/${submissionId}/${moduleId}.${ext}`);

    submission.responses[moduleId as ModuleId] = {
      blobUrl: url,
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
    };
    submission.updatedAt = new Date().toISOString();
    await saveSubmission(submission);

    return NextResponse.json({ url });
  } catch (err) {
    console.error("POST /api/upload error:", err);
    return NextResponse.json({ error: "Upload failed", detail: String(err) }, { status: 500 });
  }
}
