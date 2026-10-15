// Pets.js - list, search, filter and remove pets

const petsBody = document.getElementById("petsBody");
const searchInput = document.getElementById("searchInput");
const speciesFilter = document.getElementById("speciesFilter");

function renderPets() {
  const term = searchInput.value.trim().toLowerCase();
  const species = speciesFilter.value;

  const pets = AdminData.pets.filter(pet => {
    const owner = findUser(pet.owner_id);
    const ownerName = owner ? owner.full_name : "";
    const matchesText = [pet.name, pet.breed, ownerName].some(text => text.toLowerCase().includes(term));
    const matchesSpecies = species === "all" || pet.species === species;
    return matchesText && matchesSpecies;
  });

  if (pets.length === 0) {
    petsBody.innerHTML = `<tr><td colspan="7" class="empty">No pets found.</td></tr>`;
    return;
  }

  petsBody.innerHTML = pets.map(pet => {
    const owner = findUser(pet.owner_id);
    const healthColor = pet.health_status === "Healthy" ? "green" : "amber";

        return `
      <tr>
        <td>
          <div>
            <div class="cell-main">${escapeHtml(pet.name)}</div>
            <div class="cell-sub">${escapeHtml(pet.breed)} · ${pet.gender}</div>
          </div>
        </td>
        <td data-label="Species">${pet.species}</td>
        <td data-label="Owner">${owner ? escapeHtml(owner.full_name) : "—"}</td>
        <td data-label="Age">${getAge(pet.dob)}</td>
        <td data-label="Weight">${pet.weight_kg} kg</td>
        <td data-label="Health">${statusBadge(pet.health_status, healthColor)}</td>
        <td><div class="row-actions">
          <button class="btn btn-danger btn-small" data-id="${pet.id}">Remove</button>
        </div></td>
      </tr>`;
      
  }).join("");
}

petsBody.addEventListener("click", event => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;

  const pet = findPet(Number(button.dataset.id));
  if (!confirmAction(`Remove ${pet.name}? This also removes their records.`)) return;

  AdminData.pets = AdminData.pets.filter(p => p.id !== pet.id);
  AdminData.appointments = AdminData.appointments.filter(a => a.pet_id !== pet.id);
  AdminData.vaccinations = AdminData.vaccinations.filter(v => v.pet_id !== pet.id);
  renderPets();
});

searchInput.addEventListener("input", renderPets);
speciesFilter.addEventListener("change", renderPets);
renderPets();
