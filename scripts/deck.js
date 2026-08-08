(() => {
  "use strict";

  const STORAGE_KEY = "fde-launch-deck:slide";
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

  let current = initialSlide();
  let touchStartX = null;
  let touchStartY = null;

  function initialSlide() {
    const hashMatch = window.location.hash.match(/^#slide-(\d{1,2})$/);
    if (hashMatch) {
      return clamp(Number(hashMatch[1]) - 1);
    }

    try {
      const stored = Number(window.localStorage.getItem(STORAGE_KEY));
      if (Number.isInteger(stored)) return clamp(stored);
    } catch (_) {
      // Storage can be blocked in strict privacy modes; the deck remains usable.
    }

    return 0;
  }

  function clamp(index) {
    return Math.max(0, Math.min(slides.length - 1, index));
  }

  function twoDigits(value) {
    return String(value).padStart(2, "0");
  }

  function buildOutline() {
    const fragment = document.createDocumentFragment();
    slides.forEach((slide, index) => {
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

    const title = slides[current].dataset.title || `第 ${current + 1} 页`;
    const note = slides[current].dataset.note || "";
    const percent = ((current + 1) / slides.length) * 100;

    progressBar.style.width = `${percent}%`;
    currentPage.textContent = twoDigits(current + 1);
    totalPages.textContent = twoDigits(slides.length);
    liveTitle.textContent = announce ? `${twoDigits(current + 1)} · ${title}` : "";
    notesCopy.textContent = note;
    stage.dataset.slide = String(current + 1);
    document.title = `${title} · 全球FDE发展研究报告`;

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
      // Non-fatal; see initialSlide().
    }

    window.history.replaceState(null, "", `#slide-${current + 1}`);
  }

  function goTo(index) {
    const target = clamp(index);
    if (target === current) return;
    current = target;
    render();
  }

  function next() {
    goTo(current + 1);
  }

  function previous() {
    goTo(current - 1);
  }

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

  buildOutline();
  resizeStage();
  render(false);
})();
