// room.js
function getQueryParam(name) {
  const url = new URL(location.href);
  return url.searchParams.get(name);
}
const room = getQueryParam('room') || 'Room A';
let dateParam = getQueryParam('date');
let monday = dateParam ? getMonday(dateParam) : getMonday(new Date());

document.getElementById('title').textContent = `${room} — week of ${monday.toDateString()}`;

document.getElementById('prev').addEventListener('click', () => {
  monday.setDate(monday.getDate() - 7);
  renderWeek();
});
document.getElementById('next').addEventListener('click', () => {
  monday.setDate(monday.getDate() + 7);
  renderWeek();
});

const times = (() => {
  const arr = [];
  for (let h=8; h<=17; h++) for (let m of [0,15,30,45]) arr.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
  return arr;
})();

function getMonday(d) {
  const D = new Date(d);
  const day = D.getDay();
  const diff = D.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(D.setDate(diff));
}

function renderWeek() {
  document.getElementById('title').textContent = `${room} — week of ${monday.toDateString()}`;
  const container = document.getElementById('week');
  container.innerHTML = '';
  const days = [];
  for (let i=0;i<5;i++) {
    const d = new Date(monday);
    d.setDate(d.getDate()+i);
    days.push(d);
  }

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.innerHTML = '<th>Time</th>' + days.map(d => `<th>${d.toDateString().slice(0,10)}</th>`).join('');
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  times.forEach(time => {
    const tr = document.createElement('tr');
    const tcell = document.createElement('td');
    tcell.textContent = time;
    tr.appendChild(tcell);

    days.forEach(d => {
      const dateID = d.toISOString().slice(0,10);
      const td = document.createElement('td');

      db.ref(`rooms/${room}/${dateID}/${time}`).on('value', snap => {
        td.textContent = snap.val() || '';
        td.classList.toggle('reserved', !!snap.val());
      });

      td.addEventListener('click', async () => {
        const cur = (await db.ref(`rooms/${room}/${dateID}/${time}`).once('value')).val() || '';
        const val = prompt(`Reservation for ${room} ${dateID} ${time}:`, cur);
        db.ref(`rooms/${room}/${dateID}/${time}`).set(val || '');
      });

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}
renderWeek();
