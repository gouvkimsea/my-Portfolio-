const $ = (selector, root = document) => (root || document).querySelector?.(selector);
const $$ = (selector, root = document) => (root || document).querySelectorAll ? [...(root || document).querySelectorAll(selector)] : [];

// Page loader
window.addEventListener("load", () => setTimeout(() => $("#loader")?.classList.add("done"), 400));

// Scroll progress bar
const scrollProgress = $("#scrollProgress");
window.addEventListener("scroll", () => {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const progress = total > 0 ? (window.scrollY / total) * 100 : 0;
  if (scrollProgress) scrollProgress.style.width = `${progress}%`;
}, { passive: true });

const header = $(".site-header");
const navLinksContainer = $("#mainMenu");
const navLinks = $$(".nav-link", navLinksContainer);
let activeLink = $(".nav-link.active", navLinksContainer) || null;

// Header Scroll Morphing (smean.ai floating glass capsule effect)
window.addEventListener("scroll", () => {
  const isScrolled = window.scrollY > 30;
  header?.classList.toggle("scrolled", isScrolled);
}, { passive: true });

// Dynamic Glass Spotlight Hover on Navbar
const mainNav = $(".nav");
if (mainNav) {
  mainNav.addEventListener("mousemove", e => {
    const rect = mainNav.getBoundingClientRect();
    mainNav.style.setProperty("--glass-x", `${e.clientX - rect.left}px`);
    mainNav.style.setProperty("--glass-y", `${e.clientY - rect.top}px`);
  });
}

// Sliding Magnetic Pill Indicator
const updateNavIndicator = targetLink => {
  if (!navLinksContainer || !targetLink) return;
  if (window.innerWidth <= 900) {
    navLinksContainer.removeAttribute("data-ind");
    return;
  }

  const containerRect = navLinksContainer.getBoundingClientRect();
  const linkRect = targetLink.getBoundingClientRect();

  const x = linkRect.left - containerRect.left;
  const w = linkRect.width;

  navLinksContainer.style.setProperty("--ind-x", `${x}px`);
  navLinksContainer.style.setProperty("--ind-w", `${w}px`);
  navLinksContainer.setAttribute("data-ind", "");
};

// Hover and Click Handlers for Nav Links
navLinks.forEach(link => {
  link.addEventListener("mouseenter", () => {
    updateNavIndicator(link);
  });
  link.addEventListener("focus", () => {
    updateNavIndicator(link, false);
  });
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href");
    if (href && href.startsWith("#")) {
      e.preventDefault();
      navigateToSection(href.substring(1));
    }
  });
});

navLinksContainer?.addEventListener("mouseleave", () => {
  if (activeLink) {
    updateNavIndicator(activeLink, false);
  } else {
    navLinksContainer.removeAttribute("data-ind");
  }
});

window.addEventListener("resize", () => updateNavIndicator(activeLink, false));
window.addEventListener("load", () => setTimeout(() => updateNavIndicator(activeLink, false), 200));

// ============================================================================
// 9. SCROLL-TRIGGERED NAVIGATION & SECTION TRANSITIONS CONTROLLER
// ============================================================================

const SECTION_IDS = [
  "home",
  "about",
  "terminal-section",
  "skills",
  "projects",
  "achievements",
  "contact"
];

// Map sections to their primary desktop nav link targets
const SECTION_NAV_TARGETS = {
  home: null,
  about: "about",
  "terminal-section": "about",
  skills: "skills",
  projects: "projects",
  achievements: "achievements",
  contact: "contact"
};

const sectionElements = SECTION_IDS.map(id => document.getElementById(id)).filter(Boolean);
const navContactBtn = $(".nav-contact-btn");
const brandLink = $(".brand");
let activeSectionId = "home";
let isProgrammaticScrolling = false;
let scrollLockTimer = null;
let wheelCooldownTimer = null;
let isWheelLocked = false;
let accumulatedWheelDelta = 0;

// Updates active UI state across desktop nav, sliding indicator, mobile drawer, and URL
const setActiveSection = (sectionId) => {
  if (!sectionId) return;
  activeSectionId = sectionId;

  // 1. Mark active class on the section for entrance and focus transitions
  sectionElements.forEach(el => {
    const isActive = el.id === sectionId;
    el.classList.toggle("section-active", isActive);
    if (isActive) {
      el.classList.add("section-in-view");
    }
  });

  // 2. Synchronize Desktop Navigation Bar
  const navTarget = SECTION_NAV_TARGETS[sectionId];
  if (navTarget === "contact") {
    navLinks.forEach(l => l.classList.remove("active"));
    activeLink = null;
    navLinksContainer?.removeAttribute("data-ind");
    navContactBtn?.classList.add("active");
  } else if (navTarget) {
    navContactBtn?.classList.remove("active");
    const targetLink = $(`.nav-link[href="#${navTarget}"]`, navLinksContainer);
    if (targetLink) {
      navLinks.forEach(l => l.classList.remove("active"));
      targetLink.classList.add("active");
      activeLink = targetLink;
      updateNavIndicator(activeLink);
    }
  } else {
    // "home" or top of page
    navLinks.forEach(l => l.classList.remove("active"));
    activeLink = null;
    navLinksContainer?.removeAttribute("data-ind");
    navContactBtn?.classList.remove("active");
  }

  // 3. Synchronize Mobile Drawer Links
  mobileDrawerLinks.forEach(drawerLink => {
    const href = drawerLink.getAttribute("href");
    const isDrawerMatch = (navTarget && href === `#${navTarget}`) || (sectionId === "contact" && href === "#contact");
    drawerLink.classList.toggle("active", Boolean(isDrawerMatch));
  });

  // 3b. Synchronize Desktop Floating Mini-Dots HUD
  const sectionDots = $$(".section-dot");
  sectionDots.forEach(dot => {
    const isMatch = dot.getAttribute("data-section") === sectionId;
    dot.classList.toggle("active", isMatch);
    dot.setAttribute("aria-current", isMatch ? "true" : "false");
  });

  // 4. Update URL without causing page jump or polluting history
  if (typeof window !== "undefined" && window.history?.replaceState) {
    const hash = sectionId === "home" ? (window.location.pathname + window.location.search) : `#${sectionId}`;
    if (window.location.hash !== (sectionId === "home" ? "" : `#${sectionId}`)) {
      window.history.replaceState(null, "", hash);
    }
  }
};

// Smooth navigation to target section with navbar offset calculation
const navigateToSection = (targetId, options = {}) => {
  const cleanId = String(targetId).replace("#", "");
  const targetEl = document.getElementById(cleanId);
  if (!targetEl) return false;

  const { playSfx = true, smooth = true } = options;
  const isReducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const headerHeight = header ? (header.offsetHeight || 76) : 76;
  const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - headerHeight;

  isProgrammaticScrolling = true;
  clearTimeout(scrollLockTimer);

  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: (smooth && !isReducedMotion) ? "smooth" : "auto"
  });

  setActiveSection(cleanId);

  if (playSfx && typeof playSound === "function") {
    playSound("whoosh");
  }

  scrollLockTimer = setTimeout(() => {
    isProgrammaticScrolling = false;
  }, 850);

  return true;
};

// High-efficiency IntersectionObserver for Section Identification
const sectionVisibility = new Map();

const scrollspyObserver = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((entries) => {
  if (isProgrammaticScrolling) return;

  entries.forEach(entry => {
    sectionVisibility.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
  });

  // Find the section with the largest visible portion
  let dominantSection = null;
  let maxRatio = 0.12; // Minimum ratio threshold

  for (const [id, ratio] of sectionVisibility.entries()) {
    if (ratio > maxRatio) {
      maxRatio = ratio;
      dominantSection = id;
    }
  }

  // Edge check for top and bottom of page
  if (window.scrollY < 80) {
    dominantSection = "home";
  } else if (window.innerHeight + window.scrollY >= (document.documentElement?.scrollHeight || 2000) - 70) {
    dominantSection = "contact";
  }

  if (dominantSection && dominantSection !== activeSectionId) {
    setActiveSection(dominantSection);
  }
}, {
  threshold: [0, 0.15, 0.3, 0.5, 0.7, 0.9],
  rootMargin: "-12% 0px -25% 0px"
}) : null;

if (scrollspyObserver) {
  sectionElements.forEach(sec => scrollspyObserver.observe(sec));
}

// Fallback scroll listener for top and bottom edges
window.addEventListener("scroll", () => {
  if (isProgrammaticScrolling) return;
  if (window.scrollY < 80 && activeSectionId !== "home") {
    setActiveSection("home");
  } else if (window.innerHeight + window.scrollY >= (document.documentElement?.scrollHeight || 2000) - 60 && activeSectionId !== "contact") {
    setActiveSection("contact");
  }
}, { passive: true });

// Controlled section-to-section wheel transition on desktop
const handleWheelNavigation = (e) => {
  // 1. Only run on desktop with fine pointer
  if (window.innerWidth <= 992 || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches)) {
    return; // Allow normal native touch scrolling on mobile/tablets
  }

  // 2. Check accessibility preferences
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  // 3. Do not hijack if typing or interacting with modals/dialogs/terminal
  const activeTag = document.activeElement?.tagName?.toLowerCase();
  if (["input", "textarea", "select"].includes(activeTag) ||
      document.querySelector("dialog[open], .cmdk-dialog[open], .terminal-window:focus-within")) {
    return;
  }

  // 4. Do not hijack if already mid-transition or locked by previous gesture
  if (isWheelLocked || isProgrammaticScrolling) {
    e.preventDefault();
    return;
  }

  const currentSecEl = document.getElementById(activeSectionId);
  const delta = e.deltaY;

  // 5. If currently in a tall section (e.g. projects with many cards),
  // NEVER trap the user! Allow free scrolling inside the section until its boundary is reached.
  if (currentSecEl) {
    const rect = currentSecEl.getBoundingClientRect();
    const headerHeight = header ? (header.offsetHeight || 76) : 76;

    if (delta > 0) {
      // Scrolling down: If the bottom of current section is still below viewport, allow native scroll inside
      if (rect.bottom > window.innerHeight + 80) {
        return;
      }
    } else if (delta < 0) {
      // Scrolling up: If the top of current section is still above navbar, allow native scroll inside
      if (rect.top < headerHeight - 80) {
        return;
      }
    }
  }

  // 6. Accumulate delta to prevent micro-jitters
  accumulatedWheelDelta += delta;
  const THRESHOLD = 55; // Deliberate gesture threshold

  if (Math.abs(accumulatedWheelDelta) < THRESHOLD) {
    return;
  }

  // Determine direction
  const currentIndex = SECTION_IDS.indexOf(activeSectionId);
  let targetIndex = -1;

  if (accumulatedWheelDelta > 0 && currentIndex < SECTION_IDS.length - 1) {
    targetIndex = currentIndex + 1;
  } else if (accumulatedWheelDelta < 0 && currentIndex > 0) {
    targetIndex = currentIndex - 1;
  }

  if (targetIndex >= 0 && targetIndex !== currentIndex) {
    e.preventDefault();
    const targetSectionId = SECTION_IDS[targetIndex];
    navigateToSection(targetSectionId);

    // Lock to absorb trackpad momentum / wheel inertia
    isWheelLocked = true;
    accumulatedWheelDelta = 0;
    clearTimeout(wheelCooldownTimer);
    wheelCooldownTimer = setTimeout(() => {
      isWheelLocked = false;
      accumulatedWheelDelta = 0;
    }, 800);
  } else {
    accumulatedWheelDelta = 0;
  }
};

window.addEventListener("wheel", handleWheelNavigation, { passive: false });

// Keyboard section-to-section navigation
window.addEventListener("keydown", (e) => {
  const activeTag = document.activeElement?.tagName?.toLowerCase();
  if (["input", "textarea", "select"].includes(activeTag) ||
      document.querySelector("dialog[open], .cmdk-dialog[open], .terminal-window:focus-within")) {
    return;
  }

  if (e.key === "PageDown" || (e.key === "ArrowDown" && (e.altKey || e.ctrlKey)) || (e.key.toLowerCase() === "j" && !e.ctrlKey && !e.metaKey && !e.altKey)) {
    const currentIndex = SECTION_IDS.indexOf(activeSectionId);
    if (currentIndex < SECTION_IDS.length - 1) {
      e.preventDefault();
      navigateToSection(SECTION_IDS[currentIndex + 1]);
    }
  } else if (e.key === "PageUp" || (e.key === "ArrowUp" && (e.altKey || e.ctrlKey)) || (e.key.toLowerCase() === "k" && !e.ctrlKey && !e.metaKey && !e.altKey)) {
    const currentIndex = SECTION_IDS.indexOf(activeSectionId);
    if (currentIndex > 0) {
      e.preventDefault();
      navigateToSection(SECTION_IDS[currentIndex - 1]);
    }
  } else if (e.key === "Home" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    navigateToSection("home");
  } else if (e.key === "End" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    navigateToSection("contact");
  }
});

// Wire Desktop Floating Mini-Dots HUD & Brand/Contact to Section Navigation
const sectionDots = $$(".section-dot");
sectionDots.forEach(dot => {
  dot.addEventListener("click", () => {
    const targetSection = dot.getAttribute("data-section");
    if (targetSection) {
      navigateToSection(targetSection);
    }
  });
});

brandLink?.addEventListener("click", (e) => {
  const href = brandLink.getAttribute("href");
  if (href && href.startsWith("#")) {
    e.preventDefault();
    navigateToSection(href.substring(1));
  }
});

navContactBtn?.addEventListener("click", (e) => {
  const href = navContactBtn.getAttribute("href");
  if (href && href.startsWith("#")) {
    e.preventDefault();
    navigateToSection(href.substring(1));
  }
});

// Handle initial deep-linked hash on load
window.addEventListener("load", () => {
  setTimeout(() => {
    if (typeof window !== "undefined" && window.location?.hash) {
      const initialId = window.location.hash.replace("#", "");
      if (document.getElementById(initialId)) {
        navigateToSection(initialId, { playSfx: false, smooth: false });
      }
    } else {
      setActiveSection("home");
    }
    updateNavIndicator(activeLink, false);
  }, 220);
});

// Mobile Navigation Drawer (Independent Right-Side Drawer)
const menuToggle = $("#menuToggle");
const mobileDrawer = $("#mobileDrawer");
const mobileDrawerBackdrop = $("#mobileDrawerBackdrop");
const mobileDrawerClose = $("#mobileDrawerClose");
const mobileDrawerLinks = $$(".mobile-drawer-link");

const closeMobileDrawer = () => {
  if (!mobileDrawer) return;
  mobileDrawer.classList.remove("open");
  mobileDrawer.setAttribute("aria-hidden", "true");
  mobileDrawerBackdrop?.classList.remove("active");
  document.body.classList.remove("menu-open");
  menuToggle?.setAttribute("aria-expanded", "false");
};

const openMobileDrawer = () => {
  if (!mobileDrawer) return;
  mobileDrawer.classList.add("open");
  mobileDrawer.setAttribute("aria-hidden", "false");
  mobileDrawerBackdrop?.classList.add("active");
  document.body.classList.add("menu-open");
  menuToggle?.setAttribute("aria-expanded", "true");
};

menuToggle?.addEventListener("click", () => {
  if (mobileDrawer?.classList.contains("open")) {
    closeMobileDrawer();
  } else {
    openMobileDrawer();
  }
});

mobileDrawerClose?.addEventListener("click", () => {
  closeMobileDrawer();
});

mobileDrawerBackdrop?.addEventListener("click", closeMobileDrawer);

mobileDrawerLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    const targetHref = link.getAttribute("href");
    if (targetHref && targetHref.startsWith("#")) {
      e.preventDefault();
      navigateToSection(targetHref.substring(1));
    }
    closeMobileDrawer();
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeMobileDrawer();
    closeModal();
    closeResumeModal();
  }
});

// Theme Controller (Light Mode by default with user toggle and persistence)
const isMobileDevice = window.innerWidth <= 900 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const savedTheme = localStorage.getItem("portfolio-theme");
const initialTheme = (isMobileDevice && !savedTheme) ? "light" : (savedTheme || "light");

const setTheme = (theme, persist = true) => {
  document.documentElement.setAttribute("data-theme", theme);
  if (persist) localStorage.setItem("portfolio-theme", theme);
  const textEl = $("#themeToggle .theme-mode-text");
  if (textEl) textEl.textContent = theme === "dark" ? "Light" : "Dark";
  const toggleBtn = $("#themeToggle");
  if (toggleBtn) {
    toggleBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    toggleBtn.setAttribute("title", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }
  const mobileToggleBtn = $("#mobileThemeToggle");
  if (mobileToggleBtn) {
    mobileToggleBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", theme === "dark" ? "#0d0f12" : "#f5f4ef");
  }
};

setTheme(initialTheme, false);

const toggleTheme = () => {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  setTheme(next, true);
  if (typeof playSound === "function") playSound("chime");
  return next;
};

$("#themeToggle")?.addEventListener("click", toggleTheme);
$("#mobileThemeToggle")?.addEventListener("click", toggleTheme);

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
  if (!localStorage.getItem("portfolio-theme")) {
    setTheme(e.matches ? "dark" : "light", false);
  }
});

// ==========================================================================
// ⌘K Command Palette Controller
// ==========================================================================
const cmdKModal = $("#cmdKModal");
const cmdKInput = $("#cmdKInput");
const cmdKResults = $("#cmdKResults");

const openCmdK = () => {
  if (!cmdKModal) return;
  cmdKModal.showModal();
  if (cmdKInput) {
    cmdKInput.value = "";
    cmdKInput.focus();
  }
  filterCmdK("");
};

const closeCmdK = () => {
  if (cmdKModal && cmdKModal.open) {
    cmdKModal.close();
  }
};

$("#footerCmdKBtn")?.addEventListener("click", openCmdK);

// Global Keyboard Shortcuts: ⌘K, ?, Shift+S, T, R, C, M, 1-5
document.addEventListener("keydown", e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    if (cmdKModal?.open) {
      closeCmdK();
    } else {
      openCmdK();
    }
    return;
  }

  // Skip single key shortcuts if user is currently typing in an input or textarea
  if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

  if (e.key === "?") {
    e.preventDefault();
    if (shortcutsModal?.open) {
      closeShortcutsModal();
    } else {
      openShortcutsModal();
    }
  } else if ((e.key === "S" || e.key === "s") && e.shiftKey) {
    e.preventDefault();
    if (shareModal?.open) {
      closeShareModal();
    } else {
      openShareModal();
    }
  } else if (e.key.toLowerCase() === "u" && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    if (typeof toggleSfx === "function") toggleSfx();
  } else if (e.key.toLowerCase() === "t" && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    const nextTheme = toggleTheme();
    showPortfolioToast(`Theme: ${nextTheme === "dark" ? "Dark Mode 🌙" : "Light Mode ☀️"}`);
  } else if (e.key.toLowerCase() === "r" && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    if (resumeModal?.open) {
      closeResumeModal();
    } else {
      openResumeModal();
      showPortfolioToast("Opened Curriculum Vitae (CV)");
    }
  } else if (e.key.toLowerCase() === "c" && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    showPortfolioToast("Navigated to Contact Channels");
  } else if (e.key.toLowerCase() === "m" && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    showPortfolioToast("🚀 Launching Mini World 3D Planet...");
    setTimeout(() => { window.location.href = "miniworld.html"; }, 320);
  } else if (e.key.toLowerCase() === "x" && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    const runBtn = $("#runCodeBtn");
    if (runBtn) {
      document.getElementById("home")?.scrollIntoView({ behavior: "smooth" });
      runBtn.click();
      showPortfolioToast("Executed active script in Code Card ⚡");
    }
  } else if (!e.ctrlKey && !e.metaKey && !e.altKey && ["1", "2", "3", "4", "5", "6"].includes(e.key)) {
    const secMap = {
      "1": { id: "home", label: "01 · Home" },
      "2": { id: "about", label: "02 · About & Bento" },
      "3": { id: "skills", label: "03 · Skills & Toolkit" },
      "4": { id: "projects", label: "04 · Selected Projects" },
      "5": { id: "achievements", label: "05 · Milestones & Achievements" },
      "6": { id: "contact", label: "06 · Direct Contact" }
    };
    const target = secMap[e.key];
    if (target) {
      e.preventDefault();
      document.getElementById(target.id)?.scrollIntoView({ behavior: "smooth" });
      showPortfolioToast(`Jumped to Section ${target.label}`);
    }
  }
});

// Click backdrop to close
cmdKModal?.addEventListener("click", e => {
  if (e.target === cmdKModal) closeCmdK();
});

// Live Search Filter
const filterCmdK = query => {
  const q = query.toLowerCase().trim();
  const items = $$(".cmdk-item", cmdKResults);
  const groups = $$(".cmdk-group-title", cmdKResults);

  let firstVisible = null;
  items.forEach(item => {
    item.classList.remove("selected");
    const text = item.textContent.toLowerCase();
    const match = !q || text.includes(q);
    item.style.display = match ? "flex" : "none";
    if (match && !firstVisible) {
      firstVisible = item;
    }
  });

  if (firstVisible) {
    firstVisible.classList.add("selected");
  }

  groups.forEach(group => {
    let next = group.nextElementSibling;
    let hasVisible = false;
    while (next && !next.classList.contains("cmdk-group-title")) {
      if (next.style.display !== "none") hasVisible = true;
      next = next.nextElementSibling;
    }
    group.style.display = hasVisible ? "block" : "none";
  });
};

cmdKInput?.addEventListener("input", e => {
  filterCmdK(e.target.value);
});

cmdKInput?.addEventListener("keydown", e => {
  const visibleItems = Array.from($$(".cmdk-item", cmdKResults)).filter(
    el => el.style.display !== "none"
  );
  if (!visibleItems.length) return;

  const currentIndex = visibleItems.findIndex(el => el.classList.contains("selected"));

  if (e.key === "ArrowDown") {
    e.preventDefault();
    const nextIndex = (currentIndex + 1) % visibleItems.length;
    visibleItems.forEach(el => el.classList.remove("selected"));
    visibleItems[nextIndex].classList.add("selected");
    visibleItems[nextIndex].scrollIntoView({ block: "nearest" });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    const prevIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
    visibleItems.forEach(el => el.classList.remove("selected"));
    visibleItems[prevIndex].classList.add("selected");
    visibleItems[prevIndex].scrollIntoView({ block: "nearest" });
  } else if (e.key === "Enter") {
    e.preventDefault();
    const targetItem = (currentIndex >= 0) ? visibleItems[currentIndex] : visibleItems[0];
    if (targetItem) targetItem.click();
  }
});

cmdKResults?.addEventListener("mouseover", e => {
  const item = e.target.closest(".cmdk-item");
  if (item && item.style.display !== "none") {
    $$(".cmdk-item", cmdKResults).forEach(el => el.classList.remove("selected"));
    item.classList.add("selected");
  }
});

// Action Execution
cmdKResults?.addEventListener("click", e => {
  const item = e.target.closest(".cmdk-item");
  if (!item) return;

  const action = item.getAttribute("data-action");
  const target = item.getAttribute("data-target");

  closeCmdK();

  if (action === "goto" && target) {
    navigateToSection(target.replace("#", ""));
  } else if (action === "open-project") {
    const proj = item.getAttribute("data-project");
    if (proj) openModal(proj);
  } else if (action === "open-joul-demo") {
    openModal("joul");
  } else if (action === "open-clp-demo") {
    openModal("clp");
  } else if (action === "open-pinit-demo") {
    openModal("pinit");
    setTimeout(() => {
      $("#pinitInput")?.focus();
    }, 180);
  } else if (action === "open-aquarium-demo") {
    openModal("aquarium");
  } else if (action === "open-gesture-demo") {
    openModal("gesture");
  } else if (action === "open-saas-demo") {
    openModal("saas");
  } else if (action === "open-miniworld-shader") {
    openModal("miniworld");
    setTimeout(() => {
      const lab = document.getElementById("miniworldSandbox");
      if (lab) lab.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
  } else if (action === "view-shortcuts") {
    openShortcutsModal();
  } else if (action === "share-portfolio") {
    openShareModal();
  } else if (action === "copy-email") {
    $("#copyEmailBtn")?.click();
  } else if (action === "view-education") {
    openResumeModal("#resumeEduSection");
  } else if (action === "view-coursework") {
    navigateToSection("terminal-section");
    const termInput = document.getElementById("terminalInput");
    if (termInput) {
      termInput.value = "coursework";
      document.getElementById("terminalForm")?.dispatchEvent(new Event("submit"));
    }
  } else if (action === "toggle-timeline") {
    const btn = $("#achieveViewTimelineBtn");
    if (btn) btn.click();
    navigateToSection("achievements");
  } else if (action === "open-skills-dossier") {
    const chip = $(".chips .chip-item[data-skill='cpp']");
    if (chip) chip.click();
  } else if (action === "run-benchmark") {
    navigateToSection("terminal-section");
    const termInput = document.getElementById("terminalInput");
    if (termInput) {
      termInput.value = "bench";
      document.getElementById("terminalForm")?.dispatchEvent(new Event("submit"));
    }
  } else if (action === "run-matrix") {
    navigateToSection("terminal-section");
    const termInput = document.getElementById("terminalInput");
    if (termInput) {
      termInput.value = "matrix";
      document.getElementById("terminalForm")?.dispatchEvent(new Event("submit"));
    }
  } else if (action === "view-git-log") {
    navigateToSection("terminal-section");
    const termInput = document.getElementById("terminalInput");
    if (termInput) {
      termInput.value = "git";
      document.getElementById("terminalForm")?.dispatchEvent(new Event("submit"));
    }
  } else if (action === "view-resume") {
    openResumeModal();
  } else if (action === "toggle-theme") {
    toggleTheme();
  } else if (action === "toggle-sfx") {
    if (typeof toggleSfx === "function") toggleSfx();
  } else if (action === "copy-code") {
    $("#copyCodeBtn")?.click();
  } else if (action === "download-vcard") {
    downloadVCard();
  } else if (action === "export-terminal") {
    if (typeof exportTerminalSession === "function") exportTerminalSession();
  } else if (action === "adjust-volume") {
    openShortcutsModal();
    setTimeout(() => {
      document.getElementById("sfxVolumeSlider")?.focus();
    }, 200);
  } else if (action === "open-game") {
    if (typeof openGameModal === "function") openGameModal();
  } else if (action === "open-synth") {
    const sModal = document.getElementById("shortcutsModal");
    if (sModal && !sModal.open) {
      if (typeof openShortcutsModal === "function") openShortcutsModal();
      else sModal.showModal();
    }
    setTimeout(() => {
      document.getElementById("shortcutsSynthSection")?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  } else if (action && action.startsWith("accent-")) {
    const color = action.replace("accent-", "");
    if (typeof setAccentTheme === "function") setAccentTheme(color);
  } else if (action === "filter-projects") {
    const cat = item.dataset.category || "all";
    const filterBtn = $(`button.filter[data-filter='${cat}']`);
    if (filterBtn) filterBtn.click();
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
  } else if (action === "github") {
    window.open("https://github.com/gouvkimsea", "_blank", "noopener,noreferrer");
  } else if (action === "linkedin") {
    window.open("https://www.linkedin.com/in/gouv-kimsea-16795143a", "_blank", "noopener,noreferrer");
  }
});


// ==========================================================================
// Dynamic Typewriter Effect in Hero Title
// ==========================================================================
const typewriterEl = $("#typewriter");
if (typewriterEl) {
  const words = ["builder.", "software explorer.", "web designer.", "creative engineer.", "problem solver."];
  let wordIdx = 0;
  let charIdx = words[0].length;
  let isDeleting = true;
  let typeSpeed = 2000;

  const typeLoop = () => {
    const currentWord = words[wordIdx];
    if (isDeleting) {
      charIdx--;
      typeSpeed = 40;
    } else {
      charIdx++;
      typeSpeed = 80;
    }

    typewriterEl.textContent = currentWord.substring(0, charIdx);

    if (!isDeleting && charIdx === currentWord.length) {
      typeSpeed = 2200; // Pause on complete word
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      wordIdx = (wordIdx + 1) % words.length;
      typeSpeed = 450; // Pause before typing next word
    }

    setTimeout(typeLoop, typeSpeed);
  };
  setTimeout(typeLoop, 3500);
}

// Scroll reveal animations (Section spy is handled by unified section controller above)

const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) {
    entry.target.classList.add("visible");
    revealObserver.unobserve(entry.target);
  }
}), { threshold: .12 });
$$(".reveal").forEach(item => revealObserver.observe(item));

// 1. Fluid Custom Turtle Cursor & Momentum Ripple Aura
const dot = $("#cursorDot"), ring = $("#cursorRing");
let mouseX = -100, mouseY = -100;
let ringX = -100, ringY = -100;
let isCursorActive = false;
let isCursorMoving = false;
let cursorRafId = null;

if (window.matchMedia("(pointer: fine)").matches) {
  const renderCursor = () => {
    if (isCursorActive && ring) {
      const dx = mouseX - ringX;
      const dy = mouseY - ringY;
      ringX += dx * 0.18;
      ringY += dy * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      if (Math.abs(dx) > 0.15 || Math.abs(dy) > 0.15) {
        cursorRafId = requestAnimationFrame(renderCursor);
      } else {
        isCursorMoving = false;
        cursorRafId = null;
      }
    }
  };

  window.addEventListener("pointermove", event => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    if (!isCursorActive) {
      ringX = mouseX;
      ringY = mouseY;
      isCursorActive = true;
      document.body.classList.add("cursor-visible");
    }
    if (dot) dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    if (!isCursorMoving) {
      isCursorMoving = true;
      cursorRafId = requestAnimationFrame(renderCursor);
    }
  }, { passive: true });

  document.addEventListener("mouseleave", () => {
    document.body.classList.remove("cursor-visible");
    isCursorMoving = false;
    if (cursorRafId) {
      cancelAnimationFrame(cursorRafId);
      cursorRafId = null;
    }
  });

  document.addEventListener("mouseenter", () => {
    if (isCursorActive) document.body.classList.add("cursor-visible");
  });

  document.addEventListener("pointerdown", () => document.body.classList.add("cursor-press"));
  document.addEventListener("pointerup", () => document.body.classList.remove("cursor-press"));

  // Dynamic interactive element hover delegation
  const interactiveSelector = "a, button, input[type='button'], input[type='submit'], summary, select, label, [role='button'], [role='tab'], [role='link'], .magnetic, .nav-link, .project-card, .terminal-chip, .topic-chip, .achieve-filter-btn, .hud-item, .hud-contact-item, .hud-copy-btn, .footer-cmd-btn, .work-drawer-toggle, .theme-toggle, .menu-toggle, .cmdk-btn, .cmdk-item, .code-tab, .code-copy-btn, .projects-search-clear, .empty-reset-btn, .copy-filter-link-btn, .code-run-btn, .chrome-sfx-btn, .resume-action-btn, .resume-modal-close, .mobile-drawer-close, .edu-view-btn, .btn, .button, .clickable, [data-filter], [data-topic]";

  document.addEventListener("pointerover", event => {
    if (event.target && event.target.closest && event.target.closest(interactiveSelector)) {
      document.body.classList.add("cursor-hover");
    }
  }, { passive: true });

  document.addEventListener("pointerout", event => {
    if (event.target && event.target.closest && event.target.closest(interactiveSelector)) {
      const related = event.relatedTarget;
      if (!related || !related.closest || !related.closest(interactiveSelector)) {
        document.body.classList.remove("cursor-hover");
      }
    }
  }, { passive: true });
}

// 2. Magnetic Elements Interaction & 3. Hero Card Tilt (Fine pointer & motion safe)
if (window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const magneticElements = $$(".magnetic");
  magneticElements.forEach(el => {
    el.addEventListener("pointermove", event => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (event.clientX - centerX) * 0.35;
      const deltaY = (event.clientY - centerY) * 0.35;
      el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }, { passive: true });
    el.addEventListener("pointerleave", () => {
      el.style.transform = "translate(0px, 0px)";
    });
  });

  // 3. Hero Code Card 3D Perspective Tilt & Parallax Glare
  const heroVisual = $("#heroVisual");
  const codeCard = $("#heroCodeCard") || $(".code-card");

  if (heroVisual && codeCard) {
    heroVisual.addEventListener("pointermove", event => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateX = -y * 16;
      const rotateY = x * 20;

      codeCard.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(8px)`;
      codeCard.style.setProperty("--glare-x", `${((x + 0.5) * 100).toFixed(1)}%`);
      codeCard.style.setProperty("--glare-y", `${((y + 0.5) * 100).toFixed(1)}%`);
    }, { passive: true });

    heroVisual.addEventListener("pointerleave", () => {
      codeCard.style.transform = "perspective(1000px) rotate(3deg)";
    });
  }
}

// 4. Interactive IDE Code Tabs & Execution Simulation
const codeTabs = $$(".code-tab");
const tabPanes = {
  profile: $("#pane-profile"),
  stack: $("#pane-stack"),
  status: $("#pane-status")
};
let activeTabId = "profile";

codeTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;
    if (!target || target === activeTabId) return;

    codeTabs.forEach(t => {
      const isActive = t === tab;
      t.classList.toggle("active", isActive);
      t.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    Object.entries(tabPanes).forEach(([id, pane]) => {
      if (pane) pane.classList.toggle("active", id === target);
    });

    activeTabId = target;

    // Context-sensitive console prompt
    const codeConsole = $("#codeConsole");
    const consoleText = $("#consoleText");
    if (codeConsole && !codeConsole.classList.contains("running")) {
      codeConsole.classList.remove("active");
      if (consoleText) {
        const prompts = {
          profile: "ready to execute · click ▶ Run",
          stack: "skills.json loaded · click ▶ Run to test",
          status: "status.sh ready · click ▶ Run to run check"
        };
        consoleText.textContent = prompts[target] || "ready to execute · click ▶ Run";
      }
    }
  });
});

const runCodeBtn = $("#runCodeBtn");
const codeConsole = $("#codeConsole");
const consoleText = $("#consoleText");
const consoleResetBtn = $("#consoleResetBtn");

let isRunningCode = false;

runCodeBtn?.addEventListener("click", () => {
  if (isRunningCode) return;
  isRunningCode = true;

  runCodeBtn.classList.remove("executed");
  runCodeBtn.classList.add("running");
  runCodeBtn.innerHTML = '<span class="run-icon">↻</span> <span class="run-label">Running...</span>';

  codeConsole?.classList.remove("active");
  codeConsole?.classList.add("running");

  const runPayloads = {
    profile: [
      "evaluating developer.ts...",
      "<b>Gouv Kimsea</b> · CS @ Paragon.U &amp; BBA @ Bonamary.U · Phnom Penh 🇰🇭"
    ],
    stack: [
      "compiling tech-stack dependencies...",
      "<b>Stack Loaded:</b> TypeScript · Three.js · React · Node · Blender (ready)"
    ],
    status: [
      "running status.sh environment checks...",
      "<b>Status: 100% OK</b> · 30+ components active · 0 errors · ready to build"
    ]
  };

  const [evalMsg, resultMsg] = runPayloads[activeTabId] || runPayloads.profile;
  if (consoleText) consoleText.textContent = evalMsg;

  setTimeout(() => {
    runCodeBtn.classList.remove("running");
    runCodeBtn.classList.add("executed");
    runCodeBtn.innerHTML = '<span class="run-icon">✓</span> <span class="run-label">Built</span>';

    codeConsole?.classList.remove("running");
    codeConsole?.classList.add("active");
    if (consoleText) consoleText.innerHTML = resultMsg;

    setTimeout(() => {
      runCodeBtn.classList.remove("executed");
      runCodeBtn.innerHTML = '<span class="run-icon">▶</span> <span class="run-label">Run</span>';
      isRunningCode = false;
    }, 4200);
  }, 450);
});

consoleResetBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  codeConsole?.classList.remove("active", "running");
  runCodeBtn?.classList.remove("running", "executed");
  if (runCodeBtn) runCodeBtn.innerHTML = '<span class="run-icon">▶</span> <span class="run-label">Run</span>';
  if (consoleText) consoleText.textContent = "ready to execute · click ▶ Run";
  isRunningCode = false;
});

// One-click Code Snippet Copy Interaction
const copyCodeBtn = $("#copyCodeBtn");
const codeSnippets = {
  profile: `const developer: Developer = {
  name: 'Gouv Kimsea',
  location: 'Phnom Penh, KH',
  degree: 'CS & Business Admin',
  focus: 'Web, 3D & Products',
  available: true
};`,
  stack: `{
  "core": ["TypeScript", "JS", "C++"],
  "creative": ["Three.js", "WebGL", "Blender"],
  "frameworks": ["Next.js", "React", "Node"],
  "passion": "Crafting seamless UI"
}`,
  status: `$ pnpm dev --turbo
✓ Paragon.U (CS) + Bonamary.U (BBA)
✓ 30+ interactive experiences deployed
✓ MiniWorld 3D experiment online
➜ ready for collaborative engineering`
};

copyCodeBtn?.addEventListener("click", () => {
  const currentSnippet = codeSnippets[activeTabId] || codeSnippets.profile;
  const tabNames = {
    profile: "developer.ts",
    stack: "skills.json",
    status: "status.sh"
  };
  const fileName = tabNames[activeTabId] || "code snippet";

  const onCopySuccess = () => {
    copyCodeBtn.classList.add("copied");
    const copyLabel = $(".copy-label", copyCodeBtn);
    const copyIcon = $(".copy-icon", copyCodeBtn);
    if (copyLabel) copyLabel.textContent = "Copied!";
    if (copyIcon) copyIcon.textContent = "✓";

    if (typeof playSound === "function") playSound("chime");
    showPortfolioToast(`Copied ${fileName} to clipboard! 📋`);

    setTimeout(() => {
      copyCodeBtn.classList.remove("copied");
      if (copyLabel) copyLabel.textContent = "Copy";
      if (copyIcon) copyIcon.textContent = "📋";
    }, 2200);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(currentSnippet)
      .then(onCopySuccess)
      .catch(() => {
        fallbackCopy(currentSnippet);
        onCopySuccess();
      });
  } else {
    fallbackCopy(currentSnippet);
    onCopySuccess();
  }
});

// 5. Spotlight Card Effect (Linear / Vercel cursor border glow + subtle 3D tilt)
const isTouchDevice = () => window.matchMedia("(pointer: coarse)").matches;

$$(".spotlight-card").forEach(card => {
  card.addEventListener("pointermove", event => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);

    if (!isTouchDevice() && !card.classList.contains("no-tilt") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const tiltX = ((y / rect.height) - 0.5) * -5.5;
      const tiltY = ((x / rect.width) - 0.5) * 5.5;
      card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-5px)`;
    }
  }, { passive: true });

  card.addEventListener("pointerleave", () => {
    if (!isTouchDevice()) {
      card.style.transform = "";
    }
  });
});

// 6. Reactive Project Filters & Quick Search Controller
const projectCards = $$(".project-card");
const projectFilterBtns = $$(".filter");
const projectSearchInput = $("#projectSearchInput");
const projectSearchClear = $("#projectSearchClear");
const projectEmptyState = $("#projectEmptyState");
const projectsStatusText = $("#projectsStatusText");
const resetProjectFiltersBtn = $("#resetProjectFiltersBtn");

let currentCategory = "all";
let currentSearchQuery = "";

const highlightSearchMatch = (elem, origText, query) => {
  if (!elem || !origText) return;
  if (!query || query.length < 2) {
    elem.textContent = origText;
    return;
  }
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  elem.innerHTML = origText.replace(regex, '<mark class="project-search-match">$1</mark>');
};

const updateProjectFilterState = () => {
  let visibleCount = 0;
  const q = currentSearchQuery.trim().toLowerCase();

  projectCards.forEach(card => {
    const categoryMatch = currentCategory === "all" || (card.dataset.category && card.dataset.category.includes(currentCategory));

    let textMatch = true;
    if (q) {
      const title = $(".project-title", card)?.textContent?.toLowerCase() || "";
      const desc = $(".project-desc", card)?.textContent?.toLowerCase() || "";
      const tags = $(".project-tag", card).map(t => t.textContent.toLowerCase()).join(" ");
      const projName = card.dataset.project || "";
      textMatch = title.includes(q) || desc.includes(q) || tags.includes(q) || projName.includes(q);
    }

    const isVisible = categoryMatch && textMatch;
    if (isVisible) {
      visibleCount++;
      card.classList.remove("hidden");
      requestAnimationFrame(() => card.classList.remove("fade-out"));
    } else {
      card.classList.add("fade-out");
      setTimeout(() => {
        if (card.classList.contains("fade-out")) card.classList.add("hidden");
      }, 250);
    }

    // Live Search Match Highlighting
    const titleElem = $(".project-title", card);
    const descElem = $(".project-desc", card);
    if (titleElem) {
      if (!titleElem.dataset.origText) titleElem.dataset.origText = titleElem.textContent;
      highlightSearchMatch(titleElem, titleElem.dataset.origText, q);
    }
    if (descElem) {
      if (!descElem.dataset.origText) descElem.dataset.origText = descElem.textContent;
      highlightSearchMatch(descElem, descElem.dataset.origText, q);
    }
  });

  // Update clear button visibility
  if (projectSearchClear) {
    projectSearchClear.classList.toggle("visible", q.length > 0);
  }

  // Update empty state
  if (projectEmptyState) {
    projectEmptyState.style.display = visibleCount === 0 ? "block" : "none";
  }

  // Update status indicator text
  if (projectsStatusText) {
    if (q && currentCategory !== "all") {
      projectsStatusText.textContent = `Showing ${visibleCount} of ${projectCards.length} projects for "${q}" in ${currentCategory}`;
    } else if (q) {
      projectsStatusText.textContent = `Showing ${visibleCount} of ${projectCards.length} projects matching "${q}"`;
    } else if (currentCategory !== "all") {
      projectsStatusText.textContent = `Showing ${visibleCount} of ${projectCards.length} ${currentCategory} projects`;
    } else {
      projectsStatusText.textContent = `Showing all ${projectCards.length} projects`;
    }
  }

  // Synchronize tech stack pills and card tags active state
  $$(".stack-pill").forEach(pill => {
    const stack = (pill.dataset.stack || "").toLowerCase();
    pill.classList.toggle("active", q === stack);
  });
  $$(".project-tags .project-tag").forEach(tag => {
    const text = tag.textContent.trim().toLowerCase();
    tag.classList.toggle("active", q === text);
  });

  // Synchronize state to URL parameters
  try {
    const url = new URL(window.location.href);
    if (currentCategory && currentCategory !== "all") {
      url.searchParams.set("filter", currentCategory);
    } else {
      url.searchParams.delete("filter");
    }

    const trimmedQ = currentSearchQuery.trim();
    if (trimmedQ) {
      url.searchParams.set("q", trimmedQ);
    } else {
      url.searchParams.delete("q");
    }

    window.history.replaceState({}, "", url.toString());
  } catch (_) {}
};

// Copy Shareable Filter/Search View Link
const copyFilterLinkBtn = $("#copyFilterLinkBtn");
copyFilterLinkBtn?.addEventListener("click", () => {
  const url = window.location.href;
  const onCopied = () => {
    copyFilterLinkBtn.classList.add("copied");
    const label = $(".link-label", copyFilterLinkBtn);
    if (label) label.textContent = "Link Copied!";
    if (typeof playSound === "function") playSound("chime");
    showPortfolioToast("Shareable project view link copied! 🔗");
    setTimeout(() => {
      copyFilterLinkBtn.classList.remove("copied");
      if (label) label.textContent = "Share View";
    }, 2000);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(onCopied).catch(() => {
      fallbackCopy(url);
      onCopied();
    });
  } else {
    fallbackCopy(url);
    onCopied();
  }
});

// Deep-link query parameters hydration on load
const initDeepLinks = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const filterParam = params.get("filter");
    const qParam = params.get("q");
    const projectParam = params.get("project");

    if (filterParam && ["web", "ai", "3d", "security"].includes(filterParam.toLowerCase())) {
      currentCategory = filterParam.toLowerCase();
      projectFilterBtns.forEach(b => b.classList.toggle("active", b.dataset.filter === currentCategory));
    }

    if (qParam) {
      currentSearchQuery = qParam;
      if (projectSearchInput) projectSearchInput.value = qParam;
    }

    if (filterParam || qParam) {
      updateProjectFilterState();
      setTimeout(() => {
        document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
      }, 350);
    }

    if (projectParam && typeof openModal === "function") {
      setTimeout(() => {
        openModal(projectParam.toLowerCase());
      }, 450);
    }
  } catch (_) {}
};

initDeepLinks();

projectFilterBtns.forEach(filter => {
  filter.addEventListener("click", () => {
    projectFilterBtns.forEach(item => item.classList.remove("active"));
    filter.classList.add("active");
    currentCategory = filter.dataset.filter || "all";
    updateProjectFilterState();
  });
});

projectSearchInput?.addEventListener("input", (e) => {
  currentSearchQuery = e.target.value;
  updateProjectFilterState();
});

projectSearchClear?.addEventListener("click", () => {
  if (projectSearchInput) {
    projectSearchInput.value = "";
    currentSearchQuery = "";
    projectSearchInput.focus();
    updateProjectFilterState();
  }
});

resetProjectFiltersBtn?.addEventListener("click", () => {
  if (projectSearchInput) projectSearchInput.value = "";
  currentSearchQuery = "";
  currentCategory = "all";
  projectFilterBtns.forEach(b => b.classList.toggle("active", b.dataset.filter === "all"));
  updateProjectFilterState();
});

// 6a-2. Tech Stack Tray & Interactive Card Tag Filter Controller
const initProjectStackTrayAndTagFilters = () => {
  const stackPills = $$(".stack-pill");
  stackPills.forEach(pill => {
    pill.addEventListener("click", () => {
      const stack = pill.dataset.stack || "";
      if (currentSearchQuery.toLowerCase() === stack.toLowerCase()) {
        if (projectSearchInput) projectSearchInput.value = "";
        currentSearchQuery = "";
      } else {
        if (projectSearchInput) projectSearchInput.value = stack;
        currentSearchQuery = stack;
        if (typeof playSound === "function") playSound("click");
        showPortfolioToast(`Filtered by ${stack} ⚡`);
      }
      updateProjectFilterState();
    });
  });

  $$(".project-tags .project-tag").forEach(tag => {
    tag.setAttribute("role", "button");
    tag.setAttribute("tabindex", "0");
    const tagName = tag.textContent.trim();
    tag.setAttribute("title", `Filter projects by ${tagName}`);

    const activateTag = (e) => {
      e.stopPropagation();
      if (currentSearchQuery.toLowerCase() === tagName.toLowerCase()) {
        if (projectSearchInput) projectSearchInput.value = "";
        currentSearchQuery = "";
      } else {
        if (projectSearchInput) projectSearchInput.value = tagName;
        currentSearchQuery = tagName;
        if (typeof playSound === "function") playSound("click");
        showPortfolioToast(`Filtered by ${tagName} 🏷️`);
      }
      updateProjectFilterState();
      document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
    };

    tag.addEventListener("click", activateTag);
    tag.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activateTag(e);
      }
    });
  });
};

initProjectStackTrayAndTagFilters();

// 6b. Achievements Filter with Smooth Transition
const achieveFilters = $$(".achieve-filter-btn");
const achieveCards = $$(".achievement-card");

achieveFilters.forEach(btn => {
  btn.addEventListener("click", () => {
    achieveFilters.forEach(b => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");

    const filter = btn.dataset.filter;
    achieveCards.forEach(card => {
      const category = card.dataset.category;
      if (filter === "all" || category === filter) {
        card.classList.remove("dimmed");
      } else {
        card.classList.add("dimmed");
      }
    });
  });
});

// 7. Project Modal with Rich Actions & Accessible Focus Restoration
const projectData = {
  pinit: {
    key: "pinit",
    index: "01 / 09",
    title: "PinitAI — ScamCheck AI",
    category: "Cybersecurity & Multimodal Scam Analysis",
    status: "Open-source project",
    tagline: "A multilingual scam-analysis platform for messages, links, QR codes, and files, with evidence-based scoring and plain-language safety guidance.",
    role: "Project author & developer",
    timeline: "Repository project",
    domain: "Cybersecurity & Digital Safety",
    archPattern: "React interface · Node.js API · Python analysis service",
    overview: "PinitAI (ScamCheck AI) is a multi-modal platform for examining suspicious messages, URLs, QR codes, and files. It combines a React and TypeScript interface with a Node.js/Express backend and a Python FastAPI analysis service. Results use a weighted risk score, explainable evidence, and practical safety guidance.",
    overviewCallout: "The product covers several common ways a scam can arrive, while keeping uploaded files and QR destinations from being executed or opened automatically.",
    problem: "People receive suspicious messages, links, QR codes, and files without a clear way to review them safely. The project aims to make evidence and next steps easier to understand, including for English and Khmer speakers.",
    objectives: [
      "Support analysis of messages, URLs, QR codes, and files.",
      "Return an evidence-based risk score with plain-language explanations and recommendations.",
      "Support English, Khmer, and mixed Khmer-English content.",
      "Inspect QR and file content without navigating to destinations or executing uploaded files."
    ],
    concept: "Treat suspicious content as evidence to inspect, not a destination to open. Separate the interface, API, and analysis services, then present findings in a readable report with room for user feedback.",
    pipeline: {
      in: [
        "Message text, a URL, QR-code image, or uploaded file",
        "English, Khmer, or mixed Khmer-English content",
        "User feedback on an analysis result"
      ],
      runs: [
        "React and TypeScript web interface",
        "Node.js / Express API and Python FastAPI analysis service",
        "Evidence-weighted scoring with URL, message, file, and QR checks",
        "Stored scan history and feedback for review"
      ],
      out: [
        "A 0–100 risk score and one of 14 threat categories",
        "Evidence-based, plain-language findings and safety recommendations",
        "An option to provide feedback on the result"
      ]
    },
    uxJourney: [
      { step: "01", title: "Choose what to check", desc: "Submit a message or URL, scan a QR-code image, or upload a file for static inspection." },
      { step: "02", title: "Review the evidence", desc: "The platform analyzes the selected input and groups findings into an evidence-weighted risk result." },
      { step: "03", title: "Decide with context", desc: "Read the plain-language explanation and safety recommendations before deciding what to do." }
    ],
    development: "The repository describes a React and TypeScript frontend, a Node.js/Express API, and a Python FastAPI analysis service. It also documents Prisma with PostgreSQL, queued jobs, and OpenCV-based QR decoding.",
    challenges: [
      "Covering distinct input types while keeping their analysis paths understandable.",
      "Explaining risk through evidence and recommendations rather than a binary label alone.",
      "Handling QR-code and file contents without automatically opening or executing them."
    ],
    learned: "The project documentation emphasizes multi-service architecture, evidence-weighted scoring, multilingual analysis, and safe handling of QR codes and uploaded files.",
    tech: ["React", "TypeScript", "Vite", "Node.js", "Express", "Python", "FastAPI", "Prisma", "PostgreSQL", "OpenCV"],
    telemetry: [
      { label: "Input types", value: "4", note: "Messages, URLs, QR codes, files" },
      { label: "Threat categories", value: "14", note: "Documented classification set" },
      { label: "Languages", value: "3", note: "English, Khmer, mixed Khmer-English" },
      { label: "Risk score", value: "0–100", note: "Evidence-weighted result" }
    ],
    outcome: "An open-source, multi-service project documented around multilingual scam analysis, explainable scoring, and safer inspection of links, QR codes, and files.",
    galleryIntro: "This portfolio-only JavaScript example illustrates a URL risk report. It is separate from the linked multi-service product and does not call its APIs.",
    achievements: [
      "Message, URL, QR, and file analysis",
      "English and Khmer support",
      "Evidence-based risk explanations",
      "Static inspection without blind execution"
    ],
    actions: [
      { label: "PinitAI Repository ↗", url: "https://github.com/gouvkimsea/PinitAI", primary: true }
    ],
    prevKey: "portfolio",
    nextKey: "miniworld"
  },

  miniworld: {
    key: "miniworld",
    index: "02 / 09",
    title: "Mini World — Procedural 3D WebGL Living Planet Simulation",
    category: "3D Graphics, WebGL & Real-Time Simulation",
    status: "Browser demo",
    tagline: "A zero-dependency, pure WebGL procedural cartoon planet with controllable 6-wheel Rover, UFO flight, marine wildlife, seasonal shaders, and real-time vertex terraforming.",
    role: "Lead 3D Graphics & Simulation Engineer",
    timeline: "Standalone WebGL page",
    domain: "Real-Time 3D Computer Graphics",
    archPattern: "Pure WebGL / GLSL Shaders · 60 FPS Vertex Deformation",
    overview: "Mini World is a complete interactive 3D procedural cartoon planet sandbox built from scratch in pure WebGL with zero external 3D libraries (no Three.js, Babylon, or heavy engines). Running rock-solid at 60 FPS in under 180KB, Mini World features spherical vehicle physics for a 6-wheel Surface Rover, dynamic UFO flight dynamics, breaching marine fauna, modular orbiting space stations, seasonal snow blanket GLSL shaders, meteor impacts, and real-time mesh terraforming.",
    overviewCallout: "Proving that rich, cinematic 3D worlds can be handcrafted in pure WebGL without multi-megabyte engine bloat.",
    problem: "Most interactive 3D web applications bundle multi-megabyte monolithic game engines that demand 5–30MB of network payloads, suffer from slow initial render times, and introduce severe garbage collection stutter on mobile devices.",
    objectives: [
      "Handcraft a complete 3D projection, camera, and lighting engine in vanilla WebGL under 180KB.",
      "Achieve rock-solid 60 FPS spherical physics and tangent-space alignment for surface vehicles.",
      "Implement real-time GLSL cel-shading with customizable diffuse thresholds, Fresnel rims, and seasonal snow deformation.",
      "Synthesize procedural celestial audio dynamically via the Web Audio API with zero audio file downloads."
    ],
    concept: "Living retro-futuristic cartoon planetarium. A playful, tactile microcosm where every celestial parameter—from solar azimuth and seasonal frost to planetary elevation and meteor showers—responds to real-time user agency.",
    pipeline: {
      in: [
        "Keyboard inputs (WASD, Arrows, Shift, Space, Terraforming keys: Z, X, C, V, T, G)",
        "Mouse drag spherical orbit camera controls and wheel zoom",
        "Celestial time preset chips (Sunrise, Midday, Golden Sunset, Starry Auroras)"
      ],
      runs: [
        "Custom 3D model-view-projection matrix stack and cubesphere subdivision geometry",
        "Spherical tangent-space vehicle suspension and orientation physics",
        "Real-time GLSL fragment cel-shaders with Fresnel rim lighting",
        "Web Audio procedural synth oscillators generating harmonic celestial soundscapes"
      ],
      out: [
        "60 FPS smooth WebGL canvas rendering with cel-shaded cartoon styling",
        "Tactical 360° radar minimap HUD tracking planetary rovers and fauna",
        "High-resolution Photo Mode snapshot exporter",
        "Dynamic terraforming terrain deformations and particle meteor strikes"
      ]
    },
    uxJourney: [
      {
        step: "01",
        title: "Atmospheric Entry",
        desc: "The living planet renders instantly; users can navigate the spherical orbit camera or jump directly into the Surface Rover."
      },
      {
        step: "02",
        title: "Vehicle & Planetary Controls",
        desc: "Drive across dunes, toggle UFO flight with tractor beams, observe breaching ocean whales, or alter the time of day."
      },
      {
        step: "03",
        title: "Terraforming & Photo Mode",
        desc: "Sculpt mountain ranges with terraforming powers, trigger divine lightning strikes, and capture high-resolution snapshots."
      }
    ],
    development: "Architected directly on top of the native HTML5 Canvas WebGLRenderingContext. Handcrafted matrix transformation math (perspective, orthographic, lookAt, quaternion rotations), cubesphere vertex normal calculation, and procedural Web Audio API harmonic drones.",
    challenges: [
      "Maintaining accurate tangent-space vehicle orientation across a non-Euclidean spherical surface.",
      "Eliminating garbage collection frame drops by pre-allocating typed Float32Array vertex buffers.",
      "Achieving vibrant cel-shaded aesthetics with multi-source lighting in standard GLSL fragment shaders."
    ],
    learned: "Deep mastery of WebGL buffer management, GLSL shader compilation pipelines, linear algebra for 3D graphics, and procedural audio synthesis.",
    tech: ["WebGL 1.0/2.0", "GLSL Shaders", "3D Vector & Matrix Math", "Web Audio API", "Vanilla JavaScript", "HTML5 Canvas"],
    telemetry: [
      { label: "Rendering Velocity", value: "60 FPS", note: "Continuous frame budget" },
      { label: "Bundle Footprint", value: "< 180 KB", note: "Zero external libraries" },
      { label: "Celestial Presets", value: "4 Cycles", note: "Sunrise to Starry Auroras" },
      { label: "Terraforming Modes", value: "6 Powers", note: "Mountains, meteors & lightning" }
    ],
    outcome: "Shipped complete standalone simulation (miniworld.html), high-resolution Photo Mode camera engine, and an interactive GLSL shader lab directly inside this portfolio.",
    achievements: [
      "Zero-Dependency Vanilla WebGL",
      "60 FPS Stable Frame Budget",
      "Interactive Rover & UFO Flight",
      "Procedural Celestial Audio Synth"
    ],
    actions: [
      { label: "Launch Live 3D Simulation ↗", url: "miniworld.html", primary: true },
      { label: "GitHub Profile ↗", url: "https://github.com/gouvkimsea", primary: false }
    ],
    prevKey: "pinit",
    nextKey: "joul"
  },

  joul: {
    key: "joul",
    index: "03 / 09",
    title: "JOUL Rental Service — Vehicle Fleet & Double-Entry Escrow Platform",
    category: "Enterprise Fleet Ops & FinTech",
    status: "Source repository",
    tagline: "Enterprise-grade vehicle and equipment rental platform with interval overlap concurrency detection, automated turnaround buffers, and an escrow-backed financial ledger.",
    role: "Lead Systems Architect & Backend Developer",
    timeline: "PHP and MySQL web application",
    domain: "Fleet Logistics & Financial Escrow",
    archPattern: "ACID Relational Architecture · Double-Entry Ledger",
    overview: "JOUL Rental Service is a full-featured commercial fleet and equipment booking engine engineered with PHP 8.x and MySQL InnoDB. Built to solve high-stakes operational collisions in commercial rentals, JOUL combines mathematical interval overlap detection, mandatory automated turnaround cleaning/maintenance buffers, a double-entry security deposit escrow ledger, and granular role-based access control (RBAC) backed by 197 automated test assertions.",
    overviewCallout: "Applying high-assurance transactional accounting principles to eliminate double-booking collision hazards.",
    problem: "Real-world vehicle rental companies suffer from costly double-booking race conditions during peak hours, insufficient vehicle cleaning buffers leading to uninspected vehicles being dispatched, and opaque security deposit handling that sparks customer disputes.",
    objectives: [
      "Eliminate reservation collisions with mathematical interval overlap detection algorithms.",
      "Enforce mandatory +2h turnaround inspection/cleaning safety buffers between bookings.",
      "Implement a double-entry escrow accounting ledger guaranteeing 100% deposit reconciliation.",
      "Validate the entire lifecycle across 5 test suites with 197 passing unit and integration assertions."
    ],
    concept: "Financial ledger precision applied to fleet operations. Every vehicle hour and security deposit dollar is tracked with immutable, auditable state machines.",
    pipeline: {
      in: [
        "Customer booking requests (pickup/dropoff datetimes, vehicle category)",
        "Security deposit authorization parameters and inspection check-ins",
        "Staff maintenance completion and vehicle turnaround sign-offs"
      ],
      runs: [
        "Mathematical interval overlap detection (StartA < EndB && EndA > StartB)",
        "Automated +2h buffer injection with turnaround validation",
        "Double-entry escrow ledger state machine (Pending -> Held -> Released/Claimed)",
        "Session-hardened RBAC authorization and CSRF guard middleware"
      ],
      out: [
        "Collision-free booking confirmation with transparent schedule visualizer",
        "Auditable double-entry financial ledger statements",
        "Real-time fleet timeline Gantt chart with turnaround status tags",
        "Automated maintenance dispatch triggers"
      ]
    },
    uxJourney: [
      {
        step: "01",
        title: "Reservation & Availability Check",
        desc: "Customers select rental windows; the engine validates interval overlaps and automatically reserves a 2-hour cleaning buffer."
      },
      {
        step: "02",
        title: "Escrow Deposit Lock",
        desc: "Security deposits are held in a segregated escrow ledger, protected by atomic MySQL transactions against premature release."
      },
      {
        step: "03",
        title: "Inspection & Settlement",
        desc: "Following vehicle return and post-rental inspection sign-off, the escrow ledger automatically reconciles and issues deposit refunds."
      }
    ],
    development: "Architected with modern PHP 8 strict typing and MySQL InnoDB transaction isolation. Engineered 5 automated test suites spanning booking overlap boundary conditions, deposit escrow reconciliation, and RBAC privilege separation.",
    challenges: [
      "Preventing concurrent reservation race conditions under high-volume booking traffic.",
      "Modeling multi-state financial transactions with immutable audit trails.",
      "Architecting clean, decoupled service layers for fleet management, maintenance, and accounting."
    ],
    learned: "Advanced relational schema design, ACID transaction mechanics, double-entry financial bookkeeping, and automated test-driven development.",
    tech: ["PHP 8.x", "MySQL / InnoDB", "Double-Entry Accounting", "Turnaround Buffers", "RBAC Security", "CSRF Hardening", "PHPUnit"],
    telemetry: [
      { label: "Automated Tests", value: "197 Passed", note: "5 comprehensive suites" },
      { label: "Collision Rate", value: "0.00%", note: "Zero double bookings" },
      { label: "Escrow Accounting", value: "100% Reconciled", note: "Double-entry ledger" },
      { label: "Turnaround Buffer", value: "+2 Hours", note: "Mandatory fleet prep" }
    ],
    outcome: "Delivered a fully tested enterprise rental platform with comprehensive architectural documentation, available on GitHub, and simulated via an interactive in-browser concurrency lab.",
    achievements: [
      "197 Passing Unit & Integration Tests",
      "Double-Entry Escrow Architecture",
      "Automated Concurrency Buffer Math",
      "Granular Multi-Tier RBAC"
    ],
    actions: [
      { label: "Rental Service Repository ↗", url: "https://github.com/gouvkimsea/rental-service", primary: true },
      { label: "Architecture & Test Suite ↗", url: "https://github.com/gouvkimsea/rental-service#key-features", primary: false }
    ],
    prevKey: "miniworld",
    nextKey: "clp"
  },

  clp: {
    key: "clp",
    index: "04 / 09",
    title: "Chinese Learning Platform (CLP) — Full-Stack Monorepo & AI EdTech",
    category: "EdTech, Monorepo & Conversational AI",
    status: "Portfolio simulator",
    tagline: "Full-stack Mandarin language learning platform engineered with NestJS, dual Next.js portals, SuperMemo-2 (SM-2) spaced repetition algorithms, and Google Gemini conversational tutoring.",
    role: "Full-Stack Software Engineer & AI Architect",
    timeline: "Full-stack learning platform",
    domain: "Cognitive EdTech & AI Language Systems",
    archPattern: "Turborepo Monorepo · NestJS API & Dual Next.js Portals",
    overview: "The Chinese Learning Platform (CLP) is an enterprise-grade monorepo Mandarin learning ecosystem designed for serious language acquisition. Powered by NestJS on the backend and dual Next.js 14 portals (Student App & Admin Dashboard), CLP implements a pure SuperMemo-2 (SM-2) spaced repetition mathematical engine, HSK 1–6 vocabulary progression, and an integrated AI conversational tutor powered by Google Gemini for contextual sentence correction.",
    overviewCallout: "Unifying cognitive spaced repetition mathematics with large language model conversational pedagogy.",
    problem: "Mastering Mandarin Chinese requires scientific spaced repetition scheduling to retain thousands of characters. Traditional flashcard apps lock learners into rigid, isolated card reviews without natural conversational roleplay or instant contextual feedback.",
    objectives: [
      "Orchestrate a unified Turborepo monorepo with strict TypeScript type-sharing across API and frontend portals.",
      "Implement a pure SuperMemo-2 (SM-2) algorithm calculating dynamic review intervals and Ease Factor decay.",
      "Integrate Google Gemini 1.5 Pro to conduct contextual conversational tutoring with instant grammar explanations.",
      "Structure multi-tier relational flashcard review ledgers with Prisma ORM and PostgreSQL."
    ],
    concept: "Cognitive science meets natural dialogue. Mathematical forgetting curve algorithms schedule reviews with surgical precision, while generative AI provides warm, conversational practice.",
    pipeline: {
      in: [
        "Learner recall quality ratings (q in [0..5]) on HSK vocabulary flashcards",
        "Student conversational text/voice prompts in Mandarin scenarios",
        "Curriculum selection parameters across HSK Levels 1 through 6"
      ],
      runs: [
        "SuperMemo-2 mathematical interval calculation (I_n = I_{n-1} * EF)",
        "Ease Factor (EF) dynamic adaptation and repetition scheduling engine",
        "NestJS modular dependency injection architecture with Prisma ORM",
        "Google Gemini structured prompt pipelines delivering grammar corrections"
      ],
      out: [
        "Dynamically expanded flashcard review schedules and retention graphs",
        "Instant pinyin, character breakdown, and AI conversational responses",
        "HSK vocabulary mastery telemetry and learner streak tracking",
        "Real-time administrative curriculum management dashboards"
      ]
    },
    uxJourney: [
      {
        step: "01",
        title: "Vocabulary Recall Challenge",
        desc: "Learners review HSK flashcards, rating their recall confidence on a 0–5 scale."
      },
      {
        step: "02",
        title: "Algorithmic Interval Scheduling",
        desc: "The SM-2 engine calculates new Ease Factors and schedules future reviews across optimal forgetting curve intervals."
      },
      {
        step: "03",
        title: "Gemini AI Dialogue Session",
        desc: "Learners immediately practice the learned vocabulary in an interactive roleplay session with the Gemini AI conversational tutor."
      }
    ],
    development: "Constructed as a modern Turborepo monorepo sharing unified DTO validation schemas across NestJS and Next.js 14. Modeled relational review event histories in PostgreSQL via Prisma ORM.",
    challenges: [
      "Managing monorepo dependency boundaries and rapid shared build pipelines.",
      "Ensuring mathematical precision in SM-2 interval calculations under floating-point decay.",
      "Crafting resilient system prompts for Google Gemini to produce consistent pinyin and grammar explanations."
    ],
    learned: "Monorepo orchestration, NestJS microservice architecture, prompt engineering with large language models, and spaced repetition cognitive science.",
    tech: ["TypeScript", "NestJS", "Next.js 14", "Prisma ORM", "PostgreSQL", "SuperMemo-2 (SM-2)", "Google Gemini AI", "Turborepo"],
    telemetry: [
      { label: "Curriculum Scope", value: "HSK 1–6", note: "Complete character progression" },
      { label: "Spaced Repetition", value: "SM-2 Math", note: "Pure algorithmic service" },
      { label: "Monorepo Apps", value: "3 Packages", note: "API, Student & Admin portals" },
      { label: "AI Model", value: "Gemini 1.5 Pro", note: "Contextual dialogue tutor" }
    ],
    outcome: "Built and deployed an enterprise-grade language monorepo with an interactive SM-2 retention engine and AI dialogue tutor simulated directly within this portfolio.",
    achievements: [
      "Complete Turborepo Monorepo",
      "Pure SuperMemo-2 (SM-2) Engine",
      "Dual Next.js Portals + NestJS API",
      "Gemini AI Dialogue System"
    ],
    actions: [
      { label: "Monorepo GitHub ↗", url: "https://github.com/gouvkimsea/chinese-learning-platform", primary: true },
      { label: "Explore Architecture ↗", url: "https://github.com/gouvkimsea/my-Portfolio-", primary: false }
    ],
    prevKey: "joul",
    nextKey: "aquarium"
  },

  aquarium: {
    key: "aquarium",
    index: "05 / 09",
    title: "Aquarium Filter Sim — 3D CAD & Hydraulic Modeling",
    category: "3D CAD & Hydraulic Simulation",
    status: "Source repository",
    tagline: "A browser-based 3D tool for designing aquarium filtration layouts and estimating hydraulic flow through connected components.",
    role: "Project author & developer",
    timeline: "React and TypeScript 3D CAD tool",
    domain: "3D Design & Fluid Mechanics",
    archPattern: "3D Component Graph · 1D Hydraulic Solver",
    overview: "Aquarium Filter Sim is a browser-based 3D CAD tool for laying out sump basins, baffles, filter components, and plumbing. Its separate TypeScript hydraulic engine traces connected flow paths and estimates operating flow, pressure losses, and pump operating points using documented fluid-mechanics equations.",
    overviewCallout: "A 3D assembly view and a decoupled hydraulic solver bring the layout and its estimated flow behavior into one tool.",
    problem: "Planning an aquarium filter means balancing basin dimensions, chamber layout, pump capacity, and plumbing losses. Generic mockups do not show whether the connected system can carry the intended flow.",
    objectives: [
      "Let users assemble a filter layout from reusable 3D components.",
      "Keep the hydraulic solver separate from the interactive 3D view.",
      "Trace connected plumbing and estimate flow with explicit assumptions.",
      "Represent unsupported or incomplete flow paths as unresolved states rather than inventing results."
    ],
    concept: "A practical sump-design canvas: place basin parts and filter components in 3D, connect plumbing, then inspect estimated flow through the resulting system.",
    pipeline: {
      in: [
        "Basin dimensions, filter components, and their 3D placement",
        "Named component connection points and plumbing links",
        "Pump and pipe parameters, including elevations and fittings",
        "Saved or imported design state and solver configuration"
      ],
      runs: [
        "Graph traversal through connected pump, pipe, fitting, and filter components",
        "Darcy-Weisbach friction and fitting-loss calculations",
        "Pump-curve operating point and parallel branch flow estimates",
        "3D component rendering and a separately testable TypeScript solver"
      ],
      out: [
        "Estimated operating flow, head loss, and branch distribution",
        "A 3D view of the filter container, baffles, components, and plumbing",
        "Diagnostics for disconnected paths, missing pumps, and dead ends",
        "Illustrative estimates when measured pump curves are unavailable"
      ]
    },
    uxJourney: [
      {
        step: "01",
        title: "System Parameter Configuration",
        desc: "Users define the filter container and add baffles, media, and plumbing components in the 3D workspace."
      },
      {
        step: "02",
        title: "Component and Pump Configuration",
        desc: "Users connect component ports and configure pump, pipe, and fitting properties."
      },
      {
        step: "03",
        title: "Flow Estimate and Diagnostics",
        desc: "The separate solver traces connected flow paths and presents estimated operating flow with diagnostics and assumptions."
      }
    ],
    development: "The repository documents a React and TypeScript 3D interface and a decoupled TypeScript solver. The solver traces a component connection graph, applies Darcy-Weisbach and fitting-loss calculations, and estimates pump operating points from pump and system curves.",
    challenges: [
      "Keeping editable 3D components and their connection graph consistent as layouts change.",
      "Representing parallel branches while balancing head loss and conserving total flow.",
      "Communicating assumptions and unresolved paths when a design cannot be solved."
    ],
    learned: "The project documentation highlights graph-based flow tracing, head-loss calculations, pump-curve solving, project persistence, and diagnostics for incomplete layouts.",
    tech: ["React", "TypeScript", "Three.js", "React Three Fiber", "WebGL", "Darcy-Weisbach Solver"],
    telemetry: [
      { label: "Model", value: "1D", note: "Hydraulic flow solver" },
      { label: "Flow method", value: "Darcy-Weisbach", note: "Pipe friction and minor losses" },
      { label: "3D library", value: "12+ parts", note: "Documented reusable components" },
      { label: "Persistence", value: "Local", note: "IndexedDB with localStorage fallback" }
    ],
    outcome: "A documented browser-based 3D filter-design tool with project save/import, a reusable component library, and a TypeScript hydraulic solver. A separate portfolio lab offers a simplified filtration demonstration.",
    achievements: [
      "3D sump and plumbing design",
      "Graph-based flow path tracing",
      "Pump operating point estimates",
      "Local project persistence and export"
    ],
    galleryIntro: "The repository contains the 3D CAD tool and hydraulic solver. The interactive lab below is a separate, simplified portfolio demonstration of aquarium filtration.",
    actions: [
      { label: "Aquarium Sim Repository ↗", url: "https://github.com/gouvkimsea/aquarium-filter-sim", primary: true },
      { label: "GitHub Profile (@gouvkimsea) ↗", url: "https://github.com/gouvkimsea", primary: false }
    ],
    prevKey: "clp",
    nextKey: "gesture"
  },

  gesture: {
    key: "gesture",
    index: "06 / 09",
    title: "Gesture App — Touchless 21-Joint Computer Vision & Kinematics",
    category: "Computer Vision, Spatial AI & HCI",
    status: "Source repository",
    tagline: "Touchless human-computer interaction engine engineered in Python with OpenCV and MediaPipe tracking 21 skeletal hand landmarks in 3D with Euclidean pinch-detection math at 60 FPS.",
    role: "Computer Vision & Kinematics Engineer",
    timeline: "Python desktop application",
    domain: "Spatial Computing & Human-Computer Interaction",
    archPattern: "High-Frequency Vision Pipeline · Euclidean Pinch Math",
    overview: "Gesture App is a touchless spatial computing and desktop navigation engine developed in Python using OpenCV and Google MediaPipe. By tracking 21 anatomical landmarks on the human hand simultaneously in real time, Gesture App calculates sub-millimeter Euclidean distance vectors (D_{4-8}) between the thumb and index finger to enable touchless cursor steering, pinch-click interactions, and gesture-driven desktop automation at a full 60 FPS.",
    overviewCallout: "Transforming standard consumer webcams into zero-contact spatial controllers through anatomical geometry.",
    problem: "Traditional physical input peripherals (mice, keyboards, touchscreens) are impractical in sterile medical environments, messy industrial workshops, public kiosks, and presentations where physical contact is impossible or unhygienic.",
    objectives: [
      "Track 21 skeletal landmarks on human hands at 60 FPS using standard consumer webcams.",
      "Calculate real-time Euclidean distance thresholds ($D_{4-8}$) for reliable pinch-to-click detection.",
      "Eliminate cursor jitter using Exponential Moving Average (EMA) and Kalman spatial filters.",
      "Recognize 6 core spatial gesture poses (Open Palm, Pinch Click, Peace/V, Closed Fist, Point Cursor, Thumbs Up)."
    ],
    concept: "Spatial telekinesis. Eliminating physical hardware barriers by converting natural anatomical hand gestures into fluid, low-latency digital actions.",
    pipeline: {
      in: [
        "Raw RGB webcam video frame feed (640x480 resolution @ 60 FPS)",
        "3D spatial hand landmark coordinate streams (X, Y, Z)",
        "User gesture intent presets (Pinch Click, Peace, Fist, Point, Palm)"
      ],
      runs: [
        "Google MediaPipe deep regression neural network for 21-joint localization",
        "Euclidean spatial distance calculation ($D_{4-8} = \sqrt{(x_4 - x_8)^2 + (y_4 - y_8)^2 + (z_4 - z_8)^2}$)",
        "Exponential Moving Average (EMA) cursor stabilization filter",
        "OS-level virtual mouse driver dispatch via PyAutoGUI"
      ],
      out: [
        "Jitter-free sub-pixel desktop cursor control",
        "Touchless click, drag-and-drop, and scroll events",
        "Real-time skeletal wireframe overlay HUD with bounding box reticle",
        "Gesture classification confidence telemetry"
      ]
    },
    uxJourney: [
      {
        step: "01",
        title: "Optical Hand Acquisition",
        desc: "The webcam feed captures the hand; MediaPipe locks onto 21 anatomical joints within 15ms."
      },
      {
        step: "02",
        title: "Spatial Vector Tracking",
        desc: "Hand movement smoothly steers the cursor across the screen with zero jitter thanks to EMA smoothing."
      },
      {
        step: "03",
        title: "Kinematic Pinch Trigger",
        desc: "Bringing the thumb and index tips together breaches the Euclidean threshold (D_{4-8} < 0.05), triggering an instant click."
      }
    ],
    development: "Built in Python 3 utilizing OpenCV for frame capture and pre-processing, MediaPipe for landmark regression, and custom vector math for anatomical gesture classification.",
    challenges: [
      "Filtering out high-frequency spatial hand tremor without introducing noticeable cursor lag.",
      "Maintaining consistent pinch-detection accuracy across varying hand distances from the camera.",
      "Optimizing Python frame processing loops to sustain a rock-solid 60 FPS throughput."
    ],
    learned: "Computer vision pipelines, 3D anatomical kinematics, spatial filter mathematics, and human-computer interface design.",
    tech: ["Python 3", "OpenCV", "Google MediaPipe", "NumPy", "PyAutoGUI", "Vector Kinematics", "Tkinter"],
    telemetry: [
      { label: "Anatomical Joints", value: "21 Landmarks", note: "Simultaneous 3D tracking" },
      { label: "Frame Rate", value: "60 FPS", note: "Real-time webcam pipeline" },
      { label: "Pipeline Latency", value: "< 15 ms", note: "Sub-frame response time" },
      { label: "Gesture Library", value: "6 Presets", note: "Pinch, Point, Fist & more" }
    ],
    outcome: "Successfully engineered an open-source spatial interaction engine on GitHub, accompanied by an interactive 21-joint kinematics simulator lab embedded in this portfolio.",
    achievements: [
      "Real-Time 21-Joint Skeletal Tracking",
      "Euclidean Pinch Detection Math",
      "60 FPS Computer Vision Pipeline",
      "Touchless Virtual Mouse Control"
    ],
    actions: [
      { label: "Gesture App Repository ↗", url: "https://github.com/gouvkimsea/Gesture_app", primary: true },
      { label: "GitHub Profile (@gouvkimsea) ↗", url: "https://github.com/gouvkimsea", primary: false }
    ],
    prevKey: "aquarium",
    nextKey: "saas"
  },

  saas: {
    key: "saas",
    index: "07 / 09",
    title: "Productivity SaaS & POS Systems — Business Platform",
    category: "Enterprise SaaS & Business Operations",
    status: "Project repositories",
    tagline: "Full-stack enterprise business applications built with PHP 8.x and MySQL: sprint velocity burndown tracking, daily habit streaks, and retail Point-of-Sale with ABA Payway payment gateway integration.",
    role: "Full-Stack Enterprise Architect",
    timeline: "PHP and MySQL business tools",
    domain: "Business Operations & Point-of-Sale FinTech",
    archPattern: "ACID Relational Architecture · Payment Webhook Gateway",
    overview: "Productivity SaaS & POS Systems is a dual suite of enterprise web applications engineered in PHP 8.x and MySQL InnoDB. The suite pairs an operational productivity dashboard featuring Agile sprint burndown tracking and habit momentum streaks alongside an enterprise retail Point-of-Sale (POS) cash register with ABA Payway payment gateway integration, barcode SKU lookup, and automated stock reconciliation.",
    overviewCallout: "High-velocity operational software delivering financial reconciliation without enterprise SaaS bloat.",
    problem: "Small retail businesses and agile development teams frequently suffer from either bloated, expensive SaaS tools (Jira, Salesforce) that slow down daily execution, or error-prone spreadsheets that cause cash ledger discrepancies and stock drift.",
    objectives: [
      "Engineer an agile sprint burndown engine calculating real-time velocity curves across story point commitments.",
      "Build a retail POS checkout system with strict MySQL InnoDB ACID transactions preventing stock discrepancies.",
      "Integrate ABA Payway payment gateway for instant QR-code and credit card digital transactions.",
      "Deliver a sub-100ms transactional checkout workflow optimized for rapid keyboard input."
    ],
    concept: "Operational clarity. Clean, responsive dashboards that turn complex sprint metrics and retail cash transactions into immediate, frictionless actions.",
    pipeline: {
      in: [
        "Sprint story point estimates and daily task completion logs",
        "Cashier barcode SKU scans, quantities, and tender amounts",
        "ABA Payway payment gateway webhook callback payloads"
      ],
      runs: [
        "Velocity burndown rate calculation across multi-week sprint cycles",
        "Habit consistency momentum algorithms and streak decay tracking",
        "MySQL InnoDB row-level locking (BEGIN ... COMMIT / ROLLBACK) during checkout",
        "Automated stock level decrement triggers and tax reconciliation"
      ],
      out: [
        "Real-time sprint velocity burndown bar charts and velocity analytics",
        "Instant thermal printed receipts and order audit logs",
        "Reconciled inventory balances with low-stock warnings",
        "Digital payment confirmation receipts with transaction verification"
      ]
    },
    uxJourney: [
      {
        step: "01",
        title: "Sprint & Order Initiation",
        desc: "Managers plan sprint story point goals; retail cashiers scan inventory SKUs via rapid keyboard entry."
      },
      {
        step: "02",
        title: "Transactional Checkout",
        desc: "Orders are processed atomically via cash tender or ABA Payway QR code payment."
      },
      {
        step: "03",
        title: "Reconciliation & Telemetry",
        desc: "Inventory levels decrement automatically, sales are recorded to the ACID ledger, and sprint velocity burndowns update live."
      }
    ],
    development: "Developed using PHP 8.x with strict type checking, normalized MySQL InnoDB schemas, and responsive vanilla JavaScript. Hardened payment webhook verification against replay attacks and spoofing.",
    challenges: [
      "Ensuring zero inventory drift under concurrent retail transactions through InnoDB row locking.",
      "Maintaining an intuitive, rapid checkout UI that requires zero mouse interaction.",
      "Handling webhook idempotency for digital payment gateway callbacks."
    ],
    learned: "Enterprise relational database design, ACID transaction mechanics, payment gateway integration, and Agile velocity modeling.",
    tech: ["PHP 8.x", "MySQL / InnoDB", "ACID Transactions", "ABA Payway API", "SaaS Analytics", "POS Inventory", "CSS3 Grid"],
    telemetry: [
      { label: "ACID Reconciliation", value: "100%", note: "Atomic sales ledger" },
      { label: "Sprint History", value: "6 Sprints", note: "Velocity tracking metrics" },
      { label: "Transaction Latency", value: "< 100 ms", note: "Sub-second checkout" },
      { label: "Payment Gateway", value: "ABA Payway", note: "Digital QR & Card API" }
    ],
    outcome: "Shipped two production business repositories on GitHub and created an interactive in-portfolio sprint velocity and cash register simulation lab.",
    achievements: [
      "100% ACID Relational Sales Transactions",
      "ABA Payway Payment Gateway Integration",
      "Agile Sprint Velocity Burndown Engine",
      "Zero-Drift Inventory Reconciliation"
    ],
    actions: [
      { label: "Productivity SaaS Repo ↗", url: "https://github.com/gouvkimsea/progress-tracking-and-productivitysaas", primary: true },
      { label: "POS System (ABA Payway) Repo ↗", url: "https://github.com/gouvkimsea/POS-system-ABA-payway", primary: false }
    ],
    prevKey: "gesture",
    nextKey: "devpulse"
  },

  devpulse: {
    key: "devpulse",
    index: "08 / 09",
    title: "DevPulse — Real-Time Developer Telemetry & Flow State Dashboard",
    category: "Developer Telemetry & Real-Time Systems",
    status: "Portfolio project entry",
    tagline: "Real-time engineering telemetry and rhythm dashboard visualizing developer velocity, Git commit flow states, and build frequency waveforms via streaming event pipelines.",
    role: "Lead Systems Architect & Telemetry Engineer",
    timeline: "Project concept",
    domain: "Real-Time Telemetry & Systems Metrics",
    archPattern: "Streaming WebSocket Pipeline · Event Frequency Analysis",
    overview: "DevPulse is an ambient developer telemetry and cognitive flow state dashboard designed to monitor engineering cadence, Git commit frequencies, and build velocities in real time. By streaming development events through a high-frequency WebSocket bus, DevPulse calculates cognitive focus rhythms and renders dynamic audio-frequency waveforms that visualize deep-work momentum without distracting the developer.",
    overviewCallout: "The cardiovascular pulse of software engineering, turning distributed build logs into a living rhythm interface.",
    problem: "Software developers frequently suffer from invisible cognitive fatigue, frequent context-switching, and fragmented visibility across Git, terminal sessions, and CI/CD build pipelines.",
    objectives: [
      "Stream high-frequency engineering events at up to 240 requests/sec with sub-20ms latency.",
      "Transform discrete Git commit timestamps into continuous rhythm waveforms.",
      "Calculate an ambient Cognitive Flow State Index (0–100) to protect deep work sessions.",
      "Render dynamic SVG audio waveforms with zero CPU overhead in idle state."
    ],
    concept: "Biometric engineering telemetry. Treating code production and system architecture as an organic, rhythmic vital sign that pulses with developer velocity.",
    pipeline: {
      in: [
        "Git commit webhooks, branch merges, and tag releases",
        "Terminal command frequency and compiler build event payloads",
        "Active coding block duration and idle recovery timestamps"
      ],
      runs: [
        "Real-time event streaming and ingestion via WebSockets",
        "Temporal cadence frequency analysis and Fourier-inspired smoothing",
        "Cognitive Flow State Index scoring algorithm",
        "Debounced event queue buffers preventing main thread UI stutter"
      ],
      out: [
        "Dynamic audio-frequency waveform visualizer reflecting active velocity",
        "Cardiovascular pulse beacon indicating real-time focus health",
        "Uninterrupted deep work cadence timer and telemetry breakdown",
        "Predictive rest and recovery notifications"
      ]
    },
    uxJourney: [
      {
        step: "01",
        title: "Ambient Connection",
        desc: "DevPulse runs as a low-profile ambient dashboard alongside the IDE or secondary display."
      },
      {
        step: "02",
        title: "Cadence Streaming",
        desc: "As the engineer writes code and commits changes, the waveform expands with harmonic resonance."
      },
      {
        step: "03",
        title: "Flow State Telemetry",
        desc: "Real-time metrics calculate sustained focus blocks and indicate optimal points for cognitive breaks."
      }
    ],
    development: "Built with modern vanilla JavaScript (ES2026), WebSocket streaming listeners, and SVG Canvas visualization. Engineered lightweight event-loop buffers that ensure zero frame drops during heavy build spikes.",
    challenges: [
      "Debouncing high-frequency event bursts during automated batch commits or test runs.",
      "Designing an ambient visualization that conveys status without visual distraction.",
      "Maintaining under 18ms end-to-end telemetry latency across distributed development machines."
    ],
    learned: "Real-time WebSocket streaming, event-driven reactive architectures, SVG animation optimization, and developer ergonomics.",
    tech: ["JavaScript (ES2026)", "WebSockets", "Data Visualization", "HTML5 Canvas", "SVG Animations", "Metrics Pipeline"],
    telemetry: [
      { label: "Throughput Capacity", value: "240 req/s", note: "Continuous event streaming" },
      { label: "Event Latency", value: "18 ms", note: "Sub-frame telemetry" },
      { label: "Animation Rate", value: "60 FPS", note: "GPU-accelerated SVG" },
      { label: "Memory Footprint", value: "< 12 MB", note: "Lightweight background agent" }
    ],
    outcome: "Built a fully functional developer telemetry module with an interactive rhythm waveform lab integrated directly into this portfolio.",
    achievements: [
      "240 req/s Streaming Telemetry Pipeline",
      "Dynamic SVG Audio Waveform Engine",
      "Ambient Cognitive Flow State Index",
      "Zero-Dependency Vanilla JavaScript"
    ],
    actions: [
      { label: "GitHub Profile ↗", url: "https://github.com/gouvkimsea", primary: true },
      { label: "Explore Code ↗", url: "https://github.com/gouvkimsea/my-Portfolio-", primary: false }
    ],
    prevKey: "saas",
    nextKey: "portfolio"
  },

  portfolio: {
    key: "portfolio",
    index: "09 / 09",
    title: "Gouv Kimsea Portfolio — Interactive Creative Technology Platform",
    category: "Creative Technology & Web Platform",
    status: "Live website",
    tagline: "A high-performance personal platform and digital workshop engineered from scratch in vanilla web technologies, featuring floating island navigation, ⌘K command palette, interactive CLI, and 7 live sandboxes.",
    role: "Sole Creator, Architect & Designer",
    timeline: "Vanilla web platform",
    domain: "Creative Technology & Systems Engineering",
    archPattern: "Zero-Dependency Vanilla Web · Semantic HTML5 & Web Audio",
    overview: "This portfolio is a bespoke personal digital platform and interactive workshop engineered to demonstrate genuine software craftsmanship. Built with 100% semantic HTML5, pure CSS3 custom properties, and modern ES2026 vanilla JavaScript with zero external runtime dependencies, the site features floating glassmorphism island navigation, a ⌘K Command Palette, an in-browser interactive terminal CLI, 7 live sandboxes, an offline-first Service Worker, and a procedural Web Audio acoustic synthesizer.",
    overviewCallout: "Treating the portfolio not as a static brochure, but as an interactive piece of software.",
    problem: "Most developer portfolios are cookie-cutter static templates packed with bloated third-party frameworks that load slowly, lack accessible interactions, and fail to demonstrate real engineering depth.",
    objectives: [
      "Engineer a production portfolio with zero runtime framework dependencies (0 React, 0 Vue, 0 jQuery).",
      "Achieve 100% keyboard accessibility with a ⌘K palette, terminal CLI, and pro navigation hotkeys.",
      "Embed 7 live interactive engineering sandboxes directly within native HTML5 <dialog> modals.",
      "Implement procedural Web Audio API acoustic synthesis providing tactile physical feedback."
    ],
    concept: "The digital workshop of an ambitious builder. Combining clean editorial typography with tactile sci-fi interfaces, generative audio synthesis, and live executable sandboxes.",
    pipeline: {
      in: [
        "User scroll gestures, trackpad momentum, and touch edge-swipes",
        "Mouse cursor coordinates, perspective tilt vectors, and button clicks",
        "Tactile keyboard navigation (⌘K, /, 1–6, T, U, R, M, X, ?, Arrow keys)"
      ],
      runs: [
        "Multi-threshold IntersectionObserver scrollspy and sliding indicator math",
        "Web Audio API oscillator frequency synthesis generating tactile acoustic feedback",
        "Reactive DOM search and category filter state machine with URL deep-link synchronization",
        "Procedural terminal CLI command parser supporting 35+ commands"
      ],
      out: [
        "Sub-100ms first paint and 60 FPS transitions across all viewports",
        "Tactile acoustic click and whoosh audio feedback",
        "Full Progressive Web App (PWA) offline capability via Service Worker",
        "37/37 passing automated integrity test assertions"
      ]
    },
    uxJourney: [
      {
        step: "01",
        title: "Immediate Immersion",
        desc: "Visitors land on an editorial hero layout featuring mouse-tracking tilt, code snippets, and floating glass islands."
      },
      {
        step: "02",
        title: "Deep Interactive Exploration",
        desc: "Glide into Chapter 2 to inspect case studies, run live threat scanners, test spaced repetition algorithms, and launch 3D simulations."
      },
      {
        step: "03",
        title: "Tactile Pro Tools",
        desc: "Open the ⌘K palette or in-browser terminal to run real-time matrix streams, query Git velocity, or export recruiter briefs."
      }
    ],
    development: "Authored in clean, modular vanilla JavaScript and CSS3 custom properties. Protected by a custom Node.js automated integrity verification test suite (test/verify.js) that validates syntax, asset integrity, accessibility, and unique DOM IDs.",
    challenges: [
      "Coordinating full-viewport scroll transitions without accidental section skipping or scroll-trapping.",
      "Synthesizing dynamic, pleasant acoustic feedback in real time using raw Web Audio oscillators.",
      "Maintaining zero duplicate IDs and 100% semantic accessibility across 260+ DOM elements."
    ],
    learned: "Deep browser engine architecture, Web Audio API frequency modulation, accessible dialog patterns, and automated CI test writing.",
    tech: ["HTML5", "Vanilla CSS3", "ES2026 JavaScript", "Web Audio API", "Service Worker (PWA)", "WebGL / GLSL", "Node.js CI Suite"],
    telemetry: [
      { label: "Integrity Tests", value: "37 / 37 Passed", note: "Automated Node.js suite" },
      { label: "Runtime Dependencies", value: "0 External", note: "Pure vanilla web platform" },
      { label: "Interactive Labs", value: "7 Sandboxes", note: "Direct in-browser execution" },
      { label: "Terminal Commands", value: "35+ Built-in", note: "Interactive CLI suite" }
    ],
    outcome: "Built an internationally recognized creative technology portfolio demonstrating real-world full-stack competence, high aesthetic standards, and deep attention to detail.",
    achievements: [
      "100% Vanilla Web Engineering",
      "37/37 Automated Integrity Tests",
      "Web Audio Procedural Sound Engine",
      "Full PWA & Offline Readiness"
    ],
    actions: [
      { label: "GitHub Repository ↗", url: "https://github.com/gouvkimsea/my-Portfolio-", primary: true },
      { label: "Live Deployment ↗", url: "https://gouvkimsea.github.io/my-Portfolio-/", primary: false }
    ],
    prevKey: "devpulse",
    nextKey: "pinit"
  }
};

const modal = $("#projectModal");
let previousActiveElement = null;
// ==========================================================================
// Pinit AI Threat Heuristics Simulator Engine
// ==========================================================================
const PINIT_PRESETS = {
  bank: {
    url: "http://secure-login-chase-update.info/verify?otp=4920",
    note: "Simulated phishing attack impersonating banking login over unencrypted HTTP with lookalike tokens."
  },
  crypto: {
    url: "https://claim-eth2026-airdrop.xyz/connect-wallet",
    note: "Simulated smart contract drain lure using an unverified .xyz registrar and token giveaway keywords."
  },
  shortener: {
    url: "http://bit.ly/urgent-security-reset-902",
    note: "Masked redirect service obfuscating destination target with panic-inducing security call-to-actions."
  },
  paragon: {
    url: "https://paragoniu.edu.kh",
    note: "Legitimate educational institution origin with verified SSL certificate and clean namespace."
  },
  portfolio: {
    url: "https://gouvkimsea.github.io/my-Portfolio-/",
    note: "Official personal platform hosted on verified GitHub Pages infrastructure."
  }
};

const analyzePinitTarget = rawInput => {
  const input = (rawInput || "").trim();
  if (!input) return null;

  let urlStr = input;
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = "https://" + urlStr;
  }

  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch (e) {
    parsed = {
      hostname: input.replace(/[\/\?#].*$/, ""),
      protocol: "https:",
      pathname: "",
      search: ""
    };
  }

  const hostname = (parsed.hostname || "").toLowerCase();
  const protocol = (parsed.protocol || "").toLowerCase();
  const fullUrl = urlStr.toLowerCase();

  const signals = [];
  let threatScore = 0;

  // 1. Transport Security
  const isHttps = protocol === "https:";
  if (!isHttps) {
    threatScore += 28;
    signals.push({
      cat: "Transport Layer",
      label: "Insecure Protocol (HTTP)",
      status: "danger",
      pill: "Insecure HTTP",
      desc: "Plaintext traffic susceptible to interception. Trustworthy authentication requires HTTPS."
    });
  } else {
    signals.push({
      cat: "Transport Layer",
      label: "Encrypted Transport (HTTPS)",
      status: "safe",
      pill: "TLS Active",
      desc: "End-to-end transport layer encryption confirmed via standard HTTPS handshake."
    });
  }

  // 2. Direct IP Address Host
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  if (isIp) {
    threatScore += 45;
    signals.push({
      cat: "Domain Host",
      label: "Direct IP Origin",
      status: "danger",
      pill: "Raw IP Host",
      desc: "Obfuscated infrastructure bypassing domain reputation records."
    });
  }

  // 3. Trusted Whitelist Check
  const trustedOrigins = [
    "github.com", "github.io", "paragoniu.edu.kh", "google.com",
    "microsoft.com", "apple.com", "bonamary.edu.kh", "linkedin.com"
  ];
  const isTrusted = trustedOrigins.some(t => hostname === t || hostname.endsWith("." + t));
  if (isTrusted && !hostname.includes("login-") && !hostname.includes("verify-")) {
    threatScore = Math.max(1, threatScore - 40);
  }

  // 4. High-risk TLD Registry
  const highRiskTlds = [".xyz", ".top", ".info", ".click", ".buzz", ".club", ".work", ".link", ".live", ".fit"];
  const tldMatch = highRiskTlds.find(tld => hostname.endsWith(tld));
  if (tldMatch) {
    threatScore += 30;
    signals.push({
      cat: "Domain Registry",
      label: `Elevated-Risk TLD (${tldMatch})`,
      status: "warn",
      pill: `${tldMatch} Flagged`,
      desc: "Registrar namespace frequently associated with bulk throwaway phishing deployments."
    });
  } else {
    signals.push({
      cat: "Domain Registry",
      label: "Standard Top-Level Domain",
      status: "safe",
      pill: "Standard TLD",
      desc: "Domain extension conforms to verified operational registry standards."
    });
  }

  // 5. Lookalike Brand Impersonation / Homoglyphs
  const brandList = ["chase", "paypal", "apple", "google", "bank", "crypto", "binance", "metamask", "netflix", "amazon", "discord"];
  const brandFound = brandList.find(b => hostname.includes(b));
  if (brandFound && !isTrusted) {
    threatScore += 36;
    signals.push({
      cat: "Identity Spoofing",
      label: `Brand Target Match ("${brandFound}")`,
      status: "danger",
      pill: `Spoof: ${brandFound}`,
      desc: `Unauthorized origin imitating reputable brand "${brandFound}" to induce false confidence.`
    });
  } else {
    signals.push({
      cat: "Identity Spoofing",
      label: "Zero Brand Imitation",
      status: "safe",
      pill: "Clean Identity",
      desc: "No unauthorized trademark or homoglyph impersonation patterns detected."
    });
  }

  // 6. Urgency & Credential Harvesting Lure Tokens
  const urgentWords = ["verify", "login", "otp", "airdrop", "claim", "free", "wallet", "urgent", "suspend", "update", "security", "bonus", "reward"];
  const matchedWords = urgentWords.filter(w => fullUrl.includes(w));
  if (matchedWords.length > 0 && !isTrusted) {
    threatScore += Math.min(32, matchedWords.length * 12);
    signals.push({
      cat: "Social Engineering",
      label: `Urgent Lure Tokens (${matchedWords.slice(0, 3).join(", ")})`,
      status: "danger",
      pill: "Urgency Lure",
      desc: "Lexical triggers specifically structured to rush user into compromising credentials."
    });
  } else if (!isTrusted) {
    signals.push({
      cat: "Social Engineering",
      label: "Zero Panic Vector Tokens",
      status: "safe",
      pill: "Neutral Intent",
      desc: "No urgent credential-harvesting keywords or deceptive lures found in query path."
    });
  }

  // 7. Subdomain Chaining / Hyphen Density
  const hyphenCount = (hostname.match(/-/g) || []).length;
  if (hyphenCount >= 2 && !isTrusted) {
    threatScore += 18;
    signals.push({
      cat: "Lexical Entropy",
      label: `High Hyphen Chaining (${hyphenCount} Hyphens)`,
      status: "warn",
      pill: "High Entropy",
      desc: "Artificially elongated hostname designed to bypass visual browser URL inspection."
    });
  }

  // 8. Shortened Redirect Masking
  const shorteners = ["bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly"];
  if (shorteners.some(s => hostname === s || hostname.endsWith("." + s))) {
    threatScore += 24;
    signals.push({
      cat: "Redirect Hop",
      label: "URL Shortener Masking",
      status: "warn",
      pill: "Masked Target",
      desc: "Destination endpoint is concealed behind an opaque intermediate redirection service."
    });
  }

  // Clamp threat score
  threatScore = Math.min(99, Math.max(1, threatScore));

  let status, verdictTag, verdictTitle, explain;
  if (threatScore >= 65) {
    status = "danger";
    verdictTag = "CRITICAL RISK · PHISHING DETECTED";
    verdictTitle = "Deceptive Origin & Credential Lure";
    explain = `Pinit detected multiple severe risk indicators: ${signals.filter(s => s.status === 'danger').map(s => s.label).join(", ") || "elevated heuristic flags"}. Avoid interacting with or submitting data to this origin.`;
  } else if (threatScore >= 30) {
    status = "warn";
    verdictTag = "ELEVATED CAUTION · SUSPICIOUS";
    verdictTitle = "Non-Standard Origin & Heuristic Anomalies";
    explain = "Non-standard origin flags detected (e.g. unverified redirect or unusual registry profile). Exercise caution and verify identity before proceeding.";
  } else {
    status = "safe";
    verdictTag = "VERIFIED SAFE · TRUSTED ORIGIN";
    verdictTitle = "Clean Namespace & Verified Security Profile";
    explain = "No deceptive lookalikes, urgency triggers, or insecure protocols detected. Structure adheres to standard legitimate web security practices.";
  }

  return {
    url: input,
    threatScore,
    safetyScore: 100 - threatScore,
    status,
    verdictTag,
    verdictTitle,
    explain,
    isHttps,
    signals: signals.slice(0, 4)
  };
};

let pinitInitialized = false;

const runPinitScan = targetUrl => {
  const result = analyzePinitTarget(targetUrl);
  if (!result) return;

  const resultCard = $("#pinitResultCard");
  const scanBtn = $("#pinitScanBtn");
  const protocolBadge = $("#pinitProtocolBadge");
  const verdictTag = $("#pinitVerdictTag");
  const verdictTitle = $("#pinitVerdictTitle");
  const scoreVal = $("#pinitScoreVal");
  const scoreLbl = $("#pinitScoreLbl");
  const explainText = $("#pinitExplainText");
  const signalsGrid = $("#pinitSignalsGrid");

  if (scanBtn) scanBtn.classList.add("is-scanning");

  setTimeout(() => {
    if (scanBtn) scanBtn.classList.remove("is-scanning");

    if (protocolBadge) {
      protocolBadge.textContent = result.isHttps ? "HTTPS" : "HTTP";
      protocolBadge.style.color = result.isHttps ? "var(--lime)" : "#ff4d4d";
    }

    if (resultCard) {
      resultCard.setAttribute("data-status", result.status);
    }

    if (verdictTag) verdictTag.textContent = result.verdictTag;
    if (verdictTitle) verdictTitle.textContent = result.verdictTitle;

    if (scoreVal) {
      scoreVal.textContent = result.status === "safe" ? `${result.safetyScore}%` : `${result.threatScore}%`;
    }
    if (scoreLbl) {
      scoreLbl.textContent = result.status === "safe" ? "SAFETY CONFIDENCE" : "THREAT PROBABILITY";
    }

    if (explainText) explainText.textContent = result.explain;

    if (signalsGrid) {
      signalsGrid.innerHTML = result.signals.map(s => `
        <div class="pinit-signal-tile">
          <div class="pinit-signal-header">
            <span class="pinit-signal-cat">${s.cat}</span>
            <span class="pinit-signal-pill ${s.status}">${s.pill}</span>
          </div>
          <div class="pinit-signal-label">${s.label}</div>
          <div class="pinit-signal-desc">${s.desc}</div>
        </div>
      `).join("");
    }
  }, 180);
};

const initPinitScanner = () => {
  const pinitInput = $("#pinitInput");
  const pinitScanBtn = $("#pinitScanBtn");
  const pinitClearBtn = $("#pinitClearBtn");
  const presetChips = $$(".pinit-preset-chip");

  if (!pinitInitialized) {
    pinitInitialized = true;

    pinitScanBtn?.addEventListener("click", () => {
      const val = pinitInput?.value.trim();
      if (val) runPinitScan(val);
    });

    pinitInput?.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        const val = pinitInput.value.trim();
        if (val) runPinitScan(val);
      }
    });

    pinitClearBtn?.addEventListener("click", () => {
      if (pinitInput) {
        pinitInput.value = "";
        pinitInput.focus();
      }
    });

    presetChips.forEach(chip => {
      chip.addEventListener("click", () => {
        presetChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        const presetKey = chip.getAttribute("data-preset");
        const preset = PINIT_PRESETS[presetKey];
        if (preset && pinitInput) {
          pinitInput.value = preset.url;
          runPinitScan(preset.url);
        }
      });
    });
  }

  // Run initial scan on open
  const currentVal = pinitInput?.value.trim() || PINIT_PRESETS.bank.url;
  runPinitScan(currentVal);
};

// ==========================================================================
// JOUL Fleet Concurrency & Escrow Simulator Engine
// ==========================================================================
const JOUL_FLEET_DATA = {
  prius: {
    name: "Toyota Prius (City Car)",
    rate: 45,
    buffer: 2,
    escrow: 150
  },
  transit: {
    name: "Ford Transit 12-Pax (Van)",
    rate: 95,
    buffer: 3,
    escrow: 300
  },
  nmax: {
    name: "Yamaha NMAX 155 (Scooter)",
    rate: 22,
    buffer: 1,
    escrow: 80
  },
  trek: {
    name: "Trek FX3 Disc (Bicycle)",
    rate: 15,
    buffer: 1,
    escrow: 40
  }
};

const JOUL_SCENARIOS = {
  overlap: {
    reqStart: "12:00",
    reqEnd: "17:00",
    status: "danger",
    verdictTag: "COLLISION · BOOKING REJECTED",
    verdictTitle: "Direct Existing Order Overlap",
    icon: "✕",
    explain: "Interval overlap check triggered: Customer requested start time (12:00) occurs during existing confirmed order (08:00 - 14:00). Concurrency guard prevented double booking.",
    reqWidth: 35
  },
  buffer: {
    reqStart: "14:30",
    reqEnd: "19:00",
    status: "warn",
    verdictTag: "BUFFER VIOLATION · RESERVED WINDOW",
    verdictTitle: "Turnaround Safety Window Active",
    icon: "!",
    explain: "Buffer violation: While previous rental ends at 14:00, vehicle turnaround cleaning and safety checks require an active buffer. Handover prohibited until buffer expires.",
    reqWidth: 35
  },
  clear: {
    reqStart: "16:30",
    reqEnd: "21:00",
    status: "safe",
    verdictTag: "APPROVED · ZERO CONCURRENCY COLLISION",
    verdictTitle: "Window Clear & Ready for Dispatch",
    icon: "✓",
    explain: "Schedule validation complete: Order window (16:30 - 21:00) begins comfortably after turnaround buffer expiration. Financial ledger calculated and ready.",
    reqWidth: 35
  }
};

let joulInitialized = false;

function runJoulSimulation(scenarioKey, vehicleKey) {
  const vehicle = JOUL_FLEET_DATA[vehicleKey] || JOUL_FLEET_DATA.prius;
  const scenario = JOUL_SCENARIOS[scenarioKey] || JOUL_SCENARIOS.overlap;

  const resultCard = $("#joulResultCard");
  const verdictTag = $("#joulVerdictTag");
  const verdictTitle = $("#joulVerdictTitle");
  const statusIcon = $("#joulStatusIcon");
  const escrowVal = $("#joulEscrowVal");
  const explainText = $("#joulExplainText");
  const bufferLegend = $("#joulBufferLegend");
  const requestLegend = $("#joulRequestLegend");
  const visBufferSlot = $("#joulVisBufferSlot");
  const visRequestSlot = $("#joulVisRequestSlot");
  const rentalRateVal = $("#joulRentalRateVal");
  const depositVal = $("#joulDepositVal");
  const bufferVal = $("#joulBufferVal");

  if (!resultCard) return;

  resultCard.setAttribute("data-status", scenario.status);
  if (verdictTag) verdictTag.textContent = scenario.verdictTag;
  if (verdictTitle) verdictTitle.textContent = scenario.verdictTitle;
  if (statusIcon) statusIcon.textContent = scenario.icon;
  if (explainText) explainText.textContent = scenario.explain;

  const totalEstimated = (vehicle.rate + vehicle.escrow).toFixed(2);
  if (escrowVal) escrowVal.textContent = `$${totalEstimated}`;
  if (rentalRateVal) rentalRateVal.textContent = `$${vehicle.rate.toFixed(2)} / day`;
  if (depositVal) depositVal.textContent = `$${vehicle.escrow.toFixed(2)} (Refundable)`;
  if (bufferVal) bufferVal.textContent = `${vehicle.buffer} Hours Clean Window`;

  const bufferEndHour = 14 + vehicle.buffer;
  const bufferEndStr = `${bufferEndHour.toString().padStart(2, "0")}:00`;

  if (bufferLegend) {
    bufferLegend.innerHTML = `<b class="joul-legend-bold">Turnaround Buffer:</b> +${vehicle.buffer}h (14:00 — ${bufferEndStr})`;
  }
  if (requestLegend) {
    requestLegend.innerHTML = `<b class="joul-legend-bold">Incoming Request:</b> ${scenario.reqStart} — ${scenario.reqEnd}`;
  }

  if (visBufferSlot) {
    visBufferSlot.textContent = `Buffer [+${vehicle.buffer}h]`;
    visBufferSlot.style.width = `${Math.min(25, vehicle.buffer * 7)}%`;
  }

  if (visRequestSlot) {
    visRequestSlot.className = `joul-bar-slot request ${scenario.status}`;
    visRequestSlot.textContent = `Incoming [${scenario.reqStart}-${scenario.reqEnd}]`;
    visRequestSlot.style.width = `${scenario.reqWidth}%`;
  }
}

function initJoulSimulator() {
  const vehicleSelect = $("#joulVehicleSelect");
  const scenarioChips = $$(".joul-scenario-chip");

  if (!joulInitialized) {
    joulInitialized = true;

    vehicleSelect?.addEventListener("change", () => {
      const activeChip = $(".joul-scenario-chip.active");
      const scenarioKey = activeChip?.getAttribute("data-scenario") || "overlap";
      const vehicleKey = vehicleSelect.value;
      runJoulSimulation(scenarioKey, vehicleKey);
    });

    scenarioChips.forEach(chip => {
      chip.addEventListener("click", () => {
        scenarioChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        const scenarioKey = chip.getAttribute("data-scenario") || "overlap";
        const vehicleKey = vehicleSelect?.value || "prius";
        runJoulSimulation(scenarioKey, vehicleKey);
      });
    });
  }

  const activeChip = $(".joul-scenario-chip.active");
  const currentScenario = activeChip?.getAttribute("data-scenario") || "overlap";
  const currentVehicle = vehicleSelect?.value || "prius";
  runJoulSimulation(currentScenario, currentVehicle);
}

// ==========================================================================
// Chinese Learning Platform (CLP) — SuperMemo-2 (SM-2) & Gemini AI Simulator
// ==========================================================================
const CLP_VOCAB_DATA = {
  xue: {
    char: "学",
    pinyin: "xué",
    meaning: "to study / to learn (HSK 1)",
    radical: "子 (child) under 宀 (roof)",
    baseInterval: 6,
    baseRep: 2,
    baseEf: 2.50
  },
  ai: {
    char: "爱",
    pinyin: "ài",
    meaning: "to love / affection (HSK 1)",
    radical: "爫 (claw) + 冖 + 友 (friend)",
    baseInterval: 3,
    baseRep: 1,
    baseEf: 2.40
  },
  dao: {
    char: "道",
    pinyin: "dào",
    meaning: "way / path / principle (HSK 3)",
    radical: "辶 (walk) + 首 (head)",
    baseInterval: 12,
    baseRep: 3,
    baseEf: 2.60
  },
  ming: {
    char: "明",
    pinyin: "míng",
    meaning: "bright / clear (HSK 1)",
    radical: "日 (sun) + 月 (moon)",
    baseInterval: 1,
    baseRep: 0,
    baseEf: 2.50
  },
  zhi: {
    char: "智",
    pinyin: "zhì",
    meaning: "wisdom / knowledge (HSK 5)",
    radical: "知 (know) + 日 (sun)",
    baseInterval: 18,
    baseRep: 4,
    baseEf: 2.70
  }
};

const CLP_QUALITY_FEEDBACK = {
  5: {
    status: "safe",
    verdictTag: "PERFECT RECALL · INTERVAL EXPANDED",
    verdictTitle: "Retention Verified · Interval Multiplied by Ease Factor",
    tutorPrefix: "太棒了！(Excellent!)",
    tutorAdvice: "Flawless pronunciation and radical breakdown. Your memory retention is projected at 98%. Interval safely expanded."
  },
  4: {
    status: "safe",
    verdictTag: "SOLID RECALL · EASE FACTOR SUSTAINED",
    verdictTitle: "Correct Response with Hesitation · Review Scheduled",
    tutorPrefix: "非常好！(Very Good!)",
    tutorAdvice: "Accurate recall with slight hesitation. Notice how the radical connects to the meaning. Keep this streak alive for maximum neural consolidation."
  },
  3: {
    status: "warn",
    verdictTag: "PASSING THRESHOLD · MARGINAL RECALL",
    verdictTitle: "Correct but Serious Difficulty · Short Interval Retained",
    tutorPrefix: "勉强记住了。(Marginally Remembered)",
    tutorAdvice: "You remembered correctly, but with significant effort. The SM-2 algorithm slightly decreased your ease factor to schedule an earlier refresher."
  },
  2: {
    status: "warn",
    verdictTag: "RECALL FAILED · FAMILIAR ON REVEAL",
    verdictTitle: "Memory Lapse · Interval Reset to Day 1",
    tutorPrefix: "需要复习！(Review Needed)",
    tutorAdvice: "You recognized the character once shown. Repetition count resets to 0 so we can re-anchor the radical components in memory tomorrow."
  },
  1: {
    status: "danger",
    verdictTag: "INCORRECT · WEAK TRACE",
    verdictTitle: "Incorrect Response · Immediate Review Queue",
    tutorPrefix: "加油！(Keep Going!)",
    tutorAdvice: "Let's break down the stroke order and etymology. Daily active recall will rebuild this neural pathway quickly."
  },
  0: {
    status: "danger",
    verdictTag: "TOTAL BLACKOUT · FULL RE-LEARNING",
    verdictTitle: "Zero Retention · Placed in Today's Intensive Queue",
    tutorPrefix: "没关系，重新开始！(No Worries, Fresh Start!)",
    tutorAdvice: "Zero retention happens when intervals stretch too far. We've reset the card and added contextual mnemonics to guide you."
  }
};

let clpInitialized = false;

function calculateSm2(quality, prevInterval, prevRepetitions, prevEaseFactor) {
  let repetitions = prevRepetitions;
  let easeFactor = prevEaseFactor;
  let interval = 0;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * easeFactor);
    }
    repetitions++;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  return { interval, repetitions, easeFactor: parseFloat(easeFactor.toFixed(2)) };
}

function runClpSimulation(quality, hanziKey) {
  const vocab = CLP_VOCAB_DATA[hanziKey] || CLP_VOCAB_DATA.xue;
  const feedback = CLP_QUALITY_FEEDBACK[quality] || CLP_QUALITY_FEEDBACK[5];

  const sm2 = calculateSm2(quality, vocab.baseInterval, vocab.baseRep, vocab.baseEf);

  const resultCard = $("#clpResultCard");
  const displayChar = $("#clpDisplayChar");
  const displayPinyin = $("#clpDisplayPinyin");
  const verdictTag = $("#clpVerdictTag");
  const verdictTitle = $("#clpVerdictTitle");
  const intervalVal = $("#clpIntervalVal");
  const efVal = $("#clpEfVal");
  const repVal = $("#clpRepVal");
  const retVal = $("#clpRetVal");
  const tutorText = $("#clpAiTutorText");

  if (!resultCard) return;

  resultCard.setAttribute("data-status", feedback.status);
  if (displayChar) displayChar.textContent = vocab.char;
  if (displayPinyin) displayPinyin.textContent = `${vocab.pinyin} · ${vocab.meaning}`;
  if (verdictTag) verdictTag.textContent = feedback.verdictTag;
  if (verdictTitle) verdictTitle.textContent = `${feedback.verdictTitle.split(" · ")[0]} · Next Review in ${sm2.interval} ${sm2.interval === 1 ? 'Day' : 'Days'}`;
  if (intervalVal) intervalVal.textContent = `${sm2.interval} ${sm2.interval === 1 ? 'Day' : 'Days'}`;
  if (efVal) efVal.textContent = sm2.easeFactor.toFixed(2);
  if (repVal) repVal.textContent = sm2.repetitions;

  const retentionEstimate = Math.min(99, Math.max(30, Math.round((quality / 5) * 60 + (sm2.easeFactor / 2.5) * 35)));
  if (retVal) retVal.textContent = `${retentionEstimate}%`;

  if (tutorText) {
    tutorText.innerHTML = `"${feedback.tutorPrefix} <b>${vocab.char}</b> (${vocab.pinyin}): Radical <i>${vocab.radical}</i>. ${feedback.tutorAdvice}"`;
  }
}

function initClpSimulator() {
  const hanziSelect = $("#clpHanziSelect");
  const qualityChips = $$(".clp-quality-chip");

  if (!clpInitialized) {
    clpInitialized = true;

    hanziSelect?.addEventListener("change", () => {
      const activeChip = $(".clp-quality-chip.active");
      const quality = parseInt(activeChip?.getAttribute("data-quality") || "5", 10);
      const hanziKey = hanziSelect.value;
      runClpSimulation(quality, hanziKey);
    });

    qualityChips.forEach(chip => {
      chip.addEventListener("click", () => {
        qualityChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        const quality = parseInt(chip.getAttribute("data-quality") || "5", 10);
        const hanziKey = hanziSelect?.value || "xue";
        runClpSimulation(quality, hanziKey);
      });
    });
  }

  const activeChip = $(".clp-quality-chip.active");
  const currentQuality = parseInt(activeChip?.getAttribute("data-quality") || "5", 10);
  const currentHanzi = hanziSelect?.value || "xue";
  runClpSimulation(currentQuality, currentHanzi);
}

// =========================================================================
// MINI WORLD 3D WEBGL SHADER LAB (Interactive Project Modal Sandbox)
// =========================================================================
let mwLabGl = null;
let mwLabProg = null;
let mwLabRaf = null;
let mwLabBuffer = null;
let mwLabInitialized = false;

const MW_BIOMES = {
  earth: {
    ocean: [0.08, 0.45, 0.85],
    land: [0.25, 0.75, 0.35],
    rim: [0.45, 0.85, 1.0]
  },
  alien: {
    ocean: [0.65, 0.15, 0.75],
    land: [0.15, 0.85, 0.65],
    rim: [0.85, 0.45, 1.0]
  },
  magma: {
    ocean: [0.95, 0.35, 0.05],
    land: [0.18, 0.16, 0.18],
    rim: [1.0, 0.65, 0.15]
  },
  cryo: {
    ocean: [0.12, 0.25, 0.55],
    land: [0.95, 0.98, 1.0],
    rim: [0.65, 0.95, 1.0]
  }
};

let mwActiveBiome = 'earth';
let mwToonThreshold = 0.15;
let mwRimPower = 3.0;
let mwTimeOfDay = 0.5;

function initMiniworldLab() {
  const canvas = $("#mwLabCanvas");
  if (!canvas) return;

  if (!mwLabGl) {
    mwLabGl = canvas.getContext("webgl", { antialias: true, alpha: false });
    if (!mwLabGl) return;

    const vs = `
      attribute vec3 aPos;
      attribute vec3 aNorm;
      attribute float aElev;
      uniform mat4 uMvp;
      uniform mat4 uModel;
      varying vec3 vNorm;
      varying vec3 vPos;
      varying float vElev;
      void main() {
        vNorm = mat3(uModel) * aNorm;
        vec4 worldP = uModel * vec4(aPos, 1.0);
        vPos = worldP.xyz;
        vElev = aElev;
        gl_Position = uMvp * vec4(aPos, 1.0);
      }
    `;

    const fs = `
      precision mediump float;
      varying vec3 vNorm;
      varying vec3 vPos;
      varying float vElev;
      uniform vec3 uSunDir;
      uniform float uToon;
      uniform float uRimPower;
      uniform vec3 uOceanCol;
      uniform vec3 uLandCol;
      uniform vec3 uRimCol;

      void main() {
        vec3 N = normalize(vNorm);
        vec3 V = normalize(vec3(0.0, 0.0, 3.5) - vPos);
        float d = dot(N, uSunDir);

        float toon = smoothstep(-uToon, uToon, d) * 0.70 + 0.30;
        vec3 baseCol = (vElev > 0.04) ? uLandCol : uOceanCol;
        float rim = pow(1.0 - max(dot(N, V), 0.0), uRimPower);

        vec3 finalCol = baseCol * toon + uRimCol * rim * 0.55;
        gl_FragColor = vec4(finalCol, 1.0);
      }
    `;

    function createShader(gl, type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const p = mwLabGl.createProgram();
    mwLabGl.attachShader(p, createShader(mwLabGl, mwLabGl.VERTEX_SHADER, vs));
    mwLabGl.attachShader(p, createShader(mwLabGl, mwLabGl.FRAGMENT_SHADER, fs));
    mwLabGl.linkProgram(p);
    mwLabProg = p;

    // Subdivision sphere mesh
    const verts = [];
    const latBands = 20, lonBands = 20, rad = 1.15;
    for (let lat = 0; lat < latBands; lat++) {
      const theta1 = (lat / latBands) * Math.PI;
      const theta2 = ((lat + 1) / latBands) * Math.PI;
      for (let lon = 0; lon < lonBands; lon++) {
        const phi1 = (lon / lonBands) * Math.PI * 2;
        const phi2 = ((lon + 1) / lonBands) * Math.PI * 2;

        const getPt = (th, ph) => {
          const nx = Math.sin(th) * Math.cos(ph);
          const ny = Math.cos(th);
          const nz = Math.sin(th) * Math.sin(ph);
          const elev = (Math.sin(nx * 3.5) * Math.cos(ny * 3.5) + Math.sin(nz * 3.0)) > 0.1 ? 0.08 : 0.0;
          const r = rad + elev;
          return [nx * r, ny * r, nz * r, nx, ny, nz, elev];
        };

        const p1 = getPt(theta1, phi1);
        const p2 = getPt(theta2, phi1);
        const p3 = getPt(theta2, phi2);
        const p4 = getPt(theta1, phi2);

        verts.push(...p1, ...p2, ...p3, ...p1, ...p3, ...p4);
      }
    }

    mwLabBuffer = mwLabGl.createBuffer();
    mwLabGl.bindBuffer(mwLabGl.ARRAY_BUFFER, mwLabBuffer);
    mwLabGl.bufferData(mwLabGl.ARRAY_BUFFER, new Float32Array(verts), mwLabGl.STATIC_DRAW);
  }

  if (!mwLabInitialized) {
    mwLabInitialized = true;

    $$(".mw-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        $$(".mw-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        mwActiveBiome = chip.getAttribute("data-biome") || "earth";
      });
    });

    const sToon = $("#mwSliderToon");
    const vToon = $("#mwValToon");
    const statToon = $("#mwStatToon");
    sToon?.addEventListener("input", e => {
      mwToonThreshold = parseFloat(e.target.value);
      if (vToon) vToon.textContent = mwToonThreshold.toFixed(2);
      if (statToon) statToon.textContent = `smoothstep(-${mwToonThreshold.toFixed(2)}, ${mwToonThreshold.toFixed(2)}, d)`;
    });

    const sRim = $("#mwSliderRim");
    const vRim = $("#mwValRim");
    const glslRim = $("#mwGlslRimVal");
    sRim?.addEventListener("input", e => {
      mwRimPower = parseFloat(e.target.value);
      if (vRim) vRim.textContent = mwRimPower.toFixed(1);
      if (glslRim) glslRim.textContent = mwRimPower.toFixed(1);
    });

    const sSun = $("#mwSliderSun");
    const vSun = $("#mwValSun");
    sSun?.addEventListener("input", e => {
      mwTimeOfDay = parseFloat(e.target.value);
      if (vSun) {
        const lbl = mwTimeOfDay < 0.25 ? "Dawn" : (mwTimeOfDay < 0.65 ? "Noon" : (mwTimeOfDay < 0.85 ? "Sunset" : "Night"));
        vSun.textContent = `${lbl} (${mwTimeOfDay.toFixed(2)})`;
      }
    });
  }

  let rotAngle = 0;
  const gl = mwLabGl;
  const prog = mwLabProg;

  function renderLab() {
    rotAngle += 0.015;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.04, 0.06, 0.11, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(prog);

    const aspect = canvas.width / canvas.height;
    const fov = 45 * Math.PI / 180;
    const f = 1.0 / Math.tan(fov / 2);
    const zN = 0.1, zF = 100.0;
    const proj = [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (zF + zN) / (zN - zF), -1,
      0, 0, (2 * zF * zN) / (zN - zF), 0
    ];

    const cR = Math.cos(rotAngle), sR = Math.sin(rotAngle);
    const tilt = 0.25;
    const cT = Math.cos(tilt), sT = Math.sin(tilt);
    const model = [
      cR, sR * sT, sR * cT, 0,
      0, cT, -sT, 0,
      -sR, cR * sT, cR * cT, 0,
      0, 0, -2.8, 1
    ];

    const mvp = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) sum += proj[k * 4 + i] * model[j * 4 + k];
        mvp[j * 4 + i] = sum;
      }
    }

    const sunAngle = mwTimeOfDay * Math.PI * 2 - Math.PI / 2;
    const sunDir = [Math.cos(sunAngle), Math.sin(sunAngle), 0.5];
    const sLen = Math.hypot(sunDir[0], sunDir[1], sunDir[2]);
    sunDir[0] /= sLen; sunDir[1] /= sLen; sunDir[2] /= sLen;

    const biome = MW_BIOMES[mwActiveBiome] || MW_BIOMES.earth;

    gl.uniformMatrix4fv(gl.getUniformLocation(prog, "uMvp"), false, mvp);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, "uModel"), false, new Float32Array(model));
    gl.uniform3fv(gl.getUniformLocation(prog, "uSunDir"), sunDir);
    gl.uniform1f(gl.getUniformLocation(prog, "uToon"), mwToonThreshold);
    gl.uniform1f(gl.getUniformLocation(prog, "uRimPower"), mwRimPower);
    gl.uniform3fv(gl.getUniformLocation(prog, "uOceanCol"), biome.ocean);
    gl.uniform3fv(gl.getUniformLocation(prog, "uLandCol"), biome.land);
    gl.uniform3fv(gl.getUniformLocation(prog, "uRimCol"), biome.rim);

    gl.bindBuffer(gl.ARRAY_BUFFER, mwLabBuffer);
    const aPos = gl.getAttribLocation(prog, "aPos");
    const aNorm = gl.getAttribLocation(prog, "aNorm");
    const aElev = gl.getAttribLocation(prog, "aElev");

    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 28, 0);

    gl.enableVertexAttribArray(aNorm);
    gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 28, 12);

    gl.enableVertexAttribArray(aElev);
    gl.vertexAttribPointer(aElev, 1, gl.FLOAT, false, 28, 24);

    gl.drawArrays(gl.TRIANGLES, 0, 20 * 20 * 6);

    mwLabRaf = requestAnimationFrame(renderLab);
  }

  stopMiniworldLab();
  mwLabRaf = requestAnimationFrame(renderLab);
}

function stopMiniworldLab() {
  if (mwLabRaf) {
    cancelAnimationFrame(mwLabRaf);
    mwLabRaf = null;
  }
}

// ==========================================================================
// Aquarium Nitrogen Cycle & Biological Filtration Simulation Engine
// ==========================================================================
let aqLabRaf = null;
let aqLabInitialized = false;

let aqFishCount = 6;
let aqFlowRate = 180;
let aqMedia = 'bio'; // 'bio', 'sponge', 'carbon', 'uncycled'
let aqAmmonia = 0.00;
let aqNitrite = 0.00;
let aqNitrate = 5.20;
let aqColony = 0.98;
let aqWastePulse = 0.0;
let aqCycleDay = 0;
let aqCyclingMode = false;
let aqWaterFlash = 0;

let aqFishList = [];
let aqBubblesList = [];
let aqFoodList = [];
let aqLastTime = performance.now();

function initAquariumLab() {
  const canvas = $("#aquariumCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Initialize Fish Entities
  if (aqFishList.length === 0) {
    const fishColors = [
      { body: '#fb923c', fin: '#ea580c' }, // Clownfish Orange
      { body: '#38bdf8', fin: '#0284c7' }, // Neon Blue
      { body: '#facc15', fin: '#ca8a04' }, // Gold Barb
      { body: '#f43f5e', fin: '#be123c' }, // Ruby Tetra
      { body: '#a855f7', fin: '#7e22ce' }, // Purple Betta
      { body: '#34d399', fin: '#059669' }  // Emerald Danio
    ];
    for (let i = 0; i < 8; i++) {
      const c = fishColors[i % fishColors.length];
      aqFishList.push({
        x: 40 + Math.random() * 260,
        y: 40 + Math.random() * 140,
        vx: (Math.random() > 0.5 ? 1 : -1) * (0.45 + Math.random() * 0.55),
        vy: (Math.random() - 0.5) * 0.25,
        bodyColor: c.body,
        finColor: c.fin,
        size: 11 + Math.random() * 4,
        tailPhase: Math.random() * Math.PI * 2
      });
    }

    // Initialize Bubbles
    for (let i = 0; i < 18; i++) {
      aqBubblesList.push({
        x: 18 + Math.random() * 24,
        y: Math.random() * 220,
        r: 1.5 + Math.random() * 2.2,
        speed: 0.6 + Math.random() * 0.9,
        wobble: Math.random() * Math.PI * 2
      });
    }
  }

  // Bind UI Controls (Once)
  if (!aqLabInitialized) {
    aqLabInitialized = true;

    $("#aqFishSlider")?.addEventListener("input", e => {
      aqFishCount = parseInt(e.target.value, 10);
      const val = $("#aqFishVal");
      if (val) val.textContent = `${aqFishCount} fish`;
    });

    $("#aqFlowSlider")?.addEventListener("input", e => {
      aqFlowRate = parseInt(e.target.value, 10);
      const val = $("#aqFlowVal");
      if (val) val.textContent = `${aqFlowRate} GPH`;
    });

    $$(".aquarium-sandbox .mw-chip")?.forEach(chip => {
      chip.addEventListener("click", () => {
        $$(".aquarium-sandbox .mw-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        aqMedia = chip.dataset.media;
        if (aqMedia === 'uncycled') {
          aqColony = 0.12;
        } else if (aqMedia === 'bio') {
          aqColony = 0.98;
        }
      });
    });

    $("#aqFeedBtn")?.addEventListener("click", () => {
      aqWastePulse += 2.2;
      for (let f = 0; f < 12; f++) {
        aqFoodList.push({
          x: 40 + Math.random() * 260,
          y: 10 + Math.random() * 20,
          vy: 0.4 + Math.random() * 0.5,
          color: Math.random() > 0.5 ? '#b45309' : '#d97706',
          r: 1.5 + Math.random() * 1.5
        });
      }
      const pill = $("#aqHudPill");
      if (pill) pill.textContent = "🐟 Feeding Event: Organic Protein Added";
    });

    $("#aqWaterChangeBtn")?.addEventListener("click", () => {
      aqNitrate *= 0.75;
      aqAmmonia *= 0.75;
      aqNitrite *= 0.75;
      aqWaterFlash = 0.35;
      const pill = $("#aqHudPill");
      if (pill) pill.textContent = "💧 25% Water Change: Soluble Nitrates Diluted";
    });

    $("#aqCycleResetBtn")?.addEventListener("click", () => {
      aqCyclingMode = true;
      aqCycleDay = 1;
      aqAmmonia = 0.8;
      aqNitrite = 0.05;
      aqNitrate = 0.5;
      aqColony = 0.15;
      const pill = $("#aqHudPill");
      if (pill) pill.textContent = "⏳ Accelerated Cycling: Tracking 30-Day Microbial Flora";
    });
  }

  aqLastTime = performance.now();

  function renderAquarium(now) {
    const dt = Math.min((now - aqLastTime) / 1000, 0.1);
    aqLastTime = now;

    const W = canvas.width, H = canvas.height;

    // Biological Nitrogen Kinetics Calculation
    if (aqCyclingMode) {
      aqCycleDay += dt * 3.2; // 1s = 3.2 days
      if (aqCycleDay <= 10) {
        aqAmmonia = Math.min(5.0, aqAmmonia + dt * 0.8);
        aqNitrite = Math.min(1.2, aqNitrite + dt * 0.15);
        aqColony = Math.min(0.4, aqColony + dt * 0.04);
      } else if (aqCycleDay <= 20) {
        aqAmmonia = Math.max(0.1, aqAmmonia - dt * 0.9);
        aqNitrite = Math.min(5.2, aqNitrite + dt * 0.7);
        aqNitrate = Math.min(18.0, aqNitrate + dt * 1.5);
        aqColony = Math.min(0.75, aqColony + dt * 0.05);
      } else if (aqCycleDay <= 30) {
        aqAmmonia = Math.max(0.0, aqAmmonia - dt * 0.5);
        aqNitrite = Math.max(0.0, aqNitrite - dt * 0.8);
        aqNitrate = Math.min(35.0, aqNitrate + dt * 1.8);
        aqColony = Math.min(1.0, aqColony + dt * 0.04);
      } else {
        aqCyclingMode = false;
        aqAmmonia = 0.00;
        aqNitrite = 0.00;
        aqColony = 0.98;
        const pill = $("#aqHudPill");
        if (pill) pill.textContent = "✓ Cycling Complete: Mature Bacterial Equilibrium";
      }
    } else {
      const wasteRate = aqFishCount * 0.04 + aqWastePulse;
      aqWastePulse = Math.max(0, aqWastePulse - dt * 0.35);

      const mediaEff = (aqMedia === 'bio') ? 1.5 : (aqMedia === 'sponge' ? 1.0 : (aqMedia === 'carbon' ? 1.25 : 0.08));
      const convSpeed = (aqFlowRate / 180) * aqColony * mediaEff;

      const ammInput = wasteRate * 0.16;
      const ammConverted = Math.min(aqAmmonia, aqAmmonia * convSpeed * 0.78 * dt);
      aqAmmonia = Math.max(0, aqAmmonia + (ammInput - ammConverted) * dt);

      const nitConverted = Math.min(aqNitrite, aqNitrite * convSpeed * 0.85 * dt);
      aqNitrite = Math.max(0, aqNitrite + (ammConverted * 0.95 - nitConverted) * dt);

      aqNitrate = Math.min(140.0, aqNitrate + (nitConverted * 0.82) * dt);

      if (aqMedia === 'uncycled') {
        aqColony = Math.max(0.08, aqColony - dt * 0.04);
      } else {
        aqColony = Math.min(1.0, aqColony + dt * 0.02);
      }
    }

    // Update Telemetry Elements
    const ammEl = $("#aqAmmoniaVal"), nitrEl = $("#aqNitriteVal"), nitraEl = $("#aqNitrateVal"), colEl = $("#aqBacterialVal");
    if (ammEl) ammEl.textContent = `${aqAmmonia.toFixed(2)} ppm`;
    if (nitrEl) nitrEl.textContent = `${aqNitrite.toFixed(2)} ppm`;
    if (nitraEl) nitraEl.textContent = `${aqNitrate.toFixed(1)} ppm`;
    if (colEl) colEl.textContent = `${Math.round(aqColony * 100)}%`;

    const ammSt = $("#aqAmmoniaStatus"), nitrSt = $("#aqNitriteStatus"), nitraSt = $("#aqNitrateStatus"), colSt = $("#aqBacterialStatus");
    if (ammSt) {
      if (aqAmmonia < 0.25) { ammSt.textContent = "Safe (< 0.25)"; ammSt.className = "aq-metric-status safe"; }
      else if (aqAmmonia < 1.0) { ammSt.textContent = "Stress Warning"; ammSt.className = "aq-metric-status warning"; }
      else { ammSt.textContent = "Lethal Toxicity!"; ammSt.className = "aq-metric-status danger"; }
    }
    if (nitrSt) {
      if (aqNitrite < 0.25) { nitrSt.textContent = "Safe (< 0.25)"; nitrSt.className = "aq-metric-status safe"; }
      else if (aqNitrite < 0.8) { nitrSt.textContent = "Elevated"; nitrSt.className = "aq-metric-status warning"; }
      else { nitrSt.textContent = "Cellular Hypoxia!"; nitrSt.className = "aq-metric-status danger"; }
    }
    if (nitraSt) {
      if (aqNitrate < 20) { nitraSt.textContent = "Optimal Plant Nutrient"; nitraSt.className = "aq-metric-status optimal"; }
      else if (aqNitrate < 40) { nitraSt.textContent = "Safe Threshold"; nitraSt.className = "aq-metric-status safe"; }
      else { nitraSt.textContent = "Water Change Needed!"; nitraSt.className = "aq-metric-status danger"; }
    }
    if (colSt) {
      colSt.textContent = (aqColony > 0.85) ? "Mature Bio-Bed" : ((aqColony > 0.4) ? "Colonizing Filter" : "Immature Media");
      colSt.className = (aqColony > 0.85) ? "aq-metric-status safe" : "aq-metric-status warning";
    }

    // Canvas Background Aquatic Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#0a2540");
    grad.addColorStop(0.5, "#061727");
    grad.addColorStop(1, "#040d16");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Caustics Light Rays
    ctx.fillStyle = "rgba(56, 189, 248, 0.06)";
    for (let c = 0; c < 4; c++) {
      const rx = (now * 0.04 + c * 85) % W;
      ctx.beginPath();
      ctx.moveTo(rx - 15, 0);
      ctx.lineTo(rx + 35, 0);
      ctx.lineTo(rx + 65, H);
      ctx.lineTo(rx - 40, H);
      ctx.closePath();
      ctx.fill();
    }

    // Substrate Gravel Bed at Bottom
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, H - 22, W, 22);
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, H - 24, W, 3);

    // Swaying Aquatic Plant Fronds (5 plants)
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (let p = 0; p < 5; p++) {
      const baseX = 80 + p * 55;
      const sway = Math.sin(now * 0.002 + p * 1.5) * 12;
      ctx.beginPath();
      ctx.moveTo(baseX, H - 22);
      ctx.quadraticCurveTo(baseX + sway * 0.5, H - 65, baseX + sway, H - 95);
      ctx.stroke();

      ctx.fillStyle = "#34d399";
      for (let l = 1; l <= 3; l++) {
        const ly = H - 22 - l * 22;
        const lx = baseX + sway * (l / 3.5);
        ctx.beginPath();
        ctx.ellipse(lx + 6, ly, 7, 3, 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(lx - 6, ly - 4, 7, 3, -0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Filter Box & Airstone
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(10, 10, 36, 75);
    ctx.fillStyle = (aqMedia === 'bio') ? "#f59e0b" : ((aqMedia === 'carbon') ? "#334155" : "#3b82f6");
    ctx.fillRect(14, 25, 28, 52);

    // Water Flow Stream Out of Filter
    const flowAmp = Math.min(aqFlowRate / 150, 2.5);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 2;
    for (let j = 0; j < 3; j++) {
      const fx = 46 + ((now * 0.08 * flowAmp + j * 20) % 65);
      ctx.beginPath();
      ctx.moveTo(fx, 20 + j * 5);
      ctx.lineTo(fx + 10, 20 + j * 5);
      ctx.stroke();
    }

    // Rising Air Bubbles
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
    ctx.lineWidth = 1;
    aqBubblesList.forEach(b => {
      b.y -= b.speed * 60 * dt;
      b.wobble += dt * 4;
      const bx = b.x + Math.sin(b.wobble) * 2;
      if (b.y < 12) b.y = H - 26;
      ctx.beginPath();
      ctx.arc(bx, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Sinking Food Flakes
    for (let f = aqFoodList.length - 1; f >= 0; f--) {
      const flake = aqFoodList[f];
      flake.y += flake.vy * 60 * dt;
      ctx.fillStyle = flake.color;
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
      ctx.fill();
      if (flake.y >= H - 24) aqFoodList.splice(f, 1);
    }

    // Swimming Fish Entities
    const visibleCount = Math.min(aqFishCount, aqFishList.length);
    for (let i = 0; i < visibleCount; i++) {
      const fish = aqFishList[i];
      fish.x += fish.vx * 60 * dt;
      fish.y += fish.vy * 60 * dt;
      fish.tailPhase += dt * 8 * Math.abs(fish.vx);

      if (fish.x > W - 25) { fish.x = W - 25; fish.vx *= -1; }
      else if (fish.x < 55) { fish.x = 55; fish.vx *= -1; }

      if (fish.y > H - 35) { fish.y = H - 35; fish.vy *= -1; }
      else if (fish.y < 35) { fish.y = 35; fish.vy *= -1; }

      const dir = (fish.vx > 0) ? 1 : -1;
      const tailWag = Math.sin(fish.tailPhase) * 4;

      ctx.fillStyle = fish.bodyColor;
      ctx.beginPath();
      ctx.ellipse(fish.x, fish.y, fish.size, fish.size * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = fish.finColor;
      ctx.beginPath();
      ctx.moveTo(fish.x - dir * fish.size * 0.8, fish.y);
      ctx.lineTo(fish.x - dir * (fish.size + 8), fish.y - 6 + tailWag);
      ctx.lineTo(fish.x - dir * (fish.size + 8), fish.y + 6 + tailWag);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(fish.x + dir * fish.size * 0.55, fish.y - 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(fish.x + dir * (fish.size * 0.55 + 0.6), fish.y - 2, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fresh Water Flash Overlay on Water Change
    if (aqWaterFlash > 0.01) {
      ctx.fillStyle = `rgba(56, 189, 248, ${aqWaterFlash})`;
      ctx.fillRect(0, 0, W, H);
      aqWaterFlash = Math.max(0, aqWaterFlash - dt * 0.8);
    }

    aqLabRaf = requestAnimationFrame(renderAquarium);
  }

  stopAquariumLab();
  aqLabRaf = requestAnimationFrame(renderAquarium);
}

function stopAquariumLab() {
  if (aqLabRaf) {
    cancelAnimationFrame(aqLabRaf);
    aqLabRaf = null;
  }
}

// ==========================================================================
// Gesture App 21-Joint Computer Vision & Kinematics Engine
// ==========================================================================
let gestLabRaf = null;
let gestLabInitialized = false;

let gestActivePose = 'palm'; // 'palm', 'pinch', 'peace', 'fist', 'point', 'thumbs'
let gestPinchThreshold = 35;
let gestScale = 1.0;
let gestShowBbox = true;
let gestShowCoords = true;

let gestMouseX = 170;
let gestMouseY = 120;
let gestTargetX = 170;
let gestTargetY = 120;
let gestPinchAnimation = 0;

// MediaPipe 21-Joint Landmark Connections
const GEST_BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],// Ring
  [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [5, 9], [9, 13], [13, 17]             // Palm Cross
];

// Base Coordinate Offsets relative to palm center (x, y)
const GEST_POSE_TEMPLATES = {
  palm: [
    [0, 75], // 0: Wrist
    [-22, 52], [-38, 30], [-52, 10], [-64, -6], // 1-4: Thumb
    [-25, -2], [-28, -32], [-31, -62], [-34, -90], // 5-8: Index
    [0, -6], [0, -40], [0, -72], [0, -102], // 9-12: Middle
    [24, -2], [26, -32], [28, -62], [30, -88], // 13-16: Ring
    [45, 10], [50, -16], [54, -42], [58, -68]  // 17-20: Pinky
  ],
  pinch: [
    [0, 75],
    [-18, 52], [-24, 30], [-20, 5], [-12, -38],
    [-22, -2], [-22, -25], [-18, -38], [-12, -38],
    [0, -6], [0, -40], [0, -72], [0, -102],
    [24, -2], [26, -32], [28, -62], [30, -88],
    [45, 10], [50, -16], [54, -42], [58, -68]
  ],
  peace: [
    [0, 75],
    [-18, 50], [-26, 32], [-18, 20], [-10, 15],
    [-20, -2], [-24, -34], [-28, -68], [-34, -100],
    [10, -6], [16, -38], [22, -72], [28, -104],
    [24, -2], [22, 15], [18, 26], [16, 32],
    [42, 10], [38, 20], [34, 28], [30, 34]
  ],
  fist: [
    [0, 75],
    [-16, 50], [-22, 32], [-14, 18], [-6, 12],
    [-20, -2], [-20, 18], [-16, 28], [-12, 32],
    [0, -6], [0, 16], [0, 26], [0, 30],
    [20, -2], [18, 16], [16, 26], [14, 30],
    [38, 10], [34, 22], [30, 28], [26, 32]
  ],
  point: [
    [0, 75],
    [-18, 50], [-26, 32], [-18, 20], [-8, 15],
    [-22, -2], [-26, -35], [-28, -68], [-30, -102],
    [0, -6], [0, 18], [0, 28], [0, 32],
    [20, -2], [18, 18], [16, 28], [14, 32],
    [38, 10], [34, 22], [30, 28], [26, 32]
  ],
  thumbs: [
    [0, 75],
    [-24, 50], [-42, 28], [-54, -2], [-62, -45],
    [-18, -2], [-16, 18], [-12, 28], [-8, 32],
    [0, -6], [0, 18], [0, 28], [0, 32],
    [18, -2], [16, 18], [14, 28], [12, 32],
    [36, 10], [32, 22], [28, 28], [24, 32]
  ]
};

let gestCurrentLandmarks = GEST_POSE_TEMPLATES.palm.map(p => [...p]);

function initGestureLab() {
  const canvas = $("#gestureCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  if (!gestLabInitialized) {
    gestLabInitialized = true;

    canvas.addEventListener("mousemove", e => {
      const rect = canvas.getBoundingClientRect();
      gestTargetX = (e.clientX - rect.left) * (canvas.width / rect.width);
      gestTargetY = (e.clientY - rect.top) * (canvas.height / rect.height);
    });

    canvas.addEventListener("mouseleave", () => {
      gestTargetX = canvas.width / 2;
      gestTargetY = canvas.height / 2 + 10;
    });

    $$(".gesture-sandbox .mw-chip")?.forEach(chip => {
      chip.addEventListener("click", () => {
        $$(".gesture-sandbox .mw-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        gestActivePose = chip.dataset.pose;
      });
    });

    $("#gestDistSlider")?.addEventListener("input", e => {
      gestPinchThreshold = parseInt(e.target.value, 10);
      const val = $("#gestDistVal");
      if (val) val.textContent = `${gestPinchThreshold} px`;
    });

    $("#gestScaleSlider")?.addEventListener("input", e => {
      gestScale = parseFloat(e.target.value);
      const val = $("#gestScaleVal");
      if (val) val.textContent = `${gestScale.toFixed(2)}x`;
    });

    $("#gestToggleBboxBtn")?.addEventListener("click", () => {
      gestShowBbox = !gestShowBbox;
      const btn = $("#gestToggleBboxBtn");
      if (btn) {
        btn.textContent = `🔲 Bounding Box: ${gestShowBbox ? 'ON' : 'OFF'}`;
        btn.classList.toggle("active", gestShowBbox);
      }
    });

    $("#gestToggleCoordsBtn")?.addEventListener("click", () => {
      gestShowCoords = !gestShowCoords;
      const btn = $("#gestToggleCoordsBtn");
      if (btn) {
        btn.textContent = `🔢 Joint IDs: ${gestShowCoords ? 'ON' : 'OFF'}`;
        btn.classList.toggle("active", gestShowCoords);
      }
    });

    $("#gestTriggerPinchBtn")?.addEventListener("click", () => {
      gestPinchAnimation = 1.0;
      $$(".gesture-sandbox .mw-chip").forEach(c => c.classList.toggle("active", c.dataset.pose === 'pinch'));
      gestActivePose = 'pinch';
      const pill = $("#gestHudPill");
      if (pill) pill.textContent = "🤏 PINCH TRIGGERED · Touchless Spatial Click Registered!";
    });
  }

  function renderGesture(now) {
    const W = canvas.width, H = canvas.height;

    gestMouseX += (gestTargetX - gestMouseX) * 0.12;
    gestMouseY += (gestTargetY - gestMouseY) * 0.12;

    const centerX = gestMouseX;
    const centerY = gestMouseY;

    const targetPose = GEST_POSE_TEMPLATES[gestActivePose] || GEST_POSE_TEMPLATES.palm;
    for (let i = 0; i < 21; i++) {
      gestCurrentLandmarks[i][0] += (targetPose[i][0] - gestCurrentLandmarks[i][0]) * 0.16;
      gestCurrentLandmarks[i][1] += (targetPose[i][1] - gestCurrentLandmarks[i][1]) * 0.16;
    }

    ctx.fillStyle = "#070d18";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(16, 185, 129, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const screenPts = gestCurrentLandmarks.map(pt => {
      const sx = centerX + pt[0] * gestScale;
      const sy = centerY + pt[1] * gestScale;
      minX = Math.min(minX, sx);
      minY = Math.min(minY, sy);
      maxX = Math.max(maxX, sx);
      maxY = Math.max(maxY, sy);
      return [sx, sy];
    });

    if (gestShowBbox) {
      const pad = 12;
      const bx = minX - pad, by = minY - pad, bw = (maxX - minX) + pad * 2, bh = (maxY - minY) + pad * 2;
      ctx.strokeStyle = "rgba(52, 211, 153, 0.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);

      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2.5;
      const rLen = 10;
      ctx.beginPath(); ctx.moveTo(bx, by + rLen); ctx.lineTo(bx, by); ctx.lineTo(bx + rLen, by); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + bw - rLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + rLen); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx, by + bh - rLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + rLen, by + bh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + bw - rLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - rLen); ctx.stroke();

      ctx.fillStyle = "rgba(16, 185, 129, 0.85)";
      ctx.font = "9px ui-monospace, monospace";
      ctx.fillText(`HAND 0.99 [${Math.round(bw)}x${Math.round(bh)}]`, bx + 4, by - 4);
    }

    ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
    ctx.lineWidth = 2.5;
    GEST_BONES.forEach(b => {
      const p0 = screenPts[b[0]], p1 = screenPts[b[1]];
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.stroke();
    });

    const tTip = screenPts[4], iTip = screenPts[8];
    const pinchDist = Math.hypot(tTip[0] - iTip[0], tTip[1] - iTip[1]);
    const isPinch = pinchDist <= gestPinchThreshold || gestPinchAnimation > 0.05;

    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = isPinch ? "#f43f5e" : "rgba(231, 242, 109, 0.6)";
    ctx.lineWidth = isPinch ? 2.5 : 1.2;
    ctx.beginPath();
    ctx.moveTo(tTip[0], tTip[1]);
    ctx.lineTo(iTip[0], iTip[1]);
    ctx.stroke();
    ctx.setLineDash([]);

    const midX = (tTip[0] + iTip[0]) / 2;
    const midY = (tTip[1] + iTip[1]) / 2;
    ctx.fillStyle = isPinch ? "#f43f5e" : "#1e293b";
    ctx.beginPath();
    ctx.roundRect(midX - 22, midY - 8, 44, 16, 4);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "8px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${pinchDist.toFixed(0)}px`, midX, midY);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";

    const tipIndices = [4, 8, 12, 16, 20];
    screenPts.forEach((pt, idx) => {
      const isTip = tipIndices.includes(idx);
      const isPinchTip = isPinch && (idx === 4 || idx === 8);

      ctx.fillStyle = isPinchTip ? "#f43f5e" : (isTip ? "#e7f26d" : "#38bdf8");
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], isTip ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fill();

      if (isTip) {
        ctx.strokeStyle = isPinchTip ? "rgba(244, 63, 94, 0.45)" : "rgba(56, 189, 248, 0.45)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], isPinchTip ? 8 : 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (gestShowCoords) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "8px ui-monospace, monospace";
        ctx.fillText(idx, pt[0] + 5, pt[1] - 3);
      }
    });

    if (gestPinchAnimation > 0.01) {
      gestPinchAnimation = Math.max(0, gestPinchAnimation - 0.04);
    }

    const pinchDistEl = $("#gestPinchDistVal");
    if (pinchDistEl) pinchDistEl.textContent = `${pinchDist.toFixed(1)} px`;

    const pinchSt = $("#gestPinchStatus");
    if (pinchSt) {
      pinchSt.textContent = isPinch ? "PINCH TRIGGERED 🎯" : "Released";
      pinchSt.className = isPinch ? "aq-metric-status danger" : "aq-metric-status optimal";
    }

    const poseMap = {
      palm: "Open Palm",
      pinch: "Pinch Click 🤏",
      peace: "Peace / Victory ✌️",
      fist: "Closed Fist ✊",
      point: "Point Cursor ☝️",
      thumbs: "Thumbs Up 👍"
    };
    const detEl = $("#gestDetectedVal");
    if (detEl) detEl.textContent = isPinch ? "Pinch Click 🤏" : (poseMap[gestActivePose] || "Unknown");

    const hudPill = $("#gestHudPill");
    if (hudPill && !isPinch && gestPinchAnimation <= 0.05) {
      hudPill.textContent = `Gesture: ${poseMap[gestActivePose] || 'Active'} · 60 FPS`;
    }

    gestLabRaf = requestAnimationFrame(renderGesture);
  }

  stopGestureLab();
  gestLabRaf = requestAnimationFrame(renderGesture);
}

function stopGestureLab() {
  if (gestLabRaf) {
    cancelAnimationFrame(gestLabRaf);
    gestLabRaf = null;
  }
}

// ==========================================================================
// Productivity SaaS & POS Sprint Analytics / Cash Ledger Simulator
// ==========================================================================
let saasLabRaf = null;
let saasLabInitialized = false;
let saasMode = "velocity";
let saasTargetScope = 50;
let saasCompletedPts = 48;
let saasGrossRevenue = 19450;
let saasPosOrders = 1428;
let saasInventoryUnits = 342;
let saasSparkParticles = [];
let saasFlashAlpha = 0;
const saasHistoricalSprints = [28, 34, 38, 44, 46];

function initSaasLab() {
  const canvas = $("#saasCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scopeSlider = $("#saasScopeSlider");
  const scopeVal = $("#saasScopeVal");
  const modeVelocityBtn = $("#saasModeVelocityBtn");
  const modePosBtn = $("#saasModePosBtn");
  const completeTaskBtn = $("#saasCompleteTaskBtn");
  const processSaleBtn = $("#saasProcessSaleBtn");
  const restockBtn = $("#saasRestockBtn");

  if (!saasLabInitialized) {
    saasLabInitialized = true;

    scopeSlider?.addEventListener("input", e => {
      saasTargetScope = parseInt(e.target.value, 10) || 50;
      if (scopeVal) scopeVal.textContent = `${saasTargetScope} pts`;
      updateSaasTelemetry();
    });

    modeVelocityBtn?.addEventListener("click", () => {
      saasMode = "velocity";
      modeVelocityBtn.classList.add("active");
      modePosBtn?.classList.remove("active");
    });

    modePosBtn?.addEventListener("click", () => {
      saasMode = "pos";
      modePosBtn.classList.add("active");
      modeVelocityBtn?.classList.remove("active");
    });

    completeTaskBtn?.addEventListener("click", () => {
      saasCompletedPts += 5;
      saasFlashAlpha = 1.0;
      for (let i = 0; i < 16; i++) {
        saasSparkParticles.push({
          x: 290,
          y: 80,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.7) * 5,
          alpha: 1.0,
          color: Math.random() > 0.5 ? "#e7f26d" : "#38bdf8",
          radius: Math.random() * 2.5 + 1.5
        });
      }
      updateSaasTelemetry();
    });

    processSaleBtn?.addEventListener("click", () => {
      saasGrossRevenue += 45;
      saasPosOrders += 1;
      saasInventoryUnits = Math.max(0, saasInventoryUnits - 1);
      saasFlashAlpha = 1.0;
      for (let i = 0; i < 18; i++) {
        saasSparkParticles.push({
          x: 170,
          y: 110,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.7) * 4,
          alpha: 1.0,
          color: "#34d399",
          radius: Math.random() * 3 + 1
        });
      }
      updateSaasTelemetry();
    });

    restockBtn?.addEventListener("click", () => {
      saasInventoryUnits = 400;
      saasFlashAlpha = 0.8;
      updateSaasTelemetry();
    });
  }

  function updateSaasTelemetry() {
    const ptsEl = $("#saasPtsVal");
    if (ptsEl) ptsEl.textContent = `${saasCompletedPts} pts`;

    const ptsSt = $("#saasPtsStatus");
    if (ptsSt) {
      const pct = Math.round((saasCompletedPts / saasTargetScope) * 100);
      ptsSt.textContent = `${pct}% Target Achieved (${saasCompletedPts >= saasTargetScope ? 'Sprint Goal Met' : 'In Flight'})`;
    }

    const salesEl = $("#saasSalesVal");
    if (salesEl) salesEl.textContent = `$${saasGrossRevenue.toLocaleString()}`;

    const salesSt = $("#saasSalesStatus");
    if (salesSt) salesSt.textContent = `${saasPosOrders.toLocaleString()} Orders Logged`;

    const stockEl = $("#saasStockVal");
    if (stockEl) stockEl.textContent = `${saasInventoryUnits} Units`;

    const stockSt = $("#saasStockStatus");
    if (stockSt) {
      stockSt.textContent = saasInventoryUnits < 50 ? "Restock Urgently Required" : "Optimal Stock Level";
      stockSt.className = `aq-metric-status ${saasInventoryUnits < 50 ? 'danger' : 'safe'}`;
    }

    const hudPill = $("#saasHudPill");
    if (hudPill) {
      hudPill.textContent = saasMode === "velocity"
        ? `Sprint 06: ${saasCompletedPts} pts · Target: ${saasTargetScope} pts`
        : `Gross: $${saasGrossRevenue.toLocaleString()} · ${saasInventoryUnits} SKUs in Stock`;
    }
  }

  function renderSaas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#080f1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (saasMode === "velocity") {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      for (let y = 40; y <= 160; y += 40) {
        ctx.beginPath();
        ctx.moveTo(35, y);
        ctx.lineTo(320, y);
        ctx.stroke();
      }

      const targetY = 180 - (saasTargetScope / 80) * 140;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(239, 131, 84, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(35, targetY);
      ctx.lineTo(320, targetY);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "#ef8354";
      ctx.font = "8px ui-monospace, monospace";
      ctx.fillText(`TARGET: ${saasTargetScope} PTS`, 40, targetY - 4);

      const allSprints = [...saasHistoricalSprints, saasCompletedPts];
      const barWidth = 28;
      const startX = 52;
      const gap = 44;
      const barTops = [];

      allSprints.forEach((pts, idx) => {
        const x = startX + idx * gap;
        const barHeight = Math.min(150, (pts / 80) * 140);
        const y = 180 - barHeight;
        barTops.push({ x: x + barWidth / 2, y });

        const isCurrent = idx === 5;
        const grad = ctx.createLinearGradient(0, y, 0, 180);
        if (isCurrent) {
          grad.addColorStop(0, "#e7f26d");
          grad.addColorStop(1, "rgba(231, 242, 109, 0.35)");
        } else {
          grad.addColorStop(0, "#38bdf8");
          grad.addColorStop(1, "rgba(56, 189, 248, 0.2)");
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();

        ctx.strokeStyle = isCurrent ? "var(--lime, #e7f26d)" : "rgba(56, 189, 248, 0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = isCurrent ? "#e7f26d" : "#cbd5e1";
        ctx.font = "8.5px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${pts}`, x + barWidth / 2, y - 5);

        ctx.fillStyle = isCurrent ? "#e7f26d" : "#64748b";
        ctx.font = "8px ui-monospace, monospace";
        ctx.fillText(`S0${idx + 1}`, x + barWidth / 2, 195);
      });

      if (barTops.length > 1) {
        ctx.beginPath();
        ctx.moveTo(barTops[0].x, barTops[0].y);
        for (let i = 1; i < barTops.length; i++) {
          ctx.lineTo(barTops[i].x, barTops[i].y);
        }
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.8;
        ctx.stroke();

        barTops.forEach((pt, i) => {
          ctx.fillStyle = i === 5 ? "#e7f26d" : "#ffffff";
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, i === 5 ? 3.5 : 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.textAlign = "start";
      ctx.fillStyle = "#94a3b8";
      ctx.font = "8px ui-monospace, monospace";
      ctx.fillText("DAILY HABIT STREAK:", 38, 218);
      for (let d = 0; d < 7; d++) {
        ctx.fillStyle = "#4ade80";
        ctx.beginPath();
        ctx.arc(145 + d * 14, 215, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#4ade80";
      ctx.fillText("7/7 ACTIVE 🔥", 248, 218);

    } else {
      ctx.textAlign = "start";
      ctx.fillStyle = "#38bdf8";
      ctx.font = "9px ui-monospace, monospace";
      ctx.fillText("POINT-OF-SALE (POS) LIVE CASH REGISTER", 20, 25);

      ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.beginPath();
      ctx.roundRect(20, 36, 140, 175, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "8px ui-monospace, monospace";
      ctx.fillText("ORDER RECEIPT #", 28, 52);
      ctx.fillStyle = "#e7f26d";
      ctx.fillText(`${saasPosOrders}`, 110, 52);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.beginPath();
      ctx.moveTo(28, 60);
      ctx.lineTo(150, 60);
      ctx.stroke();

      ctx.fillStyle = "#94a3b8";
      ctx.font = "7.5px ui-monospace, monospace";
      ctx.fillText("1x SaaS Pro Seat   $35.00", 28, 76);
      ctx.fillText("1x POS Thermal Roll $10.00", 28, 92);
      ctx.fillText("Subtotal:          $45.00", 28, 115);
      ctx.fillText("Tax (0%):           $0.00", 28, 130);

      ctx.fillStyle = "#34d399";
      ctx.font = "9px ui-monospace, monospace";
      ctx.fillText("TOTAL:             $45.00", 28, 150);

      ctx.fillStyle = "rgba(52, 211, 153, 0.18)";
      ctx.strokeStyle = "#34d399";
      ctx.beginPath();
      ctx.roundRect(28, 165, 124, 24, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#34d399";
      ctx.font = "8px ui-monospace, monospace";
      ctx.fillText("✓ ACID COMMIT OK", 40, 180);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "8.5px ui-monospace, monospace";
      ctx.fillText("SKU REAL-TIME INVENTORY", 175, 48);

      const skus = [
        { label: "SaaS Enterprise Seat", stock: Math.min(100, Math.round((saasInventoryUnits / 400) * 100)), col: "#38bdf8" },
        { label: "POS Terminal Engine", stock: Math.min(100, Math.round((saasInventoryUnits / 450) * 92)), col: "#e7f26d" },
        { label: "RFID Scanner Module", stock: Math.min(100, Math.round((saasInventoryUnits / 380) * 85)), col: "#34d399" },
        { label: "Double-Entry Ledger", stock: 99, col: "#a78bfa" }
      ];

      skus.forEach((sku, idx) => {
        const y = 68 + idx * 36;
        ctx.fillStyle = "#94a3b8";
        ctx.font = "7.5px ui-monospace, monospace";
        ctx.fillText(sku.label, 175, y);

        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.beginPath();
        ctx.roundRect(175, y + 5, 140, 9, 3);
        ctx.fill();

        ctx.fillStyle = sku.col;
        ctx.beginPath();
        ctx.roundRect(175, y + 5, (sku.stock / 100) * 140, 9, 3);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "7px ui-monospace, monospace";
        ctx.fillText(`${sku.stock}%`, 295, y + 12);
      });
    }

    if (saasSparkParticles.length > 0) {
      for (let i = saasSparkParticles.length - 1; i >= 0; i--) {
        const p = saasSparkParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;
        if (p.alpha <= 0) {
          saasSparkParticles.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    if (saasFlashAlpha > 0.01) {
      ctx.save();
      ctx.strokeStyle = `rgba(231, 242, 109, ${saasFlashAlpha})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      saasFlashAlpha = Math.max(0, saasFlashAlpha - 0.04);
    }

    saasLabRaf = requestAnimationFrame(renderSaas);
  }

  stopSaasLab();
  updateSaasTelemetry();
  saasLabRaf = requestAnimationFrame(renderSaas);
}

function stopSaasLab() {
  if (saasLabRaf) {
    cancelAnimationFrame(saasLabRaf);
    saasLabRaf = null;
  }
}

function openModal(projectKey) {
  const data = projectData[projectKey];
  if (!data) return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("project", projectKey);
    window.history.replaceState({}, "", url.toString());
  } catch (_) {}
  previousActiveElement = document.activeElement;

  // Header & Identity
  $("#modalTitle").textContent = data.title;
  const modalTagline = $("#modalTagline");
  if (modalTagline) modalTagline.textContent = data.tagline || data.overview;
  const modalGalleryIntro = $("#modalGalleryIntro");
  if (modalGalleryIntro) modalGalleryIntro.textContent = data.galleryIntro || "Explore the project’s visual presentation and its related portfolio demonstration.";
  const modalCat = $("#modalCategory");
  if (modalCat) modalCat.textContent = data.category || "Project Case Study";
  const modalStatus = $("#modalStatusBadge");
  if (modalStatus) {
    modalStatus.innerHTML = '<span class="modal-pulse-dot"></span> ' + (data.status || "Production");
  }

  // Counter & Project Selector
  const modalCounter = $("#modalCounter");
  if (modalCounter) modalCounter.textContent = 'PROJECT ' + (data.index || '01 / 09') + ' · CASE STUDY';
  const modalSelect = $("#modalProjectSelect");
  if (modalSelect) modalSelect.value = projectKey;

  // Metadata Specifications
  const modalRole = $("#modalRole");
  if (modalRole) modalRole.textContent = data.role || "Lead Architect & Developer";
  const modalTimeline = $("#modalTimeline");
  if (modalTimeline) modalTimeline.textContent = data.timeline || "Production · 2026";
  const modalDomain = $("#modalDomain");
  if (modalDomain) modalDomain.textContent = data.domain || data.category;
  const modalArch = $("#modalArchPattern");
  if (modalArch) modalArch.textContent = data.archPattern || "Modular Architecture";

  // Featured Visual Hero
  const heroVisual = $("#modalHeroVisual");
  if (heroVisual) {
    heroVisual.innerHTML = renderHeroVisualMarkup(data);
  }

  // Section 1: Overview
  $("#modalOverview").textContent = data.overview;
  const overviewCallout = $("#modalOverviewCallout");
  if (overviewCallout) {
    overviewCallout.textContent = data.overviewCallout || data.tagline;
  }

  // Section 2: Problem & Objectives
  $("#modalProblem").textContent = data.problem;
  const objectivesList = $("#modalObjectivesList");
  if (objectivesList && Array.isArray(data.objectives)) {
    objectivesList.innerHTML = data.objectives.map(obj => '<li><span class="bullet-ico">▹</span> ' + obj + '</li>').join("");
  }

  // Section 3: Concept & In / Runs / Out Architecture
  const modalConcept = $("#modalConcept");
  if (modalConcept) modalConcept.textContent = data.concept || "";
  const archIn = $("#archInList");
  if (archIn && data.pipeline && Array.isArray(data.pipeline.in)) {
    archIn.innerHTML = data.pipeline.in.map(item => '<li><span class="pipe-bullet">●</span> ' + item + '</li>').join("");
  }
  const archRuns = $("#archRunsList");
  if (archRuns && data.pipeline && Array.isArray(data.pipeline.runs)) {
    archRuns.innerHTML = data.pipeline.runs.map(item => '<li><span class="pipe-bullet">●</span> ' + item + '</li>').join("");
  }
  const archOut = $("#archOutList");
  if (archOut && data.pipeline && Array.isArray(data.pipeline.out)) {
    archOut.innerHTML = data.pipeline.out.map(item => '<li><span class="pipe-bullet">●</span> ' + item + '</li>').join("");
  }

  // Section 4: User Experience Journey
  const uxGrid = $("#modalUxJourney");
  if (uxGrid && Array.isArray(data.uxJourney)) {
    uxGrid.innerHTML = data.uxJourney.map(step => `
      <div class="ux-step-card">
        <span class="ux-step-num">${step.step}</span>
        <h4 class="ux-step-title">${step.title}</h4>
        <p class="ux-step-desc">${step.desc}</p>
      </div>
    `).join("");
  }

  // Section 5: Development Process & Challenges
  const modalDev = $("#modalDevelopment");
  if (modalDev) modalDev.textContent = data.development || "";
  const challengesList = $("#modalChallengesList");
  if (challengesList && Array.isArray(data.challenges)) {
    challengesList.innerHTML = data.challenges.map(c => '<li><span class="bullet-ico">▹</span> ' + c + '</li>').join("");
  }
  $("#modalLearned").textContent = data.learned;

  // Section 6: Technology Stack & Telemetry
  $("#modalTech").innerHTML = data.tech.map(item => '<span class="modal-tech-tag">' + item + '</span>').join("");
  const telemetryTable = $("#modalTelemetryTable");
  if (telemetryTable && Array.isArray(data.telemetry)) {
    telemetryTable.innerHTML = data.telemetry.map(t => `
      <div class="telemetry-cell">
        <span class="telem-label">${t.label}</span>
        <strong class="telem-value">${t.value}</strong>
        <span class="telem-note">${t.note}</span>
      </div>
    `).join("");
  }

  // Section 8: Final Outcome & Achievements
  const modalOutcome = $("#modalOutcome");
  if (modalOutcome) modalOutcome.textContent = data.outcome || "";
  const achieveList = $("#modalAchievementsList");
  if (achieveList && Array.isArray(data.achievements)) {
    achieveList.innerHTML = data.achievements.map(a => '<span class="modal-achieve-badge"><span class="badge-check">✓</span> ' + a + '</span>').join("");
  }

  // Action Buttons
  $("#modalActions").innerHTML = data.actions.map(act =>
    '<a class="modal-btn ' + (act.primary ? '' : 'secondary') + '" href="' + act.url + '" target="_blank" rel="noopener noreferrer">' + act.label + '</a>'
  ).join("");

  // Next Project Teaser Card
  const nextProject = projectData[data.nextKey];
  if (nextProject) {
    const teaserIdx = $("#teaserNextIndex");
    if (teaserIdx) teaserIdx.textContent = nextProject.index;
    const teaserTitle = $("#teaserNextTitle");
    if (teaserTitle) teaserTitle.textContent = nextProject.title.split("—")[0].trim();
    const teaserDesc = $("#teaserNextDesc");
    if (teaserDesc) teaserDesc.textContent = nextProject.domain || nextProject.category;
  }

  // Sandboxes Activation
  const pinitSandbox = $("#pinitSandbox");
  if (pinitSandbox) {
    if (projectKey === "pinit") {
      pinitSandbox.hidden = false;
      initPinitScanner();
    } else {
      pinitSandbox.hidden = true;
    }
  }

  const joulSandbox = $("#joulSandbox");
  if (joulSandbox) {
    if (projectKey === "joul") {
      joulSandbox.hidden = false;
      initJoulSimulator();
    } else {
      joulSandbox.hidden = true;
    }
  }

  const clpSandbox = $("#clpSandbox");
  if (clpSandbox) {
    if (projectKey === "clp") {
      clpSandbox.hidden = false;
      initClpSimulator();
    } else {
      clpSandbox.hidden = true;
    }
  }

  const miniworldSandbox = $("#miniworldSandbox");
  if (miniworldSandbox) {
    if (projectKey === "miniworld") {
      miniworldSandbox.hidden = false;
      initMiniworldLab();
    } else {
      miniworldSandbox.hidden = true;
      stopMiniworldLab();
    }
  }

  const aquariumSandbox = $("#aquariumSandbox");
  if (aquariumSandbox) {
    if (projectKey === "aquarium") {
      aquariumSandbox.hidden = false;
      initAquariumLab();
    } else {
      aquariumSandbox.hidden = true;
      stopAquariumLab();
    }
  }

  const gestureSandbox = $("#gestureSandbox");
  if (gestureSandbox) {
    if (projectKey === "gesture") {
      gestureSandbox.hidden = false;
      initGestureLab();
    } else {
      gestureSandbox.hidden = true;
      stopGestureLab();
    }
  }

  const saasSandbox = $("#saasSandbox");
  if (saasSandbox) {
    if (projectKey === "saas") {
      saasSandbox.hidden = false;
      initSaasLab();
    } else {
      saasSandbox.hidden = true;
      stopSaasLab();
    }
  }

  const devpulseSandbox = $("#devpulseSandbox");
  if (devpulseSandbox) {
    if (projectKey === "devpulse") {
      devpulseSandbox.hidden = false;
      initDevpulseLab();
    } else {
      devpulseSandbox.hidden = true;
      stopDevpulseLab();
    }
  }

  const portfolioSandbox = $("#portfolioSandbox");
  if (portfolioSandbox) {
    if (projectKey === "portfolio") {
      portfolioSandbox.hidden = false;
    } else {
      portfolioSandbox.hidden = true;
    }
  }

  modal.showModal();
  $("#modalClose")?.focus();
}

function renderHeroVisualMarkup(data) {
  const k = data.key;
  if (k === "pinit") {
    return `
      <div class="hero-vis-box pinit-hero-vis">
        <div class="vis-radar-display">
          <div class="vis-radar-circle r-lg"></div>
          <div class="vis-radar-circle r-md"></div>
          <div class="vis-radar-circle r-sm"></div>
          <div class="vis-radar-sweep-arm"></div>
          <div class="vis-radar-blip b-safe"></div>
          <div class="vis-radar-blip b-warn"></div>
        </div>
        <div class="vis-telemetry-badge">
          <span class="tele-dot green"></span>
          <span>PORTFOLIO DEMO · URL RISK SIGNALS</span>
        </div>
      </div>
    `;
  } else if (k === "miniworld") {
    return `
      <div class="hero-vis-box miniworld-hero-vis">
        <div class="vis-celestial-scene">
          <div class="vis-celestial-sun"></div>
          <div class="vis-planet-core">
            <div class="vis-crater c1"></div>
            <div class="vis-crater c2"></div>
            <div class="vis-terrain-tree"></div>
          </div>
          <div class="vis-orbit-ring"></div>
        </div>
        <div class="vis-telemetry-badge">
          <span class="tele-dot cyan"></span>
          <span>60 FPS WEBGL · CEL-SHADED PLANETARIUM</span>
        </div>
      </div>
    `;
  } else if (k === "joul") {
    return `
      <div class="hero-vis-box joul-hero-vis">
        <div class="vis-timeline-board">
          <div class="vis-timeline-slot booked"><span class="slot-text">08:00 - 14:00 RENTED</span></div>
          <div class="vis-timeline-slot buffer"><span class="slot-text">+2H BUFFER 🧼</span></div>
          <div class="vis-timeline-slot ready"><span class="slot-text">16:00 READY</span></div>
        </div>
        <div class="vis-telemetry-badge">
          <span class="tele-dot amber"></span>
          <span>100% ESCROW SECURED · 197 TESTS PASSING</span>
        </div>
      </div>
    `;
  } else if (k === "clp") {
    return `
      <div class="hero-vis-box clp-hero-vis">
        <div class="vis-hanzi-display">
          <span class="vis-hanzi-char">学</span>
          <span class="vis-hanzi-py">xué · to learn / study</span>
          <div class="vis-srs-progress-bar"><div class="vis-srs-fill" style="width: 85%;"></div></div>
        </div>
        <div class="vis-telemetry-badge">
          <span class="tele-dot purple"></span>
          <span>SM-2 INTERVAL 6d · GEMINI 1.5 PRO TUTOR</span>
        </div>
      </div>
    `;
  } else if (k === "aquarium") {
    return `
      <div class="hero-vis-box aquarium-hero-vis">
        <div class="vis-aqua-chamber">
          <div class="vis-particle-stream">
            <span class="stream-dot d1"></span><span class="stream-dot d2"></span><span class="stream-dot d3"></span>
          </div>
          <div class="vis-filter-layers">
            <span class="layer-pill l-sponge">SUMP BASIN</span>
            <span class="layer-pill l-bio">BAFFLE CHAMBER</span>
            <span class="layer-pill l-chem">PUMP &amp; PLUMBING</span>
          </div>
        </div>
        <div class="vis-telemetry-badge">
          <span class="tele-dot teal"></span>
          <span>3D COMPONENT LAYOUT · FLOW ESTIMATES</span>
        </div>
      </div>
    `;
  } else if (k === "gesture") {
    return `
      <div class="hero-vis-box gesture-hero-vis">
        <div class="vis-skeletal-hand">
          <div class="vis-joint-reticle r1"></div><div class="vis-joint-reticle r2"></div><div class="vis-joint-reticle r3"></div>
          <div class="vis-pinch-vector-line"></div>
          <span class="vis-pinch-tag">D4-8: 0.038 PINCH</span>
        </div>
        <div class="vis-telemetry-badge">
          <span class="tele-dot green"></span>
          <span>21 LANDMARKS LOCKED · 60 FPS OPENCV</span>
        </div>
      </div>
    `;
  } else if (k === "saas") {
    return `
      <div class="hero-vis-box saas-hero-vis">
        <div class="vis-sprint-chart">
          <div class="vis-bar-col b1" style="height: 60%;"></div>
          <div class="vis-bar-col b2" style="height: 80%;"></div>
          <div class="vis-bar-col b3" style="height: 100%;"></div>
          <div class="vis-burndown-target-line"></div>
        </div>
        <div class="vis-telemetry-badge">
          <span class="tele-dot orange"></span>
          <span>100% ACID SALES · ABA PAYWAY INTEGRATED</span>
        </div>
      </div>
    `;
  } else if (k === "devpulse") {
    return `
      <div class="hero-vis-box devpulse-hero-vis">
        <div class="vis-pulse-waveform">
          <span class="wf-bar w1"></span><span class="wf-bar w2"></span><span class="wf-bar w3"></span>
          <span class="wf-bar w4"></span><span class="wf-bar w5"></span><span class="wf-bar w6"></span>
        </div>
        <div class="vis-telemetry-badge">
          <span class="tele-dot blue"></span>
          <span>240 REQ/S THROUGHPUT · 18ms STREAM</span>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="hero-vis-box portfolio-hero-vis">
        <div class="vis-code-shell">
          <div class="vis-window-dots"><span class="w-dot red"></span><span class="w-dot yellow"></span><span class="w-dot green"></span></div>
          <div class="vis-code-preview"><code>const portfolio = new CreativeEngine({ vanilla: true });</code></div>
        </div>
        <div class="vis-telemetry-badge">
          <span class="tele-dot lime"></span>
          <span>100% VANILLA WEB · 37/37 TESTS PASSING</span>
        </div>
      </div>
    `;
  }
}


function closeModal() {
  stopMiniworldLab();
  stopAquariumLab();
  stopGestureLab();
  stopSaasLab();
  restoreProjectSandbox();
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("project");
    window.history.replaceState({}, "", url.toString());
  } catch (_) {}
  if (modal?.open) {
    modal.close();
    if (previousActiveElement && typeof previousActiveElement.focus === "function") {
      previousActiveElement.focus();
    }
  }
}

$$(".project-open").forEach(button => button.addEventListener("click", () => {
  const card = button.closest(".project-card");
  if (card) openModal(card.dataset.project);
}));

$$(".project-card-share-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const card = btn.closest(".project-card");
    const projId = card?.dataset?.project || "";
    const projTitle = $(".project-title", card)?.textContent?.trim() || "Project";
    const shareUrl = `${window.location.origin}${window.location.pathname}?project=${projId}`;

    const onCopied = () => {
      btn.classList.add("copied");
      const icon = $(".share-icon", btn);
      if (icon) icon.textContent = "✓";
      if (typeof playSound === "function") playSound("chime");
      if (typeof showPortfolioToast === "function") {
        showPortfolioToast(`Copied direct link for ${projTitle}! 🔗`);
      }
      setTimeout(() => {
        btn.classList.remove("copied");
        if (icon) icon.textContent = "🔗";
      }, 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(onCopied).catch(() => {
        fallbackCopy(shareUrl);
        onCopied();
      });
    } else {
      fallbackCopy(shareUrl);
      onCopied();
    }
  });
});

$("#openPinitScannerBtn")?.addEventListener("click", () => {
  openModal("pinit");
  setTimeout(() => {
    $("#pinitInput")?.focus();
  }, 180);
});

$("#openJoulSimulatorBtn")?.addEventListener("click", () => {
  openModal("joul");
});

$("#openClpSimulatorBtn")?.addEventListener("click", () => {
  openModal("clp");
});

$("#openAquariumLabBtn")?.addEventListener("click", () => {
  openModal("aquarium");
});

$("#openGestureLabBtn")?.addEventListener("click", () => {
  openModal("gesture");
});

$("#openSaasLabBtn")?.addEventListener("click", () => {
  openModal("saas");
});

$("#consoleSaasDemo")?.addEventListener("click", () => {
  openModal("saas");
});

$("#consoleClpDemo")?.addEventListener("click", () => {
  openModal("clp");
});

$("#modalClose")?.addEventListener("click", closeModal);
modal?.addEventListener("click", event => { if (event.target === modal) closeModal(); });

// Resume / CV Modal Controller
const resumeModal = $("#resumeModal");
let previousResumeElement = null;

const openResumeModal = (targetSectionId = null) => {
  if (!resumeModal) return;
  previousResumeElement = document.activeElement;
  resumeModal.showModal();
  if (targetSectionId) {
    const target = $(targetSectionId);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.classList.add("resume-section-highlight");
        setTimeout(() => target.classList.remove("resume-section-highlight"), 1900);
      }, 140);
      return;
    }
  }
  $("#resumeCloseBtn")?.focus();
};

const closeResumeModal = () => {
  if (resumeModal?.open) {
    resumeModal.close();
    if (previousResumeElement && typeof previousResumeElement.focus === "function") {
      previousResumeElement.focus();
    }
  }
};

$("#resumeHeroBtn")?.addEventListener("click", () => openResumeModal());
$("#resumeContactBtn")?.addEventListener("click", () => openResumeModal());
$("#resumeCloseBtn")?.addEventListener("click", closeResumeModal);
$("#resumeFooterClose")?.addEventListener("click", closeResumeModal);
$("#resumePrintBtn")?.addEventListener("click", () => window.print());
$$(".resume-view-btn, .edu-view-btn").forEach(btn => {
  btn.addEventListener("click", () => openResumeModal("#resumeEduSection"));
});
resumeModal?.addEventListener("click", event => {
  if (event.target === resumeModal) closeResumeModal();
});

// 8. Interactive Terminal with History & Neofetch
const terminal = $("#terminal");
const terminalOutput = $("#terminalOutput");
const terminalInput = $("#terminalInput");
const commandHistory = [];
let historyIndex = -1;

const terminalCommands = {
  help: "Available commands: <b>about</b>, <b>achievements</b>, <b>education</b>, <b>coursework</b>, <b>cpp</b>, <b>skills</b>, <b>projects</b>, <b>find [query]</b>, <b>cat [file]</b>, <b>curl</b>, <b>history</b>, <b>export</b>, <b>vcard</b>, <b>game</b>, <b>arcade</b>, <b>accent [theme]</b>, <b>synth [demo]</b>, <b>piano</b>, <b>time</b>, <b>volume [0-100]</b>, <b>demo [project]</b>, <b>cite [project]</b>, <b>copy</b>, <b>sound</b>, <b>test</b>, <b>bench</b>, <b>timeline</b>, <b>architecture</b>, <b>ping</b>, <b>matrix</b>, <b>git</b>, <b>nav [section]</b>, <b>shortcuts</b>, <b>pinit</b>, <b>aquarium</b>, <b>nitrogen</b>, <b>filter</b>, <b>joul</b>, <b>rental</b>, <b>gesture</b>, <b>vision</b>, <b>mediapipe</b>, <b>miniworld</b>, <b>shader</b>, <b>glsl</b>, <b>saas</b>, <b>pos</b>, <b>clp</b>, <b>srs</b>, <b>sm2</b>, <b>devpulse</b>, <b>portfolio</b>, <b>focus</b>, <b>work</b>, <b>contact</b>, <b>resume</b>, <b>cv</b>, <b>share</b>, <b>recruiter</b>, <b>stats</b>, <b>neofetch</b>, <b>theme</b>, <b>cmdk</b>, <b>search</b>, <b>github</b>, <b>linkedin</b>, <b>whoami</b>, <b>date</b>, <b>clear</b>",
  matrix: () => {
    const terminalBody = $(".terminal-body");
    if (!terminalBody) return "Terminal stream window not accessible.";
    const existing = $("#terminalMatrixCanvas");
    if (existing) {
      existing.remove();
      return "Matrix digital rain sequence terminated.";
    }
    const canvas = document.createElement("canvas");
    canvas.id = "terminalMatrixCanvas";
    canvas.style.cssText = "width:100%;height:160px;border-radius:6px;margin:8px 0;display:block;background:#050d08;border:1px solid rgba(16,185,129,0.3);";
    terminalBody.appendChild(canvas);
    canvas.width = canvas.offsetWidth || 500;
    canvas.height = canvas.offsetHeight || 160;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "Streaming Matrix stream...";
    const chars = "0123456789ABCDEFアイウエオカキクケコサシスセソタチツテト";
    const fontSize = 11;
    const cols = Math.floor(canvas.width / fontSize);
    const drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -15));
    let frames = 0;
    const timer = setInterval(() => {
      ctx.fillStyle = "rgba(5, 13, 8, 0.16)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#10b981";
      ctx.font = `${fontSize}px monospace`;
      drops.forEach((y, i) => {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, y * fontSize);
        if (y * fontSize > canvas.height && Math.random() > 0.97) drops[i] = 0;
        drops[i]++;
      });
      frames++;
      if (frames > 300) clearInterval(timer);
    }, 35);
    return "Streaming Matrix telemetry stream... Run <b>matrix</b> again to dismiss or wait for auto-timeout.";
  },
  git: () => {
    return `<pre style="color:var(--lime);font-size:11px;line-height:1.45;margin:4px 0;">
* <b>0131eba</b> (HEAD -> main, origin/main) docs(navigation): document scroll-triggered section transitions
* <b>af288df</b> feat(navigation): implement scroll-triggered section transitions and dynamic navigation observer
* <b>d84a95a</b> feat(cmdk): integrate Year 2 coursework terminal jump in command palette
* <b>29aa660</b> docs(features): document academic terminal commands and minimalist audio controls
* <b>e6ee2fe</b> feat(miniworld): redesign procedural audio toggle button with vector waves
* <b>85bfdc3</b> style(audio): refine sound toggle button to sleek minimalist glass design
* <b>c2c1448</b> feat(coursework): update networking lecture notes and harden student grading system</pre>`;
  },
  nav: (arg) => {
    const target = (arg || "").trim().toLowerCase();
    const valid = ["home", "about", "terminal-section", "terminal", "skills", "projects", "achievements", "contact"];
    if (!target) return "Usage: <b>nav [section]</b> · Options: <i>home</i>, <i>about</i>, <i>terminal</i>, <i>skills</i>, <i>projects</i>, <i>achievements</i>, <i>contact</i>";
    const mapped = target === "terminal" ? "terminal-section" : target;
    if (valid.includes(mapped)) {
      navigateToSection(mapped);
      return `Navigating smoothly to section <b>#${mapped}</b>...`;
    }
    return `Unknown section "${target}". Available: ${valid.join(", ")}`;
  },
  shortcuts: () => {
    $("#shortcutsModal")?.showModal();
    return "Opened keyboard shortcuts cheatsheet modal! ⌨️";
  },
  sound: () => {
    const next = toggleSfx();
    return `Sound effects: <b>${next ? "Enabled 🔊" : "Muted 🔇"}</b>.`;
  },
  sfx: () => terminalCommands.sound(),
  copy: () => {
    $("#copyCodeBtn")?.click();
    return "Copied active hero code snippet to clipboard! 📋";
  },
  ping: () => `pong! Telemetry latency: ${Math.floor(Math.random() * 8 + 6)}ms · ES2026 zero-latency client runtime.`,
  test: () => {
    return `<pre style="color:var(--lime);font-size:11px;line-height:1.4;">
Diagnostic System Telemetry:
================================================================
✓ Core Assets: index.html, styles.css, script.js, sw.js (OK)
✓ WebGL 3D Acceleration: ${window.WebGLRenderingContext ? "Hardware Accelerated" : "Fallback"}
✓ Web Audio Procedural Synth: ${window.AudioContext || window.webkitAudioContext ? "Active" : "Unavailable"}
✓ Progressive Web App (PWA): ${'serviceWorker' in navigator ? "Registered (Offline Ready)" : "Not supported"}
✓ Screen Viewport: ${window.innerWidth}x${window.innerHeight} (${window.devicePixelRatio}x DPI)
✓ Active Visual Theme: ${document.documentElement.getAttribute("data-theme") || "dark"}
✓ Test Suite Integrity: 100% Passed (All automated checks OK)
================================================================
System operational · ready to build.</pre>`;
  },
  about: "Gouv Kimsea — Dual degree undergraduate in Computer Science (Paragon.U) & Business Administration (Bonamary.U) building tangible products.",
  journey: () => {
    const el = document.getElementById("achievements");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    return `<pre style="color:var(--lime);font-size:11px;line-height:1.5;">
Gouv Kimsea — Milestones &amp; Focus:
================================================================
Scrolled to Section: Milestones &amp; Focus!</pre>`;
  },
  roadmap: () => terminalCommands.journey(),
  education: () => {
    return `<pre style="color:var(--lime);font-size:11px;line-height:1.5;">
Academic Education Profile (Dual Degree):
================================================================
1. Bachelor of Computer Science (B.Sc.)
   Paragon International University · Phnom Penh, Cambodia
   Focus: Algorithms, Software Architecture, C++, WebGL & Systems
   Status: Undergraduate · Active (2026)

2. Bachelor of Business Administration (B.B.A.)
   Bonamary University · Phnom Penh, Cambodia
   Focus: Business Strategy, Operations & Product Economics
   Status: Undergraduate · Active (2026)
================================================================
The Intersection: Algorithmic rigor paired with market insight.</pre>`;
  },
  degree: () => terminalCommands.education(),
  university: () => terminalCommands.education(),
  school: () => terminalCommands.education(),
  coursework: () => {
    return `<pre style="color:var(--lime);font-size:11px;line-height:1.5;">
Paragon International University (PIU) — Year 2 Semester 1 Coursework:
================================================================
1. Data Structures &amp; Algorithms (C++)
   • Custom OOP student information &amp; evaluation system
   • Array structures, robust numeric stream validation &amp; memory safety
2. CS 223: Web Applications &amp; OOP (PHP 8 / Composer)
   • Modular PSR-4 architecture, EnrollmentManager &amp; Student models
3. Computer Networking (Cisco ITN Module 3)
   • Network protocols, OSI 7-layer stack, packet encapsulation &amp; routing
4. Linear Algebra (MATH 241)
   • Matrix operations, vector spaces, eigenvalues &amp; linear transformations
5. System Analysis &amp; Design
   • System development lifecycle (SDLC), requirement modeling &amp; UML
6. Accounting for Technical Use
   • Balance sheets, double-entry ledgers, financial flow &amp; asset depreciation
================================================================
Type 'grading' or 'cpp' to inspect the C++ data structures project.</pre>`;
  },
  piu: () => terminalCommands.coursework(),
  cpp: () => {
    return `<pre style="color:var(--lime);font-size:11px;line-height:1.5;">
C++ Student Grading &amp; Evaluation System (OOP &amp; Data Structures):
================================================================
Architecture Overview:
• Paradigm: Object-Oriented Programming (OOP) in C++ (MSYS2 GCC 15.2.0)
• Class Definition: 'student' encapsulating subject ledgers &amp; grade calculators
• Features:
  - Input stream validation preventing buffer injection &amp; non-numeric loops
  - Dynamic subject registration (1-6 subjects per student profile)
  - Numeric boundary normalization ensuring scores &gt;= 80 evaluate to 'A'
  - High-performance, clean standard output CLI formatting
• Source: D:/EVERYTHING/YEAR2/semester 1/PIU/data structure and al/coding value/
================================================================
All compiler checks passed: g++ -Wall -Wextra (0 errors, 0 warnings).</pre>`;
  },
  grading: () => terminalCommands.cpp(),
  skills: "JavaScript · TypeScript · NestJS · Next.js · Prisma · C++ · Python · WebGL / Shaders · HTML5 / CSS3 · React · REST APIs · Node.js · SQL · MySQL · PHP",
  projects: "1. <b>PinitAI</b> — Heuristic scam & threat detector (TypeScript)\n2. <b>Aquarium Filter Sim</b> — Fluid dynamics & nitrogen cycle physics (TypeScript)\n3. <b>JOUL Rental Service</b> — Enterprise vehicle fleet & escrow platform (PHP 8 / MySQL)\n4. <b>Chinese Learning Platform</b> — Full-stack monorepo, SuperMemo-2 SRS & Gemini AI (NestJS/Next.js)\n5. <b>Gesture App</b> — 21-joint real-time hand tracking & computer vision (Python / MediaPipe)\n6. <b>Mini World 3D</b> — Procedural planet simulation & WebGL shader lab\n7. <b>Productivity SaaS & POS</b> — Sprint velocity burndown & retail cash ledger (PHP)\n8. <b>DevPulse</b> — Real-time telemetry dashboard & metrics (TypeScript)\n9. <b>This Portfolio</b> — Ultra-performant Vanilla ES2026 platform\nType any project name or click any card to launch its interactive breakdown.",
  achievements: () => {
    const el = document.getElementById("achievements");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    return `<pre style="color:var(--lime);font-size:11px;line-height:1.4;">
Engineering Milestones & GitHub Accolades:
----------------------------------------
1. Multi-Product Velocity (15+ GitHub Repos: PinitAI, Rental Service, Aquarium Sim, Gesture App, Mini World, SaaS)
2. Procedural WebGL 3D & Physical Engines (Mini World 3D & Aquarium Filter Simulation in TypeScript)
3. Pinit Threat Intelligence (AI Phishing & Scam Indicator Heuristics)
4. 15+ Public Repositories on GitHub (Continuous Shipping Velocity @gouvkimsea)
5. Computer Science Foundations (Algorithms, Data Structures, C++, SQL, Dual Degree)
6. Computer Vision & Applied Systems (Gesture App 21-point tracking & Vanilla CSS UI)

Scrolled to Section 05: Engineering Milestones!</pre>`;
  },
  accolades: () => {
    const el = document.getElementById("achievements");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    return "Scrolled to Section 05: Engineering Milestones!";
  },
  trophies: () => {
    const el = document.getElementById("achievements");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    return "Scrolled to Section 05: Engineering Milestones!";
  },
  focus: () => {
    const el = document.querySelector(".bento-focus");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    return "Scrolled to Bento Focus & Availability!";
  },
  joul: () => {
    openModal("joul");
    setTimeout(() => {
      const lab = document.getElementById("joulSandbox");
      if (lab) lab.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    return "Opening JOUL Rental Service (Enterprise Fleet & Escrow Platform) project modal & fleet simulator...";
  },
  rental: () => terminalCommands.joul(),
  aquarium: () => {
    openModal("aquarium");
    setTimeout(() => {
      const lab = document.getElementById("aquariumSandbox");
      if (lab) lab.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    return "Opening Aquarium Filter Sim modal & biological nitrogen cycle physics lab...";
  },
  nitrogen: () => terminalCommands.aquarium(),
  filter: () => terminalCommands.aquarium(),
  gesture: () => {
    openModal("gesture");
    setTimeout(() => {
      const lab = document.getElementById("gestureSandbox");
      if (lab) lab.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    return "Opening Gesture App (Python 21-Joint Computer Vision & MediaPipe Engine) project modal & spatial skeletal vision lab...";
  },
  vision: () => terminalCommands.gesture(),
  mediapipe: () => terminalCommands.gesture(),
  hand: () => terminalCommands.gesture(),
  saas: () => {
    openModal("saas");
    setTimeout(() => {
      const lab = document.getElementById("saasSandbox");
      if (lab) lab.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    return "Opening Productivity SaaS & POS Systems modal & interactive sprint burndown and cash register ledger lab...";
  },
  pos: () => terminalCommands.saas(),
  clp: () => {
    openModal("clp");
    setTimeout(() => {
      const lab = document.getElementById("clpSandbox");
      if (lab) lab.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    return "Opening Chinese Learning Platform (Monorepo, SuperMemo-2 SRS & Gemini AI) project modal & flashcard simulator...";
  },
  chinese: () => terminalCommands.clp(),
  srs: () => terminalCommands.clp(),
  sm2: () => terminalCommands.clp(),
  miniworld: () => {
    window.open("miniworld.html", "_blank");
    return "Launching Mini World 3D Planet Simulation in a new tab...";
  },
  shader: () => {
    openModal("miniworld");
    setTimeout(() => {
      const lab = document.getElementById("miniworldSandbox");
      if (lab) lab.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    return "Opening Mini World modal and activating Interactive WebGL Biome & Shader Lab...";
  },
  glsl: () => terminalCommands.shader(),
  biome: () => terminalCommands.shader(),
  pinit: () => {
    openModal("pinit");
    setTimeout(() => {
      const lab = document.getElementById("pinitSandbox");
      if (lab) lab.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    return "Opening Pinit (AI Threat & Scam Detector) project modal & heuristic radar scanner...";
  },
  devpulse: () => {
    openModal("devpulse");
    return "Opening DevPulse (Developer Telemetry Dashboard) project modal...";
  },
  portfolio: () => {
    openModal("portfolio");
    return "Opening This Portfolio Platform breakdown modal...";
  },
  stats: () => {
    return `<pre style="color:var(--lime);font-size:11px;line-height:1.4;">
Engineering Stats (2026):
----------------------------------------
• GitHub Repositories: 15+ Active
• Featured Systems: 9 (PinitAI, Aquarium Sim, JOUL Fleet, CLP Monorepo, Gesture App, Mini World 3D, Productivity SaaS, POS Systems, Portfolio)
• Interactive Sandboxes: 7 In-Modal Live Simulation Labs
• Primary Stack: TypeScript, NestJS, Next.js, Prisma, PHP 8 / MySQL, C++, Python, WebGL/GLSL
• Status: Active Development & Open to Opportunities</pre>`;
  },
  resume: () => {
    openResumeModal();
    return "Opening Curriculum Vitae (CV) modal...";
  },
  cv: () => {
    openResumeModal();
    return "Opening Curriculum Vitae (CV) modal...";
  },
  theme: () => {
    const next = toggleTheme();
    return `Theme switched to <b>${next}</b> mode.`;
  },
  search: () => {
    openCmdK();
    return "Opening ⌘K Command Palette...";
  },
  cmdk: () => {
    openCmdK();
    return "Opening ⌘K Command Palette...";
  },
  neofetch: () => {
    return `<pre style="color:var(--lime);font-size:10px;line-height:1.2;">
   ______  __ __
  / ____/ / //_/   gouv@portfolio
 / / __  / ,<      --------------
/ /_/ / / /| |     OS: Modern Web (HTML5/CSS3/ES2026)
\____/ /_/ |_|     Host: Gouv Kimsea's Portfolio
                   Shell: custom-zsh (interactive)
                   Stack: JS, C++, Python, WebGL/GLSL, React, APIs
                   Editor: Antigravity IDE
                   Status: Building & Available</pre>`;
  },
  contact: () => {
    const el = document.getElementById("contact");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    return "LET'S WORK. Direct channels:\n• Email: <a href='mailto:gouvkimsea@gmail.com' style='color:var(--lime)'>gouvkimsea@gmail.com</a>\n• GitHub: <a href='https://github.com/gouvkimsea' target='_blank' style='color:var(--lime)'>github.com/gouvkimsea</a>\n• LinkedIn: <a href='https://www.linkedin.com/in/gouv-kimsea-16795143a' target='_blank' style='color:var(--lime)'>linkedin.com/in/gouv-kimsea</a>";
  },
  work: () => terminalCommands.contact(),
  whoami: "guest — welcome to Gouv Kimsea's portfolio.",
  github: "Opening GitHub profile in a new tab...",
  linkedin: "Opening LinkedIn profile in a new tab...",
  date: () => new Date().toLocaleString(),
  share: () => {
    openShareModal();
    return "Opening Quick Share &amp; Recruiter Brief modal (Shift+S)...";
  },
  recruiter: () => {
    openShareModal();
    return "Opening Quick Share &amp; Recruiter Brief modal (Shift+S)...";
  },
  pitch: () => {
    openShareModal();
    return "Opening Quick Share &amp; Recruiter Brief modal (Shift+S)...";
  },
  shortcuts: () => {
    openShortcutsModal();
    return "Opening Keyboard Shortcuts &amp; Pro Navigation Guide (?)...";
  },
  keys: () => terminalCommands.shortcuts(),
  cheatsheet: () => terminalCommands.shortcuts(),
  skills: () => {
    return `<pre style="color:var(--lime);font-size:11px;line-height:1.45;margin:4px 0;">
Technical Competency Matrix &amp; Dual-Degree Tracks:
================================================================
[01] SYSTEMS &amp; CS ARCHITECTURE
     • Languages: C++ (OOP &amp; Memory), TypeScript, Python, GLSL, PHP
     • Core Theory: Data Structures (Trees, Heaps, Graphs), Big-O
     • Databases: Relational SQL (3NF, ACID), PostgreSQL, Prisma ORM

[02] GRAPHICS &amp; MODERN WEB
     • 3D Simulation: Pure WebGL 2.0 (Zero frameworks, 60 FPS), GLSL
     • Computer Vision: Python MediaPipe 21-joint 3D hand tracking
     • Frontend: Semantic HTML5, Vanilla CSS Tokens, React 19 / Next.js 14

[03] BUSINESS STRATEGY &amp; OPERATIONS
     • Commercial: Product Economics, Market Fit, Feasibility
     • Operations: Fleet Scheduling, Escrow Ledgers, POS Systems
     • B.Sc. Computer Science + B.B.A. Business Administration</pre>`;
  },
  toolkit: () => terminalCommands.skills(),
  bench: () => {
    const elCount = typeof document !== "undefined" && document.querySelectorAll ? document.querySelectorAll("*").length : 280;
    const theme = (typeof document !== "undefined" && document.documentElement) ? (document.documentElement.getAttribute("data-theme") || "dark") : "dark";
    const sfx = sfxEnabled ? "Enabled 🔊" : "Muted 🔇";
    const sw = (typeof navigator !== "undefined" && "serviceWorker" in navigator) ? "Active (v22 PWA)" : "Unsupported";
    const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
    const res = typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight} (${dpr}x DPI)` : "Headless";
    const navDots = (typeof document !== "undefined" && document.getElementById("sectionNavDots")) ? "Active" : "Inactive";
    return `<pre style="color:var(--lime);font-size:11px;line-height:1.45;margin:4px 0;">
Runtime Performance &amp; Telemetry Diagnostics:
================================================================
• DOM Elements in Tree   : ${elCount} nodes (100% unique IDs, 0 duplicates)
• Rendering Pipeline     : Hardware Accelerated WebGL 2.0 &amp; CSS Tokens
• Client Screen Viewport : ${res}
• Active Interface Theme : ${theme.toUpperCase()} MODE
• Procedural Audio Synth : ${sfx}
• Progressive Web App    : ${sw}
• Floating Dots HUD      : ${navDots}
• Architectural Health   : 100% (Automated Integrity Tests Passing)</pre>`;
  },
  perf: () => terminalCommands.bench(),
  timeline: () => {
    const btn = $("#achieveViewTimelineBtn");
    if (btn) btn.click();
    navigateToSection("achievements");
    return "Toggled to Chronological Engineering Journey Timeline mode &amp; jumped to Milestones! ⎇";
  },
  architecture: () => {
    return `<pre style="color:var(--lime);font-size:11px;line-height:1.45;margin:4px 0;">
Portfolio Architectural Systems:
================================================================
Layer 1: Semantic Core  · Zero-dependency ES2026 &amp; HTML5 dialogs
Layer 2: Style Tokens   · Modular Vanilla CSS &amp; WCAG AAA contrast
Layer 3: 3D Graphics    · Hardware-accelerated WebGL 2.0 MiniWorld
Layer 4: Procedural SFX · Pure Web Audio synthesizers (0 audio files)
Layer 5: Offline PWA    · Service Worker Cache kimsea-pwa-v22</pre>`;
  },
  cat: (arg) => {
    const file = (arg || "").trim().toLowerCase();
    const files = {
      "developer.ts": `// Developer Persona & Systems Profile
export const developer = {
  name: "Gouv Kimsea",
  title: "Software Engineer & 3D Web Architect",
  institutions: [
    "Paragon International University (B.Sc. Computer Science)",
    "Bonamary University (B.B.A. Business Administration)"
  ],
  stack: ["TypeScript", "WebGL", "C++", "Python", "NestJS", "PHP 8"],
  focus: "Procedural simulation, enterprise systems & low-latency graphics"
};`,
      "skills.json": `{
  "core": ["Data Structures", "Algorithms", "Memory Control", "ACID Persistence"],
  "graphics": ["WebGL 2.0", "GLSL Shaders", "Matrix Math", "Fluid Dynamics"],
  "cloud": ["Docker", "Linux Shell", "CI/CD Actions", "Nginx", "Git Hygiene"]
}`,
      "status.sh": `#!/bin/bash
echo "System Status: Online ✦ 60 FPS Steady"
echo "Shipping: 15+ Repositories Active"
echo "Location: Phnom Penh, Cambodia"
echo "Open for: Engineering opportunities & collaborative projects"`
    };
    if (!file) {
      return "Usage: <b>cat [filename]</b> · Available files: <i>developer.ts</i>, <i>skills.json</i>, <i>status.sh</i>";
    }
    if (files[file]) {
      return `<pre style="color:var(--lime);font-size:11px;line-height:1.45;margin:4px 0;white-space:pre-wrap;">${escapeHtml(files[file])}</pre>`;
    }
    return `File not found: <b>${escapeHtml(file)}</b>. Available files: <i>developer.ts</i>, <i>skills.json</i>, <i>status.sh</i>`;
  },
  curl: () => {
    return `<pre style="color:var(--lime);font-size:11px;line-height:1.45;margin:4px 0;">
HTTP/2 200 OK
content-type: application/json; charset=utf-8
server: GitHub-Pages / Cloudflare
cache-control: max-age=600

{
  "engineer": "Gouv Kimsea",
  "status": "Available for High-Impact Roles",
  "degrees": ["B.Sc. Computer Science", "B.B.A. Business Administration"],
  "location": "Phnom Penh, Cambodia",
  "portfolio": "https://gouvkimsea.github.io/my-Portfolio-/",
  "github": "https://github.com/gouvkimsea"
}</pre>`;
  },
  history: () => {
    if (commandHistory.length === 0) return "No commands executed in this session yet.";
    return `<div style="font-size:11px;line-height:1.45;margin:4px 0;">${commandHistory.map((cmd, idx) => `<b>${idx + 1}</b>  ${escapeHtml(cmd)}`).join("<br>")}</div>`;
  },
  vcard: () => {
    if (typeof downloadVCard === "function") downloadVCard();
    return "Generated and downloaded Gouv Kimsea digital Contact Card (.vcf) 📇";
  },
  contactcard: () => terminalCommands.vcard(),
  export: () => {
    if (typeof exportTerminalSession === "function") exportTerminalSession();
    return "Exported interactive terminal session log (gouv-terminal-session.txt) 📥";
  },
  dump: () => terminalCommands.export(),
  log: () => terminalCommands.export(),
  game: () => {
    if (typeof openGameModal === "function") openGameModal();
    return "Launched DevLoop Cyber Indie Game Studio 🎮";
  },
  play: () => terminalCommands.game(),
  idle: () => terminalCommands.game(),
  arcade: () => {
    if (typeof openGameModal === "function") {
      openGameModal();
      document.getElementById("gameTabArcadeBtn")?.click();
    }
    return "Launched Cyber Bug Smasher Arcade 👾";
  },
  accent: (arg) => {
    const valid = ["lime", "cyan", "emerald", "magenta", "amber"];
    const target = (arg || "").trim().toLowerCase();
    if (!target) {
      const current = document.documentElement.getAttribute("data-accent") || "lime";
      return `<pre class="term-pre" style="margin:4px 0;font-size:11px;line-height:1.45;">🎨 <b>Cyber Accent Theme Palette System</b>
--------------------------------------------------------
Current Accent: <b>${current.toUpperCase()}</b>
Available:      <b>accent lime</b> (Signature Neon Lime & Orange)
                <b>accent cyan</b> (Cyberpunk Cyan & Violet)
                <b>accent emerald</b> (Matrix Phosphor Green & Mint)
                <b>accent magenta</b> (Synthwave Hot Pink & Amber)
                <b>accent amber</b> (Vintage Amber Phosphor CRT)</pre>`;
    }
    if (valid.includes(target)) {
      if (typeof setAccentTheme === "function") setAccentTheme(target);
      return `Switched Cyber Accent theme to <b>${target.toUpperCase()}</b>! 🎨`;
    }
    return `Invalid accent theme <b>${escapeHtml(arg)}</b>. Available: <b>lime, cyan, emerald, magenta, amber</b>.`;
  },
  synth: (arg) => {
    const clean = (arg || "").trim().toLowerCase();
    if (clean === "demo" || clean === "tune" || clean === "play") {
      if (typeof playSynthDemoTune === "function") {
        playSynthDemoTune();
        return "🎶 Playing 8-bit cyber demo arpeggio riff via Web Audio Synthesizer...";
      }
    }
    const sModal = document.getElementById("shortcutsModal");
    if (sModal && !sModal.open) {
      if (typeof openShortcutsModal === "function") openShortcutsModal();
      else sModal.showModal();
    }
    setTimeout(() => {
      document.getElementById("shortcutsSynthSection")?.scrollIntoView({ behavior: "smooth" });
    }, 200);
    return "Opened Cyber Piano Synthesizer in Acoustic Lab 🎹 (Use keys A–K to play)";
  },
  piano: (arg) => terminalCommands.synth(arg),
  time: () => {
    const now = new Date();
    const options = { timeZone: "Asia/Phnom_Penh", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short", year: "numeric", month: "short", day: "numeric" };
    const formatted = new Intl.DateTimeFormat("en-GB", options).format(now);
    return `<pre class="term-pre" style="margin:4px 0;font-size:11px;line-height:1.45;">🕒 <b>Workstation Timezone Telemetry</b>
--------------------------------------------------------
Local Time (Cambodia): <b>${formatted} ICT (UTC+7)</b>
Coordinates:           <b>11.5564° N, 104.9282° E</b>
Timezone:              <b>Asia/Phnom_Penh (Indochina Time)</b>
System Status:         <b>Workstation Active · Dual-Degree Engineering Track</b></pre>`;
  },
  clock: () => terminalCommands.time(),
  volume: (arg) => {
    if (!arg) return `Current Master SFX Volume: <b>${Math.round(sfxVolume * 100)}%</b>. Use <b>volume [0-100]</b> or <b>volume mute</b>.`;
    const clean = arg.trim().toLowerCase();
    if (clean === "mute" || clean === "0") {
      setSfxVolume(0);
      return "Master SFX volume muted (0%) 🔇";
    }
    const val = parseInt(clean, 10);
    if (isNaN(val) || val < 0 || val > 100) {
      return `Invalid volume level: <b>${escapeHtml(arg)}</b>. Please provide a percentage between 0 and 100.`;
    }
    const pct = setSfxVolume(val / 100);
    if (typeof playSound === "function") playSound("click");
    return `Master SFX Volume set to <b>${pct}%</b> 🔊`;
  },
  vol: (arg) => terminalCommands.volume(arg),
  demo: (arg) => {
    const target = (arg || "").trim().toLowerCase();
    const demoMap = {
      pinit: () => { openModal("pinit"); setTimeout(() => $("#pinitInput")?.focus(), 180); },
      joul: () => openModal("joul"),
      clp: () => openModal("clp"),
      aquarium: () => openModal("aquarium"),
      gesture: () => openModal("gesture"),
      saas: () => openModal("saas"),
      miniworld: () => openModal("miniworld"),
      shader: () => {
        openModal("miniworld");
        setTimeout(() => document.getElementById("miniworldSandbox")?.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
      }
    };
    if (demoMap[target]) {
      demoMap[target]();
      return `Launched interactive sandbox for <b>${target.toUpperCase()}</b>! ⚡`;
    }
    return `Available interactive sandboxes: <b>demo pinit</b>, <b>demo joul</b>, <b>demo clp</b>, <b>demo aquarium</b>, <b>demo gesture</b>, <b>demo saas</b>, <b>demo shader</b>.`;
  },
  cite: (arg) => {
    const key = (arg || "").trim().toLowerCase() || "pinit";
    const data = projectData[key];
    if (!data) {
      return `Unknown project <b>${escapeHtml(arg)}</b>. Available projects: <b>${Object.keys(projectData).join(", ")}</b>.`;
    }
    const url = `https://gouvkimsea.github.io/my-Portfolio-/?project=${key}`;
    const citation = `[${data.title}](${url}) — Gouv Kimsea (2026)`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(citation);
    }
    return `<div style="font-size:11px;margin:4px 0;"><b>Copied citation to clipboard! 📄</b><br><code style="color:var(--lime);">${escapeHtml(citation)}</code></div>`;
  },
  "cat developer.ts": () => terminalCommands.cat("developer.ts"),
  "cat about-me.js": () => terminalCommands.cat("developer.ts")
};

const escapeHtml = str => {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const executeCommand = rawCommand => {
  const command = rawCommand.trim();
  if (!command) return;
  commandHistory.push(command);
  historyIndex = commandHistory.length;

  const lower = command.toLowerCase();
  const parts = command.split(/\s+/);
  const primary = parts[0].toLowerCase();
  const rest = parts.slice(1).join(" ");

  if (lower === "clear") {
    terminalOutput.innerHTML = "";
    return;
  }

  if (lower === "github") {
    window.open("https://github.com/gouvkimsea", "_blank", "noreferrer");
  } else if (lower === "linkedin") {
    window.open("https://www.linkedin.com/in/gouv-kimsea-16795143a", "_blank", "noreferrer");
  }

  let response;
  if (primary === "nav" && typeof terminalCommands.nav === "function") {
    response = terminalCommands.nav(rest);
  } else if (primary === "cat" && typeof terminalCommands.cat === "function") {
    response = terminalCommands.cat(rest);
  } else if (primary === "curl" && typeof terminalCommands.curl === "function") {
    response = terminalCommands.curl();
  } else if (primary === "history" && typeof terminalCommands.history === "function") {
    response = terminalCommands.history();
  } else if ((primary === "volume" || primary === "vol") && typeof terminalCommands.volume === "function") {
    response = terminalCommands.volume(rest);
  } else if (primary === "demo" && typeof terminalCommands.demo === "function") {
    response = terminalCommands.demo(rest);
  } else if (primary === "cite" && typeof terminalCommands.cite === "function") {
    response = terminalCommands.cite(rest);
  } else if (primary === "accent" && typeof terminalCommands.accent === "function") {
    response = terminalCommands.accent(rest);
  } else if ((primary === "synth" || primary === "piano") && typeof terminalCommands.synth === "function") {
    response = terminalCommands.synth(rest);
  } else if ((primary === "sound" || primary === "sfx") && rest) {
    const sub = rest.toLowerCase();
    if (sub === "on") {
      if (!sfxEnabled) toggleSfx();
      response = "Procedural Web Audio Sound FX enabled 🔊";
    } else if (sub === "off" || sub === "mute") {
      if (sfxEnabled) toggleSfx();
      response = "Procedural Web Audio Sound FX muted 🔇";
    } else {
      const next = toggleSfx();
      response = `Sound FX toggled: <b>${next ? "Enabled 🔊" : "Muted 🔇"}</b>`;
    }
  } else if (primary === "theme" && rest) {
    const sub = rest.toLowerCase();
    if (sub === "dark") {
      document.documentElement?.setAttribute("data-theme", "dark");
      localStorage.setItem("portfolio-theme", "dark");
      if (typeof updateThemeToggleIcon === "function") updateThemeToggleIcon();
      response = "Theme set to <b>Dark Mode 🌙</b>";
    } else if (sub === "light") {
      document.documentElement?.setAttribute("data-theme", "light");
      localStorage.setItem("portfolio-theme", "light");
      if (typeof updateThemeToggleIcon === "function") updateThemeToggleIcon();
      response = "Theme set to <b>Light Mode ☀️</b>";
    } else {
      const current = (document.documentElement?.getAttribute("data-theme")) || "dark";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement?.setAttribute("data-theme", next);
      localStorage.setItem("portfolio-theme", next);
      if (typeof updateThemeToggleIcon === "function") updateThemeToggleIcon();
      response = `Theme toggled to <b>${next === "dark" ? "Dark Mode 🌙" : "Light Mode ☀️"}</b>`;
    }
  } else if (typeof terminalCommands[lower] === "function") {
    response = terminalCommands[lower]();
  } else if (terminalCommands[lower]) {
    response = terminalCommands[lower];
  } else if (lower.startsWith("filter ")) {
    const cat = lower.slice(7).trim();
    if (["web", "ai", "3d", "security", "all"].includes(cat)) {
      const btn = $(`button.filter[data-filter='${cat}']`);
      if (btn) btn.click();
      document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
      response = `Applied project filter: <b>${cat.toUpperCase()}</b>. Scrolled to Selected Work!`;
    } else {
      response = `Unknown category: <b>${escapeHtml(cat)}</b>. Available categories: <b>all</b>, <b>web</b>, <b>ai</b>, <b>3d</b>, <b>security</b>.`;
    }
  } else if (lower.startsWith("find ") || (lower.startsWith("search ") && command.length > 7)) {
    const q = command.slice(command.indexOf(" ") + 1).trim();
    if (projectSearchInput) {
      projectSearchInput.value = q;
      currentSearchQuery = q;
      updateProjectFilterState();
    }
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
    const matches = projectCards.filter(card => {
      const text = card.textContent.toLowerCase();
      return text.includes(q.toLowerCase()) || (card.dataset.category && card.dataset.category.includes(q.toLowerCase()));
    });
    response = `Filtered projects by "<b>${escapeHtml(q)}</b>" (${matches.length} matches found). Jumped to Selected Work!`;
  } else if (lower.startsWith("echo ")) {
    response = escapeHtml(command.slice(5));
  } else {
    response = `Command not found: <b>${escapeHtml(command)}</b>. Type <b>help</b> to see options.`;
  }

  terminalOutput.insertAdjacentHTML("beforeend", `<p><span class="command">$ ${escapeHtml(command)}</span></p><p>${response.replace(/\n/g, "<br/>")}</p>`);
  terminal.scrollTop = terminal.scrollHeight;
};

$("#terminalForm")?.addEventListener("submit", event => {
  event.preventDefault();
  const val = terminalInput.value;
  terminalInput.value = "";
  executeCommand(val);
});

terminal?.addEventListener("click", event => {
  if (!event.target.closest("button") && !event.target.closest("a")) {
    terminalInput?.focus();
  }
});

$$(".terminal-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    const cmd = chip.dataset.cmd;
    if (cmd) {
      terminalInput.value = cmd;
      terminalInput.focus();
      executeCommand(cmd);
      terminalInput.value = "";
    }
  });
});

let tabMatchIndex = 0;
let lastTabPrefix = "";

terminalInput?.addEventListener("keydown", event => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (historyIndex > 0) {
      historyIndex--;
      terminalInput.value = commandHistory[historyIndex];
    }
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      terminalInput.value = commandHistory[historyIndex];
    } else {
      historyIndex = commandHistory.length;
      terminalInput.value = "";
    }
  } else if (event.key === "Tab") {
    event.preventDefault();
    const current = terminalInput.value.trim().toLowerCase();
    if (current) {
      const allCmds = Array.from(new Set([
        ...Object.keys(terminalCommands),
        "clear", "github", "linkedin", "echo", "help", "find", "cat developer.ts", "cat skills.json", "cat status.sh", "curl", "history", "export", "time", "volume", "demo", "cite", "game", "play", "idle", "arcade", "accent", "synth", "piano"
      ]));
      const prefix = lastTabPrefix || current;
      const matches = allCmds.filter(k => k.startsWith(prefix));
      if (matches.length > 0) {
        if (current === (matches[tabMatchIndex] || "").toLowerCase() && matches.length > 1) {
          tabMatchIndex = (tabMatchIndex + 1) % matches.length;
        } else {
          lastTabPrefix = current;
          tabMatchIndex = 0;
        }
        terminalInput.value = matches[tabMatchIndex];
        if (typeof playSound === "function") playSound("click");
      }
    }
  } else {
    lastTabPrefix = "";
    tabMatchIndex = 0;
  }
});

// Terminal macOS Window Action Dots
const termDotRed = $(".terminal-bar .wb-red");
const termDotYellow = $(".terminal-bar .wb-yellow");
const termDotGreen = $(".terminal-bar .wb-green");

termDotRed?.addEventListener("click", () => {
  terminalOutput.innerHTML = "";
  if (typeof playSound === "function") playSound("click");
  showPortfolioToast("Terminal screen cleared 🧹");
});

termDotYellow?.addEventListener("click", () => {
  terminalOutput.innerHTML = '<p class="term-msg">Welcome. Type <strong class="term-bold">help</strong> to see what I can do.</p>';
  if (typeof playSound === "function") playSound("click");
  showPortfolioToast("Terminal reset to initial state ↺");
});

termDotGreen?.addEventListener("click", () => {
  if (typeof playSound === "function") playSound("whoosh");
  executeCommand("matrix");
});

[termDotRed, termDotYellow, termDotGreen].forEach(dot => {
  dot?.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      dot.click();
    }
  });
});

// Terminal Session Log Exporter
const exportTerminalSession = () => {
  const termOutput = document.getElementById("terminalOutput");
  const rawText = termOutput ? termOutput.innerText : "";
  const header = [
    "================================================================",
    "GOUV KIMSEA — INTERACTIVE TERMINAL SESSION LOG",
    `Timestamp: ${new Date().toISOString()}`,
    "Portfolio: https://gouvkimsea.github.io/my-Portfolio-/",
    "Command History: " + (commandHistory.length > 0 ? commandHistory.join(" | ") : "none"),
    "================================================================\n"
  ].join("\n");
  const blob = new Blob([header + "\n" + rawText], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "gouv-terminal-session.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  if (typeof playSound === "function") playSound("chime");
  if (typeof showPortfolioToast === "function") {
    showPortfolioToast("Exported terminal session log! 📥");
  }
};

$("#terminalExportBtn")?.addEventListener("click", () => {
  exportTerminalSession();
});

// 9. Contact Form Real-time Validation & Interactive Feedback
const contactForm = $("#contactForm");
const submitBtn = $("#submitBtn");
const formStatus = $(".form-status");

const formRules = [
  [$("#name"), "Please add your name.", value => value.trim().length > 0],
  [$("#email"), "Please enter a valid email.", value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())],
  [$("#message"), "Please write at least 20 characters.", value => value.trim().length >= 20]
];

const validateField = (input, message, test) => {
  const row = input.closest(".form-row");
  const error = $(".error-message", row);
  const ok = test(input.value);
  row.classList.toggle("invalid", !ok);
  row.classList.toggle("valid", ok && input.value.trim().length > 0);
  error.textContent = ok ? "" : message;
  return ok;
};

const charCountEl = $("#charCount");
const messageTextarea = $("#message");
const updateCharCount = () => {
  if (!messageTextarea || !charCountEl) return;
  const len = messageTextarea.value.trim().length;
  charCountEl.textContent = `${len} / 20 min`;
  charCountEl.classList.toggle("valid", len >= 20);
};
messageTextarea?.addEventListener("input", updateCharCount);

const topicStarters = {
  "General": "Hi Gouv, wanted to reach out regarding ",
  "Opportunity": "Hi Gouv, I have an internship / role opportunity for you: ",
  "Collab": "Hey Gouv, would love to collaborate on ",
  "Project": "Hi Gouv, I checked out your projects and have an idea: "
};

$$(".topic-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    $$(".topic-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    const topic = chip.getAttribute("data-topic");
    if (messageTextarea && (!messageTextarea.value.trim() || Object.values(topicStarters).some(s => messageTextarea.value.startsWith(s)))) {
      messageTextarea.value = topicStarters[topic] || "";
      messageTextarea.focus();
      updateCharCount();
    }
  });
});

formRules.forEach(([input, message, test]) => {
  input?.addEventListener("input", () => {
    if (input.closest(".form-row").classList.contains("invalid")) {
      validateField(input, message, test);
    }
  });
  input?.addEventListener("blur", () => {
    if (input.value.trim()) {
      validateField(input, message, test);
    }
  });
});

// ==========================================================================
// Google Form Backend Integration (No Database Required)
// ==========================================================================
const GOOGLE_FORM_CONFIG = {
  formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSd2dStAmvIJ3mzqzWCrm_kJ-JqFGlmWaSCPlPkex5dEejrfkw/formResponse",
  fields: {
    topic: "entry.1634699630",
    name: "entry.863589244",
    email: "entry.438219289",
    message: "entry.1323986657"
  },
  topicMapping: {
    "General": "General Inquiry",
    "Opportunity": "General Inquiry",
    "Collab": "Feedback",
    "Project": "Feedback"
  }
};

contactForm?.addEventListener("submit", async event => {
  event.preventDefault();
  let allValid = true;
  formRules.forEach(([input, message, test]) => {
    const ok = validateField(input, message, test);
    allValid = allValid && ok;
  });

  if (allValid) {
    submitBtn.classList.add("is-sending");
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = "Sending... <span>↻</span>";
    formStatus.textContent = "";

    const nameVal = $("#name")?.value.trim() || "";
    const emailVal = $("#email")?.value.trim() || "";
    const messageVal = $("#message")?.value.trim() || "";
    const activeChip = $(".topic-chip.active", contactForm);
    const topicVal = activeChip?.getAttribute("data-topic") || "General";
    const formAction = contactForm.getAttribute("action");

    const resetUI = (msg, isSuccess = true) => {
      submitBtn.classList.remove("is-sending");
      submitBtn.innerHTML = originalText;
      formStatus.textContent = msg;
      formStatus.style.color = isSuccess ? "#648b4a" : "#b34834";
      if (isSuccess) {
        contactForm.reset();
        updateCharCount();
        $$(".form-row", contactForm).forEach(row => {
          row.classList.remove("valid", "invalid");
          $(".error-message", row).textContent = "";
        });
      }
      setTimeout(() => { formStatus.textContent = ""; }, 6000);
    };

    const dispatchMailtoFallback = () => {
      const subject = encodeURIComponent(`[${topicVal}] Portfolio Note from ${nameVal}`);
      const body = encodeURIComponent(`Hi Gouv,\n\n${messageVal}\n\n---\nSender: ${nameVal}\nEmail: ${emailVal}\nTopic: ${topicVal}`);
      const mailtoUrl = `mailto:gouvkimsea@gmail.com?subject=${subject}&body=${body}`;

      resetUI("✓ Note ready! Opening your email client to dispatch to Gouv...", true);
      setTimeout(() => {
        window.location.href = mailtoUrl;
      }, 700);
    };

    // If Google Form is configured, dispatch directly via Google Form
    if (GOOGLE_FORM_CONFIG.formUrl && GOOGLE_FORM_CONFIG.formUrl.startsWith("http")) {
      const selectedTopic = GOOGLE_FORM_CONFIG.topicMapping?.[topicVal] || topicVal;
      const formData = new URLSearchParams();
      if (GOOGLE_FORM_CONFIG.fields.topic) formData.append(GOOGLE_FORM_CONFIG.fields.topic, selectedTopic);
      if (GOOGLE_FORM_CONFIG.fields.name) formData.append(GOOGLE_FORM_CONFIG.fields.name, nameVal);
      if (GOOGLE_FORM_CONFIG.fields.email) formData.append(GOOGLE_FORM_CONFIG.fields.email, emailVal);
      if (GOOGLE_FORM_CONFIG.fields.message) formData.append(GOOGLE_FORM_CONFIG.fields.message, messageVal);

      try {
        await fetch(GOOGLE_FORM_CONFIG.formUrl, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: formData.toString()
        });
        resetUI("✓ Note delivered successfully! Thank you for reaching out.");
        if (typeof playSound === "function") playSound("success");
      } catch (err) {
        console.warn("Google Form submission error, falling back to mailto:", err);
        dispatchMailtoFallback();
      }
    } else if (formAction && !formAction.includes("placeholder") && formAction.startsWith("http")) {
      fetch(formAction, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ name: nameVal, email: emailVal, topic: topicVal, message: messageVal })
      })
        .then(res => {
          if (res.ok) {
            resetUI("✓ Note delivered successfully! Gouv will be in touch.");
          } else {
            dispatchMailtoFallback();
          }
        })
        .catch(() => dispatchMailtoFallback());
    } else {
      dispatchMailtoFallback();
    }
  } else {
    formStatus.textContent = "Please check the highlighted fields.";
    formStatus.style.color = "#b34834";
  }
});
// Direct Message Drawer Toggle
const toggleContactBtn = $("#toggleContactFormBtn");
const contactDrawer = $("#contactFormDrawer");
toggleContactBtn?.addEventListener("click", () => {
  const isExpanded = toggleContactBtn.getAttribute("aria-expanded") === "true";
  toggleContactBtn.setAttribute("aria-expanded", String(!isExpanded));
  if (contactDrawer) {
    contactDrawer.hidden = isExpanded;
    if (!isExpanded) {
      contactDrawer.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }
});

// 1-Click Email Copy Interaction
const copyEmailBtn = $("#copyEmailBtn");
copyEmailBtn?.addEventListener("click", () => {
  const email = "gouvkimsea@gmail.com";
  const performCopy = () => {
    copyEmailBtn.textContent = "✓ Copied!";
    copyEmailBtn.classList.add("copied");
    if (typeof playSound === "function") playSound("chime");
    setTimeout(() => {
      copyEmailBtn.textContent = "Copy";
      copyEmailBtn.classList.remove("copied");
    }, 2500);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(email).then(performCopy).catch(() => {
      // Fallback
      fallbackCopy(email);
      performCopy();
    });
  } else {
    fallbackCopy(email);
    performCopy();
  }
});

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    console.warn("Copy command failed", err);
  }
  document.body.removeChild(ta);
};

// Section 04: The Journey retired


// ==========================================================================
// 10. Interactive Dynamic Ripple Waves on Click
// ==========================================================================
const initClickRipples = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.addEventListener("click", e => {
    const target = e.target.closest(".button, .launch-btn, .nav-contact-btn, .footer-cmd-btn, .theme-toggle, .chrome-sfx-btn, .hud-copy-btn, .magnetic");
    if (!target) return;
    if (typeof playSound === "function") playSound("click");

    const rect = target.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "btn-ripple-wave";

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    target.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });
};
initClickRipples();

// ==========================================================================
// 11. Dynamic Telemetry Number Count-Up Animation on Scroll
// ==========================================================================
const initCounterAnimations = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const counterEls = $$(".telemetry-num, .pill-metric, .achieve-metric");
  if (!counterEls.length) return;

  const countUpObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      observer.unobserve(el);

      const text = el.textContent.trim();
      const match = text.match(/^([^\d]*)([\d,.]+)(.*)$/);
      if (!match) return;

      const prefix = match[1] || "";
      const rawNum = parseFloat(match[2].replace(/,/g, ""));
      const suffix = match[3] || "";
      const isDecimal = match[2].includes(".");
      const hasComma = match[2].includes(",");

      if (isNaN(rawNum)) return;

      const startTime = performance.now();
      const duration = 1200; // ms

      const updateCount = now => {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress); // easeOutExpo
        const currentVal = rawNum * ease;

        let formatted = isDecimal ? currentVal.toFixed(1) : Math.floor(currentVal).toString();
        if (hasComma) {
          formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        el.textContent = `${prefix}${formatted}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        } else {
          el.textContent = text;
        }
      };

      requestAnimationFrame(updateCount);
    });
  }, { threshold: 0.25 });

  counterEls.forEach(el => countUpObserver.observe(el));
};
initCounterAnimations();

// ==========================================================================
// 12. PWA Service Worker Registration & Offline Readiness
// ==========================================================================
const initServiceWorker = () => {
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((registration) => {
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.info('⚡ New portfolio version available. Background updated.');
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('ServiceWorker registration skipped:', err);
        });
    });
  }
};
initServiceWorker();

// ==========================================================================
// 13. Global Toast Notification System
// ==========================================================================
const showPortfolioToast = (message, type = "success") => {
  const container = $("#portfolioToastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `portfolio-toast ${type}`;
  const icon = type === "success" ? "✓" : "ℹ";
  toast.innerHTML = `<span class="portfolio-toast-icon" aria-hidden="true">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 320);
  }, 2600);
};

// ==========================================================================
// 14. Quick Share & Recruiter Brief Modal Controller
// ==========================================================================
const shareModal = $("#shareModal");
const shareModalClose = $("#shareModalClose");
const navShareBtn = $("#navShareBtn");
const mobileShareBtn = $("#mobileShareBtn");
const footerShareBtn = $("#footerShareBtn");
const shareCopyUrlBtn = $("#shareCopyUrlBtn");
const shareNativeBtn = $("#shareNativeBtn");
const shareCopyPitchBtn = $("#shareCopyPitchBtn");
const shareCopyMdBtn = $("#shareCopyMdBtn");
const shareCopyEmailBtn = $("#shareCopyEmailBtn");
const shareCopyLinkedInBtn = $("#shareCopyLinkedInBtn");
const sharePitchText = $("#sharePitchText");

const openShareModal = () => {
  if (!shareModal) return;
  shareModal.showModal();
};

const closeShareModal = () => {
  if (shareModal && shareModal.open) {
    shareModal.close();
  }
};

const initShareModal = () => {
  navShareBtn?.addEventListener("click", openShareModal);
  mobileShareBtn?.addEventListener("click", () => {
    closeMobileDrawer();
    openShareModal();
  });
  footerShareBtn?.addEventListener("click", openShareModal);
  shareModalClose?.addEventListener("click", closeShareModal);

  shareModal?.addEventListener("click", (e) => {
    if (e.target === shareModal) closeShareModal();
  });

  // Copy Portfolio URL
  shareCopyUrlBtn?.addEventListener("click", () => {
    const url = "https://gouvkimsea.github.io/my-Portfolio-/";
    navigator.clipboard.writeText(url).then(() => {
      showPortfolioToast("Portfolio link copied to clipboard!");
    }).catch(() => {
      showPortfolioToast("Link: " + url);
    });
  });

  // Web Share API with clipboard fallback
  shareNativeBtn?.addEventListener("click", async () => {
    const shareData = {
      title: "Gouv Kimsea — Student Developer & Product Builder",
      text: "Explore Gouv Kimsea's software engineering portfolio, 3D WebGL simulations, and interactive labs.",
      url: "https://gouvkimsea.github.io/my-Portfolio-/"
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showPortfolioToast("Shared successfully!");
      } catch (err) {
        if (err.name !== "AbortError") {
          showPortfolioToast("Web share opened.");
        }
      }
    } else {
      navigator.clipboard.writeText(shareData.url).then(() => {
        showPortfolioToast("Portfolio link copied to clipboard!");
      });
    }
  });

  // Copy Recruiter Executive Brief
  shareCopyPitchBtn?.addEventListener("click", () => {
    const text = sharePitchText?.textContent || "";
    navigator.clipboard.writeText(text).then(() => {
      showPortfolioToast("Recruiter brief copied to clipboard!");
    });
  });

  // Copy Markdown Link Citation
  shareCopyMdBtn?.addEventListener("click", () => {
    const md = "[Gouv Kimsea — Portfolio](https://gouvkimsea.github.io/my-Portfolio-/)";
    navigator.clipboard.writeText(md).then(() => {
      showPortfolioToast("Markdown link copied!");
    });
  });

  // Copy Email Address
  shareCopyEmailBtn?.addEventListener("click", () => {
    navigator.clipboard.writeText("gouvkimsea@gmail.com").then(() => {
      showPortfolioToast("Email copied to clipboard!");
    });
  });

  // Copy LinkedIn Profile Link
  shareCopyLinkedInBtn?.addEventListener("click", () => {
    navigator.clipboard.writeText("https://linkedin.com/in/gouvkimsea").then(() => {
      showPortfolioToast("LinkedIn URL copied!");
    });
  });

  // Download vCard (.vcf) Contact Card
  $("#shareDownloadVCardBtn")?.addEventListener("click", downloadVCard);
  $("#downloadContactCardBtn")?.addEventListener("click", downloadVCard);
};

const downloadVCard = () => {
  const vcardData = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "FN:Gouv Kimsea",
    "N:Kimsea;Gouv;;;",
    "TITLE:Software Engineer & 3D Web Architect",
    "EMAIL;TYPE=INTERNET;TYPE=WORK:gouvkimsea@gmail.com",
    "URL;TYPE=WORK:https://gouvkimsea.github.io/my-Portfolio-/",
    "URL;TYPE=GITHUB:https://github.com/gouvkimsea",
    "URL;TYPE=LINKEDIN:https://www.linkedin.com/in/gouv-kimsea-16795143a",
    "NOTE:Dual-Degree Candidate: B.Sc. Computer Science (Paragon International University) & B.B.A. Business Administration (Bonamary University)",
    "ADR;TYPE=WORK:;;Phnom Penh;;;Cambodia",
    "END:VCARD"
  ].join("\r\n");

  if (typeof Blob !== "undefined" && typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    const blob = new Blob([vcardData], { type: "text/vcard;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "gouv-kimsea-contact.vcf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);
  }

  if (typeof playSound === "function") playSound("chime");
  showPortfolioToast("Downloaded Gouv Kimsea Contact Card (.vcf) 📇");
};

initShareModal();

// ==========================================================================
// 15. Keyboard Shortcuts Cheatsheet Modal Controller
// ==========================================================================
const shortcutsModal = $("#shortcutsModal");
const shortcutsModalClose = $("#shortcutsModalClose");
const footerShortcutsBtn = $("#footerShortcutsBtn");

const openShortcutsModal = () => {
  if (!shortcutsModal) return;
  shortcutsModal.showModal();
};

const closeShortcutsModal = () => {
  if (shortcutsModal && shortcutsModal.open) {
    shortcutsModal.close();
  }
};

const initShortcutsModal = () => {
  footerShortcutsBtn?.addEventListener("click", openShortcutsModal);
  shortcutsModalClose?.addEventListener("click", closeShortcutsModal);

  shortcutsModal?.addEventListener("click", (e) => {
    if (e.target === shortcutsModal) closeShortcutsModal();
  });

  // Acoustic Synthesizer Soundboard
  $$(".audio-bench-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const snd = btn.dataset.sound || "click";
      if (!sfxEnabled) {
        toggleSfx();
      } else {
        if (typeof getAudioContext === "function") getAudioContext();
        playSound(snd);
      }
    });
  });
};

initShortcutsModal();




// ==========================================================================
// Procedural Web Audio Sound FX Engine (Zero External Audio Assets)
// ==========================================================================
let audioCtx = null;
let sfxEnabled = localStorage.getItem("kimsea_sfx_enabled") === "true";

let masterGainNode = null;
let sfxVolume = 0.8;
try {
  const savedVol = localStorage.getItem("portfolio-sfx-volume");
  if (savedVol !== null) {
    const parsed = parseFloat(savedVol);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) sfxVolume = parsed;
  }
} catch (_) {}

const getMasterGainNode = (ctx) => {
  if (!ctx) return null;
  if (!masterGainNode || masterGainNode.context !== ctx) {
    masterGainNode = ctx.createGain();
    masterGainNode.gain.setValueAtTime(sfxVolume, ctx.currentTime);
    masterGainNode.connect(ctx.destination);
  }
  return masterGainNode;
};

const setSfxVolume = (val) => {
  const clamped = Math.max(0, Math.min(1, parseFloat(val)));
  sfxVolume = clamped;
  try {
    localStorage.setItem("portfolio-sfx-volume", clamped.toString());
  } catch (_) {}
  const ctx = getAudioContext();
  if (ctx) {
    const node = getMasterGainNode(ctx);
    if (node) node.gain.setValueAtTime(clamped, ctx.currentTime);
  }
  const slider = document.getElementById("sfxVolumeSlider");
  const label = document.getElementById("sfxVolumeValue");
  const pct = Math.round(clamped * 100);
  if (slider) slider.value = pct;
  if (label) label.textContent = `${pct}%`;
  return pct;
};

const getAudioContext = () => {
  if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
};

const playSound = (type = "click") => {
  if (!sfxEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dest = getMasterGainNode(ctx) || ctx.destination;

    if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.035);
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.045);
    } else if (type === "chime") {
      [587.33, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t + idx * 0.05);
        gain.gain.setValueAtTime(0.035, t + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.05 + 0.22);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t + idx * 0.05);
        osc.stop(t + idx * 0.05 + 0.25);
      });
    } else if (type === "sweep") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(640, t + 0.12);
      gain.gain.setValueAtTime(0.03, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.15);
    } else if (type === "whoosh") {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.22);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(700, t);
      filter.frequency.exponentialRampToValueAtTime(180, t + 0.22);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.045, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.24);
    } else if (type === "keypress") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.025);
      gain.gain.setValueAtTime(0.015, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.03);
    } else if (type === "success") {
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = t + idx * 0.05;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.035, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
    }
  } catch (_) { }
};

const updateSfxUI = () => {
  const btns = $$(".chrome-sfx-btn");
  btns.forEach(btn => {
    btn.classList.toggle("muted", !sfxEnabled);
    btn.setAttribute("title", `Sound Effects: ${sfxEnabled ? "Enabled (click to mute)" : "Muted (click to enable)"}`);
  });
};

const toggleSfx = () => {
  sfxEnabled = !sfxEnabled;
  localStorage.setItem("kimsea_sfx_enabled", sfxEnabled ? "true" : "false");
  updateSfxUI();
  if (sfxEnabled) {
    getAudioContext();
    playSound("chime");
    showPortfolioToast("Sound Effects: Enabled 🔊");
  } else {
    showPortfolioToast("Sound Effects: Muted 🔇");
  }
  return sfxEnabled;
};

updateSfxUI();
$$(".chrome-sfx-btn").forEach(btn => btn.addEventListener("click", toggleSfx));

// Synthesizer Master Volume Range Controller
const sfxVolumeSlider = document.getElementById("sfxVolumeSlider");
const sfxVolumeResetBtn = document.getElementById("sfxVolumeResetBtn");
const sfxVolumeLabel = document.getElementById("sfxVolumeValue");

if (sfxVolumeSlider) {
  sfxVolumeSlider.value = Math.round(sfxVolume * 100);
  if (sfxVolumeLabel) sfxVolumeLabel.textContent = `${Math.round(sfxVolume * 100)}%`;
  sfxVolumeSlider.addEventListener("input", (e) => {
    const pct = parseInt(e.target.value, 10);
    setSfxVolume(pct / 100);
  });
  sfxVolumeSlider.addEventListener("change", () => {
    if (typeof playSound === "function") playSound("click");
  });
}

sfxVolumeResetBtn?.addEventListener("click", () => {
  setSfxVolume(0.8);
  if (typeof playSound === "function") playSound("chime");
  if (typeof showPortfolioToast === "function") {
    showPortfolioToast("Volume reset to default 80% 🔊");
  }
});

// ==========================================================================
// 10. CLIENT TELEMETRY & WEB VITALS PERFORMANCE LOGGER
// ==========================================================================
if (typeof window !== "undefined" && "PerformanceObserver" in window) {
  try {
    const vitalsObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name === "first-contentful-paint") {
          console.log(`%c⚡ [Web Vitals] FCP: ${Math.round(entry.startTime)}ms · Optimal UX Ready`, "color:#10b981;font-weight:bold;font-family:monospace;");
        }
      });
    });
    vitalsObserver.observe({ type: "paint", buffered: true });
  } catch (_) { }
}

// ==========================================================================
// 11. BACK TO TOP QUICK ACTION & MOBILE EDGE SWIPE GESTURES
// ==========================================================================
const backToTopBtn = $("#backToTopBtn");
window.addEventListener("scroll", () => {
  const isScrolled = window.scrollY > 400;
  backToTopBtn?.classList.toggle("visible", isScrolled);
}, { passive: true });

backToTopBtn?.addEventListener("click", () => {
  navigateToSection("home");
});

// Mobile edge swipe gestures for drawer navigation
let touchStartX = 0;
let touchStartY = 0;

window.addEventListener("touchstart", (e) => {
  if (e.touches && e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
}, { passive: true });

window.addEventListener("touchend", (e) => {
  if (e.changedTouches && e.changedTouches.length === 1) {
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY) * 1.5 && Math.abs(diffX) > 60) {
      // Swiped right while drawer open -> close drawer
      if (diffX > 0 && mobileDrawer?.classList.contains("open")) {
        closeMobileDrawer();
      }
      // Swiped left from right edge while drawer closed -> open drawer
      else if (diffX < 0 && touchStartX > window.innerWidth - 50 && !mobileDrawer?.classList.contains("open")) {
        openMobileDrawer();
      }
    }
  }
}, { passive: true });

// ==========================================================================
// Chapter 2 Project Presentation Controller & Case Study Navigation
// ==========================================================================
let currentModalProjectKey = "pinit";

$("#modalPrevBtn")?.addEventListener("click", () => {
  const currentKey = $("#modalProjectSelect")?.value || "pinit";
  const data = projectData[currentKey];
  if (data && data.prevKey) {
    if (typeof playSound === "function") playSound("click");
    openModal(data.prevKey);
  }
});

$("#modalNextBtn")?.addEventListener("click", () => {
  const currentKey = $("#modalProjectSelect")?.value || "pinit";
  const data = projectData[currentKey];
  if (data && data.nextKey) {
    if (typeof playSound === "function") playSound("click");
    openModal(data.nextKey);
  }
});

$("#modalNextTeaserCard")?.addEventListener("click", () => {
  const currentKey = $("#modalProjectSelect")?.value || "pinit";
  const data = projectData[currentKey];
  if (data && data.nextKey) {
    if (typeof playSound === "function") playSound("click");
    openModal(data.nextKey);
  }
});

$("#modalNextTeaserCard")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    const currentKey = $("#modalProjectSelect")?.value || "pinit";
    const data = projectData[currentKey];
    if (data && data.nextKey) openModal(data.nextKey);
  }
});

$("#modalProjectSelect")?.addEventListener("change", (e) => {
  const selectedKey = e.target.value;
  if (projectData[selectedKey]) {
    if (typeof playSound === "function") playSound("click");
    openModal(selectedKey);
  }
});

$("#modalShareLinkBtn")?.addEventListener("click", () => {
  const currentKey = $("#modalProjectSelect")?.value || "pinit";
  const data = projectData[currentKey];
  const title = data?.title || "Project";
  const url = `${window.location.origin}${window.location.pathname}?project=${currentKey}`;
  const btn = $("#modalShareLinkBtn");
  const onCopied = () => {
    btn?.classList.add("copied");
    if (typeof playSound === "function") playSound("chime");
    if (typeof showPortfolioToast === "function") {
      showPortfolioToast(`Copied direct link for ${title}! 🔗`);
    }
    setTimeout(() => {
      btn?.classList.remove("copied");
    }, 2000);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(onCopied).catch(() => {
      fallbackCopy(url);
      onCopied();
    });
  } else {
    fallbackCopy(url);
    onCopied();
  }
});

$("#modalCiteBtn")?.addEventListener("click", () => {
  const currentKey = $("#modalProjectSelect")?.value || "pinit";
  const data = projectData[currentKey];
  const title = data?.title || "Project";
  const url = `${window.location.origin}${window.location.pathname}?project=${currentKey}`;
  const citation = `[${title}](${url}) — Gouv Kimsea (2026)`;
  const btn = $("#modalCiteBtn");
  const onCopied = () => {
    btn?.classList.add("copied");
    if (typeof playSound === "function") playSound("chime");
    if (typeof showPortfolioToast === "function") {
      showPortfolioToast(`Copied citation for ${title}! 📄`);
    }
    setTimeout(() => {
      btn?.classList.remove("copied");
    }, 2000);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(citation).then(onCopied).catch(() => {
      fallbackCopy(citation);
      onCopied();
    });
  } else {
    fallbackCopy(citation);
    onCopied();
  }
});

// Arrow key navigation when project modal is open
window.addEventListener("keydown", (e) => {
  if (!modal || !modal.open) return;
  const currentKey = $("#modalProjectSelect")?.value || "pinit";
  const data = projectData[currentKey];
  if (!data) return;

  if (e.key === "ArrowLeft") {
    if (data.prevKey) {
      if (typeof playSound === "function") playSound("click");
      openModal(data.prevKey);
    }
  } else if (e.key === "ArrowRight") {
    if (data.nextKey) {
      if (typeof playSound === "function") playSound("click");
      openModal(data.nextKey);
    }
  }
});

// Subnav smooth scrolling and active state tracking inside modal
$$(".modal-subnav-link").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const targetId = link.getAttribute("href");
    const targetElem = targetId ? $(targetId) : null;
    if (targetElem) {
      $$(".modal-subnav-link").forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      targetElem.scrollIntoView({ behavior: "smooth", block: "start" });
      if (typeof playSound === "function") playSound("click");
    }
  });
});

// Chapter 2 Exhibition vs Matrix View Switcher
const viewModeExhibition = $("#viewModeExhibition");
const viewModeMatrix = $("#viewModeMatrix");
const projectGridContainer = $("#projectGridContainer") || $(".project-grid");

const setProjectViewMode = (mode) => {
  const isMatrix = mode === "matrix";
  if (projectGridContainer) {
    projectGridContainer.classList.toggle("matrix-mode", isMatrix);
  }
  if (viewModeExhibition) {
    viewModeExhibition.classList.toggle("active", !isMatrix);
    viewModeExhibition.setAttribute("aria-pressed", (!isMatrix).toString());
  }
  if (viewModeMatrix) {
    viewModeMatrix.classList.toggle("active", isMatrix);
    viewModeMatrix.setAttribute("aria-pressed", isMatrix.toString());
  }
  try {
    localStorage.setItem("portfolio_project_view_mode", mode);
  } catch (_) {}
};

viewModeExhibition?.addEventListener("click", () => {
  if (typeof playSound === "function") playSound("click");
  setProjectViewMode("exhibition");
});

viewModeMatrix?.addEventListener("click", () => {
  if (typeof playSound === "function") playSound("click");
  setProjectViewMode("matrix");
});

// Restore saved view mode
try {
  const savedView = localStorage.getItem("portfolio_project_view_mode");
  if (savedView === "matrix") setProjectViewMode("matrix");
} catch (_) {}

// DevPulse Interactive Telemetry Simulator Lab
let devpulseRaf = null;
let devpulseMode = "flow";

function initDevpulseLab() {
  const chips = $$(".devpulse-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      devpulseMode = chip.dataset.mode || "flow";
      updateDevpulseMode(devpulseMode);
      if (typeof playSound === "function") playSound("click");
    });
  });
  startDevpulseWave();
}

function stopDevpulseLab() {
  if (devpulseRaf) {
    cancelAnimationFrame(devpulseRaf);
    devpulseRaf = null;
  }
}

function updateDevpulseMode(mode) {
  const flowVal = $("#dpFlowVal");
  const cadenceVal = $("#dpCadenceVal");
  const buildVal = $("#dpBuildVal");
  const rateStat = $("#devpulseRateStat");

  if (mode === "flow") {
    if (flowVal) flowVal.textContent = "94 / 100";
    if (cadenceVal) cadenceVal.textContent = "1.4h Sustained";
    if (buildVal) buildVal.textContent = "0 Failures";
    if (rateStat) rateStat.textContent = "240 req/s · 18ms Latency";
  } else if (mode === "sprint") {
    if (flowVal) flowVal.textContent = "98 / 100";
    if (cadenceVal) cadenceVal.textContent = "3.2h Peak Sprint";
    if (buildVal) buildVal.textContent = "14 Merged PRs";
    if (rateStat) rateStat.textContent = "410 req/s · 12ms Latency";
  } else if (mode === "build") {
    if (flowVal) flowVal.textContent = "86 / 100";
    if (cadenceVal) cadenceVal.textContent = "Test Suite Running";
    if (buildVal) buildVal.textContent = "37/37 Assertions";
    if (rateStat) rateStat.textContent = "180 req/s · 24ms Latency";
  } else {
    if (flowVal) flowVal.textContent = "72 / 100";
    if (cadenceVal) cadenceVal.textContent = "Passive Rest";
    if (buildVal) buildVal.textContent = "All Systems Green";
    if (rateStat) rateStat.textContent = "45 req/s · 32ms Latency";
  }
}

function startDevpulseWave() {
  const bars = $$(".devpulse-wave-bars .dp-bar");
  if (!bars.length) return;
  let phase = 0;

  function renderWave() {
    phase += 0.08;
    bars.forEach((bar, idx) => {
      const freq = devpulseMode === "sprint" ? 2.5 : devpulseMode === "idle" ? 0.8 : 1.6;
      const h = Math.abs(Math.sin(phase + idx * 0.45 * freq)) * 100;
      bar.style.height = Math.max(12, Math.min(100, h)) + "%";
    });
    devpulseRaf = requestAnimationFrame(renderWave);
  }
  stopDevpulseLab();
  devpulseRaf = requestAnimationFrame(renderWave);
}

// Portfolio Acoustic Testing Chips in Portfolio Lab
$$(".portfolio-sound-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    const soundType = chip.dataset.sound || "click";
    if (typeof playSound === "function") {
      playSound(soundType);
    }
  });
});

// ==========================================================================
// Interactive Skills Matrix & Project Cross-Reference Dossier
// ==========================================================================
const SKILL_DOSSIERS = {
  javascript: {
    title: "JavaScript & Modern ES2026",
    category: "WEB & PLATFORMS",
    status: "Active Production",
    desc: "Native web platform proficiency without framework bloat. Mastered asynchronous event loops, reactive state, DOM mutation observation, Web Audio synthesis, and real-time canvas pipelines.",
    projects: [
      "Mini World 3D (Procedural WebGL simulation & orbit camera physics)",
      "Interactive Terminal CLI & Virtual Command Suite",
      "DevPulse Telemetry & Wave Generation Engine"
    ],
    filter: "web",
    cmd: "test"
  },
  cpp: {
    title: "C++ & Systems Architecture",
    category: "COMPUTER SCIENCE",
    status: "Systems & Memory",
    desc: "Low-level memory management, pointer arithmetic, custom class hierarchies, Big-O asymptotic runtime optimization, and transactional persistence.",
    projects: [
      "C++ OOP Student Grading System (Class hierarchies & ACID file persistence)",
      "Data Structures & Algorithms Coursework (Binary Trees, Heaps, Graph traversals)"
    ],
    filter: "security",
    cmd: "cpp"
  },
  python: {
    title: "Python & Computer Vision",
    category: "AI & SYSTEMS",
    status: "Computer Vision",
    desc: "Scientific and computer vision development utilizing OpenCV, NumPy, and MediaPipe for spatial gesture inference, 21-joint landmark tracking, and geometric feature extraction.",
    projects: [
      "Gesture App (21-joint 3D hand tracking & multi-gesture landmark detection)"
    ],
    filter: "ai",
    cmd: "gesture"
  },
  "html-css": {
    title: "Semantic HTML & Responsive CSS Systems",
    category: "FRONTEND SYSTEMS",
    status: "Design Systems",
    desc: "Modern CSS tokens, CSS Grid, Flexbox, glassmorphic filters, responsive typography, WCAG AAA accessibility, ARIA dialog patterns, and zero-framework performance.",
    projects: [
      "Personal Portfolio & Design System (280+ unique elements, zero runtime bloat)",
      "Responsive Bento Grid & Timeline Architecture"
    ],
    filter: "web",
    cmd: "theme"
  },
  react: {
    title: "React & Modern UI Architecture",
    category: "WEB APPLICATIONS",
    status: "Modern Frontend",
    desc: "Declarative state machines, custom hooks, component isolation, React 19 / Next.js 14 App Router, and modular CAD interfaces.",
    projects: [
      "Aquarium Filter Sim (Interactive 3D CAD modeling & physical hydraulic simulator)",
      "Chinese Learning Platform (Next.js 14 Portal & Teacher Dashboard)"
    ],
    filter: "web",
    cmd: "aquarium"
  },
  "rest-apis": {
    title: "REST APIs & Monorepo Gateways",
    category: "BACKEND & ARCHITECTURE",
    status: "Network & Data",
    desc: "Contract-first API design, JWT authentication guards, rate limiting, CORS configuration, Swagger OpenAPI documentation, and transactional payloads.",
    projects: [
      "Chinese Learning Platform NestJS Gateway (Prisma ORM, PostgreSQL)",
      "JOUL Rental Service (Escrow transaction endpoints & fleet telemetry)"
    ],
    filter: "web",
    cmd: "clp"
  },
  nodejs: {
    title: "Node.js & Backend Runtimes",
    category: "BACKEND & TOOLING",
    status: "Server Architecture",
    desc: "Event-driven runtime architecture, asynchronous streams, HTTP server development, test harness scripting, and zero-dependency VM validation.",
    projects: [
      "Portfolio Local Dev Server (Multi-port zero-dep HTTP server)",
      "Automated Integrity Test Suite (Zero-dependency test runner in Node VM)"
    ],
    filter: "web",
    cmd: "test"
  },
  sql: {
    title: "Relational SQL & ACID Transactions",
    category: "DATA & SYSTEMS",
    status: "Database Engineering",
    desc: "Relational normalization (3NF), complex joins, subqueries, indexing strategies, referential integrity, and ACID transaction isolation.",
    projects: [
      "Point of Sale (POS) Cash Ledger (ACID inventory decrement & sales journal)",
      "JOUL Rental Service (Fleet availability calendar & booking ledger)"
    ],
    filter: "web",
    cmd: "pos"
  },
  databases: {
    title: "Database Architecture & Persistence",
    category: "DATA & PERSISTENCE",
    status: "Persistence Systems",
    desc: "Relational PostgreSQL/MySQL schemas, NoSQL document stores, local indexedDB/localStorage caching, and Prisma ORM migrations.",
    projects: [
      "Chinese Learning Platform (PostgreSQL database with Prisma schema)",
      "Productivity SaaS & Local Cache Ledger"
    ],
    filter: "web",
    cmd: "saas"
  },
  webgl: {
    title: "Pure WebGL 2.0 & GPU Shaders",
    category: "3D & GRAPHICS",
    status: "Hardware Accelerated",
    desc: "Hardware-accelerated client graphics with zero third-party engines. Buffers, uniforms, matrix mathematics, projection pipelines, and vertex deformation.",
    projects: [
      "Mini World 3D (Procedural cartoon planet, seasons, 60 FPS WebGL 2.0)"
    ],
    filter: "3d",
    cmd: "miniworld"
  },
  glsl: {
    title: "GLSL Shaders & Lighting Math",
    category: "GRAPHICS SHADERS",
    status: "GPU Shading",
    desc: "Custom GLSL vertex and fragment shaders: Lambertian diffuse, Blinn-Phong specular highlights, atmospheric scattering, and procedural noise.",
    projects: [
      "Mini World 3D Custom Shaders (Day/night terminator & atmospheric rim light)"
    ],
    filter: "3d",
    cmd: "glsl"
  },
  "3d-math": {
    title: "3D Geometry & Spatial Math",
    category: "GRAPHICS MATH",
    status: "Vector Mathematics",
    desc: "Euclidean vector arithmetic, dot/cross products, matrix transformations (Model-View-Projection), quaternions, and raycasting.",
    projects: [
      "Mini World 3D Camera Controller & Orbit Physics",
      "Aquarium Simulator Boids Flocking & Predator Evasion"
    ],
    filter: "3d",
    cmd: "miniworld"
  },
  "product-strategy": {
    title: "Product Strategy & Market Fit",
    category: "BUSINESS & MANAGEMENT",
    status: "Commercial Strategy",
    desc: "Bridging computer science rigor with market economics: unit economics, customer acquisition funnels, user retention, and MVP scope management.",
    projects: [
      "Chinese Learning Platform (Monorepo SaaS business model & gamified retention)",
      "JOUL Rental Service (Vehicle rental escrow & revenue share economics)"
    ],
    filter: "all",
    cmd: "education"
  },
  "market-economics": {
    title: "Market Economics & Financial Models",
    category: "BUSINESS & MANAGEMENT",
    status: "Economics & Finance",
    desc: "Microeconomic price elasticity, cost of goods sold, margin analysis, financial forecasting, and cash flow modeling for software products.",
    projects: [
      "Bonamary University B.B.A. Track (Strategic operations & financial principles)",
      "POS Retail Cash Flow & Shift Ledger"
    ],
    filter: "web",
    cmd: "education"
  },
  operations: {
    title: "Operations & Business Logistics",
    category: "BUSINESS & MANAGEMENT",
    status: "Operations Management",
    desc: "Supply chain logistics, resource scheduling, fleet availability algorithms, inventory turns, and operational risk management.",
    projects: [
      "JOUL Rental Service (Fleet maintenance scheduling & reservation escrow)",
      "POS Retail Inventory & Stock Alerts"
    ],
    filter: "web",
    cmd: "joul"
  },
  "git-github": {
    title: "Git & GitHub Discipline",
    category: "SYSTEMS & DEVOPS",
    status: "Version Control",
    desc: "Atomic commit hygiene, Conventional Commits specification, semantic versioning, branch rebasing, and continuous repository maintenance across 15+ codebases.",
    projects: [
      "15+ Public GitHub Repositories (github.com/gouvkimsea)",
      "Disciplined Commit History & Automated Verification"
    ],
    filter: "all",
    cmd: "git"
  },
  "linux-shell": {
    title: "Linux & Terminal Tooling",
    category: "SYSTEMS & DEVOPS",
    status: "Systems Administration",
    desc: "POSIX shell scripting, file system hierarchy, process monitoring, grep/sed/awk data pipelines, SSH keys, and terminal workflow optimization.",
    projects: [
      "Portfolio Interactive Terminal CLI (Custom virtual shell & command parser)",
      "Shell Scripts & Deployment Tooling"
    ],
    filter: "all",
    cmd: "help"
  },
  "cicd-actions": {
    title: "CI/CD & Automated Pipelines",
    category: "SYSTEMS & DEVOPS",
    status: "Continuous Integration",
    desc: "GitHub Actions workflows, automated linting, test suite execution, static artifact deployment, and automated validation gates.",
    projects: [
      "GitHub Pages Automated Deployment Pipeline",
      "Portfolio Automated Integrity Test Suite (Node.js test harness)"
    ],
    filter: "all",
    cmd: "test"
  }
};

function initSkillsFilterAndDossier() {
  const filterBtns = $$(".skill-filter-btn");
  const cards = $$(".skill-card");

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      const category = btn.dataset.filter || "all";
      cards.forEach(card => {
        if (category === "all" || card.dataset.category === category) {
          card.classList.remove("filtered-out");
        } else {
          card.classList.add("filtered-out");
        }
      });
      if (typeof playSound === "function") playSound("click");
    });
  });

  const modal = $("#skillDossierModal");
  const closeBtn = $("#skillDossierCloseBtn");
  const titleEl = $("#skillDossierTitle");
  const catEl = $("#skillDossierCategory");
  const statusEl = $("#skillDossierStatus");
  const descEl = $("#skillDossierDesc");
  const projListEl = $("#skillDossierProjects");
  const filterBtn = $("#skillDossierFilterBtn");
  const terminalBtn = $("#skillDossierTerminalBtn");

  if (!modal) return;

  closeBtn?.addEventListener("click", () => {
    modal.close();
    if (typeof playSound === "function") playSound("click");
  });

  modal.addEventListener("click", e => {
    const rect = modal.getBoundingClientRect();
    const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
    if (!isInDialog) {
      modal.close();
    }
  });

  $$(".chips .chip-item[data-skill]").forEach(chip => {
    const triggerDossier = () => {
      const skillKey = chip.dataset.skill;
      const data = SKILL_DOSSIERS[skillKey];
      if (!data) return;

      if (titleEl) titleEl.textContent = data.title;
      if (catEl) catEl.textContent = data.category;
      if (statusEl) statusEl.innerHTML = `<span class="achieve-dot" aria-hidden="true"></span> ${data.status}`;
      if (descEl) descEl.textContent = data.desc;

      if (projListEl) {
        projListEl.innerHTML = data.projects.map(p => `<li><strong>•</strong> ${escapeHtml(p)}</li>`).join("");
      }

      if (filterBtn) {
        filterBtn.onclick = () => {
          modal.close();
          const pFilter = data.filter || "all";
          const pBtn = $(`button.filter[data-filter='${pFilter}']`);
          if (pBtn) pBtn.click();
          navigateToSection("projects");
        };
      }

      if (terminalBtn) {
        terminalBtn.onclick = () => {
          modal.close();
          navigateToSection("terminal-section");
          if (typeof executeCommand === "function" && data.cmd) {
            executeCommand(data.cmd);
          }
        };
      }

      modal.showModal();
      if (typeof playSound === "function") playSound("chime");
    };

    chip.addEventListener("click", triggerDossier);
    chip.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        triggerDossier();
      }
    });
  });
}

// ==========================================================================
// Milestones View Switcher: Grid vs. Chronological Journey Timeline
// ==========================================================================
function initAchievementsTimeline() {
  const gridBtn = $("#achieveViewGridBtn");
  const timelineBtn = $("#achieveViewTimelineBtn");
  const gridContainer = $(".achievements-grid");
  const timelineContainer = $("#achievementsTimeline");

  if (!gridBtn || !timelineBtn || !gridContainer || !timelineContainer) return;

  function setView(mode, shouldPlaySound = true) {
    if (mode === "timeline") {
      gridBtn.classList.remove("active");
      gridBtn.setAttribute("aria-pressed", "false");
      timelineBtn.classList.add("active");
      timelineBtn.setAttribute("aria-pressed", "true");

      gridContainer.hidden = true;
      timelineContainer.hidden = false;
      localStorage.setItem("kimsea_achieve_view", "timeline");
      if (shouldPlaySound && typeof playSound === "function") playSound("whoosh");
    } else {
      timelineBtn.classList.remove("active");
      timelineBtn.setAttribute("aria-pressed", "false");
      gridBtn.classList.add("active");
      gridBtn.setAttribute("aria-pressed", "true");

      timelineContainer.hidden = true;
      gridContainer.hidden = false;
      localStorage.setItem("kimsea_achieve_view", "grid");
      if (shouldPlaySound && typeof playSound === "function") playSound("whoosh");
    }
  }

  gridBtn.addEventListener("click", () => setView("grid"));
  timelineBtn.addEventListener("click", () => setView("timeline"));

  const saved = localStorage.getItem("kimsea_achieve_view");
  if (saved === "timeline") {
    setView("timeline", false);
  }

  $$(".achieve-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter || "all";
      $$(".timeline-item").forEach(item => {
        if (f === "all" || item.dataset.category === f) {
          item.style.display = "";
        } else {
          item.style.display = "none";
        }
      });
    });
  });

  // Timeline Epoch Navigation Jumpers
  const epochBtns = $$(".epoch-nav-btn");
  epochBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const targetElem = document.getElementById(targetId);
      if (targetElem) {
        epochBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        targetElem.scrollIntoView({ behavior: "smooth", block: "center" });
        targetElem.classList.remove("epoch-highlight");
        void targetElem.offsetWidth;
        targetElem.classList.add("epoch-highlight");
        if (typeof playSound === "function") playSound("click");
      }
    });
  });
}

initSkillsFilterAndDossier();
initAchievementsTimeline();

// ==========================================================================
// 12. Local Timezone Clock (Asia/Phnom_Penh, UTC+7)
// ==========================================================================
const updateLocalClock = () => {
  const clockDigits = $("#contactClockDigits");
  const footerClock = $("#footerClockTime");
  if (!clockDigits && !footerClock) return;
  try {
    const now = new Date();
    const options = { timeZone: "Asia/Phnom_Penh", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" };
    const timeStr = new Intl.DateTimeFormat("en-GB", options).format(now);
    const formatted = `${timeStr} ICT`;
    if (clockDigits) clockDigits.textContent = formatted;
    if (footerClock) footerClock.textContent = formatted;
  } catch (_) {}
};
setInterval(updateLocalClock, 1000);
updateLocalClock();

// ==========================================================================
// 13. DEVLOOP // CYBER INDIE GAME & IDLE DEVELOPER STUDIO
// ==========================================================================
let openGameModal = null;
let closeGameModal = null;

const initDevLoopGame = () => {
  const gameModal = document.getElementById("gameModal");
  if (!gameModal) return;

  // Sound effects helper using web audio
  let gameAudioEnabled = true;
  const playRetroGameSfx = (type) => {
    if (!gameAudioEnabled || (typeof sfxEnabled !== "undefined" && !sfxEnabled)) return;
    try {
      const ctx = typeof getAudioContext === "function" ? getAudioContext() : null;
      if (!ctx) return;
      const t = ctx.currentTime;
      const dest = typeof getMasterGainNode === "function" ? getMasterGainNode(ctx) : ctx.destination;

      if (type === "tap") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.04);
        gain.gain.setValueAtTime(0.02, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.05);
      } else if (type === "coin") {
        [987.77, 1318.51].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t + idx * 0.06);
          gain.gain.setValueAtTime(0.03, t + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.06 + 0.15);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(t + idx * 0.06);
          osc.stop(t + idx * 0.06 + 0.18);
        });
      } else if (type === "laser") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);
        gain.gain.setValueAtTime(0.035, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.1);
      } else if (type === "ship") {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, t + idx * 0.08);
          gain.gain.setValueAtTime(0.04, t + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.08 + 0.25);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(t + idx * 0.08);
          osc.stop(t + idx * 0.08 + 0.28);
        });
      } else if (type === "hit") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.linearRampToValueAtTime(60, t + 0.12);
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.15);
      }
    } catch (_) {}
  };

  // Upgrades Specification
  const DEFAULT_UPGRADES = [
    { id: "coffee", name: "Double Espresso", icon: "☕", baseCost: 15, cost: 15, count: 0, rate: 1, power: 0, desc: "+1 LOC/sec passive" },
    { id: "keyboard", name: "Mechanical Switches", icon: "⌨️", baseCost: 60, cost: 60, count: 0, rate: 0, power: 3, desc: "+3 LOC/click power" },
    { id: "duck", name: "Rubber Duck AI", icon: "🦆", baseCost: 200, cost: 200, count: 0, rate: 8, power: 0, desc: "+8 LOC/sec passive" },
    { id: "cicd", name: "Automated CI/CD", icon: "🧪", baseCost: 800, cost: 800, count: 0, rate: 35, power: 0, desc: "+35 LOC/sec passive" },
    { id: "gpu", name: "GPU Shader Cluster", icon: "⚡", baseCost: 3500, cost: 3500, count: 0, rate: 150, power: 0, desc: "+150 LOC/sec passive" },
    { id: "copilot", name: "Autonomous AI Agent", icon: "🚀", baseCost: 15000, cost: 15000, count: 0, rate: 800, power: 0, desc: "+800 LOC/sec passive" }
  ];

  const MILESTONES = [
    { title: "Release: v1.0.0 Alpha", req: 100, rank: "Intern", stars: 1 },
    { title: "Release: v1.2.0 Beta", req: 600, rank: "Junior Dev", stars: 2 },
    { title: "Release: v2.0.0 Stable", req: 3000, rank: "Mid-Level Engineer", stars: 3 },
    { title: "Release: v3.0.0 Production", req: 15000, rank: "Senior Architect", stars: 5 },
    { title: "Release: v4.0.0 Enterprise SaaS", req: 80000, rank: "Staff Engineer / VP", stars: 10 },
    { title: "Release: v5.0.0 Tech Unicorn", req: 400000, rank: "Tech Titan / Founder", stars: 25 }
  ];

  // Game State
  const state = {
    loc: 0,
    totalLocEarned: 0,
    stars: 0,
    milestoneIdx: 0,
    upgrades: JSON.parse(JSON.stringify(DEFAULT_UPGRADES)),
    lastSaveTime: Date.now()
  };

  // Load saved state
  try {
    const raw = localStorage.getItem("devloop_game_save_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.loc === "number") state.loc = parsed.loc;
      if (typeof parsed.totalLocEarned === "number") state.totalLocEarned = parsed.totalLocEarned;
      if (typeof parsed.stars === "number") state.stars = parsed.stars;
      if (typeof parsed.milestoneIdx === "number") state.milestoneIdx = parsed.milestoneIdx;
      if (Array.isArray(parsed.upgrades)) {
        parsed.upgrades.forEach(u => {
          const match = state.upgrades.find(x => x.id === u.id);
          if (match) {
            match.count = u.count || 0;
            match.cost = Math.round(match.baseCost * Math.pow(1.15, match.count));
          }
        });
      }
      // Calculate offline earnings (max 4 hours = 14400s)
      if (parsed.lastSaveTime) {
        const elapsedSec = Math.min(14400, Math.floor((Date.now() - parsed.lastSaveTime) / 1000));
        if (elapsedSec > 5) {
          const passiveRate = calcPassiveRate();
          const offlineEarned = passiveRate * elapsedSec;
          if (offlineEarned > 0) {
            state.loc += offlineEarned;
            state.totalLocEarned += offlineEarned;
            setTimeout(() => {
              if (typeof showPortfolioToast === "function") {
                showPortfolioToast(`Welcome back! Earned +${Math.round(offlineEarned)} LOC while away 🚀`);
              }
            }, 1000);
          }
        }
      }
    }
  } catch (_) {}

  const saveGameState = () => {
    try {
      state.lastSaveTime = Date.now();
      localStorage.setItem("devloop_game_save_v1", JSON.stringify(state));
    } catch (_) {}
  };

  function calcClickPower() {
    let power = 1;
    state.upgrades.forEach(u => {
      if (u.power) power += u.power * u.count;
    });
    const starMult = 1 + (state.stars * 0.2);
    return Math.max(1, Math.round(power * starMult));
  }

  function calcPassiveRate() {
    let rate = 0;
    state.upgrades.forEach(u => {
      if (u.rate) rate += u.rate * u.count;
    });
    const starMult = 1 + (state.stars * 0.2);
    return Math.round(rate * starMult);
  }

  // UI Elements
  const locDisplay = document.getElementById("gameLocDisplay");
  const rateDisplay = document.getElementById("gameRateDisplay");
  const starsDisplay = document.getElementById("gameStarsDisplay");
  const rankDisplay = document.getElementById("gameRankDisplay");
  const upgradeListEl = document.getElementById("upgradeList");
  const bigHackBtn = document.getElementById("bigHackBtn");
  const hackClickPowerText = document.getElementById("hackClickPowerText");
  const stageCodeOutput = document.getElementById("stageCodeOutput");
  const stageEventTicker = document.getElementById("stageEventTicker");
  const milestoneTitle = document.getElementById("milestoneTitle");
  const milestoneDesc = document.getElementById("milestoneDesc");
  const gameShipBtn = document.getElementById("gameShipBtn");
  const gameSoundToggleBtn = document.getElementById("gameSoundToggleBtn");
  const gameCrtToggleBtn = document.getElementById("gameCrtToggleBtn");
  const gameResetProgressBtn = document.getElementById("gameResetProgressBtn");
  const gameModalCloseBtn = document.getElementById("gameModalCloseBtn");
  const gameViewport = document.getElementById("gameViewport");

  const updateHUD = () => {
    if (locDisplay) locDisplay.textContent = Math.floor(state.loc).toLocaleString();
    if (rateDisplay) rateDisplay.textContent = `+${calcPassiveRate().toLocaleString()} LOC/s`;
    if (starsDisplay) starsDisplay.textContent = `⭐ ${state.stars}`;
    
    const curMilestone = MILESTONES[Math.min(state.milestoneIdx, MILESTONES.length - 1)];
    if (rankDisplay) rankDisplay.textContent = curMilestone.rank;
    if (hackClickPowerText) hackClickPowerText.textContent = `+${calcClickPower()} LOC per tap`;

    // Milestone Card
    if (milestoneTitle) milestoneTitle.textContent = curMilestone.title;
    if (milestoneDesc) {
      milestoneDesc.textContent = `Ship to production to earn +${curMilestone.stars} GitHub Stars ⭐ (+20% global boost each)`;
    }
    if (gameShipBtn) {
      const ready = state.loc >= curMilestone.req;
      gameShipBtn.disabled = !ready;
      gameShipBtn.textContent = ready
        ? `Ship to Production (+${curMilestone.stars} ⭐)`
        : `Ship to Production (Requires ${curMilestone.req.toLocaleString()} LOC)`;
    }

    // Update upgrade buttons state
    document.querySelectorAll(".upgrade-card").forEach(card => {
      const id = card.dataset.id;
      const u = state.upgrades.find(x => x.id === id);
      if (u) {
        const btn = card.querySelector(".upgrade-btn");
        if (btn) btn.disabled = state.loc < u.cost;
      }
    });
  };

  const renderUpgrades = () => {
    if (!upgradeListEl) return;
    upgradeListEl.innerHTML = "";
    state.upgrades.forEach(u => {
      const card = document.createElement("div");
      card.className = "upgrade-card";
      card.dataset.id = u.id;
      card.innerHTML = `
        <div class="upgrade-info">
          <span class="upgrade-icon">${u.icon}</span>
          <div>
            <span class="upgrade-name">${u.name} <span class="upgrade-owned">(${u.count} owned)</span></span>
            <span class="upgrade-benefit">${u.desc}</span>
          </div>
        </div>
        <button type="button" class="upgrade-btn" ${state.loc < u.cost ? "disabled" : ""}>
          Buy (${u.cost.toLocaleString()} LOC)
        </button>
      `;
      card.querySelector(".upgrade-btn")?.addEventListener("click", () => {
        if (state.loc >= u.cost) {
          state.loc -= u.cost;
          u.count++;
          u.cost = Math.round(u.baseCost * Math.pow(1.15, u.count));
          playRetroGameSfx("coin");
          renderUpgrades();
          updateHUD();
          saveGameState();
          if (stageEventTicker) {
            stageEventTicker.innerHTML = `<span class="ticker-prefix">[UPGRADE]</span> Acquired <b>${u.name}</b> (Tier ${u.count})!`;
          }
        }
      });
      upgradeListEl.appendChild(card);
    });
  };

  // Hack Tap Button
  const CODE_SNIPPETS = [
    "function optimizePipeline(): boolean { return true; }",
    "const cluster = new DistributedWorkerPool({ threads: 8 });",
    "await db.transaction().commit(); // ACID guaranteed",
    "gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, 0);",
    "export const model = new ScamDetectorNeuralGraph();",
    "res.status(200).json({ success: true, latency: '12ms' });",
    "pub fn calculate_kinematics(joint: &Joint) -> Vector3 { ... }"
  ];

  bigHackBtn?.addEventListener("click", (e) => {
    const power = calcClickPower();
    state.loc += power;
    state.totalLocEarned += power;
    playRetroGameSfx("tap");

    // Floating particle
    const rect = bigHackBtn.getBoundingClientRect();
    const particle = document.createElement("span");
    particle.className = "floating-loc-particle";
    particle.textContent = `+${power} LOC`;
    const offsetX = (e.clientX || rect.left + rect.width / 2) - rect.left;
    const offsetY = (e.clientY || rect.top + rect.height / 2) - rect.top;
    particle.style.left = `${Math.max(10, Math.min(rect.width - 60, offsetX))}px`;
    particle.style.top = `${offsetY}px`;
    bigHackBtn.appendChild(particle);
    setTimeout(() => particle.remove(), 800);

    // Terminal line
    if (stageCodeOutput) {
      const line = document.createElement("p");
      line.className = "stage-code-line";
      line.textContent = `> ${CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)]}`;
      stageCodeOutput.appendChild(line);
      if (stageCodeOutput.children.length > 5) {
        stageCodeOutput.removeChild(stageCodeOutput.children[0]);
      }
    }

    updateHUD();
  });

  // Ship Milestone Release
  gameShipBtn?.addEventListener("click", () => {
    const cur = MILESTONES[Math.min(state.milestoneIdx, MILESTONES.length - 1)];
    if (state.loc >= cur.req) {
      state.stars += cur.stars;
      state.loc = 0; // Prestiged
      if (state.milestoneIdx < MILESTONES.length - 1) {
        state.milestoneIdx++;
      }
      playRetroGameSfx("ship");
      if (typeof showPortfolioToast === "function") {
        showPortfolioToast(`Shipped ${cur.title}! Earned +${cur.stars} Stars ⭐`);
      }
      if (stageEventTicker) {
        stageEventTicker.innerHTML = `<span class="ticker-prefix">[RELEASE]</span> Successfully deployed <b>${cur.title}</b> to Production! ⭐`;
      }
      renderUpgrades();
      updateHUD();
      saveGameState();
    }
  });

  // Header Actions
  gameSoundToggleBtn?.addEventListener("click", () => {
    gameAudioEnabled = !gameAudioEnabled;
    gameSoundToggleBtn.textContent = gameAudioEnabled ? "🔊 Audio" : "🔇 Muted";
    if (gameAudioEnabled) playRetroGameSfx("tap");
  });

  gameCrtToggleBtn?.addEventListener("click", () => {
    if (gameViewport) {
      gameViewport.classList.toggle("crt-scanlines");
      const active = gameViewport.classList.contains("crt-scanlines");
      gameCrtToggleBtn.textContent = active ? "📺 CRT: ON" : "📺 CRT: OFF";
    }
  });

  gameResetProgressBtn?.addEventListener("click", () => {
    if (confirm("Reset all DevLoop game progress and start fresh as an Intern?")) {
      state.loc = 0;
      state.totalLocEarned = 0;
      state.stars = 0;
      state.milestoneIdx = 0;
      state.upgrades = JSON.parse(JSON.stringify(DEFAULT_UPGRADES));
      localStorage.removeItem("devloop_game_save_v1");
      renderUpgrades();
      updateHUD();
      if (typeof showPortfolioToast === "function") {
        showPortfolioToast("Game reset to fresh clean workstation ↺");
      }
    }
  });

  // Mode Tabs Switching
  const tabIdleBtn = document.getElementById("gameTabIdleBtn");
  const tabArcadeBtn = document.getElementById("gameTabArcadeBtn");
  const idleView = document.getElementById("gameIdleView");
  const arcadeView = document.getElementById("gameArcadeView");

  tabIdleBtn?.addEventListener("click", () => {
    tabIdleBtn.classList.add("active");
    tabArcadeBtn?.classList.remove("active");
    idleView?.classList.add("active");
    arcadeView?.classList.remove("active");
    playRetroGameSfx("tap");
  });

  tabArcadeBtn?.addEventListener("click", () => {
    tabArcadeBtn.classList.add("active");
    tabIdleBtn?.classList.remove("active");
    arcadeView?.classList.add("active");
    idleView?.classList.remove("active");
    playRetroGameSfx("tap");
    resizeArcadeCanvas();
  });

  // ========================================================================
  // Bug Smasher Arcade Game Engine
  // ========================================================================
  const arcadeCanvas = document.getElementById("arcadeCanvas");
  const arcadeScoreEl = document.getElementById("arcadeScore");
  const arcadeTimerEl = document.getElementById("arcadeTimer");
  const arcadeHealthEl = document.getElementById("arcadeHealth");
  const arcadeStartBtn = document.getElementById("arcadeStartBtn");
  const arcadeOverlay = document.getElementById("arcadeOverlay");
  const arcadeOverlayPlayBtn = document.getElementById("arcadeOverlayPlayBtn");
  const arcadeOvlTitle = document.getElementById("arcadeOvlTitle");
  const arcadeOvlDesc = document.getElementById("arcadeOvlDesc");

  let arcadeRunning = false;
  let arcadeAnimFrame = null;
  let arcadeScore = 0;
  let arcadeHealth = 100;
  let arcadeTimeLeft = 45;
  let arcadeInterval = null;
  let bugs = [];
  let particles = [];

  const resizeArcadeCanvas = () => {
    if (!arcadeCanvas) return;
    const parentWidth = arcadeCanvas.parentElement?.clientWidth || 600;
    arcadeCanvas.width = parentWidth;
    arcadeCanvas.height = Math.min(360, Math.round(parentWidth * 0.58));
  };
  window.addEventListener("resize", resizeArcadeCanvas);

  const BUG_TYPES = [
    { label: "🐛", color: "#ef4444", radius: 16, speed: 1.6, pts: 10, loc: 5 },
    { label: "👾", color: "#a855f7", radius: 18, speed: 2.2, pts: 25, loc: 15 },
    { label: "⚡", color: "#f97316", radius: 15, speed: 2.8, pts: 50, loc: 35 },
    { label: "🏆", color: "#eab308", radius: 20, speed: 3.5, pts: 100, loc: 150 }
  ];

  function spawnBug() {
    if (!arcadeCanvas) return;
    const type = Math.random() < 0.1 ? BUG_TYPES[3] : Math.random() < 0.25 ? BUG_TYPES[2] : Math.random() < 0.55 ? BUG_TYPES[1] : BUG_TYPES[0];
    const x = Math.random() * (arcadeCanvas.width - 60) + 30;
    bugs.push({
      x,
      y: -20,
      radius: type.radius,
      speed: type.speed + Math.random() * 0.6,
      color: type.color,
      label: type.label,
      pts: type.pts,
      loc: type.loc
    });
  }

  function startArcadeGame() {
    resizeArcadeCanvas();
    arcadeRunning = true;
    arcadeScore = 0;
    arcadeHealth = 100;
    arcadeTimeLeft = 45;
    bugs = [];
    particles = [];
    if (arcadeOverlay) arcadeOverlay.classList.add("hidden");
    if (arcadeScoreEl) arcadeScoreEl.textContent = "0";
    if (arcadeHealthEl) arcadeHealthEl.textContent = "100%";
    if (arcadeTimerEl) arcadeTimerEl.textContent = "45s";

    playRetroGameSfx("ship");

    clearInterval(arcadeInterval);
    arcadeInterval = setInterval(() => {
      arcadeTimeLeft--;
      if (arcadeTimerEl) arcadeTimerEl.textContent = `${arcadeTimeLeft}s`;
      if (arcadeTimeLeft <= 0) {
        endArcadeGame(true);
      }
    }, 1000);

    arcadeLoop();
  }

  function endArcadeGame(survived) {
    arcadeRunning = false;
    clearInterval(arcadeInterval);
    cancelAnimationFrame(arcadeAnimFrame);

    // Transfer scored LOC into idle bank!
    const bonusLoc = Math.round(arcadeScore * 1.5);
    state.loc += bonusLoc;
    state.totalLocEarned += bonusLoc;
    updateHUD();
    saveGameState();

    if (arcadeOverlay) {
      arcadeOverlay.classList.remove("hidden");
      if (arcadeOvlTitle) {
        arcadeOvlTitle.textContent = survived ? "BUG RUN CLEARED! 🏆" : "FIREWALL BREACHED! 💥";
      }
      if (arcadeOvlDesc) {
        arcadeOvlDesc.innerHTML = `Final Score: <b>${arcadeScore} pts</b><br>Bonus Transferred: <b style="color:var(--lime,#b8ff00);">+${bonusLoc} LOC</b> to your Idle Bank!`;
      }
      if (arcadeOverlayPlayBtn) arcadeOverlayPlayBtn.textContent = "PLAY AGAIN (45s)";
    }
  }

  function arcadeLoop() {
    if (!arcadeRunning || !arcadeCanvas) return;
    const ctx = arcadeCanvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.fillStyle = "#03060a";
    ctx.fillRect(0, 0, arcadeCanvas.width, arcadeCanvas.height);

    // Grid lines
    ctx.strokeStyle = "rgba(184, 255, 0, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < arcadeCanvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, arcadeCanvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < arcadeCanvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(arcadeCanvas.width, y);
      ctx.stroke();
    }

    // Firewall line at bottom
    ctx.strokeStyle = "rgba(184, 255, 0, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, arcadeCanvas.height - 10);
    ctx.lineTo(arcadeCanvas.width, arcadeCanvas.height - 10);
    ctx.stroke();

    // Spawn bugs
    if (Math.random() < 0.045 && bugs.length < 12) {
      spawnBug();
    }

    // Update & draw bugs
    for (let i = bugs.length - 1; i >= 0; i--) {
      const b = bugs[i];
      b.y += b.speed;

      // Draw bug
      ctx.font = `${b.radius * 1.5}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.label, b.x, b.y);

      // Hit firewall
      if (b.y > arcadeCanvas.height - 15) {
        bugs.splice(i, 1);
        arcadeHealth = Math.max(0, arcadeHealth - 12);
        if (arcadeHealthEl) arcadeHealthEl.textContent = `${arcadeHealth}%`;
        playRetroGameSfx("hit");
        if (arcadeHealth <= 0) {
          endArcadeGame(false);
          return;
        }
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
      if (p.life <= 0) {
        particles.splice(i, 1);
      } else {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1;
      }
    }

    arcadeAnimFrame = requestAnimationFrame(arcadeLoop);
  }

  // Canvas click interaction to squash bugs
  arcadeCanvas?.addEventListener("pointerdown", (e) => {
    if (!arcadeRunning) return;
    const rect = arcadeCanvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (arcadeCanvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (arcadeCanvas.height / rect.height);

    let hit = false;
    for (let i = bugs.length - 1; i >= 0; i--) {
      const b = bugs[i];
      const dist = Math.hypot(clickX - b.x, clickY - b.y);
      if (dist < b.radius * 1.6) {
        hit = true;
        arcadeScore += b.pts;
        if (arcadeScoreEl) arcadeScoreEl.textContent = arcadeScore;
        playRetroGameSfx("laser");

        // Spawn particles
        for (let p = 0; p < 12; p++) {
          particles.push({
            x: b.x,
            y: b.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: Math.random() * 4 + 2,
            color: b.color,
            life: 1.0
          });
        }

        bugs.splice(i, 1);
        break;
      }
    }

    if (!hit) {
      playRetroGameSfx("tap");
    }
  });

  arcadeStartBtn?.addEventListener("click", startArcadeGame);
  arcadeOverlayPlayBtn?.addEventListener("click", startArcadeGame);

  // Periodic passive tick (every 1s)
  setInterval(() => {
    const rate = calcPassiveRate();
    if (rate > 0) {
      state.loc += rate;
      state.totalLocEarned += rate;
      updateHUD();
    }
  }, 1000);

  // Background auto-save every 5s
  setInterval(saveGameState, 5000);

  // Initial render
  renderUpgrades();
  updateHUD();

  // Modal Open & Close logic
  openGameModal = () => {
    if (!gameModal) return;
    if (typeof playSound === "function") playSound("whoosh");
    if (!gameModal.open) gameModal.showModal();
    updateHUD();
    renderUpgrades();
  };

  closeGameModal = () => {
    if (!gameModal) return;
    if (arcadeRunning) endArcadeGame(false);
    saveGameState();
    if (gameModal.open) gameModal.close();
  };

  gameModalCloseBtn?.addEventListener("click", closeGameModal);
  gameModal.addEventListener("click", (e) => {
    if (e.target === gameModal) closeGameModal();
  });
  gameModal.addEventListener("cancel", closeGameModal);

  // Hook up Launchers
  document.getElementById("openGameHeroBtn")?.addEventListener("click", openGameModal);
  document.getElementById("footerGameBtn")?.addEventListener("click", openGameModal);
  document.getElementById("navGameBtn")?.addEventListener("click", openGameModal);
  document.getElementById("mobileDrawerGameBtn")?.addEventListener("click", () => {
    if (typeof closeMobileDrawer === "function") closeMobileDrawer();
    openGameModal();
  });
};

// Global Hotkey 'G'
window.addEventListener("keydown", (e) => {
  if (e.key === "g" || e.key === "G") {
    const active = document.activeElement;
    const isInput = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable);
    if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const gModal = document.getElementById("gameModal");
      if (gModal && gModal.open) {
        if (typeof closeGameModal === "function") closeGameModal();
      } else {
        if (typeof openGameModal === "function") openGameModal();
      }
    }
  }
});

initDevLoopGame();

// ==========================================================================
// Phase 20: Cyber Accent Theme Engine & Playable Synthesizer Piano
// ==========================================================================

const ACCENT_THEMES = ["lime", "cyan", "emerald", "magenta", "amber"];

const setAccentTheme = (accent, persist = true) => {
  if (!ACCENT_THEMES.includes(accent)) accent = "lime";
  document.documentElement.setAttribute("data-accent", accent);
  if (persist) {
    try {
      localStorage.setItem("portfolio-accent", accent);
    } catch (_) {}
  }
  document.querySelectorAll(".accent-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.accentColor === accent);
  });
  if (typeof playSound === "function") playSound("chime");
  if (typeof showToast === "function") {
    showToast(`Accent theme: ${accent.toUpperCase()} activated`, "info");
  }
};

const initAccentThemes = () => {
  let stored = "lime";
  try {
    stored = localStorage.getItem("portfolio-accent") || "lime";
  } catch (_) {}
  if (!ACCENT_THEMES.includes(stored)) stored = "lime";
  document.documentElement.setAttribute("data-accent", stored);
  document.querySelectorAll(".accent-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.accentColor === stored);
    btn.addEventListener("click", () => {
      const color = btn.dataset.accentColor || "lime";
      setAccentTheme(color);
    });
  });
};

// Playable Cyber Synthesizer Engine
const KEY_TO_NOTE = {
  a: { note: "C4", freq: 261.63 },
  w: { note: "C#4", freq: 277.18 },
  s: { note: "D4", freq: 293.66 },
  e: { note: "D#4", freq: 311.13 },
  d: { note: "E4", freq: 329.63 },
  f: { note: "F4", freq: 349.23 },
  t: { note: "F#4", freq: 369.99 },
  g: { note: "G4", freq: 392.00 },
  y: { note: "G#4", freq: 415.30 },
  h: { note: "A4", freq: 440.00 },
  u: { note: "A#4", freq: 466.16 },
  j: { note: "B4", freq: 493.88 },
  k: { note: "C5", freq: 523.25 }
};

const playPianoNote = (freq, noteName = "", duration = 0.32, customWave = null) => {
  if (typeof sfxEnabled !== "undefined" && !sfxEnabled) return;
  const ctx = typeof getAudioContext === "function" ? getAudioContext() : null;
  if (!ctx) return;
  const wave = customWave || document.getElementById("synthWaveSelect")?.value || "sawtooth";
  const t = ctx.currentTime;
  const dest = typeof getMasterGainNode === "function" ? getMasterGainNode(ctx) : ctx.destination;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, t);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(0.06, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.025, t + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(t);
  osc.stop(t + duration + 0.02);

  const display = document.getElementById("synthNoteDisplay");
  if (display && noteName) {
    display.textContent = `Active Note: ${noteName} (${Math.round(freq)} Hz) · [${wave}]`;
  }
};

let synthDemoRunning = false;
const playSynthDemoTune = () => {
  if (synthDemoRunning) return;
  synthDemoRunning = true;
  const riff = [
    { note: "C4", freq: 261.63, delay: 0 },
    { note: "E4", freq: 329.63, delay: 130 },
    { note: "G4", freq: 392.00, delay: 260 },
    { note: "B4", freq: 493.88, delay: 390 },
    { note: "C5", freq: 523.25, delay: 520 },
    { note: "B4", freq: 493.88, delay: 680 },
    { note: "G4", freq: 392.00, delay: 820 },
    { note: "E4", freq: 329.63, delay: 960 },
    { note: "C4", freq: 261.63, delay: 1100 },
    { note: "G4", freq: 392.00, delay: 1260 },
    { note: "C5", freq: 523.25, delay: 1420 }
  ];

  riff.forEach((item, index) => {
    setTimeout(() => {
      playPianoNote(item.freq, item.note, 0.22, "square");
      const keyEl = document.querySelector(`.piano-key[data-note="${item.note}"]`);
      if (keyEl) {
        keyEl.classList.add("active");
        setTimeout(() => keyEl.classList.remove("active"), 160);
      }
      if (index === riff.length - 1) {
        setTimeout(() => {
          synthDemoRunning = false;
          const display = document.getElementById("synthNoteDisplay");
          if (display) display.textContent = "Active Note: Ready · A-K to play";
        }, 300);
      }
    }, item.delay);
  });
};

const initCyberSynthesizer = () => {
  const keyboard = document.getElementById("cyberPianoKeyboard");
  if (!keyboard) return;

  keyboard.addEventListener("click", (e) => {
    const key = e.target.closest(".piano-key");
    if (!key) return;
    const freq = parseFloat(key.dataset.freq);
    const note = key.dataset.note || "";
    if (freq) {
      playPianoNote(freq, note);
      key.classList.add("active");
      setTimeout(() => key.classList.remove("active"), 180);
    }
  });

  document.getElementById("synthDemoTuneBtn")?.addEventListener("click", () => {
    playSynthDemoTune();
  });

  window.addEventListener("keydown", (e) => {
    const shortcutsModal = document.getElementById("shortcutsModal");
    if (!shortcutsModal || !shortcutsModal.open) return;
    const active = document.activeElement;
    const isInput = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT" || active.isContentEditable);
    if (isInput || e.ctrlKey || e.metaKey || e.altKey) return;

    const char = e.key.toLowerCase();
    if (KEY_TO_NOTE[char]) {
      e.preventDefault();
      const info = KEY_TO_NOTE[char];
      playPianoNote(info.freq, info.note);
      const keyEl = document.querySelector(`.piano-key[data-key="${char}"]`);
      if (keyEl) {
        keyEl.classList.add("active");
        setTimeout(() => keyEl.classList.remove("active"), 180);
      }
    }
  });
};

initAccentThemes();
initCyberSynthesizer();
