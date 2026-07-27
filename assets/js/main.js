(function () {
  "use strict";

  var body = document.body;
  var header = document.getElementById("header");
  var backToTop = document.querySelector(".back-to-top");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var locale = (body.dataset.locale || "en").toLowerCase().startsWith("zh") ? "zh" : "en";
  var rafPending = false;

  var copy = {
    en: {
      openNavigation: "Open navigation",
      closeNavigation: "Close navigation",
      analyticsDisabled: "Auto-rotation is disabled by your motion preference",
      formSubject: "Witbacon inquiry",
      formHeading: "Witbacon inquiry brief",
      formStatus: "Your email application should open with the inquiry brief. If it does not, use the blank email link.",
      fields: {
        service: "Service needed",
        stage: "Company stage",
        timeline: "Preferred timing",
        company: "Company name",
        challenge: "Priority challenge",
        contactName: "Contact name",
        replyEmail: "Reply email"
      }
    },
    zh: {
      openNavigation: "打开导航",
      closeNavigation: "关闭导航",
      analyticsDisabled: "已根据你的减少动态效果偏好关闭自动轮播",
      formSubject: "Witbacon 咨询",
      formHeading: "Witbacon 咨询需求",
      formStatus: "邮件应用应已打开并带入咨询内容。如未打开，请使用空白邮件链接。",
      fields: {
        service: "需要的服务",
        stage: "企业阶段",
        timeline: "期望启动时间",
        company: "企业名称",
        challenge: "当前重点议题",
        contactName: "联系人姓名",
        replyEmail: "回复邮箱"
      }
    }
  }[locale];

  function headerOffset() {
    return header ? header.offsetHeight + 20 : 20;
  }

  function currentSectionId() {
    var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id], body > section[id]"));
    var current = document.getElementById("hero") ? "hero" : "";
    var threshold = window.scrollY + headerOffset() + 8;

    sections.forEach(function (section) {
      if (section.offsetTop <= threshold) {
        current = section.id;
      }
    });

    return current;
  }

  function syncLanguageLinks(sectionId) {
    if (!sectionId) {
      return;
    }

    document.querySelectorAll(".lang-switch").forEach(function (link) {
      var base = (link.getAttribute("href") || "").split("#")[0];
      if (base) {
        link.setAttribute("href", base + "#" + sectionId);
      }
    });
  }

  function syncNavigation(sectionId) {
    if (!sectionId) {
      return;
    }

    document.querySelectorAll(".nav-menu a[href^='#'], .mobile-nav a[href^='#']").forEach(function (link) {
      var isCurrent = link.getAttribute("href") === "#" + sectionId;
      var item = link.closest("li");

      if (item) {
        item.classList.toggle("active", isCurrent);
      }

      if (isCurrent) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function syncScrollState() {
    var isScrolled = window.scrollY > 100;
    var sectionId = currentSectionId();

    if (header) {
      header.classList.toggle("header-scrolled", isScrolled);
    }

    if (backToTop) {
      backToTop.hidden = !isScrolled;
    }

    syncNavigation(sectionId);
    syncLanguageLinks(sectionId);
    rafPending = false;
  }

  window.addEventListener("scroll", function () {
    if (!rafPending) {
      rafPending = true;
      window.requestAnimationFrame(syncScrollState);
    }
  }, { passive: true });

  syncScrollState();

  var mobileToggle = document.querySelector(".mobile-nav-toggle");
  var mobileNav = document.getElementById("mobile-navigation");
  var mobileOverlay = document.querySelector(".mobile-nav-overlay");

  function setMobileNavigation(open, returnFocus) {
    if (!mobileToggle || !mobileNav || !mobileOverlay) {
      return;
    }

    body.classList.toggle("mobile-nav-active", open);
    mobileToggle.setAttribute("aria-expanded", String(open));
    mobileToggle.setAttribute("aria-label", open ? copy.closeNavigation : copy.openNavigation);
    mobileNav.setAttribute("aria-hidden", String(!open));
    mobileOverlay.hidden = !open;

    if (open) {
      var firstLink = mobileNav.querySelector("a");
      if (firstLink) {
        firstLink.focus();
      }
    } else if (returnFocus) {
      mobileToggle.focus();
    }
  }

  if (mobileToggle && mobileNav && mobileOverlay) {
    mobileToggle.addEventListener("click", function () {
      setMobileNavigation(mobileToggle.getAttribute("aria-expanded") !== "true", false);
    });

    mobileOverlay.addEventListener("click", function () {
      setMobileNavigation(false, true);
    });

    mobileNav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        setMobileNavigation(false, false);
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 992 && mobileToggle.getAttribute("aria-expanded") === "true") {
        setMobileNavigation(false, false);
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (
      event.key === "Escape" &&
      mobileToggle &&
      mobileToggle.getAttribute("aria-expanded") === "true"
    ) {
      setMobileNavigation(false, true);
    }
  });

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[href^='#']");
    if (!link) {
      return;
    }

    var hash = link.getAttribute("href");
    if (!hash || hash === "#") {
      return;
    }

    var target = document.querySelector(hash);
    if (!target) {
      return;
    }

    event.preventDefault();
    var top = hash === "#hero" ? 0 : Math.max(0, target.offsetTop - headerOffset());
    window.scrollTo({
      top: top,
      behavior: reducedMotion.matches ? "auto" : "smooth"
    });

    if (window.location.hash !== hash) {
      window.history.pushState(null, "", hash);
    }
  });

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: reducedMotion.matches ? "auto" : "smooth"
      });
    });
  }

  function initializeCarousel(carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".carousel-item"));
    var indicators = Array.prototype.slice.call(carousel.querySelectorAll("[data-slide-to]"));
    var toggle = carousel.querySelector(".carousel-toggle");
    var inner = carousel.querySelector(".carousel-inner");
    var interval = Number(carousel.dataset.interval) || 7000;
    var currentIndex = Math.max(0, slides.findIndex(function (slide) {
      return slide.classList.contains("active");
    }));
    var timer = null;
    var manualPause = false;
    var pointerInside = false;
    var focusInside = false;

    if (!slides.length) {
      return;
    }

    if (inner) {
      inner.setAttribute("aria-live", "off");
    }

    function loadBackground(slide) {
      var panel = slide.querySelector("[data-background]");
      if (panel && !panel.style.backgroundImage) {
        panel.style.backgroundImage = "url('" + panel.dataset.background.replace(/'/g, "%27") + "')";
      }
    }

    function setSlideTabOrder(slide, active) {
      slide.querySelectorAll("a, button, input, select, textarea, [tabindex]").forEach(function (control) {
        if (!active) {
          if (!control.hasAttribute("data-carousel-tabindex")) {
            control.dataset.carouselTabindex = control.getAttribute("tabindex") || "";
          }
          control.setAttribute("tabindex", "-1");
        } else if (control.hasAttribute("data-carousel-tabindex")) {
          var previous = control.dataset.carouselTabindex;
          if (previous) {
            control.setAttribute("tabindex", previous);
          } else {
            control.removeAttribute("tabindex");
          }
          delete control.dataset.carouselTabindex;
        }
      });
    }

    function showSlide(index) {
      currentIndex = (index + slides.length) % slides.length;
      loadBackground(slides[currentIndex]);
      loadBackground(slides[(currentIndex + 1) % slides.length]);

      slides.forEach(function (slide, slideIndex) {
        var active = slideIndex === currentIndex;
        slide.classList.toggle("active", active);
        slide.setAttribute("aria-hidden", String(!active));
        setSlideTabOrder(slide, active);
      });

      indicators.forEach(function (indicator, indicatorIndex) {
        var active = indicatorIndex === currentIndex;
        indicator.classList.toggle("active", active);
        if (active) {
          indicator.setAttribute("aria-current", "true");
        } else {
          indicator.removeAttribute("aria-current");
        }
      });
    }

    function stopTimer() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function canAutoRotate() {
      return !manualPause && !reducedMotion.matches && !pointerInside && !focusInside && !document.hidden;
    }

    function syncToggle() {
      if (!toggle) {
        return;
      }

      var paused = manualPause || reducedMotion.matches;
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.disabled = reducedMotion.matches;
      toggle.setAttribute(
        "aria-label",
        reducedMotion.matches
          ? copy.analyticsDisabled
          : (paused ? toggle.dataset.labelResume : toggle.dataset.labelPause)
      );
    }

    function refreshTimer() {
      stopTimer();
      syncToggle();
      if (canAutoRotate()) {
        timer = window.setInterval(function () {
          showSlide(currentIndex + 1);
        }, interval);
      }
    }

    indicators.forEach(function (indicator, index) {
      indicator.addEventListener("click", function () {
        showSlide(index);
        refreshTimer();
      });
    });

    if (toggle) {
      toggle.addEventListener("click", function () {
        manualPause = !manualPause;
        refreshTimer();
      });
    }

    carousel.addEventListener("mouseenter", function () {
      pointerInside = true;
      refreshTimer();
    });

    carousel.addEventListener("mouseleave", function () {
      pointerInside = false;
      refreshTimer();
    });

    carousel.addEventListener("focusin", function () {
      focusInside = true;
      refreshTimer();
    });

    carousel.addEventListener("focusout", function () {
      window.setTimeout(function () {
        focusInside = carousel.contains(document.activeElement);
        refreshTimer();
      }, 0);
    });

    document.addEventListener("visibilitychange", refreshTimer);
    reducedMotion.addEventListener("change", refreshTimer);

    showSlide(currentIndex);
    refreshTimer();
  }

  var heroCarousel = document.getElementById("heroCarousel");
  if (heroCarousel) {
    initializeCarousel(heroCarousel);
  }

  document.querySelectorAll(".case-toggle").forEach(function (button) {
    button.addEventListener("click", function () {
      var details = document.getElementById(button.getAttribute("aria-controls"));
      if (!details) {
        return;
      }

      var expanded = button.getAttribute("aria-expanded") !== "true";
      var label = button.querySelector("[data-label-open]");
      button.setAttribute("aria-expanded", String(expanded));
      details.hidden = !expanded;
      button.closest(".case-card").classList.toggle("is-expanded", expanded);

      if (label) {
        label.textContent = expanded ? label.dataset.labelClose : label.dataset.labelOpen;
      }
    });
  });

  document.querySelectorAll("[data-inquiry-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var data = new FormData(form);
      var service = String(data.get("service") || "").trim();
      var subject = copy.formSubject + (service ? " | " + service : "");
      var lines = [copy.formHeading, ""];

      Object.keys(copy.fields).forEach(function (name) {
        var value = String(data.get(name) || "").trim();
        if (value) {
          lines.push(copy.fields[name] + ": " + value);
        }
      });

      lines.push("", "Website: " + window.location.href.split("#")[0]);

      var mailto = "mailto:consulting@witbacon.com?subject=" +
        encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\r\n"));
      var status = form.querySelector("[data-form-status]");

      if (status) {
        status.textContent = copy.formStatus;
      }

      window.location.href = mailto;
    });
  });

  var consentKey = "witbacon-consent-v1";
  var consentBanner = document.querySelector("[data-consent-banner]");
  var consentOpeners = document.querySelectorAll("[data-open-consent]");
  var analyticsId = body.dataset.analyticsId || "";
  var lastConsentOpener = null;

  function readConsent() {
    try {
      var value = window.localStorage.getItem(consentKey);
      return value === "analytics" || value === "essential" ? value : null;
    } catch (error) {
      return null;
    }
  }

  function writeConsent(value) {
    try {
      window.localStorage.setItem(consentKey, value);
    } catch (error) {
      // Privacy controls still apply for the current page when storage is unavailable.
    }
  }

  function loadAnalytics() {
    if (!analyticsId || document.getElementById("witbacon-analytics")) {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("consent", "default", { analytics_storage: "granted" });
    window.gtag("js", new Date());
    window.gtag("config", analyticsId, { anonymize_ip: true });

    var script = document.createElement("script");
    script.id = "witbacon-analytics";
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(analyticsId);
    document.head.appendChild(script);
  }

  function syncConsentButtons(value) {
    if (!consentBanner) {
      return;
    }

    consentBanner.querySelectorAll("[data-consent]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.consent === value));
    });
  }

  function openConsent(focusBanner) {
    if (!consentBanner) {
      return;
    }

    consentBanner.hidden = false;
    body.classList.add("consent-open");
    syncConsentButtons(readConsent());
    if (focusBanner) {
      consentBanner.focus();
    }
  }

  function closeConsent() {
    if (!consentBanner) {
      return;
    }

    consentBanner.hidden = true;
    body.classList.remove("consent-open");
    if (lastConsentOpener) {
      lastConsentOpener.focus();
      lastConsentOpener = null;
    }
  }

  var storedConsent = readConsent();
  if (storedConsent === "analytics") {
    loadAnalytics();
  } else if (!storedConsent) {
    openConsent(false);
  }

  consentOpeners.forEach(function (button) {
    button.addEventListener("click", function () {
      lastConsentOpener = button;
      openConsent(true);
    });
  });

  if (consentBanner) {
    consentBanner.querySelectorAll("[data-consent]").forEach(function (button) {
      button.addEventListener("click", function () {
        var choice = button.dataset.consent;
        writeConsent(choice);
        syncConsentButtons(choice);

        if (choice === "analytics") {
          loadAnalytics();
        } else if (typeof window.gtag === "function") {
          window.gtag("consent", "update", { analytics_storage: "denied" });
        }

        closeConsent();
      });
    });
  }

  var year = String(new Date().getFullYear());
  document.querySelectorAll("[data-current-year]").forEach(function (element) {
    element.textContent = year;
  });

  document.querySelectorAll("[data-site-version]").forEach(function (element) {
    element.textContent = body.dataset.version || element.textContent;
  });

  if (window.location.hash) {
    window.setTimeout(function () {
      var target = document.querySelector(window.location.hash);
      if (target) {
        window.scrollTo({
          top: Math.max(0, target.offsetTop - headerOffset()),
          behavior: "auto"
        });
      }
    }, 0);
  }
})();
