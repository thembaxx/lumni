import {
	createUploadthing,
	type FileRouter,
	UploadThingError,
} from "uploadthing/server";

const f = createUploadthing();

const auth = (req: Request) => {
	return { id: "user_id" };
};

export const ourFileRouter = {
	imageUploader: f(["image", "video", "pdf"])
		.middleware(async ({ req }) => {
			const user = await auth(req);
			if (!user) throw new UploadThingError("Unauthorized");
			return { userId: user.id };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log("Upload complete for userId:", metadata.userId);
			console.log("file url", file.ufsUrl);
			return { uploadedBy: metadata.userId };
		}),
	subjectsUploader: f({
		"application/json": { maxFileSize: "1MB", maxFileCount: 1 },
	})
		.middleware(async ({ req }) => {
			const user = await auth(req);
			if (!user) throw new UploadThingError("Unauthorized");
			return { userId: user.id };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log("Upload complete for userId:", metadata.userId);
			console.log("file url", file.ufsUrl);
			return { uploadedBy: metadata.userId };
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
