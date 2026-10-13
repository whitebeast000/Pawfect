const articles = [
{
id: 1,
category: "Dogs",
title: "How often should dogs be vaccinated?",
description: "A simple schedule from puppyhood to senior years",
image: "../Images/nav_bottom.jfif",
content: ` <h3>Why Are Vaccinations Important?</h3> <p>Vaccinations protect dogs from dangerous diseases and help them live healthier lives.</p>,

         <h3>When Should Dogs Be Vaccinated?</h3>,
         <p>Puppies usually begin their vaccination schedule at around 6–8 weeks of age. Further doses are given according to the veterinarian's recommended schedule.</p>
         <h3>What Should You Do?</h3>
         <p>Consult your veterinarian to determine which vaccines your dog needs and when booster doses are required.</p>
     `
// },
},
{
    id: 2,
    category: "Cats",
    title: "Basic grooming guide",
    description: "Brushing, bathing and nail care made easy",
    image: "../Images/nav_bottom.jfif",
    content: `
        <h3>Why Is Grooming Important?</h3>
        <p>Regular grooming helps keep your cat's coat clean and allows you to notice skin problems early.</p>

        <h3>Brushing Your Cat</h3>
        <p>Brush your cat regularly to remove loose fur and reduce tangles. The frequency depends on its coat type.</p>

        <h3>Nail Care</h3>
        <p>Check your cat's nails regularly and trim them carefully when needed. Ask a veterinarian for guidance if you are unsure.</p>

        <h3>Bathing</h3>
        <p>Most cats do not need frequent baths. Use appropriate products and seek veterinary advice when necessary.</p>
    `
},

{
    id: 3,
    category: "All",
    title: "Signs your pet needs a vet",
    description: "Seven behaviours you shouldn't ignore",
    image: "../Images/nav_bottom.jfif",
    content: `
        <h3>1. Loss of Appetite</h3>
        <p>A sudden refusal to eat can indicate an underlying health problem.</p>

        <h3>2. Unusual Tiredness</h3>
        <p>If your pet becomes unusually weak or inactive, pay attention to its condition.</p>

        <h3>3. Vomiting or Diarrhea</h3>
        <p>Repeated vomiting or diarrhea may require veterinary attention.</p>

        <h3>4. Difficulty Breathing</h3>
        <p>Breathing difficulties require immediate veterinary care.</p>

        <h3>5. Changes in Drinking or Urination</h3>
        <p>Unusual increases or decreases may indicate a health problem.</p>

        <h3>6. Unusual Behaviour</h3>
        <p>Sudden aggression, confusion, or hiding may indicate pain or illness.</p>

        <h3>7. Difficulty Walking</h3>
        <p>Limping or difficulty standing should not be ignored.</p>

        <h3>When to Visit a Vet</h3>
        <p>Contact a veterinarian if you notice concerning symptoms. Seek urgent care for breathing difficulties, collapse, or other severe symptoms.</p>
    `
}

];

const container = document.getElementById("articles-container");
const template = document.getElementById("article-template");

articles.forEach(article => {


const card = template.content.cloneNode(true);

card.querySelector(".article-category").textContent = article.category;
card.querySelector(".article-title").textContent = article.title;
card.querySelector(".article-description").textContent = article.description;

const image = card.querySelector(".article-image");
image.src = article.image;
image.alt = article.title;

const link = `Article_details/ArticleDetails.html?id=${article.id}`;
card.querySelector(".read-more").href = link;

// Make the entire article card clickable
const articleCard = card.querySelector(".article-card");

if (articleCard) {
    articleCard.style.cursor = "pointer";

    articleCard.addEventListener("click", (event) => {

        // Avoid interfering with links and buttons
        if (event.target.closest("a, button")) {
            return;
        }

        window.location.href = link;
    });
}

container.appendChild(card);
});

