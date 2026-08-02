const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('.');
let foundErrors = false;
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('.')) {
      const dir = path.dirname(f);
      let targetPath = path.resolve(dir, importPath);
      const targetDir = path.dirname(targetPath);
      const targetBase = path.basename(targetPath);
      if (fs.existsSync(targetDir)) {
         const items = fs.readdirSync(targetDir);
         const exactMatch = items.find(item => {
             const withoutExt = item.replace(/\.[^/.]+$/, '');
             return item === targetBase || withoutExt === targetBase || item === targetBase + '.tsx' || item === targetBase + '.ts';
         });
         if (!exactMatch) {
             const lowerMatch = items.find(item => {
                 const withoutExt = item.replace(/\.[^/.]+$/, '');
                 return item.toLowerCase() === targetBase.toLowerCase() || withoutExt.toLowerCase() === targetBase.toLowerCase() || item.toLowerCase() === (targetBase + '.tsx').toLowerCase() || item.toLowerCase() === (targetBase + '.ts').toLowerCase();
             });
             if (lowerMatch) {
                 console.log('Case mismatch in ' + f + ': imported ' + importPath + ' but actual file is ' + lowerMatch);
                 foundErrors = true;
             }
         }
      }
    }
  }
});
if (!foundErrors) console.log('No case mismatches found.');
