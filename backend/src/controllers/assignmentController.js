const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/response");
const assignmentService = require("../services/assignmentService");

const createAssignment = catchAsync(async (req, res) => {
  const assignment = await assignmentService.createAssignment({
    user: req.user,
    payload: req.body,
  });

  sendSuccess(res, {
    statusCode: 201,
    message: "Assignment created successfully",
    data: assignment,
  });
});

const updateAssignment = catchAsync(async (req, res) => {
  const assignment = await assignmentService.updateAssignment({
    assignmentId: req.params.id,
    payload: req.body,
  });

  sendSuccess(res, {
    message: "Assignment updated successfully",
    data: assignment,
  });
});

const getAssignments = catchAsync(async (_req, res) => {
  const assignments = await assignmentService.getAssignments();

  sendSuccess(res, {
    message: "Assignments fetched successfully",
    data: assignments,
  });
});

const getAssignmentById = catchAsync(async (req, res) => {
  const assignment = await assignmentService.getAssignmentById({
    assignmentId: req.params.id,
    user: req.user,
  });

  sendSuccess(res, {
    message: "Assignment fetched successfully",
    data: assignment,
  });
});

const assignToAllGroups = catchAsync(async (req, res) => {
  const result = await assignmentService.assignToAllGroups(req.params.id);

  sendSuccess(res, {
    message: "Assignment allocated to all groups successfully",
    data: result,
  });
});

const assignToSelectedGroups = catchAsync(async (req, res) => {
  const result = await assignmentService.assignToSelectedGroups({
    assignmentId: req.params.id,
    payload: req.body,
  });

  sendSuccess(res, {
    message: "Assignment allocated to selected groups successfully",
    data: result,
  });
});

const confirmSubmission = catchAsync(async (req, res) => {
  const submission = await assignmentService.confirmSubmission({
    user: req.user,
    assignmentId: req.params.id,
  });

  sendSuccess(res, {
    message: "Submission confirmed successfully",
    data: submission,
  });
});

const getSubmissionStatus = catchAsync(async (req, res) => {
  const submissionStatus = await assignmentService.getSubmissionStatus({
    user: req.user,
    assignmentId: req.params.id,
    groupId: req.query.groupId,
  });

  sendSuccess(res, {
    message: "Submission status fetched successfully",
    data: submissionStatus,
  });
});

module.exports = {
  createAssignment,
  updateAssignment,
  getAssignments,
  getAssignmentById,
  assignToAllGroups,
  assignToSelectedGroups,
  confirmSubmission,
  getSubmissionStatus,
};
