const STORAGE_KEY = "pawfectProfilePets";

const defaultVaccineRecords = {
    Max: [
        { vaccine: "Rabies", given: "2025-10-12", due: "2026-10-12" },
        { vaccine: "Distemper", given: "2024-11-15", due: "2025-11-15" },
        { vaccine: "Parvovirus", given: "2025-12-20", due: "2026-12-20" },
        { vaccine: "Bordetella", given: "2026-03-02", due: "2027-03-02" }
    ],
    Luna: [
        { vaccine: "Rabies", given: "2025-08-10", due: "2026-08-10" },
        { vaccine: "FVRCP", given: "2026-01-15", due: "2027-01-15" }
    ],
    Coco: [
        { vaccine: "Rabies", given: "2026-02-10", due: "2027-02-10" },
        { vaccine: "Distemper", given: "2026-04-05", due: "2027-04-05" }
    ],
    Bella: []
};

function loadPets() {
    let pets = {};

    try {
        pets = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (error) {
        console.error("Could not read pet data:", error);
    }

    Object.entries(defaultVaccineRecords).forEach(([name, records]) => {
        if (!pets[name]) {
            pets[name] = {
                name,
                breed: "",
                age: 0,
                ageUnit: "years",
                status: "Healthy",
                health: "Good",
                weight: 0,
                vaccinations: records.length,
                vetVisits: 0,
                activity: [],
                weights: [],
                vaccineRecords: records
            };
        } else if (!Array.isArray(pets[name].vaccineRecords)) {
            pets[name].vaccineRecords = records;
        }

        pets[name].weights ??= [];
        pets[name].activity ??= [];
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
    return pets;
}

let pets = loadPets();

const tableBody = document.getElementById("vaccineTableBody");
const petTabs = document.querySelectorAll(".pet-tab");
const formPanel = document.getElementById("vaccineFormPanel");
const modalBackdrop = document.getElementById("vaccineModalBackdrop");
const openFormButton = document.getElementById("openVaccineForm");
const closeFormButton = document.getElementById("closeVaccineForm");
const cancelFormButton = document.getElementById("cancelVaccineForm");
const vaccineForm = document.getElementById("vaccineForm");
const petNameInput = document.getElementById("petName");
const vaccineNameInput = document.getElementById("vaccineName");
const givenDateInput = document.getElementById("givenDate");
const dueDateInput = document.getElementById("dueDate");

const params = new URLSearchParams(location.search);
const requestedPet = params.get("pet") || "Max";

let selectedPet = Object.keys(pets).find(
    name => name.toLowerCase() === requestedPet.toLowerCase()
) || "Max";

function savePets() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
}

function formatDate(value) {
    if (!value) return "—";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year.slice(-2)}`;
}

function getVaccineStatus(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(`${dueDate}T00:00:00`);
    const daysRemaining = Math.ceil(
        (due - today) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining < 0) {
        return { label: "Overdue", className: "overdue" };
    }

    if (daysRemaining <= 30) {
        return { label: "Due soon", className: "due-soon" };
    }

    return { label: "Up to date", className: "up-to-date" };
}

function renderVaccinations() {
    tableBody.replaceChildren();

    const records = pets[selectedPet].vaccineRecords || [];

    if (!records.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.textContent = "No vaccination records yet.";
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    records.forEach(record => {
        const row = document.createElement("tr");
        const vaccineCell = document.createElement("td");
        const givenCell = document.createElement("td");
        const dueCell = document.createElement("td");
        const statusCell = document.createElement("td");

        const badge = document.createElement("span");
        const status = getVaccineStatus(record.due);

        vaccineCell.textContent = record.vaccine;
        givenCell.textContent = formatDate(record.given);
        dueCell.textContent = formatDate(record.due);

        badge.className = `vaccine-status ${status.className}`;
        badge.textContent = status.label;

        statusCell.appendChild(badge);
        row.append(vaccineCell, givenCell, dueCell, statusCell);
        tableBody.appendChild(row);
    });
}

function selectPet(name) {
    if (!pets[name]) return;

    selectedPet = name;
    petNameInput.value = name;

    petTabs.forEach(tab => {
        const active = tab.dataset.pet === name;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
    });

    const url = new URL(location.href);
    url.searchParams.set("pet", name);
    history.replaceState({}, "", url);

    renderVaccinations();
}

petTabs.forEach(tab => {
    tab.addEventListener("click", () => selectPet(tab.dataset.pet));
});

function openVaccineModal() {
    formPanel.hidden = false;
    modalBackdrop.hidden = false;
    petNameInput.value = selectedPet;
    vaccineNameInput.focus();
}

function closeVaccineModal() {
    formPanel.hidden = true;
    modalBackdrop.hidden = true;
    vaccineForm.reset();
    petNameInput.value = selectedPet;
}

openFormButton.addEventListener("click", openVaccineModal);
closeFormButton.addEventListener("click", closeVaccineModal);
cancelFormButton.addEventListener("click", closeVaccineModal);
modalBackdrop.addEventListener("click", closeVaccineModal);

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !formPanel.hidden) {
        closeVaccineModal();
    }
});

vaccineForm.addEventListener("submit", event => {
    event.preventDefault();

    const pet = petNameInput.value;
    const vaccine = vaccineNameInput.value.trim();
    const given = givenDateInput.value;
    const due = dueDateInput.value;

    if (!pets[pet]) {
        alert("Please select a valid pet.");
        return;
    }

    if (!vaccine || !given || !due) {
        alert("Please complete all fields.");
        return;
    }

    if (due < given) {
        alert("The next due date cannot be earlier than the given date.");
        return;
    }

    pets[pet].vaccineRecords ??= [];
    pets[pet].vaccineRecords.push({ vaccine, given, due });
    pets[pet].vaccinations = pets[pet].vaccineRecords.length;

    pets[pet].activity ??= [];
    pets[pet].activity.push({
        icon: "✚",
        title: `${vaccine} vaccination`,
        date: formatDate(given),
        sortDate: given
    });

    savePets();
    selectPet(pet);
    closeVaccineModal();
});

window.addEventListener("storage", event => {
    if (event.key === STORAGE_KEY) {
        pets = loadPets();
        renderVaccinations();
    }
});

selectPet(selectedPet);
renderVaccinations();