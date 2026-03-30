import { beforeEach, describe, expect, it, vi } from "vitest";

import { copyText, copyTextWithPromptFallback } from "./clipboard";

describe("clipboard helpers", () => {
  beforeEach(() => {
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    vi.spyOn(window, "prompt").mockImplementation(() => "");
  });

  it("copies text through the browser clipboard API", async () => {
    await expect(copyText("https://example.com/share/demo")).resolves.toBe(
      "https://example.com/share/demo",
    );

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://example.com/share/demo",
    );
  });

  it("falls back to prompt when clipboard writes fail", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error("denied"));

    await expect(
      copyTextWithPromptFallback("https://example.com/share/demo"),
    ).resolves.toBe(false);

    expect(window.prompt).toHaveBeenCalledWith(
      "Copy this link:",
      "https://example.com/share/demo",
    );
  });
});
