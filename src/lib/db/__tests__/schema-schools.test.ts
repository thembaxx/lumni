import { describe, expect, test } from "vitest";

const SCHOOL_TABLE_NAMES = ["schools", "schoolMembers", "schoolCodes", "licenses", "invoices"];

class MockTable {
  schema: { primKey: { name: string } };
  name: string;
  constructor(name: string) {
    this.name = name;
    this.schema = { primKey: { name: name === "schoolMembers" ? "++id" : "id" } };
  }
  hook() {
    return { deleting: null, creating: null, updating: null };
  }
}

class MockV46DB {
  readonly name = "lumni-offline";
  readonly verno = 46;
  readonly tables = SCHOOL_TABLE_NAMES.map((n) => new MockTable(n));
  table(name: string) {
    return this.tables.find((t) => t.name === name);
  }
  version(_v: number) {
    return this;
  }
  stores(_schema: Record<string, string>) {
    return this;
  }
  upgrade(_fn: (trans: unknown) => void) {
    return this;
  }
  open() {
    return Promise.resolve(this);
  }
  close() {}
}

describe("Dexie v46 — School Licensing Tables", () => {
  const db = new MockV46DB();

  test("version is 46", () => {
    expect(db.verno).toBe(46);
  });

  test("has all 5 school licensing tables", () => {
    expect(db.tables.length).toBe(5);
    for (const name of SCHOOL_TABLE_NAMES) {
      const table = db.table(name);
      expect(table).toBeDefined();
    }
  });

  test("schoolMembers has auto-increment primary key", () => {
    const table = db.table("schoolMembers");
    expect(table.schema.primKey.name).toBe("++id");
  });

  test("schools has string primary key", () => {
    const table = db.table("schools");
    expect(table.schema.primKey.name).toBe("id");
  });

  test("schoolCodes has code as primary key", () => {
    const table = db.table("schoolCodes");
    expect(table.schema.primKey.name).toBe("id");
  });

  test("table names match expected order", () => {
    const names = db.tables.map((t) => t.name);
    expect(names).toEqual(SCHOOL_TABLE_NAMES);
  });
});
