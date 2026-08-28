const express = require("express");

const courseController = require("../controllers/courseController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate());

router.get("/", courseController.getCourses);
router.get("/:id", courseController.getCourseById);
router.get("/:id/assignments", courseController.getCourseAssignments);

module.exports = router;
