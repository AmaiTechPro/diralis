import { describe, it, expect } from "vitest";
import { profileDataset } from "../services/profiler/profileDataset";

const employeeDataset = [
  {
    name: "Brian",
    age: 22,
    department: "Engineering",
    salary: 70000,
    joined: "2025-01-10",
  },
  {
    name: "Alice",
    age: 25,
    department: "Finance",
    salary: 85000,
    joined: "2025-02-15",
  },
  {
    name: "David",
    age: null,
    department: "Engineering",
    salary: 90000,
    joined: "2025-03-20",
  },
  {
    name: "Brian",
    age: 22,
    department: "Engineering",
    salary: 70000,
    joined: "2025-01-10",
  },
];

describe("Data Profiler Suite", () => {
  it("should profile employee dataset accurately", () => {
    const result = profileDataset(employeeDataset);

    expect(result).toBeDefined();
    expect(result.totalRows).toBe(4);
    expect(result.columns).toBe(5);
    expect(result.numericColumns).toContain("age");
    expect(result.numericColumns).toContain("salary");
    expect(result.categoricalColumns).toContain("name");
    expect(result.categoricalColumns).toContain("department");
    expect(result.dateColumns).toContain("joined");
  });
});

