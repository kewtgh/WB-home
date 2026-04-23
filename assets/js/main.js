(function ($) {
  "use strict";

  var $window = $(window);
  var $header = $("#header");
  var $backToTop = $(".back-to-top");

  function syncHeaderState() {
    if ($window.scrollTop() > 100) {
      $header.addClass("header-scrolled");
      $backToTop.fadeIn("slow");
    } else {
      $header.removeClass("header-scrolled");
      $backToTop.fadeOut("slow");
    }
  }

  function closeMobileNav() {
    $("body").removeClass("mobile-nav-active");
    $(".mobile-nav-toggle i").toggleClass("icofont-navigation-menu icofont-close");
    $(".mobile-nav-overly").fadeOut();
  }

  function getCurrentSectionId() {
    var headerOffset = $header.length ? $header.outerHeight() + 24 : 24;
    var currentId = "hero";

    $("section[id], main section[id]").each(function () {
      var $section = $(this);
      if ($window.scrollTop() >= $section.offset().top - headerOffset) {
        currentId = $section.attr("id");
      }
    });

    return currentId;
  }

  function syncLanguageLinks() {
    var targetId = "#" + getCurrentSectionId();

    $(".lang-link a").each(function () {
      var baseHref = ($(this).attr("href") || "").split("#")[0];
      if (baseHref) {
        $(this).attr("href", baseHref + targetId);
      }
    });
  }

  $window.on("scroll", syncHeaderState);
  syncHeaderState();
  syncLanguageLinks();
  $window.on("scroll hashchange", syncLanguageLinks);

  $(document).on("click", ".nav-menu a, .mobile-nav a, .scrollto", function (e) {
    if (
      location.pathname.replace(/^\//, "") === this.pathname.replace(/^\//, "") &&
      location.hostname === this.hostname
    ) {
      var target = $(this.hash);
      if (target.length) {
        e.preventDefault();

        var scrollTo = target.offset().top;

        if ($header.length) {
          scrollTo -= $header.outerHeight();
          if (!$header.hasClass("header-scrolled")) {
            scrollTo += 20;
          }
        }

        if ($(this).attr("href") === "#hero" || $(this).attr("href") === "#header") {
          scrollTo = 0;
        }

        $("html, body").animate({ scrollTop: scrollTo }, 700);

        if ($(this).parents(".nav-menu, .mobile-nav").length) {
          $(".nav-menu .active, .mobile-nav .active").removeClass("active");
          $(this).closest("li").addClass("active");
        }

        if ($("body").hasClass("mobile-nav-active")) {
          closeMobileNav();
        }
      }
    }
  });

  if ($(".nav-menu").length) {
    var $mobileNav = $(".nav-menu").clone().prop({ class: "mobile-nav d-lg-none" });
    $("body").append($mobileNav);
    $("body").prepend(
      '<button type="button" class="mobile-nav-toggle d-lg-none"><i class="icofont-navigation-menu"></i></button>'
    );
    $("body").append('<div class="mobile-nav-overly"></div>');

    $(document).on("click", ".mobile-nav-toggle", function () {
      $("body").toggleClass("mobile-nav-active");
      $(".mobile-nav-toggle i").toggleClass("icofont-navigation-menu icofont-close");
      $(".mobile-nav-overly").toggle();
    });

    $(document).on("click", function (e) {
      var $container = $(".mobile-nav, .mobile-nav-toggle");
      if (!$container.is(e.target) && $container.has(e.target).length === 0) {
        if ($("body").hasClass("mobile-nav-active")) {
          closeMobileNav();
        }
      }
    });
  } else if ($(".mobile-nav, .mobile-nav-toggle").length) {
    $(".mobile-nav, .mobile-nav-toggle").hide();
  }

  syncLanguageLinks();

  $backToTop.on("click", function (e) {
    e.preventDefault();
    $("html, body").animate({ scrollTop: 0 }, 700);
  });

  function toggleCaseCard($card) {
    var isFlipped = $card.toggleClass("is-flipped").hasClass("is-flipped");
    $card.attr("aria-pressed", isFlipped ? "true" : "false");
  }

  $(document).on("click", ".case-card-flip", function (e) {
    if ($(e.target).closest("a, button").length) {
      return;
    }
    toggleCaseCard($(this));
  });

  $(document).on("keydown", ".case-card-flip", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleCaseCard($(this));
    }
  });

  $(document).on("click", ".lang-link a", function (e) {
    e.preventDefault();
    var baseHref = ($(this).attr("href") || "").split("#")[0];
    if (!baseHref) {
      return;
    }
    var targetHref = baseHref + "#" + getCurrentSectionId();
    if ($("body").hasClass("mobile-nav-active")) {
      closeMobileNav();
    }
    window.location.href = targetHref;
  });
})(jQuery);
