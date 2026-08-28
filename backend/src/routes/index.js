const express = require("express");

const authRoutes = require("./authRoutes");
const groupRoutes = require("./groupRoutes");
const assignmentRoutes = require("./assignmentRoutes");
const studentRoutes = require("./studentRoutes");
const adminRoutes = require("./adminRoutes");
const professorRoutes = require("./professorRoutes");
const courseRoutes = require("./courseRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/groups", groupRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/student", studentRoutes);
router.use("/admin", adminRoutes);
router.use("/professor", professorRoutes);
router.use("/courses", courseRoutes);

module.exports = router;
