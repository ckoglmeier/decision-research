import type { Submission } from "./types";

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const SUBMISSION_PREFIX = "submissions/";

// ─── Local filesystem fallback (dev without Vercel Blob) ───────────────────

async function localDir() {
  const { promises: fs } = await import("fs");
  const path = await import("path");
  const dir = path.join(process.cwd(), ".local-data", "submissions");
  await fs.mkdir(dir, { recursive: true });
  return { fs, dir };
}

async function localSave(submission: Submission): Promise<void> {
  const { fs, dir } = await localDir();
  const path = await import("path");
  await fs.writeFile(
    path.join(dir, `${submission.id}.json`),
    JSON.stringify(submission, null, 2),
    "utf-8"
  );
}

async function localGet(id: string): Promise<Submission | null> {
  try {
    const { fs, dir } = await localDir();
    const path = await import("path");
    const data = await fs.readFile(path.join(dir, `${id}.json`), "utf-8");
    return JSON.parse(data) as Submission;
  } catch {
    return null;
  }
}

async function localList(): Promise<Submission[]> {
  const { fs, dir } = await localDir();
  const path = await import("path");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
  const results = await Promise.all(
    files.map(async (f) => {
      try {
        const data = await fs.readFile(path.join(dir, f), "utf-8");
        return JSON.parse(data) as Submission;
      } catch {
        return null;
      }
    })
  );
  return results
    .filter((s): s is Submission => s !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function localDelete(id: string): Promise<void> {
  try {
    const { fs, dir } = await localDir();
    const path = await import("path");
    await fs.unlink(path.join(dir, `${id}.json`));
  } catch {}
}

// ─── Vercel Blob backend ───────────────────────────────────────────────────

async function blobSave(submission: Submission): Promise<void> {
  const { put } = await import("@vercel/blob");
  const body = Buffer.from(JSON.stringify(submission, null, 2));
  await put(`${SUBMISSION_PREFIX}${submission.id}.json`, body, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token: TOKEN,
  });
}

async function blobGet(id: string): Promise<Submission | null> {
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({
      prefix: `${SUBMISSION_PREFIX}${id}.json`,
      token: TOKEN,
    });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Submission;
  } catch {
    return null;
  }
}

async function blobList(): Promise<Submission[]> {
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: SUBMISSION_PREFIX, token: TOKEN });
  const results = await Promise.all(
    blobs.map(async (blob) => {
      try {
        const res = await fetch(blob.url, { cache: "no-store" });
        if (!res.ok) return null;
        return (await res.json()) as Submission;
      } catch {
        return null;
      }
    })
  );
  return results
    .filter((s): s is Submission => s !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function blobDelete(id: string): Promise<void> {
  const { list, del } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: `${SUBMISSION_PREFIX}${id}.json`, token: TOKEN });
  if (blobs.length > 0) await del(blobs[0].url, { token: TOKEN });
}

// ─── Public API ────────────────────────────────────────────────────────────

export const saveSubmission = (s: Submission) => USE_BLOB ? blobSave(s) : localSave(s);
export const getSubmission = (id: string) => USE_BLOB ? blobGet(id) : localGet(id);
export const listSubmissions = () => USE_BLOB ? blobList() : localList();
export const deleteSubmission = (id: string) => USE_BLOB ? blobDelete(id) : localDelete(id);
