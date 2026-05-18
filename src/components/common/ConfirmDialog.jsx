import { AlertTriangle } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message = 'Are you sure you want to delete this item?',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="flex gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-rose-300/25 bg-rose-400/10 text-rose-100">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm leading-6 text-slate-300">{message}</p>
          <p className="mt-2 text-xs text-slate-500">
            This action cannot be undone.
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting...' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
