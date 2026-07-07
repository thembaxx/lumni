import { beforeEach, describe, expect, test } from "vitest";
import { InMemoryTable, InMemoryDataAccess } from "../in-memory-data-access";

interface TestItem {
  id: number;
  name: string;
  score: number;
  active: boolean;
}

interface StringIdItem {
  id: string;
  label: string;
}

describe("InMemoryTable", () => {
  let table: InMemoryTable<TestItem>;

  beforeEach(() => {
    table = new InMemoryTable<TestItem>();
  });

  describe("get", () => {
    test("returns undefined for non-existing id", async () => {
      await expect(table.get(99)).resolves.toBeUndefined();
    });

    test("returns item by id after add", async () => {
      const id = await table.add({ name: "a", score: 10, active: true });
      const item = await table.get(id);
      expect(item).toBeDefined();
      expect(item!.name).toBe("a");
    });
  });

  describe("add", () => {
    test("auto-increments id", async () => {
      const id1 = await table.add({ name: "a", score: 1, active: true });
      const id2 = await table.add({ name: "b", score: 2, active: false });
      expect(id2).toBe(id1 + 1);
    });

    test("stores item with assigned id", async () => {
      const id = await table.add({ name: "x", score: 5, active: true });
      const item = await table.get(id);
      expect(item!.id).toBe(id);
      expect(item!.name).toBe("x");
    });
  });

  describe("put", () => {
    test("inserts item without id", async () => {
      const id = await table.put({
        id: undefined as unknown as number,
        name: "a",
        score: 1,
        active: true,
      });
      expect(id).toBe(1);
    });

    test("upserts item with existing id", async () => {
      await table.add({ name: "a", score: 1, active: true });
      await table.put({ id: 1, name: "b", score: 2, active: false });
      const item = await table.get(1);
      expect(item!.name).toBe("b");
      expect(item!.score).toBe(2);
    });
  });

  describe("update", () => {
    test("partial update on existing item", async () => {
      const id = await table.add({ name: "a", score: 10, active: true });
      await table.update(id, { score: 20 });
      const item = await table.get(id);
      expect(item!.score).toBe(20);
      expect(item!.name).toBe("a");
    });

    test("update on non-existing id does not throw", async () => {
      await expect(table.update(999, { score: 99 })).resolves.toBe(999);
    });
  });

  describe("delete", () => {
    test("removes item", async () => {
      const id = await table.add({ name: "a", score: 1, active: true });
      await table.delete(id);
      await expect(table.get(id)).resolves.toBeUndefined();
    });

    test("no-op on non-existing id", async () => {
      await expect(table.delete(999)).resolves.toBeUndefined();
    });
  });

  describe("bulk operations", () => {
    test("bulkAdd returns all ids", async () => {
      const ids = await table.bulkAdd([
        { name: "a", score: 1, active: true },
        { name: "b", score: 2, active: false },
      ]);
      expect(ids).toHaveLength(2);
      expect(ids[1]).toBe(ids[0] + 1);
    });

    test("bulkPut upserts", async () => {
      await table.put({ id: 10, name: "a", score: 1, active: true });
      await table.bulkPut([
        { id: 10, name: "a-u", score: 10, active: true },
        { id: undefined as unknown as number, name: "b", score: 2, active: false },
      ]);
      const all = await table.toArray();
      expect(all).toHaveLength(2);
      expect(all.find((i) => i.id === 10)!.score).toBe(10);
    });

    test("bulkDelete removes multiple", async () => {
      const id1 = await table.add({ name: "a", score: 1, active: true });
      const id2 = await table.add({ name: "b", score: 2, active: false });
      await table.bulkDelete([id1, id2]);
      await expect(table.count()).resolves.toBe(0);
    });
  });

  describe("toArray / count / clear", () => {
    test("toArray returns empty initially", async () => {
      await expect(table.toArray()).resolves.toHaveLength(0);
    });

    test("toArray returns all items", async () => {
      await table.add({ name: "a", score: 1, active: true });
      await table.add({ name: "b", score: 2, active: false });
      const all = await table.toArray();
      expect(all).toHaveLength(2);
    });

    test("count returns number of items", async () => {
      await table.add({ name: "a", score: 1, active: true });
      await expect(table.count()).resolves.toBe(1);
    });

    test("clear empties table", async () => {
      await table.add({ name: "a", score: 1, active: true });
      await table.clear();
      await expect(table.count()).resolves.toBe(0);
    });
  });

  describe("seed", () => {
    test("seeds with explicit ids", () => {
      table.seed([
        { id: 10, name: "x", score: 100, active: true },
        { id: 20, name: "y", score: 200, active: false },
      ]);
      expect(table["items"].size).toBe(2);
    });

    test("seeds auto-assigns ids when missing", () => {
      table.seed([
        { id: undefined as unknown as number, name: "a", score: 1, active: true },
        { name: "b", score: 2, active: false },
      ] as TestItem[]);
      expect(table["items"].size).toBe(2);
    });
  });

  describe("limit", () => {
    test("returns limited collection", async () => {
      await table.add({ name: "a", score: 1, active: true });
      await table.add({ name: "b", score: 2, active: false });
      const result = await table.limit(1).toArray();
      expect(result).toHaveLength(1);
    });
  });

  describe("where", () => {
    test("equals filters correctly", async () => {
      const id = await table.add({ name: "a", score: 10, active: true });
      await table.add({ name: "b", score: 20, active: false });
      const result = await table.where("name").equals("a").toArray();
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(id);
    });

    test("above filters numbers", async () => {
      await table.add({ name: "a", score: 10, active: true });
      await table.add({ name: "b", score: 20, active: false });
      await table.add({ name: "c", score: 30, active: true });
      const result = await table.where("score").above(15).toArray();
      expect(result).toHaveLength(2);
    });

    test("aboveOrEqual filters numbers", async () => {
      await table.add({ name: "a", score: 10, active: true });
      await table.add({ name: "b", score: 20, active: false });
      const result = await table.where("score").aboveOrEqual(20).toArray();
      expect(result).toHaveLength(1);
    });

    test("belowOrEqual filters numbers", async () => {
      await table.add({ name: "a", score: 10, active: true });
      await table.add({ name: "b", score: 20, active: false });
      const result = await table.where("score").belowOrEqual(10).toArray();
      expect(result).toHaveLength(1);
    });

    test("below filters numbers", async () => {
      await table.add({ name: "a", score: 10, active: true });
      await table.add({ name: "b", score: 20, active: false });
      const result = await table.where("score").below(20).toArray();
      expect(result).toHaveLength(1);
    });

    test("startsWith filters strings", async () => {
      await table.add({ name: "apple", score: 1, active: true });
      await table.add({ name: "apricot", score: 2, active: false });
      await table.add({ name: "banana", score: 3, active: true });
      const result = await table.where("name").startsWith("ap").toArray();
      expect(result).toHaveLength(2);
    });

    test("anyOf filters by set membership", async () => {
      await table.add({ name: "a", score: 10, active: true });
      await table.add({ name: "b", score: 20, active: false });
      await table.add({ name: "c", score: 30, active: true });
      const result = await table.where("score").anyOf([10, 30]).toArray();
      expect(result).toHaveLength(2);
    });

    test("chained filter after where", async () => {
      await table.add({ name: "a", score: 10, active: true });
      await table.add({ name: "b", score: 20, active: false });
      await table.add({ name: "c", score: 30, active: true });
      const result = await table
        .where("active")
        .equals(true)
        .filter((i) => i.score > 10)
        .toArray();
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("c");
    });
  });

  describe("orderBy", () => {
    test("returns items sorted ascending", async () => {
      await table.add({ name: "c", score: 30, active: true });
      await table.add({ name: "a", score: 10, active: false });
      await table.add({ name: "b", score: 20, active: true });
      const result = await table.orderBy("name").toArray();
      expect(result[0]!.name).toBe("a");
      expect(result[2]!.name).toBe("c");
    });
  });

  describe("reverse / toReversed", () => {
    test("reverse inverts order", async () => {
      await table.add({ name: "a", score: 1, active: true });
      await table.add({ name: "b", score: 2, active: false });
      const result = await table.orderBy("name").reverse().toArray();
      expect(result[0]!.name).toBe("b");
    });

    test("toReversed is alias for reverse", () => {
      expect(InMemoryTable.prototype.toReversed).toBe(InMemoryTable.prototype.reverse);
    });
  });

  describe("offset", () => {
    test("skips items", async () => {
      await table.add({ name: "a", score: 1, active: true });
      await table.add({ name: "b", score: 2, active: false });
      await table.add({ name: "c", score: 3, active: true });
      const result = await table.orderBy("name").offset(1).toArray();
      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe("b");
    });
  });

  describe("sortBy", () => {
    test("sorts by given index", async () => {
      await table.add({ name: "c", score: 30, active: true });
      await table.add({ name: "a", score: 10, active: false });
      const result = await table.orderBy("name").sortBy("score");
      expect(result).toHaveLength(2);
    });
  });
});

describe("InMemoryTable with string id", () => {
  let table: InMemoryTable<StringIdItem, string>;

  beforeEach(() => {
    table = new InMemoryTable<StringIdItem, string>();
  });

  test("put and get with string key", async () => {
    await table.put({ id: "key-a", label: "Label A" });
    const item = await table.get("key-a");
    expect(item).toBeDefined();
    expect(item!.label).toBe("Label A");
  });

  test("put upserts string-keyed items", async () => {
    await table.put({ id: "k1", label: "one" });
    await table.put({ id: "k1", label: "one-updated" });
    const item = await table.get("k1");
    expect(item!.label).toBe("one-updated");
  });
});

describe("InMemoryCollection", () => {
  let table: InMemoryTable<TestItem>;

  beforeEach(async () => {
    table = new InMemoryTable<TestItem>();
    await table.add({ name: "a", score: 10, active: true });
    await table.add({ name: "b", score: 20, active: false });
    await table.add({ name: "c", score: 30, active: true });
  });

  test("first returns first item", async () => {
    const item = await table.orderBy("name").first();
    expect(item).toBeDefined();
    expect(item!.name).toBe("a");
  });

  test("count returns correct number", async () => {
    const c = await table.where("active").equals(true).count();
    expect(c).toBe(2);
  });

  test("delete throws", async () => {
    await expect(table.orderBy("name").delete()).rejects.toThrow("not implemented");
  });

  test("modify throws", async () => {
    await expect(table.orderBy("name").modify({})).rejects.toThrow("not implemented");
  });
});

describe("InMemoryDataAccess", () => {
  test("implements all required tables", () => {
    const da = new InMemoryDataAccess();
    expect(da.flashcards).toBeInstanceOf(InMemoryTable);
    expect(da.competencies).toBeInstanceOf(InMemoryTable);
    expect(da.questions).toBeInstanceOf(InMemoryTable);
    expect(da.gamification).toBeInstanceOf(InMemoryTable);
    expect(da.tinyfishCache).toBeInstanceOf(InMemoryTable);
    expect(da.syncOutbox).toBeInstanceOf(InMemoryTable);
  });

  test("tables are independent", async () => {
    const da = new InMemoryDataAccess();
    await da.flashcards.add({
      id: "fc-1",
      dueDate: Date.now(),
      ease: 2.5,
      interval: 1,
      repetitions: 0,
      reviewCount: 0,
    } as never);
    await da.competencies.add({
      topicId: "math-1",
      odSubjectId: "math",
      score: 80,
      proficiency: "proficient",
      lastUpdated: Date.now(),
    } as never);
    expect((await da.flashcards.toArray()).length).toBe(1);
    expect((await da.competencies.toArray()).length).toBe(1);
  });
});
