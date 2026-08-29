import { Link } from "react-router-dom";

import CourseCard from "../../components/shared/CourseCard";
import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAsyncData } from "../../hooks/useAsyncData";
import { dashboardService } from "../../services/dashboardService";
import { formatDate } from "../../utils/format";

function StudentDashboardPage() {
  const { data, loading, error } = useAsyncData(
    () => dashboardService.getStudentDashboard(),
    [],
  );
  const currentGroup = data?.groups?.[0] || null;
  const groupMembers = currentGroup?.members || [];

  if (loading) {
    return <Loader label="Loading student dashboard..." />;
  }

  if (error) {
    return <EmptyState title="Dashboard unavailable" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student dashboard"
        title={`Welcome back, ${data.studentProfile.name}`}
        description="Track your current group, assigned work, and submission progress from one place."
      />

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">
              Learning spaces
            </p>
            <h3 className="mt-2 font-display text-3xl text-brand-ink">
              Your enrolled courses
            </h3>
          </div>
          <Link
            to="/student/courses"
            className="text-sm font-semibold text-brand-teal hover:underline">
            View all courses &rarr;
          </Link>
        </div>
        {data.courses.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                to={`/student/courses/${course.id}`}
                footer={
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500 font-medium">
                      {course.completedAssignments || 0} / {course.totalAssignments || course.assignmentCount || 0} completed
                    </span>
                    <span className="font-semibold text-brand-teal hover:underline">
                      Open Assignments &rarr;
                    </span>
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No courses enrolled"
            description="Your professor has not enrolled you in a course yet."
          />
        )}
      </section>

      {!currentGroup ? (
        <EmptyState
          title="Create your first group"
          description="Your courses are ready above. Create a group to unlock group assignment workflows."
          action={
            <Link
              to="/student/group"
              className="rounded-2xl bg-brand-teal px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95">
              + Create group
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Current Group"
            value={currentGroup.name}
            helper={currentGroup.course?.code || "Your active working group"}
          />
          <StatCard
            label="Assignments"
            value={data.totalAssignedAssignments}
            helper="Total work allocated to your group"
          />
          <StatCard
            label="Completed"
            value={data.completedAssignments}
            helper="Completed / submitted assignments"
          />
          <StatCard
            label="Progress"
            value={`${data.completionPercentage}%`}
            helper={data.progressStatus}
          />
        </div>
      )}

      {currentGroup ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">
                  Group progress
                </p>
                <h3 className="mt-2 font-display text-3xl text-brand-ink">
                  {currentGroup.name}
                </h3>
                <p className="mt-2 text-slate-600">
                  {data.completedAssignments} of {data.totalAssignedAssignments}{" "}
                  assignments completed/submitted
                </p>
              </div>
              <Badge>{data.progressStatus}</Badge>
            </div>
            <div className="mt-5">
              <ProgressBar value={data.completionPercentage} />
            </div>

            <div className="mt-6 grid gap-3">
              {groupMembers.map((member) => (
                <div
                  key={member.student.id}
                  className="flex items-center justify-between rounded-2xl border border-brand-line bg-white/80 px-4 py-3">
                  <div>
                    <p className="font-semibold text-brand-ink">
                      {member.student.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {member.student.email}
                    </p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Joined {formatDate(member.joinedAt)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">
              Recent assignments
            </p>
            <div className="mt-5 space-y-4">
              {data.recentAssignments.length ? (
                data.recentAssignments.map((assignment) => (
                  <Link
                    key={assignment.id}
                    to={`/student/assignments/${assignment.id}`}
                    className="block rounded-3xl border border-brand-line bg-white/80 p-4 transition hover:border-brand-teal hover:shadow-subtle">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-brand-ink">
                          {assignment.title}
                        </p>
                        <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                          {assignment.description}
                        </p>
                      </div>
                      <Badge>{assignment.submissionStatus}</Badge>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                      <span>Due {formatDate(assignment.dueDate)}</span>
                      <span className="font-semibold text-brand-teal">Open Assignment &rarr;</span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-slate-500">
                  No assignments have been assigned to your group yet.
                </p>
              )}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export default StudentDashboardPage;
