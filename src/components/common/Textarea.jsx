export default function Textarea({
  label,
  error,
  hint,
  required,
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
      <textarea
        className={`field-input mt-2 min-h-28 resize-y ${
          error ? 'border-rose-300/70 focus:border-rose-300 focus:ring-rose-300/10' : ''
        }`}
        {...props}
      />
      {error ? <p className="mt-2 text-xs font-medium text-rose-200">{error}</p> : null}
      {!error && hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </label>
  );
}
