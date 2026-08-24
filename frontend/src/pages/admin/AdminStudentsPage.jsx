import { useDeferredValue, useState } from "react";

import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import PageHeader from "../../components/shared/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import { useAsyncData } from "../../hooks/useAsyncData";
import { dashboardService } from "../../services/dashboardService";

function AdminStudentsPage() {
  const { data, loading, error } = useAsyncData(() => dashboardService.getAdminStudents(), [], []);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const filteredStudents = data.filter((student) => {
    const query = deferredSearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.group?.name.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return <Loader label="Loading students..." />;
  }

  if (error) {
    return <EmptyState title="Unable to load students" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Students"
        title="Student directory"
        description="Inspect current group membership and submission participation for each student."
      />

      <Card>
        <Input
          label="Search students"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by student name, email, or group"
        />
      </Card>

      <div className="grid gap-5">
        {filteredStudents.length ? (
          filteredStudents.map((student) => (
            <Card key={student.id}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <h3 className="font-display text-3xl text-brand-ink">{student.name}</h3>
                  <p className="mt-2 text-slate-600">{student.email}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Group: {student.group?.name || "No group assigned"}
                  </p>
                </div>
                <Badge>{student.personallyConfirmedAssignments} personally confirmed</Badge>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-brand-line bg-white/80 p-4">
                  <p className="text-sm text-slate-500">Group assignments</p>
                  <p className="mt-2 text-2xl font-bold text-brand-ink">{student.totalGroupAssignments}</p>
                </div>
                <div className="rounded-2xl border border-brand-line bg-white/80 p-4">
                  <p className="text-sm text-slate-500">Group confirmed</p>
                  <p className="mt-2 text-2xl font-bold text-brand-ink">{student.groupConfirmedAssignments}</p>
                </div>
                <div className="rounded-2xl border border-brand-line bg-white/80 p-4">
                  <p className="text-sm text-slate-500">Personally confirmed</p>
                  <p className="mt-2 text-2xl font-bold text-brand-ink">{student.personallyConfirmedAssignments}</p>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState
            title="No students match your search"
            description="Try a different student name, email, or group."
          />
        )}
      </div>
    </div>
  );
}

export default AdminStudentsPage;
