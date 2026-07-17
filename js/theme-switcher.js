/* =========================================================
   THEME SWITCHER
   Lets visitors pick a preset palette or a fully custom color.
   Choice is saved to localStorage and applied on every page.
========================================================= */

(function () {
  var STORAGE_KEY = "sd-theme";
  var STORAGE_CUSTOM_KEY = "sd-theme-custom-color";

  var PRESETS = ["mango", "teal", "navy", "mint", "coral"];

  /* ---- color helpers (hex <-> HSL) so a custom pick can derive
     light/dark/tint shades automatically ---- */
  function hexToRgb(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) {
      hex = hex.split("").map(function (c) { return c + c; }).join("");
    }
    var num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(function (v) {
      return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
    }).join("");
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h, s: s, l: l };
  }

  function hslToRgb(h, s, l) {
    var r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      var hue2rgb = function (p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
  }

  function shade(hex, lightnessDelta, satDelta) {
    var rgb = hexToRgb(hex);
    var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    var newL = Math.max(0, Math.min(1, hsl.l + lightnessDelta));
    var newS = Math.max(0, Math.min(1, hsl.s + (satDelta || 0)));
    var out = hslToRgb(hsl.h, newS, newL);
    return rgbToHex(out.r, out.g, out.b);
  }

  function applyCustomColor(hex) {
    var root = document.documentElement;
    root.setAttribute("data-theme", "custom");
    root.style.setProperty("--color-primary", hex);
    root.style.setProperty("--color-primary-dark", shade(hex, -0.14));
    root.style.setProperty("--color-primary-light", shade(hex, 0.18));
    root.style.setProperty("--color-primary-tint", shade(hex, 0.44, -0.25));
    root.style.setProperty("--color-accent", shade(hex, -0.14));
  }

  function applyPreset(name) {
    var root = document.documentElement;
    root.setAttribute("data-theme", name);
    // Clear any inline custom overrides so the preset's CSS rules take over
    ["--color-primary", "--color-primary-dark", "--color-primary-light", "--color-primary-tint", "--color-accent"]
      .forEach(function (v) { root.style.removeProperty(v); });
  }

  function saveChoice(value, isCustom) {
    localStorage.setItem(STORAGE_KEY, isCustom ? "custom" : value);
    if (isCustom) {
      localStorage.setItem(STORAGE_CUSTOM_KEY, value);
    }
  }

  function loadSavedTheme() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    if (saved === "custom") {
      var customHex = localStorage.getItem(STORAGE_CUSTOM_KEY);
      if (customHex) applyCustomColor(customHex);
    } else if (PRESETS.indexOf(saved) !== -1) {
      applyPreset(saved);
    }
  }

  // Apply saved theme as early as possible to avoid a flash of default color
  loadSavedTheme();

  function buildWidget() {
    var wrap = document.createElement("div");
    wrap.id = "theme-switcher";

    var savedCustom = localStorage.getItem(STORAGE_CUSTOM_KEY) || "#fbaf1b";

    wrap.innerHTML =
      '<button class="ts-toggle" type="button" aria-label="Change color theme" title="Change color theme">' +
      '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.42-4.03-8-9-8Zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/></svg>' +
      "</button>" +
      '<div class="ts-panel">' +
      '<p class="ts-title">Choose a palette</p>' +
      '<div class="ts-swatches">' +
      PRESETS.map(function (p) {
        return '<button class="ts-swatch" data-swatch="' + p + '" title="' + p + '" aria-label="' + p + ' theme"></button>';
      }).join("") +
      "</div>" +
      '<div class="ts-custom-row">' +
      '<label for="ts-custom-input">Custom color</label>' +
      '<input type="color" id="ts-custom-input" value="' + savedCustom + '">' +
      "</div>" +
      '<button class="ts-reset" type="button">Reset to default</button>' +
      "</div>";

    document.body.appendChild(wrap);

    var toggleBtn = wrap.querySelector(".ts-toggle");
    toggleBtn.addEventListener("click", function () {
      wrap.classList.toggle("open");
    });

    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) wrap.classList.remove("open");
    });

    wrap.querySelectorAll(".ts-swatch").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var name = btn.getAttribute("data-swatch");
        applyPreset(name);
        saveChoice(name, false);
        markActiveSwatch(wrap, name);
      });
    });

    var colorInput = wrap.querySelector("#ts-custom-input");
    colorInput.addEventListener("input", function () {
      applyCustomColor(colorInput.value);
      saveChoice(colorInput.value, true);
      markActiveSwatch(wrap, null);
    });

    var resetBtn = wrap.querySelector(".ts-reset");
    resetBtn.addEventListener("click", function () {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_CUSTOM_KEY);
      applyPreset("mango");
      colorInput.value = "#fbaf1b";
      markActiveSwatch(wrap, "mango");
    });

    // Mark whichever theme is currently active
    var current = localStorage.getItem(STORAGE_KEY);
    markActiveSwatch(wrap, PRESETS.indexOf(current) !== -1 ? current : null);
  }

  function markActiveSwatch(wrap, activeName) {
    wrap.querySelectorAll(".ts-swatch").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-swatch") === activeName);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildWidget);
  } else {
    buildWidget();
  }
})();