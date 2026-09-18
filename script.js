(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     1. ヘッダー: スクロールで背景を切り替え + モバイルメニュー
  --------------------------------------------------------- */
  const header = document.getElementById("siteHeader");
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  const onScrollHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 20);
  };
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  const closeMenu = () => {
    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------------------------------------------------------
     2. ヒーロー: ページ読み込み後にワンショットで演出を再生
  --------------------------------------------------------- */
  const hero = document.querySelector(".hero");
  requestAnimationFrame(() => {
    setTimeout(() => hero.classList.add("is-ready"), 120);
  });

  /* ---------------------------------------------------------
     3. HUD時計(装飾用・ローカル時刻を表示するだけ)
  --------------------------------------------------------- */
  const hudClock = document.getElementById("hudClock");
  if (hudClock) {
    const tick = () => {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      hudClock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------
     4. スクロールで要素をふわっと表示(IntersectionObserver)
  --------------------------------------------------------- */
  const revealTargets = document.querySelectorAll(
    ".stat-panel, .timeline-item, .member-card, .news-list li, .join-panel"
  );
  revealTargets.forEach((el) => el.classList.add("reveal-up"));

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------------------------------------------------------
     5. 隊員数カウンター(表示された瞬間に0から目標値まで加算)
  --------------------------------------------------------- */
  const counterEl = document.querySelector(".counter");
  if (counterEl) {
    const target = parseInt(counterEl.dataset.target, 10) || 0;
    const runCounter = () => {
      if (prefersReducedMotion) {
        counterEl.textContent = target;
        return;
      }
      const duration = 1200;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        counterEl.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if ("IntersectionObserver" in window) {
      const counterIo = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              runCounter();
              obs.disconnect();
            }
          });
        },
        { threshold: 0.6 }
      );
      counterIo.observe(counterEl);
    } else {
      runCounter();
    }
  }

  /* ---------------------------------------------------------
     6. ヒーロー背景: 漂う光の粒子(canvas)
  --------------------------------------------------------- */
  const canvas = document.getElementById("fieldCanvas");
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext("2d");
    let width, height, particles;
    const PARTICLE_COUNT = 70;

    const rand = (min, max) => Math.random() * (max - min) + min;

    const resize = () => {
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };

    const makeParticles = () => {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: rand(0, width),
        y: rand(0, height),
        r: rand(0.6, 2.2) * window.devicePixelRatio,
        vy: rand(0.05, 0.25) * window.devicePixelRatio,
        vx: rand(-0.05, 0.05) * window.devicePixelRatio,
        a: rand(0.15, 0.7),
        hue: Math.random() > 0.5 ? "255,154,61" : "160,180,200",
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.y -= p.vy;
        p.x += p.vx;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = rand(0, width);
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.hue},${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };

    resize();
    makeParticles();
    draw();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        makeParticles();
      }, 200);
    });
  }
})();
