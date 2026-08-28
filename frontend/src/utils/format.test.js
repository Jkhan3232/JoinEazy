import { describe, expect, it } from "vitest";

import {
  formatRoleLabel,
  formatStatusLabel,
  getStatusTone,
} from "./format";

describe("format helpers", () => {
  it("maps assignment statuses to friendly labels and tones", () => {
    expect(formatStatusLabel("ACKNOWLEDGED")).toBe("Acknowledged");
    expect(formatStatusLabel("SUBMITTED")).toBe("Submitted");
    expect(formatStatusLabel("CONFIRMED")).toBe("Confirmed");
    expect(formatStatusLabel("PENDING")).toBe("Pending");

    expect(getStatusTone("ACKNOWLEDGED")).toBe("success");
    expect(getStatusTone("CONFIRMED")).toBe("success");
    expect(getStatusTone("SUBMITTED")).toBe("info");
    expect(getStatusTone("PENDING")).toBe("warning");
  });

  it("maps roles to readable labels", () => {
    expect(formatRoleLabel("PROFESSOR")).toBe("Professor");
    expect(formatRoleLabel("STUDENT")).toBe("Student");
  });
});
