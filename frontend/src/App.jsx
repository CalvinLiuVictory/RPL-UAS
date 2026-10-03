import { useState, useEffect } from 'react'
import { LogOut } from 'lucide-react'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Activity, AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Building2, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock3, ClipboardCheck, DoorOpen, Download, Eye, EyeOff, FileBarChart2, Filter, Hammer, LayoutDashboard, LifeBuoy, ListFilter, Lock, Mail, Menu, MoreHorizontal, Plus, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Users, Wrench } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Button, EmptyState, Modal, PageHeading, Panel, SelectField, TextField } from './components/UI.jsx'
import logo from './assets/LOGO.png'
import { buildings, complaints, devices, maintenanceTasks, monthlyActivity, rooms, serviceTasks, users } from './data/mockData.js'
import { authenticateMock, clearMockSession, getMockSession, saveMockSession } from './lib/mockAuth.js'
import complaintService from './services/complaintService.js'
import './App.css'

const roleNavigation = {
  admin: [
    { label: 'Overview', items: [['Dashboard', '/admin/dashboard', LayoutDashboard]] },
    { label: 'Campus directory', items: [['Users', '/admin/users', Users], ['Buildings', '/admin/buildings', Building2], ['Rooms', '/admin/rooms', DoorOpen], ['Devices', '/admin/devices', Settings2]] },
    { label: 'Operations', items: [['Complaints', '/admin/complaints', LifeBuoy], ['Inspection', '/admin/inspection', ShieldCheck], ['Maintenance', '/admin/maintenance', Wrench], ['Reports', '/admin/reports', FileBarChart2]] },
  ],
  technician: [
    { label: 'Workspace', items: [['Dashboard', '/technician/dashboard', LayoutDashboard], ['Service tasks', '/technician/service-tasks', ClipboardCheck], ['Maintenance tasks', '/technician/maintenance-tasks', Wrench]] },
    { label: 'Field work', items: [['Inspection', '/technician/inspection', ShieldCheck], ['Repair', '/technician/repair', Hammer], ['Task history', '/technician/task-history', Clock3]] },
  ],
  user: [
    { label: 'My workspace', items: [['Dashboard', '/user/dashboard', LayoutDashboard], ['Create complaint', '/user/create-complaint', Plus], ['My complaints', '/user/complaints', LifeBuoy], ['History', '/user/history', Clock3]] },
  ],
}

const roleNames = { admin: 'Administrator', technician: 'Technician', user: 'Reporter' }

function rolePage(role, allowedRoles, page) {
  return allowedRoles.includes(role) ? page : <Navigate to={`/${role}/dashboard`} replace />
}

function App() {
  const [user, setUser] = useState(getMockSession)
  const handleLogin = (identifier, password) => {
    const account = authenticateMock(identifier, password)
    if (!account) return false
    saveMockSession(account.username)
    setUser(account)
    return true
  }
  const handleLogout = () => {
    clearMockSession()
    setUser(null)
  }
  const homePath = user ? `/${user.role}/dashboard` : '/login'

  return <BrowserRouter><Routes>
    <Route path="/login" element={user ? <Navigate to={homePath} replace /> : <LoginPage onLogin={handleLogin} />} />
    <Route path="/" element={<Navigate to={homePath} replace />} />
    <Route path="/:role/*" element={user ? <RoleWorkspace user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
    <Route path="*" element={<Navigate to={homePath} replace />} />
  </Routes></BrowserRouter>
}

function RoleWorkspace({ user, onLogout }) {
  const { role } = useParams()
  return role === user.role ? <Workspace user={user} onLogout={onLogout} /> : <Navigate to={`/${user.role}/dashboard`} replace />
}

function LoginPage({ onLogin }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    const success = onLogin(identifier, password)
    if (!success) {
      setError('Email/username atau password tidak cocok.')
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-layout">
        <div className="login-brand-panel">
          <div className="login-brand">
            <span className="login-brand-mark">
              <img src={logo} alt="CampusCare" />
            </span>
            <div>
              <strong>CampusCare</strong>
              <small>Operations & Facilities Hub</small>
            </div>
          </div>

          <div className="login-intro">
            <span className="login-kicker">CAMPUS FACILITIES MANAGEMENT</span>
            <h1>Spaces ready for learning.</h1>
            <p>
              Integrated platform for campus service requests, maintenance dispatch, and physical facilities tracking.
            </p>

            <div className="login-features">
              <div className="login-feature-item">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Real-time ticket dispatch & tracking</span>
              </div>
              <div className="login-feature-item">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Asset & device maintenance monitoring</span>
              </div>
              <div className="login-feature-item">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Multi-role access (Admin, Teknisi, Pelapor)</span>
              </div>
            </div>
          </div>

          <div className="login-footnote">
            <ShieldCheck size={16} />
            <span>CampusCare Operations · SSL Protected</span>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-form-heading">
            <span className="login-kicker">PORTAL MASUK</span>
            <h2>Sign in to CampusCare</h2>
            <p>Enter your credentials to access your campus workspace.</p>
          </div>

          {error && (
            <div className="login-error-banner" role="alert">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={submit}>
            <div className="login-input-group">
              <label htmlFor="login-identifier">Email atau Username</label>
              <div className="login-input-wrap">
                <Mail size={16} className="login-input-icon" />
                <input
                  id="login-identifier"
                  autoComplete="username"
                  value={identifier}
                  onChange={event => { setIdentifier(event.target.value); setError('') }}
                  placeholder="e.g. admin@campuscare.com"
                  required
                />
              </div>
            </div>

            <div className="login-input-group">
              <label htmlFor="login-password">Password</label>
              <div className="login-input-wrap">
                <Lock size={16} className="login-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={event => { setPassword(event.target.value); setError('') }}
                  placeholder="Masukkan password Anda"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="login-form-footer">
            <span>Sistem Informasi Pemeliharaan & Operasional Kampus</span>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App

function Workspace({ user, onLogout }) {
  const { role = 'admin' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [modal, setModal] = useState('')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const activeRole = roleNavigation[role] ? role : 'admin'
  const currentItem = roleNavigation[activeRole].flatMap(group => group.items).find(([, path]) => location.pathname === path || location.pathname.startsWith(`${path}/`))
  const pageTitle = currentItem?.[0] ?? (location.pathname.includes('/complaints/') ? 'Complaint detail' : 'Dashboard')
  const submitForm = (event) => {
    event.preventDefault()
    setModal('')
    setNotice('Your request has been saved successfully.')
    window.setTimeout(() => setNotice(''), 3200)
  }

  return (
    <div className="app-shell flex bg-[#f5f7fb]">
      <aside className={`sidebar fixed inset-y-0 left-0 z-30 flex flex-col border-r border-[#e9edf4] bg-white px-3 pb-4 pt-5 transition-all sm:relative sm:translate-x-0 ${mobileOpen ? 'mobile-open' : '-translate-x-full sm:translate-x-0'}`}>
        <div className="mb-8 flex items-center gap-3 px-2"><span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#e9edf4] bg-white p-1.5"><img src={logo} alt="CampusCare" className="size-full object-contain" /></span><div className="brand-word"><div className="font-display text-[15px] font-extrabold tracking-[-.4px] text-[#17243a]">CampusCare</div><div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[1.1px] text-slate-400">Facilities hub</div></div></div>
        <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-2"><div className="mb-1 px-1 text-[10px] font-bold uppercase tracking-[1px] text-slate-400 sidebar-label">Workspace</div><div className="px-2 py-2 text-xs font-bold text-slate-700">{roleNames[activeRole]} workspace</div></div>
        <nav className="nav-scroll flex-1 space-y-5 overflow-y-auto">{roleNavigation[activeRole].map(group => <div key={group.label}><div className="sidebar-section mb-2 px-3 text-[10px] font-bold uppercase tracking-[1.1px] text-slate-400">{group.label}</div><div className="space-y-1">{group.items.map(([label, path, Icon]) => <NavLink key={path} to={path} onClick={() => setMobileOpen(false)} className={({ isActive }) => `sidebar-link group flex items-center gap-3 rounded-lg px-3 py-[10px] text-[13px] font-semibold transition-colors ${isActive || (path.endsWith('/complaints') && location.pathname.startsWith(`${path}/`)) ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}><Icon size={17} strokeWidth={1.9} /><span className="sidebar-label flex-1">{label}</span>{label === 'Complaints' && activeRole === 'admin' && <span className="sidebar-label rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">0</span>}</NavLink>)}</div></div>)}</nav>
        <div className="mt-4 rounded-xl bg-[#f3f7ff] p-3 sidebar-label"><div className="flex items-center gap-2 text-xs font-bold text-slate-700"><Sparkles size={15} className="text-blue-600" /> Campus operations</div><p className="mb-2 mt-1 text-[11px] leading-4 text-slate-500">Keeping every space ready for learning.</p><div className="h-1 rounded-full bg-blue-100"><div className="h-1 w-0 rounded-full bg-blue-600" /></div></div>
        <div className="mt-4 flex items-center gap-2.5 border-t border-slate-100 px-1 pt-4"><div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eaf0fc] text-xs font-bold text-blue-700">{activeRole === 'technician' ? 'AR' : activeRole === 'user' ? 'JL' : 'AM'}</div><div className="profile-copy min-w-0 flex-1"><div className="truncate text-xs font-bold text-slate-700">{activeRole === 'technician' ? 'Alex Rivera' : activeRole === 'user' ? 'Jordan Lee' : 'Avery Morgan'}</div><div className="truncate text-[10px] text-slate-400">{roleNames[activeRole]}</div></div><MoreHorizontal size={17} className="sidebar-label text-slate-400" /></div>
      </aside>
      <main className="main-area flex min-h-screen flex-1 flex-col">
        <div className="flex h-10 shrink-0 items-center justify-end border-b border-[#e9edf4] bg-white px-4 sm:px-7">
          <button type="button" onClick={onLogout} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"><LogOut size={15} /> Sign out</button>
        </div>
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#e9edf4] bg-white/95 px-4 backdrop-blur sm:px-7"><div className="flex min-w-0 items-center gap-3"><button aria-label="Open navigation" onClick={() => setMobileOpen(!mobileOpen)} className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 sm:hidden"><Menu size={19} /></button><div className="hidden items-center gap-2 text-xs text-slate-400 md:flex"><span>Campus operations</span><ChevronRight size={13} /><span className="font-semibold text-slate-600">{pageTitle}</span></div><div className="font-display text-sm font-bold text-slate-800 md:hidden">{pageTitle}</div></div><div className="flex items-center gap-2 sm:gap-3"><label className="hidden h-9 w-56 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-300 md:flex"><Search size={15} className="text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search anything..." className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400" /><kbd className="rounded border border-slate-200 bg-white px-1 text-[9px] text-slate-400">⌘ K</kbd></label><button aria-label="Notifications" className="relative grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><Bell size={18} /><span className="absolute right-[8px] top-[7px] size-1.5 rounded-full bg-rose-500 ring-2 ring-white" /></button><div className="hidden h-7 w-px bg-slate-200 sm:block" /><div className="hidden text-right sm:block"><div className="text-[11px] font-bold text-slate-700">{activeRole === 'technician' ? 'Alex Rivera' : activeRole === 'user' ? 'Jordan Lee' : 'Avery Morgan'}</div><div className="text-[10px] text-slate-400">North Campus</div></div><div className="grid size-8 place-items-center rounded-full bg-blue-100 text-[11px] font-extrabold text-blue-700">{activeRole === 'technician' ? 'AR' : activeRole === 'user' ? 'JL' : 'AM'}</div></div></header>
        <div className="page-content page-enter w-full flex-1 px-4 py-6 sm:px-7 sm:py-7"><Routes>
          <Route path="dashboard" element={<Dashboard role={activeRole} currentUser={user} onAction={() => activeRole === 'technician' ? navigate('/technician/service-tasks') : activeRole === 'admin' ? navigate('/admin/complaints') : navigate('/user/create-complaint')} />} />
          <Route path="users" element={rolePage(activeRole, ['admin'], <DirectoryPage title="Users" subtitle="Manage campus accounts and access." rows={users} kind="users" query={query} onAdd={() => setModal('user')} />)} />
          <Route path="buildings" element={rolePage(activeRole, ['admin'], <DirectoryPage title="Buildings" subtitle="Campus buildings and their operational status." rows={buildings} kind="buildings" query={query} onAdd={() => setModal('building')} />)} />
          <Route path="rooms" element={rolePage(activeRole, ['admin'], <DirectoryPage title="Rooms" subtitle="Browse rooms across your campus buildings." rows={rooms} kind="rooms" query={query} onAdd={() => setModal('room')} />)} />
          <Route path="devices" element={rolePage(activeRole, ['admin'], <DirectoryPage title="Devices" subtitle="Track equipment, condition, and service coverage." rows={devices} kind="devices" query={query} onAdd={() => setModal('device')} />)} />
          <Route path="complaints" element={<ComplaintsPage role={activeRole} currentUser={user} query={query} onAdd={activeRole === 'user' ? () => navigate('/user/create-complaint') : undefined} />} />
          <Route path="complaints/:id" element={<ComplaintDetail role={activeRole} currentUser={user} />} />
          <Route path="maintenance" element={rolePage(activeRole, ['admin'], <TaskPage title="Maintenance" subtitle="Planned work and preventive maintenance." rows={maintenanceTasks} query={query} />)} />
          <Route path="reports" element={rolePage(activeRole, ['admin'], <ReportsPage />)} />
          <Route path="service-tasks" element={rolePage(activeRole, ['technician'], <TaskPage title="Service tasks" subtitle="Assigned service requests ready for action." rows={serviceTasks.filter(task => task.assignee === user.name)} query={query} />)} />
          <Route path="maintenance-tasks" element={rolePage(activeRole, ['technician'], <TaskPage title="Maintenance tasks" subtitle="Preventive and scheduled work assigned to you." rows={maintenanceTasks.filter(task => task.assignee === user.name)} query={query} />)} />
          <Route path="inspection" element={rolePage(activeRole, ['admin', 'technician'], <InspectionPage readOnly={activeRole === 'admin'} />)} />
          <Route path="repair" element={rolePage(activeRole, ['technician'], <TaskPage title="Repair queue" subtitle="Equipment requiring diagnosis and repair." rows={devices.filter(item => item.condition === 'Needs repair').map((item, index) => ({ id: `REP-${128 + index}`, title: item.name, location: `${item.building} · ${item.room}`, assignee: user.name, due: 'Today', status: 'In progress', priority: 'High' }))} query={query} />)} />
          <Route path="task-history" element={rolePage(activeRole, ['technician'], <TaskPage title="Task history" subtitle="Recently completed field work." rows={serviceTasks.filter(item => item.assignee === user.name && item.status === 'Completed')} query={query} />)} />
          <Route path="create-complaint" element={rolePage(activeRole, ['user'], <CreateComplaint onSubmit={submitForm} />)} />
          <Route path="history" element={rolePage(activeRole, ['admin', 'user'], <ComplaintsPage role={activeRole} currentUser={user} query={query} history />)} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes></div>
      </main>
      {notice && <div role="status" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl"><CheckCircle2 size={17} className="text-emerald-400" />{notice}</div>}
      <Modal open={Boolean(modal)} title={modal === 'complaint' ? 'Create a complaint' : `Add ${modal}`} onClose={() => setModal('')}><ComplaintForm onSubmit={submitForm} compact={modal !== 'complaint'} /></Modal>
    </div>
  )
}

function Dashboard({ role, currentUser, onAction }) {
  const isAdmin = role === 'admin'
  const isTech = role === 'technician'
  const stats = isAdmin ? [['Open complaints', '0', '0%', 'vs last month', LifeBuoy, 'blue'], ['Active work orders', '0', '0%', 'vs last month', Wrench, 'amber'], ['Buildings online', '0 / 0', '0%', 'campus availability', Building2, 'green'], ['Avg. response time', '0 hrs', '0%', 'vs last month', Clock3, 'violet']] : isTech ? [['Assigned to me', '0', '0 today', 'across all task types', ClipboardCheck, 'blue'], ['Due today', '0', '0 urgent', 'needs your attention', CalendarDays, 'amber'], ['Completed this week', '0', '0 this week', 'vs last week', CheckCircle2, 'green'], ['Avg. resolution', '0 hrs', '0%', 'vs last month', Clock3, 'violet']] : [['My open requests', '0', '0 this month', 'across all buildings', LifeBuoy, 'blue'], ['In progress', '0', '0 assigned', 'technician working', Activity, 'amber'], ['Resolved this year', '0', '0 recently', 'thank you for reporting', CheckCircle2, 'green'], ['Avg. response', '0 hrs', '0%', 'campus service target', Clock3, 'violet']]
  const rows = isTech ? serviceTasks.filter(task => task.assignee === currentUser.name).slice(0, 4) : (isAdmin ? complaints : complaints.filter(item => item.reporter === currentUser.name)).slice(0, 4)
  return <><PageHeading eyebrow={isAdmin ? 'TUESDAY, SEPTEMBER 29, 2026' : isTech ? 'YOUR FIELD WORK' : 'YOUR CAMPUS'} title={isAdmin ? `Good morning, ${currentUser.name.split(' ')[0]}` : isTech ? `Good morning, ${currentUser.name.split(' ')[0]}` : `Good morning, ${currentUser.name.split(' ')[0]}`} subtitle={isAdmin ? 'Here’s what’s happening across North Campus today.' : isTech ? 'A clear view of what needs your attention today.' : 'Keep track of the requests you’ve sent to campus services.'} action={<Button onClick={onAction} icon={isTech ? ClipboardCheck : isAdmin ? LifeBuoy : Plus}>{isTech ? 'View service tasks' : isAdmin ? 'View complaints' : 'New complaint'}</Button>} />
    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, trend, note, Icon, color], index) => <Panel key={label} className="metric-card page-enter p-4 sm:p-5" style={{ animationDelay: `${index * 45}ms` }}><div className="flex items-start justify-between"><span className="text-xs font-semibold text-slate-500">{label}</span><span className={`grid size-9 place-items-center rounded-xl ${color === 'blue' ? 'bg-blue-50 text-blue-600' : color === 'amber' ? 'bg-amber-50 text-amber-600' : color === 'green' ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600'}`}><Icon size={17} /></span></div><div className="mt-3 flex items-baseline gap-2"><span className="font-display text-[26px] font-extrabold tracking-[-1px] text-slate-800">{value}</span><span className="flex items-center text-[10px] font-bold text-emerald-600">{trend.startsWith('-') ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}{trend}</span></div><div className="mt-1 text-[10px] text-slate-400">{note}</div></Panel>)}</div>
    <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]"><Panel className="p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-display text-sm font-extrabold text-slate-800">Service activity</h2><p className="mt-1 text-[11px] text-slate-400">Requests created and resolved this year</p></div><select className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-500 outline-none"><option>This year</option><option>Last 30 days</option></select></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyActivity} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}><defs><linearGradient id="createdFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.17} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} /></linearGradient><linearGradient id="resolvedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#35b88a" stopOpacity={0.13} /><stop offset="95%" stopColor="#35b88a" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf0f5" strokeDasharray="3 4" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#99a3b3', fontSize: 10 }} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#99a3b3', fontSize: 10 }} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="created" name="Created" stroke="#2563eb" strokeWidth={2.5} fill="url(#createdFill)" /><Area type="monotone" dataKey="resolved" name="Resolved" stroke="#35b88a" strokeWidth={2.5} fill="url(#resolvedFill)" /></AreaChart></ResponsiveContainer></div><div className="mt-2 flex justify-center gap-5 text-[10px] font-semibold text-slate-500"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-blue-600" />Created</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-emerald-500" />Resolved</span></div></Panel>
      <Panel className="p-4 sm:p-5"><div className="mb-4 flex items-start justify-between"><div><h2 className="font-display text-sm font-extrabold text-slate-800">By category</h2><p className="mt-1 text-[11px] text-slate-400">Open requests by service type</p></div><button aria-label="More category options" className="text-slate-400"><MoreHorizontal size={18} /></button></div><div className="space-y-[17px]">{[['HVAC & ventilation', 0, '#2563eb'], ['Electrical', 0, '#f2a93b'], ['Plumbing', 0, '#30b98a'], ['IT & AV equipment', 0, '#8974e8'], ['Other', 0, '#ec7290']].map(([label, value, color]) => <div key={label}><div className="mb-1.5 flex justify-between text-[11px]"><span className="font-medium text-slate-600">{label}</span><span className="font-bold text-slate-700">{value}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} /></div></div>)}</div><button className="mt-5 flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800">View breakdown <ArrowRight size={13} /></button></Panel></div>
    <Panel><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5"><div><h2 className="font-display text-sm font-extrabold text-slate-800">{isTech ? 'Your active tasks' : isAdmin ? 'Recent complaints' : 'Recent requests'}</h2><p className="mt-1 text-[11px] text-slate-400">{isTech ? 'Tasks assigned to you and ready for action.' : 'Latest service requests from across campus.'}</p></div><Button variant="secondary" size="sm" onClick={onAction}>{isTech ? 'View task list' : 'View all'} <ArrowRight size={14} /></Button></div><TaskTable rows={rows} showReporter={isAdmin && !isTech} compact /></Panel>
  </>
}

function ChartTooltip({ active, payload, label }) { return active && payload?.length ? <div className="chart-tooltip"><div className="mb-1 font-bold text-slate-700">{label}</div>{payload.map(item => <div key={item.dataKey} className="flex items-center gap-2 text-slate-500"><i className="size-2 rounded-full" style={{ background: item.color }} />{item.name}: <b className="text-slate-700">{item.value}</b></div>)}</div> : null }

function DirectoryPage({ title, subtitle, rows, kind, query, onAdd }) {
  const filtered = rows.filter(row => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()))
  const columns = kind === 'users' ? [['name', 'Name'], ['email', 'Email'], ['department', 'Department'], ['role', 'Role'], ['status', 'Status']] : kind === 'buildings' ? [['name', 'Building'], ['code', 'Code'], ['location', 'Campus area'], ['rooms', 'Rooms'], ['status', 'Status']] : kind === 'rooms' ? [['name', 'Room'], ['building', 'Building'], ['floor', 'Floor'], ['type', 'Type'], ['devices', 'Devices'], ['status', 'Status']] : [['name', 'Device'], ['category', 'Category'], ['building', 'Building'], ['room', 'Room'], ['condition', 'Condition'], ['status', 'Status']]
  return <><PageHeading eyebrow="CAMPUS DIRECTORY" title={title} subtitle={subtitle} action={<Button onClick={onAdd} icon={Plus}>Add {title.slice(0, -1)}</Button>} /><Panel><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div className="flex min-w-0 flex-1 items-center gap-2"><div className="flex h-9 min-w-[190px] max-w-sm flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3"><Search size={15} className="text-slate-400" /><input value={query} readOnly placeholder={`Search ${title.toLowerCase()}...`} className="w-full text-xs outline-none placeholder:text-slate-400" /></div><Button variant="secondary" size="sm" icon={Filter}>Filter</Button></div><Button variant="secondary" size="sm" icon={Download}>Export</Button></div><div className="table-wrap"><table className="w-full text-left"><thead><tr>{columns.map(([, label]) => <th key={label} className="bg-slate-50/70 px-4 py-3 text-[10px] font-bold uppercase tracking-[.7px] text-slate-400">{label}</th>)}<th className="bg-slate-50/70 px-4 py-3" /></tr></thead><tbody>{filtered.map(row => <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/60">{columns.map(([key]) => <td key={key} className="px-4 py-3.5 text-xs text-slate-600">{key === 'name' && kind === 'users' ? <span className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700">{row.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span><span className="font-bold text-slate-700">{row.name}</span></span> : key === 'status' || key === 'condition' ? <Badge value={row[key]} /> : key === 'rooms' || key === 'devices' ? <span className="font-semibold text-slate-700">{row[key]}</span> : row[key]}</td>)}<td className="px-4 py-3 text-right"><button aria-label={`Actions for ${row.name}`} className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><MoreHorizontal size={16} /></button></td></tr>)}</tbody></table>{!filtered.length && <EmptyState title="No matching records" description="Try adjusting your search or add a new record." />}</div><div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[10px] text-slate-400"><span>Showing <b className="text-slate-600">1–{filtered.length}</b> of <b className="text-slate-600">{rows.length}</b> records</span><div className="flex gap-1"><button aria-label="Previous page" className="rounded border border-slate-200 p-1"><ChevronLeft size={14} /></button><button aria-label="Next page" className="rounded border border-slate-200 p-1"><ChevronRight size={14} /></button></div></div></Panel></>
}

function ComplaintsPage({ role, currentUser, query, history = false, onAdd }) {
  const navigate = useNavigate()
  const [dataRows, setDataRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    complaintService.getComplaints()
      .then((data) => {
        if (!isMounted) return
        const formatted = (Array.isArray(data) ? data : []).map((item) => {
          const gedung = item.perangkat?.ruangan?.gedung?.nama_gedung || ''
          const ruangan = item.perangkat?.ruangan?.nama_ruangan || ''
          const locationStr = gedung && ruangan ? `${gedung} · ${ruangan}` : gedung || ruangan || 'Lokasi Kampus'
          const dateStr = item.updated_at
            ? new Date(item.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Baru saja'

          return {
            id: item.id ? `REQ-${item.id}` : 'REQ-?',
            dbId: item.id,
            title: item.perangkat?.nama_perangkat || item.deskripsi || 'Laporan Kerusakan',
            description: item.deskripsi,
            location: locationStr,
            reporter: item.user?.name || 'Pelapor',
            assignee: item.teknisi?.name || 'Belum ditugaskan',
            priority: 'Normal',
            status: item.status || 'Menunggu',
            updated: dateStr,
            raw: item,
          }
        })
        setDataRows(formatted)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Error fetching complaints:', err)
        setError(err.response?.data?.message || 'Gagal memuat data pengaduan dari server.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const rows = history
    ? dataRows.filter(item => ['Selesai', 'Resolved', 'Closed', 'Completed'].includes(item.status))
    : dataRows

  const filtered = rows.filter(row => JSON.stringify(row).toLowerCase().includes((query || '').toLowerCase()))

  return (
    <>
      <PageHeading
        eyebrow={history ? 'PAST REQUESTS' : 'SERVICE DESK'}
        title={history ? 'Request history' : 'Complaints'}
        subtitle={history ? 'A record of your resolved campus service requests.' : 'Review, assign, and track campus service requests.'}
        action={onAdd && <Button onClick={onAdd} icon={Plus}>New complaint</Button>}
      />
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={SlidersHorizontal}>All requests <ChevronDown size={13} /></Button>
            <Button variant="secondary" size="sm" icon={ListFilter}>Status</Button>
          </div>
          <span className="text-[11px] text-slate-400">{filtered.length} requests</span>
        </div>

        {error && (
          <div className="m-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-2" />
            <span className="text-xs font-semibold">Memuat data tiket pengaduan...</span>
          </div>
        ) : (
          <TaskTable
            rows={filtered}
            showReporter
            onRowClick={row => navigate(`/${window.location.pathname.split('/')[1]}/complaints/${row.dbId || row.id}`)}
          />
        )}
      </Panel>
    </>
  )
}

function TaskPage({ title, subtitle, rows, query }) {
  const filtered = rows.filter(row => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()))
  return <><PageHeading eyebrow="FIELD OPERATIONS" title={title} subtitle={subtitle} action={<Button variant="secondary" icon={CalendarDays}>This week <ChevronDown size={13} /></Button>} /><div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{[['All tasks', rows.length, 'text-slate-700'], ['In progress', rows.filter(row => row.status === 'In progress').length, 'text-blue-700'], ['Due today', rows.filter(row => row.due === 'Today').length, 'text-amber-600'], ['Completed', rows.filter(row => row.status === 'Completed').length, 'text-emerald-600']].map(([label, count, color]) => <Panel key={label} className="p-4"><div className="text-[11px] font-medium text-slate-400">{label}</div><div className={`mt-1 font-display text-xl font-extrabold ${color}`}>{count}</div></Panel>)}</div><Panel><div className="flex items-center justify-between border-b border-slate-100 p-4"><div className="flex items-center gap-2"><Button variant="secondary" size="sm" icon={Filter}>Filter tasks</Button><Button variant="secondary" size="sm" icon={CalendarDays}>Due date</Button></div><span className="text-[11px] text-slate-400">{filtered.length} tasks</span></div><TaskTable rows={filtered} showAssignee /></Panel></>
}

function TaskTable({ rows, showReporter = false, showAssignee = false, compact = false, onRowClick }) {
  if (!rows?.length) return <EmptyState title="You're all caught up" description="There are no requests to show here right now." />
  return <div className="table-wrap"><table className="w-full text-left"><thead><tr>{['Request', 'Location', ...(showReporter ? ['Reported by'] : []), ...(showAssignee ? ['Assigned to'] : []), 'Priority', 'Status', ...(compact ? [] : ['Updated']), ''].map(label => <th key={label} className="bg-slate-50/70 px-4 py-3 text-[10px] font-bold uppercase tracking-[.7px] text-slate-400">{label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id} onClick={() => onRowClick?.(row)} className={`border-t border-slate-100 transition-colors hover:bg-slate-50/60 ${onRowClick ? 'cursor-pointer' : ''}`}><td className="px-4 py-3.5"><div className="flex items-center gap-2.5"><span className={`grid size-8 shrink-0 place-items-center rounded-lg ${index % 3 === 0 ? 'bg-blue-50 text-blue-600' : index % 3 === 1 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}><Wrench size={15} /></span><span><span className="block max-w-[205px] truncate text-xs font-bold text-slate-700">{row.title}</span><span className="mt-0.5 block text-[10px] text-slate-400">{row.id}</span></span></div></td><td className="px-4 py-3.5 text-xs text-slate-500">{row.location}</td>{showReporter && <td className="px-4 py-3.5 text-xs text-slate-600">{row.reporter}</td>}{showAssignee && <td className="px-4 py-3.5 text-xs text-slate-600">{row.assignee}</td>}<td className="px-4 py-3.5"><Badge value={row.priority} /></td><td className="px-4 py-3.5"><Badge value={row.status} /></td>{!compact && <td className="whitespace-nowrap px-4 py-3.5 text-[11px] text-slate-400">{row.updated ?? row.due}</td>}<td className="px-4 py-3.5 text-right"><button aria-label={`More actions for ${row.id}`} className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><MoreHorizontal size={16} /></button></td></tr>)}</tbody></table></div>
}

function ComplaintDetail({ role, currentUser }) {
  const { id } = useParams()
  const complaint = complaints.find(item => item.id === id)
  const canView = complaint && (role === 'admin' || (role === 'user' && complaint.reporter === currentUser.name) || (role === 'technician' && complaint.assignee === currentUser.name))
  if (!canView) return <Navigate to={`/${role}/complaints`} replace />
  return <><PageHeading eyebrow={`REQUEST ${complaint.id}`} title={complaint.title} subtitle={`${complaint.building} · ${complaint.room}`} action={role === 'admin' && <Button variant="secondary" icon={ArrowRight}>Assign technician</Button>} /><div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]"><Panel className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-sm font-extrabold text-slate-800">Request details</h2><Badge value={complaint.status} /></div><p className="mt-4 text-sm leading-6 text-slate-500">The room temperature has been unusually warm since yesterday afternoon. The ventilation unit is running, but airflow feels limited. Please inspect the air conditioning before the next lecture.</p><div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs"><Detail label="Category" value="HVAC & ventilation" /><Detail label="Priority" value={complaint.priority} /><Detail label="Reported by" value={complaint.reporter} /><Detail label="Assigned to" value={complaint.assignee} /><Detail label="Building" value={complaint.building} /><Detail label="Room" value={complaint.room} /></div></Panel><Panel className="p-5"><h2 className="font-display text-sm font-extrabold text-slate-800">Activity timeline</h2><div className="mt-5 space-y-5">{[['Request submitted', `${complaint.reporter} submitted this request`, complaint.updated, CheckCircle2], ['Assigned to technician', `${complaint.assignee} was assigned`, complaint.updated, Users], ['Service status', complaint.status, complaint.updated, CalendarDays]].map(([title, copy, date, Icon], index) => <div className="flex gap-3" key={title}><div className="flex flex-col items-center"><span className={`grid size-8 place-items-center rounded-full ${index === 0 ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}><Icon size={15} /></span>{index < 2 && <span className="mt-1 h-6 w-px bg-slate-200" />}</div><div className="pt-0.5"><div className="text-xs font-bold text-slate-700">{title}</div><div className="mt-1 text-[11px] text-slate-500">{copy}</div><div className="mt-1 text-[10px] text-slate-400">{date}</div></div></div>)}</div></Panel></div></>
}

function Detail({ label, value }) { return <div><div className="mb-1 text-[10px] font-semibold uppercase tracking-[.5px] text-slate-400">{label}</div><div className="font-semibold text-slate-700">{value}</div></div> }

function InspectionPage({ readOnly = false }) {
  const [checked, setChecked] = useState({})
  const checklist = ['Check equipment power and controls', 'Inspect filters and airflow', 'Listen for unusual noise or vibration', 'Document readings and observations']
  if (readOnly) return <><PageHeading eyebrow="FIELD OPERATIONS" title="Inspection record" subtitle="Routine HVAC inspection · Science Hall · Room 204" action={<Badge value="In progress" />} /><div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]"><Panel className="space-y-3 p-5 sm:p-6"><h2 className="font-display text-sm font-extrabold text-slate-800">Inspection checklist</h2>{checklist.map(item => <div key={item} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 text-xs text-slate-600"><CheckCircle2 size={16} className="shrink-0 text-emerald-600" />{item}</div>)}</Panel><Panel className="space-y-4 p-5"><h2 className="font-display text-sm font-extrabold text-slate-800">Asset information</h2><Detail label="Asset tag" value="AHU-204-09" /><Detail label="Location" value="Science Hall · Room 204" /><Detail label="Last inspection" value="Aug 29, 2026" /><Detail label="Next scheduled" value="Oct 29, 2026" /></Panel></div></>
  return <><PageHeading eyebrow="FIELD OPERATIONS" title="Inspection checklist" subtitle="Routine HVAC inspection · Science Hall · Room 204" action={<Badge value="In progress" />} /><div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]"><Panel className="p-5 sm:p-6"><div className="mb-5 flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><ShieldCheck size={20} /></div><div><h2 className="font-display text-sm font-extrabold text-slate-800">Air handling unit AHU-204</h2><p className="mt-1 text-[11px] text-slate-400">Inspection 0 of 0 · Started at 9:14 AM</p></div></div><div className="space-y-2">{checklist.map((item, index) => <label key={item} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 p-3.5 hover:bg-slate-50"><input type="checkbox" checked={Boolean(checked[index])} onChange={() => setChecked(previous => ({ ...previous, [index]: !previous[index] }))} className="size-4 accent-blue-600" /><span className={`flex-1 text-xs ${checked[index] ? 'text-slate-400 line-through' : 'font-medium text-slate-700'}`}>{item}</span>{checked[index] && <Check size={15} className="text-emerald-600" />}</label>)}</div><TextField label="Inspection notes" placeholder="Add readings, observations, or follow-up recommendations..." multiline /><div className="mt-5 flex justify-end"><Button icon={CheckCircle2}>Complete inspection</Button></div></Panel><Panel className="p-5"><h2 className="font-display text-sm font-extrabold text-slate-800">Asset information</h2><div className="mt-4 space-y-4"><Detail label="Asset tag" value="AHU-204-09" /><Detail label="Location" value="Science Hall · Room 204" /><Detail label="Last inspection" value="Aug 29, 2026" /><Detail label="Next scheduled" value="Oct 29, 2026" /><Detail label="Service history" value="0 inspections · 0 repairs" /></div></Panel></div></>
}

function ReportsPage() {
  return <><PageHeading eyebrow="INSIGHTS & ANALYTICS" title="Reports" subtitle="Campus service performance at a glance." action={<Button variant="secondary" icon={Download}>Export report</Button>} /><div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">{[['Requests resolved', '0%', '0%'], ['Avg. resolution time', '0 hrs', '0 hrs'], ['On-time maintenance', '0%', '0%']].map(([title, value, change]) => <Panel className="p-5" key={title}><div className="text-xs font-medium text-slate-500">{title}</div><div className="mt-2 flex items-baseline gap-2"><span className="font-display text-2xl font-extrabold text-slate-800">{value}</span><span className="text-[10px] font-bold text-emerald-600">{change}</span></div><div className="mt-1 text-[10px] text-slate-400">compared with previous period</div></Panel>)}</div><Panel className="p-5"><div className="mb-4"><h2 className="font-display text-sm font-extrabold text-slate-800">Monthly service performance</h2><p className="mt-1 text-[11px] text-slate-400">Requests opened versus resolved</p></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyActivity} margin={{ top: 10, right: 12, bottom: 0, left: -20 }}><CartesianGrid vertical={false} stroke="#edf0f5" strokeDasharray="3 4" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#99a3b3', fontSize: 10 }} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#99a3b3', fontSize: 10 }} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="created" name="Opened" stroke="#2563eb" strokeWidth={2.5} fill="#2563eb20" /><Area type="monotone" dataKey="resolved" name="Resolved" stroke="#35b88a" strokeWidth={2.5} fill="#35b88a18" /></AreaChart></ResponsiveContainer></div></Panel></>
}

function CreateComplaint({ onSubmit }) { return <><PageHeading eyebrow="SERVICE DESK" title="Create a complaint" subtitle="Tell us what needs attention and our team will take it from there." /><Panel className="max-w-3xl p-5 sm:p-7"><ComplaintForm onSubmit={onSubmit} /></Panel></> }

function ComplaintForm({ onSubmit, compact = false }) {
  const [building, setBuilding] = useState('Science Hall')
  return <form onSubmit={onSubmit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><TextField label="Request title" placeholder="e.g. Projector not turning on" required /><SelectField label="Category" options={['HVAC & ventilation', 'Electrical', 'Plumbing', 'IT & AV equipment', 'Cleaning', 'Other']} /></div>{!compact && <div className="grid gap-4 sm:grid-cols-2"><SelectField label="Building" value={building} onChange={event => setBuilding(event.target.value)} options={buildings.map(item => item.name)} /><SelectField label="Room" options={rooms.filter(room => room.building === building).map(room => room.name)} /></div>}<div className="grid gap-4 sm:grid-cols-2"><SelectField label="Priority" options={['Normal', 'High', 'Urgent']} /><TextField label="Contact email" placeholder="name@university.edu" type="email" required /></div><TextField label="Description" placeholder="Describe the issue and when you first noticed it..." multiline required /><div className="flex flex-wrap items-center justify-between gap-3 pt-1"><span className="flex items-center gap-1.5 text-[10px] text-slate-400"><AlertCircle size={13} />Urgent issues are reviewed immediately.</span><Button type="submit" icon={Plus}>Submit request</Button></div></form>
}