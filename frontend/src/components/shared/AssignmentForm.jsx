import Button from "../ui/Button";
import Input, { Textarea } from "../ui/Input";

function AssignmentForm({
  form,
  onChange,
  onSubmit,
  submitLabel,
  submitting,
  courses = [],
  title = "Assignment details",
}) {
  return (
    <form onSubmit={onSubmit} className="glass-panel space-y-5 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">
          Assignment editor
        </p>
        <h3 className="mt-2 font-display text-3xl text-brand-ink">{title}</h3>
      </div>

      <Input
        label="Title"
        name="title"
        value={form.title}
        onChange={onChange}
        placeholder="Weekly problem solving sprint"
        required
      />

      <Textarea
        label="Description"
        name="description"
        value={form.description}
        onChange={onChange}
        placeholder="Describe the required deliverables and expectations."
        required
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-brand-ink">
          Course
          <select
            name="courseId"
            value={form.courseId || ""}
            onChange={onChange}
            required
            className="min-h-12 rounded-2xl border border-brand-line bg-white/80 px-4 text-brand-ink outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20">
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </label>
      <Input
        label="Deadline"
        name="dueDate"
        type="datetime-local"
        value={form.dueDate}
          onChange={onChange}
          required
        />
        <Input
          label="OneDrive link"
          name="oneDriveLink"
          value={form.oneDriveLink}
          onChange={onChange}
          placeholder="https://..."
          required
        />
        <label className="grid gap-2 text-sm font-semibold text-brand-ink">
          Submission type
          <select
            name="submissionType"
            value={form.submissionType || "GROUP"}
            onChange={onChange}
            className="min-h-12 rounded-2xl border border-brand-line bg-white/80 px-4 text-brand-ink outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
            required>
            <option value="GROUP">Group submission</option>
            <option value="INDIVIDUAL">Individual submission</option>
          </select>
        </label>
      </div>

      <Button type="submit" variant="secondary" disabled={submitting}>
        {submitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

export default AssignmentForm;
