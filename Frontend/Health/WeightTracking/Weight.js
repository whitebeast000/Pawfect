const STORAGE_KEY = "pawfectProfilePets";

const defaultWeights = {
    Max: [
        { date: "2026-06-01", weight: 22.5 },
        { date: "2026-07-01", weight: 23.0 },
        { date: "2026-08-01", weight: 23.4 },
        { date: "2026-09-01", weight: 23.8 },
        { date: "2026-10-01", weight: 24.0 }
    ],
    Luna: [
        { date: "2026-06-01", weight: 3.5 },
        { date: "2026-07-01", weight: 3.6 },
        { date: "2026-08-01", weight: 3.8 },
        { date: "2026-09-01", weight: 3.9 },
        { date: "2026-10-01", weight: 4.0 }
    ],
    Coco: [
        { date: "2026-06-01", weight: 10.5 },
        { date: "2026-07-01", weight: 10.8 },
        { date: "2026-08-01", weight: 11.0 },
        { date: "2026-09-01", weight: 11.3 },
        { date: "2026-10-01", weight: 11.5 }
    ],
    Bella: [
        { date: "2026-06-01", weight: 22 },
        { date: "2026-07-01", weight: 22.5 },
        { date: "2026-08-01", weight: 23 },
        { date: "2026-09-01", weight: 23.5 },
        { date: "2026-10-01", weight: 24 }
    ]
};

function loadPets() {
    let pets = {};

    try {
        pets = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (error) {
        console.error("Could not read pet data:", error);
    }

    Object.entries(defaultWeights).forEach(([name, weights]) => {
        if (!pets[name]) {
            pets[name] = {
                name,
                breed: "",
                age: 0,
                ageUnit: "years",
                status: "Healthy",
                health: "Good",
                weight: weights.at(-1)?.weight ?? 0,
                vaccinations: 0,
                vetVisits: 0,
                activity: [],
                weights: weights,
                vaccineRecords: []
            };
        } else if (!Array.isArray(pets[name].weights)) {
            pets[name].weights = weights;
        }

        pets[name].vaccineRecords ??= [];
        pets[name].activity ??= [];
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
    return pets;
}

let pets = loadPets();

const petNames = Object.keys(pets);
const petSearch = document.getElementById("weightPetSearch");
const petSearchResults = document.getElementById("petSearchResults");
const petSearchMessage = document.getElementById("petSearchMessage");
const latestWeightElement = document.getElementById("latestWeight");
const weightChangeElement = document.getElementById("weightChange");
const chartCanvas = document.getElementById("weightChart");
const chartContext = chartCanvas.getContext("2d");
const weightForm = document.getElementById("weightForm");
const dateInput = document.getElementById("recordDate");
const weightInput = document.getElementById("recordWeight");
const messageElement = document.getElementById("weightMessage");

const params = new URLSearchParams(location.search);
const requestedPet = params.get("pet") || "Max";

let selectedPet = petNames.find(
    name => name.toLowerCase() === requestedPet.toLowerCase()
) || "Max";

function savePets() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
}

function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

dateInput.value = getTodayString();
dateInput.max = getTodayString();

function getSortedRecords(pet) {
    return [...(pets[pet].weights || [])].sort(
        (a, b) => a.date.localeCompare(b.date)
    );
}

function showPetSuggestions(query = "") {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = petNames.filter(name =>
        name.toLowerCase().includes(normalizedQuery)
    );

    petSearchResults.replaceChildren();

    if (!matches.length) {
        const emptyMessage = document.createElement("div");
        emptyMessage.className = "pet-search-empty";
        emptyMessage.textContent = "No matching pets found.";
        petSearchResults.appendChild(emptyMessage);
    } else {
        matches.forEach(name => {
            const option = document.createElement("button");
            option.type = "button";
            option.className = "pet-search-option";
            option.textContent = name;
            option.addEventListener("click", () => selectPet(name));
            petSearchResults.appendChild(option);
        });
    }

    petSearchResults.hidden = false;
}

function selectPet(name) {
    if (!pets[name]) return;

    selectedPet = name;
    petSearch.value = name;
    petSearchResults.hidden = true;
    petSearchMessage.textContent = "";
    messageElement.textContent = "";

    const url = new URL(location.href);
    url.searchParams.set("pet", name);
    history.replaceState({}, "", url);

    renderWeightPage();
}

petSearch.addEventListener("focus", () => {
    showPetSuggestions(petSearch.value);
});

petSearch.addEventListener("input", () => {
    showPetSuggestions(petSearch.value);
    petSearchMessage.textContent = "";
});

petSearch.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();

        const match = petNames.find(
            name => name.toLowerCase() === petSearch.value.trim().toLowerCase()
        );

        if (match) {
            selectPet(match);
        } else {
            petSearchMessage.textContent = "Please select a listed pet.";
            petSearchResults.hidden = true;
        }
    }

    if (event.key === "Escape") petSearchResults.hidden = true;
});

document.addEventListener("click", event => {
    if (!event.target.closest(".pet-search-box")) {
        petSearchResults.hidden = true;
    }
});

function drawWeightChart(records) {
    const width = chartCanvas.clientWidth;
    const height = chartCanvas.clientHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    if (!width || !height) return;

    chartCanvas.width = Math.round(width * pixelRatio);
    chartCanvas.height = Math.round(height * pixelRatio);
    chartContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    chartContext.clearRect(0, 0, width, height);

    const padding = { top: 18, right: 16, bottom: 34, left: 42 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (!records.length) {
        chartContext.fillStyle = "#98766a";
        chartContext.font = "12px Inter, sans-serif";
        chartContext.textAlign = "center";
        chartContext.fillText("No weight records available", width / 2, height / 2);
        return;
    }

    const weights = records.map(record => Number(record.weight));
    let minWeight = Math.min(...weights);
    let maxWeight = Math.max(...weights);

    if (minWeight === maxWeight) {
        minWeight = Math.max(0, minWeight - 1);
        maxWeight += 1;
    } else {
        const extraSpace = (maxWeight - minWeight) * 0.25;
        minWeight = Math.max(0, minWeight - extraSpace);
        maxWeight += extraSpace;
    }

    const xPosition = index => records.length === 1
        ? padding.left + chartWidth / 2
        : padding.left + (index / (records.length - 1)) * chartWidth;

    const yPosition = weight =>
        padding.top + ((maxWeight - weight) / (maxWeight - minWeight)) * chartHeight;

    chartContext.font = "10px Inter, sans-serif";
    chartContext.textAlign = "right";
    chartContext.textBaseline = "middle";

    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        const value = maxWeight - ((maxWeight - minWeight) / 4) * i;

        chartContext.beginPath();
        chartContext.strokeStyle = "#f0ddd2";
        chartContext.moveTo(padding.left, y);
        chartContext.lineTo(width - padding.right, y);
        chartContext.stroke();

        chartContext.fillStyle = "#98766a";
        chartContext.fillText(value.toFixed(1), padding.left - 7, y);
    }

    chartContext.textAlign = "center";
    chartContext.textBaseline = "top";
    chartContext.fillStyle = "#98766a";

    records.forEach((record, index) => {
        if (records.length <= 5 || index === 0 || index === records.length - 1) {
            const [year, month] = record.date.split("-");
            chartContext.fillText(`${month}/${year.slice(-2)}`, xPosition(index),
                height - padding.bottom + 12);
        }
    });

    chartContext.beginPath();
    records.forEach((record, index) => {
        const x = xPosition(index);
        const y = yPosition(record.weight);
        if (index === 0) chartContext.moveTo(x, y);
        else chartContext.lineTo(x, y);
    });

    chartContext.lineTo(xPosition(records.length - 1), padding.top + chartHeight);
    chartContext.lineTo(xPosition(0), padding.top + chartHeight);
    chartContext.closePath();
    chartContext.fillStyle = "rgba(183, 127, 120, 0.13)";
    chartContext.fill();

    chartContext.beginPath();
    records.forEach((record, index) => {
        const x = xPosition(index);
        const y = yPosition(record.weight);
        if (index === 0) chartContext.moveTo(x, y);
        else chartContext.lineTo(x, y);
    });

    chartContext.strokeStyle = "#b77f78";
    chartContext.lineWidth = 2.5;
    chartContext.lineJoin = "round";
    chartContext.lineCap = "round";
    chartContext.stroke();

    records.forEach((record, index) => {
        chartContext.beginPath();
        chartContext.arc(xPosition(index), yPosition(record.weight), 4, 0, Math.PI * 2);
        chartContext.fillStyle = "#fff9f4";
        chartContext.fill();
        chartContext.strokeStyle = "#b77f78";
        chartContext.lineWidth = 2;
        chartContext.stroke();
    });
}

function renderWeightPage() {
    const records = getSortedRecords(selectedPet);

    if (!records.length) {
        latestWeightElement.textContent = "—";
        weightChangeElement.textContent = "No records yet";
        drawWeightChart(records);
        return;
    }

    const latest = records[records.length - 1];
    latestWeightElement.textContent = Number(latest.weight).toFixed(1);

    if (records.length > 1) {
        const previous = records[records.length - 2];
        const difference = Number(latest.weight) - Number(previous.weight);
        const amount = Math.abs(difference).toFixed(1);

        weightChangeElement.textContent = difference > 0
            ? `+${amount} kg`
            : difference < 0
                ? `−${amount} kg`
                : "No change";
    } else {
        weightChangeElement.textContent = "First record";
    }

    pets[selectedPet].weight = Number(latest.weight);
    savePets();
    drawWeightChart(records);
}

weightForm.addEventListener("submit", event => {
    event.preventDefault();

    const date = dateInput.value;
    const weight = Number(weightInput.value);

    if (!date || !Number.isFinite(weight) || weight <= 0) {
        messageElement.textContent = "Please enter a valid date and weight.";
        return;
    }

    if (date > getTodayString()) {
        messageElement.textContent = "Choose today or an earlier date.";
        return;
    }

    const records = pets[selectedPet].weights;
    const existing = records.find(record => record.date === date);

    if (existing) {
        if (!confirm("A record already exists for this date. Replace it?")) return;
        existing.weight = weight;
    } else {
        records.push({ date, weight });
    }

    pets[selectedPet].weight = weight;
    savePets();
    renderWeightPage();

    messageElement.textContent = "Weight record saved successfully.";
    weightForm.reset();
    dateInput.value = getTodayString();
    dateInput.max = getTodayString();
});

window.addEventListener("resize", renderWeightPage);

window.addEventListener("storage", event => {
    if (event.key === STORAGE_KEY) {
        pets = loadPets();
        renderWeightPage();
    }
});

petSearch.value = selectedPet;
renderWeightPage();