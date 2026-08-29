import { Link } from "react-router-dom";

import Badge from "../ui/Badge";
import Card from "../ui/Card";
import ProgressBar from "../ui/ProgressBar";
import { toPercentLabel } from "../../utils/format";

function CourseCard({ course, to, footer = null, compact = false }) {
  const hasSubmissionsInfo =
    course.submittedSubmissions !== undefined ||
    course.pendingSubmissions !== undefined ||
    course.acknowledgedSubmissions !== undefined;

  const content = (
    <Card className="h-full transition hover:-translate-y-1 hover:shadow-float flex flex-col justify-between">
      <div className="flex h-full flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-teal">
                {course.code}
              </p>
              <h3 className="mt-2 font-display text-2xl text-brand-ink">
                {course.name}
              </h3>
            </div>
            <Badge>{toPercentLabel(course.completionPercentage)}</Badge>
          </div>

          <p className="mt-3 text-sm text-slate-600 line-clamp-2">{course.description}</p>

          <div className="mt-4 grid gap-2 text-sm text-slate-600">
            {course.professor?.name && (
              <p>Professor: {course.professor.name}</p>
            )}
            <p>
              {compact
                ? `${course.studentCount ?? 0} students • ${course.assignmentCount ?? course.totalAssignments ?? 0} assignments`
                : `${course.studentCount ?? 0} students enrolled • ${course.assignmentCount ?? course.totalAssignments ?? 0} assignments`}
            </p>
            {hasSubmissionsInfo && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 font-medium">
                  Confirmed: {course.acknowledgedSubmissions ?? course.confirmedSubmissions ?? 0}
                </span>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-blue-700 font-medium">
                  Submitted: {course.submittedSubmissions ?? 0}
                </span>
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-amber-700 font-medium">
                  Pending: {course.pendingSubmissions ?? 0}
                </span>
              </div>
            )}
            {course.group ? (
              <p className="text-xs text-slate-500 mt-1">
                Group: {course.group.name} • Leader: {course.group.leader?.name || "Not set"}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <ProgressBar value={course.completionPercentage || 0} />
          <div className="mt-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-brand-teal">
              {course.completionPercentage || 0}% complete
            </span>
            {course.completedAssignments !== undefined && (
              <span className="text-slate-500 font-normal">
                {course.completedAssignments} of {course.assignmentCount || course.totalAssignments || 0} completed
              </span>
            )}
          </div>
        </div>

        {footer ? <div className="mt-5 border-t border-brand-line/60 pt-4">{footer}</div> : null}
      </div>
    </Card>
  );

  if (!to) {
    return content;
  }

  return (
    <Link to={to} className="block h-full">
      {content}
    </Link>
  );
}

export default CourseCard;
