import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import type { Subject } from "@/lib/db/client";
import {
	COLLECTIONS,
	createDocument,
	deleteDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";

function mapSubject(s: Subject) {
	return { ...s, id: s.code || s.$id };
}

export const GET = createRouteHandler({
	auth: "admin",
	errorLabel: "Subjects",
	execute: async () => {
		const subjects = await listDocuments<Subject>(COLLECTIONS.SUBJECTS);
		return { subjects: subjects.map(mapSubject) };
	},
});

export const POST = createRouteHandler({
	auth: "admin",
	errorLabel: "Subjects",
	validate: (body) => {
		if (!body.name || !body.code) return "Name and code are required";
		return null;
	},
	execute: async ({ body }) => {
		const { name, code, description, category, color } = body as {
			name: string;
			code: string;
			description?: string;
			category?: string;
			color?: string;
		};

		const id = code.toLowerCase().replace(/\s+/g, "-");

		await createDocument(COLLECTIONS.SUBJECTS, {
			name,
			code,
			description,
			category: category || "general",
			color,
		});

		return { success: true, id };
	},
});

export const PATCH = createRouteHandler({
	auth: "admin",
	errorLabel: "Subjects",
	validate: (body) => {
		if (!body.id) return "ID is required";
		return null;
	},
	execute: async ({ body }) => {
		const { id, name, code, description, category } = body as {
			id: string;
			name?: string;
			code?: string;
			description?: string;
			category?: string;
		};

		const updateData: Record<string, unknown> = {
			name,
			description,
			category,
		};
		if (code) {
			updateData.code = code.toLowerCase().replace(/\s+/g, "-");
		}

		await updateDocument(COLLECTIONS.SUBJECTS, id, updateData);

		return { success: true };
	},
});

export const DELETE = createRouteHandler({
	auth: "admin",
	errorLabel: "Subjects",
	execute: async ({ req }) => {
		const { searchParams } = new URL(req.url);
		const id = searchParams.get("id");

		if (!id) {
			throw new HttpError(400, "ID is required");
		}

		await deleteDocument(COLLECTIONS.SUBJECTS, id);

		return { success: true };
	},
});
