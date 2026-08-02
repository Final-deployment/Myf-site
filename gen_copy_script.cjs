const fs = require('fs');
const p = fs.readFileSync('payload.json', 'utf-8');
const code = `const token = localStorage.getItem('auth_token');
fetch('https://muslimyouth.ps/api/quizzes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
  body: JSON.stringify(${p})
}).then(r => r.json()).then(d => { 
  if(d.error) console.error('خطأ:', d.error); 
  else console.log('✅ تم نسخ الامتحان بنجاح إلى السيرفر الحي!'); 
}).catch(e => console.error(e));`;
fs.writeFileSync('copy_script.txt', code);
