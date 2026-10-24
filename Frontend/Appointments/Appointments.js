/* =========================================================
   PawCare – Appointments (all pages)
   Pages: Appointments.html, Reschedule.html, AppointmentConfirmed.html

   Appointment status:
     scheduled  -> booked, shown as "Upcoming" until its time passes
     awaiting   -> time has passed, you still have to confirm what happened
     completed  -> you confirmed the checkup took place
     missed     -> you confirmed the visit was not attended

   Data is saved in the browser (localStorage). To use a real API later,
   only load() and save() below need to be replaced with fetch() calls.
   ========================================================= */
(function () {
  "use strict";

  var KEY = "pawfect_appointments";

  /* ---------- Helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function pad(n) { return String(n).padStart(2, "0"); }

  function toISODate(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function addDays(n) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    return toISODate(d);
  }
  function stamp(a) { return new Date(a.date + "T" + a.time); }
  function isPast(a) { return stamp(a) <= new Date(); }

  function formatDate(dateStr, withYear) {
    var opts = { day: "numeric", month: "short" };
    if (withYear) opts.year = "numeric";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", opts);
  }
  function formatTime(timeStr) {
    var parts = timeStr.split(":").map(Number);
    var h = parts[0], m = parts[1];
    return (h % 12 || 12) + ":" + pad(m) + " " + (h >= 12 ? "PM" : "AM");
  }
  function makeId() {
    return "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  /* ---------- Storage (replace with API later) ---------- */
  function seed() {
    return [
      { id: "a1", pet: "Luna", vet: "Dr. Ahmed", date: addDays(3),   time: "16:00", reason: "Regular checkup", status: "scheduled" },
      { id: "a2", pet: "Max",  vet: "Dr. Sara",  date: addDays(14),  time: "11:30", reason: "Vaccination",     status: "scheduled" },
      { id: "a3", pet: "Max",  vet: "Dr. Ahmed", date: addDays(-30), time: "10:00", reason: "Checkup",         status: "completed" }
    ];
  }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    var s = seed();
    save(s);
    return s;
  }
  function findById(id) {
    return load().filter(function (a) { return a.id === id; })[0];
  }
  function setStatus(id, status) {
    save(load().map(function (a) {
      return a.id === id ? Object.assign({}, a, { status: status }) : a;
    }));
  }

  /* ---------- Status ---------- */
  function statusOf(a) {
    var s = a.status || "scheduled";          // older saved data has no status
    if (s === "scheduled" && isPast(a)) return "awaiting";
    return s;
  }

  /* ---------- Validation ---------- */
  function validate(v, ignoreId) {
    if (!v.pet) return "Please select a pet.";
    if (!v.vet) return "Please select a veterinarian.";
    if (!v.date) return "Please choose a date.";
    if (!v.time) return "Please choose a time.";
    if (!v.reason) return "Please enter a reason for the visit.";
    if (v.reason.length > 120) return "Reason is too long (max 120 characters).";
    if (stamp(v) <= new Date()) return "Please choose a future date and time.";
    var clash = load().some(function (a) {
      return a.id !== ignoreId && statusOf(a) === "scheduled" &&
             a.vet === v.vet && a.date === v.date && a.time === v.time;
    });
    if (clash) return v.vet + " is already booked at that time. Please pick another slot.";
    return "";
  }

  function readForm() {
    return {
      pet: $("pet").value,
      vet: $("vet").value,
      date: $("date").value,
      time: $("time").value,
      reason: $("reason").value.trim()
    };
  }
  function showMessage(text, isError) {
    var m = $("formMessage");
    if (!m) return;
    m.textContent = text;
    m.classList.toggle("is-error", !!isError);
  }

  var params = new URLSearchParams(window.location.search);
  var page = document.body.getAttribute("data-page");

  /* =========================================================
     PAGE 1: Appointments (book + list)
     ========================================================= */
  function initAppointments() {
    var listEl = $("appointmentList");
    var noticeEl = $("notice");
    $("date").min = toISODate(new Date());

    function showNotice(text) {
      noticeEl.textContent = text;
      noticeEl.hidden = false;
    }

    // Notice after coming back from another page
    var notices = {
      rescheduled: "Appointment rescheduled.",
      cancelled: "Appointment cancelled."
    };
    var msg = params.get("msg");
    if (msg && notices[msg]) showNotice(notices[msg]);

    // "Book again" – fill the form with the old visit's details
    function setIfOption(select, value) {
      if (!value) return;
      var ok = Array.prototype.some.call(select.options, function (o) {
        return o.value === value;
      });
      if (ok) select.value = value;
    }
    if (params.get("rebook")) {
      setIfOption($("pet"), params.get("pet"));
      setIfOption($("vet"), params.get("vet"));
      $("reason").value = params.get("reason") || "";
      showNotice("Choose a new date and time to book this visit again.");
    }
    if (msg || params.get("rebook")) {
      window.history.replaceState(null, "", "Appointments.html");
    }

    // Build one row of the list
    function buildRow(a) {
      var status = statusOf(a);
      var li = el("li", "appt");

      var icon = { scheduled: "◷", awaiting: "◷", completed: "✓", missed: "✕" }[status];
      li.appendChild(el("span", "appt-icon", icon));

      var info = el("div", "appt-info");
      info.appendChild(el("p", "appt-title", a.vet + " · " + a.pet));

      var when = formatDate(a.date);
      var subText = (status === "completed" || status === "missed")
        ? when + " · " + a.reason
        : when + " · " + formatTime(a.time) + " — " + a.reason;
      info.appendChild(el("p", "appt-sub", subText));

      if (status === "awaiting") {
        info.appendChild(el("p", "appt-sub appt-sub--wait", "Awaiting update – did this visit happen?"));
      }
      li.appendChild(info);

      if (status === "scheduled") {
        var r = el("a", "btn-outline", "Reschedule");
        r.href = "Reschedule.html?id=" + encodeURIComponent(a.id);
        li.appendChild(r);

      } else if (status === "awaiting") {
        var box = el("div", "appt-actions");

        var done = el("button", "btn-outline", "Mark completed");
        done.type = "button";
        done.setAttribute("data-action", "completed");
        done.setAttribute("data-id", a.id);

        var missed = el("button", "btn-outline btn-outline--danger", "Missed");
        missed.type = "button";
        missed.setAttribute("data-action", "missed");
        missed.setAttribute("data-id", a.id);

        box.appendChild(done);
        box.appendChild(missed);
        li.appendChild(box);

      } else if (status === "completed") {
        li.appendChild(el("span", "badge-done", "Completed"));

      } else if (status === "missed") {
        var box2 = el("div", "appt-actions");
        box2.appendChild(el("span", "badge-missed", "Missed"));

        var again = el("a", "btn-outline", "Book again");
        again.href = "Appointments.html?rebook=1" +
          "&pet=" + encodeURIComponent(a.pet) +
          "&vet=" + encodeURIComponent(a.vet) +
          "&reason=" + encodeURIComponent(a.reason);
        box2.appendChild(again);
        li.appendChild(box2);
      }
      return li;
    }

    function render() {
      var all = load();
      var awaiting = [], upcoming = [], history = [];

      all.forEach(function (a) {
        var s = statusOf(a);
        if (s === "awaiting") awaiting.push(a);
        else if (s === "scheduled") upcoming.push(a);
        else history.push(a);
      });

      awaiting.sort(function (a, b) { return stamp(a) - stamp(b); });
      upcoming.sort(function (a, b) { return stamp(a) - stamp(b); });
      history.sort(function (a, b) { return stamp(b) - stamp(a); });

      var items = awaiting.concat(upcoming, history);

      listEl.innerHTML = "";
      if (!items.length) {
        listEl.appendChild(el("li", "list-empty", "No appointments yet. Book your first visit."));
        return;
      }
      items.forEach(function (a) { listEl.appendChild(buildRow(a)); });
    }

    // "Mark completed" and "Missed" buttons
    listEl.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-action]");
      if (!btn) return;
      var action = btn.getAttribute("data-action");
      setStatus(btn.getAttribute("data-id"), action);
      showNotice(action === "completed"
        ? "Visit marked as completed."
        : "Visit marked as missed. You can book it again.");
      render();
    });

    // Book appointment
    $("bookForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = readForm();
      var error = validate(v, null);
      if (error) { showMessage(error, true); return; }

      v.id = makeId();
      v.status = "scheduled";
      var list = load();
      list.push(v);
      save(list);
      window.location.href = "AppointmentConfirmed.html?id=" + encodeURIComponent(v.id);
    });

    render();
  }

  /* =========================================================
     PAGE 2: Reschedule (only for upcoming visits)
     ========================================================= */
  function initReschedule() {
    var appt = findById(params.get("id"));
    var card = $("rescheduleCard");

    if (!appt || statusOf(appt) !== "scheduled") {
      card.innerHTML = "";
      card.appendChild(el("p", "list-empty",
        "This appointment could not be found, or it can no longer be rescheduled."));
      var back = el("a", "btn-book", "Back to appointments");
      back.href = "Appointments.html";
      card.appendChild(back);
      return;
    }

    $("pet").value = appt.pet;
    $("vet").value = appt.vet;
    $("date").value = appt.date;
    $("time").value = appt.time;
    $("reason").value = appt.reason;
    $("date").min = toISODate(new Date());

    $("rescheduleForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = readForm();
      v.pet = appt.pet;                      // pet cannot be changed here
      var error = validate(v, appt.id);
      if (error) { showMessage(error, true); return; }

      save(load().map(function (a) {
        return a.id === appt.id
          ? Object.assign({}, a, { vet: v.vet, date: v.date, time: v.time, reason: v.reason })
          : a;
      }));
      window.location.href = "Appointments.html?msg=rescheduled";
    });

    $("cancelBtn").addEventListener("click", function () {
      if (!window.confirm("Cancel this appointment? This cannot be undone.")) return;
      save(load().filter(function (a) { return a.id !== appt.id; }));
      window.location.href = "Appointments.html?msg=cancelled";
    });
  }

  /* =========================================================
     PAGE 3: Booking confirmed
     ========================================================= */
  function initConfirmed() {
    var appt = findById(params.get("id"));

    if (!appt) {
      $("summary").hidden = true;
      $("actions").hidden = true;
      showMessage("We could not find this booking.", true);
      $("backLink").hidden = false;
      return;
    }

    $("sumPet").textContent = appt.pet;
    $("sumVet").textContent = appt.vet;
    $("sumDate").textContent = formatDate(appt.date, true);
    $("sumTime").textContent = formatTime(appt.time);
    $("sumReason").textContent = appt.reason;
    $("rescheduleLink").href = "Reschedule.html?id=" + encodeURIComponent(appt.id);
  }

  /* ---------- Start ---------- */
  if (page === "appointments") initAppointments();
  else if (page === "reschedule") initReschedule();
  else if (page === "confirmed") initConfirmed();
})();