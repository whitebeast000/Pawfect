// Articles.js - list articles, add / edit them in a popup, publish or delete

const articlesBody = document.getElementById("articlesBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

const modal = document.getElementById("articleModal");
const modalTitle = document.getElementById("modalTitle");
const titleInput = document.getElementById("titleInput");
const categoryInput = document.getElementById("categoryInput");
const summaryInput = document.getElementById("summaryInput");
const statusInput = document.getElementById("statusInput");

let editingId = null; // null means we're adding a new article

function renderArticles() {
  const term = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  const articles = AdminData.articles.filter(article => {
    const matchesText = article.title.toLowerCase().includes(term) || article.author.toLowerCase().includes(term);
    const matchesStatus = status === "all" || article.status === status;
    return matchesText && matchesStatus;
  });

  if (articles.length === 0) {
    articlesBody.innerHTML = `<tr><td colspan="6" class="empty">No articles found.</td></tr>`;
    return;
  }

  articlesBody.innerHTML = articles.map(article => {
    const isPublished = article.status === "published";
    return `
      <tr>
        <td>
          <div class="cell-main">${escapeHtml(article.title)}</div>
          <div class="cell-sub">${escapeHtml(article.summary)}</div>
        </td>
        <td>${article.category}</td>
        <td>${escapeHtml(article.author)}</td>
        <td>${formatDate(article.published_on)}</td>
        <td>${statusBadge(isPublished ? "Published" : "Draft", isPublished ? "green" : "grey")}</td>
        <td><div class="row-actions">
          <button class="btn btn-outline btn-small" data-action="edit" data-id="${article.id}">Edit</button>
          <button class="btn btn-outline btn-small" data-action="publish" data-id="${article.id}">${isPublished ? "Unpublish" : "Publish"}</button>
          <button class="btn btn-danger btn-small" data-action="delete" data-id="${article.id}">Delete</button>
        </div></td>
      </tr>`;
  }).join("");
}

function openModal(article) {
  editingId = article ? article.id : null;
  modalTitle.textContent = article ? "Edit article" : "New article";
  titleInput.value = article ? article.title : "";
  categoryInput.value = article ? article.category : "All";
  summaryInput.value = article ? article.summary : "";
  statusInput.value = article ? article.status : "draft";
  modal.classList.add("open");
}

function closeModal() {
  modal.classList.remove("open");
}

function saveArticle() {
  const title = titleInput.value.trim();
  if (title === "") {
    alert("Please give the article a title.");
    return;
  }

  const status = statusInput.value;

  if (editingId === null) {
    const nextId = AdminData.articles.reduce((max, a) => Math.max(max, a.id), 0) + 1;
    AdminData.articles.unshift({
      id: nextId,
      title: title,
      category: categoryInput.value,
      summary: summaryInput.value.trim(),
      author: "Admin",
      status: status,
      published_on: status === "published" ? new Date().toISOString().slice(0, 10) : null
    });
  } else {
    const article = AdminData.articles.find(a => a.id === editingId);
    article.title = title;
    article.category = categoryInput.value;
    article.summary = summaryInput.value.trim();
    setStatus(article, status);
  }

  closeModal();
  renderArticles();
}

// keeps published_on in step with the status
function setStatus(article, status) {
  if (status === "published" && !article.published_on) {
    article.published_on = new Date().toISOString().slice(0, 10);
  }
  article.status = status;
}

articlesBody.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const article = AdminData.articles.find(a => a.id === Number(button.dataset.id));

  if (button.dataset.action === "edit") {
    openModal(article);
    return;
  }

  if (button.dataset.action === "publish") {
    setStatus(article, article.status === "published" ? "draft" : "published");
  }

  if (button.dataset.action === "delete") {
    if (!confirmAction(`Delete "${article.title}"?`)) return;
    AdminData.articles = AdminData.articles.filter(a => a.id !== article.id);
  }

  renderArticles();
});

document.getElementById("newArticleBtn").addEventListener("click", () => openModal(null));
document.getElementById("saveArticleBtn").addEventListener("click", saveArticle);
document.getElementById("cancelArticleBtn").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });

searchInput.addEventListener("input", renderArticles);
statusFilter.addEventListener("change", renderArticles);
renderArticles();
