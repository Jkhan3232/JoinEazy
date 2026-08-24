import { useState } from "react";
import toast from "react-hot-toast";

import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import PageHeader from "../../components/shared/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import { useAsyncData } from "../../hooks/useAsyncData";
import { groupService } from "../../services/groupService";
import { formatDate, getErrorMessage } from "../../utils/format";

function StudentGroupPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsyncData(() => groupService.getGroups(), [], []);
  const currentGroup = data?.[0] || null;
  const [groupName, setGroupName] = useState("");
  const [memberIdentifier, setMemberIdentifier] = useState("");
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    setCreating(true);

    try {
      await groupService.createGroup({ name: groupName });
      toast.success("Group created successfully.");
      setGroupName("");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();

    if (!currentGroup) {
      return;
    }

    setAdding(true);

    try {
      await groupService.addMember(currentGroup.id, { identifier: memberIdentifier });
      toast.success("Member added successfully.");
      setMemberIdentifier("");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (studentId) => {
    try {
      await groupService.removeMember(currentGroup.id, studentId);
      toast.success("Member removed successfully.");
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return <Loader label="Loading group details..." />;
  }

  if (error) {
    return <EmptyState title="Unable to load groups" description={error} />;
  }

  if (!currentGroup) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Group workspace"
          title="Create your group"
          description="You become the owner of the group you create, and you can then add students by email or student ID."
        />
        <Card className="max-w-2xl">
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <Input
              label="Group name"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Orbit Engineers"
              required
            />
            <Button type="submit" variant="secondary" disabled={creating}>
              {creating ? "Creating group..." : "Create group"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const isOwner = currentGroup.createdBy.id === user.id;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Group workspace"
        title={currentGroup.name}
        description={
          isOwner
            ? "You are the group owner and can manage members from this page."
            : "You are part of this group. Only the creator can add or remove members."
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">Members</p>
              <h3 className="mt-2 font-display text-3xl text-brand-ink">
                {currentGroup.members.length} students
              </h3>
            </div>
            <div className="rounded-2xl border border-brand-line bg-white/80 px-4 py-2 text-sm text-slate-600">
              Created by {currentGroup.createdBy.name}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {currentGroup.members.map((member) => {
              const canRemove = isOwner && member.student.id !== currentGroup.createdBy.id;

              return (
                <div
                  key={member.student.id}
                  className="flex flex-col gap-4 rounded-3xl border border-brand-line bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-brand-ink">{member.student.name}</p>
                    <p className="text-sm text-slate-500">{member.student.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">
                      Joined {formatDate(member.joinedAt)}
                    </p>
                  </div>
                  {canRemove ? (
                    <Button variant="ghost" onClick={() => handleRemoveMember(member.student.id)}>
                      Remove member
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">Member management</p>
          <h3 className="mt-2 font-display text-3xl text-brand-ink">Add a classmate</h3>
          <p className="mt-2 text-slate-600">
            Use the student email or internal student ID. Duplicate memberships and admin accounts
            are blocked by the backend.
          </p>

          {isOwner ? (
            <form onSubmit={handleAddMember} className="mt-6 space-y-4">
              <Input
                label="Email or student ID"
                value={memberIdentifier}
                onChange={(event) => setMemberIdentifier(event.target.value)}
                placeholder="student4@joineazy.test"
                required
              />
              <Button type="submit" variant="secondary" disabled={adding}>
                {adding ? "Adding member..." : "Add member"}
              </Button>
            </form>
          ) : (
            <EmptyState
              title="Only the group creator can manage members"
              description="You can still view the group roster and assignment progress from the student dashboard."
            />
          )}
        </Card>
      </div>
    </div>
  );
}

export default StudentGroupPage;
