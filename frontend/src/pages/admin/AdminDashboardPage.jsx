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

function AdminDashboardPage() {
  const { data, loading, error } = useAsyncData(
    async () => {
      const [dashboard, analytics] = await Promise.all([
        dashboardService.getAdminDashboard(),
        dashboardService.getAdminAnalytics(),
      ]);
      const courses = await dashboardService.getAdminCourses();

      return { dashboard, analytics, courses };
    },
    [],
  );

  if (loading) {
    return <Loader label="Loading admin dashboard..." />;
  }

  if (error) {
    return <EmptyState title="Unable to load admin dashboard" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin dashboard"
        title="Operations overview"
        description="Monitor students, groups, assignments, and submission completion across the platform."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Courses"
          value={data.courses.length}
          helper="Courses taught by you"
        />
        <StatCard
          label="Students"
          value={data.dashboard.totalStudents}
          helper="Registered student accounts"
        />
        <StatCard
          label="Groups"
          value={data.dashboard.totalGroups}
          helper="Active working groups"
        />
        <StatCard
          label="Assignments"
          value={data.dashboard.totalAssignments}
          helper="Assignments created by admins"
        />
        <StatCard
          label="Submission slots"
          value={data.dashboard.totalSubmissions}
          helper="Pending plus confirmed submissions"
        />
        <StatCard
          label="Confirmed"
          value={data.dashboard.confirmedSubmissions}
          helper="Groups that completed submission"
        />
        <StatCard
          label="Pending"
          value={data.dashboard.pendingSubmissions}
          helper="Submissions still awaiting confirmation"
        />
        <StatCard
          label="Submitted"
          value={data.dashboard.submittedSubmissions}
          helper="Work uploaded externally"
        />
        <StatCard
          label="Acknowledged"
          value={data.dashboard.acknowledgedSubmissions}
          helper="Final confirmations"
        />
        <StatCard
          label="Completion"
          value={`${data.dashboard.completionPercentage}%`}
          helper="Overall submission completion"
        />
      </div>

      <Card>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">
              Teaching spaces
            </p>
            <h3 className="mt-2 font-display text-3xl text-brand-ink">
              Your courses
            </h3>
          </div>
        </div>
        {data.courses.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.courses.map((course) => (
              <div
                key={course.id}
                className="rounded-3xl border border-brand-line bg-white/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-teal">
                  {course.code}
                </p>
                <h4 className="mt-2 font-display text-2xl text-brand-ink">
                  {course.name}
                </h4>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <span>{course.studentCount} students</span>
                  <span>{course.assignmentCount} assignments</span>
                </div>
                <div className="mt-4">
                  <ProgressBar value={course.completionPercentage} />
                </div>
                <p className="mt-2 text-sm font-semibold text-brand-teal">
                  {course.completionPercentage}% complete
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-slate-500">
            Create a course to start tracking teaching progress.
          </p>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">
                Recent assignments
              </p>
              <h3 className="mt-2 font-display text-3xl text-brand-ink">
                Latest activity
              </h3>
            </div>
            <Badge>{data.dashboard.completionPercentage}% complete</Badge>
          </div>

          <div className="mt-5 space-y-4">
            {data.dashboard.recentAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-3xl border border-brand-line bg-white/80 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-brand-ink">
                      {assignment.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Due {formatDate(assignment.dueDate)}
                    </p>
                  </div>
                  <Badge>
                    {assignment.confirmedSubmissions}/
                    {assignment.totalSubmissions}
                  </Badge>
                </div>
                <div className="mt-4">
                  <ProgressBar
                    value={
                      assignment.totalSubmissions
                        ? Math.round(
                            (assignment.confirmedSubmissions /
                              assignment.totalSubmissions) *
                              100,
                          )
                        : 0
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">
            Group completion
          </p>
          <h3 className="mt-2 font-display text-3xl text-brand-ink">
            Progress by group
          </h3>
          <div className="mt-5 space-y-4">
            {data.analytics.groupWiseCompletion.map((group) => (
              <div
                key={group.groupId}
                className="rounded-3xl border border-brand-line bg-white/80 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-brand-ink">
                      {group.groupName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {group.confirmedSubmissions} of {group.totalSubmissions}{" "}
                      confirmed
                    </p>
                  </div>
                  <Badge>{group.completionPercentage}%</Badge>
                </div>
                <div className="mt-4">
                  <ProgressBar value={group.completionPercentage} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
