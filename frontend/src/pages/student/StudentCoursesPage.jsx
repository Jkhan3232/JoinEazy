import PageHeader from "../../components/shared/PageHeader";
import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import StatCard from "../../components/shared/StatCard";
import CourseCard from "../../components/shared/CourseCard";
import { useAsyncData } from "../../hooks/useAsyncData";
import { courseService } from "../../services/courseService";

function StudentCoursesPage() {
  const { data = [], loading, error } = useAsyncData(
    () => courseService.getCourses(),
    [],
    [],
  );

  if (loading) {
    return <Loader label="Loading courses..." />;
  }

  if (error) {
    return <EmptyState title="Unable to load courses" description={error} />;
  }

  const totalAssignments = data.reduce(
    (count, course) => count + (course.assignmentCount || 0),
    0,
  );
  const completedAssignments = data.reduce(
    (count, course) => count + (course.completedAssignments || 0),
    0,
  );
  const completionPercentage = data.length
    ? Math.round(
        data.reduce((sum, course) => sum + (course.completionPercentage || 0), 0) /
          data.length,
      )
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student courses"
        title="Your enrolled courses"
        description="Browse every course you are enrolled in and jump into the assignments for that class."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Courses" value={data.length} helper="Active enrollments" />
        <StatCard label="Assignments" value={totalAssignments} helper="Across all courses" />
        <StatCard label="Average progress" value={`${completionPercentage}%`} helper="Across your courses" />
      </div>

      {data.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((course) => (
            <CourseCard
              key={course.id}
              course={{
                ...course,
                assignmentCount: course.assignmentCount,
                completionPercentage: course.completionPercentage,
              }}
              to={`/student/courses/${course.id}`}
              footer={
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    {course.completedAssignments || 0} of {course.assignmentCount || 0} completed
                  </p>
                  <span className="text-sm font-semibold text-brand-teal">View course</span>
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No enrolled courses"
          description="Your professor has not enrolled you in any course yet."
        />
      )}
    </div>
  );
}

export default StudentCoursesPage;
