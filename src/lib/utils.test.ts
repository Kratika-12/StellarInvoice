import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("utils", () => {
  describe("cn", () => {
    it("should merge classes correctly", () => {
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
      expect(cn("p-4", { "m-4": true, "m-2": false })).toBe("p-4 m-4");
      expect(cn(["flex", "items-center"], "justify-center")).toBe(
        "flex items-center justify-center",
      );
    });
  });
});
