import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import CourseCard from "../../components/shared/CourseCard";
import { useAsyncData } from "../../hooks/useAsyncData";
import { courseService } from "../../services/courseService";

function AdminCoursesPage() {
  const { data = [], loading, error } = useAsyncData(
    () => courseService.getCourses(),
    [],
    [],
  );

  if (loading) {
    return <Loader label="Loading professor courses..." />;
  }

  if (error) {
    return <EmptyState title="Unable to load courses" description={error} />;
  }

  const totalStudents = data.reduce((count, course) => count + (course.studentCount || 0), 0);
  const totalAssignments = data.reduce(
    (count, course) => count + (course.assignmentCount || 0),
    0,
  );
  const averageCompletion = data.length
    ? Math.round(
        data.reduce((sum, course) => sum + (course.completionPercentage || 0), 0) /
          data.length,
      )
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Professor courses"
        title="Courses you teach"
        description="Review enrollment, assignment volume, and overall submission progress across your classes."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Courses" value={data.length} helper="Currently taught" />
        <StatCard label="Students" value={totalStudents} helper="Across all courses" />
        <StatCard label="Assignments" value={totalAssignments} helper="Assigned work" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Avg progress" value={`${averageCompletion}%`} helper="Across your courses" />
        <StatCard label="Completion" value={data.reduce((sum, course) => sum + (course.completedAssignments || 0), 0)} helper="Acknowledged submissions" />
        <StatCard label="Pending" value={data.reduce((sum, course) => sum + (course.pendingAssignments || 0), 0)} helper="Awaiting acknowledgement" />
      </div>

      {data.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((course) => (
            <CourseCard key={course.id} course={course} compact />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No courses yet"
          description="Create or assign a course to start tracking professor analytics."
        />
      )}
    </div>
  );
}

export default AdminCoursesPage;
