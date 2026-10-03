import { useState, useEffect, useMemo } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Activity, AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Building2,
  CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock3,
  ClipboardCheck, DoorOpen, Download, Eye, EyeOff, FileBarChart2, Filter, Hammer,
  LayoutDashboard, LifeBuoy, ListFilter, Lock, LogOut, Mail, Menu, MoreHorizontal, Plus,
  Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Trash2, UserCheck, Users, Wrench, X
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Button, EmptyState, Modal, PageHeading, Panel, SelectField, TextField } from './components/UI.jsx'
import logo from './assets/LOGO.png'
import authService from './services/authService.js'
import complaintService from './services/complaintService.js'
import masterService from './services/masterService.js'
import dashboardService from './services/dashboardService.js'
import './App.css'

// Navigasi menu per role
const roleNavigation = {
  admin: [
    { label: 'Overview', items: [['Dashboard', '/admin/dashboard', LayoutDashboard]] },
    { label: 'Campus directory', items: [['Users', '/admin/users', Users], ['Buildings', '/admin/buildings', Building2], ['Rooms', '/admin/rooms', DoorOpen], ['Devices', '/admin/devices', Settings2]] },
    { label: 'Operations', items: [['Complaints', '/admin/complaints', LifeBuoy], ['Reports', '/admin/reports', FileBarChart2]] },
  ],
  teknisi: [
    { label: 'Workspace', items: [['Dashboard', '/teknisi/dashboard', LayoutDashboard], ['Service tasks', '/teknisi/service-tasks', ClipboardCheck]] },
    { label: 'Field work', items: [['Repair queue', '/teknisi/repair', Hammer], ['Task history', '/teknisi/task-history', Clock3]] },
  ],
  technician: [
    { label: 'Workspace', items: [['Dashboard', '/technician/dashboard', LayoutDashboard], ['Service tasks', '/technician/service-tasks', ClipboardCheck]] },
    { label: 'Field work', items: [['Repair queue', '/technician/repair', Hammer], ['Task history', '/technician/task-history', Clock3]] },
  ],
  user: [
    { label: 'My workspace', items: [['Dashboard', '/user/dashboard', LayoutDashboard], ['Create complaint', '/user/create-complaint', Plus], ['My complaints', '/user/complaints', LifeBuoy], ['History', '/user/history', Clock3]] },
  ],
}

const roleNames = { admin: 'Administrator', teknisi: 'Technician', technician: 'Technician', user: 'Reporter' }

export function formatWIB(dateStr) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB'
  } catch {
    return dateStr || '-'
  }
}

function normalizeRole(r) {
  if (!r) return 'user'
  return r === 'technician' ? 'teknisi' : r
}

function rolePage(role, allowedRoles, page) {
  const normRole = normalizeRole(role)
  const normAllowed = allowedRoles.map(normalizeRole)
  return normAllowed.includes(normRole) ? page : <Navigate to={`/${role}/dashboard`} replace />
}

// Data statis grafik visual
const monthlyActivity = [
  { month: 'Jan', created: 4, resolved: 3 },
  { month: 'Feb', created: 7, resolved: 6 },
  { month: 'Mar', created: 5, resolved: 5 },
  { month: 'Apr', created: 9, resolved: 8 },
  { month: 'May', created: 12, resolved: 10 },
  { month: 'Jun', created: 8, resolved: 7 },
  { month: 'Jul', created: 6, resolved: 6 },
  { month: 'Aug', created: 11, resolved: 9 },
  { month: 'Sep', created: 14, resolved: 12 },
  { month: 'Oct', created: 10, resolved: 9 },
]

function App() {
  const [user, setUser] = useState(authService.getCurrentUser)
  const [validating, setValidating] = useState(Boolean(authService.getToken()))

  useEffect(() => {
    let isMounted = true
    const token = authService.getToken()
    if (token) {
      authService.getMe()
        .then((userData) => {
          if (isMounted) setUser(userData)
        })
        .catch(() => {
          if (isMounted) {
            authService.logout()
            setUser(null)
          }
        })
        .finally(() => {
          if (isMounted) setValidating(false)
        })
    } else {
      setValidating(false)
    }

    return () => { isMounted = false }
  }, [])

  const handleLogin = async (identifier, password) => {
    const res = await authService.login(identifier, password)
    setUser(res.user)
    return res.user
  }

  const handleLogout = async () => {
    await authService.logout()
    setUser(null)
  }

  if (validating) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f5f7fb]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
          <span className="text-xs font-semibold text-slate-500">Memulihkan sesi CampusCare...</span>
        </div>
      </div>
    )
  }

  const homePath = user ? `/${user.role}/dashboard` : '/login'

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={homePath} replace /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/" element={<Navigate to={homePath} replace />} />
        <Route path="/:role/*" element={user ? <RoleWorkspace user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={homePath} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function RoleWorkspace({ user, onLogout }) {
  const { role } = useParams()
  const location = useLocation()

  // Canonical role/URL alias: redirect /technician/* to /teknisi/*
  if (role === 'technician') {
    const canonicalPath = location.pathname.replace(/^\/technician/, '/teknisi') + location.search
    return <Navigate to={canonicalPath} replace />
  }

  const normParamRole = normalizeRole(role)
  const normUserRole = normalizeRole(user.role)

  if (normParamRole !== normUserRole) {
    return <Navigate to={`/${user.role}/dashboard`} replace />
  }

  return <Workspace user={user} onLogout={onLogout} activeRole={normUserRole} routeRole={normUserRole} />
}

function LoginPage({ onLogin }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const savedNotice = sessionStorage.getItem('auth_notice')
    if (savedNotice) {
      setNotice(savedNotice)
      sessionStorage.removeItem('auth_notice')
    }
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)

    try {
      await onLogin(identifier.trim(), password)
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Email atau password salah.')
      } else if (err.response?.status === 429) {
        setError('Terlalu banyak percobaan login. Silakan tunggu beberapa saat.')
      } else if (!err.response) {
        setError('Tidak dapat terhubung ke server.')
      } else {
        setError(err.response?.data?.message || 'Login gagal. Silakan coba kembali.')
      }
    } finally {
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
            <span className="login-kicker">NORTH CAMPUS OPERATIONS</span>
            <h1>Spaces ready for learning.</h1>
            <p>One place for campus requests, maintenance work, and facilities updates.</p>

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

          {notice && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800" role="alert">
              <AlertCircle size={16} className="shrink-0 text-amber-600" />
              <span>{notice}</span>
            </div>
          )}

          {error && (
            <div className="login-error-banner" role="alert">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={submit}>
            <div className="login-input-group">
              <label htmlFor="login-identifier">Email</label>
              <div className="login-input-wrap">
                <Mail size={16} className="login-input-icon" />
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={e => { setIdentifier(e.target.value); setError('') }}
                  placeholder="contoh: user@campuscare.com"
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
                  onChange={e => { setPassword(e.target.value); setError('') }}
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
                  <span>Menghubungkan ke server...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Akun</span>
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

function Workspace({ user, onLogout, activeRole, routeRole }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')

  const navKey = roleNavigation[activeRole] ? activeRole : 'user'
  const navGroups = roleNavigation[navKey] || []
  const allNavItems = navGroups.flatMap(group => group.items)
  const currentItem = allNavItems.find(([, path]) => location.pathname === path || location.pathname.startsWith(`${path}/`))
  const pageTitle = currentItem?.[0] ?? (location.pathname.includes('/complaints/') ? 'Complaint detail' : 'Dashboard')

  const notify = (msg) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 3500)
  }

  const rolePrefix = `/${routeRole}`

  return (
    <div className="app-shell flex bg-[#f5f7fb]">
      <aside className={`sidebar fixed inset-y-0 left-0 z-30 flex flex-col border-r border-[#e9edf4] bg-white px-3 pb-4 pt-5 transition-all sm:relative sm:translate-x-0 ${mobileOpen ? 'mobile-open' : '-translate-x-full sm:translate-x-0'}`}>
        <div className="mb-8 flex items-center gap-3 px-2">
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#e9edf4] bg-white p-1.5">
            <img src={logo} alt="CampusCare" className="size-full object-contain" />
          </span>
          <div className="brand-word">
            <div className="font-display text-[15px] font-extrabold tracking-[-.4px] text-[#17243a]">CampusCare</div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[1.1px] text-slate-400">Facilities hub</div>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-2">
          <div className="mb-1 px-1 text-[10px] font-bold uppercase tracking-[1px] text-slate-400 sidebar-label">Workspace</div>
          <div className="px-2 py-2 text-xs font-bold text-slate-700">{roleNames[activeRole] || 'User'} workspace</div>
        </div>

        <nav className="nav-scroll flex-1 space-y-5 overflow-y-auto">
          {navGroups.map(group => (
            <div key={group.label}>
              <div className="sidebar-section mb-2 px-3 text-[10px] font-bold uppercase tracking-[1.1px] text-slate-400">{group.label}</div>
              <div className="space-y-1">
                {group.items.map(([label, path, Icon]) => {
                  const resolvedPath = path.replace(`/${activeRole}`, rolePrefix)
                  return (
                    <NavLink
                      key={path}
                      to={resolvedPath}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) => `sidebar-link group flex items-center gap-3 rounded-lg px-3 py-[10px] text-[13px] font-semibold transition-colors ${isActive || (path.endsWith('/complaints') && location.pathname.startsWith(`${resolvedPath}/`)) ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                    >
                      <Icon size={17} strokeWidth={1.9} />
                      <span className="sidebar-label flex-1">{label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-4 rounded-xl bg-[#f3f7ff] p-3 sidebar-label">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700"><Sparkles size={15} className="text-blue-600" /> Campus operations</div>
          <p className="mb-2 mt-1 text-[11px] leading-4 text-slate-500">Keeping every space ready for learning.</p>
        </div>

        <div className="mt-4 flex items-center gap-2.5 border-t border-slate-100 px-1 pt-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800">
            {user.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
          </div>
          <div className="profile-copy min-w-0 flex-1">
            <div className="truncate text-xs font-bold text-slate-700">{user.name}</div>
            <div className="truncate text-[10px] text-slate-400">{roleNames[activeRole]}</div>
          </div>
        </div>
      </aside>

      <main className="main-area flex min-h-screen flex-1 flex-col">
        <div className="flex h-10 shrink-0 items-center justify-end border-b border-[#e9edf4] bg-white px-4 sm:px-7">
          <button type="button" onClick={onLogout} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors">
            <LogOut size={15} /> Sign out
          </button>
        </div>

        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#e9edf4] bg-white/95 px-4 backdrop-blur sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button aria-label="Open navigation" onClick={() => setMobileOpen(!mobileOpen)} className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 sm:hidden">
              <Menu size={19} />
            </button>
            <div className="hidden items-center gap-2 text-xs text-slate-400 md:flex">
              <span>Campus operations</span>
              <ChevronRight size={13} />
              <span className="font-semibold text-slate-600">{pageTitle}</span>
            </div>
            <div className="font-display text-sm font-bold text-slate-800 md:hidden">{pageTitle}</div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <label className="hidden h-9 w-56 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-emerald-400 md:flex">
              <Search size={15} className="text-slate-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search anything..." className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400" />
            </label>
            <div className="grid size-8 place-items-center rounded-full bg-emerald-100 text-[11px] font-extrabold text-emerald-800">
              {user.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
            </div>
          </div>
        </header>

        <div className="page-content page-enter w-full flex-1 px-4 py-6 sm:px-7 sm:py-7">
          <Routes>
            <Route path="dashboard" element={<Dashboard role={activeRole} currentUser={user} onAction={() => activeRole === 'teknisi' ? navigate(`${rolePrefix}/service-tasks`) : activeRole === 'admin' ? navigate(`${rolePrefix}/complaints`) : navigate(`${rolePrefix}/create-complaint`)} />} />

            {/* Admin CRUD Master Data */}
            <Route path="users" element={rolePage(activeRole, ['admin'], <DirectoryUsers query={query} onNotify={notify} />)} />
            <Route path="buildings" element={rolePage(activeRole, ['admin'], <DirectoryBuildings query={query} onNotify={notify} />)} />
            <Route path="rooms" element={rolePage(activeRole, ['admin'], <DirectoryRooms query={query} onNotify={notify} />)} />
            <Route path="devices" element={rolePage(activeRole, ['admin'], <DirectoryDevices query={query} onNotify={notify} />)} />

            {/* Complaints Management */}
            <Route path="complaints" element={<ComplaintsPage role={activeRole} currentUser={user} query={query} onNotify={notify} onAdd={activeRole === 'user' ? () => navigate(`${rolePrefix}/create-complaint`) : undefined} />} />
            <Route path="complaints/:id" element={<ComplaintDetail role={activeRole} currentUser={user} onNotify={notify} />} />

            {/* Technician tasks */}
            <Route path="service-tasks" element={rolePage(activeRole, ['teknisi'], <ComplaintsPage role={activeRole} currentUser={user} query={query} onNotify={notify} customTitle="Service tasks" customSubtitle="Assigned maintenance and repair tasks." />)} />
            <Route path="repair" element={rolePage(activeRole, ['teknisi'], <ComplaintsPage role={activeRole} currentUser={user} query={query} onNotify={notify} customTitle="Repair queue" customSubtitle="Active tasks being repaired." filterStatus="Diproses" />)} />
            <Route path="task-history" element={rolePage(activeRole, ['teknisi'], <ComplaintsPage role={activeRole} currentUser={user} query={query} onNotify={notify} history customTitle="Task history" customSubtitle="Completed service work." />)} />

            {/* User create & history */}
            <Route path="create-complaint" element={rolePage(activeRole, ['user'], <CreateComplaint onCreated={() => { notify('Pengaduan berhasil dibuat!'); navigate(`${rolePrefix}/complaints`) }} />)} />
            <Route path="history" element={rolePage(activeRole, ['admin', 'user'], <ComplaintsPage role={activeRole} currentUser={user} query={query} history onNotify={notify} />)} />

            <Route path="reports" element={rolePage(activeRole, ['admin'], <ReportsPage />)} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </main>

      {notice && (
        <div role="status" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl animate-bounce">
          <CheckCircle2 size={17} className="text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}
    </div>
  )
}

function Dashboard({ role, currentUser, onAction }) {
  const isAdmin = role === 'admin'
  const isTech = role === 'teknisi'
  const [stats, setStats] = useState(null)
  const [recentRows, setRecentRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    Promise.allSettled([
      dashboardService.getStats(),
      complaintService.getComplaints(),
    ]).then(([statsRes, complaintsRes]) => {
      if (!isMounted) return
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value?.stats || {})
      }
      if (complaintsRes.status === 'fulfilled') {
        const raw = complaintsRes.value || []
        const formatted = raw.slice(0, 5).map(item => ({
          id: `REQ-${item.id}`,
          dbId: item.id,
          title: item.perangkat?.nama_perangkat || item.deskripsi,
          location: item.perangkat?.ruangan ? `${item.perangkat.ruangan.gedung?.nama_gedung || ''} · ${item.perangkat.ruangan.nama_ruangan || ''}` : 'Kampus',
          reporter: item.user?.name || 'Pelapor',
          assignee: item.teknisi?.name || 'Belum ditugaskan',
          priority: 'Normal',
          status: item.status || 'Menunggu',
          updated: item.updated_at ? new Date(item.updated_at).toLocaleDateString('id-ID') : 'Hari ini',
        }))
        setRecentRows(formatted)
      }
    }).finally(() => {
      if (isMounted) setLoading(false)
    })

    return () => { isMounted = false }
  }, [role])

  const statCards = useMemo(() => {
    if (isAdmin) {
      return [
        ['Open complaints', String(stats?.open_complaints ?? 0), 'aktif', 'Menunggu proses', LifeBuoy, 'blue'],
        ['In progress', String(stats?.in_progress ?? 0), 'aktif', 'Ditangani teknisi', Wrench, 'amber'],
        ['Resolved', String(stats?.resolved_complaints ?? 0), 'total', 'Selesai diperbaiki', CheckCircle2, 'green'],
        ['Devices', `${stats?.good_devices ?? 0}/${stats?.total_devices ?? 0}`, 'bagus', 'Kondisi inventaris', Building2, 'violet'],
      ]
    }
    if (isTech) {
      return [
        ['Assigned to me', String(stats?.assigned_tasks ?? 0), 'total', 'Tugas diberikan', ClipboardCheck, 'blue'],
        ['In progress', String(stats?.in_progress ?? 0), 'aktif', 'Sedang diperbaiki', CalendarDays, 'amber'],
        ['Completed', String(stats?.completed ?? 0), 'selesai', 'Telah dirampungkan', CheckCircle2, 'green'],
        ['Pending work', String((stats?.assigned_tasks ?? 0) - (stats?.completed ?? 0)), 'sisa', 'Menunggu selesai', Clock3, 'violet'],
      ]
    }
    return [
      ['My open requests', String(stats?.open_requests ?? 0), 'tiket', 'Menunggu tanggapan', LifeBuoy, 'blue'],
      ['In progress', String(stats?.in_progress ?? 0), 'proses', 'Sedang ditangani', Activity, 'amber'],
      ['Resolved', String(stats?.resolved ?? 0), 'selesai', 'Selesai diperbaiki', CheckCircle2, 'green'],
      ['Total requests', String(stats?.my_complaints ?? 0), 'total', 'Riwayat pengaduan', Clock3, 'violet'],
    ]
  }, [isAdmin, isTech, stats])

  return (
    <>
      <PageHeading
        eyebrow="CAMPUSCARE OVERVIEW"
        title={`Selamat datang, ${currentUser.name.split(' ')[0]}`}
        subtitle="Berikut adalah ringkasan operasional dan pemeliharaan fasilitas kampus terkini."
        action={
          <Button onClick={onAction} icon={isTech ? ClipboardCheck : isAdmin ? LifeBuoy : Plus}>
            {isTech ? 'Lihat tugas perbaikan' : isAdmin ? 'Kelola pengaduan' : 'Buat pengaduan baru'}
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(([label, value, trend, note, Icon, color], index) => (
          <Panel key={label} className="metric-card page-enter p-4 sm:p-5" style={{ animationDelay: `${index * 45}ms` }}>
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold text-slate-500">{label}</span>
              <span className={`grid size-9 place-items-center rounded-xl ${color === 'blue' ? 'bg-blue-50 text-blue-600' : color === 'amber' ? 'bg-amber-50 text-amber-600' : color === 'green' ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600'}`}>
                <Icon size={17} />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-[26px] font-extrabold tracking-[-1px] text-slate-800">{value}</span>
              <span className="flex items-center text-[10px] font-bold text-emerald-600">{trend}</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-400">{note}</div>
          </Panel>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Panel className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm font-extrabold text-slate-800">Aktivitas Pemeliharaan</h2>
              <p className="mt-1 text-[11px] text-slate-400">Tren pengaduan masuk dan perbaikan terselesaikan tahun ini</p>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyActivity} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="createdFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.17} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resolvedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#35b88a" stopOpacity={0.13} />
                    <stop offset="95%" stopColor="#35b88a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#edf0f5" strokeDasharray="3 4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#99a3b3', fontSize: 10 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#99a3b3', fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="created" name="Masuk" stroke="#2563eb" strokeWidth={2.5} fill="url(#createdFill)" />
                <Area type="monotone" dataKey="resolved" name="Selesai" stroke="#35b88a" strokeWidth={2.5} fill="url(#resolvedFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-5 text-[10px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-blue-600" />Pengaduan Masuk</span>
            <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-emerald-500" />Selesai Dikerjakan</span>
          </div>
        </Panel>

        <Panel className="p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="font-display text-sm font-extrabold text-slate-800">Distribusi Kategori</h2>
              <p className="mt-1 text-[11px] text-slate-400">Ringkasan pengaduan berdasarkan bidang fasilitas</p>
            </div>
          </div>
          <div className="space-y-[17px]">
            {[
              ['HVAC & Pendingin Ruangan', 40, '#2563eb'],
              ['Kelistrikan & Daya', 25, '#f2a93b'],
              ['Jaringan Komputer & IoT', 20, '#8974e8'],
              ['Fasilitas Umum & Sanitasi', 15, '#30b98a'],
            ].map(([label, value, color]) => (
              <div key={label}>
                <div className="mb-1.5 flex justify-between text-[11px]">
                  <span className="font-medium text-slate-600">{label}</span>
                  <span className="font-bold text-slate-700">{value}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div>
            <h2 className="font-display text-sm font-extrabold text-slate-800">
              {isTech ? 'Tugas Aktif Anda' : isAdmin ? 'Pengaduan Kampus Terbaru' : 'Pengaduan Terakhir Anda'}
            </h2>
            <p className="mt-1 text-[11px] text-slate-400">Daftar transaksi pengaduan fasilitas terbaru dari database.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={onAction}>
            Lihat semua <ArrowRight size={14} />
          </Button>
        </div>
        {loading ? (
          <div className="flex justify-center p-8"><div className="size-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /></div>
        ) : (
          <TaskTable rows={recentRows} showReporter={isAdmin} compact />
        )}
      </Panel>
    </>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="mb-1 font-bold text-slate-700">{label}</div>
      {payload.map(item => (
        <div key={item.dataKey} className="flex items-center gap-2 text-slate-500">
          <i className="size-2 rounded-full" style={{ background: item.color }} />
          {item.name}: <b className="text-slate-700">{item.value}</b>
        </div>
      ))}
    </div>
  )
}

// -------------------------------------------------------------
// DIRECTORY PAGES (CRUD ADMIN): USERS, BUILDINGS, ROOMS, DEVICES
// -------------------------------------------------------------
function DirectoryUsers({ query, onNotify }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' })
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = () => {
    setLoading(true)
    masterService.getUsers()
      .then(res => setRows(Array.isArray(res) ? res : []))
      .catch(err => onNotify(err.response?.data?.message || 'Gagal memuat daftar users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSubmitting(true)
    try {
      await masterService.createUser(formData)
      setModalOpen(false)
      setFormData({ name: '', email: '', password: '', role: 'user' })
      onNotify('User baru berhasil ditambahkan!')
      fetchUsers()
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan user.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus user "${name}"?`)) return
    try {
      await masterService.deleteUser(id)
      onNotify('User berhasil dihapus.')
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus user.')
    }
  }

  const filtered = rows.filter(r => JSON.stringify(r).toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <PageHeading
        eyebrow="MASTER DATA"
        title="Users Management"
        subtitle="Kelola seluruh akun kampus (Admin, Teknisi, Mahasiswa/Pelapor)."
        action={<Button onClick={() => setModalOpen(true)} icon={Plus}>Add User</Button>}
      />
      <Panel>
        {loading ? (
          <div className="flex justify-center p-12"><div className="size-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /></div>
        ) : (
          <div className="table-wrap">
            <table className="w-full text-left">
              <thead>
                <tr>
                  {['Name', 'Email', 'Role', 'Created', ''].map(label => (
                    <th key={label} className="bg-slate-50/70 px-4 py-3 text-[10px] font-bold uppercase tracking-[.7px] text-slate-400">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 text-xs font-bold text-slate-700">{row.name}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">{row.email}</td>
                    <td className="px-4 py-3.5 text-xs"><Badge value={row.role} /></td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-400">{row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID') : '-'}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button onClick={() => handleDelete(row.id, row.name)} title="Delete user" className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && <EmptyState title="Tidak ada user ditemukan" description="Coba ubah kata kunci pencarian atau tambah user baru." />}
          </div>
        )}
      </Panel>

      <Modal open={modalOpen} title="Tambah User Baru" onClose={() => setModalOpen(false)}>
        {errorMsg && <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700">{errorMsg}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <TextField label="Nama Lengkap" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <TextField label="Email Kampus" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
          <TextField label="Password (Min. 8 karakter)" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
          <SelectField label="Role Akses" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} options={['admin', 'teknisi', 'user']} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan User'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function DirectoryBuildings({ query, onNotify }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({ kode_gedung: '', nama_gedung: '', keterangan: '' })
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchBuildings = () => {
    setLoading(true)
    masterService.getBuildings()
      .then(res => setRows(Array.isArray(res) ? res : []))
      .catch(err => onNotify(err.response?.data?.message || 'Gagal memuat gedung'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBuildings() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSubmitting(true)
    try {
      await masterService.createBuilding(formData)
      setModalOpen(false)
      setFormData({ kode_gedung: '', nama_gedung: '', keterangan: '' })
      onNotify('Gedung baru berhasil ditambahkan!')
      fetchBuildings()
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan gedung.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus gedung "${name}"?`)) return
    try {
      await masterService.deleteBuilding(id)
      onNotify('Gedung berhasil dihapus.')
      fetchBuildings()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus gedung. Pastikan gedung tidak memiliki ruangan aktif.')
    }
  }

  const filtered = rows.filter(r => JSON.stringify(r).toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <PageHeading
        eyebrow="MASTER DATA"
        title="Buildings Management"
        subtitle="Daftar gedung perkuliahan dan laboratorium kampus."
        action={<Button onClick={() => setModalOpen(true)} icon={Plus}>Add Building</Button>}
      />
      <Panel>
        {loading ? (
          <div className="flex justify-center p-12"><div className="size-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /></div>
        ) : (
          <div className="table-wrap">
            <table className="w-full text-left">
              <thead>
                <tr>
                  {['Kode', 'Nama Gedung', 'Keterangan', 'Jumlah Ruangan', ''].map(label => (
                    <th key={label} className="bg-slate-50/70 px-4 py-3 text-[10px] font-bold uppercase tracking-[.7px] text-slate-400">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 text-xs font-mono font-bold text-slate-700">{row.kode_gedung}</td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">{row.nama_gedung}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{row.keterangan || '-'}</td>
                    <td className="px-4 py-3.5 text-xs font-bold text-slate-600">{row.ruangans?.length ?? row.ruangans_count ?? '-'} ruangan</td>
                    <td className="px-4 py-3.5 text-right">
                      <button onClick={() => handleDelete(row.id, row.nama_gedung)} title="Delete building" className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && <EmptyState title="Tidak ada gedung ditemukan" description="Coba ubah kata kunci pencarian atau tambah gedung baru." />}
          </div>
        )}
      </Panel>

      <Modal open={modalOpen} title="Tambah Gedung Baru" onClose={() => setModalOpen(false)}>
        {errorMsg && <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700">{errorMsg}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <TextField label="Kode Gedung (mis. GDG-C)" value={formData.kode_gedung} onChange={e => setFormData({ ...formData, kode_gedung: e.target.value })} required />
          <TextField label="Nama Gedung" value={formData.nama_gedung} onChange={e => setFormData({ ...formData, nama_gedung: e.target.value })} required />
          <TextField label="Keterangan / Fungsi Gedung" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} multiline />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Gedung'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function DirectoryRooms({ query, onNotify }) {
  const [rows, setRows] = useState([])
  const [buildings, setBuildings] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({ gedung_id: '', nama_ruangan: '' })
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchRooms = () => {
    setLoading(true)
    Promise.all([masterService.getRooms(), masterService.getBuildings()])
      .then(([roomsRes, buildingsRes]) => {
        setRows(Array.isArray(roomsRes) ? roomsRes : [])
        const bList = Array.isArray(buildingsRes) ? buildingsRes : []
        setBuildings(bList)
        if (bList.length > 0 && !formData.gedung_id) {
          setFormData(prev => ({ ...prev, gedung_id: String(bList[0].id) }))
        }
      })
      .catch(err => onNotify(err.response?.data?.message || 'Gagal memuat data ruangan'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRooms() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSubmitting(true)
    try {
      await masterService.createRoom(formData)
      setModalOpen(false)
      setFormData(prev => ({ ...prev, nama_ruangan: '' }))
      onNotify('Ruangan baru berhasil ditambahkan!')
      fetchRooms()
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan ruangan.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus ruangan "${name}"?`)) return
    try {
      await masterService.deleteRoom(id)
      onNotify('Ruangan berhasil dihapus.')
      fetchRooms()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus ruangan.')
    }
  }

  const filtered = rows.filter(r => JSON.stringify(r).toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <PageHeading
        eyebrow="MASTER DATA"
        title="Rooms Management"
        subtitle="Daftar ruangan kelas, laboratorium, dan kantor di tiap gedung."
        action={<Button onClick={() => setModalOpen(true)} icon={Plus}>Add Room</Button>}
      />
      <Panel>
        {loading ? (
          <div className="flex justify-center p-12"><div className="size-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /></div>
        ) : (
          <div className="table-wrap">
            <table className="w-full text-left">
              <thead>
                <tr>
                  {['Nama Ruangan', 'Gedung', 'Created', ''].map(label => (
                    <th key={label} className="bg-slate-50/70 px-4 py-3 text-[10px] font-bold uppercase tracking-[.7px] text-slate-400">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 text-xs font-bold text-slate-700">{row.nama_ruangan}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">{row.gedung?.nama_gedung || '-'}</td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-400">{row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID') : '-'}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button onClick={() => handleDelete(row.id, row.nama_ruangan)} title="Delete room" className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && <EmptyState title="Tidak ada ruangan ditemukan" description="Tambah ruangan baru ke salah satu gedung kampus." />}
          </div>
        )}
      </Panel>

      <Modal open={modalOpen} title="Tambah Ruangan Baru" onClose={() => setModalOpen(false)}>
        {errorMsg && <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700">{errorMsg}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <SelectField
            label="Pilih Gedung Lokasi"
            value={formData.gedung_id}
            onChange={e => setFormData({ ...formData, gedung_id: e.target.value })}
            options={buildings.map(b => ({ value: b.id, label: `${b.nama_gedung} (${b.kode_gedung})` }))}
          />
          <TextField label="Nama Ruangan (mis. Lab Komputer 201)" value={formData.nama_ruangan} onChange={e => setFormData({ ...formData, nama_ruangan: e.target.value })} required />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Ruangan'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function DirectoryDevices({ query, onNotify }) {
  const [rows, setRows] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({ ruangan_id: '', kode_aset: '', nama_perangkat: '', status: 'Bagus' })
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchDevices = () => {
    setLoading(true)
    Promise.all([masterService.getDevices(), masterService.getRooms()])
      .then(([devRes, roomRes]) => {
        setRows(Array.isArray(devRes) ? devRes : [])
        const rList = Array.isArray(roomRes) ? roomRes : []
        setRooms(rList)
        if (rList.length > 0 && !formData.ruangan_id) {
          setFormData(prev => ({ ...prev, ruangan_id: String(rList[0].id) }))
        }
      })
      .catch(err => onNotify(err.response?.data?.message || 'Gagal memuat perangkat'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDevices() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSubmitting(true)
    try {
      await masterService.createDevice(formData)
      setModalOpen(false)
      setFormData(prev => ({ ...prev, kode_aset: '', nama_perangkat: '', status: 'Bagus' }))
      onNotify('Perangkat baru berhasil ditambahkan!')
      fetchDevices()
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan perangkat.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus perangkat "${name}"?`)) return
    try {
      await masterService.deleteDevice(id)
      onNotify('Perangkat berhasil dihapus.')
      fetchDevices()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus perangkat.')
    }
  }

  const filtered = rows.filter(r => JSON.stringify(r).toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <PageHeading
        eyebrow="MASTER DATA"
        title="Devices & Assets"
        subtitle="Inventaris seluruh perangkat keras dan fasilitas fisik kampus."
        action={<Button onClick={() => setModalOpen(true)} icon={Plus}>Add Device</Button>}
      />
      <Panel>
        {loading ? (
          <div className="flex justify-center p-12"><div className="size-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /></div>
        ) : (
          <div className="table-wrap">
            <table className="w-full text-left">
              <thead>
                <tr>
                  {['Kode Aset', 'Nama Perangkat', 'Ruangan & Gedung', 'Status Kondisi', ''].map(label => (
                    <th key={label} className="bg-slate-50/70 px-4 py-3 text-[10px] font-bold uppercase tracking-[.7px] text-slate-400">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 text-xs font-mono font-bold text-slate-700">{row.kode_aset}</td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">{row.nama_perangkat}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {row.ruangan ? `${row.ruangan.nama_ruangan} (${row.ruangan.gedung?.nama_gedung || ''})` : '-'}
                    </td>
                    <td className="px-4 py-3.5 text-xs"><Badge value={row.status} /></td>
                    <td className="px-4 py-3.5 text-right">
                      <button onClick={() => handleDelete(row.id, row.nama_perangkat)} title="Delete device" className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && <EmptyState title="Tidak ada perangkat ditemukan" description="Tambah perangkat baru ke salah satu ruangan." />}
          </div>
        )}
      </Panel>

      <Modal open={modalOpen} title="Tambah Perangkat Baru" onClose={() => setModalOpen(false)}>
        {errorMsg && <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700">{errorMsg}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <SelectField
            label="Pilih Ruangan Penempatan"
            value={formData.ruangan_id}
            onChange={e => setFormData({ ...formData, ruangan_id: e.target.value })}
            options={rooms.map(r => ({ value: r.id, label: `${r.nama_ruangan} · ${r.gedung?.nama_gedung || ''}` }))}
          />
          <TextField label="Kode Aset (mis. AST-B1-009)" value={formData.kode_aset} onChange={e => setFormData({ ...formData, kode_aset: e.target.value })} required />
          <TextField label="Nama Perangkat (mis. Proyektor Epson 4K)" value={formData.nama_perangkat} onChange={e => setFormData({ ...formData, nama_perangkat: e.target.value })} required />
          <SelectField label="Kondisi Awal" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} options={['Bagus', 'Rusak', 'Maintenance']} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Perangkat'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

// -------------------------------------------------------------
// COMPLAINTS MANAGEMENT & TICKETING
// -------------------------------------------------------------
function ComplaintsPage({ role, currentUser, query, history = false, onAdd, onNotify, customTitle, customSubtitle, filterStatus }) {
  const navigate = useNavigate()
  const [dataRows, setDataRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchComplaints = () => {
    setLoading(true)
    setError(null)
    complaintService.getComplaints()
      .then((data) => {
        const raw = Array.isArray(data) ? data : []
        const formatted = raw.map((item) => {
          const gedung = item.perangkat?.ruangan?.gedung?.nama_gedung || ''
          const ruangan = item.perangkat?.ruangan?.nama_ruangan || ''
          const locationStr = gedung && ruangan ? `${gedung} · ${ruangan}` : gedung || ruangan || 'Lokasi Kampus'
          const dateStr = item.updated_at
            ? new Date(item.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
            : 'Baru saja'

          return {
            id: `REQ-${item.id}`,
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
        setError(err.response?.data?.message || 'Gagal memuat data pengaduan dari server.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => { fetchComplaints() }, [role])

  let rows = dataRows
  if (history) {
    rows = rows.filter(item => ['Selesai', 'Resolved', 'Closed', 'Completed'].includes(item.status))
  } else if (filterStatus) {
    rows = rows.filter(item => item.status === filterStatus)
  }

  const filtered = rows.filter(row => JSON.stringify(row).toLowerCase().includes((query || '').toLowerCase()))

  const pageEyebrow = history ? 'PAST REQUESTS' : 'SERVICE DESK'
  const pageTitle = customTitle || (history ? 'Request history' : 'Complaints')
  const pageSubtitle = customSubtitle || (history ? 'Riwayat pengaduan yang telah selesai ditangani.' : 'Tinjau, tugaskan, dan pantau status perbaikan fasilitas kampus.')

  return (
    <>
      <PageHeading
        eyebrow={pageEyebrow}
        title={pageTitle}
        subtitle={pageSubtitle}
        action={onAdd && <Button onClick={onAdd} icon={Plus}>New complaint</Button>}
      />
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Total data:</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">{filtered.length} tiket</span>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchComplaints}>Refresh</Button>
        </div>

        {error && (
          <div className="m-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <div className="size-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent mb-2" />
            <span className="text-xs font-semibold">Memuat data tiket pengaduan...</span>
          </div>
        ) : (
          <TaskTable
            rows={filtered}
            showReporter={role === 'admin'}
            showAssignee={role !== 'teknisi'}
            onRowClick={row => navigate(`/${role}/complaints/${row.dbId}`)}
          />
        )}
      </Panel>
    </>
  )
}

function ComplaintDetail({ role, currentUser, onNotify }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)
  const [assignModal, setAssignModal] = useState(false)
  const [selectedTech, setSelectedTech] = useState('')
  const [statusModal, setStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('Diproses')
  const [techNotes, setTechNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchDetail = () => {
    setLoading(true)
    complaintService.getComplaints()
      .then((list) => {
        const found = (Array.isArray(list) ? list : []).find(item => String(item.id) === String(id))
        setComplaint(found || null)
        if (found) {
          setNewStatus(found.status === 'Menunggu' ? 'Diproses' : found.status)
          setTechNotes(found.catatan_teknisi || '')
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDetail()
    if (role === 'admin') {
      masterService.getUsers({ role: 'teknisi' })
        .then((res) => {
          const tList = Array.isArray(res) ? res : []
          setTechnicians(tList)
          if (tList.length > 0) setSelectedTech(String(tList[0].id))
        })
    }
  }, [id, role])

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!selectedTech) return
    setSubmitting(true)
    try {
      await complaintService.assignTechnician(id, selectedTech)
      onNotify('Teknisi berhasil ditugaskan!')
      setAssignModal(false)
      fetchDetail()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menugaskan teknisi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await complaintService.updateStatus(id, newStatus, techNotes)
      onNotify('Status pengaduan berhasil diperbarui!')
      setStatusModal(false)
      fetchDetail()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memperbarui status.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-12"><div className="size-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /></div>
  }

  if (!complaint) {
    return (
      <Panel className="p-8 text-center">
        <EmptyState title="Pengaduan tidak ditemukan" description="Tiket ini mungkin telah dihapus atau Anda tidak memiliki akses ke tiket ini." />
        <Button onClick={() => navigate(`/${role}/complaints`)}>Kembali ke daftar</Button>
      </Panel>
    )
  }

  const perangkat = complaint.perangkat
  const ruangan = perangkat?.ruangan
  const gedung = ruangan?.gedung

  return (
    <>
      <PageHeading
        eyebrow={`TIKET REQ-${complaint.id}`}
        title={perangkat?.nama_perangkat || 'Pengaduan Fasilitas'}
        subtitle={`${gedung?.nama_gedung || ''} · ${ruangan?.nama_ruangan || ''}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate(`/${role}/complaints`)}>Kembali</Button>
            {role === 'admin' && (
              <Button onClick={() => setAssignModal(true)} icon={UserCheck}>Assign Teknisi</Button>
            )}
            {(role === 'teknisi' || role === 'admin') && (
              <Button onClick={() => setStatusModal(true)} icon={Wrench}>Ubah Status</Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-display text-sm font-extrabold text-slate-800">Detail Laporan</h2>
              <span className="text-[11px] text-slate-400">Kode Aset: {perangkat?.kode_aset || '-'}</span>
            </div>
            <Badge value={complaint.status} />
          </div>

          <div className="mt-4">
            <h3 className="text-xs font-bold text-slate-600">Deskripsi Masalah:</h3>
            <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3.5 text-xs leading-5 text-slate-700">
              {complaint.deskripsi}
            </p>
          </div>

          {complaint.catatan_teknisi && (
            <div className="mt-4">
              <h3 className="text-xs font-bold text-slate-600">Catatan Teknisi:</h3>
              <p className="mt-1 whitespace-pre-wrap rounded-lg bg-emerald-50/60 border border-emerald-100 p-3.5 text-xs leading-5 text-emerald-950 font-medium">
                {complaint.catatan_teknisi}
              </p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs">
            <Detail label="Pelapor" value={complaint.user?.name || '-'} />
            <Detail label="Email Pelapor" value={complaint.user?.email || '-'} />
            <Detail label="Teknisi Ditugaskan" value={complaint.teknisi?.name || 'Belum ditugaskan'} />
            <Detail label="Status Perangkat" value={perangkat?.status || '-'} />
            <Detail label="Gedung" value={gedung?.nama_gedung || '-'} />
            <Detail label="Ruangan" value={ruangan?.nama_ruangan || '-'} />
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="font-display text-sm font-extrabold text-slate-800">Riwayat Status</h2>
          <div className="mt-5 space-y-5">
            {[
              ['Tiket Dibuat', `${complaint.user?.name || 'Pelapor'} membuat laporan ini`, complaint.created_at ? new Date(complaint.created_at).toLocaleDateString('id-ID') : 'Baru saja', CheckCircle2],
              ['Penugasan Teknisi', complaint.teknisi ? `${complaint.teknisi.name} ditugaskan` : 'Menunggu penugasan teknisi oleh admin', complaint.updated_at ? new Date(complaint.updated_at).toLocaleDateString('id-ID') : '-', Users],
              ['Status Pengerjaan', `Status saat ini: ${complaint.status}`, complaint.status === 'Selesai' ? 'Selesai diperbaiki' : 'Dalam pantauan', CalendarDays],
            ].map(([title, copy, date, Icon], index) => (
              <div className="flex gap-3" key={title}>
                <div className="flex flex-col items-center">
                  <span className={`grid size-8 place-items-center rounded-full ${index === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon size={15} />
                  </span>
                  {index < 2 && <span className="mt-1 h-6 w-px bg-slate-200" />}
                </div>
                <div className="pt-0.5">
                  <div className="text-xs font-bold text-slate-700">{title}</div>
                  <div className="mt-1 text-[11px] text-slate-500">{copy}</div>
                  <div className="mt-1 text-[10px] text-slate-400">{date}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Modal Assign Teknisi */}
      <Modal open={assignModal} title="Tugaskan Teknisi" onClose={() => setAssignModal(false)}>
        <form onSubmit={handleAssign} className="space-y-4">
          <SelectField
            label="Pilih Teknisi"
            value={selectedTech}
            onChange={e => setSelectedTech(e.target.value)}
            options={technicians.map(t => ({ value: t.id, label: `${t.name} (${t.email})` }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setAssignModal(false)}>Batal</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Tugaskan'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ubah Status */}
      <Modal open={statusModal} title="Perbarui Status & Catatan Pengerjaan" onClose={() => setStatusModal(false)}>
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <SelectField
            label="Status Pengaduan"
            value={newStatus}
            onChange={e => setNewStatus(e.target.value)}
            options={role === 'admin' ? ['Menunggu', 'Diproses', 'Selesai'] : ['Diproses', 'Selesai']}
          />
          <TextField
            label="Catatan Pemeriksaan / Perbaikan Teknisi"
            value={techNotes}
            onChange={e => setTechNotes(e.target.value)}
            placeholder="Jelaskan tindakan teknis, penggantian part, atau hasil pengujian..."
            multiline
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setStatusModal(false)}>Batal</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Status'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function TaskTable({ rows, showReporter = false, showAssignee = false, compact = false, onRowClick }) {
  if (!rows?.length) return <EmptyState title="Tidak ada pengaduan" description="Saat ini belum ada pengaduan yang sesuai dengan kriteria." />
  return (
    <div className="table-wrap">
      <table className="w-full text-left">
        <thead>
          <tr>
            {['Request', 'Location', ...(showReporter ? ['Reported by'] : []), ...(showAssignee ? ['Assigned to'] : []), 'Priority', 'Status', ...(compact ? [] : ['Updated']), ''].map(label => (
              <th key={label} className="bg-slate-50/70 px-4 py-3 text-[10px] font-bold uppercase tracking-[.7px] text-slate-400">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id} onClick={() => onRowClick?.(row)} className={`border-t border-slate-100 transition-colors hover:bg-slate-50/60 ${onRowClick ? 'cursor-pointer' : ''}`}>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${index % 3 === 0 ? 'bg-blue-50 text-blue-600' : index % 3 === 1 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Wrench size={15} />
                  </span>
                  <span>
                    <span className="block max-w-[240px] truncate text-xs font-bold text-slate-700">{row.title}</span>
                    <span className="mt-0.5 block text-[10px] text-slate-400">{row.id}</span>
                  </span>
                </div>
              </td>
              <td className="px-4 py-3.5 text-xs text-slate-500">{row.location}</td>
              {showReporter && <td className="px-4 py-3.5 text-xs text-slate-600 font-semibold">{row.reporter}</td>}
              {showAssignee && <td className="px-4 py-3.5 text-xs text-slate-600">{row.assignee}</td>}
              <td className="px-4 py-3.5"><Badge value={row.priority} /></td>
              <td className="px-4 py-3.5"><Badge value={row.status} /></td>
              {!compact && <td className="whitespace-nowrap px-4 py-3.5 text-[11px] text-slate-400">{row.updated}</td>}
              <td className="px-4 py-3.5 text-right"><ChevronRight size={16} className="text-slate-400" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[.5px] text-slate-400">{label}</div>
      <div className="font-semibold text-slate-700">{value}</div>
    </div>
  )
}

function CreateComplaint({ onCreated }) {
  return (
    <>
      <PageHeading
        eyebrow="SERVICE DESK"
        title="Create a complaint"
        subtitle="Laporkan kerusakan perangkat atau fasilitas kampus agar segera ditangani tim teknisi."
      />
      <Panel className="max-w-3xl p-5 sm:p-7">
        <ComplaintForm onCreated={onCreated} />
      </Panel>
    </>
  )
}

function ComplaintForm({ onCreated }) {
  const [devices, setDevices] = useState([])
  const [deviceId, setDeviceId] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('IT & AV equipment')
  const [priority, setPriority] = useState('Normal')
  const [description, setDescription] = useState('')
  const [loadingDevices, setLoadingDevices] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    complaintService.getDevices()
      .then((list) => {
        const dList = Array.isArray(list) ? list : []
        setDevices(dList)
        if (dList.length > 0) setDeviceId(String(dList[0].id))
      })
      .catch((err) => {
        setErrorMsg('Gagal memuat daftar perangkat. Pastikan koneksi backend aktif.')
      })
      .finally(() => setLoadingDevices(false))
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    if (!deviceId) {
      alert('Pilih perangkat yang rusak terlebih dahulu.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    // Susun deskripsi lengkap dengan kategori dan judul
    const fullDescription = `[${category} | Prioritas: ${priority}] ${title.trim()}: ${description.trim()}`

    try {
      await complaintService.createComplaint({
        perangkat_id: Number(deviceId),
        deskripsi: fullDescription,
      })
      onCreated?.()
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal mengirim pengaduan ke server.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {loadingDevices ? (
        <div className="flex items-center gap-2 p-3 text-xs text-slate-500">
          <div className="size-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <span>Memuat daftar perangkat inventaris...</span>
        </div>
      ) : (
        <SelectField
          label="Pilih Perangkat / Fasilitas yang Bermasalah"
          value={deviceId}
          onChange={e => setDeviceId(e.target.value)}
          options={devices.map(d => ({
            value: d.id,
            label: `[${d.kode_aset}] ${d.nama_perangkat} — (${d.ruangan?.gedung?.nama_gedung || ''} · ${d.ruangan?.nama_ruangan || ''}) [Kondisi: ${d.status}]`,
          }))}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Judul Laporan / Kerusakan"
          placeholder="e.g. PC tidak mau menyala / AC bocor"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <SelectField
          label="Kategori Fasilitas"
          value={category}
          onChange={e => setCategory(e.target.value)}
          options={['IT & AV equipment', 'HVAC & ventilation', 'Electrical', 'Plumbing', 'Cleaning', 'Other']}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Tingkat Prioritas"
          value={priority}
          onChange={e => setPriority(e.target.value)}
          options={['Normal', 'High', 'Urgent']}
        />
      </div>

      <TextField
        label="Rincian Deskripsi Kerusakan"
        placeholder="Jelaskan detail kendala, sejak kapan terjadi, dan indikasi kerusakan..."
        value={description}
        onChange={e => setDescription(e.target.value)}
        multiline
        required
      />

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <AlertCircle size={13} /> Laporan darurat akan segera ditinjau oleh tim operasional.
        </span>
        <Button type="submit" icon={Plus} disabled={submitting || loadingDevices}>
          {submitting ? 'Mengirim Pengaduan...' : 'Kirim Pengaduan'}
        </Button>
      </div>
    </form>
  )
}

function ReportsPage() {
  const [stats, setStats] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      dashboardService.getStats(),
      complaintService.getComplaints(),
    ]).then(([statsRes, compRes]) => {
      if (statsRes.status === 'fulfilled') setStats(statsRes.value)
      if (compRes.status === 'fulfilled') setComplaints(Array.isArray(compRes.value) ? compRes.value : [])
      setLoading(false)
    })
  }, [])

  const handleExportCSV = () => {
    if (!complaints.length) return
    const sanitizeCSV = (val) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).trim()
      if (/^[=+\-@\t\r]/.test(str)) {
        return `"'${str.replace(/"/g, '""')}"`
      }
      return `"${str.replace(/"/g, '""')}"`
    }

    const headers = ['ID', 'Tanggal (WIB)', 'Pelapor', 'Perangkat', 'Gedung', 'Ruangan', 'Status', 'Teknisi']
    const rows = complaints.map(c => [
      sanitizeCSV(c.id),
      sanitizeCSV(formatWIB(c.created_at)),
      sanitizeCSV(c.user?.name || '-'),
      sanitizeCSV(c.perangkat?.nama_perangkat || '-'),
      sanitizeCSV(c.perangkat?.ruangan?.gedung?.nama_gedung || '-'),
      sanitizeCSV(c.perangkat?.ruangan?.nama_ruangan || '-'),
      sanitizeCSV(c.status),
      sanitizeCSV(c.teknisi?.name || '-')
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `campuscare-laporan-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const total = stats?.total_pengaduan || complaints.length || 0
  const resolved = stats?.selesai || complaints.filter(c => c.status === 'Selesai').length || 0
  const inProgress = stats?.diproses || complaints.filter(c => c.status === 'Diproses').length || 0
  const waiting = stats?.menunggu || complaints.filter(c => c.status === 'Menunggu').length || 0
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0

  return (
    <>
      <PageHeading
        eyebrow="INSIGHTS & ANALYTICS"
        title="Laporan Operasional"
        subtitle="Performa layanan kampus, efektivitas penanganan, dan ringkasan data pengaduan live."
        action={
          <Button variant="secondary" icon={Download} onClick={handleExportCSV} disabled={complaints.length === 0}>
            Ekspor Laporan (CSV)
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="size-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Panel className="p-5">
              <div className="text-xs font-semibold text-slate-500">Tingkat Penyelesaian</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-slate-800">{resolutionRate}%</span>
                <span className="text-xs font-bold text-emerald-600">optimal</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">{resolved} dari {total} tiket selesai</div>
            </Panel>
            <Panel className="p-5">
              <div className="text-xs font-semibold text-slate-500">Sedang Dikerjakan</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-blue-700">{inProgress}</span>
                <span className="text-xs font-bold text-blue-600">dalam proses</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">Teknisi aktif di lapangan</div>
            </Panel>
            <Panel className="p-5">
              <div className="text-xs font-semibold text-slate-500">Menunggu Penugasan</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-amber-600">{waiting}</span>
                <span className="text-xs font-bold text-amber-600">antrean</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">Perlu ditugaskan admin</div>
            </Panel>
            <Panel className="p-5">
              <div className="text-xs font-semibold text-slate-500">Total Tiket Masuk</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-slate-900">{total}</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">Terkoneksi database Supabase</div>
            </Panel>
          </div>

          <Panel className="overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5 flex justify-between items-center">
              <h3 className="font-display text-sm font-bold text-slate-800">Daftar Pengaduan Terkini</h3>
              <span className="text-xs text-slate-400">{complaints.length} entri ditemukan</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Tanggal (WIB)</th>
                    <th className="px-4 py-3">Pelapor</th>
                    <th className="px-4 py-3">Perangkat</th>
                    <th className="px-4 py-3">Lokasi</th>
                    <th className="px-4 py-3">Teknisi</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {complaints.slice(0, 10).map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-semibold">#{c.id}</td>
                      <td className="px-4 py-3 text-slate-500">{formatWIB(c.created_at)}</td>
                      <td className="px-4 py-3 font-medium">{c.user?.name || '-'}</td>
                      <td className="px-4 py-3">{c.perangkat?.nama_perangkat || '-'}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {c.perangkat?.ruangan?.nama_ruangan} ({c.perangkat?.ruangan?.gedung?.kode_gedung})
                      </td>
                      <td className="px-4 py-3">{c.teknisi?.name || <span className="text-slate-400 italic">Belum ada</span>}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          c.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700' :
                          c.status === 'Diproses' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}
    </>
  )
}

export default App