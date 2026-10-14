// Dashboard.js - fills the stat cards, activity feed and latest users

const statsRow = document.getElementById("statsRow");
const activityList = document.getElementById("activityList");
const latestUsersBody = document.getElementById("latestUsersBody");

function showStats() {
  const stats = [
    { icon: "bi-person",         number: AdminData.users.length,        label: "Users" },
    { icon: "bi-heart",          number: AdminData.pets.length,         label: "Pets" },
    { icon: "bi-calendar-check", number: AdminData.appointments.length, label: "Appointments" },
    { icon: "bi-journal-text",   number: AdminData.articles.length,     label: "Articles" }
  ];

  statsRow.innerHTML = stats.map(s => `
    <div class="card stat">
      <div class="stat-icon"><i class="bi ${s.icon}"></i></div>
      <div>
        <div class="stat-number">${s.number}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    </div>
  `).join("");
}

function showActivity() {
  activityList.innerHTML = AdminData.activity.map(a => `
    <div class="list-item">
      <div class="list-icon"><i class="bi ${a.icon}"></i></div>
      <div>
        <div class="cell-main">${a.title}</div>
        <div class="cell-sub">${a.detail} · ${a.time}</div>
      </div>
    </div>
  `).join("");
}

function showLatestUsers() {
  // newest four, by joined date
  const latest = [...AdminData.users]
    .sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at))
    .slice(0, 4);

  latestUsersBody.innerHTML = latest.map(user => {
    const petCount = AdminData.pets.filter(p => p.owner_id === user.id).length;
    const isAdmin = user.role === "admin";
    return `
      <tr>
        <td class="cell-main">${escapeHtml(user.full_name)}</td>
        <td>${isAdmin ? "—" : petCount}</td>
        <td>${statusBadge(isAdmin ? "Admin" : "Owner", "green")}</td>
      </tr>`;
  }).join("");
}

showStats();
showActivity();
showLatestUsers();
