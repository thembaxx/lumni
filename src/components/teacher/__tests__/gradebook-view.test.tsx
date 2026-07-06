import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseQuery = vi.fn();
vi.mock("@tanstack/react-query", () => ({
  useQuery: mockUseQuery,
}));

const { GradebookView } = await import("@/components/teacher/gradebook-view");

const baseAssignment = {
  id: "a1",
  topicIds: '["Algebra"]',
  status: "active",
  createdAt: "2026-01-01",
};

const baseGradesResponse = {
  assignment: { id: "a1", topicIds: '["Algebra"]', status: "active" },
  grades: [
    {
      studentId: "s1",
      studentName: "Alice",
      score: 9,
      maxScore: 10,
      percentage: 90,
      completedAt: "2026-01-01",
    },
  ],
  stats: {
    averagePercentage: 90,
    highestPercentage: 90,
    lowestPercentage: 90,
    submissionCount: 1,
    totalStudents: 1,
  },
};

describe("GradebookView", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty state when no assignments", () => {
    mockUseQuery
      .mockReturnValueOnce({ data: { assignments: [] } })
      .mockReturnValueOnce({ data: undefined, isLoading: false });

    const { container } = render(<GradebookView />);
    const text = container.textContent ?? "";
    expect(text).toMatch(/No assignments yet/);
    expect(text).not.toMatch(/Select an assignment/);
  });

  it("renders assignment selector buttons", () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: {
          assignments: [
            baseAssignment,
            { ...baseAssignment, id: "a2", topicIds: '["Algebra","Calculus"]' },
          ],
        },
      })
      .mockReturnValueOnce({ data: undefined, isLoading: false });

    const { container } = render(<GradebookView />);
    const text = container.textContent ?? "";
    expect(text).toMatch(/Algebra/);
    expect(text).toMatch(/\+1/);
    expect(text).toMatch(/Select an assignment above/);
  });

  it("shows stat cards when grades loaded", () => {
    mockUseQuery
      .mockReturnValueOnce({ data: { assignments: [baseAssignment] } })
      .mockReturnValueOnce({ data: baseGradesResponse, isLoading: false });

    const { container } = render(<GradebookView />);
    const text = container.textContent ?? "";
    expect(text).toMatch(/Average/);
    expect(text).toMatch(/Highest/);
    expect(text).toMatch(/Lowest/);
    expect(text).toMatch(/Submissions/);
    expect(text).toMatch(/90%/);
    expect(text).toMatch(/1/);
  });

  it("shows student rows in table", () => {
    const multiGrades = {
      ...baseGradesResponse,
      grades: [
        ...baseGradesResponse.grades,
        {
          studentId: "s2",
          studentName: "Bob",
          score: 5,
          maxScore: 10,
          percentage: 50,
          completedAt: "2026-01-02",
        },
      ],
      stats: {
        averagePercentage: 70,
        highestPercentage: 90,
        lowestPercentage: 50,
        submissionCount: 2,
        totalStudents: 2,
      },
    };

    mockUseQuery
      .mockReturnValueOnce({ data: { assignments: [baseAssignment] } })
      .mockReturnValueOnce({ data: multiGrades, isLoading: false });

    const { container } = render(<GradebookView />);
    const text = container.textContent ?? "";
    expect(text).toMatch(/Alice/);
    expect(text).toMatch(/Bob/);
    expect(text).toMatch(/9 \/ 10/);
    expect(text).toMatch(/5 \/ 10/);
    expect(text).toMatch(/50%/);
    expect(text).toMatch(/70%/);
  });
});
