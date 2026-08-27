import clsx from 'clsx';

const COLOR_MAP = {
  gray: 'bg-gray-100 text-gray-700',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  indigo: 'bg-brand-100 text-brand-700',
  purple: 'bg-purple-100 text-purple-700',
};

// Maps common domain statuses to a sensible color without every caller
// having to know the mapping.
const STATUS_COLORS = {
  Active: 'green', Inactive: 'gray', Terminated: 'red',
  Present: 'green', Absent: 'red', 'Half Day': 'yellow', Leave: 'blue', Late: 'yellow',
  Pending: 'yellow', Approved: 'green', Rejected: 'red',
  Draft: 'gray', Processed: 'blue', Paid: 'green',
};

export default function Badge({ children, color, status }) {
  const resolved = color || STATUS_COLORS[status] || STATUS_COLORS[children] || 'gray';
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', COLOR_MAP[resolved])}>
      {children}
    </span>
  );
}
