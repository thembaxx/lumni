import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDocs: Record<string, Record<string, unknown>[]> = {};

vi.mock("@/lib/db/client", () => ({
  COLLECTIONS: {
    STUDY_GROUPS: "study_groups",
    GROUP_MEMBERS: "group_members",
    GROUP_POSTS: "group_posts",
    GROUP_COMMENTS: "group_comments",
    GROUP_REACTIONS: "group_reactions",
    GROUP_INVITES: "group_invites",
  },
  createDocument: vi.fn(async (collection: string, data: Record<string, unknown>) => {
    const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    if (!mockDocs[collection]) mockDocs[collection] = [];
    mockDocs[collection].push({ $id: id, ...data });
    return id;
  }),
  getDocument: vi.fn(async (collection: string, id: string) => {
    const docs = mockDocs[collection] ?? [];
    const doc = docs.find((d) => d.$id === id);
    return doc ? { ...doc } : null;
  }),
  listDocuments: vi.fn(async (collection: string, filters?: string[]) => {
    const docs = mockDocs[collection] ?? [];
    const filtered = (!filters || filters.length === 0)
      ? docs
      : docs.filter((doc) =>
          filters.every((f) => {
            const [key, val] = f.split("=");
            if (key === "orderDesc" || key === "orderAsc") return true;
            return String(doc[key]) === val;
          }),
        );
    return filtered.map((d) => ({ ...d }));
  }),
  updateDocument: vi.fn(async (collection: string, id: string, data: Record<string, unknown>) => {
    const docs = mockDocs[collection] ?? [];
    const idx = docs.findIndex((d) => d.$id === id);
    if (idx >= 0) Object.assign(docs[idx], data);
  }),
  deleteDocument: vi.fn(async (collection: string, id: string) => {
    const docs = mockDocs[collection] ?? [];
    const idx = docs.findIndex((d) => d.$id === id);
    if (idx >= 0) docs.splice(idx, 1);
  }),
}));

vi.mock("@/lib/shared/logger", () => ({
  logError: vi.fn(),
}));

import {
  createComment,
  createGroup,
  createPost,
  deleteGroup,
  deletePost,
  getGroupById,
  getGroupMembers,
  getGroupPosts,
  getGroupsForUser,
  joinGroup,
  leaveGroup,
  removeMember,
  togglePostReaction,
} from "../service";

beforeEach(() => {
  for (const key of Object.keys(mockDocs)) {
    delete mockDocs[key];
  }
  vi.clearAllMocks();
});

describe("createGroup", () => {
  it("creates a group and adds creator as admin", async () => {
    const result = await createGroup("user1", { name: "Math Group" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Math Group");
      expect(result.data.createdBy).toBe("user1");
      expect(result.data.memberCount).toBe(1);
      expect(result.data.inviteCode).toHaveLength(8);
    }
  });

  it("returns failure on error", async () => {
    const { createDocument } = await import("@/lib/db/client");
    vi.mocked(createDocument).mockRejectedValueOnce(new Error("DB error"));
    const result = await createGroup("user1", { name: "Test" });
    expect(result.success).toBe(false);
  });
});

describe("getGroupsForUser", () => {
  it("returns empty array when user has no memberships", async () => {
    const result = await getGroupsForUser("user_no_groups");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual([]);
  });

  it("returns groups the user belongs to", async () => {
    await createGroup("user1", { name: "Group A" });
    const result = await getGroupsForUser("user1");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.length).toBe(1);
  });
});

describe("getGroupById", () => {
  it("returns group when found", async () => {
    const createResult = await createGroup("user1", { name: "Test Group" });
    expect(createResult.success).toBe(true);
    if (createResult.success) {
      const result = await getGroupById(createResult.data.$id);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.name).toBe("Test Group");
    }
  });

  it("returns failure when not found", async () => {
    const result = await getGroupById("nonexistent");
    expect(result.success).toBe(false);
  });
});

describe("getGroupMembers", () => {
  it("returns members of a group", async () => {
    const createResult = await createGroup("user1", { name: "Test" });
    expect(createResult.success).toBe(true);
    if (createResult.success) {
      const result = await getGroupMembers(createResult.data.$id);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.length).toBe(1);
    }
  });
});

describe("joinGroup", () => {
  it("joins a group with valid invite code", async () => {
    const createResult = await createGroup("user1", { name: "Joinable" });
    expect(createResult.success).toBe(true);
    if (createResult.success) {
      const code = createResult.data.inviteCode;
      const joinResult = await joinGroup("user2", code);
      expect(joinResult.success).toBe(true);
      if (joinResult.success) expect(joinResult.data.memberCount).toBe(2);
    }
  });

  it("fails with invalid invite code", async () => {
    const result = await joinGroup("user2", "INVALID");
    expect(result.success).toBe(false);
  });

  it("fails when already a member", async () => {
    const createResult = await createGroup("user1", { name: "Test" });
    expect(createResult.success).toBe(true);
    if (createResult.success) {
      const first = await joinGroup("user2", createResult.data.inviteCode);
      expect(first.success).toBe(true);
      const second = await joinGroup("user2", createResult.data.inviteCode);
      expect(second.success).toBe(false);
    }
  });
});

describe("leaveGroup", () => {
  it("removes member from group", async () => {
    const createResult = await createGroup("user1", { name: "Leave Test" });
    expect(createResult.success).toBe(true);
    if (createResult.success) {
      await joinGroup("user2", createResult.data.inviteCode);
      const leaveResult = await leaveGroup("user2", createResult.data.$id);
      expect(leaveResult.success).toBe(true);
    }
  });

  it("fails when not a member", async () => {
    const createResult = await createGroup("user1", { name: "Test" });
    expect(createResult.success).toBe(true);
    if (createResult.success) {
      const result = await leaveGroup("user_nonmember", createResult.data.$id);
      expect(result.success).toBe(false);
    }
  });
});

describe("createPost", () => {
  it("creates a post in a group", async () => {
    const createResult = await createGroup("user1", { name: "Post Group" });
    expect(createResult.success).toBe(true);
    if (createResult.success) {
      const postResult = await createPost("user1", "Alice", {
        groupId: createResult.data.$id,
        content: "Hello everyone!",
      });
      expect(postResult.success).toBe(true);
      if (postResult.success) {
        expect(postResult.data.content).toBe("Hello everyone!");
        expect(postResult.data.userName).toBe("Alice");
      }
    }
  });
});

describe("getGroupPosts", () => {
  it("returns posts for a group", async () => {
    const createResult = await createGroup("user1", { name: "Post Group" });
    expect(createResult.success).toBe(true);
    if (createResult.success) {
      await createPost("user1", "Alice", {
        groupId: createResult.data.$id,
        content: "Post 1",
      });
      const result = await getGroupPosts(createResult.data.$id);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.length).toBe(1);
    }
  });
});

describe("deletePost", () => {
  it("deletes own post", async () => {
    const groupResult = await createGroup("user1", { name: "Del Group" });
    expect(groupResult.success).toBe(true);
    if (groupResult.success) {
      const postResult = await createPost("user1", "Alice", {
        groupId: groupResult.data.$id,
        content: "Delete me",
      });
      expect(postResult.success).toBe(true);
      if (postResult.success) {
        const delResult = await deletePost("user1", postResult.data.$id);
        expect(delResult.success).toBe(true);
      }
    }
  });

  it("fails when not author", async () => {
    const groupResult = await createGroup("user1", { name: "Del Group" });
    expect(groupResult.success).toBe(true);
    if (groupResult.success) {
      const postResult = await createPost("user1", "Alice", {
        groupId: groupResult.data.$id,
        content: "Not yours",
      });
      expect(postResult.success).toBe(true);
      if (postResult.success) {
        const delResult = await deletePost("user2", postResult.data.$id);
        expect(delResult.success).toBe(false);
      }
    }
  });
});

describe("createComment", () => {
  it("creates a comment on a post", async () => {
    const groupResult = await createGroup("user1", { name: "Comment Group" });
    expect(groupResult.success).toBe(true);
    if (groupResult.success) {
      const postResult = await createPost("user1", "Alice", {
        groupId: groupResult.data.$id,
        content: "A post",
      });
      expect(postResult.success).toBe(true);
      if (postResult.success) {
        const commentResult = await createComment("user2", "Bob", postResult.data.$id, "Nice!");
        expect(commentResult.success).toBe(true);
        if (commentResult.success) expect(commentResult.data.content).toBe("Nice!");
      }
    }
  });
});

describe("togglePostReaction", () => {
  it("adds a reaction then removes it on second call", async () => {
    const groupResult = await createGroup("user1", { name: "React Group" });
    expect(groupResult.success).toBe(true);
    if (groupResult.success) {
      const postResult = await createPost("user1", "Alice", {
        groupId: groupResult.data.$id,
        content: "React to this",
      });
      expect(postResult.success).toBe(true);
      if (postResult.success) {
        const addResult = await togglePostReaction("user2", postResult.data.$id, "👍");
        expect(addResult.success).toBe(true);
        if (addResult.success) expect(addResult.data).not.toBeNull();

        const removeResult = await togglePostReaction("user2", postResult.data.$id, "👍");
        expect(removeResult.success).toBe(true);
        if (removeResult.success) expect(removeResult.data).toBeNull();
      }
    }
  });
});

describe("removeMember", () => {
  it("allows admin to remove a member", async () => {
    const createResult = await createGroup("user1", { name: "Remove Group" });
    expect(createResult.success).toBe(true);
    if (createResult.success) {
      await joinGroup("user2", createResult.data.inviteCode);
      const members = await getGroupMembers(createResult.data.$id);
      expect(members.success).toBe(true);
      if (members.success) {
        const user2Member = members.data.find((m) => m.userId === "user2");
        expect(user2Member).toBeDefined();
        if (user2Member) {
          const removeResult = await removeMember("user1", createResult.data.$id, user2Member.$id);
          expect(removeResult.success).toBe(true);
        }
      }
    }
  });

  it("fails when non-admin tries to remove", async () => {
    const createResult = await createGroup("user1", { name: "Remove Group" });
    expect(createResult.success).toBe(true);
    if (createResult.success) {
      const members = await getGroupMembers(createResult.data.$id);
      expect(members.success).toBe(true);
      if (members.success) {
        const user1Member = members.data.find((m) => m.userId === "user1");
        expect(user1Member).toBeDefined();
        if (user1Member) {
          const removeResult = await removeMember("user2", createResult.data.$id, user1Member.$id);
          expect(removeResult.success).toBe(false);
        }
      }
    }
  });
});

describe("deleteGroup", () => {
  it("allows creator to delete group", async () => {
    const createResult = await createGroup("user1", { name: "Delete Group" });
    expect(createResult.success).toBe(true);
    if (createResult.success) {
      const delResult = await deleteGroup("user1", createResult.data.$id);
      expect(delResult.success).toBe(true);
      const getResult = await getGroupById(createResult.data.$id);
      expect(getResult.success).toBe(false);
    }
  });

  it("fails when non-creator tries to delete", async () => {
    const createResult = await createGroup("user1", { name: "Delete Group" });
    expect(createResult.success).toBe(true);
    if (createResult.success) {
      const delResult = await deleteGroup("user2", createResult.data.$id);
      expect(delResult.success).toBe(false);
    }
  });
});
