(function () {
  const menuBtn = document.getElementById("menuBtn");
  const mobileNav = document.getElementById("mobileNav");
  const form = document.getElementById("downloadForm");
  const ctaForm = document.getElementById("ctaForm");
  const urlInput = document.getElementById("urlInput");
  const submitBtn = document.getElementById("submitBtn");
  const statusCard = document.getElementById("statusCard");
  const resultCard = document.getElementById("resultCard");
  const formError = document.getElementById("formError");
  const progressBar = document.getElementById("progressBar");

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      const open = mobileNav.hasAttribute("hidden") === false;
      if (open) {
        mobileNav.setAttribute("hidden", "");
        menuBtn.setAttribute("aria-expanded", "false");
      } else {
        mobileNav.removeAttribute("hidden");
        menuBtn.setAttribute("aria-expanded", "true");
      }
    });
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.setAttribute("hidden", "");
        menuBtn.setAttribute("aria-expanded", "false");
      });
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

  document.querySelectorAll("[data-sample]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      urlInput.value = link.getAttribute("data-sample");
      urlInput.focus();
      document.getElementById("download").scrollIntoView({ behavior: "smooth" });
    });
  });

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fileHref(item) {
    return (
      "/api/file?url=" +
      encodeURIComponent(item.url) +
      "&filename=" +
      encodeURIComponent(item.filename || "download.mp4")
    );
  }

  function renderResult(data) {
    const badge = data.kind === "audio" ? "AUDIO" : data.kind === "file" ? "FILE" : "VIDEO";
    const thumb = data.thumbnail
      ? '<img src="' + escapeHtml(data.thumbnail) + '" alt="">'
      : '<div class="sf-thumb-fallback">' + badge + "</div>";
    const duration = data.duration || (data.kind === "video" ? "MP4" : badge);
    const rows = (data.formats || [])
      .map(function (item) {
        const cls = item.mp3 ? "btn-dl mp3" : "btn-dl";
        return (
          '<div class="sf-row">' +
          '<span class="sf-fmt">' + escapeHtml(item.fmt || "MP4") + "</span>" +
          '<span class="sf-q">' + escapeHtml(item.quality || "Download") + "</span>" +
          '<span class="sf-size">' + escapeHtml(item.size || "") + "</span>" +
          '<a class="' + cls + '" href="' + escapeHtml(fileHref(item)) + '">Download</a>' +
          "</div>"
        );
      })
      .join("");

    resultCard.innerHTML =
      '<div class="sf-result">' +
      '<div class="sf-media">' +
      '<div class="sf-thumb">' + thumb + '<span class="sf-duration">' + escapeHtml(duration) + "</span></div>" +
      '<div class="sf-info"><h3>' + escapeHtml(data.title || "Ready") + "</h3>" +
      "<p>" + escapeHtml(data.host || "") + " · pick a format and download</p></div></div>" +
      '<div class="sf-table">' + rows + "</div></div>";
    resultCard.hidden = false;
  }

  function showError(message) {
    formError.textContent = message;
    formError.hidden = false;
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    statusCard.hidden = !busy;
    if (!busy) progressBar.style.width = "8%";
  }

  function runDownload(rawUrl) {
    formError.hidden = true;
    resultCard.hidden = true;
    resultCard.innerHTML = "";

    const url = (rawUrl || "").trim();
    if (!url) {
      showError("Paste a video or file URL first.");
      return;
    }

    setBusy(true);
    let width = 8;
    progressBar.style.width = width + "%";
    const timer = setInterval(function () {
      width = Math.min(width + 8 + Math.random() * 8, 90);
      progressBar.style.width = width + "%";
    }, 220);

    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url })
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (payload) {
        clearInterval(timer);
        progressBar.style.width = "100%";
        setBusy(false);
        if (!payload.data || !payload.data.ok) {
          showError((payload.data && payload.data.error) || "Could not prepare a download for this link.");
          return;
        }
        renderResult(payload.data);
      })
      .catch(function () {
        clearInterval(timer);
        setBusy(false);
        showError("Server is not reachable. Try again in a moment.");
      });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    runDownload(urlInput.value);
  });

  ctaForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const value = ctaForm.querySelector("input").value;
    urlInput.value = value;
    document.getElementById("download").scrollIntoView({ behavior: "smooth" });
    runDownload(value);
  });
})();
