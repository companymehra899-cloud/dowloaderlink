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
      document.querySelectorAll(".faq-item").forEach(el => el.classList.remove("open"));
      if (!wasOpen) item.classList.add("open");
    });
  });

  function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) return match[2];

    if (url.includes("shorts/")) {
      const parts = url.split("shorts/");
      if (parts[1]) return parts[1].split(/[?#]/)[0].substring(0, 11);
    }
    return null;
  }

  function renderResult(videoUrl, title) {
    resultCard.innerHTML =
      '<div class="sf-result">' +
      '<div class="sf-media">' +
      '<div class="sf-thumb"><div class="sf-thumb-fallback">VIDEO</div></div>' +
      '<div class="sf-info"><h3>' + title + '</h3>' +
      '<p>YouTube Video · Ready to Download</p></div></div>' +
      '<div class="sf-table">' +
      '<div class="sf-row">' +
      '<span class="sf-fmt">MP4</span>' +
      '<span class="sf-q">720p / 360p</span>' +
      '<span class="sf-size">Best Quality</span>' +
      '<a class="btn-dl" href="' + videoUrl + '" target="_blank" rel="noopener noreferrer" style="background:#00b22d; color:#fff; padding:8px 15px; border-radius:4px; text-decoration:none;">Go to Download</a>' +
      '</div>' +
      '</div>' +
      '</div>';
    resultCard.hidden = false;
  }

  window.runDownload = function(rawUrl) {
    formError.hidden = true;
    resultCard.hidden = true;

    const url = (rawUrl || "").trim();
    const videoId = getYouTubeId(url);

    if (!videoId) {
      formError.textContent = "कृपया एक सही YouTube या Shorts लिंक दर्ज करें।";
      formError.hidden = false;
      return;
    }

    statusCard.hidden = false;
    submitBtn.disabled = true;
    progressBar.style.width = "100%";

    const finalDownloadUrl = "https://youtubepp.com/watch?v=" + videoId;

    setTimeout(function () {
      statusCard.hidden = true;
      submitBtn.disabled = false;
      renderResult(finalDownloadUrl, "YouTube Video (" + videoId + ")");
    }, 800);
  };

  const form = document.getElementById("downloadForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      runDownload(urlInput.value);
    });
  }

  const ctaForm = document.getElementById("ctaForm");
  if (ctaForm) {
    ctaForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const value = ctaForm.querySelector("input").value;
      urlInput.value = value;
      document.getElementById("download").scrollIntoView({ behavior: "smooth" });
      runDownload(value);
    });
  }
})();
