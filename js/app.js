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
    if (match && match[2].length === 11) {
      return match[2];
    }

    if (url.includes("shorts/")) {
      const parts = url.split("shorts/");
      if (parts && parts[1]) {
        return parts[1].split(/[?#]/)[0].substring(0, 11);
      }
    }
    return null;
  }

  function renderResult(videoUrl, title) {
    if (!resultCard) return;

    resultCard.innerHTML =
      '<div class="sf-result">' +
      '<div class="sf-media">' +
      '<div class="sf-thumb" style="width:100px; height:60px; background:#333; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; border-radius:4px;">VIDEO</div>' +
      '<div class="sf-info" style="margin-left:15px;"><h3>' + title + '</h3>' +
      '<p>YouTube Video · Ready to Download</p></div></div>' +
      '<div class="sf-table" style="margin-top:20px;">' +
      '<div class="sf-row" style="display:flex; justify-content:between; align-items:center; padding:10px; border-bottom:1px solid #eee;">' +
      '<span class="sf-fmt" style="font-weight:bold;">MP4</span>' +
      '<span class="sf-q" style="margin:0 15px;">720p / 360p</span>' +
      '<span class="sf-size" style="color:#666; margin-right:15px;">Best Quality</span>' +
      '<a class="btn-dl" href="' + videoUrl + '" target="_blank" rel="noopener noreferrer" style="background:#00b22d; color:#fff; padding:8px 15px; border-radius:4px; text-decoration:none; font-weight:bold;">Go to Download</a>' +
      '</div>' +
      '</div>' +
      '</div>';
    resultCard.hidden = false;
    resultCard.style.display = "block";
  }

  window.runDownload = function(rawUrl) {
    if (formError) formError.hidden = true;
    if (resultCard) {
      resultCard.hidden = true;
      resultCard.style.display = "none";
    }

    const url = (rawUrl || "").trim();
    const videoId = getYouTubeId(url);

    if (!videoId) {
      if (formError) {
        formError.textContent = "कृपया एक सही YouTube या Shorts लिंक दर्ज करें।";
        formError.hidden = false;
      }
      return;
    }

    if (statusCard) {
      statusCard.hidden = false;
      statusCard.style.display = "block";
    }
    if (submitBtn) submitBtn.disabled = true;
    if (progressBar) progressBar.style.width = "100%";

    const finalDownloadUrl = "https://ssyoutube.com/watch?v=" + videoId;

    setTimeout(function () {
      if (statusCard) {
        statusCard.hidden = true;
        statusCard.style.display = "none";
      }
      if (submitBtn) submitBtn.disabled = false;

      renderResult(finalDownloadUrl, "YouTube Video (" + videoId + ")");
    }, 800);
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
