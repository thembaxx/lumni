"use client";

import { PlusIcon, XIcon, Trash2Icon } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Exam {
  id: string;
  subject: string;
  date: Date;
  paper: string;
}

const subjectAbbrs: Record<string, string> = {
  "mathematics": "Math",
  "physical-sciences": "PhySci",
  "life-sciences": "LifeSci",
  "english-home-language": "EngHL",
  "afrikaans-home-language": "AfrHL",
  "geography": "Geo",
  "history": "Hist",
  "accounting": "Acc",
  "business-studies": "Bus",
  "economics": "Econ",
};

const subjectColors: Record<string, string> = {
  mathematics: "bg-blue-500",
  "physical-sciences": "bg-green-500",
  "life-sciences": "bg-purple-500",
  "english-home-language": "bg-orange-500",
  "afrikaans-home-language": "bg-red-500",
  geography: "bg-teal-500",
  history: "bg-yellow-500",
  accounting: "bg-amber-500",
  "business-studies": "bg-pink-500",
  economics: "bg-cyan-500",
};

const commonSubjects = [
  { id: "mathematics", name: "Mathematics" },
  { id: "physical-sciences", name: "Physical Sciences" },
  { id: "life-sciences", name: "Life Sciences" },
  { id: "english-home-language", name: "English Home Language" },
  { id: "afrikaans-home-language", name: "Afrikaans Home Language" },
  { id: "geography", name: "Geography" },
  { id: "history", name: "History" },
  { id: "accounting", name: "Accounting" },
  { id: "business-studies", name: "Business Studies" },
  { id: "economics", name: "Economics" },
];

const STORAGE_KEY = "lumni-exams";

export function ExamCalendar() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [newExam, setNewExam] = useState({ subject: "", paper: "Paper 1" });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setExams(parsed.map((e: Exam) => ({ ...e, date: new Date(e.date) })));
      } catch (e) {
        console.error("Failed to load exams:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
  }, [exams]);

  const addExam = () => {
    if (!selectedDate || !newExam.subject) return;

    const exam: Exam = {
      id: Date.now().toString(),
      subject: newExam.subject,
      date: selectedDate,
      paper: newExam.paper,
    };

    setExams([...exams, exam]);
    setIsAddingExam(false);
    setNewExam({ subject: "", paper: "Paper 1" });
  };

  const deleteExam = (id: string) => {
    setExams(exams.filter((e) => e.id !== id));
  };

  const examsOnDate = selectedDate
    ? exams.filter(
        (e) =>
          e.date.getDate() === selectedDate.getDate() &&
          e.date.getMonth() === selectedDate.getMonth() &&
          e.date.getFullYear() === selectedDate.getFullYear()
      )
    : [];

  const getSubjectColor = (subjectId: string) => {
    return subjectColors[subjectId] || "bg-gray-500";
  };

  const getSubjectAbbr = (subjectId: string) => {
    return subjectAbbrs[subjectId] || subjectId.slice(0, 4).toUpperCase();
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <Calendar
        markedDates={exams.map((e) => e.date)}
        markedDatesColor="bg-primary"
        onSelect={(date) => date && setSelectedDate(date)}
        selected={selectedDate}
      />

      <div className="mt-4 flex justify-between items-center">
        <h3 className="font-semibold">
          {selectedDate
            ? `Exams on ${selectedDate.toLocaleDateString()}`
            : "Select a date"}
        </h3>
        <Button size="sm" onClick={() => setIsAddingExam(true)}>
          <PlusIcon className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {examsOnDate.length > 0 ? (
        <div className="mt-3 space-y-2">
          {examsOnDate.map((exam) => (
            <Card key={exam.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "px-2 py-1 rounded text-xs text-white font-medium",
                      getSubjectColor(exam.subject)
                    )}
                  >
                    {getSubjectAbbr(exam.subject)}
                  </span>
                  <div>
                    <p className="font-medium text-sm">
                      {commonSubjects.find((s) => s.id === exam.subject)?.name || exam.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">{exam.paper}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteExam(exam.id)}
                >
                  <Trash2Icon className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : selectedDate ? (
        <p className="text-center text-muted-foreground mt-4">No exams on this date</p>
      ) : null}

      <div className="mt-4">
        <h4 className="font-medium text-sm mb-2">Upcoming Exams</h4>
        <div className="space-y-2">
          {exams
            .filter((e) => e.date >= new Date())
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 5)
            .map((exam) => (
              <div
                key={exam.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted"
              >
                <span
                  className={cn(
                    "px-2 py-1 rounded text-xs text-white font-medium",
                    getSubjectColor(exam.subject)
                  )}
                >
                  {getSubjectAbbr(exam.subject)}
                </span>
                <span className="text-sm">
                  {exam.date.toLocaleDateString("en-ZA", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-xs text-muted-foreground">{exam.paper}</span>
              </div>
            ))}
        </div>
      </div>

      <AnimatePresence>
        {isAddingExam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsAddingExam(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-background rounded-xl p-6 w-full max-w-sm"
            >
              <button
                onClick={() => setIsAddingExam(false)}
                className="absolute top-4 right-4 p-1"
              >
                <XIcon className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-semibold mb-4">Add Exam</h3>

              <div className="space-y-4">
                <div>
                  <Label>Subject</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {commonSubjects.map((subject) => (
                      <button
                        key={subject.id}
                        onClick={() => setNewExam({ ...newExam, subject: subject.id })}
                        className={cn(
                          "p-2 rounded-lg text-xs font-medium transition-colors",
                          newExam.subject === subject.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {subject.name.slice(0, 10)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Paper</Label>
                  <div className="flex gap-2 mt-2">
                    {["Paper 1", "Paper 2", "Paper 3"].map((paper) => (
                      <button
                        key={paper}
                        onClick={() => setNewExam({ ...newExam, paper })}
                        className={cn(
                          "flex-1 p-2 rounded-lg text-xs font-medium transition-colors",
                          newExam.paper === paper
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {paper}
                      </button>
                    ))}
                  </div>
                </div>

                <Button className="w-full" onClick={addExam} disabled={!newExam.subject}>
                  Add Exam
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}