document.addEventListener("DOMContentLoaded", function () {
  // --- Read URL parameters ---
  const url = new URL(window.location.href);
  const room = url.searchParams.get("room");
  let startDate = url.searchParams.get("date"); // clicking from index loads this

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

  function toDate(iso) {
    return new Date(iso + "T00:00:00");
  }

  function toISO(d) {
    return d.toLocaleDateString("en-CA");
  }

  // --- Get Monday for a given date ---
  function getMonday(d) {
    const day = d.getDay(); // 0=Sun 1=Mon...
    const diff = day === 0 ? -6 : 1 - day; 
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    return monday;
  }

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
  function formatDisplayTime(time) {
  let [h, m] = time.split(":").map(Number);

  if (h < 13) return time; // Keep normal morning format

  const pmHour = h - 12;
  return m === 0 ? `${pmHour} PM` : `${pmHour}:${String(m).padStart(2,"0")} PM`;
}

  // -------------------------------------------------------------
  // Main Render - Week View
  // -------------------------------------------------------------
  function loadWeek() {
    const monday = getMonday(toDate(startDate));
    const week = buildWeek(monday);

    roomTitle.textContent = `${room} — Week of ${pretty(monday)}`;
    datePicker.value = toISO(monday);

    roomTable.innerHTML = "";

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    // Header
    const trHead = document.createElement("tr");
    const thTime = document.createElement("th");
    thTime.textContent = "Time";
    trHead.appendChild(thTime);

    week.forEach((d, colIndex) => {
      const th = document.createElement("th");
      th.textContent = pretty(d);
      trHead.appendChild(th);
    });

    thead.appendChild(trHead);
    table.appendChild(thead);

    // Body rows
    times.forEach((time, rowIndex) => {
      const tr = document.createElement("tr");

      const tdTime = document.createElement("td");
      tdTime.textContent = formatDisplayTime(time);
      tr.appendChild(tdTime);

      week.forEach((d, colIndex) => {
        const iso = toISO(d);
        const td = document.createElement("td");
        td.className = "slotCell";
        td.dataset.room = room;
        td.dataset.date = iso;
        td.dataset.time = time;
        td.dataset.row = rowIndex;
        td.dataset.col = colIndex + 1; // +1 because col 0 is time column

        td.textContent = "...";

        // Live update from Firebase
        db.ref(`rooms/${room}/${iso}/${time}`).on("value", (snap) => {
          const v = snap.val();
          td.textContent = v || "";
          td.classList.toggle("reserved", !!v);
        });

        // Single-cell edit
        td.addEventListener("click", async () => {
          const ref = db.ref(`rooms/${room}/${iso}/${time}`);
          const current = (await ref.once("value")).val() || "";
          const val = prompt(`Enter reservation for ${room}\n${pretty(d)} ${time}:`, current);
          ref.set(val || "");
        });

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    roomTable.appendChild(table);
  }

  // --- Date picker jump ---
  datePicker.addEventListener("change", () => {
    startDate = datePicker.value;
    loadWeek();
  });

  // --- Week navigation ---
  function shiftWeek(offset) {
    const d = getMonday(toDate(startDate));
    d.setDate(d.getDate() + offset * 7);
    startDate = toISO(d);
    loadWeek();
  }

  prevBtn.addEventListener("click", () => shiftWeek(-1));
  nextBtn.addEventListener("click", () => shiftWeek(1));

  homeBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // -------------------------------------------------------------
  // DRAG SELECT + BULK EDIT (rectangle-based)
  // -------------------------------------------------------------
  let isSelecting = false;
  let startCell = null;
  let selectedCells = new Set();

  function clearSelection() {
    selectedCells.forEach(td => td.classList.remove("selectedCell"));
    selectedCells.clear();
  }

  function getPos(td) {
    return {
      row: Number(td.dataset.row),
      col: Number(td.dataset.col)
    };
  }

  function inRange(x, a, b) {
    return x >= Math.min(a, b) && x <= Math.max(a, b);
  }

  function updateSelection(currentCell) {
    clearSelection();

    const s = getPos(startCell);
    const e = getPos(currentCell);

    document.querySelectorAll(".slotCell").forEach(td => {
      const p = getPos(td);
      if (inRange(p.row, s.row, e.row) && inRange(p.col, s.col, e.col)) {
        td.classList.add("selectedCell");
        selectedCells.add(td);
      }
    });
  }

  // Start drag
  document.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("slotCell")) {
      isSelecting = true;
      startCell = e.target;
      updateSelection(e.target);
      e.preventDefault();
    }
  });

  // Move drag
  document.addEventListener("mousemove", (e) => {
    if (!isSelecting) return;
    if (e.target.classList.contains("slotCell")) {
      updateSelection(e.target);
    }
  });

  // End drag → bulk edit
  document.addEventListener("mouseup", async () => {
    if (isSelecting && selectedCells.size > 1) {
      const val = prompt(`Set value for ${selectedCells.size} slots:`);
      if (val !== null) {
        for (let td of selectedCells) {
          const { room, date, time } = td.dataset;
          db.ref(`rooms/${room}/${date}/${time}`).set(val);
        }
      }
    }

    clearSelection();
    isSelecting = false;
  });

  // Initial load
  loadWeek();
});
