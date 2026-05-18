import { daysUntil } from './dateUtils';

export function getDueStatus(dueDate, completed = false) {
  if (completed) return 'Completed';
  const remaining = daysUntil(dueDate);
  if (remaining < 0) return 'Overdue';
  return 'Pending';
}

export function getDueLabel(dueDate) {
  const remaining = daysUntil(dueDate);
  if (remaining === 0) return 'Due today';
  if (remaining === 1) return 'Due tomorrow';
  if (remaining > 1) return `Due in ${remaining} days`;
  const overdue = Math.abs(remaining);
  return `Overdue by ${overdue} day${overdue === 1 ? '' : 's'}`;
}

export function matchesText(item, query, keys) {
  if (!query.trim()) return true;
  const normalized = query.trim().toLowerCase();
  return keys.some((key) =>
    String(item?.[key] || '')
      .toLowerCase()
      .includes(normalized),
  );
}
