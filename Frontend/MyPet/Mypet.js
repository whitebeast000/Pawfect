const pets = [
    {
        name: "Bella",
        breed: "Golden Retriever",
        details: "Age: 2 years · Weight: 24 kg",
        status: "Healthy",
        image: "../Images/avatar.jpg",
        profileUrl: "#"
    },
    {
        name: "Luna",
        breed: "Persian Cat",
        details: "Age: 1 year · Weight: 4 kg",
        status: "Healthy",
        image: "../Images/avatar.jpg",
        profileUrl: "#"
    },
    {
        name: "Max",
        breed: "Beagle",
        details: "Age: 3 years · Weight: 12 kg",
        status: "Healthy",
        image: "../Images/avatar.jpg",
        profileUrl: "#"
    }
];

const petsContainer = document.getElementById("pets-container");
const petTemplate = document.getElementById("pet-template");

function renderPets(list) {
    petsContainer.innerHTML = "";

    list.forEach(function (pet) {
        const card = petTemplate.content.cloneNode(true);

        const image = card.querySelector(".pet-image");
        image.src = pet.image;
        image.alt = pet.name;

        card.querySelector(".pet-name").textContent = pet.name;
        card.querySelector(".pet-breed").textContent = pet.breed;
        card.querySelector(".pet-status").textContent = pet.status;
        card.querySelector(".pet-details").textContent = pet.details;
        card.querySelector(".view-profile").href = pet.profileUrl;

        petsContainer.appendChild(card);
    });
}

renderPets(pets);