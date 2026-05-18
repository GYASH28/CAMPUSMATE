import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import DeleteButton from '../../components/common/DeleteButton';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';
import StatusPill from '../../components/common/StatusPill';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { addDocument, deleteDocument } from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import {
  BRANCHES,
  NOTICE_CATEGORIES,
  SAMPLE_BRANCH,
  SAMPLE_SEMESTER,
  SEMESTERS,
} from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';

const emptyNotice = {
  title: '',
  message: '',
  category: 'General',
  targetBranch: SAMPLE_BRANCH,
  targetSemester: SAMPLE_SEMESTER,
};

export default function ManageNotices() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { data: notices } = useCollection('notices');
  const [form, setForm] = useState(emptyNotice);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      notify('Notice title and message are required.', 'error');
      return;
    }

    try {
      setSaving(true);
      await addDocument('notices', {
        ...form,
        title: form.title.trim(),
        message: form.message.trim(),
        createdBy: user?.uid || 'admin',
      });
      notify('Notice posted.', 'success');
      setForm(emptyNotice);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeNotice = async (id) => {
    try {
      await deleteDocument('notices', id);
      notify('Notice deleted.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const visibleNotices = notices
    .filter((notice) => categoryFilter === 'All' || notice.category === categoryFilter)
    .filter((notice) =>
      `${notice.title} ${notice.message} ${notice.category} ${notice.targetBranch} ${notice.targetSemester}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Notices"
        title="Manage Notices"
        description="Post notices by category and target them by branch and semester."
      />

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h3 className="text-xl font-black text-white">Post notice</h3>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
            <label>
              <span className="field-label">Title</span>
              <input
                className="field-input mt-2"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Exam form update"
              />
            </label>
            <label>
              <span className="field-label">Message</span>
              <textarea
                className="field-input mt-2 min-h-28 resize-y"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Write the notice message"
              />
            </label>
            <label>
              <span className="field-label">Category</span>
              <select
                className="field-input mt-2"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {NOTICE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Target branch</span>
              <select
                className="field-input mt-2"
                name="targetBranch"
                value={form.targetBranch}
                onChange={handleChange}
              >
                <option value="All">All</option>
                {BRANCHES.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Target semester</span>
              <select
                className="field-input mt-2"
                name="targetSemester"
                value={form.targetSemester}
                onChange={handleChange}
              >
                <option value="All">All</option>
                {SEMESTERS.map((semester) => (
                  <option key={semester} value={semester}>
                    {semester}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" disabled={saving}>
              <Plus className="h-4 w-4" />
              {saving ? 'Posting...' : 'Post Notice'}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-black text-white">Posted notices</h3>
            <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
              <Input
                label="Search"
                icon={Search}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notices"
              />
              <label>
                <span className="field-label">Category</span>
                <select
                  className="field-input mt-2"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <option value="All">All</option>
                  {NOTICE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          {visibleNotices.length ? (
            <div className="mt-5 grid gap-3">
              {visibleNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill>{notice.category}</StatusPill>
                        <p className="text-xs text-slate-500">
                          {formatDate(notice.createdAt)}
                        </p>
                      </div>
                      <p className="mt-3 font-black text-white">{notice.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {notice.message}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Target: {notice.targetBranch} · Semester {notice.targetSemester}
                      </p>
                    </div>
                    <DeleteButton
                      iconOnly
                      itemName={notice.title}
                      onDelete={() => removeNotice(notice.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No notices" message="Post notices for students." />
          )}
        </Card>
      </div>
    </MotionPage>
  );
}
