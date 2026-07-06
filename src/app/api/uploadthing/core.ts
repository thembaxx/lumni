import { createUploadthing, type FileRouter, UploadThingError } from "uploadthing/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";

const f = createUploadthing();

async function requireAuth(_req: Request): Promise<{ id: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new UploadThingError({
      code: "FORBIDDEN",
      message: "Authentication required",
    });
  }
  return { id: userId };
}

export const ourFileRouter = {
  imageUploader: f(["image", "video", "pdf"])
    .middleware(async ({ req }) => {
      const user = await requireAuth(req);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),
  avatarUploader: f(["image"])
    .middleware(async ({ req }) => {
      const user = await requireAuth(req);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { avatarUrl: file.ufsUrl, uploadedBy: metadata.userId };
    }),
  examPapersUploader: f(["pdf"])
    .middleware(async ({ req }) => {
      const user = await requireAuth(req);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),
  subjectsUploader: f({
    "application/json": { maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const user = await requireAuth(req);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),
  qaUploader: f({
    "application/json": { maxFileCount: 20 },
  })
    .middleware(async ({ req }) => {
      const user = await requireAuth(req);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),
  generalUploader: f(["image", "video", "pdf", "audio", "text"])
    .middleware(async ({ req }) => {
      const user = await requireAuth(req);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
