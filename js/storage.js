/* ==========================================================================
   storage.js — one small wrapper around localStorage
   Every read and write goes through here so the try/catch and the JSON
   conversion live in one place instead of being repeated on every page.
   ========================================================================== */

/* One object holding every key this site writes, so a key is never
   mistyped in one file and spelled differently in another. */
const STORAGE_KEYS = {
  savedPets: 'tcar.savedPets',   // array of pet id strings
  petFilters: 'tcar.petFilters', // object describing the current filter choices
  formDraft: 'tcar.formDraft'    // object of partly filled interest-form values
};

/**
 * Write a value to localStorage as JSON.
 * Returns true on success, false if storage is unavailable (private
 * browsing and full-quota situations both throw here).
 */
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('Could not save "' + key + '" to localStorage:', error);
    return false;
  }
}

/**
 * Read a value back from localStorage.
 * Returns fallbackValue when the key is missing or the stored text is not
 * valid JSON, so a corrupted entry can never crash the page.
 */
function loadFromStorage(key, fallbackValue) {
  try {
    const rawValue = localStorage.getItem(key);
    if (rawValue === null) {
      return fallbackValue;
    }
    return JSON.parse(rawValue);
  } catch (error) {
    console.warn('Could not read "' + key + '" from localStorage:', error);
    return fallbackValue;
  }
}

/** Remove a single stored key. */
function clearFromStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn('Could not clear "' + key + '" from localStorage:', error);
    return false;
  }
}
