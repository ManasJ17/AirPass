/**
 * Responsive Navbar with Hamburger Menu
 * AirPass - Professional Mobile Navigation
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get hamburger menu elements
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    const body = document.body;
    
    // Check if elements exist
    if (!mobileMenuBtn || !mobileNav) {
        console.warn('Mobile menu elements not found');
        return;
    }
    
    // Toggle mobile menu function
    function toggleMobileMenu() {
        const isActive = mobileMenuBtn.classList.contains('active');
        
        if (isActive) {
            // Close menu
            mobileMenuBtn.classList.remove('active');
            mobileNav.classList.remove('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            body.style.overflow = '';
            
            // Hide menu after animation
            setTimeout(() => {
                if (!mobileMenuBtn.classList.contains('active')) {
                    mobileNav.style.display = 'none';
                }
            }, 300);
        } else {
            // Open menu
            mobileNav.style.display = 'block';
            // Force reflow before adding active class for smooth animation
            mobileNav.offsetHeight;
            mobileMenuBtn.classList.add('active');
            mobileNav.classList.add('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'true');
            body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }
    
    // Close mobile menu function
    function closeMobileMenu() {
        mobileMenuBtn.classList.remove('active');
        mobileNav.classList.remove('active');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        body.style.overflow = '';
        
        // Hide menu after animation completes
        setTimeout(() => {
            if (!mobileMenuBtn.classList.contains('active')) {
                mobileNav.style.display = 'none';
            }
        }, 300);
    }
    
    // Hamburger button click event
    mobileMenuBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleMobileMenu();
    });
    
    // Close menu when clicking on mobile nav links - ensure proper navigation
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Close menu immediately
            mobileMenuBtn.classList.remove('active');
            mobileNav.classList.remove('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            body.style.overflow = '';
            mobileNav.style.display = 'none';
            
            // Allow natural navigation to proceed
            // No need to prevent default - let the browser handle navigation
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!mobileMenuBtn.contains(e.target) && !mobileNav.contains(e.target)) {
            if (mobileMenuBtn.classList.contains('active')) {
                closeMobileMenu();
            }
        }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenuBtn.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    // Close menu on window resize (if switching to desktop view)
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && mobileMenuBtn.classList.contains('active')) {
            closeMobileMenu();
        }
        
        // Ensure proper display state based on screen size
        if (window.innerWidth > 768) {
            mobileNav.style.display = 'none';
        } else if (!mobileMenuBtn.classList.contains('active')) {
            mobileNav.style.display = 'none';
        }
    });
    
    // Initialize mobile nav state on page load
    function initializeMobileNav() {
        if (window.innerWidth <= 768) {
            mobileNav.style.display = 'none';
        }
        // Ensure menu is closed on page load
        mobileMenuBtn.classList.remove('active');
        mobileNav.classList.remove('active');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        body.style.overflow = '';
    }
    
    // Call initialization
    initializeMobileNav();
    
    // Smooth scroll prevention when menu is open
    function preventScroll(e) {
        if (mobileMenuBtn.classList.contains('active')) {
            e.preventDefault();
        }
    }
    
    // Add touch event listeners for mobile
    document.addEventListener('touchmove', preventScroll, { passive: false });
});

/**
 * Additional enhancements for better UX
 */

// Add subtle navbar background blur effect on scroll
let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Add extra blur when scrolling
    if (scrollTop > 50) {
        navbar.style.backdropFilter = 'blur(25px)';
        navbar.style.backgroundColor = 'rgba(0, 0, 0, 0.98)';
    } else {
        navbar.style.backdropFilter = 'blur(20px)';
        navbar.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
    }
    
    lastScrollTop = scrollTop;
});

// Add focus trap for mobile menu accessibility
function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusableElement) {
                    lastFocusableElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusableElement) {
                    firstFocusableElement.focus();
                    e.preventDefault();
                }
            }
        }
    });
}

// Initialize focus trap when mobile menu is active
document.addEventListener('DOMContentLoaded', function() {
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav) {
        trapFocus(mobileNav);
    }
});