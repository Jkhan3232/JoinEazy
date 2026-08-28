import { useState } from "react";
import toast from "react-hot-toast";

import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import CourseCard from "../../components/shared/CourseCard";
import CourseForm from "../../components/shared/CourseForm";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { useAsyncData } from "../../hooks/useAsyncData";
import { courseService } from "../../services/courseService";
import { getErrorMessage } from "../../utils/format";

function AdminCoursesPage() {
  const { data = [], loading, error, reload } = useAsyncData(
    () => courseService.getCourses(),
    [],
    [],
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleOpenCreate = () => {
    setForm({ name: "", code: "", description: "" });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (course) => {
    setEditingCourse(course);
    setForm({
      name: course.name || "",
      code: course.code || "",
      description: course.description || "",
    });
  };

  const handleClose = () => {
    setIsCreateOpen(false);
    setEditingCourse(null);
    setForm({ name: "", code: "", description: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await courseService.createCourse(form);
      toast.success("Course created successfully.");
      handleClose();
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await courseService.updateCourse(editingCourse.id, form);
      toast.success("Course updated successfully.");
      handleClose();
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingCourse) return;
    if (
      !window.confirm(
        `Are you sure you want to delete the course "${editingCourse.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await courseService.deleteCourse(editingCourse.id);
      toast.success("Course deleted successfully.");
      handleClose();
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

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
        action={
          <Button onClick={handleOpenCreate} variant="secondary">
            + Create course
          </Button>
        }
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
            <CourseCard
              key={course.id}
              course={course}
              compact
              footer={
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    className="border border-brand-line text-xs py-2 px-3"
                    onClick={() => handleOpenEdit(course)}
                  >
                    Edit course
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No courses yet"
          description="Create or assign a course to start tracking professor analytics."
          action={
            <Button onClick={handleOpenCreate} variant="secondary">
              + Create course
            </Button>
          }
        />
      )}

      {/* Create Course Modal */}
      {isCreateOpen && (
        <Modal title="Create New Course" onClose={handleClose}>
          <CourseForm
            form={form}
            onChange={handleChange}
            onSubmit={handleCreateSubmit}
            submitLabel="Create course"
            submitting={submitting}
            onCancel={handleClose}
          />
        </Modal>
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <Modal title={`Edit ${editingCourse.code}`} onClose={handleClose}>
          <div className="space-y-4">
            <CourseForm
              form={form}
              onChange={handleChange}
              onSubmit={handleEditSubmit}
              submitLabel="Save changes"
              submitting={submitting}
              onCancel={handleClose}
            />
            <div className="border-t border-brand-line pt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">Danger Zone</span>
              <Button
                variant="danger"
                className="text-xs py-2 px-3"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete course"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AdminCoursesPage;
