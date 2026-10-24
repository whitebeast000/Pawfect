/* =========================================================
   PawCare – Daily Care (all pages)
   Pages: DailyCare.html, AddTask.html (add + edit + delete)

   How "done" works: each task remembers the date it was last ticked.
   A task counts as done only if that date is today, so every task
   automatically resets to "not done" on the next day.

   Data is saved in the browser (localStorage). To use a real API later,
   only load() and save() below need to be replaced with fetch() calls.
   ========================================================= */
(function () {
  "use strict";

  var KEY = "pawfect_care_tasks";
  var CATEGORIES = [
    { key: "feeding",  label: "Feeding"  },
    { key: "activity", label: "Activity" },
    { key: "health",   label: "Health"   }
  ];

  /* ---------- Helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function formatTime(t) {
    var p = t.split(":").map(Number);
    return (p[0] % 12 || 12) + ":" + pad(p[1]) + " " + (p[0] >= 12 ? "PM" : "AM");
  }
  function makeId() {
    return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function categoryLabel(key) {
    return CATEGORIES.filter(function (c) { return c.key === key; })[0].label;
  }
  function isDone(t) { return t.doneDate === today(); }
  function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }

  /* ---------- Storage (replace with API later) ---------- */
  var memory = null;   // used only if the browser blocks localStorage

  function seed() {
    var d = today();
    return [
      { id: "t1", name: "Breakfast",    category: "feeding",  pet: "", time: "08:00", doneDate: d  },
      { id: "t2", name: "Lunch",        category: "feeding",  pet: "", time: "13:00", doneDate: d  },
      { id: "t3", name: "Dinner",       category: "feeding",  pet: "", time: "19:00", doneDate: "" },
      { id: "t4", name: "Treat",        category: "feeding",  pet: "", time: "21:00", doneDate: "" },
      { id: "t5", name: "Morning walk", category: "activity", pet: "", time: "07:00", doneDate: d  },
      { id: "t6", name: "Park play",    category: "activity", pet: "", time: "17:00", doneDate: "" },
      { id: "t7", name: "Training",     category: "activity", pet: "", time: "18:00", doneDate: "" },
      { id: "t8", name: "Water refill", category: "health",   pet: "", time: "15:00", doneDate: d  },
      { id: "t9", name: "Medicine",     category: "health",   pet: "", time: "20:00", doneDate: "" }
    ];
  }
  function save(list) {
    memory = list;
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    if (memory) return memory;
    var s = seed();
    save(s);
    return s;
  }
  function findById(id) {
    return load().filter(function (t) { return t.id === id; })[0];
  }

  var params = new URLSearchParams(window.location.search);

  /* =========================================================
     PAGE 1: Daily care (three cards)
     ========================================================= */
  function initCare() {
    var grid = $("careGrid");
    var noticeEl = $("notice");

    // Notice after coming back from the Add / Edit page
    var notices = {
      added:   "Task added.",
      updated: "Task updated.",
      deleted: "Task deleted."
    };
    var msg = params.get("msg");
    if (msg && notices[msg]) {
      noticeEl.textContent = notices[msg];
      noticeEl.hidden = false;
      window.history.replaceState(null, "", "DailyCare.html");
    }

    function tasksOf(key) {
      return load()
        .filter(function (t) { return t.category === key; })
        .sort(function (a, b) { return a.time < b.time ? -1 : a.time > b.time ? 1 : 0; });
    }

    function updateProgress(key) {
      var tasks = tasksOf(key);
      var done = tasks.filter(isDone).length;
      var pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
      var card = grid.querySelector('[data-cat="' + key + '"]');
      if (!card) return;
      card.querySelector(".progress-bar").style.width = pct + "%";
      var bar = card.querySelector(".progress");
      bar.setAttribute("aria-valuemax", tasks.length);
      bar.setAttribute("aria-valuenow", done);
      bar.setAttribute("aria-label", done + " of " + tasks.length + " done");
    }

    function buildTask(t) {
      var li = el("li", "task");

      var label = el("label", "task-main");
      var input = el("input");
      input.type = "checkbox";
      input.checked = isDone(t);
      input.setAttribute("data-id", t.id);
      label.appendChild(input);
      label.appendChild(el("span", "check"));

      var name = el("span", "task-name", t.name);
      if (t.pet) name.appendChild(el("span", "task-pet", " · " + t.pet));
      label.appendChild(name);
      li.appendChild(label);

      li.appendChild(el("time", "task-time", formatTime(t.time)));

      var edit = el("a", "task-edit");
      edit.href = "AddTask.html?id=" + encodeURIComponent(t.id);
      edit.setAttribute("aria-label", "Edit " + t.name);
      edit.title = "Edit task";
      edit.appendChild(el("i", "bi bi-pencil"));
      li.appendChild(edit);
      return li;
    }

    function buildCard(cat) {
      var card = el("article", "card");
      card.setAttribute("data-cat", cat.key);
      card.appendChild(el("h2", "card-title", cat.label));

      var progress = el("div", "progress");
      progress.setAttribute("role", "progressbar");
      progress.setAttribute("aria-valuemin", "0");
      progress.appendChild(el("div", "progress-bar"));
      card.appendChild(progress);

      var list = el("ul", "task-list");
      var tasks = tasksOf(cat.key);
      if (!tasks.length) {
        var empty = el("li", "task-empty", "No tasks yet. ");
        var add = el("a", null, "Add one");
        add.href = "AddTask.html?category=" + cat.key;
        empty.appendChild(add);
        list.appendChild(empty);
      } else {
        tasks.forEach(function (t) { list.appendChild(buildTask(t)); });
      }
      card.appendChild(list);
      return card;
    }

    // Progress ring + message under the three cards
    var RING = 2 * Math.PI * 44;            // circle length (r = 44)
    function updateBanner(animate) {
      var bar = $("ringBar");
      if (!bar) return;
      var tasks = load();
      var total = tasks.length;
      var done = tasks.filter(isDone).length;
      var left = total - done;
      var pct = total ? done / total : 0;

      bar.style.strokeDasharray = RING;
      bar.style.strokeDashoffset = RING * (1 - pct);

      var ringText = $("ringText");
      ringText.textContent = done + "/" + total;
      ringText.appendChild(el("small", null, "done"));

      var next = tasks.filter(function (t) { return !isDone(t); })
                      .sort(function (a, b) { return a.time < b.time ? -1 : a.time > b.time ? 1 : 0; })[0];
      var title, sub;
      if (!total) {
        title = "No tasks yet";
        sub = "Add a task to start building your pet’s routine.";
      } else if (!left) {
        title = "All done. Great job!";
        sub = "Every task is finished for today. Your pets are happy.";
      } else {
        title = done === 0 ? "Let’s get started" : pct < 0.5 ? "Nice start!" : "Almost there!";
        sub = plural(left, "task") + " left today. Next up: " + next.name + " at " + formatTime(next.time) + ".";
      }
      $("bannerTitle").textContent = title;
      $("bannerSub").textContent = sub;
    }

    function render() {
      grid.innerHTML = "";
      CATEGORIES.forEach(function (cat) {
        grid.appendChild(buildCard(cat));
        updateProgress(cat.key);
      });
      // first paint starts the ring empty, so it fills with an animation
      var bar = $("ringBar");
      if (bar) {
        bar.style.strokeDasharray = 2 * Math.PI * 44;
        bar.style.strokeDashoffset = 2 * Math.PI * 44;
      }
      setTimeout(updateBanner, 150);
    }

    // Tick / untick a task (no full re-render, so keyboard focus stays)
    grid.addEventListener("change", function (e) {
      var box = e.target;
      if (!box.matches('input[type="checkbox"]')) return;
      var id = box.getAttribute("data-id");
      var category = "";

      save(load().map(function (t) {
        if (t.id !== id) return t;
        category = t.category;
        return Object.assign({}, t, { doneDate: box.checked ? today() : "" });
      }));
      if (category) updateProgress(category);
      updateBanner();
    });

    render();
  }

  /* =========================================================
     PAGE 2: Add task / Edit task
     ========================================================= */
  function initTask() {
    var id = params.get("id");
    var editing = null;

    function showMessage(text, isError) {
      var m = $("formMessage");
      m.textContent = text;
      m.classList.toggle("is-error", !!isError);
    }

    if (id) {
      editing = findById(id);
      if (!editing) {
        var card = $("formCard");
        card.innerHTML = "";
        card.appendChild(el("p", "task-empty", "This task could not be found."));
        var back = el("a", "btn-book", "Back to daily care");
        back.href = "DailyCare.html";
        card.appendChild(back);
        return;
      }
      $("pageTitle").textContent = "Edit task";
      $("pageSub").textContent = "Update the details or remove this task.";
      $("formTitle").textContent = "Task details";
      $("saveBtn").textContent = "Save changes";
      $("deleteBtn").hidden = false;

      $("name").value = editing.name;
      $("category").value = editing.category;
      $("pet").value = editing.pet || "";
      $("time").value = editing.time;
    } else {
      // "Add one" links can pre-select the category
      var cat = params.get("category");
      if (CATEGORIES.some(function (c) { return c.key === cat; })) {
        $("category").value = cat;
      }
    }

    // Side panel: photo caption and "where it fits in the day" timeline
    var CAPTIONS = { feeding: "Yum time!", activity: "Walkies?", health: "Health check!" };
    function updateAside() {
      var caption = $("picCaption");
      if (!caption) return;
      caption.textContent = CAPTIONS[$("category").value] || "What’s the plan?";

      var marker = $("dayMarker");
      var t = $("time").value;
      if (!t) {
        marker.classList.remove("is-on");
        $("dayPart").textContent = "Pick a time to see where it lands.";
        return;
      }
      var parts = t.split(":").map(Number);
      var minutes = parts[0] * 60 + parts[1];
      marker.style.left = (minutes / 1440 * 100) + "%";
      $("dayMarkerText").textContent = formatTime(t);
      marker.classList.add("is-on");

      var h = parts[0];
      var part = h >= 5 && h < 12 ? "Morning" : h >= 12 && h < 17 ? "Afternoon" : h >= 17 && h < 21 ? "Evening" : "Night-time";
      $("dayPart").textContent = part + " routine";
    }
    $("time").addEventListener("input", updateAside);
    $("category").addEventListener("change", updateAside);
    updateAside();

    $("taskForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = {
        name: $("name").value.trim(),
        category: $("category").value,
        pet: $("pet").value,
        time: $("time").value
      };

      if (!v.name) return showMessage("Please enter a task name.", true);
      if (v.name.length > 40) return showMessage("Task name is too long (max 40 characters).", true);
      if (!v.category) return showMessage("Please select a category.", true);
      if (!v.time) return showMessage("Please choose a time.", true);

      var duplicate = load().some(function (t) {
        return (!editing || t.id !== editing.id) &&
               t.name.toLowerCase() === v.name.toLowerCase() &&
               t.category === v.category && t.pet === v.pet && t.time === v.time;
      });
      if (duplicate) return showMessage("This task already exists at that time.", true);

      if (editing) {
        save(load().map(function (t) {
          return t.id === editing.id ? Object.assign({}, t, v) : t;
        }));
        window.location.href = "DailyCare.html?msg=updated";
      } else {
        var list = load();
        list.push({ id: makeId(), name: v.name, category: v.category,
                    pet: v.pet, time: v.time, doneDate: "" });
        save(list);
        window.location.href = "DailyCare.html?msg=added";
      }
    });

    $("deleteBtn").addEventListener("click", function () {
      if (!editing) return;
      if (!window.confirm("Delete this task? This cannot be undone.")) return;
      save(load().filter(function (t) { return t.id !== editing.id; }));
      window.location.href = "DailyCare.html?msg=deleted";
    });
  }

  /* ---------- Start ---------- */
  // Detect the page by what is on it (works even without data-page on <body>)
  if ($("careGrid")) initCare();
  else if ($("taskForm")) initTask();
})();
