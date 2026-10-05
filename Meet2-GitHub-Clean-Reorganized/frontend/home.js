(function initBranchingExplorer() {
    // Route telemetry data definition
    const routeData = {
      A: {
        title: "Route A: Traditional B.Tech Computer Science",
        badge: "FASTEST RECOGNITION",
        time: "4.0 Years",
        math: "Medium (6/10)",
        code: "High (8.5/10)",
        risk: "Low (Campus Drives)",
        barTime: "75%",
        barMath: "60%",
        barCode: "85%",
        barRisk: "30%",
        particlePath: "M270 54 C 270 90, 100 100, 100 160 C 100 220, 270 230, 270 270",
        color: "#38bdf8"
      },
      B: {
        title: "Route B: B.Sc Mathematics & Theoretical Machine Learning",
        badge: "DEEPEST RESEARCH VALUE",
        time: "3.0 Years (+ optional MS)",
        math: "Extreme (9.5/10)",
        code: "Moderate (6.5/10)",
        risk: "Medium (Research Track)",
        barTime: "55%",
        barMath: "95%",
        barCode: "65%",
        barRisk: "45%",
        particlePath: "M270 54 C 270 90, 270 120, 270 160 C 270 200, 270 230, 270 270",
        color: "#c0c1ff"
      },
      C: {
        title: "Route C: Builder Apprentice & Open-Source Artifacts",
        badge: "ZERO TUITION DEBT",
        time: "1.5 - 2.5 Years",
        math: "Practical (4/10)",
        code: "Supreme (10/10)",
        risk: "Higher (Portfolio Dependent)",
        barTime: "35%",
        barMath: "40%",
        barCode: "98%",
        barRisk: "65%",
        particlePath: "M270 54 C 270 90, 440 100, 440 160 C 440 220, 270 230, 270 270",
        color: "#4ee6aa"
      }
    };

    const tabButtons = document.querySelectorAll(".route-tab-btn");
    const nodeButtons = document.querySelectorAll(".route-node");
    const movingParticle = document.getElementById("moving-particle");
    const telTitle = document.getElementById("tel-title");
    const telBadge = document.getElementById("tel-badge");
    const telTime = document.getElementById("tel-time");
    const telMath = document.getElementById("tel-math");
    const telCode = document.getElementById("tel-code");
    const telRisk = document.getElementById("tel-risk");
    const barTime = document.getElementById("bar-time");
    const barMath = document.getElementById("bar-math");
    const barCode = document.getElementById("bar-code");
    const barRisk = document.getElementById("bar-risk");

    function setActiveRoute(routeKey) {
      const data = routeData[routeKey];
      if (!data) return;

      // Update Tabs
      tabButtons.forEach(btn => {
        if (btn.dataset.route === routeKey) {
          btn.classList.add("active", "bg-surface-container-highest", "text-primary");
          btn.classList.remove("text-outline");
        } else {
          btn.classList.remove("active", "bg-surface-container-highest", "text-primary");
          btn.classList.add("text-outline");
        }
      });

      // Update Node Card Highlights
      const targetNode = document.getElementById("node-" + routeKey.toLowerCase());
      nodeButtons.forEach(nb => {
        nb.classList.remove("shadow-[0_0_16px_-4px_rgba(56,189,248,0.3)]", "opacity-100");
        nb.classList.add("opacity-75");
      });
      if (targetNode) {
        targetNode.classList.add("opacity-100", "shadow-[0_0_16px_-4px_rgba(56,189,248,0.3)]");
        targetNode.classList.remove("opacity-75");
      }

      // Update SVG particle pulse trajectory
      if (movingParticle) {
        movingParticle.setAttribute("fill", data.color);
        const anim = movingParticle.querySelector("animateMotion");
        if (anim) {
          anim.setAttribute("path", data.particlePath);
        }
      }

      // Update Telemetry Panel
      if (telTitle) telTitle.textContent = data.title;
      if (telBadge) telBadge.textContent = data.badge;
      if (telTime) telTime.textContent = data.time;
      if (telMath) telMath.textContent = data.math;
      if (telCode) telCode.textContent = data.code;
      if (telRisk) telRisk.textContent = data.risk;

      if (barTime) barTime.style.width = data.barTime;
      if (barMath) barMath.style.width = data.barMath;
      if (barCode) barCode.style.width = data.barCode;
      if (barRisk) barRisk.style.width = data.barRisk;
    }

    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => setActiveRoute(btn.dataset.route));
    });

    nodeButtons.forEach((node, index) => {
      const keys = ["A", "B", "C"];
      node.addEventListener("click", () => setActiveRoute(keys[index]));
    });

    // Teaser Role Switcher
    const roleProfiles = {
      ai: {
        r1Title: "B.Tech + Masters in CS",
        r1Desc: "Structured coursework, algorithms, campus recruitment pipelines, and collegiate IEEE paper publications.",
        r2Title: "B.Sc Applied Math + Self Code",
        r2Desc: "Deep computational linear algebra, remote open-source bounties, and specialized HuggingFace fine-tuning projects.",
        r3Title: "Bootcamp + YC Startup Intern",
        r3Desc: "Skip standard 4-year lectures. Ship real AI agents directly to GitHub, earn paid contracts, and enter via portfolio proof."
      },
      design: {
        r1Title: "Design School B.Des (NID / RISD)",
        r1Desc: "Industrial design fundamentals, physical model prototyping, formal visual hierarchy, and senior campus showcases.",
        r2Title: "Cognitive Science + Figma Sprints",
        r2Desc: "Deep behavioral psychology, eye-tracking experiments, human-computer interaction heuristics, and self-published essays.",
        r3Title: "Micro-Agency Freelance Apprentice",
        r3Desc: "Redesign 20 live production apps for early-stage founders, master design systems, and get hired on Twitter/X proof."
      },
      quant: {
        r1Title: "Dual Degree Math & Computer Science",
        r1Desc: "Rigorous stochastic calculus, competitive programming (Codeforces Master rank), and top algorithmic trading firm on-sites.",
        r2Title: "Physics Olympiad + C++ Low Latency",
        r2Desc: "Statistical mechanics applied to order-book dynamics, FPGA kernel tuning, and autonomous backtesting bot engines.",
        r3Title: "Crypto DeFi Market Maker Track",
        r3Desc: "Deploy on-chain arbitrage contracts, run MEV searcher bots, and enter boutique systematic funds through proven P&L."
      }
    };

    const roleChips = document.querySelectorAll(".role-chip");
    const card1Title = document.getElementById("card-1-title");
    const card1Desc = document.getElementById("card-1-desc");
    const card2Title = document.getElementById("card-2-title");
    const card2Desc = document.getElementById("card-2-desc");
    const card3Title = document.getElementById("card-3-title");
    const card3Desc = document.getElementById("card-3-desc");

    roleChips.forEach(chip => {
      chip.addEventListener("click", () => {
        roleChips.forEach(c => {
          c.classList.remove("active", "bg-primary-container", "text-on-primary-container");
          c.classList.add("bg-surface-container-high", "text-on-surface");
        });
        chip.classList.add("active", "bg-primary-container", "text-on-primary-container");
        chip.classList.remove("bg-surface-container-high", "text-on-surface");

        const target = roleProfiles[chip.dataset.role];
        if (target) {
          if (card1Title) card1Title.textContent = target.r1Title;
          if (card1Desc) card1Desc.textContent = target.r1Desc;
          if (card2Title) card2Title.textContent = target.r2Title;
          if (card2Desc) card2Desc.textContent = target.r2Desc;
          if (card3Title) card3Title.textContent = target.r3Title;
          if (card3Desc) card3Desc.textContent = target.r3Desc;
        }
      });
    });
  })();

// Meet 2 home navigation + How It Works modal.
(function wireHomeNavigation() {
  const startButtons = [
    document.getElementById('cta-start-btn'),
    document.getElementById('how-it-works-start')
  ].filter(Boolean);
  startButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.href = 'diagnostic.html';
    });
  });

  const preview = document.getElementById('cta-preview-btn');
  const modal = document.getElementById('how-it-works-modal');
  const close = document.getElementById('how-it-works-close');
  if (!modal) return;

  const openModal = () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    close?.focus();
  };
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };

  preview?.addEventListener('click', openModal);
  close?.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target?.dataset?.modalClose === 'true') closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  const gradeInput = document.querySelector('input[placeholder*="current grade"]');
  const simulateButton = Array.from(document.querySelectorAll('button')).find(
    (btn) => btn.textContent.trim().startsWith('Simulate Future')
  );
  simulateButton?.addEventListener('click', () => {
    const value = gradeInput?.value?.trim() || '';
    if (value) localStorage.setItem('meet2_home_grade_hint', value);
    window.location.href = 'diagnostic.html';
  });
})();

