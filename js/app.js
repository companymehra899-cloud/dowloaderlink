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

  function renderResult(downloadUrl, title) {
    if (!resultCard) return;

    resultCard.innerHTML =
      '<div class="sf-result" style="background:#f9f9f9; padding:20px; border-radius:8px; border:1px solid #ddd; margin-top:20px;">' +
      '<div class="sf-media" style="display:flex; align-items:center;">' +
      '<div class="sf-thumb" style="width:100px; height:60px; background:#ff0000; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; border-radius:4px; font-size:12px;">MP4</div>' +
      '<div class="sf-info" style="margin-left:15px;">' +
      '<h3 style="margin:0 0 5px 0; font-size:16px; color:#333;">' + title + '</h3>' +
      '<p style="margin:0; font-size:13px; color:#666;">वीडियो डाउनलोड के लिए तैयार है</p></div></div>' +
      '<div class="sf-table" style="margin-top:20px; background:#fff; border-radius:6px; border:1px solid #eee;">' +
      '<div class="sf-row" style="display:flex; justify-content:space-between; align-items:center; padding:12px 15px;">' +
      '<span class="sf-fmt" style="font-weight:bold; color:#333;">VIDEO</span>' +
      '<span class="sf-q" style="color:#444;">Best Quality</span>' +
      '<span class="sf-size" style="color:#777; font-size:13px;">HD Supported</span>' +
      '<a class="btn-dl" href="' + downloadUrl + '" target="_blank" rel="noopener noreferrer" style="background:#28a745; color:#fff; padding:8px 18px; border-radius:4px; text-decoration:none; font-weight:bold; font-size:14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Download Now</a>' +
      '</div>' +
      '</div>' +
      '</div>';

    resultCard.hidden = false;
    resultCard.style.display = "block";
  }

  window.runDownload = async function(rawUrl) {
    if (formError) formError.hidden = true;
    if (resultCard) {
      resultCard.hidden = true;
      resultCard.style.display = "none";
    }

    const url = (rawUrl || "").trim();
    if (!url) {
      if (formError) {
        formError.textContent = "कृपया एक सही YouTube वीडियो या Shorts का लिंक डालें।";
        formError.hidden = false;
      }
      return;
    }

    if (statusCard) {
      statusCard.hidden = false;
      statusCard.style.display = "block";
    }
    if (submitBtn) submitBtn.disabled = true;
    if (progressBar) progressBar.style.width = "50%";

    try {
      const response = await fetch("https://youtube-downloader-api-rvgh.onrender.com/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: url })
      });

      if (progressBar) progressBar.style.width = "100%";
      const data = await response.json();

      if (statusCard) {
        statusCard.hidden = true;
        statusCard.style.display = "none";
      }
      if (submitBtn) submitBtn.disabled = false;

      if (data && data.url) {
        renderResult(data.url, "YouTube Video");
      } else {
        formError.textContent = data.error || "डाउनलोड लिंक नहीं मिल सका। कृपया लिंक जांचें।";
        formError.hidden = false;
      }
    } catch (error) {
      if (statusCard) {
        statusCard.hidden = true;
        statusCard.style.display = "none";
      }
      if (submitBtn) submitBtn.disabled = false;

      formError.textContent = "सर्वर रिस्पॉन्स प्रोसेस करने में असमर्थ। कृपया कुछ देर बाद दोबारा प्रयास करें।";
      formError.hidden = false;
      console.error("API Error:", error);
    }
  };

  const downloadForm = document.getElementById("downloadForm");
  if (downloadForm) {
    downloadForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (urlInput) window.runDownload(urlInput.value);
    });
  }
})();
