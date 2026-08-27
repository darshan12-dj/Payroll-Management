import clsx from 'clsx';

export function Label({ children, required }) {
  return (
    <label className="mb-1 block text-sm font-medium text-gray-700">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

export function Input({ error, className, ...props }) {
  return (
    <input
      className={clsx(
        'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
        error ? 'border-red-400' : 'border-gray-300',
        className
      )}
      {...props}
    />
  );
}

export function Select({ error, className, children, ...props }) {
  return (
    <select
      className={clsx(
        'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
        error ? 'border-red-400' : 'border-gray-300',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ error, className, ...props }) {
  return (
    <textarea
      className={clsx(
        'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
        error ? 'border-red-400' : 'border-gray-300',
        className
      )}
      {...props}
    />
  );
}

export function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
}

export function FormGroup({ children, className }) {
  return <div className={clsx('mb-4', className)}>{children}</div>;
}
