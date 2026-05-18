import { useMemo, useState } from 'react';
import { CalendarCheck, Check, RotateCcw, Save, Users, X } from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';
import Select from '../../components/common/Select';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  setDocumentWithId,
} from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import {
  BRANCHES,
  DIVISIONS,
  SEMESTERS,
  STUDENT_ROLES,
} from '../../utils/constants';
import {
  calculateLecturesNeeded,
  getAttendanceStatus,
  summarizeAttendanceRecords,
} from '../../utils/attendanceUtils';
import { formatDate, toDateInputValue } from '../../utils/dateUtils';
import { canTakeAttendance, normalizeRole } from '../../utils/authUtils';

const STATUS_META = {
  present: { label: 'Present', tone: 'emerald', className: 'border-emerald-300/30 bg-emerald-400/15 text-emerald-100' },
  absent: { label: 'Absent', tone: 'rose', className: 'border-rose-300/30 bg-rose-400/15 text-rose-100' },
  late: { label: 'Late', tone: 'amber', className: 'border-amber-300/30 bg-amber-400/15 text-amber-100' },
  excused: { label: 'Excused', tone: 'cyan', className: 'border-cyan-300/30 bg-cyan-400/15 text-cyan-100' },
};

function cleanId(value) {
  return String(value || 'item').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function getSubjectLabel(subject) {
  if (!subject) return 'Subject';
  return `${subject.code || subject.subjectCode || ''}${subject.code || subject.subjectCode ? ' - ' : ''}${subject.name || subject.subjectName || 'Subject'}`;
}

function sameClass(item = {}, form = {}) {
  return (
    item.branch === form.branch &&
    String(item.semester || '') === String(form.semester || '') &&
    (item.division || 'A') === (form.division || 'A')
  );
}

function hasClassAccess(role, profile = {}, form = {}, subject = {}) {
  const normalized = normalizeRole(role);
  if (normalized === 'admin') return true;

  if (normalized === 'cr') {
    return (
      profile.branch === form.branch &&
      String(profile.semester || '') === String(form.semester || '') &&
      profile.division === form.division
    );
  }

  if (normalized === 'coordinator') {
    return !profile.branch || profile.branch === form.branch || profile.department === subject.department;
  }

  if (normalized === 'teacher') {
    const assigned = profile.assignedSubjects || [];
    return (
      subject.teacherId === profile.uid ||
      subject.teacherId === profile.id ||
      assigned.includes(subject.id) ||
      assigned.includes(subject.subjectId)
    );
  }

  return false;
}

function StudentAttendanceView({ profile, summaries, records }) {
  const mySummaries = summaries
    .filter((item) => item.studentId === profile?.uid)
    .sort((a, b) => (a.subjectName || '').localeCompare(b.subjectName || ''));
  const myRecords = records
    .filter((item) => item.studentId === profile?.uid)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const totals = mySummaries.reduce(
    (acc, item) => {
      acc.present += Number(item.presentCount || 0) + Number(item.lateCount || 0);
      acc.total += Number(item.totalLectures || 0);
      return acc;
    },
    { present: 0, total: 0 },
  );
  const overall = totals.total ? Math.round((totals.present / totals.total) * 100) : 0;
  const status = getAttendanceStatus(overall);

  return (
    <main className="page-shell space-y-6">
      <PageHeader
        eyebrow="Official attendance"
        title="Your Attendance"
        description="Students can view official attendance recorded by teachers, coordinators, admins, or the class representative. Self-marking is not used for official records."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <Card tone="highlight" className="lg:col-span-2">
          <p className="text-sm font-semibold text-slate-400">Overall attendance</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="text-5xl font-black text-white">{overall}%</p>
            <Badge tone={status.label === 'Safe' ? 'emerald' : status.label === 'Warning' ? 'amber' : 'rose'}>
              {status.label}
            </Badge>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className={`h-full rounded-full ${status.bar}`} style={{ width: `${Math.min(overall, 100)}%` }} />
          </div>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-400">Roll number</p>
          <p className="mt-3 text-3xl font-black text-white">{profile?.rollNumber || 'Not set'}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-400">Subjects tracked</p>
          <p className="mt-3 text-3xl font-black text-white">{mySummaries.length}</p>
        </Card>
      </div>

      {mySummaries.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {mySummaries.map((item) => {
            const meta = getAttendanceStatus(Number(item.percentage || 0));
            const attended = Number(item.presentCount || 0) + Number(item.lateCount || 0);
            const needed = calculateLecturesNeeded(attended, Number(item.totalLectures || 0));
            return (
              <Card key={item.id || `${item.studentId}-${item.subjectId}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-white">{item.subjectName}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {attended} attended of {item.totalLectures || 0} lectures
                    </p>
                  </div>
                  <Badge tone={meta.label === 'Safe' ? 'emerald' : meta.label === 'Warning' ? 'amber' : 'rose'}>
                    {meta.label}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <p className="text-3xl font-black text-white">{item.percentage || 0}%</p>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${Math.min(Number(item.percentage || 0), 100)}%` }} />
                  </div>
                </div>
                {Number(item.percentage || 0) < 75 ? (
                  <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                    Attend the next {needed} lecture{needed === 1 ? '' : 's'} to reach 75%.
                  </p>
                ) : null}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No official attendance yet"
          message="Once your teacher, coordinator, admin, or CR saves attendance for your class, your subject-wise percentage will appear here."
          icon={CalendarCheck}
        />
      )}

      <Card>
        <h3 className="text-lg font-black text-white">Date-wise history</h3>
        <div className="mt-4 overflow-x-auto">
          {myRecords.length ? (
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Subject</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Marked by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {myRecords.map((record) => (
                  <tr key={record.id} className="text-slate-300">
                    <td className="px-3 py-4">{formatDate(record.date)}</td>
                    <td className="px-3 py-4 font-semibold text-white">{record.subjectName}</td>
                    <td className="px-3 py-4">
                      <Badge tone={STATUS_META[record.status]?.tone || 'slate'}>
                        {STATUS_META[record.status]?.label || record.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-4">{record.markedByName || record.markedByRole || 'CampusMate'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">
              No date-wise records have been saved yet.
            </p>
          )}
        </div>
      </Card>
    </main>
  );
}

export default function AttendanceSheet() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const role = normalizeRole(profile?.role);
  const authorized = canTakeAttendance(role);
  const { data: users, loading: usersLoading } = useCollection('users');
  const { data: subjects } = useCollection('subjects');
  const { data: records } = useCollection('attendanceRecords');
  const { data: summaries } = useCollection('attendanceSummary');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    branch: profile?.branch || 'Computer Engineering & IoT',
    semester: String(profile?.semester || '2'),
    division: profile?.division || 'A',
    subjectId: '',
    date: toDateInputValue(),
    period: 'Lecture 1',
  });
  const [statuses, setStatuses] = useState({});

  const classSubjects = useMemo(() => {
    return subjects
      .filter((subject) => {
        if (!sameClass(subject, form)) return false;
        if (role === 'teacher') return hasClassAccess(role, profile, form, subject);
        if (role === 'cr') return hasClassAccess(role, profile, form, subject);
        if (role === 'coordinator') return hasClassAccess(role, profile, form, subject);
        return role === 'admin';
      })
      .sort((a, b) => getSubjectLabel(a).localeCompare(getSubjectLabel(b)));
  }, [form, profile, role, subjects]);

  const selectedSubject = classSubjects.find((subject) => subject.id === form.subjectId) || classSubjects[0];
  const students = useMemo(() => {
    return users
      .filter((user) => {
        const userRole = normalizeRole(user.role);
        return (
          STUDENT_ROLES.includes(userRole) &&
          user.status !== 'disabled' &&
          user.branch === form.branch &&
          String(user.semester || '') === String(form.semester || '') &&
          user.division === form.division
        );
      })
      .sort((a, b) =>
        String(a.rollNumber || '999999').localeCompare(String(b.rollNumber || '999999')) ||
        String(a.name || '').localeCompare(String(b.name || '')),
      );
  }, [form.branch, form.division, form.semester, users]);

  const selectedStatuses = useMemo(() => {
    const map = {};
    students.forEach((student) => {
      map[student.uid || student.id] = statuses[student.uid || student.id] || '';
    });
    return map;
  }, [statuses, students]);

  if (!authorized) {
    return <StudentAttendanceView profile={profile} summaries={summaries} records={records} />;
  }

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (name !== 'period') setStatuses({});
  };

  const markAll = (status) => {
    const next = {};
    students.forEach((student) => {
      next[student.uid || student.id] = status;
    });
    setStatuses(next);
  };

  const markStudent = (studentId, status) => {
    setStatuses((current) => ({ ...current, [studentId]: status }));
  };

  const saveAttendance = async () => {
    const subject = selectedSubject;
    if (!subject) {
      notify('Select a subject before saving attendance.', 'error');
      return;
    }
    if (!students.length) {
      notify('No students found for this branch, semester, and division.', 'error');
      return;
    }
    if (!hasClassAccess(role, profile, form, subject)) {
      notify('You do not have permission to take attendance for this class.', 'error');
      return;
    }
    const unmarked = students.filter((student) => !selectedStatuses[student.uid || student.id]);
    if (unmarked.length) {
      const shouldContinue = window.confirm(
        `${unmarked.length} student${unmarked.length === 1 ? '' : 's'} are unmarked. Save them as absent?`,
      );
      if (!shouldContinue) return;
    }

    try {
      setSaving(true);
      const subjectName = getSubjectLabel(subject);
      const sessionId = cleanId(
        `${form.date}_${form.period}_${subject.id}_${form.branch}_${form.semester}_${form.division}`,
      );
      await setDocumentWithId('attendanceSessions', sessionId, {
        sessionId,
        subjectId: subject.id,
        subjectName,
        branch: form.branch,
        semester: form.semester,
        division: form.division,
        date: form.date,
        period: form.period,
        takenBy: profile?.uid || profile?.id,
        takenByName: profile?.name || 'CampusMate User',
        takenByRole: role,
        status: 'submitted',
        createdAt: serverTimestamp(),
      });

      const newRecords = students.map((student) => {
        const studentId = student.uid || student.id;
        const status = selectedStatuses[studentId] || 'absent';
        return {
          recordId: `${sessionId}_${studentId}`,
          sessionId,
          studentId,
          studentName: student.name || 'Student',
          studentEmail: student.email || '',
          rollNumber: student.rollNumber || '',
          subjectId: subject.id,
          subjectName,
          branch: form.branch,
          semester: form.semester,
          division: form.division,
          date: form.date,
          status,
          markedBy: profile?.uid || profile?.id,
          markedByName: profile?.name || 'CampusMate User',
          markedByRole: role,
          markedAt: serverTimestamp(),
        };
      });

      await Promise.all(
        newRecords.map((record) =>
          setDocumentWithId('attendanceRecords', record.recordId, record),
        ),
      );

      await Promise.all(
        students.map((student) => {
          const studentId = student.uid || student.id;
          const merged = [
            ...records.filter(
              (record) =>
                record.studentId === studentId &&
                record.subjectId === subject.id &&
                record.sessionId !== sessionId,
            ),
            ...newRecords.filter((record) => record.studentId === studentId),
          ];
          const summary = summarizeAttendanceRecords(merged);
          return setDocumentWithId('attendanceSummary', `${studentId}_${subject.id}`, {
            summaryId: `${studentId}_${subject.id}`,
            studentId,
            studentName: student.name || 'Student',
            rollNumber: student.rollNumber || '',
            subjectId: subject.id,
            subjectName,
            branch: form.branch,
            semester: form.semester,
            division: form.division,
            ...summary,
          });
        }),
      );

      notify('Attendance saved successfully.', 'success');
    } catch (error) {
      notify(error.message || 'Failed to save attendance.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const markedCount = Object.values(selectedStatuses).filter(Boolean).length;
  const presentCount = Object.values(selectedStatuses).filter((status) => status === 'present').length;
  const absentCount = Object.values(selectedStatuses).filter((status) => status === 'absent').length;

  return (
    <main className="page-shell space-y-6">
      <PageHeader
        eyebrow="Official attendance"
        title="Attendance Sheet"
        description="Select a class and subject, mark students present or absent, then save official attendance. Students can view these records but cannot edit them."
      />

      <Card>
        <div className="grid gap-4 lg:grid-cols-6">
          <Select label="Branch" name="branch" value={form.branch} onChange={updateForm}>
            {BRANCHES.map((branch) => <option key={branch}>{branch}</option>)}
          </Select>
          <Select label="Semester" name="semester" value={form.semester} onChange={updateForm}>
            {SEMESTERS.map((semester) => <option key={semester}>{semester}</option>)}
          </Select>
          <Select label="Division" name="division" value={form.division} onChange={updateForm}>
            {DIVISIONS.map((division) => <option key={division}>{division}</option>)}
          </Select>
          <Select
            label="Subject"
            name="subjectId"
            value={selectedSubject?.id || ''}
            onChange={updateForm}
            className="lg:col-span-2"
          >
            {classSubjects.length ? (
              classSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {getSubjectLabel(subject)}
                </option>
              ))
            ) : (
              <option value="">No assigned subject</option>
            )}
          </Select>
          <Input label="Date" name="date" type="date" value={form.date} onChange={updateForm} />
          <Input label="Lecture / Period" name="period" value={form.period} onChange={updateForm} placeholder="Lecture 1" />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-semibold text-slate-400">Students</p>
          <p className="mt-2 text-3xl font-black text-white">{students.length}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-400">Marked</p>
          <p className="mt-2 text-3xl font-black text-white">{markedCount}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-400">Present / Absent</p>
          <p className="mt-2 text-3xl font-black text-white">{presentCount} / {absentCount}</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-white">Class attendance sheet</h3>
            <p className="mt-1 text-sm text-slate-400">
              Roll numbers are sorted ascending for fast classroom marking.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="success" size="sm" onClick={() => markAll('present')} disabled={!students.length}>
              <Check className="h-4 w-4" />
              Mark All Present
            </Button>
            <Button type="button" variant="danger" size="sm" onClick={() => markAll('absent')} disabled={!students.length}>
              <X className="h-4 w-4" />
              Mark All Absent
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setStatuses({})}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button type="button" size="sm" onClick={saveAttendance} disabled={saving || !students.length || !selectedSubject}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </div>

        <div className="mt-5 hidden overflow-x-auto lg:block">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-3 py-3">Roll No.</th>
                <th className="px-3 py-3">Student Name</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {students.map((student) => {
                const studentId = student.uid || student.id;
                const status = selectedStatuses[studentId];
                return (
                  <tr key={studentId} className="text-slate-300">
                    <td className="px-3 py-4 font-black text-white">{student.rollNumber || '------'}</td>
                    <td className="px-3 py-4 font-semibold text-white">{student.name}</td>
                    <td className="px-3 py-4">{student.email || 'No email'}</td>
                    <td className="px-3 py-4">
                      {status ? (
                        <Badge tone={STATUS_META[status]?.tone}>{STATUS_META[status]?.label}</Badge>
                      ) : (
                        <Badge tone="slate">Unmarked</Badge>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        {['present', 'absent', 'late', 'excused'].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => markStudent(studentId, value)}
                            className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                              status === value
                                ? STATUS_META[value].className
                                : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            {STATUS_META[value].label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-3 lg:hidden">
          {students.map((student) => {
            const studentId = student.uid || student.id;
            const status = selectedStatuses[studentId];
            return (
              <div key={studentId} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                      Roll {student.rollNumber || '------'}
                    </p>
                    <h4 className="mt-1 text-base font-black text-white">{student.name}</h4>
                    <p className="mt-1 text-xs text-slate-400">{student.email || 'No email'}</p>
                  </div>
                  <Badge tone={status ? STATUS_META[status]?.tone : 'slate'}>
                    {status ? STATUS_META[status]?.label : 'Unmarked'}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {['present', 'absent', 'late', 'excused'].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => markStudent(studentId, value)}
                      className={`rounded-xl border px-3 py-3 text-xs font-black transition ${
                        status === value
                          ? STATUS_META[value].className
                          : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {STATUS_META[value].label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {!usersLoading && !students.length ? (
          <div className="mt-5">
            <EmptyState
              title="No students found"
              message="Check the branch, semester, and division. Students and CRs with matching class details will appear here."
              icon={Users}
            />
          </div>
        ) : null}
      </Card>
    </main>
  );
}
