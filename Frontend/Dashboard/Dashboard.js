/* =========================================================
   PawCare – Dashboard (Dashboard.html + AddPet.html)

   The dashboard does not store its own copies of tasks, reminders or
   visits. It reads the same saved data as the other pages:
     pawfect_care_tasks      (Daily Care page)
     pawfect_reminders       (Reminders page)
     pawfect_appointments    (Appointments page)
     pawfect_pets            (this page: Add / Edit pet)
   Optional: pawfect_user_name  -> shown in the greeting ("Good morning, Saleha")

   Data is saved in the browser (localStorage). To use a real API later,
   only read() and write() below need to be replaced with fetch() calls.
   ========================================================= */
(function () {
  "use strict";

  var TASKS_KEY = "pawfect_care_tasks";
  var REMINDERS_KEY = "pawfect_reminders";
  var APPOINTMENTS_KEY = "pawfect_appointments";
  var PETS_KEY = "pawfect_pets";
  var HEALTH_KEY = "pawfect_health";
  var USER_KEY = "pawfect_user_name";

  var SPECIES_EMOJI = { Dog: "🐶", Cat: "🐱", Rabbit: "🐰", Bird: "🐦", Other: "🐾" };
  var TYPE_ICON = { vaccination: "+", medicine: "•", grooming: "✓", vet: "◷", other: "!" };

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
  function daysUntil(dateStr) {
    return Math.round((new Date(dateStr + "T00:00:00") - new Date(today() + "T00:00:00")) / 86400000);
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
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function lowerFirst(s) {
    if (s.length > 1 && /[A-Z]/.test(s.charAt(1))) return s;
    return s.charAt(0).toLowerCase() + s.slice(1);
  }

  /* ---------- Storage (replace with API later) ---------- */
  var memory = {};   // used only if the browser blocks localStorage

  function write(key, list) {
    memory[key] = list;
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) {}
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

  /* Sample data (identical to the other pages, so the first page you open
     creates the same data the others expect) */
  function seedPets() {
    return [
      { id: "p1", name: "Max",  species: "Dog",    breed: "Golden Retriever" },
      { id: "p2", name: "Luna", species: "Cat",    breed: "Persian Cat" },
      { id: "p3", name: "Coco", species: "Rabbit", breed: "Holland Lop" }
    ];
  }
  function seedHealth() {
    return [
      { id: "h1", pet: "Max",  type: "vaccination", title: "Rabies",         date: addDays(-120), notes: "Annual booster" },
      { id: "h2", pet: "Max",  type: "vaccination", title: "DHPP",           date: addDays(-200), notes: "" },
      { id: "h3", pet: "Luna", type: "vaccination", title: "FVRCP",          date: addDays(-150), notes: "" },
      { id: "h4", pet: "Luna", type: "checkup",     title: "Annual checkup", date: addDays(-60),  notes: "All good, weight stable" },
      { id: "h5", pet: "Coco", type: "vaccination", title: "Myxomatosis",    date: addDays(-90),  notes: "" },
      { id: "h6", pet: "Max",  type: "medication",  title: "Flea & tick",    date: addDays(-20),  notes: "Monthly treatment" }
    ];
  }
  function seedTasks() {
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
  function seedReminders() {
    return [
      { id: "r1", pet: "Max",  type: "vaccination", name: "Vaccination", details: "Rabies booster",  date: addDays(3),  time: "",      done: false },
      { id: "r2", pet: "Luna", type: "medicine",    name: "Medicine",    details: "Antibiotic",      date: addDays(0),  time: "20:00", done: false },
      { id: "r3", pet: "Max",  type: "grooming",    name: "Grooming",    details: "Bath & trim",     date: addDays(1),  time: "",      done: false },
      { id: "r4", pet: "Luna", type: "vet",         name: "Vet visit",   details: "Dr. Ahmed",       date: addDays(10), time: "16:00", done: false },
      { id: "r5", pet: "Max",  type: "vaccination", name: "Distemper",   details: "Booster overdue", date: addDays(-2), time: "",      done: false }
    ];
  }
  function seedAppointments() {
    return [
      { id: "a1", pet: "Luna", vet: "Dr. Ahmed", date: addDays(3),   time: "16:00", reason: "Regular checkup", status: "scheduled" },
      { id: "a2", pet: "Max",  vet: "Dr. Sara",  date: addDays(14),  time: "11:30", reason: "Vaccination",     status: "scheduled" },
      { id: "a3", pet: "Max",  vet: "Dr. Ahmed", date: addDays(-30), time: "10:00", reason: "Checkup",         status: "completed" }
    ];
  }

  function getPets()         { return read(PETS_KEY, seedPets); }
  function getHealth()       { return read(HEALTH_KEY, seedHealth); }
  function getTasks()        { return read(TASKS_KEY, seedTasks); }
  function getReminders()    { return read(REMINDERS_KEY, seedReminders); }
  function getAppointments() { return read(APPOINTMENTS_KEY, seedAppointments); }

  /* ---------- Shared rules (same as the other pages) ---------- */
  function isDone(t) { return t.doneDate === today(); }

  function apptStatus(a) {
    var s = a.status || "scheduled";
    if (s === "scheduled" && new Date(a.date + "T" + a.time) <= new Date()) return "awaiting";
    return s;
  }

  function badgeFor(dateStr) {
    var d = daysUntil(dateStr);
    if (d < 0)   return { text: "Overdue",  cls: "badge badge--overdue" };
    if (d === 0) return { text: "Today",    cls: "badge badge--soon" };
    if (d === 1) return { text: "Tomorrow", cls: "badge badge--date" };
    if (d <= 7)  return { text: "In " + d + " days", cls: "badge badge--soon" };
    return { text: formatDate(dateStr), cls: "badge badge--date" };
  }

  var params = new URLSearchParams(window.location.search);

  /* =========================================================
     PAGE 1: Dashboard
     ========================================================= */
  function initDashboard() {
    var careList = $("careList");

    /* ----- Notice (after adding / editing / deleting a pet) ----- */
    var notices = {
      petadded:   "Pet added.",
      petupdated: "Pet updated.",
      petdeleted: "Pet deleted.",
      reset:      "All PawCare data has been reset."
    };
    var msg = params.get("msg");
    if (msg && notices[msg]) {
      $("notice").textContent = notices[msg];
      $("notice").hidden = false;
      window.history.replaceState(null, "", "Dashboard.html");
    }

    /* ----- Greeting ----- */
    var h = new Date().getHours();
    var part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    var name = "";
    try { name = (localStorage.getItem(USER_KEY) || "").trim(); } catch (e) {}
    $("greeting").textContent = name ? part + ", " + name : part + "!";

    /* ----- Numbers used in several places ----- */
    function attention() {
      var overdue = getReminders().filter(function (r) {
        return !r.done && daysUntil(r.date) < 0;
      }).length;
      var awaiting = getAppointments().filter(function (a) {
        return apptStatus(a) === "awaiting";
      }).length;
      return { total: overdue + awaiting, awaiting: awaiting };
    }

    /* ----- Hero sentence + progress (refreshed when a task is ticked) ----- */
    function refreshSummary() {
      var tasks = getTasks();
      var total = tasks.length;
      var done = tasks.filter(isDone).length;
      var left = total - done;

      var bar = $("progressBar");
      bar.style.width = (total ? Math.round(done / total * 100) : 0) + "%";
      $("progressText").textContent = total ? done + " of " + total + " done" : "No tasks yet";
      var progress = bar.parentNode;
      progress.setAttribute("aria-valuemax", total);
      progress.setAttribute("aria-valuenow", done);

      var att = attention();
      var noun = att.awaiting
        ? (att.total === 1 ? "item needs" : "items need")
        : (att.total === 1 ? "reminder needs" : "reminders need");
      var text;
      if (!left && !att.total) text = "You’re all caught up for today. Great job!";
      else if (!left)          text = "All care tasks are done today and " + att.total + " " + noun + " your attention.";
      else if (!att.total)     text = plural(left, "care task", "care tasks") + " left today. Nothing needs your attention.";
      else                     text = plural(left, "care task", "care tasks") + " left today and " + att.total + " " + noun + " your attention.";
      $("heroText").textContent = text;
    }

    /* ----- Stats ----- */
    function renderStats() {
      $("statPets").textContent = getPets().length;
      $("statVaccinations").textContent = getHealth().filter(function (h) {
        return h.type === "vaccination";
      }).length;
      $("statVisits").textContent = getAppointments().filter(function (a) {
        return apptStatus(a) === "scheduled";
      }).length;
      $("statAttention").textContent = attention().total;
    }

    /* ----- Today's care ----- */
    function byTime(a, b) { return a.time < b.time ? -1 : a.time > b.time ? 1 : 0; }

    function renderCare() {
      var tasks = getTasks();
      careList.innerHTML = "";

      if (!tasks.length) {
        var empty = el("li", "empty", "No care tasks yet. ");
        var add = el("a", null, "Add one");
        add.href = "../DailyCare/AddTask.html";
        empty.appendChild(add);
        careList.appendChild(empty);
        return;
      }

      // show up to 5: unfinished tasks first, then fill with finished ones
      var undone = tasks.filter(function (t) { return !isDone(t); }).sort(byTime);
      var finished = tasks.filter(isDone).sort(byTime);
      var show = undone.slice(0, 5);
      if (show.length < 5) show = show.concat(finished.slice(0, 5 - show.length));
      show.sort(byTime);

      show.forEach(function (t) {
        var li = el("li", "task");
        var label = el("label");
        var input = el("input");
        input.type = "checkbox";
        input.checked = isDone(t);
        input.setAttribute("data-id", t.id);
        label.appendChild(input);
        label.appendChild(el("span", "check"));
        var nm = el("span", "task-name", t.name);
        if (t.pet) nm.appendChild(el("span", "task-pet", " · " + t.pet));
        label.appendChild(nm);
        li.appendChild(label);
        li.appendChild(el("time", "task-time", formatTime(t.time)));
        careList.appendChild(li);
      });
    }

    careList.addEventListener("change", function (e) {
      var box = e.target;
      if (!box.matches('input[type="checkbox"]')) return;
      var id = box.getAttribute("data-id");
      write(TASKS_KEY, getTasks().map(function (t) {
        return t.id === id ? Object.assign({}, t, { doneDate: box.checked ? today() : "" }) : t;
      }));
      refreshSummary();
    });

    /* ----- Upcoming & reminders (reminders + visits together) ----- */
    function reminderTitle(r) {
      return r.pet ? r.pet + "’s " + lowerFirst(r.name) : r.name;
    }

    function renderUpcoming() {
      var items = [];

      getReminders().forEach(function (r) {
        if (r.done) return;
        var sub = [];
        if (r.details) sub.push(r.details);
        if (r.time) sub.push(formatTime(r.time));
        items.push({
          urgent: daysUntil(r.date) < 0,
          sort: r.date + " " + (r.time || "23:59"),
          icon: TYPE_ICON[r.type] || "!",
          title: reminderTitle(r),
          sub: sub.length ? sub.join(" · ") : "Reminder",
          badge: badgeFor(r.date),
          href: "../Reminders/NewReminder.html?id=" + encodeURIComponent(r.id)
        });
      });

      getAppointments().forEach(function (a) {
        var s = apptStatus(a);
        if (s === "scheduled") {
          items.push({
            urgent: false,
            sort: a.date + " " + a.time,
            icon: "◷",
            title: a.vet + " — " + a.pet,
            sub: a.reason + " · " + formatTime(a.time),
            badge: badgeFor(a.date),
            href: "../Appointments/Reschedule.html?id=" + encodeURIComponent(a.id)
          });
        } else if (s === "awaiting") {
          items.push({
            urgent: true,
            sort: a.date + " " + a.time,
            icon: "◷",
            title: a.vet + " — " + a.pet,
            sub: formatDate(a.date) + " · " + a.reason,
            badge: { text: "Needs update", cls: "badge badge--overdue" },
            href: "../Appointments/Appointments.html"
          });
        }
      });

      items.sort(function (a, b) {
        if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
        return a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0;
      });

      var list = $("upcomingList");
      list.innerHTML = "";

      if (!items.length) {
        var empty = el("li", "empty", "Nothing coming up. ");
        var add = el("a", null, "Add a reminder");
        add.href = "../Reminders/NewReminder.html";
        empty.appendChild(add);
        list.appendChild(empty);
        return;
      }

      items.slice(0, 4).forEach(function (it) {
        var li = el("li", "reminder");
        li.appendChild(el("span", "reminder-icon", it.icon));

        var info = el("div", "reminder-info");
        var title = el("p", "reminder-title");
        var link = el("a", null, it.title);
        link.href = it.href;
        title.appendChild(link);
        info.appendChild(title);
        info.appendChild(el("p", "reminder-sub", it.sub));
        li.appendChild(info);

        li.appendChild(el("span", it.badge.cls, it.badge.text));
        list.appendChild(li);
      });
    }

    /* ----- My pets ----- */
    function renderPets() {
      var row = $("petsRow");
      row.innerHTML = "";

      getPets().forEach(function (p) {
        var a = el("a", "pet");
        a.href = "../MyPet/MyPet.html";
        a.appendChild(el("span", "pet-avatar", SPECIES_EMOJI[p.species] || SPECIES_EMOJI.Other));
        a.appendChild(el("span", "pet-name", p.name));
        a.appendChild(el("span", "pet-breed", p.breed || p.species));
        row.appendChild(a);
      });

      var addTile = el("a", "pet pet-add");
      addTile.href = "AddPet.html";
      addTile.appendChild(el("span", "pet-avatar pet-avatar--add", "+"));
      addTile.appendChild(el("span", "pet-name", "Add pet"));
      row.appendChild(addTile);
    }

    renderStats();
    renderCare();
    renderUpcoming();
    renderPets();
    refreshSummary();
  }

  /* =========================================================
     PAGE 2: Add pet / Edit pet
     ========================================================= */
  function initPetForm() {
    var id = params.get("id");
    var editing = null;

    // came from the MyPets page? then go back there after saving
    var fromMyPets = params.get("from") === "mypets";
    var returnTo = fromMyPets ? "../MyPet/MyPet.html" : "Dashboard.html";
    var backLink = $("backLink");
    if (backLink) {
      backLink.href = returnTo;
      backLink.textContent = fromMyPets ? "Back to my pets" : "Back to dashboard";
    }

    function showMessage(text, isError) {
      var m = $("formMessage");
      m.textContent = text;
      m.classList.toggle("is-error", !!isError);
    }

    if (id) {
      editing = getPets().filter(function (p) { return p.id === id; })[0];
      if (!editing) {
        var card = $("formCard");
        card.innerHTML = "";
        card.appendChild(el("p", "empty", "This pet could not be found."));
        var back = el("a", "btn-book", fromMyPets ? "Back to my pets" : "Back to dashboard");
        back.href = returnTo;
        card.appendChild(back);
        return;
      }
      $("pageTitle").textContent = "Edit pet";
      $("pageSub").textContent = "Update " + editing.name + "’s details or remove this pet.";
      $("formTitle").textContent = "Pet details";
      $("saveBtn").textContent = "Save changes";
      $("deleteBtn").hidden = false;

      $("petName").value = editing.name;
      $("species").value = editing.species;
      $("breed").value = editing.breed || "";
    }

    // Live preview card next to the form (if the page has one)
    function setPill(el, text, placeholder) {
      el.textContent = text || placeholder;
      el.classList.toggle("is-empty", !text);
    }
    function updatePreview(pop) {
      var avatar = $("previewAvatar");
      if (!avatar) return;
      var n = $("petName").value.trim();
      var sp = $("species").value;
      var br = $("breed").value.trim();

      var emoji = $("previewEmoji");
      emoji.textContent = SPECIES_EMOJI[sp] || "";
      emoji.hidden = !sp;
      $("previewPaw").hidden = !!sp;               // brand paw until a species is chosen

      $("previewName").textContent = n || "Your pet";
      $("previewName").classList.toggle("is-empty", !n);
      setPill($("previewSpecies"), sp ? (SPECIES_EMOJI[sp] + " " + sp) : "", "Species");
      setPill($("previewBreed"), br, "Breed");

      if (pop) {
        avatar.classList.remove("pop");
        void avatar.offsetWidth;          // restart the little bounce
        avatar.classList.add("pop");
      }
    }
    if ($("previewDate")) {
      $("previewDate").textContent = "Added " +
        new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      if (editing) $("previewBadge").textContent = "Saved pet";
    }
    $("petName").addEventListener("input", function () { updatePreview(false); });
    $("breed").addEventListener("input", function () { updatePreview(false); });
    $("species").addEventListener("change", function () { updatePreview(true); });
    updatePreview(false);

    $("petForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = {
        name: $("petName").value.trim(),
        species: $("species").value,
        breed: $("breed").value.trim()
      };

      if (!v.name) return showMessage("Please enter your pet’s name.", true);
      if (v.name.length > 30) return showMessage("Name is too long (max 30 characters).", true);
      if (!v.species) return showMessage("Please select a species.", true);
      if (v.breed.length > 40) return showMessage("Breed is too long (max 40 characters).", true);

      var duplicate = getPets().some(function (p) {
        return (!editing || p.id !== editing.id) && p.name.toLowerCase() === v.name.toLowerCase();
      });
      if (duplicate) return showMessage("You already have a pet called " + v.name + ".", true);

      if (editing) {
        write(PETS_KEY, getPets().map(function (p) {
          return p.id === editing.id ? Object.assign({}, p, v) : p;
        }));
        window.location.href = returnTo + "?msg=petupdated";
      } else {
        var list = getPets();
        list.push({ id: makeId("p"), name: v.name, species: v.species, breed: v.breed });
        write(PETS_KEY, list);
        window.location.href = returnTo + "?msg=petadded";
      }
    });

    $("deleteBtn").addEventListener("click", function () {
      if (!editing) return;
      var ok = window.confirm("Delete " + editing.name + "? Their appointments, reminders and tasks will stay on their pages.");
      if (!ok) return;
      write(PETS_KEY, getPets().filter(function (p) { return p.id !== editing.id; }));
      window.location.href = returnTo + "?msg=petdeleted";
    });
  }

  /* ---------- Start (page is detected by what is on it) ---------- */
  if ($("careList")) initDashboard();
  else if ($("petForm")) initPetForm();
})();