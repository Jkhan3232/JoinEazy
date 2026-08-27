import { useState } from "react";
import { useParams } from "react-router-dom";
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
import {
  formatDate,
  formatDateTime,
  getErrorMessage,
} from "../../utils/format";

function StudentAssignmentDetailPage() {
  const { assignmentId } = useParams();
  const { data, loading, error, reload } = useAsyncData(
    () => assignmentService.getAssignment(assignmentId),
    [assignmentId],
  );
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  if (loading) return <Loader label="Loading assignment..." />;
  if (error)
    return <EmptyState title="Unable to load assignment" description={error} />;

  const status = data.submission?.status || "PENDING";
  const complete = ["ACKNOWLEDGED", "CONFIRMED"].includes(status);
  const canAcknowledge =
    data.submissionType === "INDIVIDUAL" || data.isGroupLeader;

  const acknowledge = async () => {
    setSaving(true);
    try {
      if (status === "PENDING")
        await assignmentService.submitAssignment(assignmentId);
      await assignmentService.confirmSubmission(assignmentId);
      toast.success("Submission acknowledged successfully.");
      setOpen(false);
      setStep(1);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={data.course?.code || "Assignment"}
        title={data.title}
        description={data.description}
      />
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge>{data.submissionType}</Badge>
            <Badge>{status}</Badge>
          </div>
          <p className="text-sm font-semibold text-slate-600">
            Due {formatDate(data.dueDate)}
          </p>
        </div>
        <div>
          <ProgressBar
            value={complete ? 100 : status === "SUBMITTED" ? 60 : 0}
          />
        </div>
        {data.group ? (
          <p className="text-sm text-slate-600">Group: {data.group.name}</p>
        ) : (
          <p className="text-sm text-slate-600">Individual submission</p>
        )}
        <p className="text-sm text-slate-600">
          Acknowledged: {formatDateTime(data.submission?.confirmedAt)}
        </p>
        <a
          href={data.oneDriveLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-2xl bg-brand-ink px-4 py-3 text-sm font-semibold text-white">
          Open OneDrive
        </a>
        {complete ? (
          <p className="font-semibold text-emerald-700">
            Submission acknowledged
          </p>
        ) : canAcknowledge ? (
          <Button variant="secondary" onClick={() => setOpen(true)}>
            I have submitted
          </Button>
        ) : (
          <p className="text-sm font-semibold text-amber-700">
            Waiting for group leader
          </p>
        )}
      </Card>
      {open ? (
        <Modal
          title={step === 1 ? "Upload confirmation" : "Final acknowledgment"}
          onClose={() => setOpen(false)}>
          {step === 1 ? (
            <div className="space-y-4">
              <p className="text-slate-600">
                Have you uploaded this assignment to the provided OneDrive
                location?
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setOpen(false)}>
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
                Are you sure you want to acknowledge this submission?
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={acknowledge}
                  disabled={saving}>
                  {saving ? "Confirming..." : "Confirm submission"}
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
