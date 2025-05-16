// form.js — Handles input events, data fetching, EV caps, and Showdown import/export

import { fetchPokemonData, fetchItemList } from './api.js';
import { renderCard } from './render.js';

// ————————————————————————————————————————
// 🌿 State & Debounce
// ————————————————————————————————————————
let debounceTimeout = null;
let currentPokemonData = null;

// Stat keys, matching data.stats[].stat.name
const STAT_KEYS = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed'
];

// ————————————————————————————————————————
// 🌱 Initialization
// ————————————————————————————————————————
export function initFormEvents() {
  // Primary Inputs
  const nameInput    = document.getElementById('pokemon-name');
  const natureInput  = document.getElementById('nature');
  const abilityInput = document.getElementById('ability');
  const itemInput    = document.getElementById('item');
  const shinyToggle  = document.getElementById('shiny');
  const accentInput  = document.getElementById('accent-color');

  // EV & IV inputs mapped by stat key
  const evInputs = {};
  const ivInputs = {};
  STAT_KEYS.forEach(key => {
    evInputs[key] = document.getElementById(`ev-${key}`);
    ivInputs[key] = document.getElementById(`iv-${key}`);
  });

  // Populate datalists and dropdowns
  populatePokemonList();
  populateMoveList();
  populateItemList();
  populateNatures();

  // Clamp EVs per‐stat and total
  STAT_KEYS.forEach(key => {
    const el = evInputs[key];
    if (!el) return;
    el.addEventListener('input', () => {
      let v = parseInt(el.value, 10) || 0;
      if (v > 252) v = 252;
      if (v < 0)   v = 0;
      // clamp total to 508
      const total = STAT_KEYS.reduce((sum, k) => sum + (parseInt(evInputs[k].value,10)||0), 0);
      if (total > 508) {
        const others = total - v;
        v = Math.max(0, 508 - others);
      }
      el.value = v;
      scheduleUpdate();
    });
  });

  // Gather all form controls
  const allInputs = [
    nameInput,
    natureInput,
    abilityInput,
    itemInput,
    shinyToggle,
    accentInput,
    ...Object.values(evInputs),
    ...Object.values(ivInputs),
    ...Array.from(document.querySelectorAll('.move-input'))
  ].filter(Boolean);

  // Attach debounced update listeners
  allInputs.forEach(el => el.addEventListener('input', scheduleUpdate));

  // Extra debounce on Pokémon name to limit API calls
  nameInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(updateCard, 400);
  });

  // Showdown import/export buttons
  document.getElementById('import-btn')
    .addEventListener('click', () => {
      const text = document.getElementById('showdown-io').value;
      const set  = parseShowdown(text);
      if (set) applySetToForm(set);
    });

  document.getElementById('export-btn-showdown')
    .addEventListener('click', () => {
      const txt = generateShowdown();
      document.getElementById('showdown-io').value = txt;
    });

  // Initial render
  updateCard();
}

function scheduleUpdate() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(updateCard, 100);
}

// ————————————————————————————————————————
// 🌾 Populate Helpers
// ————————————————————————————————————————
async function populatePokemonList() {
  try {
    const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000');
    const { results } = await res.json();
    document.getElementById('pokemon-list').innerHTML =
      results.map(p => `<option value="${capitalize(p.name)}">`).join('');
  } catch (err) {
    console.error('Failed to fetch Pokémon list:', err);
  }
}

async function populateMoveList() {
  try {
    const res = await fetch('https://pokeapi.co/api/v2/move?limit=10000');
    const { results } = await res.json();
    document.getElementById('move-list').innerHTML =
      results
        .map(m => `<option value="${capitalize(m.name.replace(/-/g, ' '))}">`)
        .join('');
  } catch (err) {
    console.error('Failed to fetch move list:', err);
  }
}

async function populateItemList() {
  try {
    const names = await fetchItemList();
    document.getElementById('item-list').innerHTML =
      names.map(n => `<option value="${n}">`).join('');
  } catch (err) {
    console.error('Failed to fetch item list:', err);
  }
}

const natures = [
  { name: 'Hardy',    up: null,              down: null },
  { name: 'Lonely',   up: 'attack',          down: 'defense' },
  { name: 'Brave',    up: 'attack',          down: 'speed' },
  { name: 'Adamant',  up: 'attack',          down: 'special-attack' },
  { name: 'Naughty',  up: 'attack',          down: 'special-defense' },
  { name: 'Bold',     up: 'defense',         down: 'attack' },
  { name: 'Docile',   up: null,              down: null },
  { name: 'Relaxed',  up: 'defense',         down: 'speed' },
  { name: 'Impish',   up: 'defense',         down: 'special-attack' },
  { name: 'Lax',      up: 'defense',         down: 'special-defense' },
  { name: 'Timid',    up: 'speed',           down: 'attack' },
  { name: 'Hasty',    up: 'speed',           down: 'defense' },
  { name: 'Serious',  up: null,              down: null },
  { name: 'Jolly',    up: 'speed',           down: 'special-attack' },
  { name: 'Naive',    up: 'speed',           down: 'special-defense' },
  { name: 'Modest',   up: 'special-attack',  down: 'attack' },
  { name: 'Mild',     up: 'special-attack',  down: 'defense' },
  { name: 'Quiet',    up: 'special-attack',  down: 'speed' },
  { name: 'Bashful',  up: null,              down: null },
  { name: 'Rash',     up: 'special-attack',  down: 'special-defense' },
  { name: 'Calm',     up: 'special-defense', down: 'attack' },
  { name: 'Gentle',   up: 'special-defense', down: 'defense' },
  { name: 'Sassy',    up: 'special-defense', down: 'speed' },
  { name: 'Careful',  up: 'special-defense', down: 'special-attack' },
  { name: 'Quirky',   up: null,              down: null }
];

function populateNatures() {
  document.getElementById('nature').innerHTML =
    natures.map(n => `<option value="${n.name}">${n.name}</option>`).join('');
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ————————————————————————————————————————
// 🔁 Update & Render
// ————————————————————————————————————————
async function updateCard() {
  const name = document.getElementById('pokemon-name').value.trim();
  if (!name) return;

  const shiny = document.getElementById('shiny').checked;
  let data = currentPokemonData;

  if (!data ||
      data.name.toLowerCase() !== name.toLowerCase() ||
      data.shiny !== shiny) {
    data = await fetchPokemonData(name, shiny);
    if (!data) return;
    currentPokemonData = { ...data, shiny };
  }

  // Build options for renderCard
  const options = {
    nature: document.getElementById('nature').value,
    ability: (() => {
      const sel = document.getElementById('ability');
      sel.innerHTML = data.abilities.map(a => `<option>${a}</option>`).join('');
      return sel.value || data.abilities[0];
    })(),
    item:   document.getElementById('item').value.trim(),
    moves:  Array.from(document.querySelectorAll('.move-input'))
                  .map(i => i.value.trim()).filter(Boolean),
    accent: document.getElementById('accent-color').value,
    shiny,
    evs:    {},
    ivs:    {}
  };

  // Capture EVs and IVs (values already clamped)
  STAT_KEYS.forEach(key => {
    const evEl = document.getElementById(`ev-${key}`);
    const ivEl = document.getElementById(`iv-${key}`);
    options.evs[key] = evEl ? parseInt(evEl.value,10)||0 : 0;
    options.ivs[key] = ivEl ? parseInt(ivEl.value,10)||31 : 31;
  });

  renderCard(data, options);
}

// ————————————————————————————————————————
// 🔄 Showdown Import/Export Helpers
// ————————————————————————————————————————
function parseShowdown(txt) {
  const lines = txt.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const set = {
    name: '', item: '', ability: '', tera: '',
    evs: {}, ivs: {}, nature: '', moves: []
  };

  // Line 1: Name @ Item
  [set.name, set.item] = lines[0].split('@').map(s => s.trim());

  lines.slice(1).forEach(l => {
    if (l.startsWith('Ability:')) {
      set.ability = l.replace('Ability:', '').trim();
    } else if (l.startsWith('Tera Type:')) {
      set.tera = l.replace('Tera Type:', '').trim();
    } else if (l.startsWith('EVs:')) {
      l.replace('EVs:', '').trim()
        .split('/')
        .forEach(part => {
          const [v, stat] = part.trim().split(' ');
          set.evs[statKey(stat)] = Math.min(252, parseInt(v,10)||0);
        });
    } else if (l.endsWith('Nature')) {
      set.nature = l.replace('Nature','').trim();
    } else if (l.startsWith('-')) {
      set.moves.push(l.replace(/^-/, '').trim());
    }
  });

  // Default IVs to 31
  STAT_KEYS.forEach(k => set.ivs[k] = 31);
  return set;
}

function statKey(label) {
  const map = {
    HP:'hp', Atk:'attack', Def:'defense',
    SpA:'special-attack', SpD:'special-defense', Spe:'speed'
  };
  return map[label] || label.toLowerCase();
}

function applySetToForm(set) {
  document.getElementById('pokemon-name').value = set.name;
  document.getElementById('item').value         = set.item;
  document.getElementById('ability').value      = set.ability;
  document.getElementById('nature').value       = set.nature;

  STAT_KEYS.forEach(k => {
    const evEl = document.getElementById(`ev-${k}`);
    const ivEl = document.getElementById(`iv-${k}`);
    if (evEl) evEl.value = set.evs[k] || 0;
    if (ivEl) ivEl.value = set.ivs[k] || 31;
  });

  const moveEls = Array.from(document.querySelectorAll('.move-input'));
  moveEls.forEach((el, i) => el.value = set.moves[i] || '');

  scheduleUpdate();
}

function generateShowdown() {
  const name = document.getElementById('pokemon-name').value.trim();
  const item = document.getElementById('item').value.trim();
  const ability = document.getElementById('ability').value;
  const nature = document.getElementById('nature').value;
  const moves = Array.from(document.querySelectorAll('.move-input'))
    .map(i => i.value.trim()).filter(Boolean);

  const evParts = [];
  STAT_KEYS.forEach(k => {
    const v = parseInt(document.getElementById(`ev-${k}`).value,10) || 0;
    if (v > 0) evParts.push(`${v} ${statLabel(k)}`);
  });
  const evLine = evParts.length ? `EVs: ${evParts.join(' / ')}` : '';

  const ivParts = [];
  STAT_KEYS.forEach(k => {
    const v = parseInt(document.getElementById(`iv-${k}`).value,10) || 31;
    if (v < 31) ivParts.push(`${v} ${statLabel(k)}`);
  });
  const ivLine = ivParts.length ? `IVs: ${ivParts.join(' / ')}` : '';

  const lines = [
    `${name} @ ${item}`,
    `Ability: ${ability}`,
    nature && `${nature} Nature`,
    evLine,
    ivLine,
    ...moves.map(m => `- ${m}`)
  ].filter(Boolean);

  return lines.join('\n');
}

function statLabel(key) {
  const inv = {
    hp:'HP', attack:'Atk', defense:'Def',
    'special-attack':'SpA','special-defense':'SpD','speed':'Spe'
  };
  return inv[key] || key;
}
