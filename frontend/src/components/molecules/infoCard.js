import "/src/styles/molecules/infoCard.css";

export function infoCard({ icon, title, children }) {
  return `
    <div class="info-card">
      <div class="info-card-header">
        <i data-lucide="${icon}"></i>
        <h3>${title}</h3>
      </div>
      <div class="info-card-body">
        ${children}
      </div>
    </div>
  `;
}

export function addressCard({ address }) {
  return infoCard({
    icon: "map-pin",
    title: "Dirección",
    children: `<p class="info-card-text">${address}</p>`,
  });
}

export function scheduleCard({ schedule }) {
  const statusBadge = schedule.isOpenNow
    ? `<span class="schedule-badge schedule-badge--open">Abierto ahora</span>`
    : `<span class="schedule-badge schedule-badge--closed">Cerrado</span>`;

  const hoursHtml = schedule.hours
    .map(
      (item) => `
      <div class="schedule-row">
        <span class="schedule-day">${item.day}</span>
        <span class="schedule-time">${item.time}</span>
      </div>
    `
    )
    .join("");

  return infoCard({
    icon: "clock",
    title: "Horario",
    children: `
      ${statusBadge}
      <div class="schedule-hours">${hoursHtml}</div>
    `,
  });
}
