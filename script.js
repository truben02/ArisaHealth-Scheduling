document.addEventListener("DOMContentLoaded", function () {
  // --- Rooms ---
  const rooms = ["RB 1", "RB 2", "RB 3", "RB 4", "RB 5", "RB 8", "BR Group Room","BN 129"];

  const datePicker = document.getElementById("datePicker");
  const todayBtn = document.getElementById("todayBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const roomsContainer = document.getElementById("rooms");
  const currentDayDiv = document.getElementById("currentDay");

  // --- Format date as "Monday MM/DD" ---
  function formatPretty(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
    const md = d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
    return `${weekday} ${md}`;
  }

  // --- Time slots ---
  const times = [];
  for (let h = 8; h <= 17; h++) {
    for (let m of [0, 15, 30, 45]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      times.push(`${hh}:${mm}`);
    }
  }
  function formatDisplayTime(time) {
  let [h, m] = time.split(":").map(Number);

  if (h < 13) return time; // Keep normal morning format

  const pmHour = h - 12;
  return m === 0 ? `${pmHour} PM` : `${pmHour}:${String(m).padStart(2,"0")} PM`;
}

  // --- Load a specific day ---
  function loadDay() {
    const date = datePicker.value;
    if (!date) return;

    // Update formatted day label
    currentDayDiv.textContent = formatPretty(date);

    roomsContainer.innerHTML = "";

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    // Header row
    const headRow = document.createElement("tr");
    const thTime = document.createElement("th");
    thTime.textContent = "Time";
    headRow.appendChild(thTime);

    rooms.forEach((room, colIndex) => {
      const th = document.createElement("th");
      th.innerHTML = `<a href="room.html?room=${encodeURIComponent(room)}&date=${date}">${room}</a>`;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);

    // Body rows
    times.forEach((time, rowIndex) => {
      const tr = document.createElement("tr");

      // Time column
      const tdTime = document.createElement("td");
      tdTime.textContent = formatDisplayTime(time);
      tr.appendChild(tdTime);

      rooms.forEach((room, colIndex) => {
        const td = document.createElement("td");
        td.className = "slotCell";
        td.dataset.room = room;
        td.dataset.date = date;
        td.dataset.time = time;
        td.dataset.row = rowIndex;
        td.dataset.col = colIndex + 1;

        // Firebase realtime
        db.ref(`rooms/${room}/${date}/${time}`).on("value", (snap) => {
          const v = snap.val();
          td.textContent = v || "";
          td.classList.toggle("reserved", !!v);
        });

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    roomsContainer.appendChild(table);
  }

  // --- Shift day safely ---
  function shiftDay(days) {
    const d = new Date(datePicker.value + "T00:00:00");

    datePicker.removeEventListener("change", loadDay);

    d.setDate(d.getDate() + days);
    datePicker.value = d.toLocaleDateString("en-CA");

    datePicker.addEventListener("change", loadDay);

    loadDay();
  }

  // --- Event listeners ---
  prevBtn.addEventListener("click", () => shiftDay(-1));
  nextBtn.addEventListener("click", () => shiftDay(1));
  datePicker.addEventListener("change", loadDay);

  todayBtn.addEventListener("click", () => {
    const today = new Date();
    datePicker.value = today.toLocaleDateString("en-CA");
    loadDay();
  });

  // --- Initialize ---
  datePicker.value = new Date().toLocaleDateString("en-CA");
  loadDay();


  // -----------------------------------------
  // DRAG SELECT + BULK EDIT
  // -----------------------------------------
  let isSelecting = false;
  let startCell = null;
  let selectedCells = new Set();

  function clearSelection() {
    selectedCells.forEach(td => td.classList.remove("selectedCell"));
    selectedCells.clear();
  }

  function getPosition(td) {
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
    const start = getPosition(startCell);
    const end = getPosition(currentCell);

    document.querySelectorAll(".slotCell").forEach(td => {
      const pos = getPosition(td);
      if (inRange(pos.row, start.row, end.row) &&
          inRange(pos.col, start.col, end.col)) {
        td.classList.add("selectedCell");
        selectedCells.add(td);
      }
    });
  }

  document.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("slotCell")) {
      isSelecting = true;
      startCell = e.target;
      updateSelection(e.target);
      e.preventDefault();
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (!isSelecting) return;
    if (e.target.classList.contains("slotCell")) {
      updateSelection(e.target);
    }
  });

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
});
