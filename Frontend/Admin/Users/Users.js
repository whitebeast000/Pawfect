// Users.js - list, search, block/unblock and delete users

const usersBody = document.getElementById("usersBody");
const searchInput = document.getElementById("searchInput");
const roleFilter = document.getElementById("roleFilter");

function renderUsers() {
  const term = searchInput.value.trim().toLowerCase();
  const role = roleFilter.value;

  const users = AdminData.users.filter(user => {
    const matchesText = user.full_name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
    const matchesRole = role === "all" || user.role === role;
    return matchesText && matchesRole;
  });

  if (users.length === 0) {
    usersBody.innerHTML = `<tr><td colspan="6" class="empty">No users found.</td></tr>`;
    return;
  }

  usersBody.innerHTML = users.map(user => {
    const petCount = AdminData.pets.filter(p => p.owner_id === user.id).length;
    const isAdmin = user.role === "admin";
    const statusColor = user.status === "active" ? "green" : "red";

    // the admin account can't be blocked or deleted from here
    const actions = isAdmin ? "" : `
      <button class="btn btn-outline btn-small" data-action="toggle" data-id="${user.id}">
        ${user.status === "active" ? "Block" : "Unblock"}
      </button>
      <button class="btn btn-danger btn-small" data-action="delete" data-id="${user.id}">Delete</button>`;

        return `
      <tr>
        <td>
          <div>
            <div class="cell-main">${escapeHtml(user.full_name)}</div>
            <div class="cell-sub">${escapeHtml(user.email)}</div>
          </div>
        </td>
        <td data-label="Role">${isAdmin ? "Admin" : "Owner"}</td>
        <td data-label="Pets">${isAdmin ? "—" : petCount}</td>
        <td data-label="Joined">${formatDate(user.joined_at)}</td>
        <td data-label="Status">${statusBadge(user.status === "active" ? "Active" : "Blocked", statusColor)}</td>
        <td><div class="row-actions">${actions}</div></td>
      </tr>`;
  }).join("");
}

usersBody.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const user = findUser(Number(button.dataset.id));

  if (button.dataset.action === "toggle") {
    user.status = user.status === "active" ? "blocked" : "active";
  }

  if (button.dataset.action === "delete") {
    if (!confirmAction(`Delete ${user.full_name}? Their pets will be removed too.`)) return;
    AdminData.users = AdminData.users.filter(u => u.id !== user.id);
    AdminData.pets = AdminData.pets.filter(p => p.owner_id !== user.id);
  }

  renderUsers();
});

searchInput.addEventListener("input", renderUsers);
roleFilter.addEventListener("change", renderUsers);
renderUsers();
