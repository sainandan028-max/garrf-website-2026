document.addEventListener("DOMContentLoaded", () => {
    // Only proceed if GSAP is loaded
    if (typeof gsap === 'undefined') return;

    // 1. Inward animation on page load (settle in from a slight push)
    document.body.style.opacity = '0';
    gsap.fromTo(document.body, 
        { opacity: 0, scale: 0.97 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out", clearProps: "all" }
    );

    // 2. Intercept links for Outward transition (dive into the page)
    let isTransitioning = false;
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        
        // Skip edit buttons or links that shouldn't trigger transition
        if (link.classList.contains('admin-edit-btn') || link.classList.contains('no-transition')) return;

        const href = link.getAttribute('href');
        
        // Proceed only for internal relative links
        if (href && !href.startsWith('#') && !href.startsWith('http') && !link.hasAttribute('target')) {
            e.preventDefault();
            
            // Skip if video-scroll.js is already doing a hero dive
            if (window.isHeroDiving) return;
            if (isTransitioning) return;
            isTransitioning = true;
            
            // Set overflow hidden to prevent scrollbar jumping during scale
            document.body.style.overflow = 'hidden';

            gsap.to(document.body, {
                scale: 1.05,      // slight zoom in
                opacity: 0,      // fade out
                duration: 0.5,
                ease: "power2.in"
            });

            setTimeout(() => {
                window.location.href = href;
            }, 500);
        }
    });
});
