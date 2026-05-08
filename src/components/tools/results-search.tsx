"use client";

import { SearchIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Result {
  name: string;
  examNumber: string;
  school: string;
  province: string;
  subjects: { name: string; percentage: number }[];
  overall: number;
}

const mockResults: Record<number, Result[]> = {
  2025: [
    { name: "Amahle Nkosi", examNumber: "2025/001", school: "Soweto High School", province: "Gauteng", subjects: [{ name: "Mathematics", percentage: 88 }, { name: "Physical Sciences", percentage: 92 }, { name: "English HL", percentage: 85 }, { name: "Life Sciences", percentage: 78 }, { name: "Geography", percentage: 82 }], overall: 85 },
    { name: "Liam van der Merwe", examNumber: "2025/002", school: "Grey College", province: "Free State", subjects: [{ name: "Mathematics", percentage: 94 }, { name: "Physical Sciences", percentage: 91 }, { name: "English HL", percentage: 89 }, { name: "Accounting", percentage: 87 }, { name: "Economics", percentage: 90 }], overall: 90 },
    { name: "Sarah Mthethwa", examNumber: "2025/003", school: "St. Mary's Diocesan", province: "KwaZulu-Natal", subjects: [{ name: "Mathematics", percentage: 95 }, { name: "Physical Sciences", percentage: 93 }, { name: "English HL", percentage: 91 }, { name: "Life Sciences", percentage: 88 }, { name: "Geography", percentage: 89 }], overall: 91 },
    { name: "Joshua Jacobs", examNumber: "2025/004", school: "Rondebosch Boys High", province: "Western Cape", subjects: [{ name: "Mathematics", percentage: 89 }, { name: "Physical Sciences", percentage: 86 }, { name: "English HL", percentage: 92 }, { name: "History", percentage: 88 }, { name: "Geography", percentage: 85 }], overall: 88 },
    { name: "Priya Pillay", examNumber: "2025/005", school: "Westville Girls High", province: "KwaZulu-Natal", subjects: [{ name: "Mathematics", percentage: 97 }, { name: "Physical Sciences", percentage: 95 }, { name: "English HL", percentage: 94 }, { name: "Life Sciences", percentage: 91 }, { name: "Geography", percentage: 93 }], overall: 94 },
  ],
  2024: [
    { name: "Thabo Mokoena", examNumber: "2024/001", school: "Parktown Boys High", province: "Gauteng", subjects: [{ name: "Mathematics", percentage: 91 }, { name: "Physical Sciences", percentage: 88 }, { name: "English HL", percentage: 86 }, { name: "Life Sciences", percentage: 84 }, { name: "Geography", percentage: 87 }], overall: 87 },
    { name: "Emma Steyn", examNumber: "2024/002", school: "Hoër Meisieskool Bloemfontein", province: "Free State", subjects: [{ name: "Mathematics", percentage: 93 }, { name: "Physical Sciences", percentage: 90 }, { name: "Afrikaans HL", percentage: 95 }, { name: "Life Sciences", percentage: 88 }, { name: "Geography", percentage: 89 }], overall: 91 },
    { name: "Siyabonga Mbeki", examNumber: "2024/003", school: "Mthatha High", province: "Eastern Cape", subjects: [{ name: "Mathematics", percentage: 85 }, { name: "Physical Sciences", percentage: 82 }, { name: "English HL", percentage: 88 }, { name: "History", percentage: 86 }, { name: "Geography", percentage: 84 }], overall: 85 },
    { name: "Chloe Williams", examNumber: "2024/004", school: "St. George's College", province: "Western Cape", subjects: [{ name: "Mathematics", percentage: 89 }, { name: "Physical Sciences", percentage: 87 }, { name: "English HL", percentage: 93 }, { name: "Life Sciences", percentage: 85 }, { name: "Business Studies", percentage: 88 }], overall: 88 },
    { name: "Michael Brown", examNumber: "2024/005", school: "Pretoria Boys High", province: "Gauteng", subjects: [{ name: "Mathematics", percentage: 96 }, { name: "Physical Sciences", percentage: 94 }, { name: "English HL", percentage: 90 }, { name: "Accounting", percentage: 92 }, { name: "Economics", percentage: 91 }], overall: 93 },
  ],
  2023: [
    { name: "Nina de Villiers", examNumber: "2023/001", school: "Rustenburg Girls High", province: "Western Cape", subjects: [{ name: "Mathematics", percentage: 94 }, { name: "Physical Sciences", percentage: 91 }, { name: "English HL", percentage: 96 }, { name: "History", percentage: 89 }, { name: "Geography", percentage: 88 }], overall: 92 },
    { name: "Thandeka Dube", examNumber: "2023/002", school: "Girls' High School", province: "KwaZulu-Natal", subjects: [{ name: "Mathematics", percentage: 87 }, { name: "Life Sciences", percentage: 89 }, { name: "English HL", percentage: 91 }, { name: "Geography", percentage: 86 }, { name: "History", percentage: 84 }], overall: 87 },
    { name: "Henk van Zyl", examNumber: "2023/003", school: "Affies", province: "Gauteng", subjects: [{ name: "Mathematics", percentage: 98 }, { name: "Physical Sciences", percentage: 95 }, { name: "Afrikaans HL", percentage: 92 }, { name: "Engineering Graphics", percentage: 94 }, { name: "Technical Mathematics", percentage: 96 }], overall: 95 },
    { name: "Zanele Khoza", examNumber: "2023/004", school: "Orlando High", province: "Gauteng", subjects: [{ name: "Mathematics", percentage: 82 }, { name: "Physical Sciences", percentage: 79 }, { name: "English HL", percentage: 85 }, { name: "Life Sciences", percentage: 81 }, { name: "Geography", percentage: 80 }], overall: 81 },
    { name: "Isabella Fourie", examNumber: "2023/005", school: "Pretoria Girls High", province: "Gauteng", subjects: [{ name: "Mathematics", percentage: 90 }, { name: "Physical Sciences", percentage: 88 }, { name: "English HL", percentage: 94 }, { name: "Life Sciences", percentage: 87 }, { name: "Geography", percentage: 89 }], overall: 90 },
  ],
  2022: [
    { name: "Neo Moloto", examNumber: "2022/001", school: "Mamelodi High", province: "Gauteng", subjects: [{ name: "Mathematics", percentage: 89 }, { name: "Physical Sciences", percentage: 86 }, { name: "English HL", percentage: 88 }, { name: "Life Sciences", percentage: 84 }, { name: "Geography", percentage: 85 }], overall: 86 },
    { name: "Jade Nel", examNumber: "2022/002", school: "Queens College", province: "Eastern Cape", subjects: [{ name: "Mathematics", percentage: 92 }, { name: "Physical Sciences", percentage: 89 }, { name: "English HL", percentage: 95 }, { name: "History", percentage: 91 }, { name: "Geography", percentage: 88 }], overall: 91 },
    { name: "Sibusiso Ndlovu", examNumber: "2022/003", school: "Empangeni High", province: "KwaZulu-Natal", subjects: [{ name: "Mathematics", percentage: 84 }, { name: "Physical Sciences", percentage: 81 }, { name: "English HL", percentage: 87 }, { name: "Geography", percentage: 83 }, { name: "Life Sciences", percentage: 80 }], overall: 83 },
    { name: "Anika Greyling", examNumber: "2022/004", school: "Bloemfontein Boys High", province: "Free State", subjects: [{ name: "Mathematics", percentage: 95 }, { name: "Physical Sciences", percentage: 93 }, { name: "Afrikaans HL", percentage: 91 }, { name: "Accounting", percentage: 89 }, { name: "Economics", percentage: 92 }], overall: 92 },
    { name: "Kwaku Asante", examNumber: "2022/005", school: "St. Albans College", province: "Gauteng", subjects: [{ name: "Mathematics", percentage: 91 }, { name: "Physical Sciences", percentage: 88 }, { name: "English HL", percentage: 90 }, { name: "Life Sciences", percentage: 86 }, { name: "Geography", percentage: 87 }], overall: 88 },
  ],
  2021: [
    { name: "Retha Smuts", examNumber: "2021/001", school: "St. Andrew's College", province: "Eastern Cape", subjects: [{ name: "Mathematics", percentage: 93 }, { name: "Physical Sciences", percentage: 90 }, { name: "English HL", percentage: 94 }, { name: "History", percentage: 88 }, { name: "Geography", percentage: 87 }], overall: 90 },
    { name: "Mandla Zulu", examNumber: "2021/002", school: "Inanda Seminary", province: "KwaZulu-Natal", subjects: [{ name: "Mathematics", percentage: 86 }, { name: "Life Sciences", percentage: 88 }, { name: "English HL", percentage: 89 }, { name: "Geography", percentage: 85 }, { name: "History", percentage: 82 }], overall: 86 },
    { name: "Pieter Smith", examNumber: "2021/003", school: "Paarl Boys High", province: "Western Cape", subjects: [{ name: "Mathematics", percentage: 90 }, { name: "Physical Sciences", percentage: 87 }, { name: "Afrikaans HL", percentage: 93 }, { name: "Accounting", percentage: 88 }, { name: "Business Studies", percentage: 86 }], overall: 89 },
    { name: "Ayanda Mkhize", examNumber: "2021/004", school: "osas", province: "KwaZulu-Natal", subjects: [{ name: "Mathematics", percentage: 88 }, { name: "Physical Sciences", percentage: 85 }, { name: "English HL", percentage: 90 }, { name: "Life Sciences", percentage: 87 }, { name: "Geography", percentage: 86 }], overall: 87 },
    { name: "Wilhelmina Basson", examNumber: "2021/005", school: "Hoërskool Jan van Riebeeck", province: "Western Cape", subjects: [{ name: "Mathematics", percentage: 97 }, { name: "Physical Sciences", percentage: 94 }, { name: "Afrikaans HL", percentage: 95 }, { name: "Life Sciences", percentage: 92 }, { name: "Geography", percentage: 91 }], overall: 94 },
  ],
};

const years = [2025, 2024, 2023, 2022, 2021];

export function ResultsSearch() {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    const yearResults = mockResults[selectedYear] || [];
    const query = searchQuery.toLowerCase();
    const filtered = yearResults.filter((r) =>
      r.name.toLowerCase().includes(query)
    );
    setResults(filtered);
    setTimeout(() => setIsSearching(false), 500);
  };

  const getGrade = (percentage: number): string => {
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    if (percentage >= 40) return "E";
    return "F";
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Year</label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => {
                  setSelectedYear(year);
                  setResults([]);
                  setSearchQuery("");
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors active:scale-[0.96] transition-transform duration-150",
                  selectedYear === year
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 rounded-xl"
            />
          </div>
          <Button onClick={handleSearch} className="rounded-xl active:scale-[0.96] transition-transform duration-150">Search</Button>
        </div>
      </div>

      {isSearching ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4 flex-1 overflow-y-auto">
          <p className="text-sm text-muted-foreground">{results.length} results found</p>
          {results.map((result, idx) => (
            <motion.div
              key={result.examNumber}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
                    <UserIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-wrap balance">{result.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {result.school}, {result.province}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      Exam No: {result.examNumber}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  {result.subjects.map((subj) => (
                    <div
                      key={subj.name}
                      className="flex justify-between text-sm p-2.5 rounded-lg bg-muted"
                    >
                      <span className="text-muted-foreground">{subj.name}</span>
                      <span className="font-medium tabular-nums">
                        {subj.percentage}% ({getGrade(subj.percentage)})
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Overall</span>
                  <span className="text-lg font-bold tabular-nums">{result.overall}%</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : searchQuery ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <SearchIcon className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
          <p className="text-sm text-muted-foreground mt-2">Try searching with a different name</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <SearchIcon className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Enter a name to search</p>
          <p className="text-sm text-muted-foreground mt-2">
            Search through {selectedYear} results
          </p>
        </div>
      )}
    </div>
  );
}