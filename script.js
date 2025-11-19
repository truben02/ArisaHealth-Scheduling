document.addEventListener("DOMContentLoaded", function () {
  // --- Rooms ---
  const rooms = ["RB 1", "RB 2", "RB 3", "RB 4", "RB 5", "RB 8", "BR Group Room"];

  const datePicker = document.getElementById("datePicker");
  const todayBtn = document.getElementById("todayBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const roomsContainer = document.getElementById("rooms");

  // --- Time slots ---
  const times = [];
  for (let h = 8; h <= 17; h++) {
    for (let m of [0, 15, 30, 45]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      times.push(`${hh}:${mm}`);
    }
  }

  // --- Load a specific day ---
  function loadDay() {
    const date = datePicker.value;
    if (!date) return;

    roomsContainer.innerHTML = "";

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    // Header row
    const headRow = document.createElement("tr");
    const thTime = document.createElement("th");
    thTime.textContent = "Time";
    headRow.appendChild(thTime);

    rooms.forEach((room) => {
      const th = document.createElement("th");
      th.innerHTML = `<a href="room.html?room=${encodeURIComponent(room)}&date=${date}">${room}</a>`;
      headRow.appendChild(th);
    });

    thead.appendChild(headRow);

    // Body rows
    times.forEach((time) => {
      const tr = document.createElement("tr");

      // Time column
      const tdTime = document.createElement("td");
      tdTime.textContent = time;
      tr.appendChild(tdTime);

      // Room cells
      rooms.forEach((room) => {
        const td = document.createElement("td");
        td.className = "slotCell";
        td.dataset.room = room;
        td.dataset.date = date;
        td.dataset.time = time;

        // Subscribe to Firebase realtime
        db.ref(`rooms/${room}/${date}/${time}`).on("value", (snap) => {
          const v = snap.val();
          td.textContent = v || "";
          td.classList.toggle("reserved", !!v);
        });

        // Click to edit
        td.addEventListener("click", async () => {
          const current = (await db.ref(`rooms/${room}/${date}/${time}`).once("value")).val() || "";
          const val = prompt(`Enter reservation for ${room} ${date} ${time}:`, current);
          db.ref(`rooms/${room}/${date}/${time}`).set(val || "");
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
    const d = new Date(datePicker.value + "T00:00:00"); // local midnight

    // temporarily remove the change listener
    datePicker.removeEventListener("change", loadDay);

    d.setDate(d.getDate() + days);
    datePicker.value = d.toLocaleDateString("en-CA");

    // re-add the change listener
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
});
