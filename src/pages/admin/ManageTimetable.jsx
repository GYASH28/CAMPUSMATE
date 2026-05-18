import { useState } from 'react';
import { Edit3, Plus, Search, X } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import DeleteButton from '../../components/common/DeleteButton';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';
import Select from '../../components/common/Select';
import MotionPage from '../../components/animations/MotionPage';
import { useToast } from '../../context/ToastContext';
import { addDocument, deleteDocument, updateDocument } from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import {
  BRANCHES,
  DAYS,
  DIVISIONS,
  SAMPLE_BRANCH,
  SAMPLE_DIVISION,
  SAMPLE_SEMESTER,
  SEMESTERS,
} from '../../utils/constants';

const emptyTimetable = {
  day: 'Monday',
  startTime: '10:00',
  endTime: '11:00',
  subjectId: '',
  subjectName: '',
  teacherId: '',
  teacherName: '',
  room: '',
  branch: SAMPLE_BRANCH,
  semester: SAMPLE_SEMESTER,
  division: SAMPLE_DIVISION,
};

function subjectDisplay(subject) {
  return subject ? `${subject.code} - ${subject.name}` : '';
}

export default function ManageTimetable() {
  const { notify } = useToast();
  const { data: subjects } = useCollection('subjects');
  const { data: timetable } = useCollection('timetable');
  const [form, setForm] = useState(emptyTimetable);
  const [editingId, setEditingId] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [dayFilter, setDayFilter] = useState('All');

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'subjectId') {
      const subject = subjects.find((item) => item.id === value);
      setForm((current) => ({
        ...current,
        subjectId: value,
        subjectName: subjectDisplay(subject),
        teacherId: subject?.teacherId || '',
        teacherName: subject?.teacherName || '',
        branch: subject?.branch || current.branch,
        semester: subject?.semester || current.semester,
        division: subject?.division || current.division,
      }));
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
  };

  const reset = () => {
    setForm(emptyTimetable);
    setEditingId('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.subjectId || !form.room.trim()) {
      notify('Select a subject and enter a room.', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = { ...form, room: form.room.trim() };
      if (editingId) {
        await updateDocument('timetable', editingId, payload);
        notify('Timetable entry updated.', 'success');
      } else {
        await addDocument('timetable', payload);
        notify('Timetable entry added.', 'success');
      }
      reset();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const editEntry = (entry) => {
    setEditingId(entry.id);
    setForm({
      day: entry.day || 'Monday',
      startTime: entry.startTime || '10:00',
      endTime: entry.endTime || '11:00',
      subjectId: entry.subjectId || '',
      subjectName: entry.subjectName || '',
      teacherId: entry.teacherId || '',
      teacherName: entry.teacherName || '',
      room: entry.room || '',
      branch: entry.branch || SAMPLE_BRANCH,
      semester: entry.semester || SAMPLE_SEMESTER,
      division: entry.division || SAMPLE_DIVISION,
    });
  };

  const removeEntry = async (id) => {
    try {
      await deleteDocument('timetable', id);
      notify('Timetable entry deleted.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const visibleEntries = timetable
    .filter((entry) => dayFilter === 'All' || entry.day === dayFilter)
    .filter((entry) =>
      `${entry.day} ${entry.subjectName} ${entry.teacherName} ${entry.room} ${entry.branch} ${entry.semester} ${entry.division}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) => `${a.day}${a.startTime}`.localeCompare(`${b.day}${b.startTime}`));

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Timetable"
        title="Manage Timetable"
        description="Create weekly class entries for each branch, semester, and division."
      />

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h3 className="text-xl font-black text-white">
            {editingId ? 'Edit entry' : 'Add entry'}
          </h3>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="field-label">Subject</span>
              <select
                className="field-input mt-2"
                name="subjectId"
                value={form.subjectId}
                onChange={handleChange}
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Day</span>
              <select
                className="field-input mt-2"
                name="day"
                value={form.day}
                onChange={handleChange}
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Room</span>
              <input
                className="field-input mt-2"
                name="room"
                value={form.room}
                onChange={handleChange}
                placeholder="A-204"
              />
            </label>
            <label>
              <span className="field-label">Start time</span>
              <input
                className="field-input mt-2"
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
              />
            </label>
            <label>
              <span className="field-label">End time</span>
              <input
                className="field-input mt-2"
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
              />
            </label>
            <label>
              <span className="field-label">Branch</span>
              <select
                className="field-input mt-2"
                name="branch"
                value={form.branch}
                onChange={handleChange}
              >
                {BRANCHES.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Semester</span>
              <select
                className="field-input mt-2"
                name="semester"
                value={form.semester}
                onChange={handleChange}
              >
                {SEMESTERS.map((semester) => (
                  <option key={semester} value={semester}>
                    {semester}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Division</span>
              <select
                className="field-input mt-2"
                name="division"
                value={form.division}
                onChange={handleChange}
              >
                {DIVISIONS.map((division) => (
                  <option key={division} value={division}>
                    {division}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Teacher</span>
              <input
                className="field-input mt-2"
                name="teacherName"
                value={form.teacherName}
                onChange={handleChange}
                placeholder="Auto-filled from subject"
              />
            </label>
            <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
              <Button type="submit" className="flex-1" disabled={saving}>
                <Plus className="h-4 w-4" />
                {saving ? 'Saving...' : editingId ? 'Update Entry' : 'Add Entry'}
              </Button>
              {editingId ? (
                <Button type="button" variant="secondary" onClick={reset}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </Card>

        <Card>
          <h3 className="text-xl font-black text-white">Timetable entries</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Input
              label="Search timetable"
              icon={Search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Subject, teacher, room..."
            />
            <Select label="Day filter" value={dayFilter} onChange={(event) => setDayFilter(event.target.value)}>
              <option value="All">All days</option>
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </Select>
          </div>
          {visibleEntries.length ? (
            <div className="table-shell mt-5">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Room</th>
                    <th>Target</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {visibleEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.day}</td>
                        <td className="whitespace-nowrap">
                          {entry.startTime} - {entry.endTime}
                        </td>
                        <td>{entry.subjectName}</td>
                        <td>{entry.teacherName}</td>
                        <td>{entry.room}</td>
                        <td className="whitespace-nowrap">
                          Sem {entry.semester} · Div {entry.division}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => editEntry(entry)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <DeleteButton
                              iconOnly
                              itemName={`${entry.subjectName} on ${entry.day}`}
                              onDelete={() => removeEntry(entry.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No timetable entries"
              message="Add entries manually or seed demo data from the admin dashboard."
            />
          )}
        </Card>
      </div>
    </MotionPage>
  );
}
