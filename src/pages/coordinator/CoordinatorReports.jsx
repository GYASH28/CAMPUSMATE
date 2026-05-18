import { Download } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import useCollection from '../../hooks/useCollection';

export default function CoordinatorReports() {
  const { profile } = useAuth();
  const { data: summaries } = useCollection('attendanceSummary');
  const scopedSummaries = summaries.filter(
    (item) =>
      item.branch === profile?.branch &&
      String(item.semester || '') === String(profile?.semester || '') &&
      item.division === profile?.division,
  );
  const low = scopedSummaries.filter((item) => Number(item.percentage || 0) < 75);

  const exportCsv = () => {
    const rows = [
      ['Roll No', 'Student', 'Subject', 'Present', 'Absent', 'Late', 'Total', 'Percentage', 'Status'],
      ...scopedSummaries.map((item) => [
        item.rollNumber,
        item.studentName,
        item.subjectName,
        item.presentCount || 0,
        item.absentCount || 0,
        item.lateCount || 0,
        item.totalLectures || 0,
        `${item.percentage || 0}%`,
        item.status,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'campusmate-attendance-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="page-shell space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Class Reports"
        description="Export real attendance summary data for your assigned class."
        actions={
          <Button type="button" onClick={exportCsv} disabled={!scopedSummaries.length}>
            <Download className="h-4 w-4" />
            Export Attendance CSV
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-semibold text-slate-400">Summary rows</p>
          <p className="mt-2 text-3xl font-black text-white">{scopedSummaries.length}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-400">Below 75%</p>
          <p className="mt-2 text-3xl font-black text-white">{low.length}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-400">Class</p>
          <p className="mt-2 text-lg font-black text-white">
            {profile?.branch} · Sem {profile?.semester} · {profile?.division}
          </p>
        </Card>
      </div>
    </main>
  );
}
