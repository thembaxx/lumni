"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeatManager } from "@/components/school/seat-manager";
import { apiFetch } from "@/lib/shared/api-fetch";
import { logError } from "@/lib/shared/logger";

interface SchoolInfo {
  id: string;
  name: string;
  domain: string | null;
  licenseTier: string;
  seatCount: number;
  seatsUsed: number;
  billingStatus: string;
  trialEndsAt: string | null;
}

interface MembersData {
  admins: { userId: string }[];
  teachers: { userId: string }[];
  students: { userId: string }[];
}

export function SchoolAdminClient() {
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [members, setMembers] = useState<MembersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string>("");

  const fetchSchoolData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<{
        school: SchoolInfo;
        admins: { userId: string }[];
        teachers: { userId: string }[];
        students: { userId: string }[];
        joinCode?: string;
      }>("/api/school/members?schoolId=school", { method: "GET" });

      setSchool(data.school);
      setMembers({ admins: data.admins, teachers: data.teachers, students: data.students });
      if (data.joinCode) setJoinCode(data.joinCode);
    } catch (err) {
      logError("SchoolAdminClient.fetchSchoolData", err);
      setError("Failed to load school data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchoolData();
  }, [fetchSchoolData]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading school data...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchSchoolData}>
          Retry
        </Button>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          No school found. Set up your school to get started.
        </p>
        <Button asChild>
          <Link href="/school/onboarding">Set Up Your School</Link>
        </Button>
      </div>
    );
  }

  const tierLabel =
    school.licenseTier === "free"
      ? "Free"
      : school.licenseTier === "standard"
        ? "Standard"
        : school.licenseTier === "premium"
          ? "Premium"
          : school.licenseTier;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">School</span>
              <span className="font-medium">{school.name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Domain</span>
              <span className="font-medium">{school.domain ?? "Not set"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="font-medium">{tierLabel}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="font-medium capitalize">{school.billingStatus}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {members && (
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <h2 className="text-lg font-semibold">Members</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Admins</span>
                <span className="font-medium">{members.admins.length}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Teachers</span>
                <span className="font-medium">{members.teachers.length}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Students</span>
                <span className="font-medium">{members.students.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {joinCode && school && (
        <SeatManager
          schoolId={school.id}
          joinCode={joinCode}
          seatCount={school.seatCount}
          seatsUsed={school.seatsUsed}
        />
      )}

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/school/billing">Billing & Plan</Link>
        </Button>
      </div>
    </div>
  );
}
