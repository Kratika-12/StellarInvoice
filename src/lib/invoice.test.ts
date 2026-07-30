import { describe, expect, it } from "vitest";
import { classifyWalletError, validateAmount, xlmToStroops } from "./invoice";

describe("invoice helpers", () => {
  it("converts XLM amounts to stroops without floating-point rounding", () => {
    expect(xlmToStroops("12.3456789")).toBe(123_456_789n);
  });

  it("rejects zero, negative, and over-precision amounts", () => {
    expect(validateAmount("0")).toContain("greater than zero");
    expect(validateAmount("-1")).toContain("valid XLM amount");
    expect(validateAmount("1.12345678")).toContain("7 decimal");
  });

  it("classifies rejected wallet requests", () => {
    expect(classifyWalletError(new Error("User rejected request"))).toContain("rejected");
  });

  it("classifies insufficient balance errors", () => {
    expect(classifyWalletError(new Error("insufficient balance"))).toContain("enough XLM");
  });
});
