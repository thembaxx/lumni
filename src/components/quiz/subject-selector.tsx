"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import CalculatorIcon from "@hugeicons/core-free-icons/CalculatorIcon";
import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon";
import ColorsIcon from "@hugeicons/core-free-icons/ColorsIcon";
import ConstructionIcon from "@hugeicons/core-free-icons/ConstructionIcon";
import DnaIcon from "@hugeicons/core-free-icons/DnaIcon";
import EcoEnergyIcon from "@hugeicons/core-free-icons/EcoEnergyIcon";
import FavouriteIcon from "@hugeicons/core-free-icons/FavouriteIcon";
import FlashIcon from "@hugeicons/core-free-icons/FlashIcon";
import GlobeIcon from "@hugeicons/core-free-icons/GlobeIcon";
import LandmarkIcon from "@hugeicons/core-free-icons/LandmarkIcon";
import LaptopIcon from "@hugeicons/core-free-icons/LaptopIcon";
import MapPinIcon from "@hugeicons/core-free-icons/MapPinIcon";
import MapsIcon from "@hugeicons/core-free-icons/MapsIcon";
import MusicNote01Icon from "@hugeicons/core-free-icons/MusicNote01Icon";
import PenTool01Icon from "@hugeicons/core-free-icons/PenTool01Icon";
import PhysicsIcon from "@hugeicons/core-free-icons/PhysicsIcon";
import ReceiptTextIcon from "@hugeicons/core-free-icons/ReceiptTextIcon";
import Restaurant01Icon from "@hugeicons/core-free-icons/Restaurant01Icon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import ShoppingCart01Icon from "@hugeicons/core-free-icons/ShoppingCart01Icon";
import ToolsIcon from "@hugeicons/core-free-icons/ToolsIcon";
import WorkIcon from "@hugeicons/core-free-icons/WorkIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFilteredSubjects } from "@/hooks";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";

interface SubjectSelectorProps {
  onSelect: (subject: string) => void;
  className?: string;
}

const iconMap: Record<string, typeof BookOpen01Icon> = {
  book: BookOpen01Icon,
  "book-open": BookOpen01Icon,
  calculator: CalculatorIcon,
  atom: PhysicsIcon,
  dna: DnaIcon,
  plant: EcoEnergyIcon,
  receipt: ReceiptTextIcon,
  briefcase: WorkIcon,
  "chart-line": ChartUpIcon,
  globe: GlobeIcon,
  "ancient-pyramids": LandmarkIcon,
  heart: FavouriteIcon,
  laptop: LaptopIcon,
  monitor: LaptopIcon,
  "pen-tool": PenTool01Icon,
  hammer: ConstructionIcon,
  zap: FlashIcon,
  wrench: ToolsIcon,
  palette: ColorsIcon,
  "theater-masks": MapPinIcon,
  music: MusicNote01Icon,
  "shopping-cart": ShoppingCart01Icon,
  map: MapsIcon,
  utensils: Restaurant01Icon,
  tractor: EcoEnergyIcon,
};

function getSubjectIcon(iconName: string) {
  return iconMap[iconName] || BookOpen01Icon;
}

export function SubjectSelector({ onSelect, className }: SubjectSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: subjects } = useFilteredSubjects(searchQuery, true);
  const [selected, setSelected] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSelect = async (subjectId: string) => {
    setSelected(subjectId);
    setIsGenerating(true);
    try {
      onSelect(subjectId);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <div className="pb-2">
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            placeholder="Search subjects…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 rounded-lg pr-4 pl-10"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {subjects.map((subject) => {
          const Icon = getSubjectIcon(subject.icon);
          const isSelected = selected === subject.id;

          return (
            <Button
              key={subject.id}
              variant="ghost"
              onClick={() => handleSelect(subject.id)}
              disabled={isGenerating}
              className={cn(
                "group flex h-auto w-full flex-col items-start justify-start rounded-2xl border border-border/60 p-4 text-left",
                "hover:-translate-y-0.5 hover:border-border hover:shadow-black/5 hover:shadow-level-2 dark:hover:shadow-black/20",
                "focus-visible:border-[--system-accent]/50 focus-visible:ring-2 focus-visible:ring-[--system-accent]/30",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none",
                isSelected &&
                  "border-[--system-accent] bg-[--system-accent]/5 shadow-level-1 shadow-md dark:bg-[--system-accent]/10",
              )}
            >
              <div
                className="mb-3 flex size-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                style={{
                  backgroundColor: `${subject.color}15`,
                  boxShadow: `0 0 0 1px ${subject.color}20`,
                }}
              >
                <HugeiconsIcon icon={Icon} className={cn("size-5", `text-[${subject.color}]`)} />
              </div>
              <h3 className="font-semibold text-foreground text-sm group-hover:text-foreground/90">
                {subject.name}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                {subject.description}
              </p>
            </Button>
          );
        })}
      </div>
      {isGenerating && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded-full" />
            <span className="text-muted-foreground text-sm">Generating questions with AI…</span>
          </div>
        </div>
      )}
    </div>
  );
}
