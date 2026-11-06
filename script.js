
const API = "https://pokeapi.co/api/v2";
const list = document.getElementById("pokemon-list");
const search = document.getElementById("search");
const generation = document.getElementById("generation");
const loadMore = document.getElementById("load-more");
const modal = document.getElementById("modal");

let pokemon = [];
let visible = 12;
let cache = {};

const types = {
  normal: "Normal", fire: "Fuego", water: "Agua",
  grass: "Planta", electric: "Eléctrico", ice: "Hielo",
  fighting: "Lucha", poison: "Veneno", ground: "Tierra",
  flying: "Volador", psychic: "Psíquico", bug: "Bicho",
  rock: "Roca", ghost: "Fantasma", dragon: "Dragón",
  dark: "Siniestro", steel: "Acero", fairy: "Hada"
};

const typeFilter = document.getElementById("type-filter");
let typePokemon = null;


const stats = {
  hp: "PS",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. especial",
  "special-defense": "Def. especial",
  speed: "Velocidad"
};

async function getPokemon(id) {
  if (cache[id]) return cache[id];

  const response = await fetch(`${API}/pokemon/${id}`);
  if (!response.ok) throw new Error("Error al cargar Pokémon");

  const data = await response.json();
  cache[id] = data;
  return data;
}

async function loadGeneration() {
  list.innerHTML = "<p>Cargando Pokémon...</p>";
  loadMore.style.display = "none";
  search.value = "";
  visible = 12;

  try {
    const response = await fetch(
      `${API}/generation/${generation.value}`
    );

    if (!response.ok) throw new Error("Error de conexión");

    const data = await response.json();

    pokemon = data.pokemon_species.sort((a, b) => {
      const numA = Number(a.url.split("/").filter(Boolean).pop());
      const numB = Number(b.url.split("/").filter(Boolean).pop());
      return numA - numB;
    });

    const regions = {
      1: "Kanto", 2: "Johto", 3: "Hoenn",
      4: "Sinnoh", 5: "Teselia", 6: "Kalos",
      7: "Alola", 8: "Galar", 9: "Paldea"
    };

    document.getElementById("title").textContent =
      `Pokémon de ${regions[generation.value]}`;

    showPokemon();
  } catch (error) {
    list.innerHTML = "<p>No se pudieron cargar los Pokémon. Revisa tu conexión.</p>";
  }
}

async function showPokemon() {
  const filtered = pokemon.filter(p => {
  const id = Number(p.url.split("/").filter(Boolean).pop());

  const matchesSearch =
    p.name.includes(search.value.toLowerCase()) ||
    String(id) === search.value;

  const matchesType =
    !typePokemon || typePokemon.has(id);

  return matchesSearch && matchesType;
});

  if (!filtered.length) {
    list.innerHTML = "<p>No se encontraron Pokémon.</p>";
    loadMore.style.display = "none";
    return;
  }

  const selected = filtered.slice(0, visible);
  list.innerHTML = "<p>Cargando...</p>";

  try {
    const details = await Promise.all(
      selected.map(p =>
        getPokemon(p.url.split("/").filter(Boolean).pop())
      )
    );

   
list.innerHTML = details.map(p => `
  <div class="card" data-id="${p.id}">
    <span class="number">N.º ${String(p.id).padStart(3, "0")}</span>

    <img src="${p.sprites.other['official-artwork'].front_default || p.sprites.front_default}" alt="${p.name}">

    <h3>${p.name}</h3>

    ${p.types.map(t => `
      <span class="type ${t.type.name}">
        ${types[t.type.name] || t.type.name}
      </span>
    `).join("")}
  </div>
`).join("");


    loadMore.style.display =
      filtered.length > visible ? "block" : "none";

  } catch (error) {
    list.innerHTML = "<p>Error al cargar los Pokémon.</p>";
  }
}

async function showDetails(id) {
  try {
    const p = await getPokemon(id);

    document.getElementById("pokemon-details").innerHTML = `
      <img src="${p.sprites.other['official-artwork'].front_default || p.sprites.front_default}" alt="${p.name}">
      <h2>${p.name}</h2>
      <p>N.º ${p.id}</p>
      <p>Altura: ${p.height / 10} m</p>
      <p>Peso: ${p.weight / 10} kg</p>
      <p>Tipos: ${p.types.map(t => types[t.type.name] || t.type.name).join(", ")}</p>
      <h3>Estadísticas</h3>
      ${p.stats.map(s => `
        <p>${stats[s.stat.name] || s.stat.name}: ${s.base_stat}</p>
      `).join("")}
      <h3>Habilidades</h3>
      <p>${p.abilities.map(a => a.ability.name).join(", ")}</p>
    `;

    modal.style.display = "flex";
  } catch (error) {
    alert("No se pudo cargar la información del Pokémon.");
  }
}

async function filterByType() {
  const type = typeFilter.value;

  if (type === "all") {
    typePokemon = null;
  } else {
    try {
      const response = await fetch(`${API}/type/${type}`);
      if (!response.ok) throw new Error();

      const data = await response.json();

      typePokemon = new Set(
        data.pokemon.map(p =>
          Number(p.pokemon.url.split("/").filter(Boolean).pop())
        )
      );
    } catch (error) {
      alert("No se pudo cargar el tipo seleccionado.");
      return;
    }
  }

  visible = 12;
  showPokemon();
}

generation.addEventListener("change", loadGeneration);

search.addEventListener("input", () => {
  visible = 12;
  showPokemon();
});

loadMore.addEventListener("click", () => {
  visible += 12;
  showPokemon();
});

list.addEventListener("click", e => {
  const card = e.target.closest(".card");
  if (card) showDetails(card.dataset.id);
});

document.getElementById("close-modal").addEventListener("click", () => {
  modal.style.display = "none";
});

modal.addEventListener("click", e => {
  if (e.target === modal) modal.style.display = "none";
});

typeFilter.addEventListener("change", filterByType);
loadGeneration();
