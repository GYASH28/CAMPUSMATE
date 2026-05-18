export default function Input({
  label,
  error,
  hint,
  required,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <label className={`block ${className}`}>
      {label ? (
        <span className="field-label">
          {label}
          {required ? <span className="text-cyan-200"> *</span> : null}
        </span>
      ) : null}
      <span className="relative mt-2 block">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        ) : null}
        <input
          className={`field-input ${Icon ? 'pl-11' : ''} ${
            error ? 'border-rose-300/70 focus:border-rose-300 focus:ring-rose-300/10' : ''
          }`}
          {...props}
        />
      </span>
      {error ? <p className="mt-2 text-xs font-medium text-rose-200">{error}</p> : null}
      {!error && hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </label>
  );
}
