"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Clock,
  Target,
  Users,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  RefreshCw,
} from "@hugeicons/core-free-icons";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface RiskFactor {
  type: string;
  severity: "high" | "medium" | "low";
  description: string;
  value?: number;
  threshold?: number;
}

interface StudentRisk {
  studentId: string;
  studentName: string;
  studentEmail: string;
  riskScore: number;
  factors: RiskFactor[];
  lastActive: number;
  recommendation: string;
}

interface TeacherRiskAlertsProps {
  students: StudentRisk[];
}

export function TeacherRiskAlerts({ students }: TeacherRiskAlertsProps) {
  const t = useTranslations("teacher.riskAlerts");
  const [sortBy, setSortBy] = useState<"riskScore" | "lastActive" | "name">("riskScore");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterSeverity, setFilterSeverity] = useState<"all" | "high" | "medium" | "low">("all");
  const [isLoading, setIsLoading] = useState(false);

  const sortedStudents = useMemo(() => {
    let filtered = students;
    if (filterSeverity !== "all") {
      filtered = filtered.filter((s) => s.factors.some((f) => f.severity === filterSeverity));
    }

    return filtered.toSorted((a, b) => {
      let comparison = 0;
      if (sortBy === "riskScore") comparison = b.riskScore - a.riskScore;
      else if (sortBy === "lastActive") comparison = b.lastActive - a.lastActive;
      else if (sortBy === "name") comparison = a.studentName.localeCompare(b.studentName);

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [students, filterSeverity, sortBy, sortOrder]);

  const handleIntervene = async (studentId: string) => {
    setIsLoading(true);
    try {
      await fetch("/api/teacher/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, action: "create" }),
      });
      // Refresh would happen via query invalidation
    } catch (err) {
      console.error("Intervention failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (score: number) => {
    if (score >= 0.7) return "bg-red-500";
    if (score >= 0.4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getSeverityLabel = (score: number) => {
    if (score >= 0.7) return t("highRisk");
    if (score >= 0.4) return t("mediumRisk");
    return t("lowRisk");
  };

  const highRiskCount = students.filter((s) => s.riskScore >= 0.7).length;
  const mediumRiskCount = students.filter((s) => s.riskScore >= 0.4 && s.riskScore < 0.7).length;
  const lowRiskCount = students.filter((s) => s.riskScore < 0.4).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-200 dark:border-red-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("highRisk")}</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{highRiskCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("mediumRisk")}</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {mediumRiskCount}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("lowRisk")}</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {lowRiskCount}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("totalStudents")}</p>
                <p className="text-3xl font-bold">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Sort */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="severity-filter"
                className="text-sm font-medium text-muted-foreground"
              >
                {t("filterBySeverity")}
              </label>
              <select
                id="severity-filter"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
              >
                <option value="all">{t("allSeverities")}</option>
                <option value="high">{t("highRisk")}</option>
                <option value="medium">{t("mediumRisk")}</option>
                <option value="low">{t("lowRisk")}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-by" className="text-sm font-medium text-muted-foreground">
                {t("sortBy")}
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
              >
                <option value="riskScore">{t("sortByRisk")}</option>
                <option value="lastActive">{t("sortByLastActive")}</option>
                <option value="name">{t("sortByName")}</option>
              </select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                aria-label={sortOrder === "asc" ? t("sortDescending") : t("sortAscending")}
              >
                {sortOrder === "asc" ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Risk Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("studentRiskOverview")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    {t("student")}
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    {t("riskScore")}
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    {t("riskLevel")}
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    {t("keyFactors")}
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    {t("lastActive")}
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {t("noStudentsFound")}
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr
                      key={student.studentId}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
                      {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          <p className="text-sm text-muted-foreground">{student.studentEmail}</p>
                        </div>
                      </td>
                      {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.round(student.riskScore * 100)}
                            className="flex-1 h-2"
                            max={100}
                          />
                          <span className="text-sm font-mono w-12 text-right">
                            {Math.round(student.riskScore * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            student.riskScore >= 0.7
                              ? "destructive"
                              : student.riskScore >= 0.4
                                ? "secondary"
                                : "default"
                          }
                          className={`capitalize ${getSeverityColor(student.riskScore)}`}
                        >
                          {getSeverityLabel(student.riskScore)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {student.factors.slice(0, 2).map((factor, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {factor.description}
                            </Badge>
                          ))}
                          {student.factors.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{student.factors.length - 2} {t("more")}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(student.lastActive).toLocaleDateString()}
                      </td>
                      {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleIntervene(student.studentId)}
                            disabled={isLoading}
                            className="gap-1"
                          >
                            <AlertCircle className="h-3 w-3" />
                            <span>{t("intervene")}</span>
                          </Button>
                          <Link
                            href={`/teacher/students/${student.studentId}`}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {t("viewDetails")}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getSeverityColor(score: number) {
  if (score >= 0.7) return "text-red-600 dark:text-red-400";
  if (score >= 0.4) return "text-yellow-600 dark:text-yellow-400";
  return "text-green-600 dark:text-green-400";
}
