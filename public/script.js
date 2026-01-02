// AirPass - Minimal JavaScript for interactions

// Announcement banner dismiss functionality
document.addEventListener('DOMContentLoaded', function() {
  const banner = document.getElementById('announcement-banner');
  const closeBtn = document.getElementById('close-banner');
  
  // Check if banner was previously dismissed
  if (localStorage.getItem('announcement-dismissed') === 'true') {
    if (banner) banner.style.display = 'none';
  }
  
  // Handle banner dismiss
  if (closeBtn && banner) {
    closeBtn.addEventListener('click', function() {
      banner.style.transform = 'translateY(-100%)';
      setTimeout(() => {
        banner.style.display = 'none';
      }, 300);
      localStorage.setItem('announcement-dismissed', 'true');
    });
  }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Add loading state to buttons on click
document.querySelectorAll('.btn').forEach(button => {
  button.addEventListener('click', function() {
    if (!this.disabled) {
      this.classList.add('loading');
      
      // Remove loading state after animation
      setTimeout(() => {
        this.classList.remove('loading');
      }, 1000);
    }
  });
});

// Navbar scroll effect
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  
  if (window.scrollY > 50) {
    navbar.style.backgroundColor = 'rgba(0, 0, 0, 0.98)';
  } else {
    navbar.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
  }
  
  lastScrollY = window.scrollY;
});

// Copy to clipboard functionality
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('Copied to clipboard!', 'success');
  }).catch(() => {
    showNotification('Failed to copy', 'error');
  });
}

// Simple notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#ffffff'};
    color: ${type === 'success' || type === 'error' ? '#ffffff' : '#000000'};
    border-radius: 8px;
    font-weight: 500;
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}
