const fs = require('fs');

// 1. Remove default credentials from LoginPage.tsx
let login = fs.readFileSync('/app/src/pages/LoginPage.tsx', 'utf8');
login = login.replace(/useState\("admin@soc\.local"\)/, 'useState("")');
login = login.replace(/useState\("Admin123!"\)/, 'useState("")');
fs.writeFileSync('/app/src/pages/LoginPage.tsx', login);
console.log('LoginPage.tsx - default credentials removed');

// 2. Add edit user modal to UsersPage.tsx
let u = fs.readFileSync('/app/src/pages/UsersPage.tsx', 'utf8');

// Add state for edit modal
const editState = `
  const [editUser, setEditUser] = useState<any>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState('');
`;

if (!u.includes('editUser')) {
  u = u.replace('const [showForm', editState + '\n  const 
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

[System.IO.File]::WriteAllText(
  (Join-Path (Get-Location) "fix2_login.js"),
  @'
const fs = require('fs');
let login = fs.readFileSync('/app/src/pages/LoginPage.tsx', 'utf8');
login = login.replace(/useState\("admin@soc\.local"\)/, 'useState("")');
login = login.replace(/useState\("Admin123!"\)/, 'useState("")');
fs.writeFileSync('/app/src/pages/LoginPage.tsx', login);
console.log('LoginPage default credentials removed');