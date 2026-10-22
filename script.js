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
    overview: "An interactive procedural 3D cartoon planet sandbox built in pure WebGL. Features a controllable 6-wheel planetary Surface Rover, UFO spaceship with tractor beam, ocean wildlife (breaching blue whale & leaping dolphins), modular orbiting space station, seasonal snow blanket shaders, dynamic storms & polar auroras, and real-time terraforming.",
    problem: "Real-time spherical 3D geometry manipulation, multi-vehicle driving/flight physics, dynamic shaders, and marine animal animation typically require heavy 3D game engines, creating massive bundle sizes.",
    learned: "Engineered custom 3D vector/matrix math, subdivision cubesphere geometry, spherical rover suspension physics, UFO flight dynamics, breaching whale blowhole particle fountains, modular space station orbital mechanics, seasonal snow terrain GLSL deformation, and procedural Web Audio API sound synthesizers.",
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
  },
  aquarium: {
    title: "Aquarium Filter Sim — Fluid & Biological Dynamics Engine",
    overview: "An in-browser mathematical simulation engine written in TypeScript modeling aquarium fluid dynamics, 3-stage mechanical/biological/chemical filtration, and the biological nitrogen cycle.",
    problem: "Understanding closed aquatic ecosystems requires balancing fluid flow rates (GPH), media friction resistance, and biological bacterial conversion of toxic ammonia into safe nitrate.",
    learned: "Modeled discrete-time fluid flow differential equations, hydraulic media impedance, bacterial colony growth functions (Nitrosomonas & Nitrobacter), and interactive state visualization in TypeScript.",
    tech: ["TypeScript", "Fluid Dynamics", "Biochemical Kinetics", "Interactive Simulation", "OOP Architecture"],
    actions: [
      { label: "Aquarium Sim Repository ↗", url: "https://github.com/gouvkimsea/aquarium-filter-sim", primary: true },
      { label: "GitHub Profile (@gouvkimsea) ↗", url: "https://github.com/gouvkimsea", primary: false }
    ]
  },
  gesture: {
    title: "Gesture App — Real-Time 21-Joint Computer Vision",
    overview: "A touchless computer vision application engineered in Python with OpenCV and MediaPipe that tracks 21 skeletal landmarks on human hands at 60 FPS for spatial gesture control.",
    problem: "Traditional human-computer interaction relies on physical peripherals, which limits touchless interaction in sanitary environments, presentations, and spatial interfaces.",
    learned: "Engineered 3D coordinate vector kinematics, Euclidean distance pinch-detection algorithms, bounding box smoothing, and high-frequency real-time camera processing pipelines.",
    tech: ["Python 3", "OpenCV", "MediaPipe", "Computer Vision", "Kinematics Math", "Real-Time Tracking"],
    actions: [
      { label: "Gesture App Repository ↗", url: "https://github.com/gouvkimsea/Gesture_app", primary: true },
      { label: "GitHub Profile (@gouvkimsea) ↗", url: "https://github.com/gouvkimsea", primary: false }
    ]
  },
  saas: {
    title: "Productivity SaaS & POS Systems — Business Platform",
    overview: "Full-stack enterprise applications architected in PHP and MySQL delivering sprint velocity analytics, daily habit streaks, and retail point-of-sale inventory accounting.",
    problem: "Small businesses and independent developers need reliable, lightweight operational tools to monitor production velocity and inventory without SaaS bloat.",
    learned: "Database schema normalization in MySQL InnoDB, ACID sales transactions, sprint velocity burnup calculations, and responsive UI dashboard engineering.",
    tech: ["PHP 8.x", "MySQL", "Relational Database", "Business Analytics", "POS Inventory", "SaaS Architecture"],
    actions: [
      { label: "Productivity SaaS Repo ↗", url: "https://github.com/gouvkimsea/progress-tracking-and-productivitysaas", primary: true },
      { label: "POS System Repo ↗", url: "https://github.com/gouvkimsea/Pos_systemphp", primary: false }
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
  previousActiveElement = document.activeElement;
  $("#modalTitle").textContent = data.title;
  $("#modalOverview").textContent = data.overview;
  $("#modalProblem").textContent = data.problem;
  $("#modalLearned").textContent = data.learned;
  $("#modalTech").innerHTML = data.tech.map(item => `<span class="modal-tech-tag">${item}</span>`).join("");
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

  modal.showModal();
  $("#modalClose")?.focus();
}

function closeModal() {
  stopMiniworldLab();
  stopAquariumLab();
  stopGestureLab();
  stopSaasLab();
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
  help: "Available commands: <b>about</b>, <b>journey</b>, <b>education</b>, <b>skills</b>, <b>projects</b>, <b>pinit</b>, <b>aquarium</b>, <b>nitrogen</b>, <b>filter</b>, <b>joul</b>, <b>rental</b>, <b>gesture</b>, <b>vision</b>, <b>mediapipe</b>, <b>miniworld</b>, <b>shader</b>, <b>glsl</b>, <b>saas</b>, <b>pos</b>, <b>clp</b>, <b>srs</b>, <b>sm2</b>, <b>devpulse</b>, <b>portfolio</b>, <b>achievements</b>, <b>focus</b>, <b>work</b>, <b>contact</b>, <b>resume</b>, <b>cv</b>, <b>stats</b>, <b>neofetch</b>, <b>theme</b>, <b>cmdk</b>, <b>search</b>, <b>github</b>, <b>linkedin</b>, <b>whoami</b>, <b>date</b>, <b>clear</b>",
  about: "Gouv Kimsea — Dual degree undergraduate in Computer Science (Paragon.U) & Business Administration (Bonamary.U) building tangible products.",
  journey: () => {
    const el = document.getElementById("journey");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    return `<pre style="color:var(--lime);font-size:11px;line-height:1.5;">
Gouv Kimsea — Engineering Roadmap & Developer Journal:
================================================================
Stage 01: Dual Academic Foundations (Paragon CS & Bonamary BBA)
Stage 02: Procedural 3D & Physical Engines (Mini World 3D & Aquarium Sim)
Stage 03: Production Systems & Security (PinitAI Threat Scanner & JOUL Fleet)
Stage 04: Computer Vision & SaaS Tools (Gesture App Python CV & Productivity SaaS)
Stage 05: Open Source Architecture (15+ Public Repositories @gouvkimsea)
================================================================
Scrolled to Section 04: Developer Journal & Roadmap!</pre>`;
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
  sudo: "No administrative privileges needed. All public projects and documentation are open to explore.",
  "cat developer.ts": "const developer = {\n  name: 'Gouv Kimsea',\n  degrees: ['B.Sc. Computer Science', 'B.B.A. Business Admin'],\n  stack: ['TypeScript', 'NestJS', 'Next.js', 'PHP', 'Python', 'C++', 'WebGL'],\n  location: 'Phnom Penh, Cambodia',\n  status: 'Building & Available'\n};",
  "cat about-me.js": "const developer = {\n  name: 'Gouv Kimsea',\n  degrees: ['B.Sc. Computer Science', 'B.B.A. Business Admin'],\n  stack: ['TypeScript', 'NestJS', 'Next.js', 'PHP', 'Python', 'C++', 'WebGL'],\n  location: 'Phnom Penh, Cambodia',\n  status: 'Building & Available'\n};"
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
    window.open("https://www.linkedin.com/in/gouv-kimsea-16795143a", "_blank", "noreferrer");
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
  const consoleEl = $("#githubAchievementConsole");

  // Adjust indicator bar height based on total steps
  if (indicator && steps.length > 0) {
    indicator.style.height = `${100 / steps.length}%`;
  }

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

  // ==========================================================================
  // GitHub Live Achievement Console Controller
  // ==========================================================================
  if (consoleEl) {
    const consoleTabs = $$(".console-tab", consoleEl);
    const consolePanes = $$(".console-pane", consoleEl);
    const autoPlayToggle = $("#consoleAutoPlayToggle", consoleEl);
    let autoPlayActive = true;
    let autoPlayTimer = null;
    let currentTabIndex = 0;

    const activateTab = (tabBtn, isUserAction = false) => {
      if (!tabBtn) return;
      const targetRepo = tabBtn.dataset.repo;
      const targetPane = $(`#pane-${targetRepo}`, consoleEl);

      consoleTabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tabBtn.classList.add("active");
      tabBtn.setAttribute("aria-selected", "true");

      consolePanes.forEach((p) => {
        p.classList.remove("active");
        p.hidden = true;
      });

      if (targetPane) {
        targetPane.hidden = false;
        requestAnimationFrame(() => {
          targetPane.classList.add("active");
        });
      }

      currentTabIndex = Array.from(consoleTabs).indexOf(tabBtn);

      if (isUserAction) {
        // Pause temporarily on user click
        pauseAutoPlay();
      }
    };

    consoleTabs.forEach((tabBtn) => {
      tabBtn.addEventListener("click", () => activateTab(tabBtn, true));
    });

    const nextTab = () => {
      if (!autoPlayActive || consoleTabs.length === 0) return;
      const nextIndex = (currentTabIndex + 1) % consoleTabs.length;
      activateTab(consoleTabs[nextIndex], false);
    };

    const startAutoPlay = () => {
      if (autoPlayTimer) clearInterval(autoPlayTimer);
      autoPlayTimer = setInterval(nextTab, 5500);
      autoPlayActive = true;
      if (autoPlayToggle) {
        autoPlayToggle.innerHTML = '<span class="play-icon" aria-hidden="true">⏸</span> Auto-Play';
        autoPlayToggle.classList.remove("paused");
      }
    };

    const pauseAutoPlay = () => {
      if (autoPlayTimer) clearInterval(autoPlayTimer);
      autoPlayActive = false;
      if (autoPlayToggle) {
        autoPlayToggle.innerHTML = '<span class="play-icon" aria-hidden="true">▶</span> Resume';
        autoPlayToggle.classList.add("paused");
      }
    };

    autoPlayToggle?.addEventListener("click", () => {
      if (autoPlayActive) {
        pauseAutoPlay();
      } else {
        startAutoPlay();
      }
    });

    // Pause on mouse hover, resume on leave if not manually paused
    let userManuallyPaused = false;
    autoPlayToggle?.addEventListener("click", () => {
      userManuallyPaused = !autoPlayActive;
    });

    consoleEl.addEventListener("mouseenter", () => {
      if (autoPlayActive) {
        if (autoPlayTimer) clearInterval(autoPlayTimer);
      }
    });

    consoleEl.addEventListener("mouseleave", () => {
      if (autoPlayActive && !userManuallyPaused) {
        startAutoPlay();
      }
    });

    // Start auto rotation
    startAutoPlay();

    // ========================================================================
    // Interactive Test Bench Controllers for Console Stages
    // ========================================================================

    // 1. Interactive Test Bench: PinitAI
    const pinitSimBtns = $$("[data-sim-pinit]", consoleEl);
    const radarReticle = $("#radarTargetReticle", consoleEl);
    const radarSafeBlip = $("#radarSafeBlip", consoleEl);
    const radarTargetText = $("#radarTargetText", consoleEl);
    const hudPinitTarget = $("#hudPinitTarget", consoleEl);
    const hudPinitHomograph = $("#hudPinitHomograph", consoleEl);
    const hudPinitEntropy = $("#hudPinitEntropy", consoleEl);
    const hudPinitLatency = $("#hudPinitLatency", consoleEl);

    pinitSimBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        pauseAutoPlay();
        pinitSimBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const mode = btn.dataset.simPinit;

        if (mode === "phish") {
          if (radarReticle) radarReticle.style.display = "block";
          if (radarSafeBlip) radarSafeBlip.style.opacity = "0.2";
          if (radarTargetText) {
            radarTargetText.textContent = "THREAT DETECTED";
            radarTargetText.setAttribute("fill", "var(--orange)");
          }
          if (hudPinitTarget) {
            hudPinitTarget.textContent = "secure-chase-update.info/otp";
            hudPinitTarget.className = "t-val warning";
          }
          if (hudPinitHomograph) {
            hudPinitHomograph.textContent = "DETECTED [HIGH RISK]";
            hudPinitHomograph.className = "t-val flag";
          }
          if (hudPinitEntropy) hudPinitEntropy.textContent = "4.82 bits [ANOMALOUS]";
          if (hudPinitLatency) hudPinitLatency.textContent = "< 12ms";
        } else if (mode === "safe") {
          if (radarReticle) radarReticle.style.display = "none";
          if (radarSafeBlip) {
            radarSafeBlip.style.opacity = "1";
            radarSafeBlip.style.transform = "scale(1.4)";
            radarSafeBlip.style.transformOrigin = "95px 130px";
          }
          if (hudPinitTarget) {
            hudPinitTarget.textContent = "paragoniu.edu.kh";
            hudPinitTarget.className = "t-val success";
          }
          if (hudPinitHomograph) {
            hudPinitHomograph.textContent = "CLEAN [0 ANOMALIES]";
            hudPinitHomograph.className = "t-val success";
          }
          if (hudPinitEntropy) hudPinitEntropy.textContent = "2.14 bits [STANDARD]";
          if (hudPinitLatency) hudPinitLatency.textContent = "< 6ms";
        } else if (mode === "typo") {
          if (radarReticle) radarReticle.style.display = "block";
          if (radarSafeBlip) radarSafeBlip.style.opacity = "0.2";
          if (radarTargetText) {
            radarTargetText.textContent = "HOMOGRAPH DETECTED";
            radarTargetText.setAttribute("fill", "var(--orange)");
          }
          if (hudPinitTarget) {
            hudPinitTarget.textContent = "g00gle-security-check.com";
            hudPinitTarget.className = "t-val warning";
          }
          if (hudPinitHomograph) {
            hudPinitHomograph.textContent = "LEVENSHTEIN = 1 [SPOOF]";
            hudPinitHomograph.className = "t-val flag";
          }
          if (hudPinitEntropy) hudPinitEntropy.textContent = "3.94 bits [SUSPICIOUS]";
          if (hudPinitLatency) hudPinitLatency.textContent = "< 9ms";
        }
      });
    });

    // 2. Interactive Test Bench: Aquarium Filter Sim
    const aquaSimBtns = $$("[data-sim-aqua]", consoleEl);
    const hudAquaFlow = $("#hudAquaFlow", consoleEl);
    const hudAquaAmmonia = $("#hudAquaAmmonia", consoleEl);
    const hudAquaNitrite = $("#hudAquaNitrite", consoleEl);
    const hudAquaBio = $("#hudAquaBio", consoleEl);
    const cardAquaFlow = $("#cardAquaFlow", consoleEl);
    let aquaSpikeTimer = null;

    aquaSimBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        pauseAutoPlay();
        aquaSimBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const mode = btn.dataset.simAqua;
        if (aquaSpikeTimer) clearTimeout(aquaSpikeTimer);

        if (mode === "normal") {
          if (hudAquaFlow) hudAquaFlow.textContent = "320 GPH [CONTINUOUS]";
          if (hudAquaAmmonia) {
            hudAquaAmmonia.textContent = "0.00 ppm [OXIDIZED]";
            hudAquaAmmonia.className = "t-val success";
          }
          if (hudAquaNitrite) hudAquaNitrite.textContent = "0.00 ppm [STABLE]";
          if (hudAquaBio) hudAquaBio.textContent = "98.4% Colony Health";
          if (cardAquaFlow) cardAquaFlow.textContent = "320 GPH";
          $$(".anim-hud-aquarium .bubble").forEach((b) => (b.style.animationDuration = "2.8s"));
        } else if (mode === "spike") {
          if (hudAquaFlow) hudAquaFlow.textContent = "320 GPH [PROCESSING SPIKE]";
          if (hudAquaAmmonia) {
            hudAquaAmmonia.textContent = "1.85 ppm [OXIDIZING...]";
            hudAquaAmmonia.className = "t-val warning";
          }
          if (hudAquaNitrite) hudAquaNitrite.textContent = "0.65 ppm [NITRIFYING]";
          if (hudAquaBio) hudAquaBio.textContent = "91.2% High Bio-Conversion";
          $$(".anim-hud-aquarium .bubble").forEach((b) => (b.style.animationDuration = "1.9s"));

          aquaSpikeTimer = setTimeout(() => {
            if (hudAquaAmmonia) {
              hudAquaAmmonia.textContent = "0.15 ppm [CONVERTED]";
              hudAquaAmmonia.className = "t-val success";
            }
            if (hudAquaNitrite) hudAquaNitrite.textContent = "0.02 ppm [STABILIZED]";
            if (hudAquaBio) hudAquaBio.textContent = "99.1% Bio-Balance Restored";
          }, 2400);
        } else if (mode === "boost") {
          if (hudAquaFlow) hudAquaFlow.textContent = "480 GPH [PUMP OVERDRIVE]";
          if (hudAquaAmmonia) {
            hudAquaAmmonia.textContent = "0.00 ppm [MAX TURNOVER]";
            hudAquaAmmonia.className = "t-val success";
          }
          if (hudAquaNitrite) hudAquaNitrite.textContent = "0.00 ppm [STABLE]";
          if (hudAquaBio) hudAquaBio.textContent = "99.8% Turnover: 16x/hr";
          if (cardAquaFlow) cardAquaFlow.textContent = "480 GPH";
          $$(".anim-hud-aquarium .bubble").forEach((b) => (b.style.animationDuration = "1.3s"));
        }
      });
    });

    // 3. Interactive Test Bench: Rental Service (Buffer & Collision Intercept)
    const rentalSimBtns = $$("[data-sim-rental]", consoleEl);
    const turnaroundBufferRect = $("#turnaroundBufferRect", consoleEl);
    const turnaroundBufferText = $("#turnaroundBufferText", consoleEl);
    const bookingBRect = $("#bookingBRect", consoleEl);
    const bookingBText = $("#bookingBText", consoleEl);
    const hudRentalTests = $("#hudRentalTests", consoleEl);
    const hudRentalOverlap = $("#hudRentalOverlap", consoleEl);
    const hudRentalBuffer = $("#hudRentalBuffer", consoleEl);
    let collisionTimer = null;

    rentalSimBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        pauseAutoPlay();
        rentalSimBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const mode = btn.dataset.simRental;
        if (collisionTimer) clearTimeout(collisionTimer);

        if (mode === "standard") {
          turnaroundBufferRect?.setAttribute("width", "45");
          turnaroundBufferRect?.setAttribute("x", "100");
          turnaroundBufferText?.setAttribute("x", "122");
          if (turnaroundBufferText) turnaroundBufferText.textContent = "2H BUFFER";
          bookingBRect?.setAttribute("x", "148");
          bookingBRect?.setAttribute("stroke", "#38bdf8");
          bookingBText?.setAttribute("x", "185");
          if (bookingBText) {
            bookingBText.textContent = "BOOKING B";
            bookingBText.setAttribute("fill", "#38bdf8");
          }
          if (hudRentalBuffer) hudRentalBuffer.textContent = "2.0 Hours Mandatory";
          if (hudRentalOverlap) {
            hudRentalOverlap.textContent = "Zero Double Bookings";
            hudRentalOverlap.className = "t-val success";
          }
          if (hudRentalTests) hudRentalTests.textContent = "197 / 197 PASSING [100%]";
        } else if (mode === "express") {
          turnaroundBufferRect?.setAttribute("width", "25");
          turnaroundBufferRect?.setAttribute("x", "100");
          turnaroundBufferText?.setAttribute("x", "112");
          if (turnaroundBufferText) turnaroundBufferText.textContent = "1H";
          bookingBRect?.setAttribute("x", "128");
          bookingBRect?.setAttribute("stroke", "#38bdf8");
          bookingBText?.setAttribute("x", "165");
          if (bookingBText) {
            bookingBText.textContent = "EXPRESS B";
            bookingBText.setAttribute("fill", "#38bdf8");
          }
          if (hudRentalBuffer) hudRentalBuffer.textContent = "1.0 Hour Expedited Buffer";
          if (hudRentalOverlap) {
            hudRentalOverlap.textContent = "Automated Quick-Turn Validated";
            hudRentalOverlap.className = "t-val success";
          }
          if (hudRentalTests) hudRentalTests.textContent = "197 / 197 PASSING [100%]";
        } else if (mode === "collision") {
          bookingBRect?.setAttribute("x", "95");
          bookingBRect?.setAttribute("stroke", "#ef4444");
          bookingBText?.setAttribute("x", "132");
          if (bookingBText) {
            bookingBText.textContent = "CONFLICT BLOCKED";
            bookingBText.setAttribute("fill", "#ef4444");
          }
          if (hudRentalOverlap) {
            hudRentalOverlap.textContent = "COLLISION INTERCEPTED";
            hudRentalOverlap.className = "t-val flag";
          }
          if (hudRentalTests) hudRentalTests.textContent = "Assertion: Interval Overlap Guard Fired";

          collisionTimer = setTimeout(() => {
            bookingBRect?.setAttribute("x", "148");
            bookingBRect?.setAttribute("stroke", "#38bdf8");
            bookingBText?.setAttribute("x", "185");
            if (bookingBText) {
              bookingBText.textContent = "POSTPONED SAFELY";
              bookingBText.setAttribute("fill", "#38bdf8");
            }
            if (hudRentalOverlap) {
              hudRentalOverlap.textContent = "Integrity Preserved (Postponed)";
              hudRentalOverlap.className = "t-val success";
            }
          }, 2000);
        }
      });
    });

    // 4. Interactive Test Bench: Gesture App (Computer Vision Hand Poser)
    const gestureSimBtns = $$("[data-sim-gesture]", consoleEl);
    const gestureLabelText = $("#gestureLabelText", consoleEl);
    const hudGesturePose = $("#hudGesturePose", consoleEl);

    gestureSimBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        pauseAutoPlay();
        gestureSimBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const mode = btn.dataset.simGesture;

        if (mode === "pinch") {
          if (gestureLabelText) gestureLabelText.textContent = "GESTURE: PINCH_ZOOM (98%)";
          if (hudGesturePose) {
            hudGesturePose.textContent = "PINCH_DETECTED [TRUE]";
            hudGesturePose.className = "t-val success";
          }
        } else if (mode === "peace") {
          if (gestureLabelText) gestureLabelText.textContent = "GESTURE: PEACE_SIGN (99%)";
          if (hudGesturePose) {
            hudGesturePose.textContent = "V_SHAPE_DETECTED [TRUE]";
            hudGesturePose.className = "t-val success";
          }
        } else if (mode === "fist") {
          if (gestureLabelText) gestureLabelText.textContent = "GESTURE: CLOSED_FIST (97%)";
          if (hudGesturePose) {
            hudGesturePose.textContent = "FIST_DETECTED [TRUE]";
            hudGesturePose.className = "t-val warning";
          }
        }
      });
    });

    // Wire console action demo buttons
    const consolePinitBtn = $("#consolePinitDemo", consoleEl);
    consolePinitBtn?.addEventListener("click", () => {
      if (typeof openModal === "function") {
        openModal("pinit");
        setTimeout(() => {
          const pinitSection = $("#pinitThreatLab");
          pinitSection?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    });

    const consoleJoulBtn = $("#consoleJoulDemo", consoleEl);
    consoleJoulBtn?.addEventListener("click", () => {
      if (typeof openModal === "function") {
        openModal("joul");
      }
    });

    const consoleAquaBtn = $("#consoleAquaDemo", consoleEl);
    consoleAquaBtn?.addEventListener("click", () => {
      if (typeof openModal === "function") {
        openModal("aquarium");
      }
    });

    const consoleGestureBtn = $("#consoleGestureDemo", consoleEl);
    consoleGestureBtn?.addEventListener("click", () => {
      if (typeof openModal === "function") {
        openModal("gesture");
      }
    });

    const consoleClpBtn = $("#consoleClpDemo", consoleEl);
    consoleClpBtn?.addEventListener("click", () => {
      if (typeof openModal === "function") {
        openModal("clp");
      }
    });
  }

  // Populate 52-Week GitHub Shipping Rhythm Activity Grid (Milestone 05)
  const activityGrid = $("#githubActivityGrid");
  if (activityGrid && activityGrid.children.length === 0) {
    const days = 52 * 7; // 364 days
    const frag = document.createDocumentFragment();
    const repoNames = [
      "PinitAI",
      "aquarium-filter-sim",
      "rental-service",
      "Gesture_app",
      "progress-tracking-and-productivitysaas",
      "Pos_systemphp",
      "my-Portfolio-"
    ];

    let seed = 42;
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < days; i++) {
      const cell = document.createElement("div");
      cell.className = "matrix-cell";
      cell.setAttribute("tabindex", "0");
      cell.setAttribute("role", "gridcell");

      const rand = pseudoRandom();
      const dayOfWeek = i % 7;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      let level = 0;
      let commits = 0;

      if (isWeekend) {
        if (rand > 0.45) {
          level = rand > 0.82 ? 3 : (rand > 0.62 ? 2 : 1);
          commits = Math.floor(rand * 6) + 1;
        }
      } else {
        if (rand > 0.12) {
          if (rand > 0.8) {
            level = 4;
            commits = Math.floor(rand * 8) + 7;
          } else if (rand > 0.52) {
            level = 3;
            commits = Math.floor(rand * 5) + 4;
          } else if (rand > 0.28) {
            level = 2;
            commits = Math.floor(rand * 3) + 2;
          } else {
            level = 1;
            commits = 1;
          }
        }
      }

      cell.classList.add(`lvl-${level}`);
      const repo = repoNames[Math.floor(pseudoRandom() * repoNames.length)];
      const tooltip = commits === 0
        ? "No public commits recorded on this day"
        : `${commits} commit${commits > 1 ? "s" : ""} pushed to gouvkimsea/${repo}`;
      cell.setAttribute("title", tooltip);
      cell.setAttribute("aria-label", tooltip);

      frag.appendChild(cell);
    }
    activityGrid.appendChild(frag);
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
  $$(".journey-feed .deliv-chip.magnetic, .console-action-btn.magnetic, .journey-academic-link.magnetic").forEach((el) => {
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

// ==========================================================================
// 10. Interactive Dynamic Ripple Waves on Click
// ==========================================================================
const initClickRipples = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.addEventListener("click", e => {
    const target = e.target.closest(".button, .launch-btn, .nav-contact-btn, .console-action-btn, .theme-toggle, .hud-copy-btn");
    if (!target) return;

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

