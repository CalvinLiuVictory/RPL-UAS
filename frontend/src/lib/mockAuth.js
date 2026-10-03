const SESSION_KEY = 'campuscare-demo-user'

const accounts = [
  { username: 'admin', email: 'admin@campuscare.com', password: 'password123', name: 'Admin CampusCare', role: 'admin' },
  { username: 'teknisi1', email: 'teknisi1@campuscare.com', password: 'password123', name: 'Teknisi Satu', role: 'technician' },
  { username: 'user1', aliases: ['reporter'], email: 'user1@campuscare.com', password: 'password123', name: 'Mahasiswa Pelapor 1', role: 'user' },
  { username: 'avery.morgan', email: 'avery.morgan@north.edu', password: 'campus123', name: 'Avery Morgan', role: 'admin' },
  { username: 'alex.rivera', email: 'alex.rivera@north.edu', password: 'campus123', name: 'Alex Rivera', role: 'technician' },
  { username: 'jordan.lee', aliases: ['reporter'], email: 'jordan.lee@north.edu', password: 'campus123', name: 'Jordan Lee', role: 'user' },
]

export function authenticateMock(identifier, password) {
  const normalizedIdentifier = identifier.trim().toLowerCase()
  const account = accounts.find(user => (user.username === normalizedIdentifier || user.email === normalizedIdentifier || user.aliases?.includes(normalizedIdentifier)) && user.password === password)
  if (!account) return null
  return { username: account.username, email: account.email, name: account.name, role: account.role }
}

export function getMockSession() {
  const username = window.localStorage.getItem(SESSION_KEY)
  const account = accounts.find(user => user.username === username)
  return account ? { username: account.username, email: account.email, name: account.name, role: account.role } : null
}

export function saveMockSession(username) {
  window.localStorage.setItem(SESSION_KEY, username)
}

export function clearMockSession() {
  window.localStorage.removeItem(SESSION_KEY)
}
