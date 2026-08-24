const express = require("express");

const groupController = require("../controllers/groupController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate());

router.get("/", groupController.getGroups);
router.get("/:id", groupController.getGroupById);
router.post("/", authorize("STUDENT"), groupController.createGroup);
router.post("/:id/members", authorize("STUDENT"), groupController.addMember);
router.delete("/:id/members/:studentId", authorize("STUDENT"), groupController.removeMember);

module.exports = router;
