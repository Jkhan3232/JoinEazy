import Button from "../ui/Button";
import Input, { Textarea } from "../ui/Input";

function CourseForm({
  form,
  onChange,
  onSubmit,
  submitLabel,
  submitting,
  title,
  onCancel,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {title && (
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">
            Course editor
          </p>
          <h3 className="mt-2 font-display text-3xl text-brand-ink">{title}</h3>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Course name"
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="e.g. Distributed Systems"
          required
        />

        <Input
          label="Course code"
          name="code"
          value={form.code}
          onChange={onChange}
          placeholder="e.g. CS-401"
          required
        />
      </div>

      <Textarea
        label="Description"
        name="description"
        value={form.description}
        onChange={onChange}
        placeholder="Provide an overview of the course objectives and syllabus."
        required
      />

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="secondary" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default CourseForm;
