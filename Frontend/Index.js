// Index.js - landing page: fade the cards in as they scroll into view

// tells the CSS that JS is running (so the fade-in is safe to use)
document.body.classList.add("js-ready");

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("show");
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach(element => observer.observe(element));
