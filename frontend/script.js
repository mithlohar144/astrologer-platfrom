import CONFIG from './js/config.js';

const slider = document.querySelector(".testimonial-slider");
const cardWidth = 330; // Width of a single card + gap
let scrollPos = 0;

// Check authentication status and update UI
async function checkAuthStatus() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const loginBtn = document.querySelector('.login-btn');
  const signupBtn = document.querySelector('.signup-btn');
  const profileBtn = document.getElementById('profile-btn');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (token && user && user.id) {
    // Verify token with backend
    try {
      const response = await fetch(`${CONFIG.API_URL}${CONFIG.ENDPOINTS.AUTH}/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Token invalid');
      }
      
      // User is logged in
      if (loginBtn) loginBtn.style.display = 'none';
      if (signupBtn) signupBtn.style.display = 'none';
      if (profileBtn) {
        profileBtn.style.display = 'block';
        profileBtn.addEventListener('click', function() {
          if (user.isAdmin) {
            window.location.href = 'admin-dashboard.html';
          } else if (user.isAstrologer) {
            window.location.href = 'astrologer-dashboard.html';
          } else {
            window.location.href = 'user-dashboard.html';
          }
        });
      }
      if (logoutBtn) {
        logoutBtn.style.display = 'block';
        logoutBtn.addEventListener('click', logout);
      }
    } catch (error) {
      // Token is invalid, clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      showToast('Session expired. Please login again.', 'error');
      window.location.href = 'login-working.html';
    }
  } else {
    // User is not logged in
    if (loginBtn) loginBtn.style.display = 'block';
    if (signupBtn) signupBtn.style.display = 'block';
    if (profileBtn) profileBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

// Toast notification function
function showToast(message, type = 'success') {
  const toastContainer = document.querySelector('.toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, CONFIG.TOAST_DURATION);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
  showToast('Logged out successfully', 'success');
}

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication status
  checkAuthStatus();
  // Handle preloader
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('fade-out');
      
      // Enable scrolling after preloader is gone
      setTimeout(() => {
        document.body.style.overflow = 'visible';
        preloader.style.display = 'none';
      }, 500);
    }, 1500);
  }
  
  // Scroll to top button functionality
  const scrollTopBtn = document.querySelector('.scroll-top');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        scrollTopBtn.classList.add('active');
      } else {
        scrollTopBtn.classList.remove('active');
      }
    });
    
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
  // Mobile menu toggle functionality
  const menuIcon = document.querySelector('.media');
  const navMenu = document.querySelector('nav ul');
  
  if (menuIcon && navMenu) {
    menuIcon.addEventListener('click', function() {
      navMenu.classList.toggle('active');
      
      // Toggle between hamburger and close icon
      const icons = menuIcon.querySelectorAll('i');
      icons.forEach(icon => {
        icon.style.display = icon.style.display === 'none' ? 'block' : 'none';
      });
    });
  }
  
  // Initialize animations with Intersection Observer
  const animatedElements = document.querySelectorAll('.service-divv, .zodiac-item, section, .testimonial');
  
  // Set animation order for staggered animations
  document.querySelectorAll('.service-divv').forEach((el, index) => {
    el.style.setProperty('--animation-order', index);
  });
  
  document.querySelectorAll('.zodiac-item').forEach((el, index) => {
    el.style.setProperty('--animation-order', index);
  });
  
  // Create the observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  // Observe all animated elements
  animatedElements.forEach(el => {
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });
});

// Clone all cards for continuous flow
const totalVisible = slider?.children?.length || 0;
if (slider && totalVisible > 0) {
  for (let i = 0; i < totalVisible; i++) {
    const clone = slider.children[i].cloneNode(true);
    slider.appendChild(clone);
  }

  // Auto slide: move from right to left
  function autoSlide() {
    scrollPos -= cardWidth;

    // Smooth scroll to the new position
    slider.scrollTo({ left: scrollPos, behavior: "smooth" });

    // When the scroll reaches the beginning of the original items, reset to the end
    if (scrollPos <= 0) {
      scrollPos = totalVisible * cardWidth;
      // Instantly jump to the end of the cloned items to create a seamless loop
      slider.scrollTo({ left: scrollPos, behavior: "auto" });
    }
  }

  let sliderInterval = setInterval(autoSlide, 2000);
  
  // Pause slider on hover
  slider.addEventListener('mouseenter', () => {
    clearInterval(sliderInterval);
  });
  
  slider.addEventListener('mouseleave', () => {
    sliderInterval = setInterval(autoSlide, 2000);
  });
}

// Smooth scroll for navigation links
document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      
      // Close mobile menu if open
      const navMenu = document.querySelector('nav ul');
      if (navMenu && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
      }
    }
  });
});