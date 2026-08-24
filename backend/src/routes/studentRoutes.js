const express = require("express");

const studentController = require("../controllers/studentController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate(), authorize("STUDENT"));

router.get("/assignments", studentController.getAssignments);
router.get("/dashboard", studentController.getDashboard);

module.exports = router;
