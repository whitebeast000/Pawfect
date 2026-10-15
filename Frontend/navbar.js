// navbar.js - hamburger menu for small screens
// Builds the buttons itself, so pages only need to include this file.

const sidebar = document.querySelector(".left");

if (sidebar) {
    // the hamburger button
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "menu-toggle";
    toggleBtn.setAttribute("aria-label", "Open menu");
    toggleBtn.innerHTML = '<i class="bi bi-list"></i>';

    // the X inside the drawer
    const closeBtn = document.createElement("button");
    closeBtn.className = "menu-close";
    closeBtn.setAttribute("aria-label", "Close menu");
    closeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';

    // the dark layer behind the drawer
    const overlay = document.createElement("div");
    overlay.className = "nav-overlay";

    sidebar.appendChild(closeBtn);
    document.body.append(toggleBtn, overlay);

    function setMenu(isOpen) {
        sidebar.classList.toggle("open", isOpen);
        overlay.classList.toggle("show", isOpen);
        document.body.classList.toggle("no-scroll", isOpen);
    }

    toggleBtn.addEventListener("click", () => setMenu(true));
    closeBtn.addEventListener("click", () => setMenu(false));
    overlay.addEventListener("click", () => setMenu(false));

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") setMenu(false);
    });

    // if the window is resized back to desktop, reset everything
    window.addEventListener("resize", () => {
        if (window.innerWidth > 1024) setMenu(false);
    });
}