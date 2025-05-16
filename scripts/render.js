// render.js — Refactored Card Renderer with full helpers

// ————————————————————————————————————————
// 📦 Helpers
// ————————————————————————————————————————

/**
 * Capitalize a string
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Map a base stat value to the franchise color tier
 */
function getFranchiseColor(val) {
  if (val >= 150) return 'ultra';
  if (val >= 130) return 'very-high';
  if (val >= 110) return 'high';
  if (val >=  90) return 'mid';
  if (val >=  70) return 'low';
  if (val >=  50) return 'very-low';
  return 'terrible';
}

// ————————————————————————————————————————
// 🎨 renderCard()
// ————————————————————————————————————————
export async function renderCard(data, options) {
  const {
    nature = '',
    ability = '',
    item = '',
    moves = [],
    evs = {},
    ivs = {},
    accent = '#f97316',
    shiny = false
  } = options;

  const card = document.getElementById('card-preview');
  if (!card || !data) return;

  // Clear previous content and set accent
  card.innerHTML = '';
  document.documentElement.style.setProperty('--accent-color', accent);
  card.style.setProperty('--accent-color', accent);

  // Nature definitions
  const natures = [
    { name: "Hardy", up: null, down: null },
    { name: "Lonely", up: "attack", down: "defense" },
    { name: "Brave", up: "attack", down: "speed" },
    { name: "Adamant", up: "attack", down: "special-attack" },
    { name: "Naughty", up: "attack", down: "special-defense" },
    { name: "Bold", up: "defense", down: "attack" },
    { name: "Docile", up: null, down: null },
    { name: "Relaxed", up: "defense", down: "speed" },
    { name: "Impish", up: "defense", down: "special-attack" },
    { name: "Lax", up: "defense", down: "special-defense" },
    { name: "Timid", up: "speed", down: "attack" },
    { name: "Hasty", up: "speed", down: "defense" },
    { name: "Serious", up: null, down: null },
    { name: "Jolly", up: "speed", down: "special-attack" },
    { name: "Naive", up: "speed", down: "special-defense" },
    { name: "Modest", up: "special-attack", down: "attack" },
    { name: "Mild", up: "special-attack", down: "defense" },
    { name: "Quiet", up: "special-attack", down: "speed" },
    { name: "Bashful", up: null, down: null },
    { name: "Rash", up: "special-attack", down: "special-defense" },
    { name: "Calm", up: "special-defense", down: "attack" },
    { name: "Gentle", up: "special-defense", down: "defense" },
    { name: "Sassy", up: "special-defense", down: "speed" },
    { name: "Careful", up: "special-defense", down: "special-attack" },
    { name: "Quirky", up: null, down: null }
  ];

  // Stat labels
  const statShort = {
    hp: 'HP', attack: 'Atk', defense: 'Def',
    'special-attack': 'SpA', 'special-defense': 'SpD', speed: 'Spe'
  };

  // Find the chosen nature
  const natureData = natures.find(n => n.name === nature) || {};
  const upKey = natureData.up;
  const downKey = natureData.down;

  // ─── Top: Sprite & Name
  const top = document.createElement('div');
  top.className = 'card-top';
  top.innerHTML = `
    <img src="${data.sprite}" alt="${data.name}" class="pokemon-sprite">
    <h2 class="pokemon-name">${data.name}</h2>
  `;

  // ─── Types
  const typesEl = document.createElement('div');
  typesEl.className = 'type-container';
  data.types.forEach(type => {
    const pill = document.createElement('span');
    pill.className = `pill type-${type.toLowerCase()}`;
    pill.textContent = type;
    typesEl.appendChild(pill);
  });

  // ─── Ability
  const abilityEl = document.createElement('div');
  abilityEl.className = 'info-group';
  abilityEl.innerHTML = `
    <h3>Ability</h3>
    <span class="pill">${ability || data.abilities[0]}</span>
  `;

  // ─── Held Item
  const itemEl = document.createElement('div');
  itemEl.className = 'info-group';
  itemEl.innerHTML = `
    <h3>Held Item</h3>
    <span>${item || 'None'}</span>
  `;

  // ─── Moves (only valid ones)
  const movesEl = document.createElement('div');
  movesEl.className = 'info-group';
  movesEl.innerHTML = '<h3>Moves</h3>';
  const moveList = document.createElement('div');
  moveList.className = 'move-list';

  // Fetch move details
  const moveData = await Promise.all(
    moves.map(mv =>
      fetch(`https://pokeapi.co/api/v2/move/${mv.toLowerCase().replace(/ /g,'-')}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    )
  );

  moveData.forEach(md => {
    if (!md || !md.name) return;
    const mv = capitalize(md.name.replace(/-/g,' '));
    const span = document.createElement('span');
    span.className = `pill move-pill type-${md.type.name}`;
    span.textContent = mv;
    moveList.appendChild(span);
  });
  movesEl.appendChild(moveList);

  // ─── Stats + EV/IV
  const statsEl = document.createElement('div');
  statsEl.className = 'stat-section';

  data.stats.forEach((s, i) => {
    const key = s.stat.name;
    const base = s.base_stat;
    const ev = evs[key] || 0;
    const iv = ivs[key] || 31;
    const mod = key === upKey ? '+' : key === downKey ? '−' : '';

    // Row
    const row = document.createElement('div');
    row.className = 'stat-row';

    // Label
    const label = document.createElement('span');
    label.className = 'stat-name';
    label.innerHTML = `${statShort[key]}${mod ? `<span class="mod">${mod}</span>` : ''}`;

    // Bar container
    const barC = document.createElement('div');
    barC.className = 'stats-bar-container';

    // Fill
    const fill = document.createElement('div');
    fill.className = `stats-bar ${getFranchiseColor(base)}`;
    const pct = (base / 150 * 100).toFixed(1);
    fill.dataset.width = `${pct}%`;
    fill.style.width = '0%';
    setTimeout(() => fill.style.width = `${pct}%`, 100 * (i + 1));
    barC.appendChild(fill);

    // Base value
    const baseEl = document.createElement('span');
    baseEl.className = 'stat-value';
    baseEl.textContent = base;

    // EV/IV text
    const evivEl = document.createElement('span');
    evivEl.className = 'stat-eviv';
    evivEl.textContent = `EV:${ev} IV:${iv}`;

    // Assemble
    row.append(label, barC, baseEl, evivEl);
    statsEl.appendChild(row);
  });

  // ─── Append everything
  [top, typesEl, abilityEl, itemEl, movesEl, statsEl].forEach(el => card.appendChild(el));
}
