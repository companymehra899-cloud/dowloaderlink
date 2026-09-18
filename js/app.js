(function () {
  const menuBtn = document.getElementById("menuBtn");
  const mobileNav = document.getElementById("mobileNav");
  const urlInput = document.getElementById("urlInput");
  const submitBtn = document.getElementById("submitBtn");
  const statusCard = document.getElementById("statusCard");
  const resultCard = document.getElementById("resultCard");
  const formError = document.getElementById("formError");
  const progressBar = document.getElementById("progressBar");

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

  function getYouTubeId(url) {
    const match = url.match(
      /(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
    );
    if (match && match[1]) return match[1];

    if (url.indexOf("shorts/") !== -1) {
      const parts = url.split("shorts/");
      if (parts[1]) return parts[1].split(/[?#]/)[0].substring(0, 11);
    }
    return null;
  }

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

  function renderResult(downloadUrl, title, kind) {
    if (!resultCard) return;
    const label = kind === "file" ? "FILE" : "VIDEO";
    const note = kind === "file" ? "Direct file is ready" : "Open the converter to save this video";
    const btn = kind === "file" ? "Download Now" : "Go to Download";

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
      '<a class="btn-dl" href="' + escapeHtml(downloadUrl) + '" target="_blank" rel="noopener noreferrer" style="background:#28a745; color:#fff; padding:8px 18px; border-radius:4px; text-decoration:none; font-weight:bold; font-size:14px;">' + btn + "</a>" +
      "</div></div></div>";

    resultCard.hidden = false;
    resultCard.style.display = "block";
  }

  function finishReady(downloadUrl, title, kind) {
    if (statusCard) {
      statusCard.hidden = true;
      statusCard.style.display = "none";
    }
    if (submitBtn) submitBtn.disabled = false;
    if (progressBar) progressBar.style.width = "100%";
    renderResult(downloadUrl, title, kind);
  }

  window.runDownload = function (rawUrl) {
    if (formError) formError.hidden = true;
    if (resultCard) {
      resultCard.hidden = true;
      resultCard.style.display = "none";
    }

    const url = (rawUrl || "").trim();
    if (!url) {
      if (formError) {
        formError.textContent = "Paste a YouTube or direct file URL.";
        formError.hidden = false;
      }
      return;
    }

    const videoId = getYouTubeId(url);
    const direct = isDirectFile(url);

    if (!videoId && !direct) {
      if (formError) {
        formError.textContent = "Use a YouTube / Shorts link or a direct file URL (mp4, pdf, zip).";
        formError.hidden = false;
      }
      return;
    }

    if (statusCard) {
      statusCard.hidden = false;
      statusCard.style.display = "block";
    }
    if (submitBtn) submitBtn.disabled = true;
    if (progressBar) progressBar.style.width = "60%";

    setTimeout(function () {
      if (videoId) {
        finishReady("https://ssyoutube.com/watch?v=" + videoId, "YouTube Video (" + videoId + ")", "video");
        return;
      }
      const name = url.split("?")[0].split("/").pop() || "File";
      finishReady(url, name, "file");
    }, 500);
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
