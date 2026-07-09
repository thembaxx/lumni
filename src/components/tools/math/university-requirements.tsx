"use client";

import { FadeIn } from "@/components/shared/fade-in";
import { cn } from "@/lib/utils";

interface UniversityRequirement {
  university: string;
  minAPS: number;
  courses: Record<string, number>;
}

const universityRequirements: UniversityRequirement[] = [
  {
    university: "University of Cape Town (UCT)",
    minAPS: 33,
    courses: { medicine: 40, engineering: 36, commerce: 33, law: 35, science: 33 },
  },
  {
    university: "University of the Witwatersrand (Wits)",
    minAPS: 34,
    courses: { medicine: 38, engineering: 33, commerce: 32, law: 34, science: 30 },
  },
  {
    university: "University of Pretoria (UP)",
    minAPS: 28,
    courses: { medicine: 38, engineering: 35, commerce: 32, law: 32, science: 30 },
  },
  {
    university: "Stellenbosch University",
    minAPS: 28,
    courses: { medicine: 38, engineering: 35, commerce: 33, law: 33, science: 30 },
  },
  {
    university: "University of Johannesburg (UJ)",
    minAPS: 26,
    courses: { medicine: 35, engineering: 32, commerce: 30, law: 30, science: 28 },
  },
];

interface UniversityRequirementsProps {
  totalAPS: number;
}

export function UniversityRequirements({ totalAPS }: UniversityRequirementsProps) {
  return (
    <div className="px-5 pb-10">
      <p className="mb-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
        University Requirements
      </p>
      <div className="flex flex-col gap-3">
        {universityRequirements.map((uni, idx) => {
          const meetsMin = totalAPS >= uni.minAPS;
          return (
            <FadeIn
              key={uni.university}
              direction="up"
              distance={10}
              delay={idx * 0.05}
              className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              {meetsMin && (
                <div className="absolute top-0 bottom-0 left-0 w-1 rounded-r-full bg-success" />
              )}
              <div className="mb-3 flex items-start justify-between">
                <span className="font-medium text-sm">{uni.university}</span>
                <span
                  className={cn(
                    "font-bold text-sm tabular-nums",
                    meetsMin ? "text-success" : "text-destructive",
                  )}
                >
                  Min: {uni.minAPS}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {Object.entries(uni.courses).map(([course, req]) => (
                  <span
                    key={course}
                    className={
                      totalAPS >= req
                        ? "text-success capitalize"
                        : "text-muted-foreground capitalize"
                    }
                  >
                    {course}: {req}+
                  </span>
                ))}
              </div>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
}
