import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Button from './Button';
import ConfirmDialog from './ConfirmDialog';

export default function DeleteButton({
  onDelete,
  itemName = 'this item',
  size = 'sm',
  label = 'Delete',
  iconOnly = false,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onDelete();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="danger"
        size={size}
        onClick={() => setOpen(true)}
        aria-label={`Delete ${itemName}`}
      >
        <Trash2 className="h-4 w-4" />
        {iconOnly ? null : label}
      </Button>
      <ConfirmDialog
        open={open}
        title="Are you sure you want to delete this item?"
        message={`You are about to delete ${itemName}.`}
        loading={loading}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
