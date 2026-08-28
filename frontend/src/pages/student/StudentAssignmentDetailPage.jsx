import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import PageHeader from "../../components/shared/PageHeader";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAsyncData } from "../../hooks/useAsyncData";
import { assignmentService } from "../../services/assignmentService";
import { formatDate, formatDateTime, formatStatusLabel, getErrorMessage } from "../../utils/format";

function StudentAssignmentDetailPage() {
  const { assignmentId } = useParams();
  const { data, loading, error, reload } = useAsyncData(
    () => assignmentService.getStudentAssignment(assignmentId),
    [assignmentId],
  );
  const [step, setStep] = useState(1);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const status = data?.submissionStatus || data?.status || "PENDING";
  const progress = data?.progress || data?.submission?.progress || 0;
  const isCompleted = ["ACKNOWLEDGED", "CONFIRMED"].includes(status);
  const canAcknowledge =
    !isCompleted && (data?.submissionType === "INDIVIDUAL" || data?.isGroupLeader);

  const openModal = () => {
    setStep(1);
    setIsOpen(true);
  };

  const closeModal = () => {
    setStep(1);
    setIsOpen(false);
  };

  const handleConfirm = async () => {
    if (!data) {
      return;
    }

    setIsConfirming(true);

    try {
      if (status === "PENDING") {
        await assignmentService.submitAssignment(data.id);
      }

      await assignmentService.confirmSubmission(data.id);
      toast.success("Submission acknowledged successfully.");
      closeModal();
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading) {
    return <Loader label="Loading assignment..." />;
  }

  if (error) {
    return <EmptyState title="Unable to load assignment" description={error} />;
  }

  const statusLabel = formatStatusLabel(status);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assignment detail"
        title={data.title}
        description={data.description}
        action={
          <Link
            to={`/student/courses/${data.course?.id || ""}`}
            className="rounded-2xl border border-brand-line bg-white/80 px-4 py-3 text-sm font-semibold text-brand-ink">
            Back to course
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Deadline</p>
          <p className="mt-3 text-2xl font-semibold text-brand-ink">
            {formatDate(data.deadline || data.dueDate)}
          </p>
        </Card>
        <Card>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Submission type</p>
          <p className="mt-3 text-2xl font-semibold text-brand-ink">{data.submissionType}</p>
        </Card>
        <Card>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Status</p>
          <div className="mt-3">
            <Badge>{statusLabel}</Badge>
          </div>
        </Card>
        <Card>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Progress</p>
          <p className="mt-3 text-2xl font-semibold text-brand-ink">{progress}%</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">
                {data.course?.code || "Course"}
              </p>
              <h3 className="mt-2 font-display text-3xl text-brand-ink">{data.course?.name}</h3>
              <p className="mt-2 text-slate-600">{data.course?.description}</p>
            </div>
            <Badge>{statusLabel}</Badge>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
              <span>Submission progress</span>
              <span>{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-brand-line bg-white/80 p-4">
              <p className="text-sm text-slate-500">Submitted at</p>
              <p className="mt-1 font-semibold text-brand-ink">
                {formatDateTime(data.confirmedAt || data.acknowledgedAt)}
              </p>
            </div>
            <div className="rounded-3xl border border-brand-line bg-white/80 p-4">
              <p className="text-sm text-slate-500">Acknowledged by</p>
              <p className="mt-1 font-semibold text-brand-ink">
                {data.confirmedBy?.name || data.acknowledgedBy?.name || "Awaiting confirmation"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={data.oneDriveLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-brand-ink px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-900">
              Open submission link
            </a>
            <Button
              variant="secondary"
              onClick={openModal}
              disabled={!canAcknowledge}
            >
              {isCompleted
                ? "Submission acknowledged"
                : data.submissionType === "GROUP" && !data.isGroupLeader
                  ? "Only the group leader can acknowledge"
                  : "I have submitted"}
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">Group information</p>
          {data.group ? (
            <>
              <div className="rounded-3xl border border-brand-line bg-white/80 p-5">
                <h4 className="font-display text-3xl text-brand-ink">{data.group.name}</h4>
                <p className="mt-2 text-slate-600">
                  Leader: {data.group.leader?.name || "Not set"}
                </p>
              </div>
              <div className="space-y-3">
                {data.group.members?.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-brand-line bg-white/80 px-4 py-3">
                    <p className="font-semibold text-brand-ink">{member.student.name}</p>
                    <p className="text-sm text-slate-500">{member.student.email}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-600">
              This is an individual assignment. Acknowledgement is tied to your own account.
            </p>
          )}
        </Card>
      </div>

      {isOpen ? (
        <Modal
          title={step === 1 ? "Upload confirmation" : "Final confirmation"}
          onClose={closeModal}>
          {step === 1 ? (
            <div className="space-y-4">
              <p className="text-slate-600">
                Have you uploaded <strong>{data.title}</strong> to the provided submission
                location?
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={closeModal}>
                  Cancel
                </Button>
                <Button variant="secondary" onClick={() => setStep(2)} disabled={!canAcknowledge}>
                  Yes, I have submitted
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-600">
                Are you sure you want to acknowledge this submission? This will update the
                progress for you and your group.
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleConfirm}
                  disabled={isConfirming || !canAcknowledge}>
                  {isConfirming ? "Confirming..." : "Confirm submission"}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      ) : null}
    </div>
  );
}

export default StudentAssignmentDetailPage;
