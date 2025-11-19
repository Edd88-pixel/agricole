import { clsx } from 'clsx';

type ChecklistItem = {
  id: string;
  label: string;
  completed?: boolean;
};

type ChecklistProps = {
  items: ChecklistItem[];
  onToggle?: (id: string, completed: boolean) => void;
};

const Checklist = ({ items, onToggle }: ChecklistProps) => (
  <ul className="space-y-2" role="list">
    {items.map((item) => (
      <li key={item.id} className="flex items-start gap-3 rounded-xl border border-subtle bg-brand-surface p-4">
        <input
          id={item.id}
          type="checkbox"
          className="mt-1 h-5 w-5 rounded border-subtle text-brand-primary focus:ring-brand-primary"
          checked={item.completed}
          onChange={(event) => onToggle?.(item.id, event.target.checked)}
        />
        <label htmlFor={item.id} className={clsx('text-sm text-brand-text', item.completed && 'line-through text-brand-muted')}>
          {item.label}
        </label>
      </li>
    ))}
  </ul>
);

export default Checklist;
