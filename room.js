document.addEventListener("DOMContentLoaded", function () {
  // --- Read URL parameters ---
  const url = new URL(window.location.href);
  const room = url.searchParams.get("room");
  let date = url.searchParams.get("date");

  const roomTitle = document.getElementById("roomTitle");
  const datePicker = document.getElementById("datePicker");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const homeBtn = document.getElementById("homeBtn");
  const roomTable = document.getElementById("roomTable");

  if (!room || !date) {
    roomTitle.textContent = "Missing room or date";
    return;
  }

  // --- Format date as "Monday MM/DD" ---
  function formatPretty(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
    const md = d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
    return `${weekday} ${md}`;
  }

  // --- Build times ---
  const times = [];
  for (let h = 8; h <= 17; h++) {
    for (let m of [0, 15, 30, 45]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      times.push(`${hh}:${mm}`);
    }
  }

  // --- Render room table ---
  function loadDay() {
    roomTitle.textContent = `${room} — ${formatPretty(date)}`;
    datePicker.value = date;

    roomTable.innerHTML = "";

    const table = document.createElement("table");
    const tbody = document.createElement("tbody");

    times.forEach((time) => {
      const tr = document.createElement("tr");

      const tdTime = document.createElement("td");
      tdTime.textContent = time;
      tr.appendChild(tdTime);

      const tdVal = document.createElement("td");
      tdVal.className = "slotCell";
      tdVal.dataset.room = room;
      tdVal.dataset.date = date;
      tdVal.dataset.time = time;
      tdVal.textContent = "...";

      // Subscribe to realtime updates
      db.ref(`rooms/${room}/${date}/${time}`).on("value", (snap) => {
        const v = snap.val();
        tdVal.textContent = v || "";
        tdVal.classList.toggle("reserved", !!v);
      });

      // Click to edit slot
      tdVal.addEventListener("click", async () => {
        const current = (await db.ref(`rooms/${room}/${date}/${time}`).once("value")).val() || "";
        const val = prompt(`Enter reservation for ${room} ${date} ${time}:`, current);
        db.ref(`rooms/${room}/${date}/${time}`).set(val || "");
      });

      tr.appendChild(tdVal);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    roomTable.appendChild(table);
  }

  // --- Date selection ---
  datePicker.addEventListener("change", () => {
    date = datePicker.value;
    loadDay();
  });

  // --- Prev / Next day buttons ---
  function shiftDay(days) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + days);
    date = d.toLocaleDateString("en-CA");
    loadDay();
  }

  prevBtn.addEventListener("click", () => shiftDay(-1));
  nextBtn.addEventListener("click", () => shiftDay(1));

  // --- Home button ---
  homeBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // --- Initial load ---
  loadDay();
});
