import { describe, expect, it } from "vitest";

import { validateCoursePayload } from "./courseValidator";

describe("courseValidator", () => {
  it("normalizes and validates valid course payloads", () => {
    expect(
      validateCoursePayload({
        name: "  Web Development 101  ",
        code: "  CS-101  ",
        description: "  Intro to Web Dev  ",
      }),
    ).toEqual({
      name: "Web Development 101",
      code: "CS-101",
      description: "Intro to Web Dev",
    });
  });

  it("throws error for missing fields", () => {
    expect(() =>
      validateCoursePayload({
        name: "",
        code: "CS-101",
        description: "Intro to Web Dev",
      }),
    ).toThrow("Missing required fields: course name");

    expect(() =>
      validateCoursePayload({
        name: "Web Dev",
        code: "",
        description: "Intro to Web Dev",
      }),
    ).toThrow("Missing required fields: course code");

    expect(() =>
      validateCoursePayload({
        name: "Web Dev",
        code: "CS-101",
        description: "",
      }),
    ).toThrow("Missing required fields: description");
  });
});
