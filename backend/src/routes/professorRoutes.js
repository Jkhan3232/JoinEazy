const express = require("express");

const professorController = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate(), authorize("PROFESSOR"));

router.get("/dashboard", professorController.getDashboard);
router.get("/analytics", professorController.getAnalytics);
router.get("/groups", professorController.getGroups);
router.get("/students", professorController.getStudents);

module.exports = router;
