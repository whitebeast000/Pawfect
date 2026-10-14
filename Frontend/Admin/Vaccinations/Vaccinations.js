// Vaccinations.js - every vaccination record, with overdue ones easy to find

const vaccinationsBody = document.getElementById("vaccinationsBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

function renderVaccinations() {
  const term = searchInput.value.trim().toLowerCase();
  const wantedStatus = statusFilter.value;

  const records = AdminData.vaccinations.filter(record => {
    const pet = findPet(record.pet_id);
    const matchesText = [pet ? pet.name : "", record.vaccine_name].some(t => t.toLowerCase().includes(term));
    const matchesStatus = wantedStatus === "all" || getVaccineStatus(record.next_due).label === wantedStatus;
    return matchesText && matchesStatus;
  });

  if (records.length === 0) {
    vaccinationsBody.innerHTML = `<tr><td colspan="6" class="empty">No vaccination records found.</td></tr>`;
    return;
  }

  vaccinationsBody.innerHTML = records.map(record => {
    const pet = findPet(record.pet_id);
    const owner = pet ? findUser(pet.owner_id) : null;
    const status = getVaccineStatus(record.next_due);

    return `
      <tr>
        <td>
          <div class="cell-main">${pet ? escapeHtml(pet.name) : "Removed pet"}</div>
          <div class="cell-sub">${owner ? escapeHtml(owner.full_name) : "—"}</div>
        </td>
        <td class="cell-main">${escapeHtml(record.vaccine_name)}</td>
        <td>${formatDate(record.given_on)}</td>
        <td>${formatDate(record.next_due)}</td>
        <td>${statusBadge(status.label, status.color)}</td>
        <td><div class="row-actions">
          <button class="btn btn-danger btn-small" data-id="${record.id}">Delete</button>
        </div></td>
      </tr>`;
  }).join("");
}

vaccinationsBody.addEventListener("click", event => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  if (!confirmAction("Delete this vaccination record?")) return;

  AdminData.vaccinations = AdminData.vaccinations.filter(v => v.id !== Number(button.dataset.id));
  renderVaccinations();
});

searchInput.addEventListener("input", renderVaccinations);
statusFilter.addEventListener("change", renderVaccinations);
renderVaccinations();
