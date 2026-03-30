import { beforeEach, describe, expect, it, vi } from "vitest";

import { CLAUSE_CATALOG, PRESET_SCENARIOS, getCanonicalScenario } from "../data/scenarios";
import { buildSnapshot } from "../domain/snapshot-builder";

function createDocMock() {
  return {
    addPage: vi.fn(),
    getNumberOfPages: vi.fn(() => 1),
    internal: {
      pageSize: {
        getHeight: vi.fn(() => 297),
        getWidth: vi.fn(() => 210),
      },
    },
    lastAutoTable: { finalY: 60 },
    rect: vi.fn(),
    roundRect: vi.fn(),
    roundedRect: vi.fn(),
    save: vi.fn(),
    setFillColor: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setPage: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
  };
}

const { autoTableMock, jsPDFMock } = vi.hoisted(() => ({
  autoTableMock: vi.fn((doc: { lastAutoTable?: { finalY: number } }) => {
    doc.lastAutoTable = { finalY: 60 };
  }),
  jsPDFMock: vi.fn(),
}));

let docMock = createDocMock();
jsPDFMock.mockImplementation(() => docMock);

vi.mock("jspdf", () => ({
  default: jsPDFMock,
}));

vi.mock("jspdf-autotable", () => ({
  default: autoTableMock,
}));

import { exportComparisonPDF } from "./pdf-comparison-export";
import { exportTermSheetPDF } from "./pdf-export";

describe("pdf export services", () => {
  const scenario = getCanonicalScenario();
  const cleanSnapshot = buildSnapshot(scenario, [], CLAUSE_CATALOG, 30_000_000);
  const dirtySnapshot = buildSnapshot(scenario, ["double-dip"], CLAUSE_CATALOG, 30_000_000);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-30T12:00:00Z"));
    docMock = createDocMock();
    jsPDFMock.mockClear();
    autoTableMock.mockClear();
  });

  it("exports the simulator PDF with a deterministic filename", () => {
    exportTermSheetPDF(
      scenario,
      cleanSnapshot,
      dirtySnapshot,
      dirtySnapshot.activeClauseIds,
      dirtySnapshot.waterfall.exitValue,
    );

    expect(jsPDFMock).toHaveBeenCalledWith({ format: "a4", orientation: "portrait", unit: "mm" });
    expect(autoTableMock).toHaveBeenCalled();
    expect(docMock.save).toHaveBeenCalledWith("term-sheet-nova-2026-03-30.pdf");
  });

  it("exports the comparison PDF with both scenario names in the filename", () => {
    const dealBScenario = PRESET_SCENARIOS[3];
    const dealBSnapshot = buildSnapshot(dealBScenario, ["hidden-pool"], CLAUSE_CATALOG, 150_000_000);

    exportComparisonPDF(
      {
        scenario,
        snapshot: dirtySnapshot,
        activeClauseIds: dirtySnapshot.activeClauseIds,
        exitValue: dirtySnapshot.waterfall.exitValue,
      },
      {
        scenario: dealBScenario,
        snapshot: dealBSnapshot,
        activeClauseIds: dealBSnapshot.activeClauseIds,
        exitValue: dealBSnapshot.waterfall.exitValue,
      },
    );

    expect(jsPDFMock).toHaveBeenCalledWith({ format: "a4", orientation: "landscape", unit: "mm" });
    expect(autoTableMock).toHaveBeenCalled();
    expect(docMock.save).toHaveBeenCalledWith("comparison-nova-vs-pulse-2026-03-30.pdf");
  });
});
