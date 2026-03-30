import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";

const { copyTextMock, exportComparisonPDFMock } = vi.hoisted(() => ({
  copyTextMock: vi.fn(async () => undefined),
  exportComparisonPDFMock: vi.fn(),
}));

vi.mock("../features/term-sheet-tarot/services/clipboard", () => ({
  copyText: copyTextMock,
}));

vi.mock("../features/term-sheet-tarot/services/pdf-comparison-export", () => ({
  exportComparisonPDF: exportComparisonPDFMock,
}));

import ComparePage from "./Compare";

describe("ComparePage", () => {
  beforeEach(() => {
    copyTextMock.mockReset().mockResolvedValue(undefined);
    exportComparisonPDFMock.mockClear();
  });

  it("hydrates from URL params and supports share/export actions", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ComparePage />, {
      route: "/compare?a=nova-series-a&ac=double-dip&ae=35000000&b=pulse-series-b&be=150000000",
    });

    expect(await screen.findByRole("heading", { name: "Compare Scenarios" })).toBeInTheDocument();
    expect(screen.getByLabelText("Deal A scenario")).toHaveValue("nova-series-a");
    expect(screen.getByLabelText("Deal B scenario")).toHaveValue("pulse-series-b");

    fireEvent.change(screen.getByLabelText("Deal A exit value"), {
      target: { value: "45000000" },
    });
    expect(screen.getAllByText("$45M").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /Share Link/i }));

    await waitFor(() => {
      expect(copyTextMock).toHaveBeenCalledWith(
        expect.stringContaining("ae=45000000"),
      );
    });
    expect(screen.getByText("Copied!")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Export PDF/i }));
    expect(exportComparisonPDFMock).toHaveBeenCalled();
  });
});
