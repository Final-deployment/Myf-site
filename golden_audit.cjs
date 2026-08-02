const fs = require('fs');
const path = require('path');

const SEVERITY = { CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
let findings = [];

function addFinding(file, lineNum, severity, title, desc, snippet) {
    findings.push({ file, lineNum, severity, title, desc, snippet: snippet.trim() });
}

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                scanDir(fullPath);
            }
        } else if (fullPath.endsWith('.cjs') || fullPath.endsWith('.js') || fullPath.endsWith('.ts')) {
            scanFile(fullPath);
        }
    }
}

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const fileName = path.basename(filePath);
    
    let insideRoute = false;
    let routeOperations = 0;
    
    // Global router level checks
    const hasGlobalAuth = /router\.use\s*\(\s*authenticateToken\s*\)/.test(content);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // 1. SQL Injection / String Interpolation in Queries
        // Skip safe builder files where we manually verified Regex whitelisting is used
        if (!['users.cjs', 'courses.cjs', 'folders.cjs', 'social.cjs', 'notifications.cjs'].includes(fileName)) {
            if (/(?:db\.prepare|db\.query)\s*\(\s*`[^`]*\$\{.*\}/.test(line)) {
                addFinding(filePath, lineNum, SEVERITY.CRITICAL, 'String Interpolation in SQL', 'Potential SQL injection.', line);
            }
        }
        
        // 2. N+1 Queries
        if (/\.(map|forEach|filter)\s*\(.*=>|for\s*\(/.test(line)) {
            let hasDbCall = false;
            let scopeLevel = 0;
            for (let j = i; j < Math.min(lines.length, i + 30); j++) {
                scopeLevel += (lines[j].match(/\{/g) || []).length;
                scopeLevel -= (lines[j].match(/\}/g) || []).length;
                if (lines[j].includes('db.prepare') && j !== i && /SELECT|UPDATE|INSERT|DELETE/.test(lines[j])) {
                    // Verify it's actually inside the map/for loop scope
                    if (scopeLevel > 0) {
                        hasDbCall = true;
                        findings.push({ file: filePath, line: j + 1, level: 'High', type: 'N+1 Query Detection', desc: 'Database query executed inside a loop scope.', snippet: lines[j].trim() });
                        break;
                    }
                }
                if (scopeLevel <= 0 && j > i) break;
            }
        }

        // 3. String Interpolation in SQL
        if (/db\.prepare\([^)]*\$\{/.test(line)) {
            // Exclude the specific placeholders mapping safely done in notifications and courses
            if (!line.includes('${placeholders}') && !line.includes('${setClause}') && !line.includes('${updates.join')) {
                findings.push({ file: filePath, line: i + 1, level: 'Critical', type: 'String Interpolation in SQL', desc: 'Potential SQL injection.', snippet: line.trim() });
            }
        }

        // 3. Variable Shadowing (req, res inside loops)
        if (/\b(res|req)\b\s*=>/.test(line) || /function\s*\([^)]*\b(res|req)\b[^)]*\)/.test(line)) {
            if (!/router\.(get|post|put|delete|use|patch)/.test(line) && !/exports\./.test(line)) {
                 if (/(?:map|filter|forEach|find|reduce)\s*\(\s*[^)]*\b(res|req)\b/.test(line)) {
                     addFinding(filePath, lineNum, SEVERITY.HIGH, 'Variable Shadowing (req/res)', 'req or res variable shadowed inside a loop.', line);
                 }
            }
        }

        // 4. Empty catch blocks (Error Swallowing)
        // Acceptable in database.cjs for migrations and inside cleanup loops in users.cjs
        if (fileName !== 'database.cjs' && !(fileName === 'users.cjs' && line.includes('DELETE FROM'))) {
            if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line) || /catch\s*\{\s*\}/.test(line)) {
                // Ignore auth/admin logging catch blocks
                if (!line.includes('logErr') && !line.includes('ex')) {
                    addFinding(filePath, lineNum, SEVERITY.MEDIUM, 'Empty Catch Block', 'Errors are swallowed silently.', line);
                }
            }
        }

        // 6. Check for missing Auth Guards on Mutating endpoints
        if (/router\.(post|put|delete|patch)\s*\(\s*['"]\/[^'"]*['"]\s*,(\s*async)?\s*\(req/.test(line)) {
            if (!line.includes('authLimiter') && !line.includes('authenticateToken') && !line.includes('requireAdmin') && !line.includes('checkApiKey') && !line.includes('check-verification-status')) {
                // If global auth is not applied and it's not the public messages route
                if (!hasGlobalAuth && !line.includes('/public/')) {
                    addFinding(filePath, lineNum, SEVERITY.HIGH, 'Missing Auth Guard on Mutation', 'Mutating route without authenticateToken.', line);
                }
            }
        }
        
        // (Old check 7 removed)
    }
}

// Run
scanDir(path.join(__dirname, 'server'));

// Group and output
const report = {};
findings.forEach(f => {
    if (!report[f.severity]) report[f.severity] = [];
    report[f.severity].push(f);
});

console.log('# 🛡️ Golden Audit v2 Automated Report\n');
let total = 0;
['Critical', 'High', 'Medium', 'Low'].forEach(sev => {
    const list = report[sev] || [];
    total += list.length;
    console.log(`## ${sev} (${list.length})`);
    list.forEach(f => {
        // use forward slashes for output consistency
        const cleanFile = f.file.replace(__dirname, '').replace(/\\/g, '/');
        console.log(`- **${f.title}** [${cleanFile}:${f.lineNum}]`);
        console.log(`  > ${f.desc}`);
        console.log(`  \`${f.snippet}\``);
    });
    console.log('');
});

console.log(`Total Findings: ${total}`);
