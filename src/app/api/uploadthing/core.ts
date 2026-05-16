import {
	createUploadthing,
	type FileRouter,
	UploadThingError,
} from "uploadthing/server";

const f = createUploadthing();

async function getSessionUser(req: Request): Promise<{ id: string } | null> {
	try {
		const authHeader = req.headers.get("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			return null;
		}
		const token = authHeader.slice(7);
		if (!token || token === "demo-session" || token === "guest") {
			return null;
		}
		return { id: token.split(":")[0] || token };
	} catch {
		return null;
	}
}

async function requireAuth(req: Request): Promise<{ id: string }> {
	const user = await getSessionUser(req);
	if (!user) {
		throw new UploadThingError({
			code: "FORBIDDEN",
			message: "Authentication required",
		});
	}
	return user;
}

export const ourFileRouter = {
	imageUploader: f(["image", "video", "pdf"])
		.middleware(async ({ req }) => {
			const user = await requireAuth(req);
			return { userId: user.id };
		})
		.onUploadComplete(async ({ metadata, file }) => {
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
		.onUploadComplete(async ({ metadata, file }) => {
			return { uploadedBy: metadata.userId };
		}),
	subjectsUploader: f({
		"application/json": { maxFileCount: 1 },
	})
		.middleware(async ({ req }) => {
			const user = await requireAuth(req);
			return { userId: user.id };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			return { uploadedBy: metadata.userId };
		}),
	qaUploader: f({
		"application/json": { maxFileCount: 20 },
	})
		.middleware(async ({ req }) => {
			const user = await requireAuth(req);
			return { userId: user.id };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			return { uploadedBy: metadata.userId };
		}),
	generalUploader: f(["image", "video", "pdf", "audio", "text"])
		.middleware(async ({ req }) => {
			const user = await requireAuth(req);
			return { userId: user.id };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			return { uploadedBy: metadata.userId };
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
