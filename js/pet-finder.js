/* ==========================================================================
   pet-finder.js — "Animals waiting for homes" browser on the home page

   What it does
     - filters the list of adoptable animals by species, age, and whether the
       animal is known to be good with children
     - lets a visitor save animals to a shortlist
     - remembers both the shortlist and the last filter choice in localStorage

   Depends on storage.js being loaded first.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. Data
   -------------------------------------------------------------------------- */

/* ARRAY OF OBJECTS: every adoptable animal currently in our care.
   In a production site this would arrive from the shelter database; here it
   is the single source the whole feature reads from. */
const PETS = [
  {
    id: 'willa',
    name: 'Willa',
    species: 'cat',
    age: 'adult',
    ageLabel: '3 years',
    goodWithKids: true,
    traits: ['Lap cat', 'Quiet home'],
    summary: 'Found as a stray and turned out to be an unrepentant lap cat. Settles fast in a calm house.'
  },
  {
    id: 'gus',
    name: 'Gus',
    species: 'dog',
    age: 'senior',
    ageLabel: '9 years',
    goodWithKids: true,
    traits: ['Calm', 'Short walks'],
    summary: 'A steady old shepherd mix who asks for two short walks a day and a warm spot by the door.'
  },
  {
    id: 'pepper',
    name: 'Pepper',
    species: 'dog',
    age: 'young',
    ageLabel: '7 months',
    goodWithKids: true,
    traits: ['High energy', 'Learning manners'],
    summary: 'All legs and enthusiasm. Pepper needs an adopter who will keep up with training class.'
  },
  {
    id: 'clementine',
    name: 'Clementine',
    species: 'small',
    age: 'adult',
    ageLabel: '2 years',
    goodWithKids: true,
    traits: ['Bonded pair', 'Gentle'],
    summary: 'A guinea pig who came in with cage mates after a family move fell through. Adopted with Biscuit.'
  },
  {
    id: 'otis',
    name: 'Otis',
    species: 'cat',
    age: 'young',
    ageLabel: '5 months',
    goodWithKids: false,
    traits: ['Shy', 'Needs quiet'],
    summary: 'Still deciding whether people are trustworthy. Otis does best in a household without young children.'
  },
  {
    id: 'maple',
    name: 'Maple',
    species: 'dog',
    age: 'adult',
    ageLabel: '5 years',
    goodWithKids: false,
    traits: ['Only dog', 'Experienced adopter'],
    summary: 'Wonderful with people, sharp with other dogs. Maple is looking to be the only pet in the house.'
  },
  {
    id: 'biscuit',
    name: 'Biscuit',
    species: 'small',
    age: 'adult',
    ageLabel: '2 years',
    goodWithKids: true,
    traits: ['Bonded pair', 'Gentle'],
    summary: 'Clementine\u2019s cage mate. The two of them are adopted together and share a very large hay habit.'
  },
  {
    id: 'nova',
    name: 'Nova',
    species: 'cat',
    age: 'adult',
    ageLabel: '4 years',
    goodWithKids: true,
    traits: ['Playful', 'Fine with other cats'],
    summary: 'Nova would happily join a home that already has a cat, and will find the highest shelf in it.'
  }
];

/* What to call each species on screen. */
const SPECIES_LABELS = { cat: 'Cat', dog: 'Dog', small: 'Small pet' };

/* The filter choices a first-time visitor starts with. */
const DEFAULT_FILTERS = { species: 'all', age: 'all', goodWithKidsOnly: false };

/* OBJECT holding the current filter choices. Reading and writing one object
   keeps the three controls in sync and makes the whole state easy to store. */
let filterState = { ...DEFAULT_FILTERS };

/* ARRAY of the pet ids the visitor has shortlisted. */
let savedPetIds = [];

/* --------------------------------------------------------------------------
   2. Reading and writing stored state
   -------------------------------------------------------------------------- */

/** Pull the shortlist and last-used filters back out of localStorage. */
function loadSavedState() {
  savedPetIds = loadFromStorage(STORAGE_KEYS.savedPets, []);
  if (!Array.isArray(savedPetIds)) {
    savedPetIds = [];
  }

  const storedFilters = loadFromStorage(STORAGE_KEYS.petFilters, null);
  if (storedFilters && typeof storedFilters === 'object') {
    filterState = {
      species: storedFilters.species || 'all',
      age: storedFilters.age || 'all',
      goodWithKidsOnly: storedFilters.goodWithKidsOnly === true
    };
  }
}

/* --------------------------------------------------------------------------
   3. Small helpers
   -------------------------------------------------------------------------- */

/** Apply every active filter and hand back the animals that survive. */
function getFilteredPets() {
  return PETS.filter((pet) => {
    const speciesMatches = filterState.species === 'all' || pet.species === filterState.species;
    const ageMatches = filterState.age === 'all' || pet.age === filterState.age;
    const kidsMatches = !filterState.goodWithKidsOnly || pet.goodWithKids === true;
    return speciesMatches && ageMatches && kidsMatches;
  });
}

/** The three filter controls, looked up in one place. */
function getFilterControls() {
  return {
    species: document.getElementById('filter-species'),
    age: document.getElementById('filter-age'),
    kids: document.getElementById('filter-kids')
  };
}

/* --------------------------------------------------------------------------
   4. Building the markup
   -------------------------------------------------------------------------- */

/** Build one animal card. */
function createPetCard(pet) {
  const card = document.createElement('article');
  card.className = 'pet-card';
  card.dataset.petId = pet.id;

  const saved = savedPetIds.includes(pet.id);
  const traitTags = pet.traits.map((trait) => '<li class="pet-tag">' + trait + '</li>').join('');

  card.innerHTML =
    '<div class="pet-card-head">' +
      '<span class="pet-avatar pet-avatar-' + pet.species + '" aria-hidden="true">' + pet.name.charAt(0) + '</span>' +
      '<div>' +
        '<h3 class="pet-name">' + pet.name + '</h3>' +
        '<p class="pet-meta">' + SPECIES_LABELS[pet.species] + ' &middot; ' + pet.ageLabel + '</p>' +
      '</div>' +
    '</div>' +
    '<p class="pet-summary">' + pet.summary + '</p>' +
    '<ul class="pet-tags">' + traitTags + '</ul>' +
    '<button type="button" class="pet-save-button' + (saved ? ' is-saved' : '') + '" ' +
            'data-pet-id="' + pet.id + '" aria-pressed="' + saved + '">' +
      (saved ? 'Saved to my list' : 'Save to my list') +
    '</button>';

  return card;
}

/** Redraw the results grid and the "showing x of y" line. */
function renderPetGrid() {
  const grid = document.getElementById('pet-results');
  const countLine = document.getElementById('pet-count');
  if (!grid || !countLine) {
    return;
  }

  const matches = getFilteredPets();
  grid.innerHTML = '';

  if (matches.length === 0) {
    countLine.textContent = 'No animals match those filters right now.';
    grid.innerHTML =
      '<p class="pet-empty">Nothing here matches all three filters today. ' +
      'Try widening one of them, or <a href="contact.html">tell us what you are looking for</a> ' +
      'and we will contact you when a match arrives.</p>';
    return;
  }

  countLine.textContent = 'Showing ' + matches.length + ' of ' + PETS.length + ' animals.';

  matches.forEach((pet) => grid.appendChild(createPetCard(pet)));
}

/** Redraw the shortlist panel and the count in the section heading. */
function renderSavedList() {
  const panel = document.getElementById('saved-list');
  const countBadge = document.getElementById('saved-count');
  if (!panel || !countBadge) {
    return;
  }

  countBadge.textContent = savedPetIds.length;

  if (savedPetIds.length === 0) {
    panel.innerHTML =
      '<p class="saved-empty">Your list is empty. Save an animal above and it will still be ' +
      'here when you come back, ready to attach to an interest form.</p>';
    return;
  }

  const items = savedPetIds.map((petId) => {
    const pet = PETS.find((candidate) => candidate.id === petId);
    if (!pet) {
      return '';
    }
    return '<li class="saved-item">' +
             '<span>' + pet.name + ' <span class="saved-item-meta">' + SPECIES_LABELS[pet.species] + '</span></span>' +
             '<button type="button" class="saved-remove" data-pet-id="' + pet.id + '">' +
               'Remove<span class="visually-hidden"> ' + pet.name + ' from my list</span>' +
             '</button>' +
           '</li>';
  }).join('');

  panel.innerHTML =
    '<ul class="saved-items">' + items + '</ul>' +
    '<p class="saved-actions">' +
      '<a class="button" href="contact.html">Ask about these animals</a>' +
    '</p>';
}

/* --------------------------------------------------------------------------
   5. Responding to the visitor
   -------------------------------------------------------------------------- */

/** Add or remove one animal from the shortlist, then redraw. */
function toggleSavedPet(petId) {
  const position = savedPetIds.indexOf(petId);

  if (position === -1) {
    savedPetIds.push(petId);
  } else {
    savedPetIds.splice(position, 1);
  }

  saveToStorage(STORAGE_KEYS.savedPets, savedPetIds);
  renderPetGrid();
  renderSavedList();
}

/** Read the three controls into filterState, store it, and redraw. */
function handleFilterChange() {
  const controls = getFilterControls();

  filterState = {
    species: controls.species ? controls.species.value : 'all',
    age: controls.age ? controls.age.value : 'all',
    goodWithKidsOnly: controls.kids ? controls.kids.checked : false
  };

  saveToStorage(STORAGE_KEYS.petFilters, filterState);
  renderPetGrid();
}

/** Put the restored filter values back onto the controls themselves. */
function applyFilterStateToControls() {
  const controls = getFilterControls();

  if (controls.species) {
    controls.species.value = filterState.species;
  }
  if (controls.age) {
    controls.age.value = filterState.age;
  }
  if (controls.kids) {
    controls.kids.checked = filterState.goodWithKidsOnly;
  }
}

/* --------------------------------------------------------------------------
   6. Start up
   -------------------------------------------------------------------------- */

function initPetFinder() {
  const finder = document.getElementById('pet-finder');
  if (!finder) {
    return; // this page does not have the feature on it
  }

  loadSavedState();
  applyFilterStateToControls();
  renderPetGrid();
  renderSavedList();

  // One listener on the filter form covers all three controls.
  const filterForm = document.getElementById('pet-filters');
  if (filterForm) {
    filterForm.addEventListener('change', handleFilterChange);
    // Filtering is live, so there is nothing to submit.
    filterForm.addEventListener('submit', (event) => event.preventDefault());
  }

  const resetButton = document.getElementById('filter-reset');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      filterState = { ...DEFAULT_FILTERS };
      applyFilterStateToControls();
      saveToStorage(STORAGE_KEYS.petFilters, filterState);
      renderPetGrid();
    });
  }

  /* Cards are rebuilt constantly, so listen on the containers that stay put
     rather than on buttons that get thrown away and recreated. The save
     button in the grid and the remove button in the shortlist both toggle. */
  [['pet-results', '.pet-save-button'], ['saved-list', '.saved-remove']].forEach(([containerId, buttonSelector]) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.addEventListener('click', (event) => {
        const button = event.target.closest(buttonSelector);
        if (button) {
          toggleSavedPet(button.dataset.petId);
        }
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', initPetFinder);
