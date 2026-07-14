"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import File02Icon from "@hugeicons/core-free-icons/File02Icon";
import Logout01Icon from "@hugeicons/core-free-icons/Logout01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { springPresets } from "@/lib/utils/spring-presets";
import { useEffect, useReducer, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/headers/page-header";
import { TabSwitcher } from "@/components/ui/tab-switcher";
import { SUCCESS_BANNER_DURATION } from "@/lib/shared/durations";
import { AnimatedCard } from "@/components/ui/animated-card";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/navigation";
import { AdminExamList } from "./admin-exam-list";
import { AdminExamUploadZone } from "./admin-exam-upload-zone";
import { AdminStatCards } from "./admin-stat-cards";
import { SubjectForm } from "./admin-subject-form";
import { SubjectTable } from "./admin-subject-table";
import { AdminMetricsDashboard } from "./admin-metrics-dashboard";
import { adminReducer, adminInitialState, type Subject } from "./admin-reducer";

export function AdminDashboard() {
  const { push } = useRouter();
  const queryClient = useQueryClient();
  const [admin, dispatch] = useReducer(adminReducer, adminInitialState);
  const { selectedSubjects, editSubject, newSubject, activeTab, showSuccess } = admin;
  const successTimeoutRef = useRef<NodeJS.Timeout[]>([]);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const ref = successTimeoutRef;
    return () => {
      for (const id of ref.current) clearTimeout(id);
    };
  }, []);

  const { data: subjectsData, isLoading } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: async () => {
      const res = await fetch("/api/admin/subjects");
      if (!res.ok) throw new Error("Failed to fetch subjects");
      return res.json() as Promise<{ subjects: Subject[] }>;
    },
  });

  const subjects = subjectsData?.subjects || [];

  const saveMutation = useMutation({
    mutationFn: async (subject: {
      id?: string;
      name: string;
      code: string;
      description: string;
      category: string;
    }) => {
      const method = subject.id ? "PATCH" : "POST";
      const res = await fetch("/api/admin/subjects", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subject),
      });
      if (!res.ok) throw new Error("Failed to save subject");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subjects"] });
      dispatch({ type: "SET_EDIT_SUBJECT", payload: null });
      dispatch({ type: "RESET_FORM_DATA" });
      dispatch({ type: "SHOW_SUCCESS" });
      successTimeoutRef.current.push(
        setTimeout(() => dispatch({ type: "HIDE_SUCCESS" }), SUCCESS_BANNER_DURATION),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/subjects?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete subject");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subjects"] });
      dispatch({ type: "SHOW_SUCCESS" });
      successTimeoutRef.current.push(
        setTimeout(() => dispatch({ type: "HIDE_SUCCESS" }), SUCCESS_BANNER_DURATION),
      );
    },
  });

  const preloadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/subjects/preload?action=preload", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to preload");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subjects"] });
      dispatch({ type: "SHOW_SUCCESS" });
      successTimeoutRef.current.push(
        setTimeout(() => dispatch({ type: "HIDE_SUCCESS" }), SUCCESS_BANNER_DURATION),
      );
    },
  });

  const handleSignOut = () => {
    localStorage.removeItem("admin_session");
    localStorage.removeItem("admin_email");
    push("/admin");
  };

  const handleSaveSubject = () => {
    if (!newSubject.name || !newSubject.code) {
      toast({ type: "error", message: "Name and code are required" });
      return;
    }
    const subject = editSubject ? { id: editSubject.id, ...newSubject } : newSubject;
    saveMutation.mutate(subject);
  };

  const handleDeleteSubject = (id: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;
    deleteMutation.mutate(id);
  };

  const toggleSubject = (subjectId: string) => {
    dispatch({ type: "TOGGLE_SUBJECT", payload: subjectId });
  };

  return (
    <div className="min-h-dvh bg-background">
      <AnimatePresence initial={false}>
        {showSuccess && (
          <m.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 z-toast flex -translate-x-1/2 items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-background shadow-level-2"
          >
            <m.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={prefersReducedMotion ? { duration: 0 } : springPresets.fast}
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
            </m.div>
            <span className="font-medium text-sm">Success!</span>
          </m.div>
        )}
      </AnimatePresence>

      <PageHeader
        title="Admin"
        subtitle="Manage exam papers & engine"
        rightSection={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => push("/admin/gamification")}>
              Gamification
            </Button>
            <Button variant="ghost" size="sm" onClick={() => push("/admin/past-papers")}>
              Past Qs
            </Button>
            <Button variant="ghost" size="sm" onClick={() => push("/admin/questions")}>
              Questions
            </Button>
            <Button variant="ghost" size="sm" onClick={() => push("/admin/budget")}>
              Budget
            </Button>
            <Button variant="ghost" size="sm" onClick={() => push("/admin/observability")}>
              Observability
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const el = document.getElementById("admin-metrics");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Metrics
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={handleSignOut} aria-label="Sign out">
              <HugeiconsIcon icon={Logout01Icon} data-icon />
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4 p-4">
        <AdminStatCards subjectsCount={subjects.length} selectedCount={selectedSubjects.size} />

        <AnimatedCard delay={0.1}>
          <TabSwitcher
            tabs={[
              {
                value: "exam",
                label: "Exam",
                icon: <HugeiconsIcon icon={File02Icon} className="size-4" />,
              },
              {
                value: "subjects",
                label: "Subjects",
                icon: <HugeiconsIcon icon={BookOpen01Icon} className="size-4" />,
              },
            ]}
            value={activeTab}
            onValueChange={(v) => dispatch({ type: "SET_TAB", payload: v as "exam" | "subjects" })}
            listClassName="w-full"
          >
            {activeTab === "exam" && (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-4"
              >
                <AnimatedCard delay={0.15}>
                  <AdminExamUploadZone
                    onUploadComplete={() => {
                      queryClient.invalidateQueries({
                        queryKey: ["admin-exams"],
                      });
                    }}
                  />
                </AnimatedCard>

                <AnimatedCard delay={0.2}>
                  <AdminExamList />
                </AnimatedCard>
              </m.div>
            )}

            {activeTab === "subjects" && (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-4"
              >
                <AnimatedCard delay={0.15}>
                  <SubjectForm
                    editSubject={editSubject}
                    formData={newSubject}
                    onFormDataChange={(data) => dispatch({ type: "SET_FORM_DATA", payload: data })}
                    onSave={handleSaveSubject}
                    onCancel={() => dispatch({ type: "SET_EDIT_SUBJECT", payload: null })}
                    onPreload={() => preloadMutation.mutate()}
                    isSaving={saveMutation.isPending}
                    isPreloading={preloadMutation.isPending}
                  />
                </AnimatedCard>

                <AnimatedCard delay={0.2}>
                  <Card>
                    <CardHeader>
                      <CardTitle>All Subjects ({subjects.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <SubjectTable
                        subjects={subjects}
                        selectedSubjects={selectedSubjects}
                        onToggleSubject={toggleSubject}
                        onEditSubject={(subject) =>
                          dispatch({
                            type: "SET_EDIT_SUBJECT",
                            payload: subject,
                          })
                        }
                        onDeleteSubject={handleDeleteSubject}
                        isLoading={isLoading}
                        isDeleting={deleteMutation.isPending}
                      />
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </m.div>
            )}
          </TabSwitcher>
        </AnimatedCard>
      </div>

      <div className="p-4">
        <AdminMetricsDashboard />
      </div>
    </div>
  );
}
