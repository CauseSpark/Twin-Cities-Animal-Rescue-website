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
   to test a value and what to say when the test fails, so adding a new
   checked field means adding one entry here rather than editing the
   submit handler. */
const VALIDATION_RULES = {
  'full-name': {
    required: true,
    test: function (value) {
      return value.trim().length >= 2;
    },
    message: 'Enter your full name, at least 2 characters.'
  },
  'email': {
    required: true,
    test: function (value) {
      // something@something.something, with no spaces
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
    },
    message: 'Enter an email address in the format name@example.com.'
  },
  'phone': {
    required: false, // optional, but checked when it has been filled in
    test: function (value) {
      return value.trim() === '' || /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/.test(value.trim());
    },
    message: 'Use the format 651-555-0142, or leave this blank.'
  },
  'zip': {
    required: true,
    test: function (value) {
      return /^[0-9]{5}$/.test(value.trim());
    },
    message: 'Enter a 5 digit ZIP code so we can check our service area.'
  },
  'start-date': {
    required: true,
    test: function (value) {
      return value.trim() !== '';
    },
    message: 'Choose the earliest date you could start.'
  },
  'hours-per-month': {
    required: false,
    test: function (value) {
      if (value.trim() === '') {
        return true;
      }
      const hours = Number(value);
      return Number.isFinite(hours) && hours >= 1 && hours <= 80;
    },
    message: 'Enter a number of hours between 1 and 80.'
  },
  'experience-level': {
    required: true,
    test: function (value) {
      return value !== '';
    },
    message: 'Choose the option that best describes your experience.'
  },
  'message': {
    required: true,
    test: function (value) {
      const length = value.trim().length;
      return length >= 10 && length <= 600;
    },
    message: 'Tell us a little more, between 10 and 600 characters.'
  }
};

/* --------------------------------------------------------------------------
   2. Showing and clearing messages
   -------------------------------------------------------------------------- */

/** Put an error message in the span that sits directly under a field. */
function showFieldError(fieldId, messageText) {
  const field = document.getElementById(fieldId);
  const errorSpan = document.getElementById('error-' + fieldId);

  if (field) {
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('has-error');
  }
  if (errorSpan) {
    errorSpan.textContent = messageText;
  }
}

/** Take the error message and the red state back off a field. */
function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorSpan = document.getElementById('error-' + fieldId);

  if (field) {
    field.removeAttribute('aria-invalid');
    field.classList.remove('has-error');
  }
  if (errorSpan) {
    errorSpan.textContent = '';
  }
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

  const value = field.value;

  if (rule.required && value.trim() === '') {
    showFieldError(fieldId, 'This field is required.');
    return false;
  }

  if (!rule.test(value)) {
    showFieldError(fieldId, rule.message);
    return false;
  }

  clearFieldError(fieldId);
  return true;
}

/** The radio group is checked on its own, since it is a set rather than one input. */
function validateInterestChoice() {
  const chosen = document.querySelector('input[name="interest-type"]:checked');
  const errorSpan = document.getElementById('error-interest-type');

  if (!chosen) {
    if (errorSpan) {
      errorSpan.textContent = 'Choose the option that matches how you want to help.';
    }
    return false;
  }

  if (errorSpan) {
    errorSpan.textContent = '';
  }
  return true;
}

/**
 * Check the whole form.
 * Returns an array of the ids that failed, so the caller can both count the
 * problems and jump to the first one.
 */
function validateForm() {
  const failedFields = [];

  Object.keys(VALIDATION_RULES).forEach(function (fieldId) {
    if (!validateField(fieldId)) {
      failedFields.push(fieldId);
    }
  });

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

  DRAFT_FIELD_IDS.forEach(function (fieldId) {
    const field = document.getElementById(fieldId);
    if (field && field.value.trim() !== '') {
      draft[fieldId] = field.value;
    }
  });

  const chosenInterest = document.querySelector('input[name="interest-type"]:checked');
  if (chosenInterest) {
    draft.interestType = chosenInterest.value;
  }

  saveToStorage(STORAGE_KEYS.formDraft, draft);
}

/** Put a stored draft back onto the form when the page opens. */
function restoreFormDraft() {
  const draft = loadFromStorage(STORAGE_KEYS.formDraft, null);
  if (!draft || typeof draft !== 'object') {
    return false;
  }

  let restoredAnything = false;

  DRAFT_FIELD_IDS.forEach(function (fieldId) {
    const field = document.getElementById(fieldId);
    if (field && typeof draft[fieldId] === 'string') {
      field.value = draft[fieldId];
      restoredAnything = true;
    }
  });

  if (draft.interestType) {
    const radio = document.querySelector('input[name="interest-type"][value="' + draft.interestType + '"]');
    if (radio) {
      radio.checked = true;
      restoredAnything = true;
    }
  }

  return restoredAnything;
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
  const names = storedIds.map(function (petId) {
    if (typeof PETS === 'undefined') {
      return petId;
    }
    const match = PETS.find(function (pet) {
      return pet.id === petId;
    });
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
    if (adoptionRadio && !document.querySelector('input[name="interest-type"]:checked')) {
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
  const summary = document.getElementById('form-summary');

  if (failedFields.length > 0) {
    if (summary) {
      summary.className = 'form-summary form-summary-error';
      summary.textContent = failedFields.length === 1
        ? 'One field needs your attention. It is marked below.'
        : failedFields.length + ' fields need your attention. They are marked below.';
      summary.hidden = false;
    }

    // Jump to the first problem without clearing anything the visitor typed.
    const firstBadField = document.getElementById(failedFields[0]);
    if (firstBadField) {
      firstBadField.focus();
      firstBadField.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    return;
  }

  // Everything passed.
  const form = document.getElementById('interest-form');
  const nameField = document.getElementById('full-name');
  const firstName = nameField ? nameField.value.trim().split(' ')[0] : 'there';

  if (summary) {
    summary.className = 'form-summary form-summary-success';
    summary.textContent = 'Thank you, ' + firstName +
      '. Your interest form is complete and a coordinator will reply within three business days.';
    summary.hidden = false;
    summary.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  // The form is submitted, so the draft and the shortlist are no longer needed.
  clearFromStorage(STORAGE_KEYS.formDraft);
  clearFromStorage(STORAGE_KEYS.savedPets);

  if (form) {
    form.reset();
  }

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
  Object.keys(VALIDATION_RULES).forEach(function (fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) {
      return;
    }
    field.addEventListener('blur', function () {
      validateField(fieldId);
    });
    field.addEventListener('input', function () {
      if (field.classList.contains('has-error')) {
        validateField(fieldId);
      }
      saveFormDraft();
    });
  });

  document.querySelectorAll('input[name="interest-type"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      validateInterestChoice();
      saveFormDraft();
    });
  });

  const clearButton = document.getElementById('clear-form');
  if (clearButton) {
    clearButton.addEventListener('click', function () {
      clearFromStorage(STORAGE_KEYS.formDraft);
      Object.keys(VALIDATION_RULES).forEach(clearFieldError);
      const interestError = document.getElementById('error-interest-type');
      if (interestError) {
        interestError.textContent = '';
      }
      const summary = document.getElementById('form-summary');
      if (summary) {
        summary.hidden = true;
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initInterestForm);
