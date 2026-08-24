import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import PageHeader from "../../components/shared/PageHeader";
import Card from "../../components/ui/Card";
import { useAuth } from "../../hooks/useAuth";
import { useAsyncData } from "../../hooks/useAsyncData";
import { groupService } from "../../services/groupService";
import { formatDate } from "../../utils/format";

function StudentProfilePage() {
  const { user } = useAuth();
  const { data, loading, error } = useAsyncData(() => groupService.getGroups(), [], []);
  const currentGroup = data?.[0] || null;

  if (loading) {
    return <Loader label="Loading profile..." />;
  }

  if (error) {
    return <EmptyState title="Unable to load profile" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title={user.name}
        description="Your account summary, role information, and current group membership are available here."
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">Account</p>
          <div className="rounded-3xl border border-brand-line bg-white/80 p-5">
            <p className="text-sm text-slate-500">Email</p>
            <p className="mt-1 text-lg font-semibold text-brand-ink">{user.email}</p>
          </div>
          <div className="rounded-3xl border border-brand-line bg-white/80 p-5">
            <p className="text-sm text-slate-500">Role</p>
            <p className="mt-1 text-lg font-semibold text-brand-ink">{user.role}</p>
          </div>
          <div className="rounded-3xl border border-brand-line bg-white/80 p-5">
            <p className="text-sm text-slate-500">Member since</p>
            <p className="mt-1 text-lg font-semibold text-brand-ink">{formatDate(user.createdAt)}</p>
          </div>
        </Card>

        <Card>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">Current group</p>
          {currentGroup ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-3xl border border-brand-line bg-white/80 p-5">
                <p className="font-display text-3xl text-brand-ink">{currentGroup.name}</p>
                <p className="mt-2 text-slate-600">Created by {currentGroup.createdBy.name}</p>
              </div>
              <div className="grid gap-3">
                {currentGroup.members.map((member) => (
                  <div
                    key={member.student.id}
                    className="rounded-2xl border border-brand-line bg-white/80 px-4 py-3"
                  >
                    <p className="font-semibold text-brand-ink">{member.student.name}</p>
                    <p className="text-sm text-slate-500">{member.student.email}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-slate-600">
              You are not part of a group yet. Create one from the group page to unlock assignment
              tracking.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

export default StudentProfilePage;
