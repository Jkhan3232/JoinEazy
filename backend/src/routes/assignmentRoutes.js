const express = require("express");

const assignmentController = require("../controllers/assignmentController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate());

router.get("/", authorize("ADMIN"), assignmentController.getAssignments);
router.get("/:id", assignmentController.getAssignmentById);
router.post("/", authorize("ADMIN"), assignmentController.createAssignment);
router.put("/:id", authorize("ADMIN"), assignmentController.updateAssignment);
router.delete(
  "/:id",
  authorize("ADMIN"),
  assignmentController.deleteAssignment,
);
router.post("/:id/all-groups", authorize("ADMIN"), assignmentController.assignToAllGroups);
router.post("/:id/groups", authorize("ADMIN"), assignmentController.assignToSelectedGroups);
router.post("/:id/submit/confirm", authorize("STUDENT"), assignmentController.confirmSubmission);
router.post(
  "/:id/submit",
  authorize("STUDENT"),
  assignmentController.submitAssignment,
);
router.get(
  "/:id/submissions",
  authorize("ADMIN"),
  assignmentController.getAssignmentSubmissions,
);
router.get("/:id/submission-status", assignmentController.getSubmissionStatus);

module.exports = router;
