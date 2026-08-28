import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import EmptyState from "../../components/shared/EmptyState";
import Loader from "../../components/shared/Loader";
import PageHeader from "../../components/shared/PageHeader";
import Card from "../../components/ui/Card";
import { useAsyncData } from "../../hooks/useAsyncData";
import { dashboardService } from "../../services/dashboardService";

const chartColors = ["#0f766e", "#c85f2c", "#14324a", "#6b7280"];

function AdminAnalyticsPage() {
  const { data, loading, error } = useAsyncData(
    () => dashboardService.getAdminAnalytics(),
    [],
    null,
  );

  if (loading) {
    return <Loader label="Loading analytics..." />;
  }

  if (error) {
    return <EmptyState title="Unable to load analytics" description={error} />;
  }

  const statusData = data.statusDistribution || [];
  const courseData = data.courseWiseCompletion || [];
  const assignmentData = data.assignmentWiseCompletion || [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Professor analytics"
        title="Submission analytics"
        description="Simple charts for submission status, course-wise completion, and assignment-wise progress."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">
            Submission status distribution
          </p>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}>
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">
            Course-wise completion
          </p>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="courseName" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completionPercentage" fill="#0f766e" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">
          Assignment-wise completion
        </p>
        <div className="mt-6 h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={assignmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="title"
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completionPercentage" fill="#c85f2c" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">
          Student performance
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {data.studentPerformance.map((student) => (
            <div
              key={student.studentId}
              className="rounded-3xl border border-brand-line bg-white/80 p-4">
              <p className="font-semibold text-brand-ink">{student.name}</p>
              <p className="mt-1 text-sm text-slate-500">{student.email}</p>
              <p className="mt-3 text-sm text-slate-600">
                Courses: {student.courses?.length || 0}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Groups: {student.groups?.length || 0}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Personally acknowledged: {student.confirmedByStudent}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Group acknowledged: {student.groupConfirmedAssignments}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default AdminAnalyticsPage;
