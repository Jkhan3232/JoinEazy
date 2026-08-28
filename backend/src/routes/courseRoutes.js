const express = require("express");

const courseController = require("../controllers/courseController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate());

router.get("/", courseController.getCourses);
router.post("/", authorize("PROFESSOR"), courseController.createCourse);
router.get("/:id", courseController.getCourseById);
router.put("/:id", authorize("PROFESSOR"), courseController.updateCourse);
router.delete("/:id", authorize("PROFESSOR"), courseController.deleteCourse);
router.get("/:id/assignments", courseController.getCourseAssignments);

module.exports = router;
