import { ImagePlus, Plus, Wrench } from 'lucide-react';
import { useState } from 'react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { addDocument } from '../../firebase/firestore';
import { createNotification } from '../../firebase/notifications';
import { uploadFile } from '../../firebase/storage';
import useCollection from '../../hooks/useCollection';
import { COMPLAINT_CATEGORIES, PRIORITIES } from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';
import { statusTone } from '../../utils/roleUtils';
import { normalizeRole } from '../../utils/authUtils';

export default function Complaints() {
  const { user, profile } = useAuth();
  const { notify } = useToast();
  const { data: complaints } = useCollection('complaints');
  const { data: users } = useCollection('users');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: 'Classroom',
    title: '',
    description: '',
    location: '',
    priority: 'Medium',
  });

  const myComplaints = complaints
    .filter((complaint) => complaint.studentId === user?.uid)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submitComplaint = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      notify('Title, description, and location are required.', 'error');
      return;
    }
    try {
      setSaving(true);
      const upload = file ? await uploadFile(file, 'complaints') : {};
      await addDocument('complaints', {
        studentId: user.uid,
        studentName: profile?.name || 'Student',
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location.trim(),
        priority: form.priority,
        imageUrl: upload.fileUrl || '',
        imageName: upload.fileName || '',
        imagePath: upload.filePath || '',
        status: 'Pending',
        assignedTo: '',
        resolutionNote: '',
      });
      await Promise.all(
        users
          .filter((item) => ['admin', 'coordinator'].includes(normalizeRole(item.role)))
          .map((admin) =>
            createNotification({
              userId: admin.uid,
              title: 'New complaint raised',
              message: `${profile?.name || 'A student'} submitted ${form.title}.`,
              type: 'complaint',
              actionUrl: '/admin/complaints',
            }),
          ),
      );
      setForm({ category: 'Classroom', title: '', description: '', location: '', priority: 'Medium' });
      setFile(null);
      notify('Complaint submitted.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Campus Complaints"
        title="Raise and track issues"
        description="Submit classroom, lab, internet, library, cleanliness, electrical, and other campus issues."
      />

      <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <Card>
          <h3 className="text-xl font-black text-white">Submit complaint</h3>
          <form onSubmit={submitComplaint} className="mt-5 grid gap-4">
            <Select label="Category" name="category" value={form.category} onChange={handleChange}>
              {COMPLAINT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </Select>
            <Input label="Title" name="title" value={form.title} onChange={handleChange} placeholder="Lab projector not working" />
            <Input label="Location" name="location" value={form.location} onChange={handleChange} placeholder="Lab 2, B block" />
            <Select label="Priority" name="priority" value={form.priority} onChange={handleChange}>
              {PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
            </Select>
            <Textarea label="Description" name="description" value={form.description} onChange={handleChange} />
            <label>
              <span className="field-label">Optional image</span>
              <input
                className="field-input mt-2 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-300/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-cyan-100"
                type="file"
                accept="image/*"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>
            <Button type="submit" disabled={saving}>
              <Plus className="h-4 w-4" />
              {saving ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </form>
        </Card>

        <Card>
          <h3 className="text-xl font-black text-white">Your complaint tracker</h3>
          {myComplaints.length ? (
            <div className="mt-5 grid gap-3">
              {myComplaints.map((complaint) => (
                <div key={complaint.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone(complaint.status)}>{complaint.status}</Badge>
                    <Badge tone={statusTone(complaint.priority)}>{complaint.priority}</Badge>
                    <Badge tone="cyan">{complaint.category}</Badge>
                  </div>
                  <p className="mt-3 font-black text-white">{complaint.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{complaint.location} - {formatDate(complaint.createdAt)}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{complaint.description}</p>
                  {complaint.resolutionNote ? (
                    <p className="mt-3 rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">
                      Resolution: {complaint.resolutionNote}
                    </p>
                  ) : null}
                  {complaint.imageUrl ? (
                    <a href={complaint.imageUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-cyan-100">
                      <ImagePlus className="h-4 w-4" />
                      View image
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Wrench} title="No complaints submitted" message="Submitted complaints and admin timeline updates will appear here." />
          )}
        </Card>
      </div>
    </MotionPage>
  );
}
