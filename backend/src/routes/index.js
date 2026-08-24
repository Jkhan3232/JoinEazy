const express = require("express");

const authRoutes = require("./authRoutes");
const groupRoutes = require("./groupRoutes");
const assignmentRoutes = require("./assignmentRoutes");
const studentRoutes = require("./studentRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/groups", groupRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/student", studentRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
