/* ==========================================
   GRACE CATHEDRAL — SCRIPT.JS
   3D Particles · Scroll Animations · UI
   ========================================== */

   (function () {
    "use strict";
  
    /* ===========================================
       1. 3D PARTICLE CANVAS
    =========================================== */
    const canvas = document.getElementById("particleCanvas");
    const ctx = canvas.getContext("2d");
  
    let W, H, particles = [], mouse = { x: -1000, y: -1000 };
    const PARTICLE_COUNT = window.innerWidth < 768 ? 70 : 140;
    const CONNECTION_DIST = 160;
    const GOLD = { r: 212, g: 175, b: 95 };
  
    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", () => { resize(); initParticles(); });
  
    /* Particle factory */
    function createParticle() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random() * 400 + 50,          // depth 50–450
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        vz: (Math.random() - 0.5) * 0.5,
        baseZ: 0,
        size: Math.random() * 1.5 + 0.5,
      };
    }
  
    function initParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle());
    }
    initParticles();
  
    /* Project 3D point to 2D screen with perspective */
    function project(p) {
      const fov = 500;
      const scale = fov / (fov + p.z);
      return {
        sx: p.x * scale + W * (1 - scale) * 0.5,
        sy: p.y * scale + H * (1 - scale) * 0.5,
        scale,
      };
    }
  
    /* Mouse influence */
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener("mouseleave", () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });
  
    let frameId, time = 0;
  
    function drawParticles() {
      ctx.clearRect(0, 0, W, H);
      time += 0.005;
  
      /* Subtle vignette */
      const vg = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.85);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(10,9,6,0.55)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
  
      /* Update & draw each particle */
      particles.forEach((p, i) => {
        // Gentle drift
        p.x += p.vx + Math.sin(time + i * 0.4) * 0.12;
        p.y += p.vy + Math.cos(time + i * 0.3) * 0.10;
        p.z += p.vz;
  
        // Mouse repulsion (gentle)
        const proj = project(p);
        const dx = proj.sx - mouse.x;
        const dy = proj.sy - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          p.vx += (dx / dist) * force * 0.08;
          p.vy += (dy / dist) * force * 0.08;
        }
  
        // Dampen velocity
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.vz *= 0.992;
  
        // Wrap around edges
        if (p.x < -50) p.x = W + 50;
        if (p.x > W + 50) p.x = -50;
        if (p.y < -50) p.y = H + 50;
        if (p.y > H + 50) p.y = -50;
        if (p.z < 50) p.z = 450;
        if (p.z > 450) p.z = 50;
  
        // Draw particle dot
        const { sx, sy, scale } = project(p);
        const alpha = scale * 0.7 + 0.1;
        const radius = (p.size + 0.5) * scale;
  
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${GOLD.r},${GOLD.g},${GOLD.b},${alpha})`;
        ctx.fill();
  
        // Small glow for close particles
        if (scale > 0.6) {
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius * 5);
          glow.addColorStop(0, `rgba(${GOLD.r},${GOLD.g},${GOLD.b},${alpha * 0.15})`);
          glow.addColorStop(1, `rgba(${GOLD.r},${GOLD.g},${GOLD.b},0)`);
          ctx.beginPath();
          ctx.arc(sx, sy, radius * 5, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }
      });
  
      /* Draw connections */
      for (let i = 0; i < particles.length; i++) {
        const pi = project(particles[i]);
        for (let j = i + 1; j < particles.length; j++) {
          const pj = project(particles[j]);
          const dx = pi.sx - pj.sx;
          const dy = pi.sy - pj.sy;
          const dist = Math.sqrt(dx * dx + dy * dy);
  
          if (dist < CONNECTION_DIST) {
            const avgScale = (pi.scale + pj.scale) / 2;
            const alpha = (1 - dist / CONNECTION_DIST) * avgScale * 0.22;
            ctx.beginPath();
            ctx.moveTo(pi.sx, pi.sy);
            ctx.lineTo(pj.sx, pj.sy);
            ctx.strokeStyle = `rgba(${GOLD.r},${GOLD.g},${GOLD.b},${alpha})`;
            ctx.lineWidth = avgScale * 0.7;
            ctx.stroke();
          }
        }
      }
  
      frameId = requestAnimationFrame(drawParticles);
    }
  
    drawParticles();
  
  
    /* ===========================================
       2. HEADER SCROLL BEHAVIOUR
    =========================================== */
    const header = document.getElementById("header");
  
    function onScroll() {
      if (window.scrollY > 60) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  
  
    /* ===========================================
       3. MOBILE HAMBURGER MENU
    =========================================== */
    const hamburger = document.getElementById("hamburger");
    const mobileOverlay = document.getElementById("mobileOverlay");
  
    function toggleMenu() {
      const isOpen = mobileOverlay.classList.toggle("open");
      hamburger.classList.toggle("active", isOpen);
      document.body.style.overflow = isOpen ? "hidden" : "";
    }
  
    hamburger.addEventListener("click", toggleMenu);
  
    mobileOverlay.querySelectorAll(".mob-link, .mob-cta").forEach((link) => {
      link.addEventListener("click", () => {
        mobileOverlay.classList.remove("open");
        hamburger.classList.remove("active");
        document.body.style.overflow = "";
      });
    });
  
  
    /* ===========================================
       4. SCROLL REVEAL ANIMATIONS
    =========================================== */
    const revealEls = document.querySelectorAll(".reveal, .fade-up");
  
    // Add fade-up to all section elements not already tagged
    document.querySelectorAll(
      ".section-title, .section-tag, .gold-rule, .about-body, .about-stats, " +
      ".about-image-frame, .about-quote, .service-card, .event-item, " +
      ".contact-details, .contact-form-wrap, .contact-intro"
    ).forEach((el) => {
      if (!el.classList.contains("reveal") && !el.classList.contains("fade-up")) {
        el.classList.add("fade-up");
      }
    });
  
    const allReveal = document.querySelectorAll(".reveal, .fade-up");
  
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
  
    allReveal.forEach((el) => observer.observe(el));
  
    // Stagger service cards
    document.querySelectorAll(".service-card").forEach((card, i) => {
      card.style.transitionDelay = `${i * 0.08}s`;
    });
  
    // Stagger event items
    document.querySelectorAll(".event-item").forEach((item, i) => {
      item.style.transitionDelay = `${i * 0.1}s`;
    });
  
  
    /* ===========================================
       5. ACTIVE NAV LINK HIGHLIGHT
    =========================================== */
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav-link");
  
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            navLinks.forEach((link) => {
              link.style.color = "";
              if (link.getAttribute("href") === `#${id}`) {
                link.style.color = "var(--gold)";
              }
            });
          }
        });
      },
      { threshold: 0.4 }
    );
  
    sections.forEach((s) => sectionObserver.observe(s));
  
  
    /* ===========================================
       6. CONTACT FORM SEND BUTTON ANIMATION
    =========================================== */
    const sendBtn = document.getElementById("sendBtn");
  
    if (sendBtn) {
      sendBtn.addEventListener("click", function () {
        const inputs = document.querySelectorAll(".form-input");
        let filled = true;
        inputs.forEach((input) => {
          if (!input.value.trim()) {
            filled = false;
            input.style.borderColor = "rgba(212,95,95,0.5)";
            setTimeout(() => (input.style.borderColor = ""), 2000);
          }
        });
  
        if (!filled) return;
  
        sendBtn.textContent = "Sending…";
        sendBtn.style.opacity = "0.7";
        sendBtn.style.pointerEvents = "none";
  
        setTimeout(() => {
          sendBtn.textContent = "✓ Message Sent — God Bless You";
          sendBtn.style.opacity = "1";
          sendBtn.style.background = "linear-gradient(135deg, #4a8a5f, #6ab87c)";
          setTimeout(() => {
            sendBtn.textContent = "Send Message";
            sendBtn.style.background = "";
            sendBtn.style.pointerEvents = "";
            inputs.forEach((i) => (i.value = ""));
          }, 4000);
        }, 1800);
      });
    }
  
  
    /* ===========================================
       7. SMOOTH PARALLAX ON HERO SCROLL
    =========================================== */
    const heroContent = document.querySelector(".hero-content");
  
    window.addEventListener(
      "scroll",
      () => {
        const scrollY = window.scrollY;
        if (heroContent && scrollY < window.innerHeight) {
          heroContent.style.transform = `translateY(${scrollY * 0.3}px)`;
          heroContent.style.opacity = `${1 - scrollY / (window.innerHeight * 0.8)}`;
        }
      },
      { passive: true }
    );
  
  
    /* ===========================================
       8. STATS COUNT-UP ANIMATION
    =========================================== */
    const stats = document.querySelectorAll(".stat-num");
  
    function countUp(el) {
      const raw = el.textContent.trim();
      const hasPlus = raw.includes("+");
      const num = parseInt(raw.replace(/\D/g, ""), 10);
      const suffix = hasPlus ? "+" : "";
      let start = 0;
      const duration = 1600;
      const step = 16;
      const increment = num / (duration / step);
  
      const timer = setInterval(() => {
        start += increment;
        if (start >= num) {
          start = num;
          clearInterval(timer);
        }
        el.textContent = Math.floor(start).toLocaleString() + suffix;
      }, step);
    }
  
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            countUp(entry.target);
            statsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
  
    stats.forEach((s) => statsObserver.observe(s));
  
  
    /* ===========================================
       9. HERO TITLE LETTER ENTRANCE
    =========================================== */
    window.addEventListener("load", () => {
      const heroTitle = document.querySelector(".hero-title");
      if (heroTitle) {
        heroTitle.style.opacity = "1";
        heroTitle.style.transform = "translateY(0)";
      }
  
      // Trigger initial reveals (elements in viewport on load)
      document.querySelectorAll(".reveal, .fade-up").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9) {
          el.classList.add("visible");
        }
      });
    });
  
  })();
  