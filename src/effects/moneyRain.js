// Simple confetti-style dollar rain
export function startMoneyRain({
  durationMs = 2500,
  count = 40,
  areaSelector = "body", // where to append the bills
} = {}) {
  const root = document.querySelector(areaSelector) || document.body;
  const container = document.createElement("div");
  container.className = "money-rain";
  root.appendChild(container);

  for (let i = 0; i < count; i++) {
    const bill = document.createElement("div");
    bill.className = "money-bill";
    bill.textContent = "💵"; // could swap to SVG later
    const startX = Math.random() * 100;           // vw
    const rot = (Math.random() * 60 - 30).toFixed(0);
    const delay = Math.random() * 0.8;            // s
    const time = 2.2 + Math.random() * 1.2;       // s

    bill.style.left = `${startX}vw`;
    bill.style.animationDelay = `${delay}s`;
    bill.style.animationDuration = `${time}s`;
    bill.style.setProperty("--rot", `${rot}deg`);
    container.appendChild(bill);
  }

  setTimeout(() => {
    container.remove();
  }, durationMs + 1000);
}
