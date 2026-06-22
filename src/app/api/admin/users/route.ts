import { Users } from "node-appwrite";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { serverClient } from "@/lib/appwrite.server";

export const GET = createRouteHandler({
  auth: "admin",
  errorLabel: "Users",
  execute: async () => {
    const users = new Users(serverClient);
    const response = await users.list();

    const userList = response.users.map((u) => ({
      $id: u.$id,
      email: u.email,
      name: u.name || "",
      status: u.status,
      registration: u.registration,
      accessedAt: u.accessedAt || null,
    }));

    return { users: userList };
  },
});

export const PATCH = createRouteHandler({
  auth: "admin",
  errorLabel: "Users",
  validate: (body) => {
    if (!body.userId || !body.action) return "userId and action are required";
    return null;
  },
  execute: async ({ body }) => {
    const { userId, action } = body as { userId: string; action: string };

    const users = new Users(serverClient);

    if (action === "suspend") {
      await users.updateStatus(userId, false);
    } else if (action === "activate") {
      await users.updateStatus(userId, true);
    } else {
      throw new HttpError(400, "action must be 'suspend' or 'activate'");
    }

    return { success: true };
  },
});
