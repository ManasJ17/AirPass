// Modal/Dialog System

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
}

// Event Listeners for Modals
const closeButtons = document.querySelectorAll('.modal-close');
closeButtons.forEach((button) => {
  button.addEventListener('click', (event) => {
    const modalId = event.target.closest('.modal').id;
    closeModal(modalId);
  });
});