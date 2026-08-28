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
    user: req.user,
    assignmentId: req.params.id,
    payload: req.body,
  });

  sendSuccess(res, {
    message: "Assignment updated successfully",
    data: assignment,
  });
});

const deleteAssignment = catchAsync(async (req, res) => {
  await assignmentService.deleteAssignment({
    user: req.user,
    assignmentId: req.params.id,
  });

  sendSuccess(res, {
    message: "Assignment deleted successfully",
    data: null,
  });
});

const getAssignments = catchAsync(async (req, res) => {
  const assignments = await assignmentService.getAssignments(req.user);

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
  const result = await assignmentService.assignToAllGroups({
    user: req.user,
    assignmentId: req.params.id,
  });

  sendSuccess(res, {
    message: "Assignment allocated to all groups successfully",
    data: result,
  });
});

const assignToSelectedGroups = catchAsync(async (req, res) => {
  const result = await assignmentService.assignToSelectedGroups({
    user: req.user,
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

const submitAssignment = catchAsync(async (req, res) => {
  const submission = await assignmentService.submitAssignment({
    user: req.user,
    assignmentId: req.params.id,
  });
  sendSuccess(res, {
    message: "Submission marked as submitted",
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

const getAssignmentSubmissions = catchAsync(async (req, res) => {
  const submissions = await assignmentService.getAssignmentSubmissions({
    user: req.user,
    assignmentId: req.params.id,
    status: req.query.status,
  });

  sendSuccess(res, {
    message: "Assignment submissions fetched successfully",
    data: submissions,
  });
});

module.exports = {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignments,
  getAssignmentById,
  assignToAllGroups,
  assignToSelectedGroups,
  confirmSubmission,
  submitAssignment,
  getSubmissionStatus,
  getAssignmentSubmissions,
};
