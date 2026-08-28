import { describe, expect, it } from "vitest";

import groupValidator from "./groupValidator";

const {
  validateAddMemberPayload,
  validateCreateGroupPayload,
} = groupValidator;

describe("groupValidator", () => {
  it("normalizes create group payloads", () => {
    expect(
      validateCreateGroupPayload({
        name: "  Orbit Builders  ",
        courseId: "  course_123  ",
      }),
    ).toEqual({
      name: "Orbit Builders",
      courseId: "course_123",
    });
  });

  it("detects email and student id member identifiers", () => {
    expect(validateAddMemberPayload({ identifier: "student4@joineazy.test" })).toEqual({
      identifier: "student4@joineazy.test",
      mode: "email",
    });

    expect(validateAddMemberPayload({ identifier: "student_12345" })).toEqual({
      identifier: "student_12345",
      mode: "id",
    });
  });
});
