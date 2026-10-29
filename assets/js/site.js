// Site-wide extras, loaded on every page from footer_text in _config.yml.

// CV date badges: the theme prints single-year roles as "2022 - 2022"; show just "2022".
(function () {
  function tidyDates() {
    document.querySelectorAll(".date-column .badge").forEach((badge) => {
      const match = badge.textContent.trim().match(/^(\d{4})\s*-\s*(\d{4})$/);
      if (match && match[1] === match[2]) badge.textContent = match[1];
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tidyDates);
  else tidyDates();
})();

// Scatters a few small bacteriophage drawings in the empty side margins of each page.
// Purely decorative: hidden from screen readers, ignores clicks, skipped when the margins are too narrow.
(function () {
  const PHAGE_SVG =
    '<svg viewBox="0 0 40 60" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">' +
    '<polygon points="20,2 28.7,7 28.7,17 20,22 11.3,17 11.3,7"/>' +
    '<polyline points="11.3,7 20,12 28.7,7"/><line x1="20" y1="12" x2="20" y2="22"/>' +
    '<rect x="16" y="22" width="8" height="2.5"/>' +
    '<rect x="17.5" y="24.5" width="5" height="17"/>' +
    '<line x1="17.5" y1="29" x2="22.5" y2="29"/><line x1="17.5" y1="33" x2="22.5" y2="33"/><line x1="17.5" y1="37" x2="22.5" y2="37"/>' +
    '<rect x="14" y="41.5" width="12" height="2.5"/>' +
    '<polyline points="15,44 8,50 10,57"/><polyline points="25,44 32,50 30,57"/>' +
    '<polyline points="18,44 15,52 17,58"/><polyline points="22,44 25,52 23,58"/>' +
    "</svg>";

  const MIN_GUTTER = 70; // px of free space needed beside the content
  const SPACING = 420; // roughly one phage per this many px of page height, per side

  // Small deterministic random generator so each page keeps the same arrangement between visits.
  function seeded(seedText) {
    let seed = 0;
    for (let i = 0; i < seedText.length; i++) seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
    return function () {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function draw() {
    document.querySelectorAll(".phage-layer").forEach((layer) => layer.remove());
    const main = document.querySelector('.container[role="main"]') || document.querySelector(".container");
    if (!main) return;

    const rect = main.getBoundingClientRect();
    const pageWidth = document.documentElement.clientWidth;
    const leftGutter = rect.left;
    const rightGutter = pageWidth - rect.right;
    if (Math.min(leftGutter, rightGutter) < MIN_GUTTER) return;

    const top = rect.top + window.scrollY;
    const height = main.offsetHeight;
    const perSide = Math.max(1, Math.min(5, Math.floor(height / SPACING)));
    const random = seeded(location.pathname);

    const layer = document.createElement("div");
    layer.className = "phage-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.style.height = document.documentElement.scrollHeight + "px";

    [
      [0, leftGutter],
      [rect.right, rightGutter],
    ].forEach(([start, gutter]) => {
      for (let i = 0; i < perSide; i++) {
        const size = 32 + Math.round(random() * 16);
        const slot = height / perSide;
        const phage = document.createElement("div");
        phage.className = "phage-deco";
        phage.innerHTML = PHAGE_SVG;
        phage.style.width = size + "px";
        phage.style.left = Math.round(start + 15 + random() * Math.max(0, gutter - size - 30)) + "px";
        phage.style.top = Math.round(top + slot * i + random() * Math.max(0, slot - size * 1.5)) + "px";
        phage.style.rotate = Math.round(random() * 70 - 35) + "deg";
        phage.style.animationDelay = (-random() * 9).toFixed(1) + "s";
        layer.append(phage);
      }
    });

    document.body.append(layer);
  }

  let timer;
  function redrawSoon() {
    clearTimeout(timer);
    timer = setTimeout(draw, 200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", draw);
  else draw();
  // Content such as the Bluesky feed changes the page height after load.
  window.addEventListener("load", redrawSoon);
  window.addEventListener("resize", redrawSoon);
})();
