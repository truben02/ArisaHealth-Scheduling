document.addEventListener("DOMContentLoaded", function () {
  // --- Read URL parameters ---
  const url = new URL(window.location.href);
  const room = url.searchParams.get("room");
  let startDate = url.searchParams.get("date"); // This will become week start (Mon)

  const roomTitle = document.getElementById("roomTitle");
  const datePicker = document.getElementById("datePicker");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const homeBtn = document.getElementById("homeBtn");
  const roomTable = document.getElementById("roomTable");

  if (!room || !startDate) {
    roomTitle.textContent = "Missing room or date";
    return;
  }

  // --- Helper: format date as "Mon 11/25"
  function pretty(d) {
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "numeric",
      day: "numeric"
    });
  }

  // --- Convert YYYY-MM-DD to Date ---
  function toDate(iso) {
    return new Date(iso + "T00:00:00");
  }

  // --- Convert Date to YYYY-MM-DD ---
  function toISO(d) {
    return d.toLocaleDateString("en-CA");
  }

  // --- Get Monday for a given date ---
  function getMonday(d) {
    const day = d.getDay();        // 0=Sun 1=Mon ...
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    return monday;
  }

  // --- Build week array (7 dates) ---
  function buildWeek(monday) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }

  // --- Build times ---
  const times = [];
  for (let h = 8; h <= 17; h++) {
    for (let m of [0, 15, 30, 45]) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }

  // --- Main render ---
  function loadWeek() {
    const start = getMonday(toDate(startDate));
    const week = buildWeek(start);

    // Update displayed title & date picker
    roomTitle.textContent = `${room} — Week of ${pretty(start)}`;
    datePicker.value = toISO(start);

    roomTable.innerHTML = "";

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    // Header row
    const trHead = document.createElement("tr");
    const thTime = document.createElement("th");
    thTime.textContent = "Time";
    trHead.appendChild(thTime);

    week.forEach((d) => {
      const th = document.createElement("th");
      th.textContent = pretty(d);
      trHead.appendChild(th);
    });

    thead.appendChild(trHead);
    table.appendChild(thead);

    // Rows for each time
    times.forEach((time) => {
      const tr = document.createElement("tr");

      const tdTime = document.createElement("td");
      tdTime.textContent = time;
      tr.appendChild(tdTime);

      week.forEach((d) => {
        const iso = toISO(d);
        const td = document.createElement("td");
        td.className = "slotCell";
        td.dataset.room = room;
        td.dataset.date = iso;
        td.dataset.time = time;
        td.textContent = "...";

        // Firebase realtime updates
        db.ref(`rooms/${room}/${iso}/${time}`).on("value", (snap) => {
          const v = snap.val();
          td.textContent = v || "";
          td.classList.toggle("reserved", !!v);
        });

        // Edit slot
        td.addEventListener("click", async () => {
          const ref = db.ref(`rooms/${room}/${iso}/${time}`);
          const current = (await ref.once("value")).val() || "";
          const val = prompt(
            `Enter reservation for ${room}\n${pretty(d)} ${time}:`,
            current
          );
          ref.set(val || "");
        });

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    roomTable.appendChild(table);
  }

  // --- Date picker change (jump to that week) ---
  datePicker.addEventListener("change", () => {
    startDate = datePicker.value;
    loadWeek();
  });

  // --- Week shifting ---
  function shiftWeek(offset) {
    const d = getMonday(toDate(startDate));
    d.setDate(d.getDate() + offset * 7);
    startDate = toISO(d);
    loadWeek();
  }

  prevBtn.addEventListener("click", () => shiftWeek(-1));
  nextBtn.addEventListener("click", () => shiftWeek(1));

  // --- Home ---
  homeBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // Initial load
  loadWeek();
});
