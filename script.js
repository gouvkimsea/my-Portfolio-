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
let activeLink = $(".nav-link.active", navLinksContainer) || navLinks[0];

// Header Scroll Morphing (smean.ai floating glass capsule effect)
window.addEventListener("scroll", () => {
  const isScrolled = window.scrollY > 30;
  header?.classList.toggle("scrolled", isScrolled);
}, { passive: true });

// Smean.ai Sliding Magnetic Pill Indicator
const updateNavIndicator = (targetLink, animateSound = false) => {
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

  if (animateSound && typeof playSound === "function") {
    playSound("key");
  }
};

// Hover and Click Handlers for Nav Links
navLinks.forEach(link => {
  link.addEventListener("mouseenter", () => {
    updateNavIndicator(link, true);
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

// Mobile navigation menu
const menuToggle = $("#menuToggle");
const menu = $("#mainMenu");
const closeMenu = () => {
  menu.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
};
menuToggle?.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  if (typeof playSound === "function") playSound("click");
});
$$(".nav-link").forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("click", event => {
  if (menu.classList.contains("open") && !menu.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeMenu();
    closeModal();
    closeResumeModal();
  }
});

// Theme Controller (Dark Mode by default with user toggle and persistence)
const savedTheme = localStorage.getItem("portfolio-theme");
const initialTheme = savedTheme || "dark";

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
  playSound("click");
  return next;
};

$("#themeToggle")?.addEventListener("click", toggleTheme);

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
  if (!localStorage.getItem("portfolio-theme")) {
    setTheme(e.matches ? "dark" : "light", false);
  }
});

// ==========================================================================
// Tactile Procedural Web Audio FX & Sound Toggle Controller
// ==========================================================================
let audioContext = null;
let soundMuted = localStorage.getItem("portfolio_sound_muted") === "true";

const getWebAudio = () => {
  if (!audioContext) {
    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (AudioClass) audioContext = new AudioClass();
  }
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
};

const playSound = type => {
  if (soundMuted) return;
  try {
    const ctx = getWebAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === "key") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(380 + Math.random() * 80, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    } else if (type === "modal") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.07);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === "success") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.05);
      osc.frequency.setValueAtTime(659.25, now + 0.10);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === "matrix") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.16);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    }
  } catch (e) {}
};

const soundToggle = $("#soundToggle");
const soundIcon = $("#soundIcon");
const soundLabel = $("#soundLabel");

const updateSoundUI = () => {
  if (!soundToggle) return;
  soundToggle.classList.toggle("is-active", !soundMuted);
  if (soundIcon) soundIcon.textContent = soundMuted ? "🔇" : "🔊";
  if (soundLabel) soundLabel.textContent = soundMuted ? "MUTE" : "SFX";
  soundToggle.setAttribute("aria-label", soundMuted ? "Sound muted (click to unmute)" : "Sound enabled (click to mute)");
};

soundToggle?.addEventListener("click", () => {
  getWebAudio();
  soundMuted = !soundMuted;
  localStorage.setItem("portfolio_sound_muted", soundMuted ? "true" : "false");
  updateSoundUI();
  if (!soundMuted) playSound("click");
});

updateSoundUI();

// ==========================================================================
// ⌘K Command Palette Controller
// ==========================================================================
const cmdKModal = $("#cmdKModal");
const cmdKBtn = $("#cmdKBtn");
const cmdKInput = $("#cmdKInput");
const cmdKResults = $("#cmdKResults");

const openCmdK = () => {
  if (!cmdKModal) return;
  playSound("modal");
  cmdKModal.showModal();
  if (cmdKInput) {
    cmdKInput.value = "";
    cmdKInput.focus();
  }
  filterCmdK("");
};

const closeCmdK = () => {
  if (cmdKModal && cmdKModal.open) {
    playSound("modal");
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
  } else if (action === "play-game") {
    const gameWidget = $("#starGameWidget");
    if (gameWidget) {
      gameWidget.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => gameWidget.focus(), 350);
    }
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
  playSound("click");
  runCodeBtn.style.pointerEvents = "none";
  runCodeBtn.innerHTML = "<span>↻</span> Compiling...";
  codeConsole?.classList.add("active");
  if (consoleText) consoleText.textContent = "compiling about-me.js [ES2026]...";

  setTimeout(() => {
    runCodeBtn.style.pointerEvents = "";
    runCodeBtn.innerHTML = "<span>✓</span> Executed";
    playSound("success");
    if (consoleText) consoleText.innerHTML = "<b>Gouv Kimsea</b> &lt;status: 'curious'&gt; · Ready to ship!";
    setTimeout(() => {
      runCodeBtn.innerHTML = "<span>▶</span> Run";
      codeConsole?.classList.remove("active");
    }, 4500);
  }, 650);
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
  playSound("click");
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
    playSound("click");
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
  playSound("modal");
  modal.showModal();
  $("#modalClose")?.focus();
};

const closeModal = () => {
  if (modal?.open) {
    playSound("modal");
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

// 8. Interactive Terminal with History, Matrix & Neofetch
const terminal = $("#terminal");
const terminalOutput = $("#terminalOutput");
const terminalInput = $("#terminalInput");
const commandHistory = [];
let historyIndex = -1;

const terminalCommands = {
  help: "Available commands: <b>about</b>, <b>education</b>, <b>skills</b>, <b>projects</b>, <b>pinit</b>, <b>miniworld</b>, <b>devpulse</b>, <b>portfolio</b>, <b>achievements</b>, <b>work</b>, <b>contact</b>, <b>resume</b>, <b>play</b>, <b>dino</b>, <b>stats</b>, <b>matrix</b>, <b>neofetch</b>, <b>theme</b>, <b>search</b>, <b>github</b>, <b>linkedin</b>, <b>whoami</b>, <b>date</b>, <b>clear</b>",
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
Illustrated Achievements & Accolades:
----------------------------------------
1. Multi-Product Velocity (4 Shipped Apps: PinitAI, Mini World, DevPulse, Portfolio)
2. Procedural WebGL 3D Engine (Pure WebGL, GLSL Shaders, 60 FPS)
3. Pinit Threat Intelligence (AI Phishing & Scam Indicator Heuristics)
4. 15+ Public Repositories (Continuous Git Velocity & Open Source)
5. Computer Science Rigor (Algorithms, Data Structures, C++, SQL)
6. Bespoke Interactive Craft (Terminal CLI, Chrome Dino Runner, Custom Physics)
Scrolled to Section 05: Achievements!</pre>`;
  },
  accolades: () => {
    const el = document.getElementById("achievements");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    return "Scrolled to Section 05: Illustrated Achievements!";
  },
  trophies: () => {
    const el = document.getElementById("achievements");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    return "Scrolled to Section 05: Illustrated Achievements!";
  },
  starrunner: () => {
    const el = document.getElementById("starGameWidget");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
    return "Scrolled to Chrome Dino Runner in Bento Grid! Press SPACE or Tap to Play!";
  },
  game: () => {
    const el = document.getElementById("starGameWidget");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
    return "Scrolled to Chrome Dino Runner in Bento Grid! Press SPACE or Tap to Play!";
  },
  dino: () => {
    const el = document.getElementById("starGameWidget");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
    return "Scrolled to Chrome Dino Runner in Bento Grid! Press SPACE or Tap to Play!";
  },
  trex: () => {
    const el = document.getElementById("starGameWidget");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
    return "Scrolled to Chrome Dino Runner in Bento Grid! Press SPACE or Tap to Play!";
  },
  play: () => {
    window.open("miniworld.html", "_blank");
    return "Launching Mini World 3D Planet Simulation in a new tab...";
  },
  "3d": () => {
    window.open("miniworld.html", "_blank");
    return "Launching Mini World 3D Planet Simulation in a new tab...";
  },
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
                   Status: Open to learning & building</pre>`;
  },
  matrix: () => {
    playSound("matrix");
    const chars = "010101GKDEVPOWERCURIOSITYBUILDSHIPEVAL1001";
    let output = "";
    for (let i = 0; i < 6; i++) {
      let line = "";
      for (let j = 0; j < 40; j++) {
        line += chars[Math.floor(Math.random() * chars.length)];
      }
      output += line + "\n";
    }
    return `<pre style="color:#00ff66;font-family:monospace;letter-spacing:2px;font-size:11px;">${output}\n// MATRIX FLOW INITIALIZED // Welcome to the grid, agent.</pre>`;
  },
  contact: () => {
    const el = document.getElementById("contact");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    return "LET'S WORK. Direct channels:\n• Email: <a href='mailto:gouvkimsea@gmail.com' style='color:var(--lime)'>gouvkimsea@gmail.com</a>\n• GitHub: <a href='https://github.com/gouvkimsea' target='_blank' style='color:var(--lime)'>github.com/gouvkimsea</a>\n• LinkedIn: <a href='https://linkedin.com/in/gouvkimsea' target='_blank' style='color:var(--lime)'>linkedin.com/in/gouvkimsea</a>";
  },
  work: () => terminalCommands.contact(),
  whoami: "guest@gouvkimsea.dev — welcome, curious visitor!",
  github: "Opening GitHub profile in a new tab...",
  linkedin: "Opening LinkedIn profile in a new tab...",
  date: () => new Date().toLocaleString(),
  sudo: "Permission denied: You are already in full control of this portfolio.",
  "cat about-me.js": "const developer = {\n  name: 'Gouv Kimsea',\n  focus: 'building & learning',\n  status: 'curious',\n  coffee: true\n};"
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
    playSound("click");
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
  } else if (event.key.length === 1 || event.key === "Backspace" || event.key === "Enter") {
    playSound("key");
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
      playSound(isSuccess ? "success" : "click");
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
      playSound("click");
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
    playSound("click");
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
// CLASSIC CHROME DINO RUNNER GAME ENGINE (Bento Grid Interactive Game)
// Authentic Google Chrome T-Rex runner with jump, duck, cacti & pterodactyls
// ==========================================================================
(function initChromeDinoGame() {
  const widget = document.getElementById("starGameWidget") || document.getElementById("dinoGameWidget");
  const canvas = document.getElementById("starGameCanvas") || document.getElementById("dinoGameCanvas");
  if (!widget || !canvas) return;

  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("starGameOverlay") || document.getElementById("dinoGameOverlay");
  const overlayMsg = document.getElementById("starGameMsg") || document.getElementById("dinoGameMsg");
  const scoreEl = document.getElementById("starGameScore") || document.getElementById("dinoGameScore");
  const hiScoreEl = document.getElementById("starGameHi") || document.getElementById("dinoGameHi");
  const soundBtn = document.getElementById("starGameSoundBtn") || document.getElementById("dinoGameSoundBtn");

  // Pixel Sprite Definitions (Authentic Google Chrome T-Rex sprites)
  const SPRITES = {
    dinoStand: [
      "              XXXXXX",
      "             XXXXXXX",
      "             XX XXXX",
      "             XXXXXXX",
      "             XXXXXXX",
      "             XXXXX  ",
      "             XXXXXXX",
      "             XXXX   ",
      "  XX        XXXXX   ",
      "  XXX      XXXXXX   ",
      "  XXXXXXXXXXXXXX    ",
      "  XXXXXXXXXXXXX     ",
      "   XXXXXXXXXXXX     ",
      "    XXXXXXXXXXX  X  ",
      "     XXXXXXXXXXXXX  ",
      "      XXXXXXXXXX    ",
      "       XXXXXXXX     ",
      "        XXXXXX      ",
      "         XXXX       ",
      "         XX XX      ",
      "         XX XX      ",
      "         XX XX      ",
      "         XX XX      ",
      "        XXX XXX     "
    ],
    dinoRun1: [
      "              XXXXXX",
      "             XXXXXXX",
      "             XX XXXX",
      "             XXXXXXX",
      "             XXXXXXX",
      "             XXXXX  ",
      "             XXXXXXX",
      "             XXXX   ",
      "  XX        XXXXX   ",
      "  XXX      XXXXXX   ",
      "  XXXXXXXXXXXXXX    ",
      "  XXXXXXXXXXXXX     ",
      "   XXXXXXXXXXXX     ",
      "    XXXXXXXXXXX  X  ",
      "     XXXXXXXXXXXXX  ",
      "      XXXXXXXXXX    ",
      "       XXXXXXXX     ",
      "        XXXXXX      ",
      "         XXXX       ",
      "         XX XX      ",
      "         XX  X      ",
      "         XX         ",
      "         XX         ",
      "        XXX         "
    ],
    dinoRun2: [
      "              XXXXXX",
      "             XXXXXXX",
      "             XX XXXX",
      "             XXXXXXX",
      "             XXXXXXX",
      "             XXXXX  ",
      "             XXXXXXX",
      "             XXXX   ",
      "  XX        XXXXX   ",
      "  XXX      XXXXXX   ",
      "  XXXXXXXXXXXXXX    ",
      "  XXXXXXXXXXXXX     ",
      "   XXXXXXXXXXXX     ",
      "    XXXXXXXXXXX  X  ",
      "     XXXXXXXXXXXXX  ",
      "      XXXXXXXXXX    ",
      "       XXXXXXXX     ",
      "        XXXXXX      ",
      "         XXXX       ",
      "         XX XX      ",
      "          X XX      ",
      "            XX      ",
      "            XX      ",
      "           XXX      "
    ],
    dinoCrash: [
      "              XXXXXX",
      "             XXXXXXX",
      "             X X XXX",
      "             XXXXXXX",
      "             XXXXXXX",
      "             XXXXX  ",
      "             XXXXXXX",
      "             XXXX   ",
      "  XX        XXXXX   ",
      "  XXX      XXXXXX   ",
      "  XXXXXXXXXXXXXX    ",
      "  XXXXXXXXXXXXX     ",
      "   XXXXXXXXXXXX     ",
      "    XXXXXXXXXXX  X  ",
      "     XXXXXXXXXXXXX  ",
      "      XXXXXXXXXX    ",
      "       XXXXXXXX     ",
      "        XXXXXX      ",
      "         XXXX       ",
      "         XX XX      ",
      "         XX XX      ",
      "         XX XX      ",
      "         XX XX      ",
      "        XXX XXX     "
    ],
    dinoDuck1: [
      "                 XXXXXX       ",
      "                XXXXXXXX      ",
      "                XX XXXX       ",
      "                XXXXXXXX      ",
      "                XXXXXXXX      ",
      "  XX            XXXXX         ",
      "  XXX          XXXXXXXX       ",
      "  XXXXXXXXXXXXXXXXXXXXX       ",
      "  XXXXXXXXXXXXXXXXXXXXX       ",
      "   XXXXXXXXXXXXXXXXXXX        ",
      "    XXXXXXXXXXXXXXXX          ",
      "     XXXXXXXXXXXX             ",
      "      XX   XX                 ",
      "      XXX                     "
    ],
    dinoDuck2: [
      "                 XXXXXX       ",
      "                XXXXXXXX      ",
      "                XX XXXX       ",
      "                XXXXXXXX      ",
      "                XXXXXXXX      ",
      "  XX            XXXXX         ",
      "  XXX          XXXXXXXX       ",
      "  XXXXXXXXXXXXXXXXXXXXX       ",
      "  XXXXXXXXXXXXXXXXXXXXX       ",
      "   XXXXXXXXXXXXXXXXXXX        ",
      "    XXXXXXXXXXXXXXXX          ",
      "     XXXXXXXXXXXX             ",
      "      XX   XX                 ",
      "           XXX                "
    ],
    cactusSmall: [
      "    XX    ",
      "    XX    ",
      "XX  XX    ",
      "XX  XX  XX",
      "XX  XX  XX",
      "XX  XX  XX",
      "XX  XX  XX",
      "XXXXXX  XX",
      "  XXXX  XX",
      "    XXXXXX",
      "    XXXX  ",
      "    XX    ",
      "    XX    ",
      "    XX    ",
      "    XX    ",
      "    XX    ",
      "    XX    ",
      "    XX    ",
      "    XX    ",
      "    XX    "
    ],
    cactusDouble: [
      "    XX        XX    ",
      "    XX        XX    ",
      "XX  XX    XX  XX    ",
      "XX  XX  XXXX  XX  XX",
      "XX  XX  XXXX  XX  XX",
      "XX  XX  XXXX  XX  XX",
      "XXXXXX  XXXX  XXXXXX",
      "  XXXX    XXXXXX  XX",
      "    XXXX    XXXXXX  ",
      "    XX        XX    ",
      "    XX        XX    ",
      "    XX        XX    ",
      "    XX        XX    ",
      "    XX        XX    ",
      "    XX        XX    ",
      "    XX        XX    ",
      "    XX        XX    ",
      "    XX        XX    ",
      "    XX        XX    ",
      "    XX        XX    "
    ],
    cactusLarge: [
      "     XXXX     ",
      "     XXXX     ",
      "     XXXX     ",
      "XX   XXXX     ",
      "XX   XXXX   XX",
      "XX   XXXX   XX",
      "XX   XXXX   XX",
      "XX   XXXX   XX",
      "XXXX XXXXXX XX",
      " XXXXXXXX XXXX",
      "   XXXXXX   XX",
      "     XXXX     ",
      "     XXXX     ",
      "     XXXX     ",
      "     XXXX     ",
      "     XXXX     ",
      "     XXXX     ",
      "     XXXX     ",
      "     XXXX     ",
      "     XXXX     ",
      "     XXXX     ",
      "     XXXX     ",
      "     XXXX     ",
      "     XXXX     ",
      "     XXXX     ",
      "     XXXX     "
    ],
    bird1: [
      "        XX              ",
      "       XXXX             ",
      "      XXXXXX            ",
      "     XXXXXXXX           ",
      "    XXXXXXXXXX          ",
      "   XXXXXXXXXXXX   XXXX  ",
      "  XXXXXXXXXXXXXX XXXXXX ",
      " XXXXXXXXXXXXXXXXXXXXXX ",
      "  XXXXXXXXXXXXXXXXXXXXX ",
      "   XXXXXXXXXXXXXXXXXXXX ",
      "    XXXX                ",
      "     XX                 ",
      "      X                 ",
      "                        ",
      "                        ",
      "                        "
    ],
    bird2: [
      "                        ",
      "                        ",
      "                        ",
      "                  XXXX  ",
      "                 XXXXXX ",
      "   XXXXXXXXXXXXX XXXXXX ",
      "  XXXXXXXXXXXXXXXXXXXXX ",
      " XXXXXXXXXXXXXXXXXXXXXX ",
      "  XXXXXXXXXXXXXXXXXXXXX ",
      "   XXXXXXXXXXXXXXXXXXXX ",
      "    XXXXXXXXXX          ",
      "     XXXXXXXX           ",
      "      XXXXXX            ",
      "       XXXX             ",
      "        XX              ",
      "         X              "
    ],
    cloud: [
      "         XXXXXX           ",
      "       XXXXXXXXXX         ",
      "      XXXXXXXXXXXX        ",
      "    XXXXXXXXXXXXXXXX      ",
      "  XXXXXXXXXXXXXXXXXXXX    ",
      " XXXXXXXXXXXXXXXXXXXXXX   ",
      "XXXXXXXXXXXXXXXXXXXXXXXX  ",
      "XXXXXXXXXXXXXXXXXXXXXXXXXX"
    ]
  };

  // Helper: Draw Pixel Grid
  const drawSprite = (sprite, px, py, scale, color) => {
    ctx.fillStyle = color;
    for (let r = 0; r < sprite.length; r++) {
      const row = sprite[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] === "X") {
          ctx.fillRect(Math.floor(px + c * scale), Math.floor(py + r * scale), Math.ceil(scale), Math.ceil(scale));
        }
      }
    }
  };

  // Web Audio Synthesizer (Classic 8-bit Google Chrome Dino sounds)
  let audioCtx = null;
  let isMuted = localStorage.getItem("star_game_muted") === "true";
  if (soundBtn) soundBtn.textContent = isMuted ? "MUTE" : "SFX";

  soundBtn?.addEventListener("click", e => {
    e.stopPropagation();
    isMuted = !isMuted;
    localStorage.setItem("star_game_muted", isMuted ? "true" : "false");
    soundBtn.textContent = isMuted ? "MUTE" : "SFX";
    if (!isMuted) playSoundFx("jump");
  });

  const getAudioContext = () => {
    if (!audioCtx) {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      if (AudioClass) audioCtx = new AudioClass();
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  };

  const playSoundFx = type => {
    if (isMuted) return;
    try {
      const actx = getAudioContext();
      if (!actx) return;
      const now = actx.currentTime;

      if (type === "jump") {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "milestone") {
        [587, 880].forEach((freq, idx) => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.14, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.09);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.09);
        });
      } else if (type === "hit") {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (err) {}
  };

  // High Score Storage
  let hiScore = parseInt(localStorage.getItem("chrome_dino_hi") || localStorage.getItem("star_runner_hi") || "0", 10);
  if (hiScoreEl) hiScoreEl.textContent = "HI " + String(hiScore).padStart(5, "0");

  // Dimensions & Canvas Setup
  let cssWidth = 340;
  let cssHeight = 120;
  let dpr = 1;
  let groundY = 100;
  const pixelScale = 1.35; // Sharp pixel scaling

  const resize = () => {
    cssWidth = widget.clientWidth || 340;
    cssHeight = 120;
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    groundY = cssHeight - 20;
  };
  resize();
  window.addEventListener("resize", resize);

  // Clouds drifting in background
  const clouds = [
    { x: 50, y: 18, speed: 0.3 },
    { x: 190, y: 28, speed: 0.25 },
    { x: 310, y: 15, speed: 0.35 }
  ];

  // Ground bump textures
  const groundBumps = [];
  for (let i = 0; i < 40; i++) {
    groundBumps.push({
      x: i * 16 + (Math.random() * 6),
      w: Math.random() > 0.5 ? 2 : 4,
      h: Math.random() > 0.6 ? 2 : 1
    });
  }

  // Game States
  const STATE_IDLE = "idle";
  const STATE_PLAYING = "playing";
  const STATE_GAMEOVER = "gameover";
  let state = STATE_IDLE;

  let speed = 4.2;
  let distance = 0;
  let score = 0;
  let nextObstacleDistance = 180;
  let milestoneHit = {};

  // Dino Character
  const dino = {
    x: 36,
    y: groundY - 24 * pixelScale,
    w: 20 * pixelScale,
    h: 24 * pixelScale,
    vy: 0,
    gravity: 0.46,
    jumpForce: -7.8,
    isGrounded: true,
    isDucking: false,
    runFrame: 0,
    animTimer: 0
  };

  let obstacles = [];

  // Reset & Start
  const startGame = () => {
    getAudioContext();
    state = STATE_PLAYING;
    speed = 4.2;
    distance = 0;
    score = 0;
    milestoneHit = {};
    obstacles = [];

    dino.y = groundY - 24 * pixelScale;
    dino.vy = 0;
    dino.isGrounded = true;
    dino.isDucking = false;
    dino.runFrame = 0;
    nextObstacleDistance = 180;

    overlay?.classList.add("hidden");
    scoreEl?.classList.remove("milestone-flash");
    if (scoreEl) scoreEl.textContent = "00000";

    playSoundFx("jump");
  };

  // Game Over
  const triggerGameOver = () => {
    state = STATE_GAMEOVER;
    playSoundFx("hit");

    if (score > hiScore) {
      hiScore = score;
      localStorage.setItem("chrome_dino_hi", String(hiScore));
      if (hiScoreEl) hiScoreEl.textContent = "HI " + String(hiScore).padStart(5, "0");
    }

    if (overlay && overlayMsg) {
      overlayMsg.innerHTML = `GAME OVER<br/><span style="font-size:9px;color:var(--muted)">SCORE: ${score} • BEST: ${hiScore}</span><br/><span style="color:var(--orange)">PRESS SPACE OR TAP TO RETRY ↻</span>`;
      overlay.classList.remove("hidden");
    }
  };

  // Jump & Duck Controls
  const handleJump = () => {
    if (state === STATE_IDLE || state === STATE_GAMEOVER) {
      startGame();
      return;
    }
    if (state === STATE_PLAYING && dino.isGrounded) {
      dino.vy = dino.jumpForce;
      dino.isGrounded = false;
      playSoundFx("jump");
    }
  };

  const handleEndJump = () => {
    if (state === STATE_PLAYING && dino.vy < -3.5) {
      dino.vy = -3.5; // Short-hop release
    }
  };

  const handleDuck = ducking => {
    if (state !== STATE_PLAYING) return;
    dino.isDucking = ducking;
    if (ducking && !dino.isGrounded) {
      dino.vy += dino.gravity * 1.8; // Fast drop
    }
  };

  // Keyboard
  window.addEventListener("keydown", e => {
    const isWidgetTarget = widget.contains(document.activeElement) || widget.matches(":hover");
    if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
      if (isWidgetTarget || state === STATE_PLAYING) {
        e.preventDefault();
        handleJump();
      }
    } else if (["ArrowDown", "KeyS"].includes(e.code)) {
      if (isWidgetTarget || state === STATE_PLAYING) {
        e.preventDefault();
        handleDuck(true);
      }
    }
  });

  window.addEventListener("keyup", e => {
    if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
      if (state === STATE_PLAYING) handleEndJump();
    } else if (["ArrowDown", "KeyS"].includes(e.code)) {
      if (state === STATE_PLAYING) handleDuck(false);
    }
  });

  // Touch & Pointer
  const viewport = widget.querySelector(".game-viewport");
  viewport?.addEventListener("pointerdown", e => {
    widget.focus();
    handleJump();
  });
  viewport?.addEventListener("pointerup", () => {
    handleEndJump();
  });

  // 60FPS Game Loop with Viewport Visibility Optimization
  let lastTime = performance.now();
  let isGameVisible = true;
  let gameRafId = null;

  const startGameLoop = () => {
    if (!gameRafId && isGameVisible) {
      lastTime = performance.now();
      gameRafId = requestAnimationFrame(gameLoop);
    }
  };

  const stopGameLoop = () => {
    if (gameRafId) {
      cancelAnimationFrame(gameRafId);
      gameRafId = null;
    }
  };

  if ("IntersectionObserver" in window) {
    const gameObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        isGameVisible = entry.isIntersecting;
        if (isGameVisible) {
          startGameLoop();
        } else {
          stopGameLoop();
        }
      });
    }, { threshold: 0.05 });
    gameObserver.observe(widget);
  }

  const gameLoop = now => {
    if (!isGameVisible) {
      gameRafId = null;
      return;
    }
    gameRafId = requestAnimationFrame(gameLoop);
    const dt = Math.min((now - lastTime) / 16.666, 2.5);
    lastTime = now;

    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    const dinoColor = isLight ? "#535353" : "#f0f0ea";
    const groundColor = isLight ? "rgba(83, 83, 83, 0.45)" : "rgba(225, 230, 245, 0.35)";
    const cloudColor = isLight ? "rgba(180, 185, 195, 0.5)" : "rgba(255, 255, 255, 0.25)";

    // Clear Canvas
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    // 1. Draw Clouds
    clouds.forEach(c => {
      if (state === STATE_PLAYING) {
        c.x -= (c.speed + speed * 0.08) * dt;
        if (c.x < -40) c.x = cssWidth + 20;
      }
      drawSprite(SPRITES.cloud, c.x, c.y, pixelScale * 0.9, cloudColor);
    });

    // 2. Draw Ground Track & Bumps
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(cssWidth, groundY);
    ctx.strokeStyle = groundColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    groundBumps.forEach(b => {
      if (state === STATE_PLAYING) {
        b.x -= speed * dt;
        if (b.x < -10) b.x = cssWidth + Math.random() * 20;
      }
      ctx.fillStyle = groundColor;
      ctx.fillRect(Math.floor(b.x), groundY + 2, b.w, b.h);
    });

    // 3. Update Obstacles & Spawning
    if (state === STATE_PLAYING) {
      distance += speed * dt;
      speed = Math.min(8.6, 4.2 + (distance * 0.0014));

      score = Math.floor(distance * 0.16);
      if (scoreEl) scoreEl.textContent = String(score).padStart(5, "0");

      // Milestone Fanfare (every 100 points)
      const curHundred = Math.floor(score / 100);
      if (curHundred > 0 && !milestoneHit[curHundred]) {
        milestoneHit[curHundred] = true;
        playSoundFx("milestone");
        scoreEl?.classList.add("milestone-flash");
        setTimeout(() => scoreEl?.classList.remove("milestone-flash"), 1200);
      }

      // Spawning Obstacles
      nextObstacleDistance -= speed * dt;
      if (nextObstacleDistance <= 0) {
        const roll = Math.random();
        if (score > 120 && roll > 0.65) {
          // Flying Pterodactyl Bird
          const birdY = roll > 0.88 ? groundY - 50 : (roll > 0.76 ? groundY - 36 : groundY - 24);
          obstacles.push({
            type: "bird",
            x: cssWidth + 20,
            y: birdY,
            w: 24 * pixelScale,
            h: 16 * pixelScale,
            frame: 0,
            animTimer: 0
          });
        } else if (roll > 0.35) {
          // Large Cactus
          obstacles.push({
            type: "cactusLarge",
            x: cssWidth + 20,
            y: groundY - 26 * pixelScale,
            w: 14 * pixelScale,
            h: 26 * pixelScale
          });
        } else if (roll > 0.18) {
          // Double Small Cactus
          obstacles.push({
            type: "cactusDouble",
            x: cssWidth + 20,
            y: groundY - 20 * pixelScale,
            w: 20 * pixelScale,
            h: 20 * pixelScale
          });
        } else {
          // Single Small Cactus
          obstacles.push({
            type: "cactusSmall",
            x: cssWidth + 20,
            y: groundY - 20 * pixelScale,
            w: 10 * pixelScale,
            h: 20 * pixelScale
          });
        }
        nextObstacleDistance = Math.random() * 150 + (170 - Math.min(65, speed * 6));
      }
    }

    // Render Obstacles & Collision Check
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      if (state === STATE_PLAYING) obs.x -= speed * dt;

      if (obs.type === "cactusSmall") {
        drawSprite(SPRITES.cactusSmall, obs.x, obs.y, pixelScale, dinoColor);
      } else if (obs.type === "cactusDouble") {
        drawSprite(SPRITES.cactusDouble, obs.x, obs.y, pixelScale, dinoColor);
      } else if (obs.type === "cactusLarge") {
        drawSprite(SPRITES.cactusLarge, obs.x, obs.y, pixelScale, dinoColor);
      } else if (obs.type === "bird") {
        obs.animTimer += dt;
        if (obs.animTimer > 8) {
          obs.animTimer = 0;
          obs.frame = 1 - obs.frame;
        }
        const birdSprite = obs.frame === 0 ? SPRITES.bird1 : SPRITES.bird2;
        drawSprite(birdSprite, obs.x, obs.y, pixelScale, dinoColor);
      }

      // Hitbox Collision Check
      if (state === STATE_PLAYING) {
        // Dino Box
        const isDuck = dino.isDucking && dino.isGrounded;
        const dinoBox = {
          x: dino.x + 3,
          y: isDuck ? groundY - 14 * pixelScale + 2 : dino.y + 2,
          w: (isDuck ? 30 : 20) * pixelScale - 6,
          h: (isDuck ? 14 : 24) * pixelScale - 4
        };

        // Obstacle Box (grace inset of 2px)
        const obsBox = {
          x: obs.x + 2,
          y: obs.y + 2,
          w: obs.w - 4,
          h: obs.h - 4
        };

        if (
          dinoBox.x < obsBox.x + obsBox.w &&
          dinoBox.x + dinoBox.w > obsBox.x &&
          dinoBox.y < obsBox.y + obsBox.h &&
          dinoBox.y + dinoBox.h > obsBox.y
        ) {
          triggerGameOver();
          break;
        }
      }

      if (obs.x < -60) obstacles.splice(i, 1);
    }

    // 4. Update Dino Physics
    if (state === STATE_IDLE) {
      dino.y = groundY - 24 * pixelScale;
      dino.isGrounded = true;
    } else if (state === STATE_PLAYING) {
      dino.vy += dino.gravity * dt;
      dino.y += dino.vy * dt;

      const groundTarget = groundY - 24 * pixelScale;
      if (dino.y >= groundTarget) {
        dino.y = groundTarget;
        dino.vy = 0;
        dino.isGrounded = true;
      }

      // Run Animation
      dino.animTimer += dt;
      if (dino.animTimer > Math.max(3.5, 7 - speed * 0.4)) {
        dino.animTimer = 0;
        dino.runFrame = 1 - dino.runFrame;
      }
    }

    // 5. Draw T-Rex
    let currentDinoSprite = SPRITES.dinoStand;
    let drawY = dino.y;

    if (state === STATE_GAMEOVER) {
      currentDinoSprite = SPRITES.dinoCrash;
    } else if (!dino.isGrounded) {
      currentDinoSprite = SPRITES.dinoStand;
    } else if (dino.isDucking) {
      currentDinoSprite = dino.runFrame === 0 ? SPRITES.dinoDuck1 : SPRITES.dinoDuck2;
      drawY = groundY - 14 * pixelScale;
    } else if (state === STATE_PLAYING) {
      currentDinoSprite = dino.runFrame === 0 ? SPRITES.dinoRun1 : SPRITES.dinoRun2;
    }

    drawSprite(currentDinoSprite, dino.x, drawY, pixelScale, dinoColor);

    // 6. Draw In-Canvas Game Over Banner (Direct on canvas, no floating DOM overlay)
    if (state === STATE_GAMEOVER) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Backdrop badge
      ctx.fillStyle = isLight ? "rgba(255, 255, 255, 0.88)" : "rgba(18, 19, 16, 0.88)";
      ctx.fillRect(cssWidth / 2 - 110, cssHeight / 2 - 24, 220, 48);

      ctx.strokeStyle = isLight ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.strokeRect(cssWidth / 2 - 110, cssHeight / 2 - 24, 220, 48);

      // GAME OVER Text
      ctx.font = `bold 12px "DM Mono", monospace`;
      ctx.fillStyle = dinoColor;
      ctx.fillText("G A M E   O V E R", cssWidth / 2, cssHeight / 2 - 8);

      // Retry hint
      ctx.font = `9.5px "DM Mono", monospace`;
      ctx.fillStyle = isLight ? "#c2410c" : "#e7f26d";
      ctx.fillText("SPACE OR TAP TO RETRY ↻", cssWidth / 2, cssHeight / 2 + 10);
      ctx.restore();
    }
  };

  startGameLoop();
})();

