// Appointments.js - list appointments and let the admin change their status

const appointmentsBody = document.getElementById("appointmentsBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

const STATUS_COLORS = { upcoming: "amber", completed: "green", cancelled: "red" };

function renderAppointments() {
  const term = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  const appointments = AdminData.appointments.filter(appt => {
    const pet = findPet(appt.pet_id);
    const owner = pet ? findUser(pet.owner_id) : null;
    const searchable = [pet ? pet.name : "", owner ? owner.full_name : "", appt.vet_name];
    const matchesText = searchable.some(text => text.toLowerCase().includes(term));
    const matchesStatus = status === "all" || appt.status === status;
    return matchesText && matchesStatus;
  });

  if (appointments.length === 0) {
    appointmentsBody.innerHTML = `<tr><td colspan="5" class="empty">No appointments found.</td></tr>`;
    return;
  }

  appointmentsBody.innerHTML = appointments.map(appt => {
    const pet = findPet(appt.pet_id);
    const owner = pet ? findUser(pet.owner_id) : null;

    return `
      <tr>
        <td>
          <div>
            <div class="cell-main">${pet ? escapeHtml(pet.name) : "Removed pet"}</div>
            <div class="cell-sub">${owner ? escapeHtml(owner.full_name) : "—"}</div>
          </div>
        </td>
        <td data-label="Vet">${escapeHtml(appt.vet_name)}</td>
        <td data-label="Date &amp; time">${formatDate(appt.appointment_date)}, ${formatTime(appt.appointment_time)}</td>
        <td data-label="Reason">${escapeHtml(appt.reason)}</td>
        <td data-label="Status">
          <span>
            ${statusBadge(appt.status[0].toUpperCase() + appt.status.slice(1), STATUS_COLORS[appt.status])}
            <select class="input status-select" data-id="${appt.id}">
              <option value="upcoming"  ${appt.status === "upcoming"  ? "selected" : ""}>Upcoming</option>
              <option value="completed" ${appt.status === "completed" ? "selected" : ""}>Completed</option>
              <option value="cancelled" ${appt.status === "cancelled" ? "selected" : ""}>Cancelled</option>
            </select>
          </span>
        </td>
      </tr>`;
  }).join("");
}

// when the admin picks a new status from a row's dropdown
appointmentsBody.addEventListener("change", event => {
  const select = event.target.closest("select[data-id]");
  if (!select) return;

  const appt = AdminData.appointments.find(a => a.id === Number(select.dataset.id));
  appt.status = select.value;
  renderAppointments();
});

searchInput.addEventListener("input", renderAppointments);
statusFilter.addEventListener("change", renderAppointments);
renderAppointments();
