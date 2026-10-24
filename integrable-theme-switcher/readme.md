Please Test the program before you use it there can be errors!
I have done this for learning experience and I am not a professional programmer.

# How to Use the Theme Switcher

## Installation

Add the following lines to the `<head>` section of your HTML document:

```html
<link rel="stylesheet" href="styles.css">
<script src="script.js" defer></script>
```

## Setup

Add the theme switcher wherever you want it to appear on your webpage:

```html
<div
  data-theme-switcher
  data-default-theme="standard"
  data-persist="true"
></div>
```

The theme switcher is generated automatically by JavaScript.

## Configuration

Set `data-default-theme` to choose the default theme. Available themes are `standard`, `light`, `dark`, `halloween`, `christmas`, `space-blue`, and `green-gibberish`.

Set `data-persist="true"` to remember the selected theme using `localStorage`. Use `data-persist="false"` to disable persistence.

## Styling Your Website

Use the provided CSS custom properties to make your webpage adapt to the selected theme:

```css
body {
  background-color: var(--ts-page);
  color: var(--ts-text);
}

.card {
  background-color: var(--ts-surface);
  border: 1px solid var(--ts-border);
}

.button {
  background-color: var(--ts-primary);
  color: var(--ts-primary-contrast);
}
```

Use these variables instead of hard-coded colors for elements that should change with the active theme.

## JavaScript API

Change the active theme programmatically:

```javascript
window.ThemeSwitcher.setTheme("dark");
```

Get the currently selected theme:

```javascript
const currentTheme = window.ThemeSwitcher.currentTheme;
```

Listen for theme changes:

```javascript
document.addEventListener("themechange", (event) => {
  console.log("Selected theme:", event.detail.theme);
});
```

## Integration into an Existing Website

1. Add `styles.css` and `script.js` to your project.
2. Include both files in your HTML.
3. Add the element with the `data-theme-switcher` attribute.
4. Use the CSS custom properties for elements that should respond to theme changes.
5. Test the available themes and check that your webpage remains readable on desktop and mobile devices.
