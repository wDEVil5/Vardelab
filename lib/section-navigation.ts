/** La landing de organizaciones tiene su propia sección «Cómo funciona». */
export function resolveSectionHref(href: string, pathname: string) {
  if (href === "/#como-funciona" && pathname === "/organizaciones") {
    return "/organizaciones#como-funciona";
  }
  return href;
}

export function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return false;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const distance = Math.abs(target.getBoundingClientRect().top);
  // Next guarda el estado de la ruta en history.state. No reemplazarlo por null:
  // al sincronizar la URL podría restaurar la ruta anterior y deshacer el salto.
  if (window.location.hash !== `#${id}`) {
    window.history.pushState(
      window.history.state,
      "",
      `${window.location.pathname}${window.location.search}#${id}`,
    );
  }

  if (reduceMotion || distance < window.innerHeight) {
    target.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
    return true;
  }

  document.querySelector(".section-jump-overlay")?.remove();
  const overlay = document.createElement("div");
  overlay.className = "section-jump-overlay";
  overlay.setAttribute("aria-hidden", "true");
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add("section-jump-overlay--visible"));
  window.setTimeout(() => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    target.scrollIntoView({ behavior: "instant", block: "start" });

    requestAnimationFrame(() => {
      overlay.classList.remove("section-jump-overlay--visible");
      window.setTimeout(() => {
        overlay.remove();
        root.style.scrollBehavior = previousBehavior;
      }, 280);
    });
  }, 190);

  return true;
}
