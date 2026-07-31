const mockSecureValues = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockSecureValues.get(key) ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureValues.set(key, value);
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    mockSecureValues.delete(key);
    return Promise.resolve();
  }),
}));

import { clearSession, readSession, writeSession } from "../session";
import type { AuthSession } from "../types";

describe("secure auth session", () => {
  beforeEach(() => mockSecureValues.clear());

  test("restores a live phone session", async () => {
    const session: AuthSession = {
      phone: "+996555123456",
      verificationToken: "b".repeat(64),
      expiresAt: Date.now() + 60_000,
    };
    await writeSession(session);
    await expect(readSession()).resolves.toEqual(session);
  });

  test("logout removes the secret session", async () => {
    await writeSession({
      phone: "+996555123456",
      verificationToken: "c".repeat(64),
      expiresAt: Date.now() + 60_000,
    });
    await clearSession();
    await expect(readSession()).resolves.toBeNull();
  });

  test("expired sessions are not restored", async () => {
    await writeSession({
      phone: "+996555123456",
      verificationToken: "d".repeat(64),
      expiresAt: Date.now() - 1,
    });
    await expect(readSession()).resolves.toBeNull();
  });
});
