"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { apiFetch } from "@/lib/shared/api-fetch";

interface MemberCheck {
  isMember: boolean;
  role?: string;
}

export default function SchoolHubPage() {
  const [checking, setChecking] = useState(true);
  const [hasSchool, setHasSchool] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const data = await apiFetch<MemberCheck>("/api/school/members?schoolId=school", {
          method: "GET",
        });
        if (!cancelled) {
          setHasSchool(data.isMember === true);
        }
      } catch {
        if (!cancelled) setHasSchool(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!checking && hasSchool) {
      window.location.href = "/school/admin";
    }
  }, [checking, hasSchool]);

  if (checking) {
    return (
      <PageContainer>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </PageContainer>
    );
  }

  if (hasSchool) {
    return (
      <PageContainer>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-sm text-muted-foreground">Redirecting to school admin...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex min-h-[60vh] items-center justify-center py-12">
        <Card className="max-w-lg">
          <CardContent className="flex flex-col gap-6 p-8 text-center">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Lumni for Schools</h1>
              <p className="text-sm text-muted-foreground">
                Bring AI-powered learning to your entire school. Manage teachers, students, and
                learning resources from one dashboard.
              </p>
            </div>
            <ul className="flex flex-col gap-2 text-left text-sm text-muted-foreground">
              <li>✓ Unlimited AI question generation for teachers</li>
              <li>✓ Student progress tracking and analytics</li>
              <li>✓ Custom study materials and assessments</li>
              <li>✓ Dedicated support and onboarding</li>
            </ul>
            <Button asChild size="lg">
              <Link href="/school/onboarding">Set Up Your School</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
