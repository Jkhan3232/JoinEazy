import { Link } from "react-router-dom";

import Badge from "../ui/Badge";
import Card from "../ui/Card";
import ProgressBar from "../ui/ProgressBar";
import { toPercentLabel } from "../../utils/format";

function CourseCard({ course, to, footer = null, compact = false }) {
  const content = (
    <Card className="h-full transition hover:-translate-y-1 hover:shadow-float">
      <div className="flex h-full flex-col">
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

        <p className="mt-3 text-sm text-slate-600">{course.description}</p>

        <div className="mt-4 grid gap-2 text-sm text-slate-600">
          <p>Professor: {course.professor?.name || "Not assigned"}</p>
          <p>
            {compact
              ? `${course.assignmentCount || 0} assignments`
              : `${course.studentCount || 0} students • ${course.assignmentCount || 0} assignments`}
          </p>
          {course.group ? (
            <p>
              Group: {course.group.name} • Leader: {course.group.leader?.name || "Not set"}
            </p>
          ) : null}
        </div>

        <div className="mt-5">
          <ProgressBar value={course.completionPercentage || 0} />
        </div>
        <p className="mt-3 text-sm font-semibold text-brand-teal">
          {course.completionPercentage || 0}% complete
        </p>

        {footer ? <div className="mt-5">{footer}</div> : null}
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
