const articles=[
    {
        category:"Dogs",
        title:"How often should dogs be vaccinated?",
        description:"A simple schedule from puppyhood to senior years",
        image:"../Images/nav_bottom.jfif",
        link:"#"
    },
    
    {
        category:"Cats",
        title:"Basic grooming guide",
        description:"Brushing, bathing and nail care made easy",
        image:"../Images/nav_bottom.jfif",

        link:"#"
    },
    {
        category:"All",
        title:"Signs your pet needs a vet",
        description:"Seven behaviours you shouldn't ignore ",
        image:"../Images/nav_bottom.jfif",
        link:"#"
    },
    
]


const container = document.getElementById("articles-container")
const template = document.getElementById("article-template")


articles.forEach(article => {
    const card = template.content.cloneNode(true);
    
    card.querySelector(".article-category").textContent = article.category;
    card.querySelector(".article-title").textContent = article.title;
    card.querySelector(".article-description").textContent = article.description;
    card.querySelector(".article-image").src = article.image;
    card.querySelector(".article-image").alt = article.title;
    card.querySelector(".read-more").href = article.link;

    container.appendChild(card);
});


