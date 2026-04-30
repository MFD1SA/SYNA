import { describe, it, expect, vi, beforeEach } from "vitest";
import { TERMINAL_PHASES, isTerminalPhase, phaseLabels, phaseColors } from "./dealPhase.service";

/**
 * Pure helpers in dealPhase.service test suite.
 *
 * The full transitionDealPhase() flow hits the network (Supabase RPC +
 * edge function) so it lives in the integration / E2E suite. What we
 * test here are the deterministic helpers: terminal-phase detection,
 * label coverage, and color-token coverage. A regression in any of
 * these silently mislabels phases across every dashboard.
 */

describe("dealPhase.service — pure helpers", () => {
  describe("TERMINAL_PHASES", () => {
    it("contains exactly the three terminal phases", () => {
      expect(TERMINAL_PHASES).toEqual(["closed_won", "closed_lost", "cancelled"]);
    });
  });

  describe("isTerminalPhase()", () => {
    it("returns true for each terminal phase", () => {
      expect(isTerminalPhase("closed_won")).toBe(true);
      expect(isTerminalPhase("closed_lost")).toBe(true);
      expect(isTerminalPhase("cancelled")).toBe(true);
    });

    it("returns false for active phases", () => {
      expect(isTerminalPhase("nda_pending")).toBe(false);
      expect(isTerminalPhase("under_review")).toBe(false);
      expect(isTerminalPhase("study_required")).toBe(false);
      expect(isTerminalPhase("negotiation_active")).toBe(false);
    });

    it("returns false for null/undefined/empty", () => {
      expect(isTerminalPhase(null)).toBe(false);
      expect(isTerminalPhase(undefined)).toBe(false);
      expect(isTerminalPhase("")).toBe(false);
    });

    it("returns false for unknown strings (no false-positives)", () => {
      expect(isTerminalPhase("CLOSED_WON")).toBe(false);
      expect(isTerminalPhase("won")).toBe(false);
      expect(isTerminalPhase("not_a_phase")).toBe(false);
    });
  });

  describe("phaseLabels coverage", () => {
    const expectedPhases = [
      "nda_pending", "nda_developer_accepted", "nda_both_accepted",
      "under_review", "study_required", "study_submitted",
      "study_under_review", "study_changes_requested", "study_resubmitted",
      "study_approved", "study_rejected",
      "meeting_proposed", "meeting_confirmed", "meeting_completed",
      "report_pending_approval", "report_approved", "report_rejected",
      "report_changes_requested", "report_expired",
      "negotiation_active", "final_approval",
      "closed_won", "closed_lost", "cancelled",
    ] as const;

    it.each(expectedPhases)("has bilingual label for %s", (phase) => {
      const label = phaseLabels[phase];
      expect(label).toBeDefined();
      expect(label.ar.length).toBeGreaterThan(0);
      expect(label.en.length).toBeGreaterThan(0);
    });
  });

  describe("phaseColors coverage", () => {
    it("has a Tailwind class string for every label", () => {
      Object.keys(phaseLabels).forEach((phase) => {
        expect(phaseColors[phase as keyof typeof phaseColors]).toBeDefined();
        expect(phaseColors[phase as keyof typeof phaseColors].length).toBeGreaterThan(0);
      });
    });
  });
});
