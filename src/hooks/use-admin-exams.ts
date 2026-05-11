import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface ExamListItem {
	id: string;
	subject: string;
	paperCode: string;
	examPeriod: string;
	year: number;
	language: string;
	totalMarks: number;
	duration: string;
	uploadedAt: string;
}

export function useAdminExams() {
	const queryClient = useQueryClient();

	const listQuery = useQuery({
		queryKey: ["admin-exams"],
		queryFn: async () => {
			const res = await fetch("/api/admin/exams");
			if (!res.ok) throw new Error("Failed to fetch exams");
			return res.json() as Promise<{
				exams: ExamListItem[];
				total: number;
			}>;
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			const res = await fetch(`/api/admin/exams/${id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to delete exam");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
		},
	});

	return {
		exams: listQuery.data?.exams || [],
		total: listQuery.data?.total || 0,
		isLoading: listQuery.isLoading,
		delete: deleteMutation.mutate,
		isDeleting: deleteMutation.isPending,
		refresh: () => queryClient.invalidateQueries({ queryKey: ["admin-exams"] }),
	};
}
