// Reports.js - counts things up and draws simple bars (no chart library needed)

// turns a list into { label: count }, using keyFn to pick the label
function countBy(list, keyFn) {
  const counts = {};
  list.forEach(item => {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

function drawBars(elementId, counts) {
  const container = document.getElementById(elementId);
  const entries = Object.entries(counts);
  const biggest = Math.max(...entries.map(([, n]) => n), 1);

  if (entries.length === 0) {
    container.innerHTML = `<p class="cell-sub">Nothing to show yet.</p>`;
    return;
  }

  container.innerHTML = entries.map(([label, count]) => `
    <div class="bar-row">
      <span>${label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(count / biggest) * 100}%"></div></div>
      <span class="bar-count">${count}</span>
    </div>
  `).join("");
}

drawBars("speciesBars",     countBy(AdminData.pets, p => p.species));
drawBars("appointmentBars", countBy(AdminData.appointments, a => a.status[0].toUpperCase() + a.status.slice(1)));
drawBars("vaccineBars",     countBy(AdminData.vaccinations, v => getVaccineStatus(v.next_due).label));
drawBars("articleBars",     countBy(AdminData.articles, a => a.category));
