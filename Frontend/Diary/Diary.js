const PetDiary = [
    {

        image:"../Images/nav_bottom.jfif",
        date: "4 October 2026",
        title: "Max learned a new trick!",
        description: "He finally learned to shake paws today.",
        mood: "Happy"
    },

    {
        
        image:"../Images/nav_bottom.jfif",
        date: "20 September 2026",
        title: "First visit to the park",
        description: "Luna watched the birds all afternoon.",
        mood: "Excited"
    },

    {

        image:"../Images/nav_bottom.jfif",
        date: "2 September 2026",
        title: "Grooming day",
        description: "Coco was calm the whole time.",
        mood: "Relaxed"
    },

    {

        image:"../Images/nav_bottom.jfif",
        date: "2 September 2026",
        title: "Grooming day",
        description: "Coco was calm the whole time.",
        mood: "Relaxed"
    },

    {

        image:"../Images/nav_bottom.jfif",
        date: "2 September 2026",
        title: "Grooming day",
        description: "Coco was calm the whole time.",
        mood: "Relaxed"
    },

    {

        image:"../Images/nav_bottom.jfif",
        date: "2 September 2026",
        title: "Grooming day",
        description: "Coco was calm the whole time.",
        mood: "Relaxed"
    }
];

const container = document.getElementById("pet-diary-container");
const template = document.getElementById("pet-diary-template");


PetDiary.forEach(PetDiary => {
    const card = template.content.cloneNode(true);

    
    card.querySelector(".pet-diary-image").src = PetDiary.image;
    card.querySelector(".pet-diary-category").textContent = PetDiary.mood;
    card.querySelector(".pet-diary-title").textContent = PetDiary.title;
    card.querySelector(".pet-diary-description").textContent = PetDiary.description;
    card.querySelector(".pet-diary-image").alt = PetDiary.title;
    card.querySelector(".pet-diary-date").textContent = PetDiary.date;

    container.appendChild(card);
});


