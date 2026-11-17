/* ==========================================================================
   form-validation.js — the Get Involved interest form

   Three jobs:
     1. check the form in the browser and block an invalid submission
     2. keep a draft of what has been typed so a refresh does not wipe it
     3. pre-fill the message when the visitor arrives with a saved shortlist

   Depends on storage.js, and reads the PETS array from pet-finder.js when
   that file is present.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. The rules
   -------------------------------------------------------------------------- */

/* OBJECT of validation rules, keyed by the field's id. Each entry knows how
   to test a value (already trimmed) and what to say when the test fails, so
   adding a new checked field means adding one entry here rather than editing
   the submit handler. Optional fields pass when left blank. */
const VALIDATION_RULES = {
  'full-name': {
    required: true,
    test: (value) => value.length >= 2,
    message: 'Enter your full name, at least 2 characters.'
  },
  'email': {
    required: true,
    test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value), // something@something.something, no spaces
    message: 'Enter an email address in the format name@example.com.'
  },
  'phone': {
    required: false,
    test: (value) => value === '' || /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/.test(value),
    message: 'Use the format 651-555-0142, or leave this blank.'
  },
  'zip': {
    required: true,
    test: (value) => /^[0-9]{5}$/.test(value),
    message: 'Enter a 5 digit ZIP code so we can check our service area.'
  },
  'start-date': {
    required: true,
    test: (value) => value !== '',
    message: 'Choose the earliest date you could start.'
  },
  'hours-per-month': {
    required: false,
    test: (value) => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 1 && Number(value) <= 80),
    message: 'Enter a number of hours between 1 and 80.'
  },
  'experience-level': {
    required: true,
    test: (value) => value !== '',
    message: 'Choose the option that best describes your experience.'
  },
  'message': {
    required: true,
    test: (value) => value.length >= 10 && value.length <= 600,
    message: 'Tell us a little more, between 10 and 600 characters.'
  }
};

/* The radio group is a set rather than one input, so it is found by name. */
const INTEREST_RADIOS = 'input[name="interest-type"]';

/* --------------------------------------------------------------------------
   2. Showing and clearing messages
   -------------------------------------------------------------------------- */

/**
 * Put an error message in the span that sits directly under a field and mark
 * the field as invalid. An empty message clears both again.
 */
function setFieldError(fieldId, messageText = '') {
  const field = document.getElementById(fieldId);
  const errorSpan = document.getElementById('error-' + fieldId);

  if (field) {
    field.classList.toggle('has-error', messageText !== '');
    if (messageText) {
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.removeAttribute('aria-invalid');
    }
  }
  if (errorSpan) {
    errorSpan.textContent = messageText;
  }
}

/** Show the banner above the form as an 'error' or a 'success'. */
function showSummary(kind, messageText) {
  const summary = document.getElementById('form-summary');
  if (summary) {
    summary.className = 'form-summary form-summary-' + kind;
    summary.textContent = messageText;
    summary.hidden = false;
  }
  return summary;
}

/* --------------------------------------------------------------------------
   3. Checking fields
   -------------------------------------------------------------------------- */

/** Check one field against its rule. Returns true when the field is fine. */
function validateField(fieldId) {
  const rule = VALIDATION_RULES[fieldId];
  const field = document.getElementById(fieldId);
  if (!rule || !field) {
    return true;
  }

  const value = field.value.trim();
  let problem = '';
  if (rule.required && value === '') {
    problem = 'This field is required.';
  } else if (!rule.test(value)) {
    problem = rule.message;
  }

  setFieldError(fieldId, problem);
  return problem === '';
}

/** Check that one of the radio buttons has been chosen. */
function validateInterestChoice() {
  const chosen = document.querySelector(INTEREST_RADIOS + ':checked');
  setFieldError('interest-type', chosen ? '' : 'Choose the option that matches how you want to help.');
  return chosen !== null;
}

/**
 * Check the whole form.
 * Returns an array of the ids that failed, so the caller can both count the
 * problems and jump to the first one.
 */
function validateForm() {
  const failedFields = Object.keys(VALIDATION_RULES).filter((fieldId) => !validateField(fieldId));
  if (!validateInterestChoice()) {
    failedFields.push('interest-volunteer');
  }
  return failedFields;
}

/* --------------------------------------------------------------------------
   4. Keeping a draft so a refresh does not wipe the form
   -------------------------------------------------------------------------- */

/* The fields worth remembering between visits. */
const DRAFT_FIELD_IDS = [
  'full-name', 'email', 'phone', 'zip',
  'start-date', 'hours-per-month',
  'experience-level', 'animal-preference',
  'household', 'message'
];

/** Collect the current values into an object and store it. */
function saveFormDraft() {
  const draft = {};

  DRAFT_FIELD_IDS.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (field && field.value.trim() !== '') {
      draft[fieldId] = field.value;
    }
  });

  const chosenInterest = document.querySelector(INTEREST_RADIOS + ':checked');
  if (chosenInterest) {
    draft.interestType = chosenInterest.value;
  }

  saveToStorage(STORAGE_KEYS.formDraft, draft);
}

/** Put a stored draft back onto the form when the page opens. */
function restoreFormDraft() {
  const draft = loadFromStorage(STORAGE_KEYS.formDraft, null);
  if (!draft || typeof draft !== 'object') {
    return;
  }

  DRAFT_FIELD_IDS.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (field && typeof draft[fieldId] === 'string') {
      field.value = draft[fieldId];
    }
  });

  if (draft.interestType) {
    const radio = document.querySelector(INTEREST_RADIOS + '[value="' + draft.interestType + '"]');
    if (radio) {
      radio.checked = true;
    }
  }
}

/* --------------------------------------------------------------------------
   5. Carrying the saved shortlist over from the home page
   -------------------------------------------------------------------------- */

/**
 * If the visitor saved animals on the home page, mention them above the form
 * and start the message off with their names so nothing has to be retyped.
 */
function applySavedPetsToForm() {
  const noticeBox = document.getElementById('saved-pets-notice');
  const messageField = document.getElementById('message');
  if (!noticeBox) {
    return;
  }

  const storedIds = loadFromStorage(STORAGE_KEYS.savedPets, []);
  if (!Array.isArray(storedIds) || storedIds.length === 0) {
    noticeBox.hidden = true;
    return;
  }

  /* PETS comes from pet-finder.js. Fall back to the raw ids if that file is
     not on the page for some reason. */
  const names = storedIds.map((petId) => {
    const match = typeof PETS === 'undefined' ? null : PETS.find((pet) => pet.id === petId);
    return match ? match.name : petId;
  });
  const nameList = names.join(', ');

  noticeBox.hidden = false;
  noticeBox.innerHTML =
    '<p><strong>' + names.length + ' animal' + (names.length === 1 ? '' : 's') +
    ' from your saved list:</strong> ' + nameList + '. ' +
    'We have added them to your message below so you do not have to retype them.</p>';

  // Only pre-fill an empty message box, so a restored draft is never overwritten.
  if (messageField && messageField.value.trim() === '') {
    messageField.value = 'I would like to hear more about ' + nameList + '.';
    const adoptionRadio = document.getElementById('interest-adoption');
    if (adoptionRadio && !document.querySelector(INTEREST_RADIOS + ':checked')) {
      adoptionRadio.checked = true;
    }
  }
}

/* --------------------------------------------------------------------------
   6. Submitting
   -------------------------------------------------------------------------- */

function handleSubmit(event) {
  event.preventDefault(); // this demo site has no server to post to

  const failedFields = validateForm();
  if (failedFields.length > 0) {
    showSummary('error', failedFields.length === 1
      ? 'One field needs your attention. It is marked below.'
      : failedFields.length + ' fields need your attention. They are marked below.');

    // Jump to the first problem without clearing anything the visitor typed.
    const firstBadField = document.getElementById(failedFields[0]);
    if (firstBadField) {
      firstBadField.focus();
      firstBadField.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    return;
  }

  // Everything passed.
  const nameField = document.getElementById('full-name');
  const firstName = nameField ? nameField.value.trim().split(' ')[0] : 'there';
  const summary = showSummary('success', 'Thank you, ' + firstName +
    '. Your interest form is complete and a coordinator will reply within three business days.');
  if (summary) {
    summary.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  // The form is submitted, so the draft and the shortlist are no longer needed.
  clearFromStorage(STORAGE_KEYS.formDraft);
  clearFromStorage(STORAGE_KEYS.savedPets);
  event.target.reset();

  const noticeBox = document.getElementById('saved-pets-notice');
  if (noticeBox) {
    noticeBox.hidden = true;
  }
}

/* --------------------------------------------------------------------------
   7. Start up
   -------------------------------------------------------------------------- */

function initInterestForm() {
  const form = document.getElementById('interest-form');
  if (!form) {
    return; // not the Get Involved page
  }

  /* Turn off the browser's own bubbles so these messages, which sit beside
     the fields and stay on screen, are the only ones the visitor sees. */
  form.setAttribute('novalidate', 'novalidate');

  restoreFormDraft();
  applySavedPetsToForm();

  form.addEventListener('submit', handleSubmit);

  /* Re-check a field once the visitor leaves it, and clear the red state as
     soon as they start fixing it. */
  Object.keys(VALIDATION_RULES).forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (!field) {
      return;
    }
    field.addEventListener('blur', () => validateField(fieldId));
    field.addEventListener('input', () => {
      if (field.classList.contains('has-error')) {
        validateField(fieldId);
      }
      saveFormDraft();
    });
  });

  document.querySelectorAll(INTEREST_RADIOS).forEach((radio) => {
    radio.addEventListener('change', () => {
      validateInterestChoice();
      saveFormDraft();
    });
  });

  const clearButton = document.getElementById('clear-form');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      clearFromStorage(STORAGE_KEYS.formDraft);
      Object.keys(VALIDATION_RULES).concat('interest-type').forEach((fieldId) => setFieldError(fieldId));
      const summary = document.getElementById('form-summary');
      if (summary) {
        summary.hidden = true;
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initInterestForm);
