import { Link } from "react-router-dom";

import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import ProgressBar from "../ui/ProgressBar";
import { formatDate, formatStatusLabel, toPercentLabel } from "../../utils/format";

function AssignmentCard({
  assignment,
  to = null,
  actionLabel = null,
  onAction = null,
  disabled = false,
  showCourse = false,
  compact = false,
}) {
  const card = (
    <Card className="h-full transition hover:-translate-y-1 hover:shadow-float">
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            {showCourse && assignment.course ? (
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-teal">
                {assignment.course.code}
              </p>
            ) : null}
            <h3 className="mt-2 font-display text-2xl text-brand-ink">
              {assignment.title}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Deadline {formatDate(assignment.deadline || assignment.dueDate)}
            </p>
          </div>
          <Badge>{formatStatusLabel(assignment.status || assignment.submissionStatus)}</Badge>
        </div>

        <p className="text-sm text-slate-600">{assignment.description}</p>

        <div className="grid gap-2 text-sm text-slate-600">
          <p>Submission type: {assignment.submissionType}</p>
          {assignment.group ? (
            <p>Group: {assignment.group.name}</p>
          ) : null}
          {assignment.group?.leader ? (
            <p>Leader: {assignment.group.leader.name}</p>
          ) : null}
          {assignment.submission ? (
            <p>Progress: {formatStatusLabel(assignment.submission.status)}</p>
          ) : null}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
            <span>Progress</span>
            <span>{toPercentLabel(assignment.progress)}</span>
          </div>
          <ProgressBar value={assignment.progress || assignment.completionPercentage || 0} />
        </div>

        {!compact && assignment.group ? (
          <div className="rounded-3xl border border-brand-line bg-white/80 p-4 text-sm text-slate-600">
            <p className="font-semibold text-brand-ink">Group members</p>
            <div className="mt-3 space-y-2">
              {assignment.group.members?.map((member) => (
                <div key={member.id} className="rounded-2xl bg-white/80 px-3 py-2">
                  <p className="font-medium text-brand-ink">{member.student.name}</p>
                  <p className="text-xs text-slate-500">{member.student.email}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {actionLabel ? (
          onAction ? (
            <Button variant="secondary" onClick={onAction} disabled={disabled}>
              {actionLabel}
            </Button>
          ) : (
            <Button variant="secondary" disabled={disabled}>
              {actionLabel}
            </Button>
          )
        ) : null}
      </div>
    </Card>
  );

  if (!to) {
    return card;
  }

  return (
    <Link to={to} className="block h-full">
      {card}
    </Link>
  );
}

export default AssignmentCard;
