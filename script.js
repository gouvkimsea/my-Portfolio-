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
// ⌘K Command Palette Controller (Replaces sound track)
// ==========================================================================
const playSound = () => {}; // Sound effects removed

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

// Global Keyboard Shortcut: ⌘K or Ctrl+K
document.addEventListener("keydown", e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
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
  } else if (action === "view-resume") {
    openResumeModal();
  } else if (action === "toggle-theme") {
    toggleTheme();
  } else if (action === "github") {
    window.open("https://github.com/gouvkimsea", "_blank", "noopener,noreferrer");
  }
});

// ==========================================================================
// Interactive Hero Canvas (Floating Cyber Constellation & Twinkling Stars)
// ==========================================================================
const canvas = $("#heroCanvas");
if (canvas) {
  const ctx = canvas.getContext("2d");
  let width, height, particles = [];
  let mouse = { x: -1000, y: -1000 };

  const resize = () => {
    width = canvas.width = canvas.parentElement.offsetWidth;
    height = canvas.height = canvas.parentElement.offsetHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }, { passive: true });

  window.addEventListener("mouseleave", () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  const count = Math.min(Math.floor(width / 24), 52);
  for (let i = 0; i < count; i++) {
    const isSpecial = Math.random() > 0.6;
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      baseRadius: Math.random() * 1.5 + (isSpecial ? 1.8 : 1.0),
      isSparkle: isSpecial,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.03 + 0.015,
      type: Math.random() > 0.45 ? 0 : (Math.random() > 0.5 ? 1 : 2)
    });
  }

  // Draw 4-point star glint for sparkling stars
  const drawSparkleStar = (cx, cy, outerR, innerR, angle) => {
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a1 = angle + (i * Math.PI) / 2;
      const a2 = a1 + Math.PI / 4;
      if (i === 0) {
        ctx.moveTo(cx + Math.cos(a1) * outerR, cy + Math.sin(a1) * outerR);
      } else {
        ctx.lineTo(cx + Math.cos(a1) * outerR, cy + Math.sin(a1) * outerR);
      }
      ctx.lineTo(cx + Math.cos(a2) * innerR, cy + Math.sin(a2) * innerR);
    }
    ctx.closePath();
    ctx.fill();
  };

  const renderParticles = () => {
    ctx.clearRect(0, 0, width, height);
    const isLight = document.documentElement.getAttribute("data-theme") === "light";

    // Theme-tailored star color palettes
    // Light mode: deep sapphire, vivid cosmic amber, stellar slate obsidian for maximum visibility & appeal
    // Dark mode: glowing lime, warm solar coral, cosmic cyan
    const lightColors = [
      { r: 30, g: 85, b: 220 },   // Deep Royal Sapphire
      { r: 225, g: 75, b: 15 },   // Radiant Cosmic Amber
      { r: 35, g: 45, b: 65 }     // Stellar Slate Obsidian
    ];
    const darkColors = [
      { r: 231, g: 242, b: 109 }, // Electric Lime
      { r: 239, g: 131, b: 84 },  // Warm Coral Orange
      { r: 125, g: 211, b: 252 }  // Cosmic Cyan
    ];
    const palette = isLight ? lightColors : darkColors;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.twinklePhase += p.twinkleSpeed;

      if (p.x < -10) p.x = width + 10;
      else if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      else if (p.y > height + 10) p.y = -10;

      // Mouse subtle gravitational push
      const mdx = p.x - mouse.x;
      const mdy = p.y - mouse.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < 90 && mdist > 0) {
        const force = (1 - mdist / 90) * 0.8;
        p.x += (mdx / mdist) * force;
        p.y += (mdy / mdist) * force;
      }

      // Dynamic twinkle brightness
      const twinkle = Math.sin(p.twinklePhase) * 0.35 + 0.65;
      const col = palette[p.type];
      const baseAlpha = isLight ? 0.9 : 0.75;
      const alpha = Math.min(1, baseAlpha * twinkle);
      const curRadius = p.baseRadius * (0.85 + twinkle * 0.3);

      // Outer glowing radiant halo for prominent star appeal
      if (p.isSparkle || curRadius > 1.8) {
        const haloRadius = curRadius * (isLight ? 3.4 : 3.8);
        const haloGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloRadius);
        haloGradient.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, ${isLight ? 0.38 : 0.4})`);
        haloGradient.addColorStop(1, `rgba(${col.r}, ${col.g}, ${col.b}, 0)`);
        ctx.fillStyle = haloGradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, haloRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw the core star body
      ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha})`;

      if (p.isSparkle) {
        // 4-point twinkling star
        const outerR = curRadius * (isLight ? 2.8 : 2.4);
        const innerR = curRadius * 0.6;
        drawSparkleStar(p.x, p.y, outerR, innerR, p.twinklePhase * 0.5);
      } else {
        // Circular star node
        ctx.beginPath();
        ctx.arc(p.x, p.y, curRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Constellation connecting lines
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 115) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          const lineAlpha = (1 - dist / 115) * (isLight ? 0.34 : 0.18);
          ctx.strokeStyle = isLight
            ? `rgba(71, 85, 105, ${lineAlpha})`
            : `rgba(210, 225, 195, ${lineAlpha})`;
          ctx.lineWidth = isLight ? 0.95 : 0.75;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(renderParticles);
  };
  requestAnimationFrame(renderParticles);
}

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
  });
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
  });
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
    if (consoleText) consoleText.innerHTML = "<b>Gouv Kimsea</b> &lt;status: 'curious'&gt; ⚡ Ready to ship!";
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
  });
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

const openResumeModal = () => {
  if (!resumeModal) return;
  previousResumeElement = document.activeElement;
  resumeModal.showModal();
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

$("#resumeHeroBtn")?.addEventListener("click", openResumeModal);
$("#resumeContactBtn")?.addEventListener("click", openResumeModal);
$("#resumeCloseBtn")?.addEventListener("click", closeResumeModal);
$("#resumeFooterClose")?.addEventListener("click", closeResumeModal);
$("#resumePrintBtn")?.addEventListener("click", () => window.print());
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
  help: "Available commands: <b>about</b>, <b>skills</b>, <b>projects</b>, <b>play</b>, <b>starrunner</b>, <b>stats</b>, <b>resume</b>, <b>matrix</b>, <b>neofetch</b>, <b>theme</b>, <b>search</b>, <b>contact</b>, <b>whoami</b>, <b>github</b>, <b>date</b>, <b>clear</b>",
  about: "Gouv Kimsea — University student exploring software development, business, and technology by building real projects.",
  skills: "JavaScript · C++ · Python · WebGL / Shaders · HTML5 / CSS3 · React · REST APIs · Node.js · SQL",
  projects: "1. <b>Pinit</b> — AI scam and suspicious link detector\n2. <b>Mini World</b> — 3D planet simulation & WebGL engine\n3. <b>DevPulse</b> — Real-time engineering flow & telemetry dashboard\n4. <b>This Portfolio</b> — Personal web platform & terminal CLI\nClick any project card to view interactive breakdown.",
  starrunner: () => {
    const el = document.getElementById("starGameWidget");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
    return "Scrolled to ✦ Star Runner in Bento Grid! Press SPACE or Tap to Play! 🚀";
  },
  game: () => {
    const el = document.getElementById("starGameWidget");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
    return "Scrolled to ✦ Star Runner in Bento Grid! Press SPACE or Tap to Play! 🚀";
  },
  dino: () => {
    const el = document.getElementById("starGameWidget");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
    return "Scrolled to ✦ Star Runner (Google Dino style cosmic runner)! Press SPACE or Tap to Play! 🚀";
  },
  play: () => {
    window.open("miniworld.html", "_blank");
    return "Launching Mini World 3D Planet Simulation in a new tab... 🪐";
  },
  "3d": () => {
    window.open("miniworld.html", "_blank");
    return "Launching Mini World 3D Planet Simulation in a new tab... 🪐";
  },
  miniworld: () => {
    window.open("miniworld.html", "_blank");
    return "Launching Mini World 3D Planet Simulation in a new tab... 🪐";
  },
  stats: () => {
    return `<pre style="color:var(--lime);font-size:11px;line-height:1.4;">
📊 Engineering Stats (2026):
----------------------------------------
• GitHub Repositories: 15+ Active
• Featured Live Projects: 4 (Pinit, Mini World, DevPulse, Portfolio)
• Primary Stack: JavaScript (ES2026), C++, Python, WebGL/GLSL
• Status: Active Development & Open to Opportunities 🚀</pre>`;
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
                   Status: Open to learning & building 🚀</pre>`;
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
  contact: "Email: <a href='mailto:gouvkimsea@gmail.com' style='color:var(--lime)'>gouvkimsea@gmail.com</a> | GitHub: <a href='https://github.com/gouvkimsea' target='_blank' style='color:var(--lime)'>github.com/gouvkimsea</a>",
  whoami: "guest@gouvkimsea.dev — welcome, curious visitor!",
  github: "Opening GitHub profile in a new tab...",
  date: () => new Date().toLocaleString(),
  sudo: "Permission denied: You are already in full control of this portfolio.",
  "cat about-me.js": "const developer = {\n  name: 'Gouv Kimsea',\n  focus: 'building & learning',\n  status: 'curious',\n  coffee: true\n};"
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
  }

  let response;
  if (typeof terminalCommands[lower] === "function") {
    response = terminalCommands[lower]();
  } else if (terminalCommands[lower]) {
    response = terminalCommands[lower];
  } else if (lower.startsWith("echo ")) {
    response = command.slice(5);
  } else {
    response = `Command not found: <b>${command}</b>. Type <b>help</b> to see options.`;
  }

  terminalOutput.insertAdjacentHTML("beforeend", `<p><span class="command">$ ${command}</span></p><p>${response.replace(/\n/g, "<br/>")}</p>`);
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

    setTimeout(() => {
      submitBtn.classList.remove("is-sending");
      submitBtn.innerHTML = originalText;
      playSound("success");
      formStatus.textContent = "✓ Thanks, Gouv received your note!";
      formStatus.style.color = "#648b4a";
      contactForm.reset();
      $$(".form-row", contactForm).forEach(row => {
        row.classList.remove("valid", "invalid");
        $(".error-message", row).textContent = "";
      });
      setTimeout(() => { formStatus.textContent = ""; }, 5000);
    }, 700);
  } else {
    formStatus.textContent = "Please check the highlighted fields.";
    formStatus.style.color = "#b34834";
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
// ✦ STAR RUNNER MINI-GAME ENGINE (Bento Grid Interactive Easter Egg)
// Google Dino Runner inspired celestial runner with jump, duck & high scores
// ==========================================================================
(function initStarRunner() {
  const widget = document.getElementById("starGameWidget");
  const canvas = document.getElementById("starGameCanvas");
  if (!widget || !canvas) return;

  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("starGameOverlay");
  const overlayMsg = document.getElementById("starGameMsg");
  const scoreEl = document.getElementById("starGameScore");
  const hiScoreEl = document.getElementById("starGameHi");
  const soundBtn = document.getElementById("starGameSoundBtn");

  // Web Audio Synthesizer
  let audioCtx = null;
  let isMuted = localStorage.getItem("star_game_muted") === "true";
  if (soundBtn) soundBtn.textContent = isMuted ? "🔇" : "🔊";

  soundBtn?.addEventListener("click", e => {
    e.stopPropagation();
    isMuted = !isMuted;
    localStorage.setItem("star_game_muted", isMuted ? "true" : "false");
    soundBtn.textContent = isMuted ? "🔇" : "🔊";
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
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === "jump") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "duck") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(130, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "gem") {
        [880, 1320].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.18, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.12);
        });
      } else if (type === "milestone") {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0.22, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.14);
        });
      } else if (type === "hit") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.22);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      }
    } catch (err) {
      // Audio autoplay policy
    }
  };

  // High Score Storage
  let hiScore = parseInt(localStorage.getItem("star_runner_hi") || "0", 10);
  if (hiScoreEl) hiScoreEl.textContent = "HI " + String(hiScore).padStart(5, "0");

  // Canvas Dimensions & HiDPI Scaling
  let cssWidth = 340;
  let cssHeight = 120;
  let dpr = 1;
  let groundY = 98;

  const resize = () => {
    cssWidth = widget.clientWidth || 340;
    cssHeight = 120;
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = cssHeight - 20;
  };
  resize();
  window.addEventListener("resize", resize);

  // Parallax Starfield Background
  const bgStarsFar = [];
  const bgStarsNear = [];
  for (let i = 0; i < 18; i++) {
    bgStarsFar.push({
      x: Math.random() * 400,
      y: Math.random() * (groundY - 15),
      r: Math.random() * 0.9 + 0.6,
      twinkle: Math.random() * Math.PI * 2
    });
  }
  for (let i = 0; i < 12; i++) {
    bgStarsNear.push({
      x: Math.random() * 400,
      y: Math.random() * (groundY - 12),
      r: Math.random() * 1.4 + 1.1,
      twinkle: Math.random() * Math.PI * 2
    });
  }

  // Game State Variables
  const STATE_IDLE = "idle";
  const STATE_PLAYING = "playing";
  const STATE_GAMEOVER = "gameover";
  let state = STATE_IDLE;

  let speed = 3.6;
  let distance = 0;
  let score = 0;
  let bonusScore = 0;
  let nextObstacleDistance = 160;
  let nextGemDistance = 240;
  let milestoneHit = {};

  // Player Star
  const star = {
    x: 44,
    y: groundY - 14,
    radius: 12,
    innerRadius: 5.5,
    vy: 0,
    gravity: 0.44,
    jumpForce: -7.8,
    isGrounded: true,
    isDucking: false,
    angle: 0,
    squashX: 1,
    squashY: 1,
    trailTimer: 0,
    blinkTimer: 0
  };

  // Obstacles, Gems, Particles
  let obstacles = [];
  let gems = [];
  let particles = [];

  // Helper: Draw 5-Point Glowing Star
  const drawGlowingStar = (cx, cy, spikes, outerRadius, innerRadius, angle, isLight, isDucking, isBlinking) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Outer Glow Halo
    const haloR = outerRadius * (isLight ? 2.4 : 2.8);
    const haloGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, haloR);
    if (isLight) {
      haloGrad.addColorStop(0, "rgba(234, 88, 12, 0.35)");
      haloGrad.addColorStop(1, "rgba(234, 88, 12, 0)");
    } else {
      haloGrad.addColorStop(0, "rgba(231, 242, 109, 0.4)");
      haloGrad.addColorStop(1, "rgba(231, 242, 109, 0)");
    }
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.fill();

    // 5-point Star Path
    ctx.beginPath();
    const step = Math.PI / spikes;
    for (let i = 0; i < spikes * 2; i++) {
      const r = (i % 2 === 0) ? outerRadius : innerRadius;
      const a = i * step - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Body Gradient
    const grad = ctx.createLinearGradient(-outerRadius, -outerRadius, outerRadius, outerRadius);
    if (isLight) {
      grad.addColorStop(0, "#2563eb"); // Royal Sapphire
      grad.addColorStop(0.5, "#d97706"); // Amber
      grad.addColorStop(1, "#ea580c"); // Cosmic Orange
    } else {
      grad.addColorStop(0, "#e7f26d"); // Electric Lime
      grad.addColorStop(0.5, "#f59e0b"); // Solar Gold
      grad.addColorStop(1, "#ef4444"); // Warm Coral
    }
    ctx.fillStyle = grad;
    ctx.fill();

    // Outline
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = isLight ? "rgba(15, 23, 42, 0.4)" : "rgba(255, 255, 255, 0.6)";
    ctx.stroke();

    // Starlight Core Sparkle
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Cute Expression / Eyes
    if (!isDucking) {
      ctx.fillStyle = isLight ? "#0f172a" : "#111827";
      if (isBlinking) {
        ctx.fillRect(-4, -1, 3, 1);
        ctx.fillRect(1, -1, 3, 1);
      } else {
        ctx.beginPath();
        ctx.arc(-2.5, -0.5, 1.2, 0, Math.PI * 2);
        ctx.arc(2.5, -0.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  };

  // Helper: Draw Spire Crystal Obstacle
  const drawSpireObstacle = (x, y, w, h, isLight) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w * 0.5, y - h);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fillStyle = isLight ? "#1e293b" : "#ef8354";
    ctx.fill();
    ctx.strokeStyle = isLight ? "#0f172a" : "#ffd166";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Crystal facet reflection line
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y - h);
    ctx.lineTo(x + w * 0.35, y);
    ctx.strokeStyle = isLight ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  };

  // Helper: Draw Asteroid Obstacle
  const drawAsteroidObstacle = (x, y, r, isLight) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + r, y - r, r, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? "#334155" : "#ec4899";
    ctx.fill();
    ctx.strokeStyle = isLight ? "#0f172a" : "#f472b6";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Mini Crater
    ctx.beginPath();
    ctx.arc(x + r * 0.7, y - r * 1.2, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.35)";
    ctx.fill();
    ctx.restore();
  };

  // Helper: Draw Flying Comet Drone Obstacle
  const drawCometObstacle = (x, y, w, h, isLight, time) => {
    ctx.save();
    // Jet tail sparks
    const tailLen = 14 + Math.sin(time * 0.2) * 4;
    const tailGrad = ctx.createLinearGradient(x + w, y, x + w + tailLen, y);
    tailGrad.addColorStop(0, isLight ? "rgba(220, 38, 38, 0.85)" : "rgba(56, 189, 248, 0.85)");
    tailGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = tailGrad;
    ctx.beginPath();
    ctx.moveTo(x + w, y - h * 0.3);
    ctx.lineTo(x + w + tailLen, y);
    ctx.lineTo(x + w, y + h * 0.3);
    ctx.closePath();
    ctx.fill();

    // Drone / comet body
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? "#dc2626" : "#38bdf8";
    ctx.fill();
    ctx.strokeStyle = isLight ? "#991b1b" : "#bae6fd";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Core pilot dot
    ctx.beginPath();
    ctx.arc(x + w * 0.3, y, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();
  };

  // Helper: Draw Starlight Gem Pickup
  const drawGemPickup = (x, y, size, isLight, time) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 0.05);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.7, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.7, 0);
    ctx.closePath();
    ctx.fillStyle = isLight ? "#ea580c" : "#fbbf24";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Glow Halo
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? "rgba(234, 88, 12, 0.2)" : "rgba(251, 191, 36, 0.25)";
    ctx.fill();
    ctx.restore();
  };

  // Sparkle Burst Generator
  const spawnParticleBurst = (x, y, count, colors) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: Math.random() * 0.035 + 0.02
      });
    }
  };

  // Reset & Start Game
  const startGame = () => {
    getAudioContext();
    state = STATE_PLAYING;
    speed = 3.6;
    distance = 0;
    bonusScore = 0;
    score = 0;
    milestoneHit = {};
    obstacles = [];
    gems = [];
    particles = [];
    nextObstacleDistance = 160;
    nextGemDistance = 220;

    star.y = groundY - 14;
    star.vy = 0;
    star.isGrounded = true;
    star.isDucking = false;
    star.angle = 0;

    overlay?.classList.add("hidden");
    scoreEl?.classList.remove("milestone-flash");
    if (scoreEl) scoreEl.textContent = "00000";

    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    spawnParticleBurst(star.x, star.y, 14, isLight ? ["#2563eb", "#ea580c", "#d97706"] : ["#e7f26d", "#f59e0b", "#38bdf8"]);
    playSoundFx("jump");
  };

  // Trigger Game Over
  const triggerGameOver = () => {
    state = STATE_GAMEOVER;
    playSoundFx("hit");

    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    spawnParticleBurst(star.x, star.y, 25, isLight ? ["#ea580c", "#dc2626", "#0f172a"] : ["#e7f26d", "#ef4444", "#38bdf8"]);

    if (score > hiScore) {
      hiScore = score;
      localStorage.setItem("star_runner_hi", String(hiScore));
      if (hiScoreEl) hiScoreEl.textContent = "HI " + String(hiScore).padStart(5, "0");
    }

    if (overlay && overlayMsg) {
      overlayMsg.innerHTML = `GAME OVER<br/><span style="font-size:9px;color:var(--muted)">SCORE: ${score} • BEST: ${hiScore}</span><br/><span style="color:var(--orange)">PRESS SPACE OR TAP TO RETRY ↻</span>`;
      overlay.classList.remove("hidden");
    }
  };

  // Player Actions: Jump & Duck
  const handleJump = () => {
    if (state === STATE_IDLE || state === STATE_GAMEOVER) {
      startGame();
      return;
    }
    if (state === STATE_PLAYING && star.isGrounded) {
      star.vy = star.jumpForce;
      star.isGrounded = false;
      star.squashX = 0.7;
      star.squashY = 1.35;
      playSoundFx("jump");

      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      spawnParticleBurst(star.x, groundY - 5, 8, isLight ? ["#ea580c", "#2563eb"] : ["#e7f26d", "#f59e0b"]);
    }
  };

  const handleEndJump = () => {
    if (state === STATE_PLAYING && star.vy < -3.2) {
      star.vy = -3.2; // Variable jump height
    }
  };

  const handleDuck = ducking => {
    if (state !== STATE_PLAYING) return;
    if (ducking && !star.isDucking) {
      star.isDucking = true;
      playSoundFx("duck");
      if (!star.isGrounded) {
        star.vy += star.gravity * 1.5; // Fast drop
      }
    } else if (!ducking && star.isDucking) {
      star.isDucking = false;
    }
  };

  // Keyboard Event Listeners
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

  // Pointer & Touch Events on Canvas Viewport
  const viewport = widget.querySelector(".game-viewport");
  viewport?.addEventListener("pointerdown", e => {
    widget.focus();
    handleJump();
  });
  viewport?.addEventListener("pointerup", () => {
    handleEndJump();
  });

  // Main 60FPS Game Loop
  let lastTime = performance.now();
  let time = 0;

  const gameLoop = now => {
    requestAnimationFrame(gameLoop);
    const dt = Math.min((now - lastTime) / 16.666, 2.5);
    lastTime = now;
    time += 0.05 * dt;

    const isLight = document.documentElement.getAttribute("data-theme") === "light";

    // Clear Canvas
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    // 1. Draw Parallax Background Starfield
    const scrollSpeed = state === STATE_PLAYING ? speed * dt : 0.6 * dt;

    ctx.fillStyle = isLight ? "rgba(100, 116, 139, 0.4)" : "rgba(225, 230, 245, 0.55)";
    bgStarsFar.forEach(s => {
      s.x -= scrollSpeed * 0.12;
      if (s.x < -10) s.x = cssWidth + 10;
      s.twinkle += 0.02 * dt;
      const alpha = Math.sin(s.twinkle) * 0.3 + 0.7;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = isLight ? "rgba(234, 88, 12, 0.5)" : "rgba(231, 242, 109, 0.65)";
    bgStarsNear.forEach(s => {
      s.x -= scrollSpeed * 0.28;
      if (s.x < -10) s.x = cssWidth + 10;
      s.twinkle += 0.03 * dt;
      const alpha = Math.sin(s.twinkle) * 0.35 + 0.65;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // 2. Draw Scrolling Cosmic Horizon Track
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(cssWidth, groundY);
    ctx.strokeStyle = isLight ? "rgba(71, 85, 105, 0.4)" : "rgba(231, 242, 109, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Track energy dashes
    const dashOffset = (distance * 0.8) % 24;
    ctx.beginPath();
    ctx.setLineDash([8, 16]);
    ctx.lineDashOffset = -dashOffset;
    ctx.moveTo(0, groundY + 4);
    ctx.lineTo(cssWidth, groundY + 4);
    ctx.strokeStyle = isLight ? "rgba(234, 88, 12, 0.35)" : "rgba(231, 242, 109, 0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Update & Draw Obstacles
    if (state === STATE_PLAYING) {
      distance += speed * dt;
      speed = Math.min(8.2, 3.6 + (distance * 0.0012));

      // Calculate Current Score
      score = Math.floor(distance * 0.16) + bonusScore;
      if (scoreEl) scoreEl.textContent = String(score).padStart(5, "0");

      // Check Milestones (every 100 points)
      const curHundred = Math.floor(score / 100);
      if (curHundred > 0 && !milestoneHit[curHundred]) {
        milestoneHit[curHundred] = true;
        playSoundFx("milestone");
        scoreEl?.classList.add("milestone-flash");
        setTimeout(() => scoreEl?.classList.remove("milestone-flash"), 1200);
        spawnParticleBurst(cssWidth * 0.5, groundY - 40, 20, isLight ? ["#ea580c", "#2563eb", "#d97706"] : ["#e7f26d", "#f59e0b", "#38bdf8"]);
      }

      // Spawn Obstacles
      nextObstacleDistance -= speed * dt;
      if (nextObstacleDistance <= 0) {
        // Roll obstacle type
        const roll = Math.random();
        if (score > 130 && roll > 0.72) {
          // Flying Comet Drone
          obstacles.push({
            type: "comet",
            x: cssWidth + 20,
            y: groundY - 26,
            w: 22,
            h: 12
          });
        } else if (roll > 0.42) {
          // Asteroid Rock
          obstacles.push({
            type: "asteroid",
            x: cssWidth + 20,
            y: groundY,
            r: 10
          });
        } else if (roll > 0.2) {
          // Double Spire
          obstacles.push({
            type: "double_spire",
            x: cssWidth + 20,
            y: groundY,
            w: 22,
            h: 22
          });
        } else {
          // Single Spire
          obstacles.push({
            type: "spire",
            x: cssWidth + 20,
            y: groundY,
            w: 12,
            h: 20
          });
        }
        nextObstacleDistance = Math.random() * 140 + (160 - Math.min(60, speed * 6));
      }

      // Spawn Starlight Gems
      nextGemDistance -= speed * dt;
      if (nextGemDistance <= 0) {
        gems.push({
          x: cssWidth + 30,
          y: groundY - 34,
          size: 7
        });
        nextGemDistance = Math.random() * 320 + 260;
      }
    }

    // Render & Move Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      if (state === STATE_PLAYING) obs.x -= speed * dt;

      if (obs.type === "spire") {
        drawSpireObstacle(obs.x, obs.y, obs.w, obs.h, isLight);
      } else if (obs.type === "double_spire") {
        drawSpireObstacle(obs.x, obs.y, obs.w * 0.55, obs.h * 0.85, isLight);
        drawSpireObstacle(obs.x + obs.w * 0.45, obs.y, obs.w * 0.55, obs.h, isLight);
      } else if (obs.type === "asteroid") {
        drawAsteroidObstacle(obs.x, obs.y, obs.r, isLight);
      } else if (obs.type === "comet") {
        drawCometObstacle(obs.x, obs.y, obs.w, obs.h, isLight, time);
      }

      // Collision Detection with Player
      if (state === STATE_PLAYING) {
        const starHitR = star.isDucking ? 6 : 9;
        const starHitY = star.isDucking ? star.y + 4 : star.y;
        let collided = false;

        if (obs.type === "spire" || obs.type === "double_spire") {
          const obsLeft = obs.x + 2;
          const obsRight = obs.x + obs.w - 2;
          const obsTop = obs.y - obs.h + 2;
          if (star.x + starHitR > obsLeft && star.x - starHitR < obsRight && starHitY + starHitR > obsTop) {
            collided = true;
          }
        } else if (obs.type === "asteroid") {
          const dx = star.x - (obs.x + obs.r);
          const dy = starHitY - (obs.y - obs.r);
          if (Math.sqrt(dx * dx + dy * dy) < starHitR + obs.r - 2) {
            collided = true;
          }
        } else if (obs.type === "comet") {
          const obsLeft = obs.x;
          const obsRight = obs.x + obs.w;
          const obsTop = obs.y - obs.h * 0.5;
          const obsBottom = obs.y + obs.h * 0.5;
          if (star.x + starHitR > obsLeft && star.x - starHitR < obsRight && starHitY + starHitR > obsTop && starHitY - starHitR < obsBottom) {
            collided = true;
          }
        }

        if (collided) {
          triggerGameOver();
          break;
        }
      }

      // Cleanup off-screen obstacles
      if (obs.x < -60) obstacles.splice(i, 1);
    }

    // Render & Move Starlight Gems
    for (let i = gems.length - 1; i >= 0; i--) {
      const gem = gems[i];
      if (state === STATE_PLAYING) gem.x -= speed * dt;

      drawGemPickup(gem.x, gem.y, gem.size, isLight, time);

      // Gem collection check
      if (state === STATE_PLAYING) {
        const dx = star.x - gem.x;
        const dy = star.y - gem.y;
        if (Math.sqrt(dx * dx + dy * dy) < star.radius + gem.size) {
          bonusScore += 50;
          playSoundFx("gem");
          spawnParticleBurst(gem.x, gem.y, 12, isLight ? ["#ea580c", "#d97706", "#ffffff"] : ["#fbbf24", "#e7f26d", "#ffffff"]);
          gems.splice(i, 1);
          continue;
        }
      }

      if (gem.x < -30) gems.splice(i, 1);
    }

    // 4. Update Player Physics & Particles
    star.blinkTimer += dt;
    const isBlinking = (star.blinkTimer % 180) < 6;

    if (state === STATE_IDLE) {
      star.y = (groundY - 14) + Math.sin(time * 2.5) * 3;
      star.angle = Math.sin(time * 2) * 0.1;
      star.squashX = 1;
      star.squashY = 1;
    } else if (state === STATE_PLAYING) {
      // Gravity
      star.vy += (star.isDucking ? star.gravity * 1.5 : star.gravity) * dt;
      star.y += star.vy * dt;

      // Ground Collision
      const targetGroundY = groundY - 14;
      if (star.y >= targetGroundY) {
        star.y = targetGroundY;
        if (!star.isGrounded) {
          // Just landed
          star.isGrounded = true;
          star.squashX = 1.35;
          star.squashY = 0.7;
          spawnParticleBurst(star.x, groundY, 4, isLight ? ["#64748b"] : ["#a3e635"]);
        }
        star.vy = 0;
      }

      // Squash & Stretch Easing
      const targetSquashX = star.isDucking ? 1.4 : 1.0;
      const targetSquashY = star.isDucking ? 0.6 : 1.0;
      star.squashX += (targetSquashX - star.squashX) * 0.25 * dt;
      star.squashY += (targetSquashY - star.squashY) * 0.25 * dt;

      // Rotation Animation
      if (!star.isGrounded) {
        star.angle += 0.14 * dt;
      } else {
        star.angle = Math.sin(distance * 0.12) * 0.12;
      }

      // Running Stardust Particle Trail
      star.trailTimer += dt;
      if (star.trailTimer >= 2.5) {
        star.trailTimer = 0;
        particles.push({
          x: star.x - 8,
          y: star.y + (Math.random() - 0.5) * 6,
          vx: -(speed * 0.45 + Math.random() * 0.8),
          vy: (Math.random() - 0.5) * 0.8,
          radius: Math.random() * 1.6 + 0.8,
          color: isLight
            ? (Math.random() > 0.5 ? "rgba(234, 88, 12, " : "rgba(37, 99, 235, ")
            : (Math.random() > 0.5 ? "rgba(231, 242, 109, " : "rgba(56, 189, 248, "),
          life: 1,
          decay: 0.05
        });
      }
    }

    // 5. Draw Player Star
    if (state !== STATE_GAMEOVER || (Math.floor(time * 5) % 2 === 0)) {
      ctx.save();
      ctx.translate(star.x, star.y);
      ctx.scale(star.squashX, star.squashY);
      drawGlowingStar(0, 0, 5, star.radius, star.innerRadius, star.angle, isLight, star.isDucking, isBlinking);
      ctx.restore();
    }

    // 6. Update & Render Particle Sparks
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color.endsWith(", ") ? p.color + p.life + ")" : p.color;
      ctx.globalAlpha = p.life;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  };

  requestAnimationFrame(gameLoop);
})();

