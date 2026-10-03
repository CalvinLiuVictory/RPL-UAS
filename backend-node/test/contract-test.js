import assert from 'assert';

const NODE_URL = process.env.NODE_URL || 'http://localhost:8000/api';

console.log('====================================================');
console.log('      CAMPUSCARE NODE.JS API CONTRACT TEST SUITE     ');
console.log(`Target Backend: ${NODE_URL}`);
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function report(name, passed, details = '') {
  if (passed) {
    passCount++;
    console.log(`[PASS] ${name}`);
  } else {
    failCount++;
    console.error(`[FAIL] ${name} - ${details}`);
  }
}

async function request(path, options = {}) {
  const url = `${NODE_URL}${path}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, headers: res.headers, data };
}

async function runTests() {
  // 1. Health check
  const health = await request('/health');
  report('GET /api/health -> 200 OK', health.status === 200 && health.data.status === 'ok');

  // 2. Unauthenticated check
  const noToken = await request('/me');
  report('GET /api/me without token -> 401', noToken.status === 401 && noToken.data.message === 'Unauthenticated.');

  // 3. Login User
  const userLogin = await request('/login', {
    method: 'POST',
    body: { email: 'user1@campuscare.com', password: 'password123' }
  });
  report('POST /api/login (User) -> 200 OK with token', userLogin.status === 200 && Boolean(userLogin.data.access_token) && userLogin.data.user.role === 'user');
  const userToken = userLogin.data?.access_token;

  // 4. Login Admin
  const adminLogin = await request('/login', {
    method: 'POST',
    body: { email: 'admin@campuscare.com', password: 'password123' }
  });
  report('POST /api/login (Admin) -> 200 OK with token', adminLogin.status === 200 && Boolean(adminLogin.data.access_token) && adminLogin.data.user.role === 'admin');
  const adminToken = adminLogin.data?.access_token;

  // 5. Login Teknisi
  const tekLogin = await request('/login', {
    method: 'POST',
    body: { email: 'teknisi1@campuscare.com', password: 'password123' }
  });
  report('POST /api/login (Teknisi) -> 200 OK with token', tekLogin.status === 200 && Boolean(tekLogin.data.access_token) && tekLogin.data.user.role === 'teknisi');
  const tekToken = tekLogin.data?.access_token;

  // 6. User accessing admin route -> 403
  const userForbidden = await request('/users', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  report('User accessing GET /api/users -> 403 Forbidden', userForbidden.status === 403);

  // 7. Admin accessing GET /users -> 200 with Laravel-compatible pagination
  const adminUsers = await request('/users', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  report('Admin accessing GET /api/users -> 200 with pagination', adminUsers.status === 200 && Array.isArray(adminUsers.data.data) && typeof adminUsers.data.total === 'number');

  // 8. Public authenticated endpoints: /gedungs, /ruangans, /perangkats
  const gedungs = await request('/gedungs', { headers: { Authorization: `Bearer ${userToken}` } });
  report('GET /api/gedungs -> 200 Array', gedungs.status === 200 && Array.isArray(gedungs.data));

  const ruangans = await request('/ruangans', { headers: { Authorization: `Bearer ${userToken}` } });
  report('GET /api/ruangans -> 200 Array', ruangans.status === 200 && Array.isArray(ruangans.data));

  const perangkats = await request('/perangkats', { headers: { Authorization: `Bearer ${userToken}` } });
  report('GET /api/perangkats -> 200 Array', perangkats.status === 200 && Array.isArray(perangkats.data));

  // 9. Dashboard stats per role
  const adminDash = await request('/dashboard/stats', { headers: { Authorization: `Bearer ${adminToken}` } });
  report('GET /api/dashboard/stats (Admin) -> 200 Object', adminDash.status === 200 && typeof adminDash.data.stats?.total_complaints === 'number');

  const tekDash = await request('/dashboard/stats', { headers: { Authorization: `Bearer ${tekToken}` } });
  report('GET /api/dashboard/stats (Teknisi) -> 200 Object', tekDash.status === 200 && typeof tekDash.data.stats?.assigned_tasks === 'number');

  const userDash = await request('/dashboard/stats', { headers: { Authorization: `Bearer ${userToken}` } });
  report('GET /api/dashboard/stats (User) -> 200 Object', userDash.status === 200 && typeof userDash.data.stats?.my_complaints === 'number');

  // 10. Pengaduan role filtering
  const userComplaints = await request('/pengaduan', { headers: { Authorization: `Bearer ${userToken}` } });
  report('GET /api/pengaduan (User) -> 200 filtered to user tickets', userComplaints.status === 200 && Array.isArray(userComplaints.data) && userComplaints.data.every(c => c.user_id === 4));

  // 11. Single complaint detail & ownership check
  const singleComp = await request('/pengaduan/1', { headers: { Authorization: `Bearer ${userToken}` } });
  report('GET /api/pengaduan/1 (User owns) -> 200 Object', singleComp.status === 200 && singleComp.data.id === 1);

  const idorComp = await request('/pengaduan/2', { headers: { Authorization: `Bearer ${userToken}` } });
  report('GET /api/pengaduan/2 (User does not own) -> 404 IDOR protected', idorComp.status === 404);

  // 12. Non-existent route returns clean 404 JSON
  const nonExistent = await request('/random-endpoint-xyz');
  report('Undefined route -> 404 clean JSON without stack trace', nonExistent.status === 404 && nonExistent.data.message === 'Not Found');

  // 13. Logout
  const logoutRes = await request('/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  report('POST /api/logout -> 200 OK', logoutRes.status === 200 && logoutRes.data.message.toLowerCase().includes('logout'));

  // 14. Verify revoked token
  const afterLogout = await request('/me', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  report('GET /api/me with revoked token -> 401 Unauthenticated', afterLogout.status === 401);

  console.log('\n====================================================');
  console.log(`TOTAL PASS: ${passCount}`);
  console.log(`TOTAL FAIL: ${failCount}`);
  console.log('====================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Contract test execution failed:', err);
  process.exit(1);
});
