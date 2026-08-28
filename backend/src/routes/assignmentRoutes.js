const express = require("express");

const assignmentController = require("../controllers/assignmentController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate());

router.get("/", authorize("PROFESSOR"), assignmentController.getAssignments);
router.get("/:id", assignmentController.getAssignmentById);
router.post("/", authorize("PROFESSOR"), assignmentController.createAssignment);
router.put("/:id", authorize("PROFESSOR"), assignmentController.updateAssignment);
router.delete(
  "/:id",
  authorize("PROFESSOR"),
  assignmentController.deleteAssignment,
);
router.post("/:id/all-groups", authorize("PROFESSOR"), assignmentController.assignToAllGroups);
router.post("/:id/groups", authorize("PROFESSOR"), assignmentController.assignToSelectedGroups);
router.post("/:id/submit/confirm", authorize("STUDENT"), assignmentController.confirmSubmission);
router.post(
  "/:id/submit",
  authorize("STUDENT"),
  assignmentController.submitAssignment,
);
router.get(
  "/:id/submissions",
  authorize("PROFESSOR"),
  assignmentController.getAssignmentSubmissions,
);
router.get("/:id/submission-status", assignmentController.getSubmissionStatus);

module.exports = router;
