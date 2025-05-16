// api.js — Responsible for fetching Pokémon data and auxiliary lists

/**
 * Fetches Pokémon data including types, abilities, stats, and sprite.
 * @param {string} pokemonName – Case-insensitive Pokémon name.
 * @param {boolean} isShiny – Whether to return the shiny artwork.
 * @returns {Promise<object|null>} Formatted Pokémon object or null on error.
 */
export async function fetchPokemonData(pokemonName, isShiny = false) {
    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`
      );
      if (!response.ok) throw new Error('Pokémon not found');
      const data = await response.json();
  
      return {
        name: capitalize(data.name),
        id: data.id,
        types: data.types.map(t => capitalize(t.type.name)),
        abilities: data.abilities.map(a => capitalize(a.ability.name)),
        // Keep the raw stats array so render.js can access s.base_stat and s.stat.name
        stats: data.stats,
        sprite: isShiny
          ? data.sprites.other['official-artwork'].front_shiny
          : data.sprites.other['official-artwork'].front_default
      };
    } catch (err) {
      console.error(`[Waveform API] Error fetching Pokémon: ${err.message}`);
      return null;
    }
  }
  
  /**
   * Fetches a flat list of all item names for autocomplete.
   * Uses only the summary endpoint to avoid hundreds of sub‐requests.
   * @returns {Promise<string[]>} Array of capitalized item names.
   */
  export async function fetchItemList() {
    try {
      const response = await fetch('https://pokeapi.co/api/v2/item?limit=10000');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const { results } = await response.json();
      return results.map(i =>
        capitalize(i.name.replace(/-/g, ' '))
      );
    } catch (err) {
      console.error(`[Waveform API] Error fetching items: ${err.message}`);
      return [];
    }
  }
  
  /**
   * Simple helper to capitalize the first letter of a string.
   * @param {string} str
   * @returns {string}
   */
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  