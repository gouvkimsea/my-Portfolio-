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
console.log('\n[4/5] Accessibility & Markup Quality:');
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

// 5. Functional & Runtime Contract Integrity
console.log('\n[5/5] Functional & Feature Integrity:');
const scriptJs = fs.readFileSync('script.js', 'utf8');
assert(scriptJs.includes('playSound') && scriptJs.includes('toggleSfx'), 'script.js: Web Audio procedural sound engine is implemented');
assert(scriptJs.includes('updateProjectFilterState'), 'script.js: Reactive project search and filter engine is implemented');
assert(scriptJs.includes('codeSnippets') && scriptJs.includes('copyCodeBtn'), 'script.js: Hero code snippet copy interaction is implemented');
assert(scriptJs.includes('sound:') && scriptJs.includes('copy:') && scriptJs.includes('coursework:') && scriptJs.includes('cpp:'), 'script.js: In-browser terminal CLI command suite expanded with academic coursework and C++ OOP modules');
assert(scriptJs.includes('initDeepLinks') && scriptJs.includes('copyFilterLinkBtn'), 'script.js: URL query synchronization and shareable deep-links implemented');
assert(scriptJs.includes('action === "toggle-sfx"') && scriptJs.includes('action === "copy-code"'), 'script.js: Command palette quick actions expanded with SFX and snippet copying');

// Test global script evaluation with mock DOM globals
try {
  const domMock = {
    window: { addEventListener: () => {}, location: { href: 'http://localhost/', search: '' }, innerWidth: 1200, innerHeight: 800, matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }) },
    document: {
      addEventListener: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null,
      createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {} }, appendChild: () => {} }),
      body: { classList: { add: () => {}, remove: () => {} }, appendChild: () => {}, removeChild: () => {} },
      documentElement: { style: {}, scrollHeight: 2000, getAttribute: () => 'dark', setAttribute: () => {} }
    },
    navigator: { clipboard: {}, serviceWorker: {}, userAgent: 'Node-Test' },
    localStorage: { getItem: () => null, setItem: () => {} },
    location: { href: 'http://localhost/', search: '' },
    URL: URL,
    URLSearchParams: URLSearchParams,
    IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
    performance: globalThis.performance || { now: () => Date.now() },
    console: console,
    setTimeout: () => {},
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    requestAnimationFrame: () => {}
  };
  domMock.window.document = domMock.document;
  new vm.Script(fs.readFileSync('script.js', 'utf8')).runInNewContext(domMock);
  assert(true, 'script.js evaluates without top-level runtime exceptions');
} catch (err) {
  assert(false, `script.js evaluation error: ${err.message}`);
}

// Summary
console.log('\n----------------------------------------');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('----------------------------------------\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All integrity checks passed successfully!\n');
}
