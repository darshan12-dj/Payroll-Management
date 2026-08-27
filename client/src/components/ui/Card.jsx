import clsx from 'clsx';

export default function Card({ children, className, title, actions, noPadding = false }) {
  return (
    <div className={clsx('rounded-xl border border-gray-200 bg-white shadow-card', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          {title && <h3 className="text-sm font-semibold text-gray-900">{title}</h3>}
          {actions}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}
