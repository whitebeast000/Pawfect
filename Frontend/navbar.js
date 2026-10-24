/* =========================================================
   PawCare – shared navbar behaviour
   Put this file next to navbar.css (Frontend/navbar.js) and add
   <script src="../navbar.js"></script> before </body> on every page.

   - "Log out" button: asks to confirm, clears the saved login details,
     then goes to the login page.
   - "Need advice?" card: opens the Articles page.
   ========================================================= */
(function () {
  "use strict";

  var loginPage = new URL("Login_Signup/login.html", new URL(".", document.currentScript.src));
  var ARTICLES_PAGE = "../Articles/Articles.html";

  var logout = document.querySelector(".logout-btn");
  if (logout) {
    logout.addEventListener("click", function () {
      if (!window.confirm("Log out of PawCare?")) return;
      try {
        sessionStorage.removeItem("pawfectDemoAuthSession");
      } catch (error) {
        window.alert("Unable to end the demo session. Please try again.");
        return;
      }
      window.location.replace(loginPage.href);
    });
  }

  var advice = document.querySelector(".left-bottom");
  if (advice) {
    advice.style.cursor = "pointer";
    advice.setAttribute("role", "link");
    advice.setAttribute("tabindex", "0");
    advice.setAttribute("aria-label", "Read our pet care guide");
    advice.addEventListener("click", function () {
      window.location.href = ARTICLES_PAGE;
    });
    advice.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.location.href = ARTICLES_PAGE;
      }
    });
  }

  var drawer = document.querySelector(".left");
  if (drawer) {
    var mobileBar = document.createElement("div");
    mobileBar.className = "navbar-mobile-bar";

    var menuButton = document.createElement("button");
    menuButton.className = "navbar-menu-toggle";
    menuButton.type = "button";
    menuButton.setAttribute("aria-label", "Toggle navigation menu");
    menuButton.setAttribute("aria-expanded", "false");
    drawer.id = drawer.id || "mobile-navigation-drawer";
    menuButton.setAttribute("aria-controls", drawer.id);
    menuButton.innerHTML = "<span></span><span></span><span></span>";
    mobileBar.appendChild(menuButton);
    document.body.insertBefore(mobileBar, document.body.firstChild);

    var overlay = document.createElement("div");
    overlay.className = "navbar-mobile-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);

    var desktopQuery = window.matchMedia("(min-width: 1024px)");
    var previousBodyOverflow = "";
    var isDrawerOpen = false;

    function closeDrawer(returnFocus) {
      if (!isDrawerOpen) return;
      isDrawerOpen = false;
      drawer.classList.remove("is-open");
      overlay.classList.remove("is-visible");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("nav-drawer-open");
      menuButton.setAttribute("aria-expanded", "false");
      document.body.style.overflow = previousBodyOverflow;
      if (returnFocus) menuButton.focus();
    }

    function openDrawer() {
      if (isDrawerOpen) return;
      isDrawerOpen = true;
      previousBodyOverflow = document.body.style.overflow;
      drawer.classList.add("is-open");
      overlay.classList.add("is-visible");
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("nav-drawer-open");
      document.body.style.overflow = "hidden";
      menuButton.setAttribute("aria-expanded", "true");
    }

    menuButton.addEventListener("click", function () {
      if (menuButton.getAttribute("aria-expanded") === "true") {
        closeDrawer(false);
      } else {
        openDrawer();
      }
    });

    overlay.addEventListener("click", function () {
      closeDrawer(true);
    });

    drawer.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeDrawer(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
        closeDrawer(true);
      }
    });

    desktopQuery.addEventListener("change", function (event) {
      if (event.matches) closeDrawer(false);
    });

    window.addEventListener("resize", function () {
      if (desktopQuery.matches) closeDrawer(false);
    });
  }
})();