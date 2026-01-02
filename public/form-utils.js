// Form Validation & Helpers

function validateKey(key) {
  const keyPattern = /^[A-Za-z0-9]{12}$/;
  return keyPattern.test(key);
}

function showError(inputId, message) {
  const input = document.getElementById(inputId);
  const error = document.createElement('div');
  error.className = 'form-error';
  error.textContent = message;
  input.parentNode.appendChild(error);
}

function clearErrors() {
  const errors = document.querySelectorAll('.form-error');
  errors.forEach((error) => error.remove());
}