/* STANDARD DETAILS — small interactions
   - mobile nav toggle
   - reveal-on-scroll
   - active nav link based on current page
   - basic contact form handler (no backend; owner wires up later)
*/
(function () {
  "use strict";

  /* ---- Mobile nav ---- */
  var body = document.body;
  var toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      body.classList.toggle("nav-open");
      var open = body.classList.contains("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // close menu when a link is tapped
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", function () { body.classList.remove("nav-open"); });
    });
  }

  /* ---- Active nav link ---- */
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === here || (here === "" && href === "index.html")) {
      a.classList.add("active");
    }
  });

  /* ---- Reveal on scroll ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Contact form (front-end only placeholder) ---- */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = form.querySelector("[data-form-msg]");
      if (msg) {
        msg.hidden = false;
        msg.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      form.reset();
      // TODO(owner): 送信先を設定してください（Formspree / Googleフォーム / メール送信など）
    });
  }

  /* ---- Opening intro (video splash -> homepage) ---- */
  var intro = document.getElementById("intro");
  if (intro) {
    var video = document.getElementById("introVideo");
    var seenKey = "sd_intro_seen";
    var seen = false;
    try { seen = sessionStorage.getItem(seenKey) === "1"; } catch (e) {}

    if (seen) {
      // Already watched this session — skip straight to the homepage.
      intro.parentNode && intro.parentNode.removeChild(intro);
    } else {
      var dismissed = false;
      var dismiss = function () {
        if (dismissed) return;
        dismissed = true;
        try { sessionStorage.setItem(seenKey, "1"); } catch (e) {}
        intro.classList.add("is-hiding");
        body.classList.remove("intro-lock");
        window.setTimeout(function () {
          intro.hidden = true;
          if (video) { try { video.pause(); } catch (e) {} }
          var h1 = document.querySelector(".hero h1");
          if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
        }, 950);
      };

      // Reveal + lock scroll
      intro.hidden = false;
      body.classList.add("intro-lock");

      var tap = document.getElementById("introTap");

      if (video) {
        var started = false;
        var startPlayback = function () {
          var pr = video.play();
          if (pr && typeof pr.catch === "function") {
            pr.catch(function () {
              // Autoplay blocked -> show the only affordance, a play button
              if (!started && !dismissed) { intro.classList.add("needs-tap"); }
            });
          }
        };

        video.addEventListener("playing", function () {
          started = true;
          intro.classList.remove("needs-tap");
        });
        // Auto-advance when the clip finishes
        video.addEventListener("ended", dismiss);
        // If the video can't load/decode, don't trap the visitor
        video.addEventListener("error", dismiss);

        // Tap/click ANYWHERE skips once playing; before playback it starts it
        intro.addEventListener("click", function () {
          if (started) { dismiss(); }
          else { intro.classList.remove("needs-tap"); startPlayback(); }
        });

        // Kick off muted autoplay as soon as possible
        startPlayback();

        // Bail fast only if the source is genuinely unsupported/missing
        if (video.error || video.networkState === 3 /* NO_SOURCE */) { dismiss(); }

        // Auto-advance safety: once we know the length, cap the intro to it
        video.addEventListener("loadedmetadata", function () {
          var ms = (isFinite(video.duration) ? video.duration : 15) * 1000 + 2000;
          window.setTimeout(dismiss, ms);
        });

        // Last-resort watchdog: if NO data has loaded at all after 12s
        // (broken file / offline), reveal the site rather than hang.
        // A slow-but-buffering video (readyState >= 1) is left to play.
        window.setTimeout(function () {
          if (!started && video.readyState === 0) { dismiss(); }
        }, 12000);
      } else {
        dismiss();
      }
    }
  }

  /* ---- Footer year ---- */
  var y = document.querySelector("[data-year]");
  if (y) { y.textContent = new Date().getFullYear(); }
})();
