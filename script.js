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
  function buildTimes() {
    const times = [];
    for (let h = 8; h <= 17; h++) {
      for (let m of [0,15,30,45]) {
        const hh = String(h).padStart(2,'0');
        const mm = String(m).padStart(2,'0');
        times.push(`${hh}:${mm}`);
      }
    }
    return times;
  }
  const times = buildTimes();

  // --- Load selected day ---
  function loadDay() {
    const date = datePicker.value;
    if (!date) return;
    roomsContainer.innerHTML = '';
    rooms.forEach(room => renderRoomForDate(room, date));
  }

  // --- Render a room table ---
  function renderRoomForDate(room, date) {
    const box = document.createElement('div');
    box.className = 'roomBox';

    const header = document.createElement('h2');
    header.innerHTML = `<a href="room.html?room=${encodeURIComponent(room)}&date=${date}">${room}</a> — ${date}`;
    box.appendChild(header);

    const table = document.createElement('table');
    const tbody = document.createElement('tbody');

    times.forEach(time => {
      const tr = document.createElement('tr');

      const tdTime = document.createElement('td');
      tdTime.textContent = time;
      tr.appendChild(tdTime);

      const tdVal = document.createElement('td');
      tdVal.className = 'slotCell';
      tdVal.dataset.room = room;
      tdVal.dataset.date = date;
      tdVal.dataset.time = time;
      tdVal.textContent = '...';

      // --- Subscribe to Firebase realtime value ---
      db.ref(`rooms/${room}/${date}/${time}`).on('value', snap => {
        const v = snap.val();
        tdVal.textContent = v || '';
        tdVal.classList.toggle('reserved', !!v);
      });

      // --- Click to add/edit reservation ---
      tdVal.addEventListener('click', async () => {
        const current = (await db.ref(`rooms/${room}/${date}/${time}`).once('value')).val() || '';
        const val = prompt(`Enter reservation name / note for ${room} ${date} ${time}:`, current);
        db.ref(`rooms/${room}/${date}/${time}`).set(val || '');
      });

      tr.appendChild(tdVal);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    box.appendChild(table);
    roomsContainer.appendChild(box);
  }

  // --- Initialize with today ---
  const isoToday = new Date().toISOString().slice(0,10);
  datePicker.value = isoToday;
  loadDay();
});
