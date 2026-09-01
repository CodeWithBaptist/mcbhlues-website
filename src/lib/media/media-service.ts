import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { mediaAssets } from "@/db/schema";

export interface MediaAssetInput {
  title?: string;
  url?: string;
  kind?: string;
  folder?: string;
  alt?: string;
}

export const MEDIA_KINDS = ["image", "document", "logo"] as const;

export async function listMediaAssets() {
  const db = await getDb();
  return db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt));
}

export async function createMediaAsset(input: MediaAssetInput & { title: string; url: string }, actorId: string) {
  const db = await getDb();
  const kind = MEDIA_KINDS.includes(input.kind as (typeof MEDIA_KINDS)[number]) ? input.kind! : "image";
  const [created] = await db
    .insert(mediaAssets)
    .values({
      title: input.title.trim(),
      url: input.url.trim(),
      kind,
      folder: input.folder?.trim() || "general",
      alt: input.alt?.trim() ?? "",
      uploadedBy: actorId,
    })
    .returning();
  return created;
}

export async function updateMediaAsset(id: string, input: MediaAssetInput) {
  const db = await getDb();
  const [existing] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  if (!existing) return null;

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.url !== undefined) patch.url = input.url.trim();
  if (input.kind !== undefined && MEDIA_KINDS.includes(input.kind as (typeof MEDIA_KINDS)[number])) {
    patch.kind = input.kind;
  }
  if (input.folder !== undefined) patch.folder = input.folder.trim() || "general";
  if (input.alt !== undefined) patch.alt = input.alt.trim();

  const [updated] = await db.update(mediaAssets).set(patch).where(eq(mediaAssets.id, id)).returning();
  return updated ?? null;
}

export async function deleteMediaAsset(id: string): Promise<boolean> {
  const db = await getDb();
  const [deleted] = await db.delete(mediaAssets).where(eq(mediaAssets.id, id)).returning({ id: mediaAssets.id });
  return Boolean(deleted);
}
