(() => {
  "use strict";

  const switcher = document.getElementById("site-theme-switcher");
  const trigger = document.getElementById("theme-switcher-trigger");
  const menu = document.getElementById("theme-switcher-menu");
  const status = document.getElementById("theme-switcher-status");

  if (
    !switcher ||
    !trigger ||
    !menu ||
    switcher.dataset.initialized === "true"
  ) {
    return;
  }

  const options = Array.from(menu.querySelectorAll("[data-theme]"));

  const validThemes = new Set([
    "standard",
    "light",
    "dark",
    "halloween",
    "christmas",
    "space-blue",
    "green-gibberish"
  ]);

  const themeLabels = {
    standard: "Standard",
    light: "Light",
    dark: "Dark",
    halloween: "Halloween",
    christmas: "Christmas",
    "space-blue": "Space Blue",
    "green-gibberish": "Green Gibberish"
  };

  let open = false;
  let positionFrame = 0;

  switcher.dataset.initialized = "true";

  /*
    Move the menu directly under document.body.
    This prevents ancestor overflow and transform rules from clipping it.
  */

  menu.dataset.portal = "true";
  document.body.appendChild(menu);

  function setTheme(theme) {
    if (!validThemes.has(theme)) {
      return;
    }

    document.body.dataset.theme = theme;

    options.forEach((option) => {
      option.setAttribute(
        "aria-pressed",
        String(option.dataset.theme === theme)
      );
    });

    if (status) {
      status.textContent = `${themeLabels[theme]} theme active`;
    }

    try {
      localStorage.setItem("site-theme", theme);
    } catch {
      // Theme selection still works if storage is blocked.
    }
  }

  function viewportBounds() {
    const visual = window.visualViewport;

    const left = visual ? visual.offsetLeft : 0;
    const top = visual ? visual.offsetTop : 0;
    const width = visual
      ? visual.width
      : document.documentElement.clientWidth;
    const height = visual
      ? visual.height
      : document.documentElement.clientHeight;

    const margin = 12;

    return {
      left: left + margin,
      top: top + margin,
      right: left + width - margin,
      bottom: top + height - margin,
      width: Math.max(0, width - margin * 2),
      height: Math.max(0, height - margin * 2)
    };
  }

  function positionMenu() {
    if (!open) {
      return;
    }

    const bounds = viewportBounds();
    const anchor = trigger.getBoundingClientRect();
    const gap = 8;

    /*
      Constrain the menu to the visible viewport before measuring it.
    */

    menu.style.maxWidth = `${Math.max(0, bounds.width)}px`;
    menu.style.maxHeight = `${Math.max(0, bounds.height)}px`;
    menu.style.left = `${bounds.left}px`;
    menu.style.top = `${bounds.top}px`;
    menu.style.visibility = "hidden";

    const menuRect = menu.getBoundingClientRect();
    const menuWidth = Math.min(menuRect.width, bounds.width);
    const menuHeight = Math.min(menuRect.height, bounds.height);

    let left = anchor.right - menuWidth;

    left = Math.max(
      bounds.left,
      Math.min(left, bounds.right - menuWidth)
    );

    const roomBelow = bounds.bottom - anchor.bottom - gap;
    const roomAbove = anchor.top - bounds.top - gap;

    const shouldOpenAbove =
      menuHeight > roomBelow && roomAbove > roomBelow;

    const availableHeight = shouldOpenAbove
      ? roomAbove
      : roomBelow;

    if (menuHeight > availableHeight) {
      menu.style.maxHeight = `${Math.max(
        120,
        Math.min(bounds.height, availableHeight)
      )}px`;
    }

    /*
      Re-measure after changing max-height.
      The menu can scroll internally if the available space is limited.
    */

    const finalHeight = Math.min(
      menu.getBoundingClientRect().height,
      bounds.height
    );

    let top = shouldOpenAbove
      ? anchor.top - gap - finalHeight
      : anchor.bottom + gap;

    /*
      Keep the menu inside the viewport even when neither side
      has enough space for the complete menu.
    */

    top = Math.max(
      bounds.top,
      Math.min(top, bounds.bottom - finalHeight)
    );

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.style.visibility = "visible";
  }

  function schedulePosition() {
    if (!open || positionFrame) {
      return;
    }

    positionFrame = window.requestAnimationFrame(() => {
      positionFrame = 0;
      positionMenu();
    });
  }

  function openMenu(focusFirst = false) {
    if (open) {
      if (focusFirst) {
        options[0]?.focus();
      }

      return;
    }

    open = true;
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");

    positionMenu();

    if (focusFirst) {
      options[0]?.focus();
    }
  }

  function closeMenu(returnFocus = false) {
    if (!open) {
      return;
    }

    open = false;
    menu.hidden = true;
    menu.style.visibility = "";
    trigger.setAttribute("aria-expanded", "false");

    if (positionFrame) {
      window.cancelAnimationFrame(positionFrame);
      positionFrame = 0;
    }

    if (returnFocus) {
      trigger.focus();
    }
  }

  trigger.addEventListener("click", () => {
    if (open) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  options.forEach((option) => {
    option.addEventListener("click", () => {
      setTheme(option.dataset.theme);
      closeMenu(true);
    });
  });

  /*
    Keyboard support for opening, navigating and closing the menu.
  */

  switcher.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!open) {
        openMenu(true);
      } else {
        const index = options.indexOf(document.activeElement);

        options[
          (index + 1 + options.length) % options.length
        ]?.focus();
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!open) {
        openMenu();
        options[options.length - 1]?.focus();
      } else {
        const index = options.indexOf(document.activeElement);

        options[
          (index <= 0 ? options.length : index) - 1
        ]?.focus();
      }
    } else if (event.key === "Home" && open) {
      event.preventDefault();
      options[0]?.focus();
    } else if (event.key === "End" && open) {
      event.preventDefault();
      options[options.length - 1]?.focus();
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      closeMenu(true);
    } else if (event.key === "Tab" && open) {
      // Allow normal Tab navigation to continue.
      closeMenu();
    }
  });

  /*
    Close the menu when the user clicks outside it.
  */

  document.addEventListener("pointerdown", (event) => {
    if (
      open &&
      !switcher.contains(event.target) &&
      !menu.contains(event.target)
    ) {
      closeMenu();
    }
  });

  /*
    Reposition the menu when the viewport or page scroll position changes.
  */

  window.addEventListener("resize", schedulePosition, {
    passive: true
  });

  window.addEventListener("scroll", schedulePosition, {
    passive: true,
    capture: true
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener(
      "resize",
      schedulePosition,
      { passive: true }
    );

    window.visualViewport.addEventListener(
      "scroll",
      schedulePosition,
      { passive: true }
    );
  }

  /*
    Demo buttons open the same theme menu.
    Remove these listeners when integrating the switcher into another page.
  */

  ["demo-open-theme", "demo-card-theme"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", () => {
      openMenu(true);
    });
  });

  /*
    Restore the saved theme, if one exists.
  */

  let initialTheme = document.body.dataset.theme || "standard";

  try {
    const savedTheme = localStorage.getItem("site-theme");

    if (savedTheme && validThemes.has(savedTheme)) {
      initialTheme = savedTheme;
    }
  } catch {
    // Keep the default theme when browser storage is unavailable.
  }

  setTheme(
    validThemes.has(initialTheme)
      ? initialTheme
      : "standard"
  );
})();
