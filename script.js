document.addEventListener("DOMContentLoaded", function() {
  // --- Room setup ---
  const rooms = ["RB 1","RB 2","RB 3","RB 4","RB 5","RB 8","BR Group Room"];

  const datePicker = document.getElementById('datePicker');
  const todayBtn = document.getElementById('todayBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const roomsContainer = document.getElementById('rooms');

  // -------------------------------
  // Helper: Format date as YYYY-MM-DD
  // -------------------------------
  function toISO(d) {
    return d.toLocaleDateString('en-CA');
  }

  // -------------------------------
  // Navigation buttons
  // -------------------------------
  todayBtn.addEventListener('click', () => {
    const today = new Date();
    datePicker.value = toISO(today);
    loadDay();
  });

  prevBtn.addEventListener('click', () => {
    const d = new Date(datePicker.value);
    d.setDate(d.getDate() - 1);
    datePicker.value = toISO(d);
    loadDay();
  });

  nextBtn.addEventListener('click', () => {
    const d = new Date(datePicker.value);
    d.setDate(d.getDate() + 1);
    datePicker.value = toISO(d);
    loadDay();
  });

  datePicker.addEventListener('change', loadDay);

  // -------------------------------
  // Build times (08:00 → 17:45 every 15 mins)
  // -------------------------------
  const times = [];
  for (let h = 8; h <= 17; h++) {
    for (let m of [0,15,30,45]) {
      const hh = String(h).padStart(2,'0');
      const mm = String(m).padStart(2,'0');
      times.push(`${hh}:${mm}`);
    }
  }

  // -------------------------------
  // Load selected day
  // -------------------------------
  function loadDay() {
    const date = datePicker.value;
    if (!date) return;

    roomsContainer.innerHTML = '';

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Header row
    const trHead = document.createElement('tr');
    const thTime = document.createElement('th');
    thTime.textContent = "Time";
    trHead.appendChild(thTime);

    rooms.forEach(room => {
      const th = document.createElement('th');
      th.innerHTML = `<a href="room.html?room=${encodeURIComponent(room)}&date=${date}">${room}</a>`;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    // Rows
    times.forEach(time => {
      const tr = document.createElement('tr');

      const tdTime = document.createElement('td');
      tdTime.textContent = time;
      tr.appendChild(tdTime);

      rooms.forEach(room => {
        const td = document.createElement('td');
        td.className = 'slotCell';
        td.dataset.room = room;
        td.dataset.date = date;
        td.dataset.time = time;
        td.textContent = '...';

        // Realtime subscription
        db.ref(`rooms/${room}/${date}/${time}`).on('value', snap => {
          const v = snap.val();
          td.textContent = v || '';
          td.classList.toggle('reserved', !!v);
        });

        // Click → edit reservation
        td.addEventListener('click', async () => {
          const current = (await db.ref(`rooms/${room}/${date}/${time}`).once('value')).val() || '';
          const val = prompt(`Enter reservation for ${room} ${date} ${time}:`, current);
          db.ref(`rooms/${room}/${date}/${time}`).set(val || '');
        });

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    roomsContainer.appendChild(table);
  }

  // -------------------------------
  // Initialize default date
  // -------------------------------
  const today = new Date();
  datePicker.value = toISO(today);
  loadDay();
});
