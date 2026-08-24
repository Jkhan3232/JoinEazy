import Button from "../ui/Button";
import Input, { Textarea } from "../ui/Input";

function AssignmentForm({
  form,
  onChange,
  onSubmit,
  submitLabel,
  submitting,
  title = "Assignment details",
}) {
  return (
    <form onSubmit={onSubmit} className="glass-panel space-y-5 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">Assignment editor</p>
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
        <Input
          label="Due date"
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
      </div>

      <Button type="submit" variant="secondary" disabled={submitting}>
        {submitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

export default AssignmentForm;
