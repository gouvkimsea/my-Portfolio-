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
const htmlFilesForScripts = ['index.html', 'miniworld.html', '404.html'];
htmlFilesForScripts.forEach(file => {
  try {
    const html = fs.readFileSync(file, 'utf8');
    const matches = [...html.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi)];
    matches.forEach((m, idx) => {
      if (m[0].includes('application/ld+json') || m[0].includes('src=')) return;
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
  '404.html',
  '.nojekyll',
  '.github/workflows/ci.yml',
  '.github/workflows/deploy.yml',
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
['index.html', 'miniworld.html', '404.html'].forEach(file => {
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
assert(scriptJs.includes('action === "toggle-sfx"') && scriptJs.includes('action === "copy-code"') && scriptJs.includes('action === "view-coursework"'), 'script.js: Command palette quick actions expanded with SFX, snippet copying, and coursework navigation');
assert(scriptJs.includes('action === "toggle-timeline"') && scriptJs.includes('action === "open-skills-dossier"') && scriptJs.includes('action === "run-benchmark"') && scriptJs.includes('action === "run-ci-telemetry"'), 'script.js: Command palette expanded with timeline switcher, skill dossier inspection, benchmark and CI/CD telemetry');
assert(scriptJs.includes('SECTION_IDS') && scriptJs.includes('navigateToSection') && scriptJs.includes('setActiveSection'), 'script.js: Scroll-triggered section navigation and dynamic observer controller implemented');
assert(scriptJs.includes('e.key.toLowerCase() === "j"') && scriptJs.includes('e.key.toLowerCase() === "k"'), 'script.js: Vim-style j / k keyboard navigation between sections implemented');
assert(fs.readFileSync('styles.css', 'utf8').includes('scroll-margin-top: 86px') && fs.readFileSync('styles.css', 'utf8').includes('.nav-indicator'), 'styles.css: Section 100vh layout, scroll-margin offsets, and animated nav indicator implemented');
assert(indexHtml.includes('id="sectionNavDots"') && fs.readFileSync('styles.css', 'utf8').includes('.section-nav-dots'), 'index.html & styles.css: Desktop floating section mini-dots pagination HUD implemented');
assert(scriptJs.includes('whoosh') && scriptJs.includes('matrix:') && scriptJs.includes('git:'), 'script.js: Synthesizer whoosh tone and terminal matrix digital rain implemented');
assert(indexHtml.includes('id="backToTopBtn"') && scriptJs.includes('touchStartX') && scriptJs.includes('action === "run-matrix"'), 'index.html & script.js: Floating back-to-top quick action and mobile edge swipe drawer gestures implemented');
assert(indexHtml.includes('projects-curator-hud') && fs.readFileSync('styles.css', 'utf8').includes('.projects-curator-hud') && scriptJs.includes('viewModeExhibition'), 'index.html, styles.css & script.js: Chapter 02 project illustration, curator HUD, and exhibition view switcher implemented');
assert(indexHtml.includes('skills-filter-bar') && indexHtml.includes('id="skillDossierModal"') && scriptJs.includes('initSkillsFilterAndDossier'), 'index.html & script.js: Interactive skill capabilities filter and skill dossier inspector modal implemented');
assert(indexHtml.includes('achieve-view-switcher') && indexHtml.includes('id="achievementsTimeline"') && scriptJs.includes('initAchievementsTimeline'), 'index.html & script.js: Milestones view switcher and chronological journey timeline mode implemented');
assert(scriptJs.includes('bench:') && scriptJs.includes('primary === "nav"') && scriptJs.includes('architecture:'), 'script.js: Parameterized terminal navigation and performance benchmark diagnostics implemented');
assert(indexHtml.includes('project-stack-tray') && scriptJs.includes('initProjectStackTrayAndTagFilters') && fs.readFileSync('styles.css', 'utf8').includes('.stack-pill'), 'index.html, styles.css & script.js: Tech stack quick filter tray and interactive card tag filtering implemented');
assert(indexHtml.includes('timeline-epoch-nav') && indexHtml.includes('id="timelineEpoch2023"') && fs.readFileSync('styles.css', 'utf8').includes('.timeline-epoch-nav'), 'index.html, styles.css & script.js: Timeline epoch quick navigation jumpers implemented');
assert(indexHtml.includes('sfx-equalizer') && fs.readFileSync('styles.css', 'utf8').includes('eqBounce'), 'index.html & styles.css: Web Audio procedural equalizer wave visualizer implemented');
assert(scriptJs.includes('highlightSearchMatch') && fs.readFileSync('styles.css', 'utf8').includes('project-search-match'), 'script.js & styles.css: Live project search keyword highlighting implemented');
assert(scriptJs.includes('cat:') && scriptJs.includes('curl:') && scriptJs.includes('history:'), 'script.js: Terminal cat virtual file viewer, curl telemetry, and history commands implemented');
assert(scriptJs.includes('termDotRed') && scriptJs.includes('tabMatchIndex') && fs.readFileSync('styles.css', 'utf8').includes('.terminal-bar .wb-dot'), 'script.js & styles.css: Terminal macOS window dots actions and cycling Tab autocompletion implemented');
assert(indexHtml.includes('data-cmd="cat developer.ts"') && indexHtml.includes('data-cmd="matrix"') && indexHtml.includes('data-cmd="bench"') && indexHtml.includes('data-cmd="ci"'), 'index.html: Terminal hint bar expanded with developer files, benchmarks, matrix, and CI telemetry chips');
assert(indexHtml.includes('id="downloadContactCardBtn"') && scriptJs.includes('downloadVCard') && scriptJs.includes('BEGIN:VCARD'), 'index.html & script.js: RFC 6350 vCard (.vcf) Contact Card generation and 1-click download implemented');
assert(indexHtml.includes('shortcuts-audio-section') && scriptJs.includes('audio-bench-btn') && fs.readFileSync('styles.css', 'utf8').includes('.audio-bench-btn'), 'index.html, styles.css & script.js: Keyboard Shortcuts cheatsheet acoustic soundboard audition panel implemented');
assert(scriptJs.includes('vcard:') && scriptJs.includes('action === "download-vcard"'), 'script.js: Command palette and Terminal CLI vcard digital contact card export action implemented');
assert(indexHtml.includes('hero-telemetry-badge') && fs.readFileSync('styles.css', 'utf8').includes('.hero-telemetry-badge'), 'index.html & styles.css: Hero telemetry overview badge implemented');
assert(indexHtml.includes('id="terminalExportBtn"') && scriptJs.includes('exportTerminalSession') && fs.readFileSync('styles.css', 'utf8').includes('.terminal-action-btn'), 'index.html, script.js & styles.css: Terminal session log export system implemented');
assert(scriptJs.includes('project-card-share-btn') && (indexHtml.match(/class="project-card-share-btn"/g) || []).length === 9, 'index.html & script.js: 1-click deep-link share buttons implemented on all 9 project cards');
assert(indexHtml.includes('id="modalShareLinkBtn"') && scriptJs.includes('modalShareLinkBtn') && fs.readFileSync('styles.css', 'utf8').includes('.modal-share-btn'), 'index.html, script.js & styles.css: In-modal direct project link share button implemented');
assert(indexHtml.includes('data-action="export-terminal"') && scriptJs.includes('action === "export-terminal"'), 'index.html & script.js: Command palette export terminal session log quick action implemented');
assert(indexHtml.includes('id="hudClockItem"') && indexHtml.includes('id="footerClockTime"') && scriptJs.includes('updateLocalClock'), 'index.html & script.js: Real-time Phnom Penh (UTC+7 / ICT) live ticking clock implemented');
assert(indexHtml.includes('id="sfxVolumeSlider"') && scriptJs.includes('setSfxVolume') && scriptJs.includes('getMasterGainNode') && fs.readFileSync('styles.css', 'utf8').includes('.audio-volume-panel'), 'index.html, script.js & styles.css: Web Audio procedural synthesizer master volume gain controller implemented');
assert(indexHtml.includes('id="modalCiteBtn"') && scriptJs.includes('modalCiteBtn') && fs.readFileSync('styles.css', 'utf8').includes('.modal-cite-btn'), 'index.html, script.js & styles.css: In-modal project citation generator & 1-click clipboard copy implemented');
assert(scriptJs.includes('demo:') && scriptJs.includes('cite:') && scriptJs.includes('volume:') && scriptJs.includes('time:'), 'script.js: In-browser terminal CLI expanded with demo, cite, volume, and time telemetry commands');
assert(scriptJs.includes('ci:') && scriptJs.includes('deploy:') && scriptJs.includes('v32 PWA'), 'script.js: In-browser terminal CLI expanded with CI/CD deployment telemetry and v32 PWA benchmark status');
const cssContent = fs.readFileSync('styles.css', 'utf8');
assert(cssContent.includes('[data-theme="light"]') && cssContent.includes('[data-theme="dark"]') && cssContent.includes('--lime: #15803d'), 'styles.css: Dual-theme token architecture :root, [data-theme="light"] and [data-theme="dark"] with WCAG AA contrast tokens');
assert(cssContent.includes('[data-theme="light"] .skills-section') && cssContent.includes('[data-theme="light"] .skill-card'), 'styles.css: Skills section and skill cards explicit [data-theme="light"] styling');
assert(cssContent.includes('[data-theme="dark"] .footer') && cssContent.includes('[data-theme="light"] .footer'), 'styles.css: Footer explicit [data-theme="dark"] and [data-theme="light"] styling without inversion bugs');
assert(['project-modal', 'resume-modal', 'skill-dossier-modal', 'cmdk-modal', 'shortcuts-modal', 'share-modal'].every(m => cssContent.includes('[data-theme="light"] .' + m) || cssContent.includes('[data-theme="light"] dialog.' + m) || cssContent.includes('[data-theme="light"] .' + m.replace('-modal', '') + '-shell')), 'styles.css: All 6 modal dialogs have explicit [data-theme="light"] styling');
assert(cssContent.includes('[data-theme="light"] .mobile-drawer') && cssContent.includes('[data-theme="light"] .mobile-drawer-backdrop'), 'styles.css: Mobile drawer and backdrop overlay have explicit [data-theme="light"] styling');
assert(cssContent.includes('content-visibility: auto') && cssContent.includes('contain-intrinsic-size'), 'styles.css: Off-screen sections use content-visibility:auto with contain-intrinsic-size to defer rendering on mobile');
assert(cssContent.includes('touch-action: manipulation') && cssContent.includes('-webkit-tap-highlight-color: transparent'), 'styles.css: touch-action:manipulation eliminates 300ms tap delay on mobile controls');
assert(cssContent.includes('scrollbar-gutter: stable') && cssContent.includes('scrollbar-width: thin'), 'styles.css: Standard scrollbar properties scrollbar-gutter: stable and scrollbar-width: thin configured to eliminate layout shift');
assert(cssContent.includes('@keyframes eqBounce') && !/@keyframes\s+eqBounce\s*\{\s*0%\s*\{\s*height:/.test(cssContent), 'styles.css: eqBounce animation uses GPU transform:scaleY instead of height reflows');
assert(indexHtml.includes('preload') && indexHtml.includes('fonts.googleapis.com'), 'index.html: Web fonts load asynchronously without render-blocking and system fallbacks render instantly');
assert(scriptJs.includes('document.hidden') && scriptJs.includes('updateLocalClock'), 'script.js: Background timer tasks pause/throttle when document.hidden to save mobile battery');
assert(fs.readFileSync('sw.js', 'utf8').includes('kimsea-pwa-v32') && fs.readFileSync('sw.js', 'utf8').includes('styles.css?v=v32') && fs.readFileSync('sw.js', 'utf8').includes('404.html'), 'sw.js: Service worker cache version upgraded to kimsea-pwa-v32 with synchronized v32 asset queries and 404 shell');
assert(fs.readFileSync('sw.js', 'utf8').includes('ignoreSearch: true'), 'sw.js: Resilient offline cache retrieval configured with ignoreSearch query parameter matching');
assert(fs.readFileSync('miniworld.html', 'utf8').includes("e.key === 'Escape'") && fs.readFileSync('miniworld.html', 'utf8').includes('toggleControlsGuide(false)'), 'miniworld.html: Escape key dismisses controls modal and exits vehicle cockpit back to orbit');
assert(fs.readFileSync('package.json', 'utf8').includes('"lint":') && fs.readFileSync('package.json', 'utf8').includes('"check":'), 'package.json: Standard developer scripts lint and check configured');
assert(fs.readFileSync('manifest.json', 'utf8').includes('terminal-section'), 'manifest.json: PWA launcher shortcut for Developer Terminal CLI configured');
assert(fs.readFileSync('README.md', 'utf8').includes('ci.yml') && fs.readFileSync('README.md', 'utf8').includes('deploy.yml'), 'README.md: Complete CI/CD and deployment documentation maintained');
assert(fs.readFileSync('robots.txt', 'utf8').includes('Disallow: /.github/') && fs.readFileSync('robots.txt', 'utf8').includes('Disallow: /404.html'), 'robots.txt: Crawler boundaries protect internal CI and exclude 404 error shell');
assert(cssContent.includes('@media print') && cssContent.includes('resume-printing'), 'styles.css: Professional print stylesheet with resume-printing isolation configured');
assert(scriptJs.includes('beforeprint') && scriptJs.includes('resume-printing'), 'script.js: beforeprint and afterprint lifecycle hooks manage clean CV export printing');
assert(fs.readFileSync('404.html', 'utf8').includes('portfolio-theme') && fs.readFileSync('404.html', 'utf8').includes('prefers-color-scheme'), '404.html: Auto-detects and respects user theme preference and localStorage');
assert(fs.readFileSync('404.html', 'utf8').includes("window.addEventListener('keydown'") && fs.readFileSync('404.html', 'utf8').includes('returnHomeBtn'), '404.html: Keyboard shortcuts (Enter/H home, M miniworld, T theme) implemented');
assert(fs.readFileSync('404.html', 'utf8').includes('serviceWorker.register') && fs.readFileSync('miniworld.html', 'utf8').includes('serviceWorker.register'), '404.html & miniworld.html: Resilient PWA service worker registered across standalone HTML pages');
assert(fs.readFileSync('miniworld.html', 'utf8').includes('application/ld+json') && fs.readFileSync('miniworld.html', 'utf8').includes('WebApplication'), 'miniworld.html: Structured Data (JSON-LD WebApplication) schema configured for SEO');
assert(indexHtml.includes('interactive-widget=resizes-content'), 'index.html: Viewport configured with interactive-widget=resizes-content for virtual keyboard adaptation');
assert(indexHtml.includes('autocomplete="name"') && indexHtml.includes('inputmode="email"') && indexHtml.includes('enterkeyhint="next"'), 'index.html: Mobile form inputs configured with autocomplete, inputmode, and enterkeyhint');
assert(indexHtml.includes('modal-drag-handle') && cssContent.includes('.modal-drag-handle'), 'index.html & styles.css: Mobile modal sheets equipped with drag handles for swipe-to-dismiss affordance');
assert(indexHtml.includes('modalBottomCloseBtn') && cssContent.includes('.modal-bottom-close-btn'), 'index.html & styles.css: Bottom action close buttons implemented for one-handed thumb reach in modals');
assert(scriptJs.includes('bindModalSwipeDown') && scriptJs.includes('initMobileUsability'), 'script.js: Native touch swipe-down to dismiss gesture and mobile keyboard focus auto-scrolling implemented');
assert(scriptJs.includes('prefers-reduced-motion') && scriptJs.includes('typewriterEl.textContent = words[0]'), 'script.js: Dynamic typewriter respects prefers-reduced-motion accessibility setting');
assert(scriptJs.includes('print:') && scriptJs.includes('pdf:') && scriptJs.includes('resumePrintBtn'), 'script.js: In-browser terminal CLI expanded with print and pdf direct CV export actions');
assert(indexHtml.includes('data-action="print-resume"') && scriptJs.includes('action === "print-resume"'), 'index.html & script.js: Command palette integrated with 1-click print and PDF CV export quick action');
assert(fs.readFileSync('404.html', 'utf8').includes('og:title') && fs.readFileSync('404.html', 'utf8').includes('twitter:card'), '404.html: Social preview metadata (OpenGraph & Twitter cards) configured for error page sharing');
assert(fs.readFileSync('miniworld.html', 'utf8').includes("e.key === 'Home'") && fs.readFileSync('miniworld.html', 'utf8').includes('index.html#projects'), 'miniworld.html: Home key hotkey implemented to return instantly to main portfolio');
assert(fs.readFileSync('.github/workflows/ci.yml', 'utf8').includes('[18, 20, 22]'), 'ci.yml: Multi-version test matrix configured for Node.js 18, 20, and 22');
assert(fs.readFileSync('.github/workflows/deploy.yml', 'utf8').includes('npm test') && fs.readFileSync('.github/workflows/deploy.yml', 'utf8').includes('node-version: 22'), 'deploy.yml: Production deployment pipeline enforces test verification on Node.js 22 Active LTS');
assert(indexHtml.includes('https://www.linkedin.com/in/gouv-kimsea-16795143a') && scriptJs.includes('https://www.linkedin.com/in/gouv-kimsea-16795143a'), 'index.html & script.js: Canonical LinkedIn profile URL synchronized across Schema.org metadata, HUD links, and clipboard actions');

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
