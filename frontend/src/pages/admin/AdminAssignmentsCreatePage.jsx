import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AssignmentForm from "../../components/shared/AssignmentForm";
import PageHeader from "../../components/shared/PageHeader";
import { assignmentService } from "../../services/assignmentService";
import { getErrorMessage } from "../../utils/format";

function AdminAssignmentsCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    oneDriveLink: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        dueDate: new Date(form.dueDate).toISOString(),
      };
      const assignment = await assignmentService.createAssignment(payload);
      toast.success("Assignment created successfully.");
      navigate(`/admin/assignments/${assignment.id}/edit`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Create assignment"
        title="New assignment"
        description="Create an assignment first, then allocate it to all groups or a selected subset."
      />

      <AssignmentForm
        form={form}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitLabel="Create assignment"
        submitting={submitting}
      />
    </div>
  );
}

export default AdminAssignmentsCreatePage;
