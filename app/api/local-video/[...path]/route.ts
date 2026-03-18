import { NextRequest, NextResponse } from "next/server";

// Only active in local dev (no BLOB_READ_WRITE_TOKEN)
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/local-video/[...path]">
) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { path: segments } = await ctx.params;
  const nodePath = await import("path");
  const { promises: fs } = await import("fs");

  const filePath = nodePath.join(
    process.cwd(),
    ".local-data",
    ...segments // segments = ["videos", submissionId, "moduleId.ext"]
  );

  try {
    const data = await fs.readFile(filePath);
    const ext = segments[segments.length - 1].split(".").pop() ?? "webm";
    const mimeMap: Record<string, string> = {
      webm: "video/webm",
      mp4: "video/mp4",
      mov: "video/quicktime",
    };
    return new NextResponse(data, {
      headers: { "Content-Type": mimeMap[ext] ?? "video/webm" },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
