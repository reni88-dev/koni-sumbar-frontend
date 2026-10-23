import logo from '../../assets/koni-sumbar.jpg';

export function PublicCertificateShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-1">
            <img src={logo} alt="Logo KONI Sumatera Barat" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-slate-800">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
