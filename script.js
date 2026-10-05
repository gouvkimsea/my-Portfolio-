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

// ==========================================================================
// Smean.ai Style Animated Navigation Controller
// ==========================================================================
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

// Smean.ai Sliding Magnetic Pill Indicator
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

// Theme Controller (Dark Mode by default with user toggle and persistence)
const isMobileDevice = window.innerWidth <= 900 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const savedTheme = localStorage.getItem("portfolio-theme");
const initialTheme = (isMobileDevice && !savedTheme) ? "dark" : (savedTheme || "dark");

const setTheme = (theme, persist = true) => {
  document.documentElement.setAttribute("data-theme", theme);
  if (persist) localStorage.setItem("portfolio-theme", theme);
  const textEl = $("#themeToggle .theme-mode-text");
  if (textEl) textEl.textContent = theme === "dark" ? "Light" : "Dark";
};

setTheme(initialTheme, false);

const toggleTheme = () => {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  setTheme(next, true);
  return next;
};

$("#themeToggle")?.addEventListener("click", toggleTheme);

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
  if (!localStorage.getItem("portfolio-theme")) {
    setTheme(e.matches ? "dark" : "light", false);
  }
});

// ==========================================================================
// ⌘K Command Palette Controller
// ==========================================================================
const cmdKModal = $("#cmdKModal");
const cmdKBtn = $("#cmdKBtn");
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

cmdKBtn?.addEventListener("click", openCmdK);
const footerCmdKBtn = $("#footerCmdKBtn");
footerCmdKBtn?.addEventListener("click", openCmdK);

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
  } else if (action === "play-dino") {
    terminalCommands.dino();
  }
});


// ==========================================================================
// Dynamic Typewriter Effect in Hero Title
// ==========================================================================
const typewriterEl = $("#typewriter");
if (typewriterEl) {
  const words = ["builder.", "software explorer.", "creative engineer.", "problem solver."];
  let wordIdx = 0;
  let charIdx = words[0].length;
  let isDeleting = true;
  let typeSpeed = 2000;

  const typeLoop = () => {
    const currentWord = words[wordIdx];
    if (isDeleting) {
      charIdx--;
      typeSpeed = 45;
    } else {
      charIdx++;
      typeSpeed = 85;
    }

    typewriterEl.textContent = currentWord.substring(0, charIdx);

    if (!isDeleting && charIdx === currentWord.length) {
      typeSpeed = 2400; // Pause on complete word
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      wordIdx = (wordIdx + 1) % words.length;
      typeSpeed = 400; // Pause before typing next word
    }

    setTimeout(typeLoop, typeSpeed);
  };
  setTimeout(typeLoop, 2200);
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

// 1. Fluid Custom Cursor with Momentum & Centering
const dot = $("#cursorDot"), ring = $("#cursorRing");
let mouseX = -100, mouseY = -100;
let ringX = -100, ringY = -100;
let isCursorActive = false;

if (window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("pointermove", event => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    if (!isCursorActive) {
      ringX = mouseX;
      ringY = mouseY;
      isCursorActive = true;
      document.body.classList.add("cursor-visible");
    }
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  }, { passive: true });

  document.addEventListener("mouseleave", () => document.body.classList.remove("cursor-visible"));
  document.addEventListener("mouseenter", () => {
    if (isCursorActive) document.body.classList.add("cursor-visible");
  });

  const renderCursor = () => {
    if (isCursorActive) {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    }
    requestAnimationFrame(renderCursor);
  };
  requestAnimationFrame(renderCursor);

  document.addEventListener("pointerdown", () => document.body.classList.add("cursor-press"));
  document.addEventListener("pointerup", () => document.body.classList.remove("cursor-press"));

  const registerHoverListeners = () => {
    $$("a, button, input, textarea, .project-card, .terminal-chip").forEach(item => {
      item.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
      item.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
    });
  };
  registerHoverListeners();
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

// 3. Hero Code Card 3D Perspective Tilt & Dynamic Glare
const heroVisual = $("#heroVisual");
const codeCard = $(".code-card");
if (heroVisual && codeCard) {
  heroVisual.addEventListener("pointermove", event => {
    const rect = heroVisual.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const rotateX = -y * 18;
    const rotateY = x * 22;
    codeCard.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(10px)`;
    codeCard.style.setProperty("--glare-x", `${((x + 0.5) * 100).toFixed(1)}%`);
    codeCard.style.setProperty("--glare-y", `${((y + 0.5) * 100).toFixed(1)}%`);
  }, { passive: true });
  heroVisual.addEventListener("pointerleave", () => {
    codeCard.style.transform = "perspective(1000px) rotate(3deg)";
  });
}

// 4. Code Card Live IDE Execution Simulation
const runCodeBtn = $("#runCodeBtn");
const codeConsole = $("#codeConsole");
const consoleText = $("#consoleText");

runCodeBtn?.addEventListener("click", () => {
  runCodeBtn.style.pointerEvents = "none";
  runCodeBtn.innerHTML = "<span>↻</span> Running...";
  codeConsole?.classList.add("active");
  if (consoleText) consoleText.textContent = "evaluating developer.ts...";

  setTimeout(() => {
    runCodeBtn.style.pointerEvents = "";
    runCodeBtn.innerHTML = "<span>✓</span> Executed";
    if (consoleText) consoleText.innerHTML = "<b>Gouv Kimsea</b> · Student Developer · Paragon.U CS &amp; Bonamary.U BBA";
    setTimeout(() => {
      runCodeBtn.innerHTML = "<span>▶</span> Run";
      codeConsole?.classList.remove("active");
    }, 4500);
  }, 500);
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

const openModal = projectKey => {
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
  modal.showModal();
  $("#modalClose")?.focus();
};

const closeModal = () => {
  if (modal?.open) {
    modal.close();
    if (previousActiveElement && typeof previousActiveElement.focus === "function") {
      previousActiveElement.focus();
    }
  }
};

$$(".project-open").forEach(button => button.addEventListener("click", () => {
  const card = button.closest(".project-card");
  if (card) openModal(card.dataset.project);
}));
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
$("#eduDetailsBtn")?.addEventListener("click", () => openResumeModal("#resumeEduSection"));
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
  help: "Available commands: <b>about</b>, <b>education</b>, <b>skills</b>, <b>projects</b>, <b>pinit</b>, <b>miniworld</b>, <b>devpulse</b>, <b>portfolio</b>, <b>achievements</b>, <b>dino</b>, <b>work</b>, <b>contact</b>, <b>resume</b>, <b>stats</b>, <b>neofetch</b>, <b>theme</b>, <b>search</b>, <b>github</b>, <b>linkedin</b>, <b>whoami</b>, <b>date</b>, <b>clear</b>",
  about: "Gouv Kimsea — Dual degree undergraduate in Computer Science (Paragon.U) & Business Administration (Bonamary.U) building tangible products.",
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
  skills: "JavaScript · C++ · Python · WebGL / Shaders · HTML5 / CSS3 · React · REST APIs · Node.js · SQL",
  projects: "1. <b>Pinit</b> — AI scam and suspicious link detector\n2. <b>Mini World</b> — 3D planet simulation & WebGL engine\n3. <b>DevPulse</b> — Real-time engineering flow & telemetry dashboard\n4. <b>This Portfolio</b> — Personal web platform & terminal CLI\nClick any project card to view interactive breakdown.",
  achievements: () => {
    const el = document.getElementById("achievements");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    return `<pre style="color:var(--lime);font-size:11px;line-height:1.4;">
Engineering Milestones & Accolades:
----------------------------------------
1. Multi-Product Velocity (4 Shipped Apps: PinitAI, Mini World, DevPulse, Portfolio)
2. Procedural WebGL 3D Engine (Pure WebGL, GLSL Shaders, 60 FPS)
3. Pinit Threat Intelligence (AI Phishing & Scam Indicator Heuristics)
4. 15+ Public Repositories (Continuous Git Velocity & Open Source)
5. Computer Science Rigor (Algorithms, Data Structures, C++, SQL)
6. Modern Web Platform Architecture (Accessible, lightweight, bespoke engineering craft)
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
  dino: () => {
    const el = document.getElementById("dinoGameWidget");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
    return "Scrolled to Google Chrome Dino in Bento Grid! Press SPACE or Tap to play!";
  },
  trex: () => terminalCommands.dino(),
  offline: () => terminalCommands.dino(),
  game: () => terminalCommands.dino(),
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
• Featured Live Projects: 4 (Pinit, Mini World, DevPulse, Portfolio)
• Primary Stack: JavaScript (ES2026), C++, Python, WebGL/GLSL
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

contactForm?.addEventListener("submit", event => {
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

    if (formAction && !formAction.includes("placeholder") && formAction.startsWith("http")) {
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
// AUTHENTIC GOOGLE CHROME OFFLINE DINO RUNNER GAME ENGINE
// Pixel-perfect Chromium implementation using official sprite sheet coordinates
// ==========================================================================
(function initGoogleChromeDino() {
  const widget = document.getElementById("dinoGameWidget");
  const canvas = document.getElementById("chromeDinoCanvas");
  if (!widget || !canvas) return;

  const ctx = canvas.getContext("2d");
  const hudScore = document.getElementById("chromeHudScore");
  const hudHi = document.getElementById("chromeHudHi");
  const sfxBtn = document.getElementById("chromeSfxBtn");

  // Load official Chromium sprite sheet (2x HDPI for Retina & pixel crispness)
  const sprite = new Image();
  sprite.src = "offline-sprite-2x.png";

  // Official Chromium HDPI Sprite Definitions (2441 x 130)
  const SPRITES = {
    TREX_STAND: { x: 1678, y: 2, w: 88, h: 94 },
    TREX_BLINK: { x: 1766, y: 2, w: 88, h: 94 },
    TREX_RUN1: { x: 1854, y: 2, w: 88, h: 94 },
    TREX_RUN2: { x: 1942, y: 2, w: 88, h: 94 },
    TREX_CRASH: { x: 2118, y: 2, w: 88, h: 94 },
    TREX_DUCK1: { x: 2206, y: 2, w: 118, h: 50 },
    TREX_DUCK2: { x: 2324, y: 2, w: 118, h: 50 },
    CLOUD: { x: 166, y: 2, w: 92, h: 28 },
    HORIZON: { x: 2, y: 104, w: 1200, h: 24 },
    CACTUS_SMALL: { x: 446, y: 2, w: 34, h: 70 },
    CACTUS_LARGE: { x: 652, y: 2, w: 50, h: 100 },
    PTERO1: { x: 260, y: 2, w: 92, h: 80 },
    PTERO2: { x: 352, y: 2, w: 92, h: 80 },
    RESTART: { x: 2, y: 2, w: 72, h: 64 },
    TEXT_GAME_OVER: { x: 1294, y: 28, w: 382, h: 22 }
  };

  // State Management
  const STATE_WAITING = 0;
  const STATE_PLAYING = 1;
  const STATE_CRASHED = 2;

  let state = STATE_WAITING;
  let score = 0;
  let hiScore = parseInt(localStorage.getItem("chrome_dino_hi") || "0", 10);
  let distance = 0;
  let speed = 6;
  const initialSpeed = 6;
  const maxSpeed = 13;
  const acceleration = 0.0014;

  let isMuted = false;
  let audioCtx = null;

  // Trex Physics & State
  const trex = {
    x: 28,
    y: 0,
    vy: 0,
    w: 44,
    h: 47,
    duckW: 59,
    duckH: 25,
    groundY: 125,
    isGrounded: true,
    isDucking: false,
    jumpVelocity: -10.5,
    gravity: 0.58,
    runFrame: 0,
    runTimer: 0,
    blinkTimer: 0,
    isBlinking: false
  };

  // Environment elements
  let horizonX = 0;
  let obstacles = [];
  let obstacleTimer = 0;
  let minObstacleDistance = 220;
  let clouds = [];

  // Flash score on 100-pt milestone
  let flashTimer = 0;
  let flashVisible = true;

  // Audio Synthesizer (Exact 8-bit Google Chrome sounds)
  const initAudio = () => {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  };

  const playSound = type => {
    if (isMuted) return;
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "jump") {
      osc.type = "square";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "hit") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.25);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "milestone") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.1); // A5
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.setValueAtTime(0.09, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  };

  // High score HUD update
  const updateHiScoreDisplay = () => {
    const formatted = 'HI ' + String(hiScore).padStart(5, '0');
    if (hudHi) hudHi.textContent = formatted;
  };
  updateHiScoreDisplay();

  // Resize and DPI scaling
  let cssWidth = 560;
  let cssHeight = 140;
  let groundY = 120;
  let dpr = 1;

  const resizeCanvas = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    cssWidth = Math.max(300, Math.floor(rect.width || 560));
    cssHeight = Math.floor(rect.height || 140);
    groundY = cssHeight - 20;

    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    trex.groundY = groundY;
    if (trex.isGrounded && !trex.isDucking) {
      trex.y = groundY - trex.h;
    }
  };
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Initialize initial clouds
  const initClouds = () => {
    clouds = [
      { x: cssWidth * 0.35, y: 25, speed: 0.8 },
      { x: cssWidth * 0.75, y: 40, speed: 0.6 }
    ];
  };
  initClouds();

  // Reset Game
  const resetGame = () => {
    state = STATE_PLAYING;
    score = 0;
    distance = 0;
    speed = initialSpeed;
    obstacles = [];
    obstacleTimer = 0;
    minObstacleDistance = 220;
    horizonX = 0;
    flashTimer = 0;
    flashVisible = true;

    trex.y = groundY - trex.h;
    trex.vy = 0;
    trex.isGrounded = true;
    trex.isDucking = false;
    trex.runFrame = 0;

    widget.classList.add("is-playing");
    if (hudScore) hudScore.textContent = "00000";
  };

  // Trigger Jump / Start
  const triggerJump = () => {
    if (state === STATE_WAITING) {
      resetGame();
      trex.vy = trex.jumpVelocity;
      trex.isGrounded = false;
      playSound("jump");
      return;
    }
    if (state === STATE_CRASHED) {
      resetGame();
      trex.vy = trex.jumpVelocity;
      trex.isGrounded = false;
      playSound("jump");
      return;
    }
    if (state === STATE_PLAYING && trex.isGrounded) {
      trex.vy = trex.jumpVelocity;
      trex.isGrounded = false;
      playSound("jump");
    }
  };

  const endJumpEarly = () => {
    if (state === STATE_PLAYING && trex.vy < -3.5) {
      trex.vy = -3.5;
    }
  };

  const setDucking = ducking => {
    if (state !== STATE_PLAYING) return;
    trex.isDucking = ducking;
    if (ducking && !trex.isGrounded) {
      trex.vy += trex.gravity * 2;
    }
  };

  const gameOver = () => {
    state = STATE_CRASHED;
    playSound("hit");
    if (score > hiScore) {
      hiScore = score;
      localStorage.setItem("chrome_dino_hi", String(hiScore));
      updateHiScoreDisplay();
    }
  };

  // Input listeners
  const isInputActive = () => {
    const el = document.activeElement;
    return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  };

  window.addEventListener("keydown", event => {
    if (isInputActive()) return;

    if (event.code === "Space" || event.key === " " || event.key === "ArrowUp" || event.key === "KeyW") {
      const rect = widget.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) {
        event.preventDefault();
        triggerJump();
      }
    } else if (event.key === "ArrowDown" || event.key === "KeyS") {
      const rect = widget.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) {
        event.preventDefault();
        setDucking(true);
      }
    }
  });

  window.addEventListener("keyup", event => {
    if (isInputActive()) return;

    if (event.code === "Space" || event.key === " " || event.key === "ArrowUp" || event.key === "KeyW") {
      endJumpEarly();
    } else if (event.key === "ArrowDown" || event.key === "KeyS") {
      setDucking(false);
    }
  });

  // Canvas / Widget click
  canvas.addEventListener("pointerdown", event => {
    event.preventDefault();
    if (state === STATE_CRASHED) {
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      const restartBtnX = cssWidth / 2 - 18;
      const restartBtnY = 60;
      if (
        clickX >= restartBtnX - 15 &&
        clickX <= restartBtnX + 51 &&
        clickY >= restartBtnY - 15 &&
        clickY <= restartBtnY + 47
      ) {
        resetGame();
        return;
      }
    }
    triggerJump();
  });

  canvas.addEventListener("pointerup", () => {
    endJumpEarly();
  });

  // Sound Toggle button
  sfxBtn?.addEventListener("click", event => {
    event.stopPropagation();
    isMuted = !isMuted;
    sfxBtn.classList.toggle("is-muted", isMuted);
    sfxBtn.textContent = isMuted ? "SFX 🔇" : "SFX 🔊";
    sfxBtn.setAttribute("aria-label", isMuted ? "Unmute Sound" : "Mute Sound");
  });

  // Drawing helpers
  const drawSpriteHDPI = (s, destX, destY, destW, destH) => {
    if (!sprite.complete || sprite.naturalWidth === 0) return;
    ctx.drawImage(
      sprite,
      s.x,
      s.y,
      s.w,
      s.h,
      Math.round(destX),
      Math.round(destY),
      Math.round(destW),
      Math.round(destH)
    );
  };

  // In-canvas digit rendering (Chromium digits: 20x26 on sprite sheet)
  const drawDigit = (val, destX, destY) => {
    if (!sprite.complete || sprite.naturalWidth === 0) return;
    const sx = 1294 + val * 20;
    const sy = 2;
    ctx.drawImage(sprite, sx, sy, 20, 26, Math.round(destX), Math.round(destY), 10, 13);
  };

  const drawScoreOnCanvas = () => {
    const scoreStr = String(score).padStart(5, "0");
    const hiStr = String(hiScore).padStart(5, "0");
    const startX = cssWidth - 65;
    const hiStartX = startX - 85;

    // High Score: 'HI ' + 5 digits
    if (hiScore > 0) {
      drawDigit(10, hiStartX, 10); // H
      drawDigit(11, hiStartX + 11, 10); // I
      for (let i = 0; i < 5; i++) {
        drawDigit(parseInt(hiStr[i], 10), hiStartX + 26 + i * 11, 10);
      }
    }

    // Current Score (flash on milestone)
    if (flashVisible) {
      for (let i = 0; i < 5; i++) {
        drawDigit(parseInt(scoreStr[i], 10), startX + i * 11, 10);
      }
    }
  };

  // Main Loop
  let lastTime = performance.now();

  const update = dt => {
    if (state === STATE_WAITING) {
      trex.blinkTimer += dt;
      if (trex.blinkTimer > 5) {
        trex.isBlinking = true;
        if (trex.blinkTimer > 5.2) {
          trex.isBlinking = false;
          trex.blinkTimer = 0;
        }
      }
      return;
    }

    if (state === STATE_PLAYING) {
      speed = Math.min(speed + acceleration * 60 * dt, maxSpeed);
      distance += speed * 60 * dt;
      const oldScore = score;
      score = Math.floor(distance / 10);

      if (hudScore) hudScore.textContent = String(score).padStart(5, "0");

      if (Math.floor(score / 100) > Math.floor(oldScore / 100) && score > 0) {
        playSound("milestone");
        flashTimer = 2.0;
      }

      if (flashTimer > 0) {
        flashTimer -= dt;
        flashVisible = Math.floor(flashTimer * 5) % 2 === 0;
      } else {
        flashVisible = true;
      }

      trex.vy += trex.gravity;
      trex.y += trex.vy;

      const currentGroundY = trex.isDucking ? groundY - trex.duckH : groundY - trex.h;
      if (trex.y >= currentGroundY) {
        trex.y = currentGroundY;
        trex.vy = 0;
        trex.isGrounded = true;
      }

      trex.runTimer += dt * (speed * 2);
      if (trex.runTimer >= 1) {
        trex.runFrame = (trex.runFrame + 1) % 2;
        trex.runTimer = 0;
      }

      horizonX = (horizonX + speed * 60 * dt) % 600;

      clouds.forEach(c => {
        c.x -= c.speed * (speed * 0.4) * 60 * dt;
        if (c.x < -60) {
          c.x = cssWidth + Math.random() * 80;
          c.y = 15 + Math.random() * 45;
        }
      });

      obstacleTimer += speed * 60 * dt;
      if (obstacleTimer > minObstacleDistance) {
        if (Math.random() < 0.06) {
          obstacleTimer = 0;
          minObstacleDistance = 180 + Math.random() * 150;

          let obsType = "small";
          const r = Math.random();
          if (score > 150 && r < 0.28) {
            obsType = "ptero";
          } else if (r < 0.6) {
            obsType = "small";
          } else {
            obsType = "large";
          }

          let count = Math.random() < 0.4 ? 2 : (Math.random() < 0.2 ? 3 : 1);
          let w = 17 * count;
          let h = 35;
          let y = groundY - 35;

          if (obsType === "large") {
            count = Math.random() < 0.35 ? 2 : 1;
            w = 25 * count;
            h = 50;
            y = groundY - 50;
          } else if (obsType === "ptero") {
            count = 1;
            w = 46;
            h = 40;
            const heights = [groundY - 32, groundY - 52, groundY - 75];
            y = heights[Math.floor(Math.random() * heights.length)];
          }

          obstacles.push({
            x: cssWidth + 20,
            y,
            w,
            h,
            type: obsType,
            count,
            frame: 0,
            frameTimer: 0
          });
        }
      }

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= speed * 60 * dt;

        if (obs.type === "ptero") {
          obs.frameTimer += dt * 6;
          if (obs.frameTimer >= 1) {
            obs.frame = (obs.frame + 1) % 2;
            obs.frameTimer = 0;
          }
        }

        const isDuck = trex.isDucking && trex.isGrounded;
        const trexBox = {
          x: trex.x + 4,
          y: isDuck ? groundY - trex.duckH + 3 : trex.y + 4,
          w: (isDuck ? trex.duckW : trex.w) - 8,
          h: (isDuck ? trex.duckH : trex.h) - 6
        };

        const obsBox = {
          x: obs.x + 3,
          y: obs.y + 3,
          w: obs.w - 6,
          h: obs.h - 6
        };

        if (
          trexBox.x < obsBox.x + obsBox.w &&
          trexBox.x + trexBox.w > obsBox.x &&
          trexBox.y < obsBox.y + obsBox.h &&
          trexBox.y + trexBox.h > obsBox.y
        ) {
          gameOver();
          break;
        }

        if (obs.x + obs.w < -30) {
          obstacles.splice(i, 1);
        }
      }
    }
  };

  const render = () => {
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    // 1. Draw Clouds
    clouds.forEach(c => {
      drawSpriteHDPI(SPRITES.CLOUD, c.x, c.y, 46, 14);
    });

    // 2. Draw Horizon Ground
    if (state !== STATE_WAITING) {
      const groundW = 600;
      let gx = -horizonX;
      while (gx < cssWidth) {
        drawSpriteHDPI(SPRITES.HORIZON, gx, groundY - 8, groundW, 12);
        gx += groundW;
      }
    } else {
      drawSpriteHDPI(SPRITES.HORIZON, 0, groundY - 8, cssWidth, 12);
    }

    // 3. Draw Obstacles
    obstacles.forEach(obs => {
      if (obs.type === "small") {
        const s = {
          x: SPRITES.CACTUS_SMALL.x,
          y: SPRITES.CACTUS_SMALL.y,
          w: 34 * obs.count,
          h: 70
        };
        drawSpriteHDPI(s, obs.x, obs.y, 17 * obs.count, 35);
      } else if (obs.type === "large") {
        const s = {
          x: SPRITES.CACTUS_LARGE.x,
          y: SPRITES.CACTUS_LARGE.y,
          w: 50 * obs.count,
          h: 100
        };
        drawSpriteHDPI(s, obs.x, obs.y, 25 * obs.count, 50);
      } else if (obs.type === "ptero") {
        const s = obs.frame === 0 ? SPRITES.PTERO1 : SPRITES.PTERO2;
        drawSpriteHDPI(s, obs.x, obs.y, 46, 40);
      }
    });

    // 4. Draw Trex
    let trexSprite;
    let dw = trex.w;
    let dh = trex.h;
    let dy = trex.y;

    if (state === STATE_CRASHED) {
      trexSprite = SPRITES.TREX_CRASH;
    } else if (trex.isDucking && trex.isGrounded) {
      trexSprite = trex.runFrame === 0 ? SPRITES.TREX_DUCK1 : SPRITES.TREX_DUCK2;
      dw = trex.duckW;
      dh = trex.duckH;
      dy = groundY - trex.duckH;
    } else if (!trex.isGrounded) {
      trexSprite = SPRITES.TREX_STAND;
    } else if (state === STATE_PLAYING) {
      trexSprite = trex.runFrame === 0 ? SPRITES.TREX_RUN1 : SPRITES.TREX_RUN2;
    } else {
      trexSprite = trex.isBlinking ? SPRITES.TREX_BLINK : SPRITES.TREX_STAND;
      dy = groundY - trex.h;
    }

    drawSpriteHDPI(trexSprite, trex.x, dy, dw, dh);

    // 5. Draw in-canvas Score Meter
    if (state !== STATE_WAITING) {
      drawScoreOnCanvas();
    }

    // 6. Draw Game Over Overlay
    if (state === STATE_CRASHED) {
      const centerX = cssWidth / 2;
      drawSpriteHDPI(SPRITES.TEXT_GAME_OVER, centerX - 95, 35, 191, 11);
      drawSpriteHDPI(SPRITES.RESTART, centerX - 18, 60, 36, 32);
    }
  };

  const loop = now => {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    update(dt);
    render();

    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
