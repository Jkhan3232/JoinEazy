import { useDeferredValue, useState } from "react";

import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import PageHeader from "../../components/shared/PageHeader";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAsyncData } from "../../hooks/useAsyncData";
import { dashboardService } from "../../services/dashboardService";

function AdminGroupsPage() {
  const { data, loading, error } = useAsyncData(() => dashboardService.getAdminGroups(), [], []);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const filteredGroups = data.filter((group) => {
    const query = deferredSearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      group.name.toLowerCase().includes(query) ||
      group.createdBy.name.toLowerCase().includes(query) ||
      group.members.some((member) => member.name.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return <Loader label="Loading groups..." />;
  }

  if (error) {
    return <EmptyState title="Unable to load groups" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Groups"
        title="Group directory"
        description="Review group composition, assignment coverage, and completion status."
      />

      <Card>
        <Input
          label="Search groups"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by group name, owner, or member"
        />
      </Card>

      <div className="grid gap-5">
        {filteredGroups.length ? (
          filteredGroups.map((group) => (
            <Card key={group.id}>
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">Owned by {group.createdBy.name}</p>
                  <h3 className="mt-2 font-display text-3xl text-brand-ink">{group.name}</h3>
                  <p className="mt-3 text-slate-600">
                    {group.members.length} members • {group.assignmentCount} assignments •{" "}
                    {group.confirmedSubmissions} confirmed submissions
                  </p>
                </div>
                <Badge>{group.progressStatus}</Badge>
              </div>

              <div className="mt-5">
                <ProgressBar value={group.completionPercentage} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {group.members.map((member) => (
                  <span
                    key={member.id}
                    className="rounded-full border border-brand-line bg-white/80 px-3 py-1 text-sm text-slate-600"
                  >
                    {member.name}
                  </span>
                ))}
              </div>
            </Card>
          ))
        ) : (
          <EmptyState
            title="No groups match your search"
            description="Try a different student, owner, or group name."
          />
        )}
      </div>
    </div>
  );
}

export default AdminGroupsPage;
