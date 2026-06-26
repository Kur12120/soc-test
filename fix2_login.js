const fs = require('fs');
let login = fs.readFileSync('/app/src/pages/LoginPage.tsx', 'utf8');
login = login.replace(/useState\("admin@soc\.local"\)/, 'useState("")');
login = login.replace(/useState\("Admin123!"\)/, 'useState("")');
fs.writeFileSync('/app/src/pages/LoginPage.tsx', login);
console.log('LoginPage default credentials removed');