// render.js — Refactored Card Renderer with Types, Moves, EVs & IVs

/**
 * Renders a complete Pokémon card into #card-preview.
 * @param {object} data – Pokémon data from API (with data.stats[], data.types[], data.abilities[]).
 * @param {object} options – Rendering options: { nature, ability, item, moves[], evs, ivs, accent, shiny }.
 */
export async function renderCard(data, options) {
    const {
      nature = '',
      ability = '',
      item = '',
      moves = [],
      evs = {},        // { hp, attack, defense, 'special-attack', 'special-defense', speed }
      ivs = {},        // same keys, values 0–31
      accent = '#f97316',
      shiny = false
    } = options;
  
    const card = document.getElementById('card-preview');
    if (!card || !data) return;
    card.innerHTML = '';
    // Set accent color globally and on card
    document.documentElement.style.setProperty('--accent-color', accent);
    card.style.setProperty('--accent-color', accent);
  
    // --- Natures List ---
    const natures = [
      { name: "Hardy",    up: null,              down: null },
      { name: "Lonely",   up: "attack",          down: "defense" },
      { name: "Brave",    up: "attack",          down: "speed" },
      { name: "Adamant",  up: "attack",          down: "special-attack" },
      { name: "Naughty",  up: "attack",          down: "special-defense" },
      { name: "Bold",     up: "defense",         down: "attack" },
      { name: "Docile",   up: null,              down: null },
      { name: "Relaxed",  up: "defense",         down: "speed" },
      { name: "Impish",   up: "defense",         down: "special-attack" },
      { name: "Lax",      up: "defense",         down: "special-defense" },
      { name: "Timid",    up: "speed",           down: "attack" },
      { name: "Hasty",    up: "speed",           down: "defense" },
      { name: "Serious",  up: null,              down: null },
      { name: "Jolly",    up: "speed",           down: "special-attack" },
      { name: "Naive",    up: "speed",           down: "special-defense" },
      { name: "Modest",   up: "special-attack",  down: "attack" },
      { name: "Mild",     up: "special-attack",  down: "defense" },
      { name: "Quiet",    up: "special-attack",  down: "speed" },
      { name: "Bashful",  up: null,              down: null },
      { name: "Rash",     up: "special-attack",  down: "special-defense" },
      { name: "Calm",     up: "special-defense", down: "attack" },
      { name: "Gentle",   up: "special-defense", down: "defense" },
      { name: "Sassy",    up: "special-defense", down: "speed" },
      { name: "Careful",  up: "special-defense", down: "special-attack" },
      { name: "Quirky",   up: null,              down: null }
    ];
  
    // --- Stat Label Mapping ---
    const statShort = {
      hp: 'HP', attack: 'Atk', defense: 'Def',
      'special-attack': 'SpA', 'special-defense': 'SpD', speed: 'Spe'
    };
  
    // --- Nature Effects ---
    const natureData = natures.find(n => n.name === nature) || {};
    const upKey = natureData.up;
    const downKey = natureData.down;
  
    // --- Top: Sprite & Name ---
    const top = document.createElement('div');
    top.className = 'card-top';
    top.innerHTML = `
      <img src="${data.sprite}" alt="${data.name}" class="pokemon-sprite">
      <h2 class="pokemon-name">${data.name}</h2>
    `;
  
    // --- Types ---
    const typesEl = document.createElement('div');
    typesEl.className = 'type-container';
    data.types.forEach(type => {
      const pill = document.createElement('span');
      pill.className = `pill type-${type.toLowerCase()}`;
      pill.textContent = type;
      typesEl.appendChild(pill);
    });
  
    // --- Ability ---
    const abilityEl = document.createElement('div');
    abilityEl.className = 'info-group';
    abilityEl.innerHTML = `
      <h3>Ability</h3>
      <span class="pill">${ability || data.abilities[0]}</span>
    `;
  
    // --- Held Item ---
    const itemEl = document.createElement('div');
    itemEl.className = 'info-group';
    itemEl.innerHTML = `
      <h3>Held Item</h3>
      <span>${item || 'None'}</span>
    `;
  
    // --- Moves (with type coloring) ---
    const movesEl = document.createElement('div');
    movesEl.className = 'info-group';
    movesEl.innerHTML = '<h3>Moves</h3>';
    const moveList = document.createElement('div');
    moveList.className = 'move-list';
    // Fetch move details in parallel
    const moveData = await Promise.all(moves.map(async mv => {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/move/${mv.toLowerCase().replace(/ /g,'-')}`);
        const json = res.ok ? await res.json() : null;
        return json;
      } catch {
        return null;
      }
    }));
    moveData.forEach((md, i) => {
      const mv = moves[i];
      if (!mv) return;
      const span = document.createElement('span');
      const type = md?.type?.name || 'normal';
      span.className = `pill move-pill type-${type}`;
      span.textContent = mv;
      moveList.appendChild(span);
    });
    movesEl.appendChild(moveList);
  
    // --- Stats with EVs & IVs ---
    const statsEl = document.createElement('div');
    statsEl.className = 'stat-section';
  
    data.stats.forEach((s, i) => {
      const key = s.stat.name;
      const base = s.base_stat;
      const ev = evs[key] || 0;
      const iv = ivs[key] || 0;
      const mod = key === upKey ? '+' : key === downKey ? '−' : '';
  
      // Row container
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
      setTimeout(() => { fill.style.width = `${pct}%`; }, 100 * (i + 1));
      barC.appendChild(fill);
  
      // Base stat value
      const baseEl = document.createElement('span');
      baseEl.className = 'stat-value';
      baseEl.textContent = base;
  
      // EV/IV display
      const evivEl = document.createElement('span');
      evivEl.className = 'stat-eviv';
      evivEl.textContent = `EV:${ev} IV:${iv}`;
  
      // Assemble row
      row.append(label, barC, baseEl, evivEl);
      statsEl.appendChild(row);
    });
  
    // --- Final Mount ---
    [top, typesEl, abilityEl, itemEl, movesEl, statsEl]
      .forEach(el => card.appendChild(el));
  }
  
  /**
   * Returns one of the franchise-based color-tier classes
   * based on the base stat value.
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
  