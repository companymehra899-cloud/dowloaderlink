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

  function hostFromUrl(value) {
    try {
      return new URL(value).hostname.replace(/^www\./, "");
    } catch (err) {
      return "";
    }
  }

  function detectKind(url) {
    const host = hostFromUrl(url);
    const lower = url.toLowerCase();
    const videoHosts = [
      "youtube.com",
      "youtu.be",
      "instagram.com",
      "tiktok.com",
      "facebook.com",
      "fb.watch",
      "x.com",
      "twitter.com",
      "vimeo.com",
      "dailymotion.com",
      "reddit.com",
      "threads.net",
      "soundcloud.com"
    ];
    if (videoHosts.some(function (h) { return host === h || host.endsWith("." + h); })) {
      if (host.indexOf("soundcloud") !== -1) return "audio";
      return "video";
    }
    if (/\.(mp4|webm|mkv|mov)(\?|$)/.test(lower)) return "video";
    if (/\.(mp3|wav|flac|m4a|ogg)(\?|$)/.test(lower)) return "audio";
    if (/\.(pdf|zip|7z|rar|tar|gz|iso|exe|dmg|apk|csv|json|png|jpe?g|webp)(\?|$)/.test(lower)) return "file";
    return "file";
  }

  function filenameFromUrl(url) {
    try {
      const path = new URL(url).pathname.split("/").filter(Boolean);
      const last = path[path.length - 1] || "download";
      return decodeURIComponent(last.split("?")[0]) || "download";
    } catch (err) {
      return "download";
    }
  }

  function formatsFor(kind, url) {
    if (kind === "video") {
      const mp4 = isDirectMedia(url) ? url : SAMPLE_MP4;
      const mp4Hd = isDirectMedia(url) ? url : SAMPLE_MP4_HD;
      const mp4Sd = isDirectMedia(url) ? url : SAMPLE_MP4_SD;
      return [
        { fmt: "MP4", quality: "1080p", size: "Full HD", href: mp4Hd, mp3: false },
        { fmt: "MP4", quality: "720p", size: "HD", href: mp4, mp3: false },
        { fmt: "MP4", quality: "480p", size: "SD+", href: mp4Sd, mp3: false },
        { fmt: "MP4", quality: "360p", size: "SD", href: mp4Sd, mp3: false },
        { fmt: "MP3", quality: "128kbps", size: "Audio", href: mp4, mp3: true }
      ];
    }
    if (kind === "audio") {
      return [
        { fmt: "MP3", quality: "320kbps", size: "High", href: url, mp3: true },
        { fmt: "MP3", quality: "128kbps", size: "Standard", href: url, mp3: true }
      ];
    }
    const name = filenameFromUrl(url);
    const ext = (name.split(".").pop() || "FILE").toUpperCase();
    return [{ fmt: ext, quality: "Original", size: name, href: url, mp3: false }];
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const SAMPLE_MP4 = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const SAMPLE_MP4_HD = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";
  const SAMPLE_MP4_SD = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

  function isDirectMedia(url) {
    return /\.(mp4|webm|mkv|mov|mp3|wav|m4a|pdf|zip|7z|rar|png|jpe?g|webp)(\?|$)/i.test(url);
  }

  function renderResult(url) {
    const kind = detectKind(url);
    const host = hostFromUrl(url) || "direct file";
    const name = filenameFromUrl(url);
    const title = kind === "file" ? name : (name && name !== "download" ? name : "Video from " + host);
    const badge = kind === "video" ? "VIDEO" : kind === "audio" ? "AUDIO" : "FILE";
    const downloadUrl = isDirectMedia(url) ? url : (kind === "video" || kind === "audio" ? SAMPLE_MP4 : url);
    const thumbInner = isDirectMedia(url) && kind === "video"
      ? '<video src="' + escapeHtml(url) + '" muted playsinline preload="metadata"></video>'
      : '<div class="sf-thumb-fallback">' + badge + "</div>";
    const rows = formatsFor(kind, downloadUrl)
      .map(function (item) {
        const cls = item.mp3 ? "btn-dl mp3" : "btn-dl";
        const fileName = kind === "video" && !item.mp3
          ? "video-" + item.quality + ".mp4"
          : item.mp3
            ? "audio.mp3"
            : name;
        return (
          '<div class="sf-row">' +
          '<span class="sf-fmt">' + escapeHtml(item.fmt) + "</span>" +
          '<span class="sf-q">' + escapeHtml(item.quality) + "</span>" +
          '<span class="sf-size">' + escapeHtml(item.size) + "</span>" +
          '<a class="' + cls + '" href="' + escapeHtml(item.href) +
          '" download="' + escapeHtml(fileName) +
          '" target="_blank" rel="noopener noreferrer">Download</a>' +
          "</div>"
        );
      })
      .join("");

    resultCard.innerHTML =
      '<div class="sf-result">' +
      '<div class="sf-media">' +
      '<div class="sf-thumb">' + thumbInner + '<span class="sf-duration">MP4</span></div>' +
      '<div class="sf-info"><h3>' + escapeHtml(title) + "</h3>" +
      "<p>" + escapeHtml(host) + " · pick MP4 quality and download</p></div></div>" +
      '<div class="sf-table">' + rows + "</div></div>";
    resultCard.hidden = false;
  }

  function isHttpUrl(value) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (err) {
      return false;
    }
  }

  function runDownload(rawUrl) {
    formError.hidden = true;
    resultCard.hidden = true;
    resultCard.innerHTML = "";

    const url = (rawUrl || "").trim();
    if (!isHttpUrl(url)) {
      formError.textContent = "Enter a valid http or https URL.";
      formError.hidden = false;
      return;
    }

    statusCard.hidden = false;
    submitBtn.disabled = true;
    let width = 8;
    progressBar.style.width = width + "%";
    const timer = setInterval(function () {
      width = Math.min(width + 12 + Math.random() * 10, 92);
      progressBar.style.width = width + "%";
    }, 180);

    setTimeout(function () {
      clearInterval(timer);
      progressBar.style.width = "100%";
      setTimeout(function () {
        statusCard.hidden = true;
        progressBar.style.width = "8%";
        submitBtn.disabled = false;
        renderResult(url);
      }, 220);
    }, 1100);
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
