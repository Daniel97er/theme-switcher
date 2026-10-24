(() => {
  "use strict";

  const THEMES = [
    { id: "standard", label: "Standard", color: "#4f46e5" },
    { id: "light", label: "Light", color: "#2563eb" },
    { id: "dark", label: "Dark", color: "#8b83ff" },
    { id: "halloween", label: "Halloween", color: "#ff812e" },
    { id: "christmas", label: "Christmas", color: "#e75b63" },
    { id: "space-blue", label: "Space Blue", color: "#56b9ff" },
    {
      id: "green-gibberish",
      label: "Green Gibberish",
      color: "#65ed83"
    }
  ];

  const STORAGE_KEY = "ts-selected-theme";
  const instances = new Set();

  let activeTheme = "standard";
  let persistenceEnabled = false;
  let nextInstanceId = 0;

  function isValidTheme(themeId) {
    return THEMES.some((theme) => theme.id === themeId);
  }

  function getTheme(themeId) {
    return THEMES.find((theme) => theme.id === themeId);
  }

  function readSavedTheme() {
    try {
      const savedTheme = window.localStorage.getItem(STORAGE_KEY);
      return isValidTheme(savedTheme) ? savedTheme : null;
    } catch {
      return null;
    }
  }

  function saveTheme(themeId) {
    if (!persistenceEnabled) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, themeId);
    } catch {
      // Theme selection still works when storage is unavailable.
    }
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined) {
      element.textContent = text;
    }

    return element;
  }

  function applyTheme(themeId, { persist = true } = {}) {
    if (!isValidTheme(themeId)) {
      return false;
    }

    const previousTheme = activeTheme;

    activeTheme = themeId;
    document.documentElement.dataset.theme = themeId;

    instances.forEach((instance) => {
      instance.refresh(themeId);
    });

    if (persist) {
      saveTheme(themeId);
    }

    if (previousTheme !== themeId) {
      document.dispatchEvent(
        new CustomEvent("themechange", {
          detail: {
            theme: themeId,
            previousTheme
          }
        })
      );
    }

    return true;
  }

  function initializeSwitcher(element) {
    if (element.dataset.themeSwitcherInitialized === "true") {
      return;
    }

    element.dataset.themeSwitcherInitialized = "true";

    const root = createElement("div", "theme-switcher");
    const trigger = createElement("button", "theme-trigger");
    const triggerContent = createElement("span", "theme-trigger-content");
    const triggerDot = createElement("span", "theme-trigger-dot");
    const triggerLabel = createElement("span", "theme-trigger-label");
    const chevron = createElement("span", "theme-chevron");
    const menu = createElement("div", "theme-menu");
    const heading = createElement("p", "theme-menu-heading", "Choose a theme");
    const options = createElement("div", "theme-options");

    const menuId = `theme-menu-${++nextInstanceId}`;

    trigger.type = "button";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", menuId);
    trigger.setAttribute("aria-label", "Choose a theme");

    triggerDot.setAttribute("aria-hidden", "true");
    chevron.setAttribute("aria-hidden", "true");

    menu.id = menuId;
    menu.hidden = true;
    menu.setAttribute("role", "listbox");
    menu.setAttribute("aria-label", "Available themes");

    options.setAttribute("role", "presentation");

    triggerContent.append(triggerDot, triggerLabel);
    trigger.append(triggerContent, chevron);
    menu.append(heading, options);
    root.append(trigger, menu);

    element.replaceChildren(root);

    const optionButtons = new Map();
    let selectedTheme = activeTheme;
    let isOpen = false;

    THEMES.forEach((theme) => {
      const button = createElement("button", "theme-option");
      const dot = createElement("span", "theme-option-dot");
      const name = createElement("span", "theme-option-name", theme.label);
      const check = createElement("span", "theme-option-check", "✓");

      button.type = "button";
      button.dataset.theme = theme.id;
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", "false");

      dot.style.setProperty("--theme-dot", theme.color);
      dot.setAttribute("aria-hidden", "true");

      check.setAttribute("aria-hidden", "true");
      check.hidden = true;

      button.append(dot, name, check);
      options.append(button);

      optionButtons.set(theme.id, { button, check });
    });

    function refresh(themeId) {
      selectedTheme = themeId;

      const theme = getTheme(themeId);

      triggerDot.style.setProperty("--theme-dot", theme.color);
      triggerLabel.textContent = theme.label;

      optionButtons.forEach(({ button, check }, id) => {
        const selected = id === themeId;

        button.setAttribute("aria-selected", String(selected));
        check.hidden = !selected;
      });
    }

    function closeMenu(restoreFocus = false) {
      if (!isOpen) {
        return;
      }

      isOpen = false;
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");

      if (restoreFocus) {
        trigger.focus();
      }
    }

    function openMenu() {
      if (isOpen) {
        return;
      }

      isOpen = true;
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");

      optionButtons.get(selectedTheme).button.focus();
    }

    trigger.addEventListener("click", () => {
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    optionButtons.forEach(({ button }, themeId) => {
      button.addEventListener("click", () => {
        applyTheme(themeId);
        closeMenu(true);
      });
    });

    menu.addEventListener("keydown", (event) => {
      const themeIds = THEMES.map((theme) => theme.id);

      const currentIndex = themeIds.findIndex(
        (id) => optionButtons.get(id).button === document.activeElement
      );

      let nextIndex;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          nextIndex = (currentIndex + 1 + themeIds.length) % themeIds.length;
          break;

        case "ArrowUp":
          event.preventDefault();
          nextIndex = (currentIndex - 1 + themeIds.length) % themeIds.length;
          break;

        case "Home":
          event.preventDefault();
          nextIndex = 0;
          break;

        case "End":
          event.preventDefault();
          nextIndex = themeIds.length - 1;
          break;

        case "Escape":
          event.preventDefault();
          closeMenu(true);
          return;

        default:
          return;
      }

      optionButtons.get(themeIds[nextIndex]).button.focus();
    });

    function handleOutsidePointer(event) {
      if (isOpen && !element.contains(event.target)) {
        closeMenu();
      }
    }

    function handleOutsideFocus(event) {
      if (isOpen && !element.contains(event.target)) {
        closeMenu();
      }
    }

    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("focusin", handleOutsideFocus);

    const instance = {
      element,

      refresh,

      destroy() {
        document.removeEventListener("pointerdown", handleOutsidePointer);
        document.removeEventListener("focusin", handleOutsideFocus);

        instances.delete(instance);

        element.replaceChildren();
        delete element.dataset.themeSwitcherInitialized;
      }
    };

    instances.add(instance);
    refresh(activeTheme);
  }

  function initialize() {
    const elements = document.querySelectorAll("[data-theme-switcher]");

    if (elements.length === 0) {
      return;
    }

    persistenceEnabled = Array.from(elements).some(
      (element) => element.dataset.persist === "true"
    );

    const savedTheme = persistenceEnabled ? readSavedTheme() : null;
    const firstDefault = elements[0].dataset.defaultTheme;

    const defaultTheme = isValidTheme(firstDefault)
      ? firstDefault
      : "standard";

    activeTheme = savedTheme || defaultTheme;
    document.documentElement.dataset.theme = activeTheme;

    elements.forEach(initializeSwitcher);

    window.ThemeSwitcher = {
      themes: THEMES.map((theme) => ({ ...theme })),

      get currentTheme() {
        return activeTheme;
      },

      setTheme(themeId) {
        return applyTheme(themeId);
      }
    };

    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY && isValidTheme(event.newValue)) {
        applyTheme(event.newValue, { persist: false });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }
})();
