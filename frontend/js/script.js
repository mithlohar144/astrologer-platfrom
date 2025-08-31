document.addEventListener('DOMContentLoaded', function() {
    // Testimonial slider functionality
    const slider = document.querySelector('.testimonial-slider');
    if (slider) {
        // This is a simple auto-scroll. For buttons, you'd add event listeners.
        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
            // Pause auto-scroll while dragging starts
            stopAutoScroll();
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.classList.remove('active');
            // Resume auto-scroll when pointer leaves
            startAutoScroll();
        });

        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('active');
            // Resume auto-scroll when drag ends
            startAutoScroll();
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; //scroll-fast
            slider.scrollLeft = scrollLeft - walk;
        });

        // Touch events support (pause/resume auto-scroll)
        slider.addEventListener('touchstart', () => {
            stopAutoScroll();
        }, { passive: true });

        slider.addEventListener('touchend', () => {
            startAutoScroll();
        }, { passive: true });

        // Pause auto-scroll on hover/focus within; resume on leave
        slider.addEventListener('mouseenter', stopAutoScroll);
        slider.addEventListener('focusin', stopAutoScroll);
        slider.addEventListener('mouseleave', startAutoScroll);
        slider.addEventListener('focusout', startAutoScroll);

        // Auto-scroll implementation
        let rafId = null;
        const speedPxPerFrame = 0.8; // ~0.8px per frame (~48px/sec at 60fps)

        const step = () => {
            // Advance scroll
            slider.scrollLeft += speedPxPerFrame;

            // Loop back to start when reaching the end
            if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 1) {
                slider.scrollLeft = 0;
            }

            rafId = requestAnimationFrame(step);
        };

        const startAutoScroll = () => {
            if (rafId !== null) return; // already running
            rafId = requestAnimationFrame(step);
        };

        const stopAutoScroll = () => {
            if (rafId === null) return;
            cancelAnimationFrame(rafId);
            rafId = null;
        };

        // Kick off auto-scroll on load
        startAutoScroll();
    }

    // Scroll to top button
    const scrollTopBtn = document.querySelector('.scroll-top');
    if(scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) { // Show button after 300px of scroll
                scrollTopBtn.style.display = 'block';
            } else {
                scrollTopBtn.style.display = 'none';
            }
        });

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Hamburger menu toggle for mobile
    const hamburger = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('nav ul');
    const closeIcon = document.querySelector('.fa-xmark');
    const barsIcon = document.querySelector('.fa-bars');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            closeIcon.style.display = navMenu.classList.contains('active') ? 'block' : 'none';
            barsIcon.style.display = navMenu.classList.contains('active') ? 'none' : 'block';
        });
    }
});

