import { getStore } from "./portal/store";
import { hashPassword, verifyPassword } from "./portal/password";

export { hashPassword, verifyPassword };

export async function getUserByOpenId(openId: string) {
  return getStore().getUserByOpenId(openId);
}

export async function getUserByEmail(email: string) {
  return getStore().getUserByEmail(email);
}

export async function getUserById(id: number) {
  return getStore().getUserById(id);
}

export async function upsertUser(user: {
  openId: string;
  name?: string | null;
  email?: string | null;
  passwordHash?: string | null;
  loginMethod?: string | null;
  role?: "user" | "admin" | "staff";
  lastSignedIn?: Date;
}) {
  if (!user.openId) throw new Error("User openId is required");
  await getStore().upsertUser(user);
}
