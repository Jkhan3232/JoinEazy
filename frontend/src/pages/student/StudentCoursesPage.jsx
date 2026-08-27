import { Link } from "react-router-dom";

import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import PageHeader from "../../components/shared/PageHeader";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAsyncData } from "../../hooks/useAsyncData";
import { dashboardService } from "../../services/dashboardService";

function StudentCoursesPage() {
  const { data, loading, error } = useAsyncData(
    () => dashboardService.getStudentCourses(),
    [],
  );

  if (loading) return <Loader label="Loading courses..." />;
  if (error)
    return <EmptyState title="Unable to load courses" description={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learning spaces"
        title="Your courses"
        description="Open a course to view its assignments and track your progress."
      />
      {data.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.map((course) => (
            <Link key={course.id} to={`/student/courses/${course.id}`}>
              <Card className="h-full transition hover:-translate-y-1 hover:shadow-float">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-teal">
                      {course.code}
                    </p>
                    <h3 className="mt-2 font-display text-2xl text-brand-ink">
                      {course.name}
                    </h3>
                  </div>
                  <Badge>{course.completionPercentage}%</Badge>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Professor: {course.professor.name}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {course.assignmentCount} assignments
                </p>
                <div className="mt-5">
                  <ProgressBar value={course.completionPercentage} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No courses enrolled"
          description="Your professor has not enrolled you in a course yet."
        />
      )}
    </div>
  );
}

export default StudentCoursesPage;
