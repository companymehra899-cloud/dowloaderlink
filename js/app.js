(function () {
  const menuBtn = document.getElementById("menuBtn");
  const mobileNav = document.getElementById("mobileNav");
  const urlInput = document.getElementById("urlInput");
  const submitBtn = document.getElementById("submitBtn");
  const statusCard = document.getElementById("statusCard");
  const resultCard = document.getElementById("resultCard");
  const formError = document.getElementById("formError");
  const progressBar = document.getElementById("progressBar");
  const statusText = statusCard ? statusCard.querySelector("p") : null;
  const COBALT_API = (
    (window.FETCHORA_CONFIG && window.FETCHORA_CONFIG.cobaltApi) ||
    "https://cobalt-11-h57i.onrender.com/"
  ).trim();

  if (menuBtn && mobileNav) {
    function closeMenu() {
      mobileNav.setAttribute("hidden", "");
      mobileNav.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
    }
    function openMenu() {
      mobileNav.removeAttribute("hidden");
      mobileNav.classList.add("is-open");
      menuBtn.setAttribute("aria-expanded", "true");
    }
    menuBtn.addEventListener("click", function () {
      if (menuBtn.getAttribute("aria-expanded") === "true") closeMenu();
      else openMenu();
    });
  }

  document.querySelectorAll(".faq-item .faq-q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const item = btn.closest(".faq-item");
      const wasOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach(function (el) {
        el.classList.remove("open");
      });
      if (!wasOpen) item.classList.add("open");
    });
  });

  function isDirectFile(url) {
    return /\.(mp4|webm|mkv|mov|avi|mp3|wav|m4a|ogg|pdf|zip|7z|gz|tar|rar|iso|apk)(\?|#|$)/i.test(url);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cobaltEndpoint() {
    if (!COBALT_API) return "";
    return COBALT_API.replace(/\/?$/, "/");
  }

  function setBusy(busy, message) {
    if (statusCard) {
      statusCard.hidden = !busy;
      statusCard.style.display = busy ? "block" : "none";
    }
    if (statusText && message) statusText.textContent = message;
    if (submitBtn) submitBtn.disabled = busy;
    if (progressBar) progressBar.style.width = busy ? "60%" : "100%";
  }

  function showError(message) {
    setBusy(false);
    if (formError) {
      formError.textContent = message;
      formError.hidden = false;
    }
  }

  function renderResult(downloadUrl, title, kind) {
    if (!resultCard) return;
    const label = kind === "file" ? "FILE" : "VIDEO";
    const note = kind === "file" ? "Direct file is ready" : "Download from your Cobalt instance";
    const btn = "Download Now";

    resultCard.innerHTML =
      '<div class="sf-result" style="background:#f9f9f9; padding:20px; border-radius:8px; border:1px solid #ddd; margin-top:20px;">' +
      '<div class="sf-media" style="display:flex; align-items:center;">' +
      '<div class="sf-thumb" style="width:100px; height:60px; background:#0e7490; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; border-radius:4px; font-size:12px;">' + label + "</div>" +
      '<div class="sf-info" style="margin-left:15px;">' +
      '<h3 style="margin:0 0 5px 0; font-size:16px; color:#333;">' + escapeHtml(title) + "</h3>" +
      '<p style="margin:0; font-size:13px; color:#666;">' + note + "</p></div></div>" +
      '<div class="sf-table" style="margin-top:20px; background:#fff; border-radius:6px; border:1px solid #eee;">' +
      '<div class="sf-row" style="display:flex; justify-content:space-between; align-items:center; padding:12px 15px;">' +
      '<span class="sf-fmt" style="font-weight:bold; color:#333;">' + label + "</span>" +
      '<span class="sf-q" style="color:#444;">Best Quality</span>' +
      '<a class="btn-dl" href="' + escapeHtml(downloadUrl) + '" target="_blank" rel="noopener noreferrer" download style="background:#28a745; color:#fff; padding:8px 18px; border-radius:4px; text-decoration:none; font-weight:bold; font-size:14px;">' + btn + "</a>" +
      "</div></div></div>";

    resultCard.hidden = false;
    resultCard.style.display = "block";
  }

  function renderPicker(items, audioUrl) {
    if (!resultCard) return;
    var rows = items.slice(0, 8).map(function (item, index) {
      var label = (item.type || "media").toUpperCase();
      var href = item.url || "";
      return (
        '<div class="sf-row" style="display:flex; justify-content:space-between; align-items:center; padding:12px 15px; border-top:1px solid #eee;">' +
        '<span class="sf-fmt" style="font-weight:bold; color:#333;">' + escapeHtml(label) + " " + (index + 1) + "</span>" +
        '<a class="btn-dl" href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer" download style="background:#28a745; color:#fff; padding:8px 18px; border-radius:4px; text-decoration:none; font-weight:bold; font-size:14px;">Download</a>' +
        "</div>"
      );
    }).join("");

    if (audioUrl) {
      rows +=
        '<div class="sf-row" style="display:flex; justify-content:space-between; align-items:center; padding:12px 15px; border-top:1px solid #eee;">' +
        '<span class="sf-fmt" style="font-weight:bold; color:#333;">AUDIO</span>' +
        '<a class="btn-dl" href="' + escapeHtml(audioUrl) + '" target="_blank" rel="noopener noreferrer" download style="background:#28a745; color:#fff; padding:8px 18px; border-radius:4px; text-decoration:none; font-weight:bold; font-size:14px;">Download</a>' +
        "</div>";
    }

    resultCard.innerHTML =
      '<div class="sf-result" style="background:#f9f9f9; padding:20px; border-radius:8px; border:1px solid #ddd; margin-top:20px;">' +
      '<div class="sf-info"><h3 style="margin:0 0 5px 0; font-size:16px; color:#333;">Choose a file</h3>' +
      '<p style="margin:0; font-size:13px; color:#666;">This link has multiple items</p></div>' +
      '<div class="sf-table" style="margin-top:20px; background:#fff; border-radius:6px; border:1px solid #eee;">' + rows + "</div></div>";

    resultCard.hidden = false;
    resultCard.style.display = "block";
  }

  function cobaltErrorMessage(data) {
    var code = data && data.error && data.error.code;
    if (!code) return "Download link nahi mil saka. Link check karein.";
    if (code.indexOf("link.invalid") !== -1 || code.indexOf("link.unsupported") !== -1) {
      return "Ye URL supported nahi hai.";
    }
    if (code.indexOf("fetch.short_link") !== -1) return "Short link resolve nahi ho saki.";
    if (code.indexOf("youtube") !== -1) return "YouTube se file nahi nikal saki. Thodi der baad try karein.";
    if (code.indexOf("error.api.rate") !== -1 || code.indexOf("ratelimit") !== -1) {
      return "Bahut requests ho gayi. Thodi der baad try karein.";
    }
    return "Download fail hua: " + code;
  }

  async function requestCobalt(videoUrl) {
    var endpoint = cobaltEndpoint();
    if (!endpoint) {
      showError("Cobalt API URL set nahi hai. js/config.js mein cobaltApi apna Render URL daalein.");
      return;
    }

    setBusy(true, "Preparing your download. First request can take ~30s if the API was sleeping.");

    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, 90000);

    try {
      var res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: videoUrl,
          videoQuality: "720",
          downloadMode: "auto",
          alwaysProxy: true,
          filenameStyle: "pretty"
        }),
        signal: controller.signal
      });

      var data = await res.json();
      setBusy(false);

      if (data.status === "tunnel" || data.status === "redirect") {
        renderResult(data.url, data.filename || "Video Ready", "video");
        return;
      }

      if (data.status === "picker" && data.picker && data.picker.length) {
        renderPicker(data.picker, data.audio || "");
        return;
      }

      if (data.status === "error") {
        showError(cobaltErrorMessage(data));
        return;
      }

      showError("API se download link nahi mil saka.");
    } catch (err) {
      setBusy(false);
      if (err && err.name === "AbortError") {
        showError("API slow hai ya sleep mode se wake nahi hui. 30s baad dubara try karein.");
        return;
      }
      showError("Cobalt API se connect nahi ho paya. URL aur Render service check karein.");
    } finally {
      clearTimeout(timer);
    }
  }

  window.runDownload = function (rawUrl) {
    if (formError) formError.hidden = true;
    if (resultCard) {
      resultCard.hidden = true;
      resultCard.style.display = "none";
    }

    const url = (rawUrl || "").trim();
    if (!url) {
      showError("Paste a video or direct file URL.");
      return;
    }

    if (isDirectFile(url)) {
      setBusy(true, "Preparing your download link. Stay on this page.");
      setTimeout(function () {
        setBusy(false);
        const name = url.split("?")[0].split("/").pop() || "File";
        renderResult(url, name, "file");
      }, 300);
      return;
    }

    requestCobalt(url);
  };

  const downloadForm = document.getElementById("downloadForm");
  const ctaForm = document.getElementById("ctaForm");

  if (downloadForm) {
    downloadForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (urlInput) window.runDownload(urlInput.value);
    });
  }

  if (ctaForm) {
    ctaForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const ctaInput = ctaForm.querySelector("input");
      if (ctaInput) window.runDownload(ctaInput.value);
    });
  }
})();
