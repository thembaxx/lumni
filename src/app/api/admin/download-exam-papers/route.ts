import { ExamDownloadService } from "@/lib/admin";
import { createRouteHandler } from "@/lib/api/create-route-handler";

interface DownloadRequest {
	year: number;
	examTypes: string[];
	includeMemo: boolean;
	subjectIds: string[];
}

export const POST = createRouteHandler({
	auth: "admin",
	errorLabel: "DownloadExamPapers",
	validate: (body) => {
		const { year, examTypes, subjectIds } = body as unknown as DownloadRequest;
		if (!year || !examTypes || !subjectIds)
			return "year, examTypes, and subjectIds are required";
		return null;
	},
	execute: async ({ body }) => {
		const request = body as unknown as DownloadRequest;
		const service = new ExamDownloadService();
		return service.download(request);
	},
});
