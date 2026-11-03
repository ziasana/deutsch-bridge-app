import { describe, expect, it } from "vitest";
import { signupSchema } from "./signupSchema";

const valid = { displayName: "Ali Jan", email: "ali@example.com", password: "secret1", password_confirmation: "secret1" };

describe("signupSchema", () => {
    it("accepts a signup without a username - the email address identifies the account", () => {
        expect(signupSchema.safeParse(valid).success).toBe(true);
    });

    it("does not pass a username on to the request", () => {
        const parsed = signupSchema.parse({ ...valid, username: "ali" });
        expect("username" in parsed).toBe(false);
    });

    it("still checks name, email and password", () => {
        expect(signupSchema.safeParse({ ...valid, displayName: "Al" }).success).toBe(false);
        expect(signupSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
        expect(signupSchema.safeParse({ ...valid, password: "123", password_confirmation: "123" }).success).toBe(false);
        expect(signupSchema.safeParse({ ...valid, password_confirmation: "other" }).success).toBe(false);
    });
});
