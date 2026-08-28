import { describe, expect, it } from "vitest";

import assignmentValidator from "./assignmentValidator";

const { normalizeAssignmentPayload } = assignmentValidator;

describe("normalizeAssignmentPayload", () => {
  it("normalizes assignment payloads with deadline aliases", () => {
    const payload = normalizeAssignmentPayload({
      title: "  Sprint Review  ",
      description: "  Upload the mock and notes.  ",
      deadline: "2026-09-01T17:00:00.000Z",
      oneDriveLink: "https://onedrive.live.com/example",
      courseId: "course_123",
      submissionType: "individual",
    });

    expect(payload.title).toBe("Sprint Review");
    expect(payload.description).toBe("Upload the mock and notes.");
    expect(payload.submissionType).toBe("INDIVIDUAL");
    expect(payload.courseId).toBe("course_123");
    expect(payload.dueDate).toBeInstanceOf(Date);
  });

  it("rejects links that are not OneDrive or SharePoint URLs", () => {
    expect(() =>
      normalizeAssignmentPayload({
        title: "Sprint Review",
        description: "Upload the mock and notes.",
        dueDate: "2026-09-01T17:00:00.000Z",
        oneDriveLink: "https://example.com/files",
        courseId: "course_123",
        submissionType: "GROUP",
      }),
    ).toThrow("Please provide a OneDrive or SharePoint URL");
  });
});
