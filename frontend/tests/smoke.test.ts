import { getApiBase } from "@/lib/api";

describe("frontend smoke", () => {
  it("getApiBase uses default when env unset", () => {
    expect(getApiBase()).toBe("http://localhost:4000");
  });
});
