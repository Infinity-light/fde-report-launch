(() => {
  "use strict";

  const STORAGE_KEY = "fde-launch-deck-v49:slide";
  const stage = document.querySelector("#stage");
  const viewport = document.querySelector("#deck");
  const slides = Array.from(document.querySelectorAll(".slide"));
  const progressBar = document.querySelector("#progress-bar");
  const currentPage = document.querySelector("#current-page");
  const totalPages = document.querySelector("#total-pages");
  const liveTitle = document.querySelector("#live-title");
  const outlinePanel = document.querySelector("#outline-panel");
  const outlineList = document.querySelector("#outline-list");
  const notesPanel = document.querySelector("#notes-panel");
  const notesCopy = document.querySelector("#notes-copy");
  const helpDialog = document.querySelector("#help-dialog");
  const fullscreenButton = document.querySelector('[data-action="fullscreen"]');
  const previousButtons = Array.from(document.querySelectorAll('[data-action="previous"]'));
  const nextButtons = Array.from(document.querySelectorAll('[data-action="next"]'));
  const particles = createParticleField(document.querySelector("#particle-field"));

  let current = initialSlide();
  let touchStartX = null;
  let touchStartY = null;

  function initialSlide() {
    const hashMatch = window.location.hash.match(/^#slide-(\d{1,2})$/);
    if (hashMatch) return clamp(Number(hashMatch[1]) - 1);

    try {
      const stored = Number(window.localStorage.getItem(STORAGE_KEY));
      if (Number.isInteger(stored)) return clamp(stored);
    } catch (_) {
      // The presentation remains usable when storage is unavailable.
    }

    return 0;
  }

  function clamp(index) {
    return Math.max(0, Math.min(slides.length - 1, index));
  }

  function twoDigits(value) {
    return String(value).padStart(2, "0");
  }

  function normalizeSlides() {
    slides.forEach((slide, index) => {
      const page = index + 1;
      const title = slide.dataset.title || `第 ${page} 页`;
      slide.setAttribute("aria-label", `第${page}页：${title}`);
      const folio = slide.querySelector(".slide-folio");
      if (folio) folio.textContent = twoDigits(page);
    });
    totalPages.textContent = twoDigits(slides.length);
  }

  function buildOutline() {
    const fragment = document.createDocumentFragment();
    let currentChapter = "";
    slides.forEach((slide, index) => {
      const chapter = slide.dataset.chapter || "其他";
      if (chapter !== currentChapter) {
        currentChapter = chapter;
        const label = document.createElement("li");
        label.className = "outline-list__chapter";
        label.textContent = chapter;
        label.setAttribute("aria-hidden", "true");
        fragment.append(label);
      }
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.slideIndex = String(index);
      button.setAttribute("aria-label", `跳到第 ${index + 1} 页：${slide.dataset.title}`);
      button.innerHTML = `<span>${twoDigits(index + 1)}</span><span>${slide.dataset.title}</span>`;
      button.addEventListener("click", () => {
        goTo(index);
        toggleOutline(false);
        stage.focus({ preventScroll: true });
      });
      item.append(button);
      fragment.append(item);
    });
    outlineList.replaceChildren(fragment);
  }

  function render(announce = true) {
    slides.forEach((slide, index) => {
      const active = index === current;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
    });

    const activeSlide = slides[current];
    const title = activeSlide.dataset.title || `第 ${current + 1} 页`;
    const note = activeSlide.dataset.note || "";
    const percent = ((current + 1) / slides.length) * 100;

    progressBar.style.width = `${percent}%`;
    currentPage.textContent = twoDigits(current + 1);
    totalPages.textContent = twoDigits(slides.length);
    liveTitle.textContent = announce ? `${twoDigits(current + 1)} · ${title}` : "";
    notesCopy.textContent = note;
    stage.dataset.slide = String(current + 1);
    stage.dataset.scene = activeSlide.dataset.scene || "default";
    document.title = `${title} · 全球 FDE 发展研究报告`;
    particles.setScene(stage.dataset.scene);

    previousButtons.forEach((button) => {
      button.disabled = current === 0;
      button.setAttribute("aria-disabled", String(current === 0));
    });
    nextButtons.forEach((button) => {
      button.disabled = current === slides.length - 1;
      button.setAttribute("aria-disabled", String(current === slides.length - 1));
    });

    outlineList.querySelectorAll("button").forEach((button, index) => {
      if (index === current) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });

    try {
      window.localStorage.setItem(STORAGE_KEY, String(current));
    } catch (_) {
      // Storage is optional.
    }

    window.history.replaceState(null, "", `#slide-${current + 1}`);
  }

  function goTo(index) {
    const target = clamp(index);
    if (target === current) return;
    current = target;
    render();
  }

  function next() { goTo(current + 1); }
  function previous() { goTo(current - 1); }

  function resizeStage() {
    const availableWidth = viewport.clientWidth;
    const availableHeight = viewport.clientHeight;
    const scale = Math.min(availableWidth / 1600, availableHeight / 900);
    document.documentElement.style.setProperty("--deck-scale", String(scale));
    stage.dataset.scale = scale.toFixed(4);
  }

  function toggleOutline(force) {
    const open = typeof force === "boolean" ? force : !outlinePanel.classList.contains("is-open");
    outlinePanel.classList.toggle("is-open", open);
    outlinePanel.setAttribute("aria-hidden", String(!open));
    if (open) outlinePanel.querySelector("button")?.focus();
  }

  function toggleNotes(force) {
    const open = typeof force === "boolean" ? force : !notesPanel.classList.contains("is-open");
    notesPanel.classList.toggle("is-open", open);
    notesPanel.setAttribute("aria-hidden", String(!open));
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (error) {
      console.warn("Fullscreen request was not accepted by this browser.", error);
    }
  }

  function toggleHelp() {
    if (helpDialog.open) helpDialog.close();
    else helpDialog.showModal();
  }

  function runAction(action) {
    if (action === "next") next();
    if (action === "previous") previous();
    if (action === "outline") toggleOutline();
    if (action === "notes") toggleNotes();
    if (action === "fullscreen") toggleFullscreen();
    if (action === "help") toggleHelp();
  }

  function onKeydown(event) {
    if (event.defaultPrevented) return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

    const key = event.key;
    if (key === "ArrowRight" || key === "PageDown" || key === " ") {
      event.preventDefault();
      next();
    } else if (key === "ArrowLeft" || key === "PageUp") {
      event.preventDefault();
      previous();
    } else if (key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (key === "End") {
      event.preventDefault();
      goTo(slides.length - 1);
    } else if (key.toLowerCase() === "f") {
      event.preventDefault();
      toggleFullscreen();
    } else if (key.toLowerCase() === "o") {
      event.preventDefault();
      toggleOutline();
    } else if (key.toLowerCase() === "n") {
      event.preventDefault();
      toggleNotes();
    } else if (key === "?") {
      event.preventDefault();
      toggleHelp();
    } else if (key === "Escape" && outlinePanel.classList.contains("is-open")) {
      toggleOutline(false);
    }
  }

  function onTouchStart(event) {
    if (event.touches.length !== 1) return;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }

  function onTouchEnd(event) {
    if (touchStartX === null || touchStartY === null || !event.changedTouches.length) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const deltaY = event.changedTouches[0].clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.25) return;
    if (deltaX < 0) next();
    else previous();
  }

  function createParticleField(canvas) {
    const context = canvas.getContext("2d", { alpha: true });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const width = 1600;
    const height = 900;
    const sceneProfiles = {
      cover: { x: 1168, y: 445, density: 224, speed: 1.38, alpha: 1, trail: 30 },
      core: { x: 930, y: 445, density: 100, speed: .82, alpha: .62 },
      orbit: { x: 1110, y: 450, density: 118, speed: .9, alpha: .72 },
      network: { x: 930, y: 460, density: 92, speed: .55, alpha: .5 },
      trajectory: { x: 1110, y: 410, density: 86, speed: .65, alpha: .46 },
      matrix: { x: 820, y: 440, density: 72, speed: .48, alpha: .34 },
      pulse: { x: 810, y: 455, density: 88, speed: .72, alpha: .46 },
      spectrum: { x: 980, y: 460, density: 70, speed: .42, alpha: .32 },
      curve: { x: 1050, y: 430, density: 72, speed: .5, alpha: .32 },
      china: { x: 405, y: 470, density: 108, speed: .72, alpha: .58 },
      flow: { x: 1010, y: 450, density: 78, speed: .56, alpha: .38 },
      release: { x: 1300, y: 430, density: 168, speed: 1.08, alpha: .88, trail: 24 },
      default: { x: 1030, y: 440, density: 76, speed: .52, alpha: .36 },
    };
    const dots = [];
    let profile = sceneProfiles.cover;
    let frame = 0;
    let animationFrame = 0;

    canvas.width = width;
    canvas.height = height;

    function seed() {
      dots.length = 0;
      const count = reducedMotion.matches ? Math.min(profile.density, 52) : profile.density;
      for (let index = 0; index < count; index += 1) {
        const distanceBias = Math.pow(Math.random(), .62);
        dots.push({
          angle: Math.random() * Math.PI * 2,
          radius: 80 + distanceBias * 610,
          flatten: .28 + Math.random() * .44,
          speed: (.0007 + Math.random() * .0021) * (Math.random() > .18 ? 1 : -1),
          size: .6 + Math.random() * 2.1,
          alpha: .18 + Math.random() * .72,
          wobble: 4 + Math.random() * 28,
          phase: Math.random() * Math.PI * 2,
          tint: Math.random(),
        });
      }
    }

    function setScene(name) {
      profile = sceneProfiles[name] || sceneProfiles.default;
      seed();
      if (reducedMotion.matches) draw();
    }

    function point(dot, offset = 0) {
      const angle = dot.angle + offset;
      return {
        x: profile.x + Math.cos(angle) * dot.radius,
        y: profile.y + Math.sin(angle) * dot.radius * dot.flatten + Math.sin(angle * 2 + dot.phase) * dot.wobble,
      };
    }

    function drawOrbitalGuide(time) {
      context.save();
      context.translate(profile.x, profile.y);
      context.rotate(time * .00003);
      context.strokeStyle = `rgba(127, 205, 255, ${.025 * profile.alpha})`;
      context.lineWidth = 1;
      for (let index = 0; index < 4; index += 1) {
        context.beginPath();
        context.ellipse(0, 0, 145 + index * 105, 55 + index * 57, index * .31, 0, Math.PI * 2);
        context.stroke();
      }
      context.restore();
    }

    function draw(time = 0) {
      context.clearRect(0, 0, width, height);
      drawOrbitalGuide(time);
      context.save();
      context.globalCompositeOperation = "lighter";

      for (const dot of dots) {
        if (!reducedMotion.matches) dot.angle += dot.speed * profile.speed;
        const now = point(dot);
        const previous = point(dot, -dot.speed * profile.speed * (profile.trail || 13));
        const alpha = dot.alpha * profile.alpha;
        const color = dot.tint > .76 ? "240,250,255" : dot.tint > .23 ? "103,204,255" : "32,139,230";

        context.beginPath();
        context.moveTo(previous.x, previous.y);
        context.lineTo(now.x, now.y);
        context.strokeStyle = `rgba(${color}, ${alpha * .22})`;
        context.lineWidth = Math.max(.45, dot.size * .38);
        context.stroke();

        context.beginPath();
        context.arc(now.x, now.y, dot.size, 0, Math.PI * 2);
        context.fillStyle = `rgba(${color}, ${alpha})`;
        context.shadowColor = `rgba(${color}, ${alpha})`;
        context.shadowBlur = 8 + dot.size * 5;
        context.fill();
      }
      context.restore();

      frame += 1;
      if (frame % 3 === 0 && profile.alpha > .45) drawConnections();
    }

    function drawConnections() {
      const sample = dots.slice(0, Math.min(34, dots.length));
      context.save();
      context.lineWidth = .45;
      for (let first = 0; first < sample.length; first += 1) {
        const a = point(sample[first]);
        for (let second = first + 1; second < sample.length; second += 1) {
          const b = point(sample[second]);
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance > 115) continue;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.strokeStyle = `rgba(116, 205, 255, ${(1 - distance / 115) * .09 * profile.alpha})`;
          context.stroke();
        }
      }
      context.restore();
    }

    function animate(time) {
      if (!document.hidden && !reducedMotion.matches) draw(time);
      animationFrame = window.requestAnimationFrame(animate);
    }

    reducedMotion.addEventListener?.("change", () => {
      seed();
      draw();
    });
    seed();
    animationFrame = window.requestAnimationFrame(animate);

    return {
      setScene,
      destroy() { window.cancelAnimationFrame(animationFrame); },
    };
  }

  document.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;
    runAction(actionTarget.dataset.action);
  });
  document.addEventListener("keydown", onKeydown);
  stage.addEventListener("touchstart", onTouchStart, { passive: true });
  stage.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("resize", resizeStage, { passive: true });
  window.addEventListener("orientationchange", resizeStage, { passive: true });
  window.addEventListener("hashchange", () => {
    const match = window.location.hash.match(/^#slide-(\d{1,2})$/);
    if (match) goTo(Number(match[1]) - 1);
  });
  document.addEventListener("fullscreenchange", () => {
    const isFullscreen = Boolean(document.fullscreenElement);
    fullscreenButton.textContent = isFullscreen ? "退出" : "全屏";
    fullscreenButton.setAttribute("aria-label", isFullscreen ? "退出全屏" : "切换全屏");
    resizeStage();
  });
  window.addEventListener("beforeunload", () => particles.destroy(), { once: true });

  normalizeSlides();
  buildOutline();
  resizeStage();
  render(false);
})();
