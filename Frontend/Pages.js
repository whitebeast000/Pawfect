/* =========================================================
   PawCare – shared script for these pages:
     MyPet/MyPet.html            Health/Health.html + AddRecord.html
     Diary/Diary.html + NewEntry.html
     Articles/Articles.html + Article.html
     Profile/Profile.html        Login/Login.html

   Put this file in Frontend/ (next to navbar.css). Each page finds its
   own part of the script by looking at what is on the page.

   Data is saved in the browser (localStorage). To use a real API later,
   only read() and write() below need to be replaced with fetch() calls.
   ========================================================= */
(function () {
  "use strict";

  var PETS_KEY = "pawfect_pets";
  var HEALTH_KEY = "pawfect_health";
  var DIARY_KEY = "pawfect_diary";
  var PROFILE_KEY = "pawfect_profile";
  var APPTS_KEY = "pawfect_appointments";
  var REMINDERS_KEY = "pawfect_reminders";
  var USER_KEY = "pawfect_user_name";
  var DASHBOARD = "../Dashboard/Dashboard.html";
  var LOGIN = "../Login/Login.html";

  var SPECIES_EMOJI = { Dog: "🐶", Cat: "🐱", Rabbit: "🐰", Bird: "🐦", Other: "🐾" };
  var HEALTH_TYPES = [
    { key: "vaccination", label: "Vaccination", icon: "+", badge: "badge badge--ok" },
    { key: "checkup",     label: "Checkup",     icon: "◷", badge: "badge badge--ok" },
    { key: "medication",  label: "Medication",  icon: "•", badge: "badge badge--soon" },
    { key: "allergy",     label: "Allergy",     icon: "!", badge: "badge badge--overdue" },
    { key: "other",       label: "Other",       icon: "✓", badge: "badge badge--soon" }
  ];
  var MOODS = [
    { key: "happy",   emoji: "😊", label: "Happy" },
    { key: "calm",    emoji: "😌", label: "Calm" },
    { key: "playful", emoji: "🎾", label: "Playful" },
    { key: "tired",   emoji: "😴", label: "Tired" },
    { key: "unwell",  emoji: "🤒", label: "Unwell" }
  ];

  /* ---------- Helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function toISODate(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function today() { return toISODate(new Date()); }
  function addDays(n) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    return toISODate(d);
  }
  function formatDate(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    var opts = { day: "numeric", month: "short" };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
    return d.toLocaleDateString("en-GB", opts);
  }
  function formatTime(t) {
    var p = t.split(":").map(Number);
    return (p[0] % 12 || 12) + ":" + pad(p[1]) + " " + (p[0] >= 12 ? "PM" : "AM");
  }
  function makeId(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function find(list, id) {
    return list.filter(function (x) { return x.id === id; })[0];
  }
  function typeOf(key) {
    return HEALTH_TYPES.filter(function (t) { return t.key === key; })[0] || HEALTH_TYPES[4];
  }
  function moodOf(key) {
    return MOODS.filter(function (m) { return m.key === key; })[0];
  }

  var params = new URLSearchParams(window.location.search);

  function showMessage(text, isError) {
    var m = $("formMessage");
    if (!m) return;
    m.textContent = text;
    m.classList.toggle("is-error", !!isError);
  }

  // Green banner after coming back from an Add / Edit page
  function showNotice(map) {
    var msg = params.get("msg");
    var box = $("notice");
    if (!box || !msg || !map[msg]) return;
    box.textContent = map[msg];
    box.hidden = false;
    window.history.replaceState(null, "", window.location.pathname);
  }

  /* ---------- Storage (replace with API later) ---------- */
  var memory = {};   // used only if the browser blocks localStorage

  function write(key, value) {
    memory[key] = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function read(key, seedFn) {
    try {
      var raw = localStorage.getItem(key);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    if (memory[key]) return memory[key];
    var s = seedFn();
    write(key, s);
    return s;
  }
  // read data owned by another page without creating sample data
  function peek(key) {
    try {
      var parsed = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return [];
  }
  function getProfile() {
    try {
      var p = JSON.parse(localStorage.getItem(PROFILE_KEY));
      if (p && typeof p === "object" && !Array.isArray(p)) return p;
    } catch (e) {}
    return null;
  }

  function seedPets() {
    return [
      { id: "p1", name: "Max",  species: "Dog",    breed: "Golden Retriever" },
      { id: "p2", name: "Luna", species: "Cat",    breed: "Persian Cat" },
      { id: "p3", name: "Coco", species: "Rabbit", breed: "Holland Lop" }
    ];
  }
  function seedHealth() {
    return [
      { id: "h1", pet: "Max",  type: "vaccination", title: "Rabies",          date: addDays(-120), notes: "Annual booster" },
      { id: "h2", pet: "Max",  type: "vaccination", title: "DHPP",            date: addDays(-200), notes: "" },
      { id: "h3", pet: "Luna", type: "vaccination", title: "FVRCP",           date: addDays(-150), notes: "" },
      { id: "h4", pet: "Luna", type: "checkup",     title: "Annual checkup",  date: addDays(-60),  notes: "All good, weight stable" },
      { id: "h5", pet: "Coco", type: "vaccination", title: "Myxomatosis",     date: addDays(-90),  notes: "" },
      { id: "h6", pet: "Max",  type: "medication",  title: "Flea & tick",     date: addDays(-20),  notes: "Monthly treatment" }
    ];
  }
  function seedDiary() {
    return [
      { id: "d1", date: addDays(-1), title: "First walk in the new park", pet: "Max",  mood: "happy",
        text: "Max met three new dogs and did not want to leave. He slept the whole evening afterwards." },
      { id: "d2", date: addDays(-3), title: "Luna’s new favourite spot", pet: "Luna", mood: "calm",
        text: "Luna has claimed the window seat. She watches the birds for hours and purrs when the sun hits her fur." },
      { id: "d3", date: addDays(-6), title: "Coco tried a new vegetable", pet: "Coco", mood: "playful",
        text: "Fresh coriander was a big hit. Lots of binkies around the living room afterwards." }
    ];
  }
  function getPets()   { return read(PETS_KEY, seedPets); }
  function getHealth() { return read(HEALTH_KEY, seedHealth); }
  function getDiary()  { return read(DIARY_KEY, seedDiary); }

  function fillPetSelect(select, pets, firstOption) {
    select.innerHTML = "";
    var first = el("option", null, firstOption.label);
    first.value = firstOption.value;
    if (firstOption.disabled) { first.disabled = true; first.selected = true; }
    select.appendChild(first);
    pets.forEach(function (p) {
      var o = el("option", null, p.name);
      o.value = p.name;
      select.appendChild(o);
    });
  }

  /* =========================================================
     MY PETS
     ========================================================= */
  function initMyPets() {
    showNotice({ petadded: "Pet added.", petupdated: "Pet updated.", petdeleted: "Pet deleted." });

    var grid = $("petsGrid");
    var pets = getPets();
    var appts = peek(APPTS_KEY);
    var reminders = peek(REMINDERS_KEY);
    var health = getHealth();
    var now = new Date();

    grid.innerHTML = "";
    pets.forEach(function (p) {
      var next = appts.filter(function (a) {
        return a.pet === p.name && (a.status || "scheduled") === "scheduled" &&
               new Date(a.date + "T" + a.time) > now;
      }).sort(function (a, b) {
        return (a.date + a.time) < (b.date + b.time) ? -1 : 1;
      })[0];
      var openReminders = reminders.filter(function (r) {
        return (r.pet === p.name || r.pet === "") && !r.done;
      }).length;
      var records = health.filter(function (h) { return h.pet === p.name; }).length;

      var card = el("article", "card pet-card");
      var top = el("div", "pet-card-top");
      top.appendChild(el("span", "pet-avatar-lg", SPECIES_EMOJI[p.species] || SPECIES_EMOJI.Other));
      var who = el("div");
      who.appendChild(el("h2", "pet-card-name", p.name));
      who.appendChild(el("p", "pet-card-sub", p.breed ? p.species + " · " + p.breed : p.species));
      top.appendChild(who);
      card.appendChild(top);

      var facts = el("ul", "pet-facts");
      [["Next visit", next ? formatDate(next.date) + " · " + formatTime(next.time) : "None booked"],
       ["Open reminders", String(openReminders)],
       ["Health records", String(records)]].forEach(function (f) {
        var li = el("li");
        li.appendChild(el("span", null, f[0]));
        li.appendChild(el("strong", null, f[1]));
        facts.appendChild(li);
      });
      card.appendChild(facts);

      var row = el("div", "btn-row");
      var edit = el("a", "btn-outline", "Edit");
      edit.href = "../Dashboard/AddPet.html?from=mypets&id=" + encodeURIComponent(p.id);
      var hl = el("a", "btn-outline", "Health records");
      hl.href = "../Health/Health.html?pet=" + encodeURIComponent(p.name);
      row.appendChild(edit);
      row.appendChild(hl);
      card.appendChild(row);
      grid.appendChild(card);
    });

    var add = el("a", "card pet-card pet-card--add");
    add.href = "../Dashboard/AddPet.html?from=mypets";
    add.appendChild(el("span", "pet-avatar-lg pet-avatar-lg--add", "+"));
    add.appendChild(el("span", "pet-card-name", "Add pet"));
    grid.appendChild(add);
  }

  /* =========================================================
     HEALTH (list)
     ========================================================= */
  function initHealthList() {
    showNotice({ added: "Record added.", updated: "Record updated.", deleted: "Record deleted." });

    var pets = getPets();
    var filter = params.get("pet") || "all";
    if (filter !== "all" && !pets.some(function (p) { return p.name === filter; })) filter = "all";

    var chipsBox = $("petChips");
    var list = $("healthList");
    var addBtn = $("addRecordBtn");

    function render() {
      // chips
      chipsBox.innerHTML = "";
      [{ value: "all", label: "All pets" }].concat(pets.map(function (p) {
        return { value: p.name, label: p.name };
      })).forEach(function (c) {
        var b = el("button", "chip" + (c.value === filter ? " is-active" : ""), c.label);
        b.type = "button";
        b.setAttribute("data-pet", c.value);
        b.setAttribute("aria-pressed", c.value === filter ? "true" : "false");
        chipsBox.appendChild(b);
      });

      addBtn.href = "AddRecord.html" + (filter !== "all" ? "?pet=" + encodeURIComponent(filter) : "");

      // records
      var records = getHealth().filter(function (h) {
        return filter === "all" || h.pet === filter;
      }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });

      $("healthSummary").textContent = records.length === 1 ? "1 record" : records.length + " records";

      list.innerHTML = "";
      if (!records.length) {
        var empty = el("li", "list-empty", "No health records yet. ");
        var a = el("a", null, "Add one");
        a.href = addBtn.getAttribute("href");
        empty.appendChild(a);
        list.appendChild(empty);
        return;
      }
      records.forEach(function (h) {
        var t = typeOf(h.type);
        var li = el("li", "reminder");
        var link = el("a", "reminder-link");
        link.href = "AddRecord.html?id=" + encodeURIComponent(h.id);
        link.appendChild(el("span", "reminder-icon", t.icon));
        var info = el("div", "reminder-info");
        info.appendChild(el("p", "reminder-title", h.title + " — " + h.pet));
        info.appendChild(el("p", "reminder-sub", formatDate(h.date) + (h.notes ? " · " + h.notes : "")));
        link.appendChild(info);
        link.appendChild(el("span", t.badge, t.label));
        li.appendChild(link);
        list.appendChild(li);
      });
    }

    chipsBox.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-pet]");
      if (!b) return;
      filter = b.getAttribute("data-pet");
      render();
    });

    render();
  }

  /* =========================================================
     HEALTH (add / edit record)
     ========================================================= */
  function initHealthForm() {
    var pets = getPets();
    var editing = null;
    fillPetSelect($("pet"), pets, { value: "", label: "Select pet", disabled: true });
    $("date").max = today();

    if (!pets.length) {
      var card = $("formCard");
      card.innerHTML = "";
      var p = el("p", "list-empty", "Add a pet first, then you can keep health records for them. ");
      var a = el("a", null, "Add a pet");
      a.href = "../Dashboard/AddPet.html?from=mypets";
      p.appendChild(a);
      card.appendChild(p);
      return;
    }

    var id = params.get("id");
    if (id) {
      editing = find(getHealth(), id);
      if (!editing) {
        var c2 = $("formCard");
        c2.innerHTML = "";
        c2.appendChild(el("p", "list-empty", "This record could not be found."));
        var back = el("a", "btn-book", "Back to health");
        back.href = "Health.html";
        c2.appendChild(back);
        return;
      }
      $("pageTitle").textContent = "Edit record";
      $("pageSub").textContent = "Update the details or remove this record.";
      $("saveBtn").textContent = "Save changes";
      $("deleteBtn").hidden = false;
      $("pet").value = editing.pet;
      $("type").value = editing.type;
      $("title").value = editing.title;
      $("date").value = editing.date;
      $("notes").value = editing.notes || "";
    } else {
      var pre = params.get("pet");
      if (pre && pets.some(function (x) { return x.name === pre; })) $("pet").value = pre;
      $("date").value = today();
    }

    $("recordForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = {
        pet: $("pet").value, type: $("type").value, title: $("title").value.trim(),
        date: $("date").value, notes: $("notes").value.trim()
      };
      if (!v.pet) return showMessage("Please select a pet.", true);
      if (!v.type) return showMessage("Please select a type.", true);
      if (!v.title) return showMessage("Please enter a title.", true);
      if (v.title.length > 60) return showMessage("Title is too long (max 60 characters).", true);
      if (!v.date) return showMessage("Please choose a date.", true);
      if (v.date > today()) return showMessage("Health records can’t be in the future. Use Reminders for upcoming care.", true);
      if (v.notes.length > 300) return showMessage("Notes are too long (max 300 characters).", true);

      var list = getHealth();
      if (editing) {
        write(HEALTH_KEY, list.map(function (h) {
          return h.id === editing.id ? Object.assign({}, h, v) : h;
        }));
        window.location.href = "Health.html?msg=updated";
      } else {
        v.id = makeId("h");
        list.push(v);
        write(HEALTH_KEY, list);
        window.location.href = "Health.html?msg=added";
      }
    });

    $("deleteBtn").addEventListener("click", function () {
      if (!editing || !window.confirm("Delete this record? This cannot be undone.")) return;
      write(HEALTH_KEY, getHealth().filter(function (h) { return h.id !== editing.id; }));
      window.location.href = "Health.html?msg=deleted";
    });
  }

  /* =========================================================
     DIARY (list)
     ========================================================= */
  function initDiaryList() {
    showNotice({ added: "Entry added.", updated: "Entry updated.", deleted: "Entry deleted." });
    var list = $("diaryList");
    var search = $("diarySearch");

    function render() {
      var q = search.value.trim().toLowerCase();
      var entries = getDiary().filter(function (d) {
        return !q || (d.title + " " + d.text + " " + (d.pet || "")).toLowerCase().indexOf(q) !== -1;
      }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });

      list.innerHTML = "";
      if (!entries.length) {
        var empty = el("p", "list-empty", q ? "No entries match your search." : "No diary entries yet. ");
        if (!q) {
          var a = el("a", null, "Write your first one");
          a.href = "NewEntry.html";
          empty.appendChild(a);
        }
        list.appendChild(empty);
        return;
      }
      entries.forEach(function (d) {
        var card = el("a", "card entry-card");
        card.href = "NewEntry.html?id=" + encodeURIComponent(d.id);
        var meta = el("div", "entry-meta");
        var m = moodOf(d.mood);
        meta.appendChild(el("span", null, (m ? m.emoji + " " : "") + formatDate(d.date)));
        if (d.pet) meta.appendChild(el("span", "tag", d.pet));
        card.appendChild(meta);
        card.appendChild(el("h2", "entry-title", d.title));
        card.appendChild(el("p", "entry-text", d.text));
        list.appendChild(card);
      });
    }

    search.addEventListener("input", render);
    render();
  }

  /* =========================================================
     DIARY (new / edit entry)
     ========================================================= */
  function initDiaryForm() {
    var pets = getPets();
    var editing = null;
    fillPetSelect($("pet"), pets, { value: "", label: "All pets / general" });
    $("date").max = today();

    var id = params.get("id");
    if (id) {
      editing = find(getDiary(), id);
      if (!editing) {
        var card = $("formCard");
        card.innerHTML = "";
        card.appendChild(el("p", "list-empty", "This entry could not be found."));
        var back = el("a", "btn-book", "Back to diary");
        back.href = "Diary.html";
        card.appendChild(back);
        return;
      }
      $("pageTitle").textContent = "Edit entry";
      $("pageSub").textContent = "Update your note or remove it.";
      $("saveBtn").textContent = "Save changes";
      $("deleteBtn").hidden = false;
      $("title").value = editing.title;
      $("date").value = editing.date;
      $("pet").value = editing.pet || "";
      $("mood").value = editing.mood || "";
      $("text").value = editing.text;
    } else {
      $("date").value = today();
    }

    $("entryForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = {
        title: $("title").value.trim(), date: $("date").value, pet: $("pet").value,
        mood: $("mood").value, text: $("text").value.trim()
      };
      if (!v.title) return showMessage("Please enter a title.", true);
      if (v.title.length > 60) return showMessage("Title is too long (max 60 characters).", true);
      if (!v.date) return showMessage("Please choose a date.", true);
      if (v.date > today()) return showMessage("Diary entries can’t be in the future.", true);
      if (!v.text) return showMessage("Please write something in your entry.", true);
      if (v.text.length > 1000) return showMessage("Entry is too long (max 1000 characters).", true);

      var list = getDiary();
      if (editing) {
        write(DIARY_KEY, list.map(function (d) {
          return d.id === editing.id ? Object.assign({}, d, v) : d;
        }));
        window.location.href = "Diary.html?msg=updated";
      } else {
        v.id = makeId("d");
        list.push(v);
        write(DIARY_KEY, list);
        window.location.href = "Diary.html?msg=added";
      }
    });

    $("deleteBtn").addEventListener("click", function () {
      if (!editing || !window.confirm("Delete this entry? This cannot be undone.")) return;
      write(DIARY_KEY, getDiary().filter(function (d) { return d.id !== editing.id; }));
      window.location.href = "Diary.html?msg=deleted";
    });
  }

  /* =========================================================
     ARTICLES
     ========================================================= */
  var ARTICLES = [
    { id: "feeding-your-dog", title: "How much should I feed my dog?", category: "Nutrition", minutes: 3,
      summary: "Portion sizes depend on age, weight and activity. Here is how to find a good starting point.",
      body: [
        "There is no single right amount for every dog. Puppies, adult dogs and seniors all need different portions, and a very active dog needs more than a relaxed one of the same weight.",
        "Start with the feeding guide on your dog’s food packaging, then adjust. If you can feel your dog’s ribs under a thin layer of fat and see a waist from above, the portion is probably right.",
        "Split the daily amount into two meals, keep treats to a small part of the day’s food, and always have fresh water available. If your dog gains or loses weight quickly, talk to your vet." ] },
    { id: "cat-vet-signs", title: "Signs your cat needs a vet visit", category: "Health", minutes: 4,
      summary: "Cats hide discomfort well. These changes are worth taking seriously.",
      body: [
        "Cats are very good at hiding illness, so small changes in behaviour matter. Eating or drinking much more or less than usual, hiding more, or using the litter tray differently can all be early signs.",
        "Watch for weight loss, bad breath, vomiting more than once, a dull coat, or changes in how your cat jumps and moves.",
        "If a change lasts more than a day or two, or your cat seems in pain, book a visit. Trouble passing urine or difficulty breathing should be treated as an emergency." ] },
    { id: "vaccination-basics", title: "Vaccination schedule basics", category: "Health", minutes: 3,
      summary: "Why vaccines matter and how to keep boosters on track.",
      body: [
        "Vaccines protect your pet from serious diseases. Young animals usually get a series of shots in their first months, followed by boosters at intervals your vet recommends.",
        "Keep a record of every vaccine and its date. The Health page in PawCare is a good place to store this, and Reminders can warn you before a booster is due.",
        "Schedules differ by species, age, lifestyle and where you live, so always follow your vet’s advice for your pet." ] },
    { id: "teach-sit", title: "Teaching your puppy to sit", category: "Training", minutes: 2,
      summary: "A calm, reward-based way to teach your first command.",
      body: [
        "Hold a small treat close to your puppy’s nose, then slowly move it upward over their head. As their head follows the treat, their bottom lowers into a sit.",
        "The moment they sit, say “yes” and give the treat. Repeat in short sessions of a few minutes, several times a day, and add the word “sit” once they do it reliably.",
        "Keep sessions positive and end on a success. Patience works far better than repeating the command." ] },
    { id: "home-grooming", title: "Brushing and bathing at home", category: "Grooming", minutes: 3,
      summary: "Simple routines that keep coats healthy and reduce shedding.",
      body: [
        "Regular brushing removes loose hair, spreads natural oils and lets you check for lumps, ticks or skin problems. Long-haired pets like Persian cats may need brushing every day.",
        "Bathe only when needed, using a shampoo made for pets, and rinse thoroughly. Dry your pet well, especially in cold weather.",
        "Make grooming a calm routine with treats and praise, and keep sessions short at first." ] },
    { id: "happy-rabbits", title: "Keeping rabbits happy and healthy", category: "Nutrition", minutes: 4,
      summary: "Hay, space and company: the basics of rabbit care.",
      body: [
        "Most of a rabbit’s diet should be fresh hay, which keeps their teeth worn down and their digestion moving. Add leafy greens daily and only a small amount of pellets.",
        "Rabbits need room to run, jump and stretch every day, along with places to hide. They are social animals and often enjoy a companion.",
        "Watch for changes in eating or droppings. A rabbit that stops eating needs a vet quickly." ] }
  ];
  var CATEGORIES = ["All", "Nutrition", "Health", "Training", "Grooming"];

  function initArticleList() {
    var grid = $("articleList");
    var chipsBox = $("categoryChips");
    var search = $("articleSearch");
    var category = "All";

    function render() {
      chipsBox.innerHTML = "";
      CATEGORIES.forEach(function (c) {
        var b = el("button", "chip" + (c === category ? " is-active" : ""), c);
        b.type = "button";
        b.setAttribute("data-cat", c);
        b.setAttribute("aria-pressed", c === category ? "true" : "false");
        chipsBox.appendChild(b);
      });

      var q = search.value.trim().toLowerCase();
      var items = ARTICLES.filter(function (a) {
        return (category === "All" || a.category === category) &&
               (!q || (a.title + " " + a.summary).toLowerCase().indexOf(q) !== -1);
      });

      grid.innerHTML = "";
      if (!items.length) {
        grid.appendChild(el("p", "list-empty", "No articles match your search."));
        return;
      }
      items.forEach(function (a) {
        var card = el("a", "card article-card");
        card.href = "Article.html?id=" + encodeURIComponent(a.id);
        var meta = el("div", "entry-meta");
        meta.appendChild(el("span", "tag", a.category));
        meta.appendChild(el("span", null, a.minutes + " min read"));
        card.appendChild(meta);
        card.appendChild(el("h2", "entry-title", a.title));
        card.appendChild(el("p", "entry-text", a.summary));
        grid.appendChild(card);
      });
    }

    chipsBox.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-cat]");
      if (!b) return;
      category = b.getAttribute("data-cat");
      render();
    });
    search.addEventListener("input", render);
    render();
  }

  function initArticleView() {
    var box = $("articleView");
    var idx = -1;
    ARTICLES.forEach(function (a, i) { if (a.id === params.get("id")) idx = i; });

    if (idx === -1) {
      box.innerHTML = "";
      box.appendChild(el("p", "list-empty", "This article could not be found."));
      var back = el("a", "btn-book", "Back to articles");
      back.href = "Articles.html";
      box.appendChild(back);
      return;
    }
    var a = ARTICLES[idx];
    document.title = a.title;
    $("articleTitle").textContent = a.title;
    $("articleCategory").textContent = a.category;
    $("articleMinutes").textContent = a.minutes + " min read";
    var body = $("articleBody");
    body.innerHTML = "";
    a.body.forEach(function (p) { body.appendChild(el("p", null, p)); });

    var next = ARTICLES[(idx + 1) % ARTICLES.length];
    var link = $("nextArticle");
    link.href = "Article.html?id=" + encodeURIComponent(next.id);
    link.textContent = "Read next: " + next.title + " →";
  }

  /* =========================================================
     PROFILE
     ========================================================= */
  function initials(name) {
    var parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "🐾";
    return (parts[0].charAt(0) + (parts[1] ? parts[1].charAt(0) : "")).toUpperCase();
  }

  function initProfile() {
    var profile = getProfile() || {};
    var savedName = "";
    try { savedName = localStorage.getItem(USER_KEY) || ""; } catch (e) {}

    $("name").value = profile.name || savedName || "";
    $("email").value = profile.email || "";
    $("phone").value = profile.phone || "";
    $("city").value = profile.city || "";

    function refreshHeader() {
      var n = $("name").value.trim();
      $("avatar").textContent = initials(n);
      $("displayName").textContent = n || "Your profile";
    }
    refreshHeader();
    $("name").addEventListener("input", refreshHeader);

    $("profileForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = {
        name: $("name").value.trim(), email: $("email").value.trim(),
        phone: $("phone").value.trim(), city: $("city").value.trim()
      };
      if (!v.name) return showMessage("Please enter your name.", true);
      if (v.name.length > 40) return showMessage("Name is too long (max 40 characters).", true);
      if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return showMessage("Please enter a valid email address.", true);
      if (v.phone && !/^[0-9+\-()\s]{7,20}$/.test(v.phone)) return showMessage("Please enter a valid phone number.", true);
      if (v.city.length > 40) return showMessage("City is too long (max 40 characters).", true);

      write(PROFILE_KEY, v);
      try { localStorage.setItem(USER_KEY, v.name); } catch (err) {}
      showMessage("Profile saved. Your name now shows on the dashboard.");
    });

    $("logoutBtn").addEventListener("click", function () {
      if (!window.confirm("Log out of PawCare?")) return;
      try { localStorage.removeItem("token"); localStorage.removeItem(USER_KEY); } catch (e) {}
      window.location.href = LOGIN;
    });

    $("resetBtn").addEventListener("click", function () {
      if (!window.confirm("Reset ALL PawCare data (pets, tasks, reminders, visits, records, diary)? This cannot be undone.")) return;
      try {
        Object.keys(localStorage).forEach(function (k) {
          if (k.indexOf("pawfect_") === 0) localStorage.removeItem(k);
        });
      } catch (e) {}
      memory = {};
      window.location.href = DASHBOARD + "?msg=reset";
    });
  }

  /* =========================================================
     LOGIN
     ========================================================= */
  function initLogin() {
    var mode = "signin";

    function applyMode() {
      var signup = mode === "signup";
      $("nameField").hidden = !signup;
      $("loginTitle").textContent = signup ? "Create your account" : "Welcome back";
      $("loginSub").textContent = signup ? "Start caring for your pets with PawCare." : "Sign in to keep caring for your pets.";
      $("loginBtn").textContent = signup ? "Create account" : "Sign in";
      $("modeText").textContent = signup ? "Already have an account?" : "New to PawCare?";
      $("modeLink").textContent = signup ? "Sign in" : "Create account";
      showMessage("");
    }

    $("modeLink").addEventListener("click", function () {
      mode = mode === "signin" ? "signup" : "signin";
      applyMode();
    });

    $("togglePw").addEventListener("click", function () {
      var pw = $("password");
      var show = pw.type === "password";
      pw.type = show ? "text" : "password";
      $("togglePw").textContent = show ? "Hide" : "Show";
      $("togglePw").setAttribute("aria-pressed", show ? "true" : "false");
    });

    $("loginForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = $("name").value.trim();
      var email = $("email").value.trim();
      var password = $("password").value;

      if (mode === "signup" && !name) return showMessage("Please enter your name.", true);
      if (!email) return showMessage("Please enter your email.", true);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showMessage("Please enter a valid email address.", true);
      if (password.length < 6) return showMessage("Password must be at least 6 characters.", true);

      var profile = getProfile() || {};
      if (mode === "signup") {
        profile = { name: name, email: email, phone: "", city: "" };
        write(PROFILE_KEY, profile);
      } else if (!profile.name) {
        var base = email.split("@")[0];
        profile = { name: base.charAt(0).toUpperCase() + base.slice(1), email: email, phone: "", city: "" };
        write(PROFILE_KEY, profile);
      }
      // Front-end demo only: no password is stored or checked against a server.
      try {
        localStorage.setItem("token", "demo-" + Date.now().toString(36));
        localStorage.setItem(USER_KEY, profile.name);
      } catch (err) {}
      window.location.href = DASHBOARD;
    });
  }

  /* ---------- Start (each page is detected by what is on it) ---------- */
  if ($("petsGrid")) initMyPets();
  else if ($("healthList")) initHealthList();
  else if ($("recordForm")) initHealthForm();
  else if ($("diaryList")) initDiaryList();
  else if ($("entryForm")) initDiaryForm();
  else if ($("articleList")) initArticleList();
  else if ($("articleView")) initArticleView();
  else if ($("profileForm")) initProfile();
  else if ($("loginForm")) initLogin();
})();