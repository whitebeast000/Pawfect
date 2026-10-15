/* =========================================================
   admin-common.js  -  used by every admin page
   1. builds the sidebar (so we don't copy it into 7 files)
   2. small helper functions for dates, badges, etc.
   ========================================================= */

const NAV_ITEMS = [
  { key: "dashboard",    label: "Dashboard",    icon: "bi-house",           href: "../Dashboard/Dashboard.html" },
  { key: "users",        label: "Users",        icon: "bi-person",          href: "../Users/Users.html" },
  { key: "pets",         label: "Pets",         icon: "bi-heart",           href: "../Pets/Pets.html" },
  { key: "appointments", label: "Appointments", icon: "bi-calendar-check",  href: "../Appointments/Appointments.html" },
  { key: "vaccinations", label: "Vaccinations", icon: "bi-shield-plus",     href: "../Vaccinations/Vaccinations.html" },
  { key: "articles",     label: "Articles",     icon: "bi-journal-text",    href: "../Articles/Articles.html" },
  { key: "reports",      label: "Reports",      icon: "bi-bar-chart",       href: "../Reports/Reports.html" }
];

// Change this to wherever your login page lives
const LOGIN_PAGE = "../../Login_Signup/Login.html";

function buildSidebar() {
  const sidebar = document.getElementById("sidebar");
  const currentPage = document.body.dataset.page;

  const links = NAV_ITEMS.map(item => {
    const activeClass = item.key === currentPage ? "active" : "";
    return `<a href="${item.href}" class="${activeClass}"><i class="bi ${item.icon}"></i>${item.label}</a>`;
  }).join("");

  sidebar.innerHTML = `
    <div class="brand">
      <img src="../Pawfect_Logo.png" alt="Pawfect">
    </div>
    <nav class="nav">${links}</nav>
    <a href="${LOGIN_PAGE}" class="logout"><i class="bi bi-box-arrow-left"></i>Log out</a>
  `;
}

/* ---------- helpers ---------- */

function statusBadge(text, color) {
  return `<span class="badge badge-${color}">${text}</span>`;
}

// stops typed text from being read as HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(isoDate) {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(time24) {
  const [hours, minutes] = time24.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function getAge(dob) {
  const months = Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 yr" : `${years} yrs`;
}

// overdue = past date, due soon = within 30 days, otherwise up to date
function getVaccineStatus(nextDue) {
  const daysLeft = Math.ceil((new Date(nextDue) - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: "Overdue", color: "red" };
  if (daysLeft <= 30) return { label: "Due soon", color: "amber" };
  return { label: "Up to date", color: "green" };
}

function findPet(petId) {
  return AdminData.pets.find(p => p.id === petId);
}

function findUser(userId) {
  return AdminData.users.find(u => u.id === userId);
}

function confirmAction(message) {
  return window.confirm(message);
}

/* ---------- hamburger menu for small screens ---------- */

function setupMobileMenu() {
  const sidebar = document.getElementById("sidebar");

  const toggleBtn = document.createElement("button");
  toggleBtn.className = "menu-toggle";
  toggleBtn.setAttribute("aria-label", "Open menu");
  toggleBtn.innerHTML = '<i class="bi bi-list"></i>';

  const closeBtn = document.createElement("button");
  closeBtn.className = "menu-close";
  closeBtn.setAttribute("aria-label", "Close menu");
  closeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';

  const overlay = document.createElement("div");
  overlay.className = "sidebar-overlay";

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
  document.addEventListener("keydown", event => { if (event.key === "Escape") setMenu(false); });

  // back to desktop size: reset everything
  window.addEventListener("resize", () => { if (window.innerWidth > 1024) setMenu(false); });
}

buildSidebar();
setupMobileMenu();
