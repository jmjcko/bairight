import { describe, it, expect } from "vitest";
import { isUserAdmin, DEFAULT_ADMIN_EMAILS } from "../admin-check";

describe("isUserAdmin Whitelist Suite", () => {
  it("allows default authorized admin emails", () => {
    expect(isUserAdmin("jmjcko@gmail.com")).toBe(true);
    expect(isUserAdmin("JMJCKO@GMAIL.COM")).toBe(true); // case-insensitive
    expect(isUserAdmin("jan.mynar@gmail.com")).toBe(true);
  });

  it("rejects unauthorized emails", () => {
    expect(isUserAdmin("random.user@gmail.com")).toBe(false);
    expect(isUserAdmin("hacker@attacker.com")).toBe(false);
    expect(isUserAdmin(null)).toBe(false);
    expect(isUserAdmin(undefined)).toBe(false);
    expect(isUserAdmin("")).toBe(false);
  });
});
