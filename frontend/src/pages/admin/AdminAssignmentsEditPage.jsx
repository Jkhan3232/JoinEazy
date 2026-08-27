import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import AssignmentForm from "../../components/shared/AssignmentForm";
import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import PageHeader from "../../components/shared/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { useAsyncData } from "../../hooks/useAsyncData";
import { assignmentService } from "../../services/assignmentService";
import { dashboardService } from "../../services/dashboardService";
import { courseService } from "../../services/courseService";
import { formatDateTime, getErrorMessage } from "../../utils/format";

const toLocalDateTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

function AdminAssignmentsEditPage() {
  const { assignmentId } = useParams();
  const { data, loading, error, reload } = useAsyncData(
    async () => {
      const [assignment, groups] = await Promise.all([
        assignmentService.getAssignment(assignmentId),
        dashboardService.getAdminGroups(),
      ]);

      return { assignment, groups };
    },
    [assignmentId],
  );
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    oneDriveLink: "",
    submissionType: "GROUP",
  });
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [assigningAll, setAssigningAll] = useState(false);
  const [assigningSelected, setAssigningSelected] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const { data: courses = [] } = useAsyncData(
    () => courseService.getCourses(),
    [],
    [],
  );

  useEffect(() => {
    if (!data?.assignment) {
      return;
    }

    setForm({
      title: data.assignment.title,
      description: data.assignment.description,
      dueDate: toLocalDateTime(data.assignment.dueDate),
      oneDriveLink: data.assignment.oneDriveLink,
      submissionType: data.assignment.submissionType || "GROUP",
      courseId: data.assignment.course?.id || "",
    });
  }, [data]);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await assignmentService.updateAssignment(assignmentId, {
        ...form,
        dueDate: new Date(form.dueDate).toISOString(),
      });
      toast.success("Assignment updated successfully.");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAssignAll = async () => {
    setAssigningAll(true);

    try {
      await assignmentService.assignToAllGroups(assignmentId);
      toast.success("Assignment allocated to all groups.");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAssigningAll(false);
    }
  };

  const handleToggleGroup = (groupId) => {
    setSelectedGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((item) => item !== groupId)
        : [...current, groupId],
    );
  };

  const handleAssignSelected = async () => {
    if (!selectedGroupIds.length) {
      toast.error("Select at least one group.");
      return;
    }

    setAssigningSelected(true);

    try {
      await assignmentService.assignToSelectedGroups(assignmentId, { groupIds: selectedGroupIds });
      toast.success("Assignment allocated to selected groups.");
      setSelectedGroupIds([]);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAssigningSelected(false);
    }
  };

  if (loading) {
    return <Loader label="Loading assignment editor..." />;
  }

  if (error) {
    return <EmptyState title="Unable to load assignment" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Edit assignment"
        title={data.assignment.title}
        description="Update assignment details and manage group allocation from one screen."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <AssignmentForm
          form={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          submitLabel="Save changes"
          submitting={saving}
          courses={courses}
          title="Update assignment details"
        />

        <Card className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">
              Allocation
            </p>
            <h3 className="mt-2 font-display text-3xl text-brand-ink">
              Assign to groups
            </h3>
            <p className="mt-2 text-slate-600">
              Allocating creates the assignment-group relationship and pending
              submission records.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="secondary"
              onClick={handleAssignAll}
              disabled={assigningAll}>
              {assigningAll ? "Assigning..." : "Assign to all groups"}
            </Button>
            <Button
              variant="primary"
              onClick={handleAssignSelected}
              disabled={assigningSelected}>
              {assigningSelected ? "Assigning..." : "Assign selected groups"}
            </Button>
          </div>

          <div className="grid gap-3">
            {data.groups.map((group) => {
              const assigned = data.assignment.assignedGroups.some(
                (item) => item.id === group.id,
              );

              return (
                <label
                  key={group.id}
                  className="flex items-center justify-between rounded-2xl border border-brand-line bg-white/80 px-4 py-3">
                  <div>
                    <p className="font-semibold text-brand-ink">{group.name}</p>
                    <p className="text-sm text-slate-500">
                      {group.members.length} members •{" "}
                      {group.completionPercentage}% complete
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {assigned ? <Badge>Assigned</Badge> : null}
                    <input
                      type="checkbox"
                      checked={selectedGroupIds.includes(group.id)}
                      onChange={() => handleToggleGroup(group.id)}
                      className="h-5 w-5 rounded border-brand-line text-brand-teal focus:ring-brand-teal"
                    />
                  </div>
                </label>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">
          Submission status
        </p>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter submission status"
          className="mt-4 min-h-11 rounded-2xl border border-brand-line bg-white/80 px-4 text-sm text-brand-ink outline-none focus:border-brand-teal">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="CONFIRMED">Confirmed</option>
        </select>
        <div className="mt-5 grid gap-4">
          {data.assignment.submissions.filter(
            (submission) => !statusFilter || submission.status === statusFilter,
          ).length ? (
            data.assignment.submissions
              .filter(
                (submission) =>
                  !statusFilter || submission.status === statusFilter,
              )
              .map((submission) => (
                <div
                  key={submission.id}
                  className="rounded-3xl border border-brand-line bg-white/80 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-brand-ink">
                        {submission.group?.name ||
                          submission.student?.name ||
                          "Individual student"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Confirmed at: {formatDateTime(submission.confirmedAt)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Confirmed by:{" "}
                        {submission.confirmedBy?.name ||
                          "Awaiting confirmation"}
                      </p>
                    </div>
                    <Badge>{submission.status}</Badge>
                  </div>
                </div>
              ))
          ) : (
            <p className="text-slate-600">
              No groups have been assigned to this assignment yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

export default AdminAssignmentsEditPage;
