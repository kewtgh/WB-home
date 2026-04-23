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

  $window.on("scroll", syncHeaderState);
  syncHeaderState();

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

  $backToTop.on("click", function (e) {
    e.preventDefault();
    $("html, body").animate({ scrollTop: 0 }, 700);
  });
})(jQuery);
