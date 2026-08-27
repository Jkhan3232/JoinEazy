import { useState } from "react";
import toast from "react-hot-toast";

import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import PageHeader from "../../components/shared/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAsyncData } from "../../hooks/useAsyncData";
import { assignmentService } from "../../services/assignmentService";
import { formatDate, formatDateTime, getErrorMessage } from "../../utils/format";

function StudentAssignmentsPage() {
  const { data, loading, error, reload } = useAsyncData(
    () => assignmentService.getStudentAssignments(),
    [],
  );
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const closeModal = () => {
    setSelectedAssignment(null);
    setStep(1);
  };

  const startConfirmation = (assignment) => {
    setSelectedAssignment(assignment);
    setStep(1);
  };

  const confirmSubmission = async () => {
    if (!selectedAssignment) {
      return;
    }

    setSubmitting(true);

    try {
      if (selectedAssignment.submissionStatus === "PENDING") {
        await assignmentService.submitAssignment(selectedAssignment.id);
      }
      await assignmentService.confirmSubmission(selectedAssignment.id);
      toast.success("Submission acknowledged successfully.");
      closeModal();
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader label="Loading student assignments..." />;
  }

  if (error) {
    return <EmptyState title="Unable to load assignments" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assignments"
        title={
          data.group ? `Assignments for ${data.group.name}` : "Your assignments"
        }
        description="Open the OneDrive folder, upload your work externally, then use the two-step confirmation flow below."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Assigned
          </p>
          <p className="mt-3 text-4xl font-extrabold text-brand-ink">
            {data.totals.totalAssignedAssignments}
          </p>
        </Card>
        <Card>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Completed
          </p>
          <p className="mt-3 text-4xl font-extrabold text-brand-ink">
            {data.totals.completedAssignments}
          </p>
        </Card>
        <Card>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Pending
          </p>
          <p className="mt-3 text-4xl font-extrabold text-brand-ink">
            {data.totals.pendingAssignments}
          </p>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {data.assignments.length ? (
          data.assignments.map((assignment) => (
            <Card key={assignment.id} className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">
                    Due {formatDate(assignment.dueDate)}
                  </p>
                  <h3 className="mt-2 font-display text-3xl text-brand-ink">
                    {assignment.title}
                  </h3>
                  <p className="mt-3 text-slate-600">
                    {assignment.description}
                  </p>
                </div>
                <Badge>{assignment.submissionStatus}</Badge>
              </div>

              <div className="rounded-3xl border border-brand-line bg-white/80 p-4 text-sm text-slate-600">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span>
                    {assignment.submissionType === "INDIVIDUAL"
                      ? "Individual submission"
                      : "Group submission"}
                  </span>
                  <span className="font-semibold text-brand-ink">
                    {["CONFIRMED", "ACKNOWLEDGED"].includes(
                      assignment.submissionStatus,
                    )
                      ? "100%"
                      : "0%"}
                  </span>
                </div>
                <ProgressBar
                  value={
                    ["CONFIRMED", "ACKNOWLEDGED"].includes(
                      assignment.submissionStatus,
                    )
                      ? 100
                      : assignment.submissionStatus === "SUBMITTED"
                        ? 60
                        : 0
                  }
                />
                {assignment.group ? (
                  <p>Group: {assignment.group.name}</p>
                ) : (
                  <p>Individual assignment</p>
                )}
                <p className="mt-2">
                  Confirmed at: {formatDateTime(assignment.confirmedAt)}
                </p>
                <p className="mt-2">
                  Confirmed by:{" "}
                  {assignment.confirmedBy?.name || "Awaiting confirmation"}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={assignment.oneDriveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-brand-ink px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-900">
                  Open OneDrive
                </a>
                <Button
                  variant="secondary"
                  onClick={() => startConfirmation(assignment)}
                  disabled={
                    ["CONFIRMED", "ACKNOWLEDGED"].includes(
                      assignment.submissionStatus,
                    ) ||
                    (assignment.submissionType === "GROUP" &&
                      !assignment.isGroupLeader)
                  }>
                  {["CONFIRMED", "ACKNOWLEDGED"].includes(
                    assignment.submissionStatus,
                  )
                    ? "Submission confirmed"
                    : assignment.submissionType === "GROUP" &&
                        !assignment.isGroupLeader
                      ? "Waiting for group leader"
                      : "I have submitted"}
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState
            title="No assignments yet"
            description="Once an admin allocates work to your group, it will appear here with its OneDrive link and submission status."
          />
        )}
      </div>

      {selectedAssignment ? (
        <Modal
          title={step === 1 ? "Upload confirmation" : "Final confirmation"}
          onClose={closeModal}>
          {step === 1 ? (
            <div className="space-y-4">
              <p className="text-slate-600">
                Have you uploaded <strong>{selectedAssignment.title}</strong> to
                the provided OneDrive location?
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={closeModal}>
                  Cancel
                </Button>
                <Button variant="secondary" onClick={() => setStep(2)}>
                  Yes, I have submitted
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-600">
                Are you sure? This submission will be acknowledged and visible
                on the professor dashboard.
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={confirmSubmission}
                  disabled={submitting}>
                  {submitting ? "Confirming..." : "Confirm submission"}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      ) : null}
    </div>
  );
}

export default StudentAssignmentsPage;
