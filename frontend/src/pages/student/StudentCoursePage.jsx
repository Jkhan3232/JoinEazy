import { Link, useParams } from "react-router-dom";

import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import PageHeader from "../../components/shared/PageHeader";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAsyncData } from "../../hooks/useAsyncData";
import { dashboardService } from "../../services/dashboardService";
import { formatDate } from "../../utils/format";

function StudentCoursePage() {
  const { courseId } = useParams();
  const { data, loading, error } = useAsyncData(
    () => dashboardService.getStudentCourse(courseId),
    [courseId],
  );

  if (loading) return <Loader label="Loading course..." />;
  if (error)
    return <EmptyState title="Unable to load course" description={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={data.code}
        title={data.name}
        description={data.description}
      />
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-600">
              Professor: {data.professor.name}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {data.assignmentCount} assignments
            </p>
          </div>
          <Badge>{data.completionPercentage}% complete</Badge>
        </div>
        <div className="mt-5">
          <ProgressBar value={data.completionPercentage} />
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {data.assignments.length ? (
          data.assignments.map((assignment) => (
            <Card key={assignment.id} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brand-teal">
                    Due {formatDate(assignment.dueDate)}
                  </p>
                  <h3 className="mt-2 font-display text-2xl text-brand-ink">
                    {assignment.title}
                  </h3>
                </div>
                <Badge>{assignment.submissionType}</Badge>
              </div>
              <p className="text-sm text-slate-600">{assignment.description}</p>
              <Link
                className="inline-flex text-sm font-semibold text-brand-teal"
                to={`/student/assignments/${assignment.id}`}>
                View assignment
              </Link>
            </Card>
          ))
        ) : (
          <EmptyState
            title="No assignments yet"
            description="Assignments for this course will appear here."
          />
        )}
      </div>
    </div>
  );
}

export default StudentCoursePage;
