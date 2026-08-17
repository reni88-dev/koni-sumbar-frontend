export function FormSectionCard({
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  title,
  subtitle,
  children,
  className = ''
}) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm ${className}`}>
      {(title || Icon) && (
        <div className="mb-4 flex items-center gap-3 pb-3 border-b border-slate-100">
          {Icon && (
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
              <Icon className="w-4 h-4" />
            </span>
          )}
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-tight">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {children}
      </div>
    </div>
  );
}
