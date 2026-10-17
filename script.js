const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

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
  link.addEventListener("click", () => {
    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    activeLink = link;
    updateNavIndicator(activeLink, false);
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

// Section Scrollspy for Center Pill Active State
const sectionIds = ["about", "skills", "projects", "journey", "achievements"];
const observedSections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

const updateScrollspy = () => {
  if (window.scrollY < 120) {
    navLinks.forEach(l => l.classList.remove("active"));
    activeLink = null;
    navLinksContainer?.removeAttribute("data-ind");
    return;
  }
  const scrollPos = window.scrollY + 200;
  let currentSection = null;
  for (const sec of observedSections) {
    if (sec.offsetTop <= scrollPos && sec.offsetTop + sec.offsetHeight > scrollPos) {
      currentSection = sec.id;
      break;
    }
  }
  if (currentSection) {
    const targetLink = $(`.nav-link[href="#${currentSection}"]`, navLinksContainer);
    if (targetLink && targetLink !== activeLink) {
      navLinks.forEach(l => l.classList.remove("active"));
      targetLink.classList.add("active");
      activeLink = targetLink;
      updateNavIndicator(activeLink, false);
    }
  }
};

window.addEventListener("scroll", updateScrollspy, { passive: true });

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
  link.addEventListener("click", () => {
    mobileDrawerLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    // Also sync desktop active link if applicable
    const targetHref = link.getAttribute("href");
    const matchingDesktopLink = $(`.nav-link[href="${targetHref}"]`);
    if (matchingDesktopLink) {
      navLinks.forEach(l => l.classList.remove("active"));
      matchingDesktopLink.classList.add("active");
      activeLink = matchingDesktopLink;
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

// Global Keyboard Shortcut: ⌘K, Ctrl+K, or ?
document.addEventListener("keydown", e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    if (cmdKModal?.open) {
      closeCmdK();
    } else {
      openCmdK();
    }
  } else if (e.key === "?" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
    e.preventDefault();
    if (cmdKModal?.open) {
      closeCmdK();
    } else {
      openCmdK();
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

  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    const match = !q || text.includes(q);
    item.style.display = match ? "flex" : "none";
  });

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

// Action Execution
cmdKResults?.addEventListener("click", e => {
  const item = e.target.closest(".cmdk-item");
  if (!item) return;

  const action = item.getAttribute("data-action");
  const target = item.getAttribute("data-target");

  closeCmdK();

  if (action === "goto" && target) {
    const targetEl = $(target);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth" });
    }
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
  } else if (action === "copy-email") {
    $("#copyEmailBtn")?.click();
  } else if (action === "view-education") {
    openResumeModal("#resumeEduSection");
  } else if (action === "view-resume") {
    openResumeModal();
  } else if (action === "toggle-theme") {
    toggleTheme();
  } else if (action === "github") {
    window.open("https://github.com/gouvkimsea", "_blank", "noopener,noreferrer");
  } else if (action === "linkedin") {
    window.open("https://linkedin.com/in/gouvkimsea", "_blank", "noopener,noreferrer");
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

// Scroll spy & reveal animations
const sections = $$("main section[id]");
const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) {
    navLinks.forEach(link => {
      const isMatch = link.getAttribute("href") === `#${entry.target.id}`;
      link.classList.toggle("active", isMatch);
      if (isMatch) {
        activeLink = link;
        updateNavIndicator(activeLink, false);
      }
    });
    if (entry.target.id === "home") {
      activeLink = null;
      navLinksContainer?.removeAttribute("data-ind");
    }
  }
}), { rootMargin: "-25% 0px -45% 0px" });
sections.forEach(section => sectionObserver.observe(section));

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
  const interactiveSelector = "a, button, input[type='button'], input[type='submit'], summary, select, label, [role='button'], [role='tab'], [role='link'], .magnetic, .nav-link, .project-card, .terminal-chip, .topic-chip, .achieve-filter-btn, .hud-item, .hud-contact-item, .hud-copy-btn, .work-drawer-toggle, .theme-toggle, .menu-toggle, .cmdk-btn, .cmdk-item, .code-tab, .code-run-btn, .console-reset-btn, .chrome-sfx-btn, .resume-action-btn, .resume-modal-close, .mobile-drawer-close, .edu-view-btn, .btn, .button, .clickable, [data-filter], [data-topic]";

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

// 2. Magnetic Elements Interaction
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

// 5. Spotlight Card Effect (Linear / Vercel cursor border glow)
$$(".spotlight-card").forEach(card => {
  card.addEventListener("pointermove", event => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  }, { passive: true });
});

// 6. Project Filters with Smooth Transition
$$(".filter").forEach(filter => filter.addEventListener("click", () => {
  $$(".filter").forEach(item => item.classList.remove("active"));
  filter.classList.add("active");
  const selected = filter.dataset.filter;
  const cards = $$(".project-card");

  cards.forEach(card => {
    const matches = selected === "all" || card.dataset.category.includes(selected);
    if (!matches) {
      card.classList.add("fade-out");
      setTimeout(() => {
        if (card.classList.contains("fade-out")) card.classList.add("hidden");
      }, 250);
    } else {
      card.classList.remove("hidden");
      requestAnimationFrame(() => card.classList.remove("fade-out"));
    }
  });
}));

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
  joul: {
    title: "JOUL Rental Service — Vehicle Fleet & Escrow Platform",
    overview: "A full-featured, enterprise-grade vehicle and equipment rental platform built with PHP 8.x and MySQL. Combines an interactive customer booking storefront with fleet inventory controls, role-based access governance, escrow-backed double-entry financial ledger, and an automated background maintenance worker.",
    problem: "Real-world vehicle rentals suffer from high-risk double bookings, tight turnarounds leading to uninspected vehicles, and messy security deposit disputes across manual staff ledgers.",
    learned: "Engineered mathematical interval overlap detection algorithms with mandatory turnaround cleaning/inspection buffers, segregated deposit escrow accounting, granular server-side RBAC with session hardening, and built 5 automated test suites with 197 passing assertions.",
    tech: ["PHP 8.x", "MySQL / InnoDB", "Double-Entry Ledger", "Turnaround Buffers", "RBAC Security", "CSRF Hardening", "Automated Testing"],
    actions: [
      { label: "Rental Service Repository ↗", url: "https://github.com/gouvkimsea/rental-service", primary: true },
      { label: "Architecture & Test Suite ↗", url: "https://github.com/gouvkimsea/rental-service#key-features", primary: false }
    ]
  },
  clp: {
    title: "Chinese Learning Platform (CLP) — Full-Stack Monorepo",
    overview: "An enterprise-grade, monorepo Chinese language learning ecosystem engineered with NestJS, Next.js, and Prisma. Features an interactive SuperMemo-2 (SM-2) spaced repetition algorithm, HSK 1–6 vocabulary progression, and an AI conversational tutor powered by Google Gemini.",
    problem: "Mastering Mandarin Chinese requires scientific spaced repetition scheduling and immediate conversational feedback, but traditional apps lock learners into rigid curricula without personalized AI dialogue or granular retention analytics.",
    learned: "Engineered pure SuperMemo-2 (SM-2) mathematical interval algorithms, integrated Gemini 1.5 Pro with structured grammar correction prompts, orchestrated a high-performance Turbo monorepo (NestJS API, Next.js student and admin portals, CLI tool), and modeled complex flashcard review ledgers with Prisma ORM.",
    tech: ["TypeScript", "NestJS", "Next.js", "Prisma ORM", "Gemini AI", "SuperMemo-2 (SM-2)", "Monorepo"],
    actions: [
      { label: "Monorepo GitHub ↗", url: "https://github.com/gouvkimsea", primary: true },
      { label: "Explore Architecture & SRS Engine ↗", url: "https://github.com/gouvkimsea/my-Portfolio-", primary: false }
    ]
  },
  pinit: {
    title: "Pinit",
    overview: "An AI-powered concept for helping people identify potentially suspicious online content, phishing attempts, and scams.",
    problem: "Online content and links can be difficult to evaluate quickly. Pinit explores how a calmer, intuitive signal could help users pause before trusting a suspicious link.",
    learned: "Designing trustworthy digital guardrails, clear explainability, and making AI-assisted security feel approachable.",
    tech: ["AI concept", "Web Security", "Frontend"],
    actions: [
      { label: "PinitAI Repository ↗", url: "https://github.com/gouvkimsea/PinitAI", primary: true },
      { label: "Portfolio Source ↗", url: "https://github.com/gouvkimsea/my-Portfolio-", primary: false }
    ]
  },
  miniworld: {
    title: "Mini World — 3D Planet Simulation",
    overview: "An interactive procedural 3D miniature cartoon planet sandbox built in pure WebGL. Features real-time mesh deformation, procedural terrain biomes, celestial lighting, and physical meteor impact dynamics.",
    problem: "Real-time spherical 3D geometry manipulation and procedural shader lighting typically require heavy 3D game engines, creating massive bundle sizes.",
    learned: "Engineered custom 3D vector/matrix math, subdivision cubesphere geometry, procedural noise biomes, Web Audio API sound synthesis, and real-time vertex displacement craters.",
    tech: ["WebGL", "GLSL Shaders", "3D Math", "Web Audio API", "JavaScript"],
    actions: [
      { label: "Launch Live 3D Simulation ↗", url: "miniworld.html", primary: true },
      { label: "GitHub Profile ↗", url: "https://github.com/gouvkimsea", primary: false }
    ]
  },
  portfolio: {
    title: "This Portfolio",
    overview: "A personal corner of the internet built to document the journey, experiments, and technical evolution.",
    problem: "Developer portfolios often feel cookie-cutter. This site was designed to make learning tangible with rich tactile micro-interactions.",
    learned: "Mastering fluid vanilla JavaScript physics, accessible dialog modals, and high-performance CSS animations.",
    tech: ["HTML5", "CSS3", "JavaScript", "GitHub Pages"],
    actions: [
      { label: "GitHub Repository ↗", url: "https://github.com/gouvkimsea/my-Portfolio-", primary: true },
      { label: "Live Deployment ↗", url: "https://gouvkimsea.github.io/my-Portfolio-/", primary: false }
    ]
  },
  devpulse: {
    title: "DevPulse",
    overview: "A developer telemetry and rhythm dashboard visualizing engineering velocity, focus cycles, and commit flow.",
    problem: "Developers frequently lack visibility into their flow states and build fatigue across distributed projects.",
    learned: "Real-time telemetry event streaming, intuitive metric visualization, and high-performance SVG animations.",
    tech: ["WebSockets", "Data Visualization", "JavaScript", "UI Design"],
    actions: [
      { label: "GitHub Profile ↗", url: "https://github.com/gouvkimsea", primary: true },
      { label: "Explore Code ↗", url: "https://github.com/gouvkimsea/my-Portfolio-", primary: false }
    ]
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
    bufferLegend.innerHTML = `<b>Turnaround Buffer:</b> +${vehicle.buffer}h (14:00 — ${bufferEndStr})`;
  }
  if (requestLegend) {
    requestLegend.innerHTML = `<b>Incoming Request:</b> ${scenario.reqStart} — ${scenario.reqEnd}`;
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

function openModal(projectKey) {
  const data = projectData[projectKey];
  if (!data) return;
  previousActiveElement = document.activeElement;
  $("#modalTitle").textContent = data.title;
  $("#modalOverview").textContent = data.overview;
  $("#modalProblem").textContent = data.problem;
  $("#modalLearned").textContent = data.learned;
  $("#modalTech").innerHTML = data.tech.map(item => `<span>${item}</span>`).join("");
  $("#modalActions").innerHTML = data.actions.map(act =>
    `<a class="modal-btn ${act.primary ? '' : 'secondary'}" href="${act.url}" target="_blank" rel="noreferrer">${act.label}</a>`
  ).join("");

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

  modal.showModal();
  $("#modalClose")?.focus();
}

function closeModal() {
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
$$(".resume-view-btn").forEach(btn => {
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
  help: "Available commands: <b>about</b>, <b>journey</b>, <b>education</b>, <b>skills</b>, <b>projects</b>, <b>joul</b>, <b>clp</b>, <b>pinit</b>, <b>miniworld</b>, <b>devpulse</b>, <b>portfolio</b>, <b>achievements</b>, <b>focus</b>, <b>work</b>, <b>contact</b>, <b>resume</b>, <b>stats</b>, <b>neofetch</b>, <b>theme</b>, <b>search</b>, <b>github</b>, <b>linkedin</b>, <b>whoami</b>, <b>date</b>, <b>clear</b>",
  about: "Gouv Kimsea — Dual degree undergraduate in Computer Science (Paragon.U) & Business Administration (Bonamary.U) building tangible products.",
  journey: () => {
    const el = document.getElementById("journey");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    return `<pre style="color:var(--lime);font-size:11px;line-height:1.5;">
Gouv Kimsea — Engineering Roadmap & Journey:
================================================================
Phase 01 [Current]: Shipping in public (JOUL Rental, CLP, PinitAI, Mini World 3D, DevPulse)
Phase 02 [Exploration]: Full-stack systems & procedural WebGL shaders
Phase 03 [Foundations]: Dual undergraduate degrees (Paragon.U CS & Bonamary.U BBA)
Phase 04 [Horizon]: Team engineering, scalable systems & open-source
================================================================
Scrolled to Section 04: The Journey & Roadmap!</pre>`;
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
  skills: "JavaScript · TypeScript · NestJS · Next.js · Prisma · C++ · Python · WebGL / Shaders · HTML5 / CSS3 · React · REST APIs · Node.js · SQL · MySQL · PHP",
  projects: "1. <b>JOUL Rental Service</b> — Enterprise vehicle fleet & escrow ledger platform (PHP 8 / MySQL)\n2. <b>Chinese Learning Platform</b> — Full-stack monorepo with SuperMemo-2 SRS & Gemini AI tutor (NestJS / Next.js / Prisma)\n3. <b>Pinit</b> — AI scam and suspicious link detector\n4. <b>Mini World</b> — 3D planet simulation & WebGL engine\n5. <b>DevPulse</b> — Real-time engineering flow & telemetry dashboard\n6. <b>This Portfolio</b> — Personal web platform & terminal CLI\nClick any project card to view interactive breakdown.",
  achievements: () => {
    const el = document.getElementById("achievements");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    return `<pre style="color:var(--lime);font-size:11px;line-height:1.4;">
Engineering Milestones & Accolades:
----------------------------------------
1. Multi-Product Velocity (Shipped Apps: PinitAI, Portfolio, Chinese Learning Platform, Tracking App, To-Do List, Joul Platform)
2. Procedural WebGL 3D Engine (Pure WebGL, GLSL Shaders, 60 FPS)
3. Pinit Threat Intelligence (AI Phishing & Scam Indicator Heuristics)
4. 15+ Public Repositories (Continuous Git Velocity & Open Source)
5. Computer Science (Algorithms, Data Structures, C++, SQL)
6. Modern Web Platform Architecture (Accessible, lightweight, bespoke engineering craft)
7. C++ Terminal-Based Systems (Student Information Management System, Library Book System)

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
    return "Opening JOUL Rental Service (Enterprise Fleet & Escrow Platform) project modal & fleet simulator...";
  },
  rental: () => terminalCommands.joul(),
  clp: () => {
    openModal("clp");
    return "Opening Chinese Learning Platform (Monorepo, SuperMemo-2 SRS & Gemini AI) project modal & flashcard simulator...";
  },
  chinese: () => terminalCommands.clp(),
  srs: () => terminalCommands.clp(),
  sm2: () => terminalCommands.clp(),
  miniworld: () => {
    window.open("miniworld.html", "_blank");
    return "Launching Mini World 3D Planet Simulation in a new tab...";
  },
  pinit: () => {
    openModal("pinit");
    return "Opening Pinit (AI Threat & Scam Detector) project modal...";
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
• Featured Live Projects: 6 (JOUL Rental, Chinese Learning Platform, Pinit, Mini World, DevPulse, Portfolio)
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
    return "LET'S WORK. Direct channels:\n• Email: <a href='mailto:gouvkimsea@gmail.com' style='color:var(--lime)'>gouvkimsea@gmail.com</a>\n• GitHub: <a href='https://github.com/gouvkimsea' target='_blank' style='color:var(--lime)'>github.com/gouvkimsea</a>\n• LinkedIn: <a href='https://linkedin.com/in/gouvkimsea' target='_blank' style='color:var(--lime)'>linkedin.com/in/gouvkimsea</a>";
  },
  work: () => terminalCommands.contact(),
  whoami: "guest — welcome to Gouv Kimsea's portfolio.",
  github: "Opening GitHub profile in a new tab...",
  linkedin: "Opening LinkedIn profile in a new tab...",
  date: () => new Date().toLocaleString(),
  sudo: "No administrative privileges needed. All public projects and documentation are open to explore.",
  "cat developer.ts": "const developer = {\n  name: 'Gouv Kimsea',\n  degrees: ['B.Sc. Computer Science', 'B.B.A. Business Admin'],\n  stack: ['TypeScript', 'C++', 'Python', 'WebGL', 'React'],\n  location: 'Phnom Penh, Cambodia',\n  status: 'Building & Available'\n};",
  "cat about-me.js": "const developer = {\n  name: 'Gouv Kimsea',\n  degrees: ['B.Sc. Computer Science', 'B.B.A. Business Admin'],\n  stack: ['TypeScript', 'C++', 'Python', 'WebGL', 'React'],\n  location: 'Phnom Penh, Cambodia',\n  status: 'Building & Available'\n};"
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
  if (lower === "clear") {
    terminalOutput.innerHTML = "";
    return;
  }

  if (lower === "github") {
    window.open("https://github.com/gouvkimsea", "_blank", "noreferrer");
  } else if (lower === "linkedin") {
    window.open("https://linkedin.com/in/gouvkimsea", "_blank", "noreferrer");
  }

  let response;
  if (typeof terminalCommands[lower] === "function") {
    response = terminalCommands[lower]();
  } else if (terminalCommands[lower]) {
    response = terminalCommands[lower];
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
      const match = Object.keys(terminalCommands).find(k => k.startsWith(current));
      if (match) terminalInput.value = match;
    }
  }
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

const fallbackCopy = text => {
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

// ==========================================================================
// Section 04: The Journey & Roadmap Interactive Controller
// ==========================================================================
const initJourneySection = () => {
  const steps = $$(".journey-stepper .stepper-step");
  const cards = $$(".journey-feed .journey-milestone-card");
  const indicator = $("#journeyIndicatorBar");
  const pinitDemoBtn = $("#journeyPinitBtn");

  const updateActiveStep = (stepNum) => {
    const num = parseInt(stepNum, 10);
    steps.forEach((btn) => {
      const isMatch = parseInt(btn.dataset.step, 10) === num;
      btn.classList.toggle("active", isMatch);
      btn.setAttribute("aria-selected", isMatch ? "true" : "false");
    });

    cards.forEach((card) => {
      const isMatch = parseInt(card.dataset.step, 10) === num;
      card.classList.toggle("active", isMatch);
    });

    if (indicator && steps.length > 0) {
      const activeIdx = Math.max(0, Math.min(num - 1, steps.length - 1));
      indicator.style.transform = `translateY(${activeIdx * 100}%)`;
    }
  };

  // Click on stepper button
  steps.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const targetCard = document.getElementById(targetId);
      const stepNum = btn.dataset.step;

      updateActiveStep(stepNum);

      if (targetCard) {
        targetCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  });

  // Click on milestone card to activate
  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("a, button, input, textarea")) return;
      const stepNum = card.dataset.step;
      if (stepNum) updateActiveStep(stepNum);
    });
  });

  // ScrollSpy with IntersectionObserver
  if ("IntersectionObserver" in window && cards.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const stepNum = entry.target.dataset.step;
            if (stepNum) updateActiveStep(stepNum);
          }
        });
      },
      {
        rootMargin: "-20% 0px -40% 0px",
        threshold: 0.15,
      }
    );

    cards.forEach((card) => observer.observe(card));
  }

  // Journey Pinit Scanner demo trigger
  pinitDemoBtn?.addEventListener("click", () => {
    if (typeof openModal === "function") {
      openModal("pinit");
      setTimeout(() => {
        const pinitSection = $("#pinitThreatLab");
        pinitSection?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  });

  // Journey JOUL Rental Fleet demo trigger
  const joulJourneyBtn = $("#journeyJoulBtn");
  joulJourneyBtn?.addEventListener("click", () => {
    if (typeof openModal === "function") {
      openModal("joul");
    }
  });

  // Journey CLP Chinese Learning Platform demo trigger
  const clpJourneyBtn = $("#journeyClpBtn");
  clpJourneyBtn?.addEventListener("click", () => {
    if (typeof openModal === "function") {
      openModal("clp");
    }
  });

  // Magnetic hover for deliverable chips inside journey
  $$(".journey-feed .deliv-chip.magnetic").forEach((el) => {
    el.addEventListener("pointermove", (event) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (event.clientX - centerX) * 0.15;
      const deltaY = (event.clientY - centerY) * 0.15;
      el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transform = "translate(0px, 0px)";
    });
  });
};

initJourneySection();
