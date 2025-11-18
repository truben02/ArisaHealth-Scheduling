document.addEventListener("DOMContentLoaded", function() {
  // --- Room setup ---
  const rooms = ["Room A","Room B","Room C","Room D","Room E","Room F","Room G"];

  const datePicker = document.getElementById('datePicker');
  const todayBtn = document.getElementById('todayBtn');
  const roomsContainer = document.getElementById('rooms');

  // --- Set today button ---
  todayBtn.addEventListener('click', () => {
    const iso = new Date().toISOString().slice(0,10);
    datePicker.value = iso;
    loadDay();
  });

  // --- Date picker change ---
  datePicker.addEventListener('change', loadDay);

  // --- Build times (08:00 to 17:45 in 15-min increments) ---
  const times = [];
  for (let h = 8; h <= 17; h++) {
    for (let m of [0,15,30,45]) {
      const hh = String(h).padStart(2,'0');
      const mm = String(m).padStart(2,'0');
      times.push(`${hh}:${mm}`);
    }
  }

  // --- Load selected day ---
  function loadDay() {
    const date = datePicker.value;
    if (!date) return;
    roomsContainer.innerHTML = '';

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Header row: first column empty, then room names
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

    // Table rows: one row per time
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

        // Click to add/edit reservation
        td.addEventListener('click', async () => {
          const current = (await db.ref(`rooms/${room}/${date}/${time}`).once('value')).val() || '';
          const val = prompt(`Enter reservation name / note for ${room} ${date} ${time}:`, current);
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

  // --- Initialize with today ---
  datePicker.value = new Date().toISOString().slice(0,10);
  loadDay();
});
