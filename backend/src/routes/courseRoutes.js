const express = require("express");
const courseController = require("../controllers/courseController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authenticate());

router.get("/", courseController.getCourses);
router.get("/:id", courseController.getCourse);
router.post("/", authorize("ADMIN"), courseController.createCourse);
router.put("/:id", authorize("ADMIN"), courseController.updateCourse);
router.post("/:id/enroll", authorize("ADMIN"), courseController.enrollStudent);

module.exports = router;
