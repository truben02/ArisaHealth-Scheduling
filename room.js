document.addEventListener("DOMContentLoaded", function() {
  const params = new URLSearchParams(window.location.search);
  const room = params.get('room') || "Room A";

  const roomTitle = document.getElementById("roomTitle");
  const weekContainer = document.getElementById("weekContainer");
  const prevWeekBtn = document.getElementById("prevWeek");
  const nextWeekBtn = document.getElementById("nextWeek");

  roomTitle.textContent = `${room} — Weekly View`;

  const times = [];
  for (let h = 8; h <= 17; h++) {
    for (let m of [0,15,30,45]) {
      const hh = String(h).padStart(2,'0');
      const mm = String(m).padStart(2,'0');
      times.push(`${hh}:${mm}`);
    }
  }

  let currentMonday = getMonday(new Date(params.get('date') || new Date()));

  prevWeekBtn.addEventListener('click', () => {
    currentMonday.setDate(currentMonday.getDate() - 7);
    renderWeek();
  });

  nextWeekBtn.addEventListener('click', () => {
    currentMonday.setDate(currentMonday.getDate() + 7);
    renderWeek();
  });

  function getMonday(d) {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  function renderWeek() {
    weekContainer.innerHTML = '';
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Header row: times + dates
    const trHead = document.createElement('tr');
    const thEmpty = document.createElement('th');
    thEmpty.textContent = 'Time';
    trHead.appendChild(thEmpty);

    const dates = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(currentMonday);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0,10);
      dates.push(iso);
      const th = document.createElement('th');
      th.textContent = iso;
      trHead.appendChild(th);
    }
    thead.appendChild(trHead);

    // Table rows: each time slot
    times.forEach(time => {
      const tr = document.createElement('tr');
      const tdTime = document.createElement('td');
      tdTime.textContent = time;
      tr.appendChild(tdTime);

      dates.forEach(date => {
        const tdVal = document.createElement('td');
        tdVal.className = 'slotCell';
        tdVal.textContent = '...';

        // Realtime subscription
        db.ref(`rooms/${room}/${date}/${time}`).on('value', snap => {
          const v = snap.val();
          tdVal.textContent = v || '';
          tdVal.classList.toggle('reserved', !!v);
        });

        tdVal.addEventListener('click', async () => {
          const current = (await db.ref(`rooms/${room}/${date}/${time}`).once('value')).val() || '';
          const val = prompt(`Enter reservation name / note for ${room} ${date} ${time}:`, current);
          db.ref(`rooms/${room}/${date}/${time}`).set(val || '');
        });

        tr.appendChild(tdVal);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    weekContainer.appendChild(table);
  }

  renderWeek();
});
