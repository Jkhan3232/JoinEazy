import { useState } from "react";
import toast from "react-hot-toast";

import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import PageHeader from "../../components/shared/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input, { Textarea } from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAsyncData } from "../../hooks/useAsyncData";
import { courseService } from "../../services/courseService";
import { dashboardService } from "../../services/dashboardService";
import { getErrorMessage } from "../../utils/format";

const emptyForm = { name: "", code: "", description: "" };

function AdminCoursesPage() {
  const {
    data: courses,
    loading,
    error,
    reload,
  } = useAsyncData(() => courseService.getCourses(), [], []);
  const { data: students = [] } = useAsyncData(
    () => dashboardService.getAdminStudents(),
    [],
    [],
  );
  const [form, setForm] = useState(emptyForm);
  const [studentIds, setStudentIds] = useState({});
  const [saving, setSaving] = useState(false);
  const [enrolling, setEnrolling] = useState(null);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await courseService.createCourse(form);
      toast.success("Course created successfully.");
      setForm(emptyForm);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEnroll = async (courseId) => {
    const studentId = studentIds[courseId];
    if (!studentId) {
      toast.error("Select a student first.");
      return;
    }
    setEnrolling(courseId);
    try {
      await courseService.enrollStudent(courseId, studentId);
      toast.success("Student enrolled successfully.");
      setStudentIds((current) => ({ ...current, [courseId]: "" }));
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) return <Loader label="Loading courses..." />;
  if (error)
    return <EmptyState title="Unable to load courses" description={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Professor workspace"
        title="Courses"
        description="Create courses, enroll students, and monitor course assignment progress."
      />

      <Card>
        <form onSubmit={handleCreate} className="space-y-4">
          <h3 className="font-display text-3xl text-brand-ink">Add a course</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Course name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="MERN Stack Development"
              required
            />
            <Input
              label="Course code"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="MERN-101"
              required
            />
          </div>
          <Textarea
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the course."
            required
          />
          <Button type="submit" variant="secondary" disabled={saving}>
            {saving ? "Creating..." : "Create course"}
          </Button>
        </form>
      </Card>

      {courses.length ? (
        courses.map((course) => (
          <Card key={course.id} className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-teal">
                  {course.code}
                </p>
                <h3 className="mt-2 font-display text-3xl text-brand-ink">
                  {course.name}
                </h3>
                <p className="mt-2 text-slate-600">{course.description}</p>
              </div>
              <Badge>{course.studentCount} students</Badge>
            </div>
            <ProgressBar value={course.completionPercentage} />
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span>{course.assignmentCount} assignments</span>
              <span>{course.completionPercentage}% complete</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={studentIds[course.id] || ""}
                onChange={(event) =>
                  setStudentIds((current) => ({
                    ...current,
                    [course.id]: event.target.value,
                  }))
                }
                className="min-h-12 flex-1 rounded-2xl border border-brand-line bg-white/80 px-4 text-brand-ink outline-none focus:border-brand-teal"
                aria-label={`Select student for ${course.name}`}>
                <option value="">Select student to enroll</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.email})
                  </option>
                ))}
              </select>
              <Button
                variant="primary"
                onClick={() => handleEnroll(course.id)}
                disabled={enrolling === course.id}>
                {enrolling === course.id ? "Enrolling..." : "Enroll student"}
              </Button>
            </div>
          </Card>
        ))
      ) : (
        <EmptyState
          title="No courses yet"
          description="Create your first course using the form above."
        />
      )}
    </div>
  );
}

export default AdminCoursesPage;
