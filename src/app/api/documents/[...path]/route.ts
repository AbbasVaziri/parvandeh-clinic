import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "@/shared/lib/constants";

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { path: segments } = await context.params;
  if (!segments || segments.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const relative = segments.map((s) => decodeURIComponent(s)).join("/");
  const root = path.resolve(UPLOADS_DIR);
  const abs = path.resolve(path.join(UPLOADS_DIR, relative));
  if (!abs.startsWith(root)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const data = await readFile(abs);
    const ext = path.extname(abs).toLowerCase();
    const contentType = extToMime(ext) ?? "application/octet-stream";
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": contentType },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

function extToMime(ext: string): string | null {
  const map: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
  };
  return map[ext] ?? null;
}
