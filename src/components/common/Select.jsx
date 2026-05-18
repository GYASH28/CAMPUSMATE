export default function Select({
  label,
  error,
  hint,
  required,
  children,
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
      <select
        className={`field-input mt-2 ${
          error ? 'border-rose-300/70 focus:border-rose-300 focus:ring-rose-300/10' : ''
        }`}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="mt-2 text-xs font-medium text-rose-200">{error}</p> : null}
      {!error && hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </label>
  );
}
