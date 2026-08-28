import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import PageHeader from "../../components/shared/PageHeader";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAuth } from "../../hooks/useAuth";
import { useAsyncData } from "../../hooks/useAsyncData";
import { courseService } from "../../services/courseService";
import { groupService } from "../../services/groupService";
import { formatDate, getErrorMessage } from "../../utils/format";

function StudentGroupPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsyncData(
    async () => {
      const [groups, courses] = await Promise.all([
        groupService.getGroups(),
        courseService.getCourses(),
      ]);

      return { groups, courses };
    },
    [],
    { groups: [], courses: [] },
  );

  const [groupName, setGroupName] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [memberIdentifier, setMemberIdentifier] = useState("");
  const [activeGroupId, setActiveGroupId] = useState("");
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);

  const groups = data?.groups || [];
  const courses = data?.courses || [];
  const activeGroup =
    groups.find((group) => group.id === activeGroupId) || groups[0] || null;
  const isOwner = activeGroup?.leaderId === user.id;

  useEffect(() => {
    if (!activeGroupId && groups.length) {
      setActiveGroupId(groups[0].id);
    }
  }, [activeGroupId, groups]);

  useEffect(() => {
    if (!selectedCourseId && courses.length) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  const handleCreateGroup = async (event) => {
    event.preventDefault();

    if (!selectedCourseId) {
      toast.error("Please choose a course first.");
      return;
    }

    setCreating(true);

    try {
      await groupService.createGroup({ name: groupName, courseId: selectedCourseId });
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

    if (!activeGroup) {
      return;
    }

    setAdding(true);

    try {
      await groupService.addMember(activeGroup.id, { identifier: memberIdentifier });
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
    if (!activeGroup) {
      return;
    }

    try {
      await groupService.removeMember(activeGroup.id, studentId);
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Group workspace"
        title="Course groups"
        description="Create one group per course, then manage members and track submission progress from here."
      />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">Create group</p>
            <h3 className="mt-2 font-display text-3xl text-brand-ink">Add a new team</h3>
            <p className="mt-2 text-slate-600">
              Pick the course first. One student can lead a group per course.
            </p>
          </div>

          {courses.length ? (
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-brand-ink">Course</span>
                <select
                  value={selectedCourseId}
                  onChange={(event) => setSelectedCourseId(event.target.value)}
                  className="min-h-12 w-full rounded-2xl border border-brand-line bg-white/80 px-4 text-brand-ink outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20">
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </label>

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
          ) : (
            <EmptyState
              title="No enrolled courses"
              description="You need at least one course enrollment before you can create a group."
            />
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">Your groups</p>
              <h3 className="mt-2 font-display text-3xl text-brand-ink">
                {groups.length} active groups
              </h3>
            </div>
            <Badge>{groups.length} groups</Badge>
          </div>

          {groups.length ? (
            <div className="space-y-3">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveGroupId(group.id)}
                  className={[
                    "w-full rounded-3xl border px-4 py-4 text-left transition",
                    activeGroup?.id === group.id
                      ? "border-brand-teal bg-brand-mint/60 shadow-sm"
                      : "border-brand-line bg-white/80 hover:border-brand-teal/40",
                  ].join(" ")}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-teal">
                        {group.course?.code || "Course"}
                      </p>
                      <h4 className="mt-1 font-semibold text-brand-ink">{group.name}</h4>
                      <p className="mt-1 text-sm text-slate-600">
                        Leader: {group.leader?.name || "Not set"}
                      </p>
                    </div>
                    <Badge>{group.completionPercentage}%</Badge>
                  </div>
                  <div className="mt-4">
                    <ProgressBar value={group.completionPercentage || 0} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No groups yet"
              description="Create your first course group to start managing members."
            />
          )}
        </Card>
      </div>

      {activeGroup ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">Active group</p>
                <h3 className="mt-2 font-display text-3xl text-brand-ink">{activeGroup.name}</h3>
                <p className="mt-2 text-slate-600">
                  {activeGroup.course?.code || "No course"} • Created {formatDate(activeGroup.createdAt)}
                </p>
              </div>
              <Badge>{activeGroup.progressStatus}</Badge>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-brand-line bg-white/80 p-4">
                <p className="text-sm text-slate-500">Members</p>
                <p className="mt-2 text-2xl font-bold text-brand-ink">{activeGroup.members.length}</p>
              </div>
              <div className="rounded-2xl border border-brand-line bg-white/80 p-4">
                <p className="text-sm text-slate-500">Assignments</p>
                <p className="mt-2 text-2xl font-bold text-brand-ink">{activeGroup.assignmentCount}</p>
              </div>
              <div className="rounded-2xl border border-brand-line bg-white/80 p-4">
                <p className="text-sm text-slate-500">Progress</p>
                <p className="mt-2 text-2xl font-bold text-brand-ink">{activeGroup.completionPercentage}%</p>
              </div>
            </div>

            <div className="mt-5">
              <ProgressBar value={activeGroup.completionPercentage || 0} />
            </div>

            <div className="mt-6 space-y-3">
              {activeGroup.members.map((member) => {
                const canRemove = isOwner && member.id !== activeGroup.leaderId;

                return (
                  <div
                    key={member.id}
                    className="flex flex-col gap-4 rounded-3xl border border-brand-line bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
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
              Only the group leader can add or remove members. Duplicate memberships are blocked
              by the backend.
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
                title="Only the group leader can manage members"
                description="You can still view the roster, assignments, and course progress from here."
              />
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export default StudentGroupPage;
