import { Download, Search, Wrench } from 'lucide-react';
import { useState } from 'react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import DeleteButton from '../../components/common/DeleteButton';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { deleteDocument, updateDocument } from '../../firebase/firestore';
import { createNotification } from '../../firebase/notifications';
import { deleteUploadedFile } from '../../firebase/storage';
import useCollection from '../../hooks/useCollection';
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES, PRIORITIES } from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';
import { exportCampusReport } from '../../utils/reportUtils';
import { statusTone } from '../../utils/roleUtils';
import { getRoleLabel, normalizeRole } from '../../utils/authUtils';

export default function ManageComplaints() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { data: complaints } = useCollection('complaints');
  const { data: users } = useCollection('users');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');

  const assignees = users.filter((item) => ['teacher', 'coordinator', 'admin'].includes(normalizeRole(item.role)));
  const visibleComplaints = complaints
    .filter((item) => category === 'All' || item.category === category)
    .filter((item) => status === 'All' || item.status === status)
    .filter((item) => priority === 'All' || item.priority === priority)
    .filter((item) =>
      `${item.title} ${item.studentName} ${item.location} ${item.description}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const updateComplaint = async (complaint, updates) => {
    try {
      await updateDocument('complaints', complaint.id, updates);
      if (updates.status || updates.resolutionNote) {
        await createNotification({
          userId: complaint.studentId,
          title: 'Complaint updated',
          message: `${complaint.title} is now ${updates.status || complaint.status}.`,
          type: 'complaint',
          actionUrl: '/student/complaints',
        });
      }
      notify('Complaint updated.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const removeComplaint = async (complaint) => {
    try {
      await deleteUploadedFile(complaint.imagePath);
      await deleteDocument('complaints', complaint.id);
      notify('Complaint archived.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const exportReport = () => {
    exportCampusReport({
      title: 'Complaint Summary Report',
      generatedBy: 'Admin',
      summary: [
        { label: 'Total complaints', value: complaints.length },
        { label: 'Open complaints', value: complaints.filter((item) => !['Resolved', 'Rejected'].includes(item.status)).length },
      ],
      columns: [
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category' },
        { key: 'priority', label: 'Priority' },
        { key: 'status', label: 'Status' },
      ],
      rows: complaints,
      fileName: 'campusmate-complaints-report.pdf',
    });
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Complaint Tracker"
        title="Manage campus complaints"
        description="Filter complaints, assign owners, update status, and add resolution notes."
        actions={
          <Button type="button" variant="secondary" onClick={exportReport}>
            <Download className="h-4 w-4" />
            Export Summary
          </Button>
        }
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-4">
          <Input label="Search" icon={Search} value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select label="Category" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>All</option>
            {COMPLAINT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>All</option>
            {COMPLAINT_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select label="Priority" value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option>All</option>
            {PRIORITIES.map((item) => <option key={item}>{item}</option>)}
          </Select>
        </div>
      </Card>

      {visibleComplaints.length ? (
        <div className="grid gap-4">
          {visibleComplaints.map((complaint) => (
            <Card key={complaint.id}>
              <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={statusTone(complaint.status)}>{complaint.status}</Badge>
                    <Badge tone={statusTone(complaint.priority)}>{complaint.priority}</Badge>
                    <Badge tone="cyan">{complaint.category}</Badge>
                  </div>
                  <h3 className="mt-3 text-xl font-black text-white">{complaint.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {complaint.studentName} - {complaint.location} - {formatDate(complaint.createdAt)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{complaint.description}</p>
                  {complaint.imageUrl ? (
                    <a href={complaint.imageUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold text-cyan-100">
                      View attached image
                    </a>
                  ) : null}
                </div>
                <div className="grid gap-3">
                  <Select label="Status" value={complaint.status} onChange={(event) => updateComplaint(complaint, { status: event.target.value })}>
                    {COMPLAINT_STATUSES.map((item) => <option key={item}>{item}</option>)}
                  </Select>
                  <Select label="Assign to" value={complaint.assignedTo || ''} onChange={(event) => updateComplaint(complaint, { assignedTo: event.target.value })}>
                    <option value="">Unassigned</option>
                    {assignees.map((item) => <option key={item.uid || item.id} value={item.name}>{item.name} ({getRoleLabel(item.role)})</option>)}
                  </Select>
                  <Textarea
                    label="Resolution note"
                    defaultValue={complaint.resolutionNote || ''}
                    onBlur={(event) =>
                      event.target.value !== (complaint.resolutionNote || '') &&
                      updateComplaint(complaint, { resolutionNote: event.target.value, updatedBy: user?.uid })
                    }
                  />
                  <DeleteButton itemName={complaint.title} onDelete={() => removeComplaint(complaint)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Wrench} title="No complaints found" message="Student complaints will appear here for review and resolution." />
      )}
    </MotionPage>
  );
}
