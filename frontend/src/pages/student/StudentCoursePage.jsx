import { Link, useParams } from "react-router-dom";

import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import AssignmentCard from "../../components/shared/AssignmentCard";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAsyncData } from "../../hooks/useAsyncData";
import { courseService } from "../../services/courseService";
import { formatDate } from "../../utils/format";

function StudentCoursePage() {
  const { courseId } = useParams();
  const { data, loading, error } = useAsyncData(
    () => courseService.getCourse(courseId),
    [courseId],
  );

  if (loading) {
    return <Loader label="Loading course..." />;
  }

  if (error) {
    return <EmptyState title="Unable to load course" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Course overview"
        title={`${data.name} (${data.code})`}
        description={data.description}
        action={
          <Link
            to="/student/courses"
            className="rounded-2xl border border-brand-line bg-white/80 px-4 py-3 text-sm font-semibold text-brand-ink">
            Back to courses
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={data.studentCount} helper="Currently enrolled" />
        <StatCard label="Assignments" value={data.totalAssignments} helper="Visible work items" />
        <StatCard label="Completed" value={data.completedAssignments} helper="Acknowledged submissions" />
        <StatCard label="Progress" value={`${data.completionPercentage}%`} helper={data.progressStatus} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">Course details</p>
          <h3 className="mt-2 font-display text-3xl text-brand-ink">{data.name}</h3>
          <p className="mt-3 text-slate-600">{data.description}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-brand-line bg-white/80 p-4">
              <p className="text-sm text-slate-500">Professor</p>
              <p className="mt-1 font-semibold text-brand-ink">{data.professor?.name}</p>
            </div>
            <div className="rounded-2xl border border-brand-line bg-white/80 p-4">
              <p className="text-sm text-slate-500">Code</p>
              <p className="mt-1 font-semibold text-brand-ink">{data.code}</p>
            </div>
            <div className="rounded-2xl border border-brand-line bg-white/80 p-4">
              <p className="text-sm text-slate-500">Pending assignments</p>
              <p className="mt-1 font-semibold text-brand-ink">{data.pendingAssignments}</p>
            </div>
            <div className="rounded-2xl border border-brand-line bg-white/80 p-4">
              <p className="text-sm text-slate-500">Overall progress</p>
              <p className="mt-1 font-semibold text-brand-ink">{data.progressStatus}</p>
            </div>
          </div>

          <div className="mt-5">
            <ProgressBar value={data.completionPercentage} />
          </div>
        </Card>

        <Card>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">Your group</p>
          {data.group ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-3xl border border-brand-line bg-white/80 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-display text-2xl text-brand-ink">{data.group.name}</h4>
                    <p className="mt-2 text-sm text-slate-600">
                      Leader: {data.group.leader?.name || "Not set"}
                    </p>
                  </div>
                  <Badge>{data.group.members?.length || 0} members</Badge>
                </div>
              </div>

              <div className="space-y-3">
                {data.group.members?.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-brand-line bg-white/80 px-4 py-3">
                    <p className="font-semibold text-brand-ink">{member.student.name}</p>
                    <p className="text-sm text-slate-500">{member.student.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">
                      Joined {formatDate(member.joinedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-slate-600">
              You are not part of a course group yet. Open the group page to create or join one.
            </p>
          )}
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">Assignments</p>
            <h3 className="mt-2 font-display text-3xl text-brand-ink">Course work</h3>
          </div>
          <Badge>{data.assignments.length} assignments</Badge>
        </div>

        {data.assignments.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {data.assignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                to={`/student/assignments/${assignment.id}`}
                actionLabel="Open assignment"
                compact
                showCourse
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No assignments yet"
            description="There are no assignments assigned to this course right now."
          />
        )}
      </section>
    </div>
  );
}

export default StudentCoursePage;
