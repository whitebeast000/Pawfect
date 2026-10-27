const STORAGE_KEY = "pawfectProfilePets";

const defaultPets = {
    Max: {
        name: "Max", breed: "Golden Retriever", age: 3,
        ageUnit: "years", gender: "Male", color: "Golden",
        status: "Healthy", health: "Good", weight: 24,
        vaccinations: 4, vetVisits: 3,
        activity: [
            { icon: "✚", title: "Rabies vaccine", date: "12 Oct 2025" },
            { icon: "◷", title: "Regular checkup", date: "3 Sep 2026" }
        ],
        weights: [
            { date: "2026-06-01", weight: 22.5 },
            { date: "2026-07-01", weight: 23.0 },
            { date: "2026-08-01", weight: 23.4 },
            { date: "2026-09-01", weight: 23.8 },
            { date: "2026-10-01", weight: 24.0 }
        ],
        vaccineRecords: [
            { vaccine: "Rabies", given: "2025-10-12", due: "2026-10-12" },
            { vaccine: "Distemper", given: "2024-11-15", due: "2025-11-15" },
            { vaccine: "Parvovirus", given: "2025-12-20", due: "2026-12-20" },
            { vaccine: "Bordetella", given: "2026-03-02", due: "2027-03-02" }
        ]
    },
    Luna: {
        name: "Luna", breed: "Persian Cat", age: 1,
        ageUnit: "years", gender: "", color: "",
        status: "Healthy", health: "Good", weight: 4,
        vaccinations: 2, vetVisits: 2, activity: [],
        weights: [
            { date: "2026-06-01", weight: 3.5 },
            { date: "2026-07-01", weight: 3.6 },
            { date: "2026-08-01", weight: 3.8 },
            { date: "2026-09-01", weight: 3.9 },
            { date: "2026-10-01", weight: 4.0 }
        ],
        vaccineRecords: [
            { vaccine: "Rabies", given: "2025-08-10", due: "2026-08-10" },
            { vaccine: "FVRCP", given: "2026-01-15", due: "2027-01-15" }
        ]
    },
    Coco: {
        name: "Coco", breed: "Beagle", age: 3,
        ageUnit: "years", gender: "", color: "",
        status: "Healthy", health: "Good", weight: 11.5,
        vaccinations: 2, vetVisits: 2, activity: [],
        weights: [
            { date: "2026-06-01", weight: 10.5 },
            { date: "2026-07-01", weight: 10.8 },
            { date: "2026-08-01", weight: 11.0 },
            { date: "2026-09-01", weight: 11.3 },
            { date: "2026-10-01", weight: 11.5 }
        ],
        vaccineRecords: [
            { vaccine: "Rabies", given: "2026-02-10", due: "2027-02-10" },
            { vaccine: "Distemper", given: "2026-04-05", due: "2027-04-05" }
        ]
    },
    Bella: {
        name: "Bella", breed: "Golden Retriever", age: 2,
        ageUnit: "years", gender: "", color: "Golden",
        status: "Healthy", health: "Good", weight: 24,
        vaccinations: 4, vetVisits: 3, activity: [],
        weights: [
            { date: "2026-06-01", weight: 22 },
            { date: "2026-07-01", weight: 22.5 },
            { date: "2026-08-01", weight: 23 },
            { date: "2026-09-01", weight: 23.5 },
            { date: "2026-10-01", weight: 24 }
        ],
        vaccineRecords: []
    }
};

function cloneData(value) {
    return JSON.parse(JSON.stringify(value));
}

function loadPets() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && typeof saved === "object") {
            const merged = { ...cloneData(defaultPets), ...saved };

            Object.values(merged).forEach(pet => {
                pet.weights ??= [];
                pet.vaccineRecords ??= [];
                pet.activity ??= [];
                pet.vaccinations ??= pet.vaccineRecords.length;
            });

            return merged;
        }
    } catch (error) {
        console.error("Could not load pet data:", error);
    }

    return cloneData(defaultPets);
}

let pets = loadPets();

function savePets() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
        return true;
    } catch (error) {
        console.error("Could not save pet data:", error);
        return false;
    }
}

const params = new URLSearchParams(location.search);
const requestedName = params.get("pet") || "Max";

let selectedKey = Object.keys(pets).find(
    key => key.toLowerCase() === requestedName.toLowerCase()
) || "Max";

let currentPet = pets[selectedKey];

const $ = id => document.getElementById(id);

const editButton = $("edit-profile-btn");
const modal = $("edit-modal");
const closeButton = $("close-edit-modal");
const cancelButton = $("cancel-edit");
const form = $("edit-pet-form");
const message = $("edit-message");

const nameInput = $("edit-name");
const breedInput = $("edit-breed");
const ageInput = $("edit-age");
const ageUnitInput = $("edit-age-unit");
const genderInput = $("edit-gender");
const colorInput = $("edit-color");

function formatAge(pet) {
    const age = Number(pet.age);
    if (!Number.isFinite(age)) return "";

    return `${age} ${pet.ageUnit || "years"}`;
}

function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function getSortedWeights() {
    return [...currentPet.weights].sort((a, b) =>
        a.date.localeCompare(b.date)
    );
}

function renderActivity() {
    const list = $("activity-list");
    list.replaceChildren();

    const activities = [...currentPet.activity];

    currentPet.weights.forEach(record => {
        activities.push({
            icon: "⚖",
            title: `Weight recorded: ${record.weight} kg`,
            date: formatDate(record.date),
            sortDate: record.date
        });
    });

    currentPet.vaccineRecords.forEach(record => {
        activities.push({
            icon: "✚",
            title: `${record.vaccine} vaccination`,
            date: formatDate(record.given),
            sortDate: record.given
        });
    });

    activities.sort((a, b) =>
        (b.sortDate || "").localeCompare(a.sortDate || "")
    );

    activities.slice(0, 5).forEach(item => {
        const li = document.createElement("li");
        li.className = "petprofile-item";

        const icon = document.createElement("span");
        icon.className = "petprofile-icon";
        icon.textContent = item.icon || "•";

        const details = document.createElement("div");

        const title = document.createElement("p");
        title.className = "petprofile-item-title";
        title.textContent = item.title;

        const date = document.createElement("p");
        date.className = "petprofile-item-date";
        date.textContent = item.date || "";

        details.append(title, date);
        li.append(icon, details);
        list.appendChild(li);
    });

    if (!activities.length) {
        const li = document.createElement("li");
        li.className = "petprofile-item-title";
        li.textContent = "No recent activity yet.";
        list.appendChild(li);
    }
}

function renderWeightChart() {
    const records = getSortedWeights();
    const line = $("weight-line");
    const dots = $("weight-dots");
    const note = $("chart-note");

    line.setAttribute("points", "");
    dots.replaceChildren();

    if (!records.length) {
        note.textContent = "No weight records available yet.";
        return;
    }

    const values = records.map(record => Number(record.weight));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const left = 15, right = 475, top = 20, bottom = 155;

    const points = values.map((weight, index) => {
        const x = records.length === 1
            ? (left + right) / 2
            : left + index * (right - left) / (records.length - 1);

        const y = bottom - ((weight - min) / range) * (bottom - top);
        return [Number(x.toFixed(1)), Number(y.toFixed(1))];
    });

    line.setAttribute("points", points.map(point => point.join(",")).join(" "));

    points.forEach(([cx, cy], index) => {
        const circle = document.createElementNS(
            "http://www.w3.org/2000/svg", "circle"
        );

        circle.setAttribute("cx", cx);
        circle.setAttribute("cy", cy);
        circle.setAttribute("r", "5");

        const title = document.createElementNS(
            "http://www.w3.org/2000/svg", "title"
        );

        title.textContent = `${records[index].date}: ${records[index].weight} kg`;
        circle.appendChild(title);
        dots.appendChild(circle);
    });

    const latest = records[records.length - 1];
    currentPet.weight = Number(latest.weight);
    $("stat-weight").textContent = `${latest.weight} kg`;
    note.textContent =
        `${records.length} recorded measurements · Latest: ${latest.weight} kg`;

    savePets();
}

function renderProfile() {
    $("profile-title").textContent = currentPet.name;
    $("profile-name").textContent = currentPet.name;
    $("profile-subtitle").textContent = currentPet.gender
        ? `${currentPet.breed} · ${currentPet.gender}`
        : currentPet.breed;

    $("profile-meta").textContent = [
        formatAge(currentPet),
        currentPet.weight !== undefined ? `${currentPet.weight} kg` : "",
        currentPet.color || ""
    ].filter(Boolean).join(" · ");

    $("profile-avatar").alt = currentPet.name;
    document.title = `${currentPet.name}'s Profile - Pawfect`;
    $("profile-status").textContent = currentPet.status || "Healthy";
    $("stat-health").textContent = currentPet.health || "Good";

    const weights = getSortedWeights();
    if (weights.length) {
        currentPet.weight = Number(weights[weights.length - 1].weight);
    }

    $("stat-weight").textContent = `${currentPet.weight ?? "—"} kg`;
    $("stat-vaccinations").textContent = currentPet.vaccineRecords.length;
    $("stat-visits").textContent = currentPet.vetVisits ?? 0;

    renderActivity();
    renderWeightChart();
}

function openEditModal() {
    nameInput.value = currentPet.name || "";
    breedInput.value = currentPet.breed || "";
    ageInput.value = currentPet.age ?? 0;
    ageUnitInput.value = currentPet.ageUnit || "years";
    genderInput.value = currentPet.gender || "";
    colorInput.value = currentPet.color || "";
    message.textContent = "";

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    nameInput.focus();
}

function closeEditModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    editButton.focus();
}

editButton.addEventListener("click", openEditModal);
closeButton.addEventListener("click", closeEditModal);
cancelButton.addEventListener("click", closeEditModal);

modal.addEventListener("click", event => {
    if (event.target === modal) closeEditModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) closeEditModal();
});

form.addEventListener("submit", event => {
    event.preventDefault();

    const newName = nameInput.value.trim();
    const newBreed = breedInput.value.trim();
    const newAge = Number(ageInput.value);

    if (!newName || !newBreed || !Number.isFinite(newAge) || newAge < 0) {
        message.textContent = "Please enter a valid name, breed, and age.";
        return;
    }

    const existingKey = Object.keys(pets).find(
        key => key.toLowerCase() === newName.toLowerCase()
    );

    if (existingKey && existingKey !== selectedKey) {
        message.textContent = "A pet with this name already exists.";
        return;
    }

    currentPet.name = newName;
    currentPet.breed = newBreed;
    currentPet.age = newAge;
    currentPet.ageUnit = ageUnitInput.value;
    currentPet.gender = genderInput.value;
    currentPet.color = colorInput.value.trim();

    if (newName !== selectedKey) {
        delete pets[selectedKey];
        pets[newName] = currentPet;
        selectedKey = newName;

        const url = new URL(location.href);
        url.searchParams.set("pet", newName);
        history.replaceState({}, "", url);
    }

    if (!savePets()) {
        message.textContent = "Could not save changes in this browser.";
        return;
    }

    renderProfile();
    closeEditModal();
});

window.addEventListener("storage", event => {
    if (event.key === STORAGE_KEY) {
        pets = loadPets();

        const matchingKey = Object.keys(pets).find(
            key => key.toLowerCase() === currentPet.name.toLowerCase()
        );

        if (matchingKey) {
            selectedKey = matchingKey;
            currentPet = pets[selectedKey];
            renderProfile();
        }
    }
});

renderProfile();