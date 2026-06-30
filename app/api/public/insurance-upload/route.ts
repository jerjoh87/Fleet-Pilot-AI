import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const INSURANCE_BUCKET = "insurance-docs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"]);
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "application/pdf": "pdf"
};

/**
 * Accepts a single insurance document (image or PDF) and stores it in a
 * PRIVATE Supabase Storage bucket. Returns the storage path, which the booking
 * flow then attaches to the reservation's insurance upload. Files are only
 * ever served back through the authenticated /api/insurance-docs route.
 */
export async function POST(request: Request) {
  const ip = clientIp(request.headers) || "unknown";
  const limit = await rateLimit(`insurance-upload:${ip}`, { limit: 20, windowSec: 600 });
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many uploads. Please wait a few minutes." }, { status: 429 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "File uploads are not available in this environment." }, { status: 503 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const slug = String(form?.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "") || "unknown";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 10 MB)." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type. Upload a JPG, PNG, or PDF." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Ensure the private bucket exists (idempotent — ignore "already exists").
  const { error: bucketError } = await supabase.storage.createBucket(INSURANCE_BUCKET, {
    public: false,
    fileSizeLimit: MAX_BYTES
  });
  if (bucketError && !/exist/i.test(bucketError.message)) {
    console.error("[insurance-upload] bucket error:", bucketError.message);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  const ext = EXT_BY_TYPE[file.type] ?? "bin";
  const storagePath = `${slug}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(INSURANCE_BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("[insurance-upload] upload error:", uploadError.message);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ storagePath, fileName: file.name, contentType: file.type });
}
