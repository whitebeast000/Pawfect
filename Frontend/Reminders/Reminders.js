/* =========================================================
   PawCare – Reminders (all pages)
   Pages: Reminders.html (list), NewReminder.html (add + edit + delete)

   Badge rules (based on the due DATE):
     before today -> Overdue (red)      today        -> Today (gold)
     tomorrow     -> Tomorrow (green)   2 to 7 days  -> In N days (gold)
     later        -> the date, e.g. "15 Oct" (green)

   Data is saved in the browser (localStorage). To use a real API later,
   only load() and save() below need to be replaced with fetch() calls.
   ========================================================= */
(function () {
  "use strict";

  var KEY = "pawfect_reminders";
  var TYPES = [
    { key: "vaccination", label: "Vaccination", icon: "+" },
    { key: "medicine",    label: "Medicine",    icon: "•" },
    { key: "grooming",    label: "Grooming",    icon: "✓" },
    { key: "vet",         label: "Vet visit",   icon: "◷" },
    { key: "other",       label: "Other",       icon: "!" }
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
  function daysUntil(dateStr) {
    var a = new Date(dateStr + "T00:00:00");
    var b = new Date(today() + "T00:00:00");
    return Math.round((a - b) / 86400000);
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
  function makeId() {
    return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function typeOf(key) {
    return TYPES.filter(function (t) { return t.key === key; })[0] || TYPES[TYPES.length - 1];
  }
  // "Vaccination" -> "vaccination" (but keeps "MRI" as it is)
  function lowerFirst(s) {
    if (s.length > 1 && s.charAt(1) === s.charAt(1).toUpperCase() && /[A-Z]/.test(s.charAt(1))) return s;
    return s.charAt(0).toLowerCase() + s.slice(1);
  }
  function titleOf(r) {
    return r.pet ? r.pet + "’s " + lowerFirst(r.name) : r.name;
  }
  function subOf(r) {
    var parts = [];
    if (r.details) parts.push(r.details);
    if (r.time) parts.push(formatTime(r.time));
    return parts.length ? parts.join(" · ") : typeOf(r.type).label;
  }
  function sortKey(r) { return r.date + " " + (r.time || "23:59"); }
  function byDue(a, b) { return sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0; }

  function badgeOf(r) {
    var d = daysUntil(r.date);
    if (d < 0)  return { text: "Overdue",  cls: "badge badge--overdue" };
    if (d === 0) return { text: "Today",    cls: "badge badge--soon" };
    if (d === 1) return { text: "Tomorrow", cls: "badge badge--ok" };
    if (d <= 7) return { text: "In " + d + " days", cls: "badge badge--soon" };
    return { text: formatDate(r.date), cls: "badge badge--ok" };
  }

  /* ---------- Storage (replace with API later) ---------- */
  var memory = null;   // used only if the browser blocks localStorage

  function seed() {
    return [
      { id: "r1", pet: "Max",  type: "vaccination", name: "Vaccination", details: "Rabies booster",  date: addDays(3),  time: "",      done: false },
      { id: "r2", pet: "Luna", type: "medicine",    name: "Medicine",    details: "Antibiotic",      date: addDays(0),  time: "20:00", done: false },
      { id: "r3", pet: "Max",  type: "grooming",    name: "Grooming",    details: "Bath & trim",     date: addDays(1),  time: "",      done: false },
      { id: "r4", pet: "Luna", type: "vet",         name: "Vet visit",   details: "Dr. Ahmed",       date: addDays(10), time: "16:00", done: false },
      { id: "r5", pet: "Max",  type: "vaccination", name: "Distemper",   details: "Booster overdue", date: addDays(-2), time: "",      done: false }
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
    return load().filter(function (r) { return r.id === id; })[0];
  }

  var params = new URLSearchParams(window.location.search);

  /* =========================================================
     PAGE 1: Reminders list
     ========================================================= */
  function initList() {
    var activeList = $("reminderList");
    var doneCard = $("doneCard");
    var doneList = $("doneList");
    var noticeEl = $("notice");

    var notices = {
      added:    "Reminder added.",
      updated:  "Reminder updated.",
      deleted:  "Reminder deleted.",
      done:     "Reminder marked as done.",
      reopened: "Reminder moved back to your list."
    };
    var msg = params.get("msg");
    if (msg && notices[msg]) {
      noticeEl.textContent = notices[msg];
      noticeEl.hidden = false;
      window.history.replaceState(null, "", "Reminders.html");
    }

    function buildRow(r) {
      var li = el("li", "reminder" + (r.done ? " reminder--done" : ""));

      var link = el("a", "reminder-link");
      link.href = "NewReminder.html?id=" + encodeURIComponent(r.id);
      link.setAttribute("aria-label", "Open reminder: " + titleOf(r));

      link.appendChild(el("span", "reminder-icon", typeOf(r.type).icon));

      var info = el("div", "reminder-info");
      info.appendChild(el("p", "reminder-title", titleOf(r)));
      info.appendChild(el("p", "reminder-sub", subOf(r)));
      link.appendChild(info);

      if (r.done) {
        link.appendChild(el("span", "badge badge--ok", "Done"));
      } else {
        var b = badgeOf(r);
        link.appendChild(el("span", b.cls, b.text));
      }
      li.appendChild(link);
      return li;
    }

    var all = load();
    var active = all.filter(function (r) { return !r.done; }).sort(byDue);
    var done = all.filter(function (r) { return r.done; }).sort(byDue).reverse();

    activeList.innerHTML = "";
    if (!active.length) {
      var empty = el("li", "list-empty", "No reminders yet. ");
      var add = el("a", null, "Create your first one");
      add.href = "NewReminder.html";
      empty.appendChild(add);
      activeList.appendChild(empty);
    } else {
      active.forEach(function (r) { activeList.appendChild(buildRow(r)); });
    }

    doneList.innerHTML = "";
    if (done.length) {
      done.forEach(function (r) { doneList.appendChild(buildRow(r)); });
      doneCard.hidden = false;
    } else {
      doneCard.hidden = true;
    }

    // "Next up" banner with the bell
    var bell = $("bell");
    if (bell) {
      var overdue = active.filter(function (r) { return daysUntil(r.date) < 0; });
      var dueToday = active.filter(function (r) { return daysUntil(r.date) === 0; });
      var thisWeek = active.filter(function (r) { var d = daysUntil(r.date); return d >= 1 && d <= 7; });
      var next = active.filter(function (r) { return daysUntil(r.date) >= 0; })[0];

      var title, sub;
      if (overdue.length) {
        title = overdue.length === 1 ? "1 reminder is overdue" : overdue.length + " reminders are overdue";
        sub = "Open " + titleOf(overdue[0]) + " and mark it done once it’s handled.";
      } else if (dueToday.length) {
        title = dueToday.length === 1 ? "1 reminder is due today" : dueToday.length + " reminders are due today";
        sub = "First up: " + titleOf(dueToday[0]) + ".";
      } else if (next) {
        title = "Next up: " + titleOf(next);
        sub = badgeOf(next).text + " · " + subOf(next);
      } else {
        title = "You’re all caught up";
        sub = "Nothing needs your attention right now.";
      }
      bell.classList.toggle("is-alert", overdue.length > 0);
      $("bellTitle").textContent = title;
      $("bellSub").textContent = sub;

      var chips = $("bellChips");
      chips.innerHTML = "";
      if (overdue.length)  chips.appendChild(el("span", "stat-chip stat-chip--bad",  overdue.length + " overdue"));
      if (dueToday.length) chips.appendChild(el("span", "stat-chip stat-chip--soon", dueToday.length + " today"));
      if (thisWeek.length) chips.appendChild(el("span", "stat-chip", thisWeek.length + " this week"));
      if (!chips.children.length) chips.appendChild(el("span", "stat-chip", "All clear"));
    }
  }

  /* =========================================================
     PAGE 2: New reminder / Edit reminder
     ========================================================= */
  function initForm() {
    var id = params.get("id");
    var editing = null;

    function showMessage(text, isError) {
      var m = $("formMessage");
      m.textContent = text;
      m.classList.toggle("is-error", !!isError);
    }

    $("date").min = today();

    if (id) {
      editing = findById(id);
      if (!editing) {
        var card = $("formCard");
        card.innerHTML = "";
        card.appendChild(el("p", "list-empty", "This reminder could not be found."));
        var back = el("a", "btn-book", "Back to reminders");
        back.href = "Reminders.html";
        card.appendChild(back);
        return;
      }
      $("pageTitle").textContent = "Edit reminder";
      $("pageSub").textContent = "Update the details, mark it as done, or remove it.";
      $("formTitle").textContent = "Reminder details";
      $("saveBtn").textContent = "Save changes";
      $("deleteBtn").hidden = false;
      $("doneBtn").hidden = false;
      $("doneBtn").textContent = editing.done ? "Move back to list" : "Mark as done";

      $("pet").value = editing.pet || "all";
      $("type").value = editing.type;
      $("name").value = editing.name;
      $("details").value = editing.details || "";
      $("date").value = editing.date;
      $("time").value = editing.time || "";
      $("date").removeAttribute("min");      // an overdue date can stay as it is
    }

    // Side panel: preview of the reminder row + highlighted type
    function updatePreview() {
      if (!$("pvTitle")) return;
      var petValue = $("pet").value;
      var realPet = petValue && petValue !== "all" ? petValue : "";
      var type = $("type").value;
      var name = $("name").value.trim();
      var details = $("details").value.trim();
      var time = $("time").value;
      var date = $("date").value;

      var base = name || (type ? typeOf(type).label : "");
      $("pvTitle").textContent = base ? titleOf({ pet: realPet, name: base }) : "Your reminder";
      $("pvIcon").textContent = type ? typeOf(type).icon : "+";

      var hasSub = details || time || type;
      $("pvSub").textContent = hasSub ? subOf({ details: details, time: time, type: type || "other" })
                                      : "Pick a pet, type and date";

      var badge = $("pvBadge");
      if (date) {
        var b = badgeOf({ date: date });
        badge.textContent = b.text;
        badge.className = b.cls;
        badge.hidden = false;
      } else {
        badge.hidden = true;
      }

      var items = document.querySelectorAll("#typeGuide li");
      Array.prototype.forEach.call(items, function (li) {
        li.classList.toggle("is-active", li.getAttribute("data-type") === type);
      });
    }
    ["pet", "type", "name", "details", "date", "time"].forEach(function (id) {
      $(id).addEventListener("input", updatePreview);
      $(id).addEventListener("change", updatePreview);
    });
    updatePreview();

    $("reminderForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var petValue = $("pet").value;
      var v = {
        pet: petValue === "all" ? "" : petValue,
        type: $("type").value,
        name: $("name").value.trim(),
        details: $("details").value.trim(),
        date: $("date").value,
        time: $("time").value
      };

      if (!petValue) return showMessage("Please select a pet.", true);
      if (!v.type) return showMessage("Please select a type.", true);
      if (!v.name) return showMessage("Please enter a reminder name.", true);
      if (v.name.length > 40) return showMessage("Reminder name is too long (max 40 characters).", true);
      if (v.details.length > 60) return showMessage("Details are too long (max 60 characters).", true);
      if (!v.date) return showMessage("Please choose a date.", true);
      if ((!editing || v.date !== editing.date) && v.date < today()) {
        return showMessage("Please choose today or a future date.", true);
      }

      var duplicate = load().some(function (r) {
        return (!editing || r.id !== editing.id) &&
               r.pet === v.pet && r.type === v.type &&
               r.name.toLowerCase() === v.name.toLowerCase() &&
               r.date === v.date && r.time === v.time;
      });
      if (duplicate) return showMessage("This reminder already exists.", true);

      if (editing) {
        save(load().map(function (r) {
          return r.id === editing.id ? Object.assign({}, r, v) : r;
        }));
        window.location.href = "Reminders.html?msg=updated";
      } else {
        v.id = makeId();
        v.done = false;
        var list = load();
        list.push(v);
        save(list);
        window.location.href = "Reminders.html?msg=added";
      }
    });

    $("doneBtn").addEventListener("click", function () {
      if (!editing) return;
      var nowDone = !editing.done;
      save(load().map(function (r) {
        return r.id === editing.id ? Object.assign({}, r, { done: nowDone }) : r;
      }));
      window.location.href = "Reminders.html?msg=" + (nowDone ? "done" : "reopened");
    });

    $("deleteBtn").addEventListener("click", function () {
      if (!editing) return;
      if (!window.confirm("Delete this reminder? This cannot be undone.")) return;
      save(load().filter(function (r) { return r.id !== editing.id; }));
      window.location.href = "Reminders.html?msg=deleted";
    });
  }

  /* ---------- Start (page is detected by what is on it) ---------- */
  if ($("reminderList")) initList();
  else if ($("reminderForm")) initForm();
})();
