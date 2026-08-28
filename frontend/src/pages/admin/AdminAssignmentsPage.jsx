import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import PageHeader from "../../components/shared/PageHeader";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import { useAsyncData } from "../../hooks/useAsyncData";
import { assignmentService } from "../../services/assignmentService";
import { formatDate, getErrorMessage } from "../../utils/format";

function AdminAssignmentsPage() {
  const { data, loading, error, reload } = useAsyncData(
    () => assignmentService.getAssignments(),
    [],
    [],
  );
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (assignment) => {
    if (
      !window.confirm(
        `Delete assignment "${assignment.title}"? This cannot be undone.`,
      )
    )
      return;
    setDeletingId(assignment.id);
    try {
      await assignmentService.deleteAssignment(assignment.id);
      toast.success("Assignment deleted successfully.");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <Loader label="Loading assignments..." />;
  }

  if (error) {
    return (
      <EmptyState title="Unable to load assignments" description={error} />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Professor assignments"
        title="Assignments"
        description="Create, edit, allocate, and inspect submission coverage for each assignment."
        action={
          <Link to="/professor/assignments/create">
            <Button variant="secondary">Create assignment</Button>
          </Link>
        }
      />

      <div className="grid gap-5">
        {data.length ? (
          data.map((assignment) => (
            <Card key={assignment.id}>
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
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

                <div className="flex flex-wrap gap-2">
                  <Badge>{assignment.assignedGroups.length} groups</Badge>
                  <Badge>
                    {
                      assignment.submissions.filter(
                        (item) => ["CONFIRMED", "ACKNOWLEDGED"].includes(item.status),
                      ).length
                    }{" "}
                    completed
                  </Badge>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="rounded-3xl border border-brand-line bg-white/80 p-4 text-sm text-slate-600">
                  <p>Created by {assignment.createdBy.name}</p>
                  <p className="mt-2">
                    Course: {assignment.course?.code || assignment.course?.name || "Not set"}
                  </p>
                  <p className="mt-2">
                    OneDrive link: {assignment.oneDriveLink}
                  </p>
                  <p className="mt-2">
                    Submission records: {assignment.submissions.length}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link to={`/professor/assignments/${assignment.id}/edit`}>
                    <Button variant="primary">Edit and allocate</Button>
                  </Link>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(assignment)}
                    disabled={deletingId === assignment.id}>
                    {deletingId === assignment.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState
            title="No assignments yet"
            description="Create your first assignment to start group allocation and submission tracking."
          />
        )}
      </div>
    </div>
  );
}

export default AdminAssignmentsPage;
