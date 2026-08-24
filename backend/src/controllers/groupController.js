const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/response");
const groupService = require("../services/groupService");

const createGroup = catchAsync(async (req, res) => {
  const group = await groupService.createGroup({
    user: req.user,
    payload: req.body,
  });

  sendSuccess(res, {
    statusCode: 201,
    message: "Group created successfully",
    data: group,
  });
});

const getGroups = catchAsync(async (req, res) => {
  const groups = await groupService.getGroups(req.user);

  sendSuccess(res, {
    message: "Groups fetched successfully",
    data: groups,
  });
});

const getGroupById = catchAsync(async (req, res) => {
  const group = await groupService.getGroupById({
    user: req.user,
    groupId: req.params.id,
  });

  sendSuccess(res, {
    message: "Group fetched successfully",
    data: group,
  });
});

const addMember = catchAsync(async (req, res) => {
  const group = await groupService.addMember({
    user: req.user,
    groupId: req.params.id,
    payload: req.body,
  });

  sendSuccess(res, {
    message: "Member added successfully",
    data: group,
  });
});

const removeMember = catchAsync(async (req, res) => {
  const group = await groupService.removeMember({
    user: req.user,
    groupId: req.params.id,
    studentId: req.params.studentId,
  });

  sendSuccess(res, {
    message: "Member removed successfully",
    data: group,
  });
});

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
  addMember,
  removeMember,
};
