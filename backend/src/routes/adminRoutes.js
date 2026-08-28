const express = require("express");

const adminController = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate(), authorize("PROFESSOR"));

router.get("/dashboard", adminController.getDashboard);
router.get("/analytics", adminController.getAnalytics);
router.get("/groups", adminController.getGroups);
router.get("/students", adminController.getStudents);

module.exports = router;
