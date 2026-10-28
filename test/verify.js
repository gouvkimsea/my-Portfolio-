/**
 * Automated Verification & Integrity Test Suite
 * Zero external dependencies — runs directly in Node.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('\n========================================');
console.log('Portfolio Automated Integrity Test Suite');
console.log('========================================\n');

// 1. Syntax Validation
console.log('[1/4] JavaScript Syntax Validation:');
const jsFiles = ['script.js', 'server.js', 'sw.js'];
jsFiles.forEach(file => {
  try {
    const code = fs.readFileSync(file, 'utf8');
    new vm.Script(code, { filename: file });
    assert(true, `${file} syntax is valid`);
  } catch (err) {
    assert(false, `${file} syntax error: ${err.message}`);
  }
});

// Validate inline scripts in HTML files
const htmlFilesForScripts = ['miniworld.html'];
htmlFilesForScripts.forEach(file => {
  try {
    const html = fs.readFileSync(file, 'utf8');
    const matches = [...html.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi)];
    matches.forEach((m, idx) => {
      new vm.Script(m[1], { filename: `${file}:inline-script-${idx}` });
      assert(true, `${file} inline script #${idx + 1} syntax is valid`);
    });
  } catch (err) {
    assert(false, `${file} script error: ${err.message}`);
  }
});

// 2. Static Asset Integrity
console.log('\n[2/4] Static Asset Integrity:');
const assetsToCheck = [
  'index.html',
  'miniworld.html',
  'styles.css',
  'script.js',
  'manifest.json',
  'favicon.svg',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'og-image.jpg',
  'pingu-contact-bg.webp',
  'robots.txt',
  'sitemap.xml',
  'turtle-cursor.png',
  'turtle-cursor-32.png',
  'turtle-pointer.png',
  'turtle-pointer-32.png'
];

assetsToCheck.forEach(asset => {
  const exists = fs.existsSync(path.resolve('.', asset));
  assert(exists, `Required asset exists: ${asset}`);
});

// 3. Security Checks
console.log('\n[3/4] Security Standards:');
['index.html', 'miniworld.html'].forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const targetBlanks = content.match(/<a\s+[^>]*target=["']_blank["'][^>]*>/gi) || [];
  const unsafeLinks = targetBlanks.filter(tag => {
    return !tag.includes('rel=') || (!tag.includes('noopener') && !tag.includes('noreferrer'));
  });
  assert(unsafeLinks.length === 0, `${file}: All ${targetBlanks.length} target="_blank" links include rel="noopener noreferrer"`);
});

// 4. Accessibility & Markup Quality
console.log('\n[4/4] Accessibility & Markup Quality:');
const indexHtml = fs.readFileSync('index.html', 'utf8');

// Check Form Inputs have labels or aria-label
const inputs = indexHtml.match(/<(?:input|textarea|select)\s+[^>]*>/gi) || [];
const unlabelled = inputs.filter(inp => {
  const isHidden = inp.includes('type="hidden"');
  const hasAria = inp.includes('aria-label=') || inp.includes('aria-labelledby=');
  const idMatch = inp.match(/id=["']([^"']+)["']/);
  const hasLabel = idMatch && indexHtml.includes(`for="${idMatch[1]}"`);
  return !isHidden && !hasAria && !hasLabel;
});
assert(unlabelled.length === 0, `index.html: All ${inputs.length} interactive form inputs have accessible labels`);

// Check duplicate IDs in index.html
const idMatches = [...indexHtml.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);
const seenIds = new Set();
const duplicateIds = [];
idMatches.forEach(id => {
  if (seenIds.has(id)) duplicateIds.push(id);
  else seenIds.add(id);
});
assert(duplicateIds.length === 0, `index.html: All ${seenIds.size} element IDs are unique (duplicates: ${duplicateIds.join(', ') || 'none'})`);

// Summary
console.log('\n----------------------------------------');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('----------------------------------------\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All integrity checks passed successfully!\n');
}
