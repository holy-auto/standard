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

      // Controls
      var skip = document.getElementById("introSkip");
      var enter = document.getElementById("introEnter");
      var tap = document.getElementById("introTap");
      var sound = document.getElementById("introSound");
      skip && skip.addEventListener("click", dismiss);
      enter && enter.addEventListener("click", dismiss);

      if (sound && video) {
        sound.addEventListener("click", function () {
          video.muted = !video.muted;
          sound.textContent = video.muted ? "🔇" : "🔊";
          if (!video.muted) { video.play().catch(function () {}); }
        });
      }

      if (video) {
        var started = false;
        video.addEventListener("playing", function () { started = true; });
        // Auto-advance when the clip finishes
        video.addEventListener("ended", dismiss);
        // If the video can't load/decode, don't trap the visitor
        video.addEventListener("error", dismiss);
        // Try muted autoplay; if blocked, show a tap-to-play button
        var tryPlay = video.play();
        if (tryPlay && typeof tryPlay.catch === "function") {
          tryPlay.catch(function () {
            if (!started && !dismissed) {
              intro.classList.add("needs-tap");
              if (tap) {
                tap.addEventListener("click", function () {
                  intro.classList.remove("needs-tap");
                  video.play().catch(dismiss);
                });
              }
            }
          });
        }
        // Safety net #1: if the source is unsupported/broken, bail out fast
        if (video.error || video.networkState === 3 /* NO_SOURCE */) { dismiss(); }
        // Safety net #2: never hang longer than the clip + a small buffer
        video.addEventListener("loadedmetadata", function () {
          var ms = (isFinite(video.duration) ? video.duration : 12) * 1000 + 1500;
          window.setTimeout(dismiss, ms);
        });
        // Safety net #3: if playback hasn't started in ~4.5s, move on
        window.setTimeout(function () { if (!started) dismiss(); }, 4500);
      } else {
        dismiss();
      }
    }
  }

  /* ---- Footer year ---- */
  var y = document.querySelector("[data-year]");
  if (y) { y.textContent = new Date().getFullYear(); }
})();
