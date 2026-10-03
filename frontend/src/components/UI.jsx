import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, Clock3, X } from 'lucide-react'

export function Button({ children, variant = 'primary', size = 'md', icon: Icon, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50'
  const variants = { primary: 'bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700', secondary: 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50', ghost: 'text-slate-500 hover:bg-slate-100' }
  const sizes = { sm: 'h-8 px-2.5 text-[11px]', md: 'h-10 px-3.5 text-xs' }
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{Icon && <Icon size={15} />}{children}</button>
}

export function Panel({ children, className = '', ...props }) { return <section className={`rounded-xl border border-[#e9edf4] bg-white shadow-[0_2px_8px_rgba(24,39,75,.025)] ${className}`} {...props}>{children}</section> }

export function Badge({ value }) {
  const key = String(value ?? '').toLowerCase()
  const colors = key.includes('urgent') || key.includes('high') || key.includes('repair') || key.includes('inactive') || key.includes('rejected') || key.includes('rusak') ? 'bg-rose-50 text-rose-700' : key.includes('progress') || key.includes('pending') || key.includes('normal') || key.includes('scheduled') || key.includes('menunggu') ? 'bg-amber-50 text-amber-700' : key.includes('resolved') || key.includes('completed') || key.includes('active') || key.includes('online') || key.includes('low') || key.includes('selesai') || key.includes('bagus') ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
  const Icon = key.includes('resolved') || key.includes('completed') || key.includes('active') || key.includes('online') || key.includes('selesai') || key.includes('bagus') ? CheckCircle2 : key.includes('progress') || key.includes('pending') || key.includes('scheduled') || key.includes('menunggu') || key.includes('diproses') ? Clock3 : key.includes('urgent') || key.includes('high') || key.includes('rusak') ? AlertCircle : null
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold ${colors}`}>{Icon && <Icon size={11} />}{value}</span>
}

export function PageHeading({ eyebrow, title, subtitle, action }) { return <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-1.5 text-[9px] font-extrabold uppercase tracking-[1.15px] text-blue-600">{eyebrow}</div><h1 className="font-display text-[23px] font-extrabold tracking-[-.7px] text-[#192336] sm:text-[26px]">{title}</h1><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div>{action}</div> }

export function EmptyState({ title, description }) { return <div className="flex flex-col items-center px-5 py-12 text-center"><span className="mb-3 grid size-11 place-items-center rounded-xl bg-slate-50 text-slate-400"><Clock3 size={19} /></span><div className="text-sm font-bold text-slate-700">{title}</div><p className="mt-1 max-w-xs text-xs text-slate-400">{description}</p></div> }

export function Modal({ open, title, onClose, children }) {
  useEffect(() => { if (!open) return undefined; const onKeyDown = event => { if (event.key === 'Escape') onClose() }; window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown) }, [open, onClose])
  if (!open) return null
  return <div className="modal-backdrop fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="modal-panel max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"><div className="mb-5 flex items-center justify-between"><h2 id="modal-title" className="font-display text-lg font-extrabold text-slate-800">{title}</h2><button aria-label="Close dialog" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>{children}</div></div>
}

export function TextField({ label, multiline = false, ...props }) { const Control = multiline ? 'textarea' : 'input'; return <label className="block"><span className="mb-1.5 block text-[11px] font-bold text-slate-600">{label}</span><Control className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${multiline ? 'min-h-[92px] resize-y' : ''}`} {...props} /></label> }

export function SelectField({ label, options = [], ...props }) { return <label className="block"><span className="mb-1.5 block text-[11px] font-bold text-slate-600">{label}</span><select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" {...props}>{options.map(option => typeof option === 'object' ? <option key={option.value} value={option.value}>{option.label}</option> : <option key={option} value={option}>{option}</option>)}</select></label> }