import type { Submission, ModuleId, ModuleResponse } from "./types";

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const SUBMISSION_PREFIX = "submissions/";
const RESPONSE_PREFIX = "responses/";

// ─── Local filesystem fallback (dev without Vercel Blob) ───────────────────

async function localDir() {
  const { promises: fs } = await import("fs");
  const path = await import("path");
  const dir = path.join(process.cwd(), ".local-data", "submissions");
  await fs.mkdir(dir, { recursive: true });
  return { fs, dir };
}

async function localResponseDir(submissionId: string) {
  const { promises: fs } = await import("fs");
  const path = await import("path");
  const dir = path.join(process.cwd(), ".local-data", "responses", submissionId);
  await fs.mkdir(dir, { recursive: true });
  return { fs, dir };
}

async function localSave(submission: Submission): Promise<void> {
  const { fs, dir } = await localDir();
  const path = await import("path");
  // Strip responses before saving meta — they live in their own files
  const { responses: _, ...meta } = submission;
  await fs.writeFile(
    path.join(dir, `${submission.id}.json`),
    JSON.stringify({ ...meta, responses: {} }, null, 2),
    "utf-8"
  );
}

async function localSaveResponse(
  submissionId: string,
  moduleId: ModuleId,
  response: ModuleResponse
): Promise<void> {
  const { fs, dir } = await localResponseDir(submissionId);
  const path = await import("path");
  await fs.writeFile(
    path.join(dir, `${moduleId}.json`),
    JSON.stringify(response, null, 2),
    "utf-8"
  );
}

async function localGetAllResponses(
  submissionId: string
): Promise<Partial<Record<ModuleId, ModuleResponse>>> {
  try {
    const { fs, dir } = await localResponseDir(submissionId);
    const path = await import("path");
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
    const responses: Partial<Record<ModuleId, ModuleResponse>> = {};
    await Promise.all(
      files.map(async (f) => {
        try {
          const moduleId = f.replace(".json", "") as ModuleId;
          const data = await fs.readFile(path.join(dir, f), "utf-8");
          responses[moduleId] = JSON.parse(data) as ModuleResponse;
        } catch {}
      })
    );
    return responses;
  } catch {
    return {};
  }
}

async function localGet(id: string): Promise<Submission | null> {
  try {
    const { fs, dir } = await localDir();
    const path = await import("path");
    const data = await fs.readFile(path.join(dir, `${id}.json`), "utf-8");
    const submission = JSON.parse(data) as Submission;
    submission.responses = await localGetAllResponses(id);
    return submission;
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
        const submission = JSON.parse(data) as Submission;
        submission.responses = await localGetAllResponses(submission.id);
        return submission;
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

async function blobPutJson(blobPath: string, data: unknown): Promise<void> {
  const { put } = await import("@vercel/blob");
  await put(blobPath, Buffer.from(JSON.stringify(data, null, 2)), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token: TOKEN,
  });
}

async function blobFetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function blobSave(submission: Submission): Promise<void> {
  // Save meta only — responses live in their own files
  const { responses: _, ...meta } = submission;
  await blobPutJson(`${SUBMISSION_PREFIX}${submission.id}.json`, {
    ...meta,
    responses: {},
  });
}

async function blobSaveResponse(
  submissionId: string,
  moduleId: ModuleId,
  response: ModuleResponse
): Promise<void> {
  await blobPutJson(
    `${RESPONSE_PREFIX}${submissionId}/${moduleId}.json`,
    response
  );
}

async function blobGetAllResponses(
  submissionId: string
): Promise<Partial<Record<ModuleId, ModuleResponse>>> {
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({
    prefix: `${RESPONSE_PREFIX}${submissionId}/`,
    token: TOKEN,
  });
  const responses: Partial<Record<ModuleId, ModuleResponse>> = {};
  await Promise.all(
    blobs.map(async (blob) => {
      const moduleId = blob.pathname
        .split("/")
        .pop()
        ?.replace(".json", "") as ModuleId | undefined;
      if (!moduleId) return;
      const data = await blobFetchJson<ModuleResponse>(blob.url);
      if (data) responses[moduleId] = data;
    })
  );
  return responses;
}

async function blobGet(id: string): Promise<Submission | null> {
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({
      prefix: `${SUBMISSION_PREFIX}${id}.json`,
      token: TOKEN,
    });
    if (blobs.length === 0) return null;
    const submission = await blobFetchJson<Submission>(blobs[0].url);
    if (!submission) return null;
    submission.responses = await blobGetAllResponses(id);
    return submission;
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
        const submission = await blobFetchJson<Submission>(blob.url);
        if (!submission) return null;
        submission.responses = await blobGetAllResponses(submission.id);
        return submission;
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
export const saveResponse = (
  submissionId: string,
  moduleId: ModuleId,
  response: ModuleResponse
) => USE_BLOB
  ? blobSaveResponse(submissionId, moduleId, response)
  : localSaveResponse(submissionId, moduleId, response);
