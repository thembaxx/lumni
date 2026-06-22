declare module "@/data/exams/index.json" {
  const value: {
    exams: import("@/types/exam").PaperListing[];
  };
  export default value;
}
