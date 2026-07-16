gsap.registerPlugin(ScrollTrigger);

if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("sequence-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const FRAME_COUNT = 48;
    const state = { frame: 0, lastDrawnFrame: -1 };
    const framePath = i => `css/frames/hq_frame_${String(i + 1).padStart(4, '0')}.jpg`;

    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width  = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        
        // This is CRITICAL to prevent the "compressed" image bug.
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";
        
        state.lastDrawnFrame = -1;
        render();
    }

    function render() {
        const idx = Math.round(state.frame);
        if (idx === state.lastDrawnFrame) return;
        
        const img = images[idx];
        if (!img || !img.complete || !img.naturalWidth) return;

        state.lastDrawnFrame = idx;
        
        const cW = canvas.width, cH = canvas.height;
        ctx.drawImage(img, 0, 0, cW, cH);
        
        const grad = ctx.createLinearGradient(0, 0, 0, cH);
        grad.addColorStop(0, 'rgba(0,0,0,0.35)');
        grad.addColorStop(0.25, 'rgba(0,0,0,0.06)');
        grad.addColorStop(0.75, 'rgba(0,0,0,0.06)');
        grad.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cW, cH);
    }

    const images = new Array(FRAME_COUNT);
    for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        img.onload = () => { if (i === 0) render(); };
        img.src = framePath(i);
        images[i] = img;
    }

    resizeCanvas();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resizeCanvas, 150);
    });

    const heroEl = document.getElementById("hero-fixed");
    const navbar = document.querySelector(".navbar");
    const spacer = document.getElementById("scroll-spacer");

    let pageState = "hero"; 

    function lockScroll() {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
    }
    function unlockScroll() {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
    }

    // Check if the browser restored our scroll position down the page
    // We delay slightly to give the browser time to apply its cached scroll position
    setTimeout(() => {
        if (window.scrollY > 10) {
            // User refreshed while scrolled down, so skip the hero lock
            pageState = "content";
            if (heroEl) {
                heroEl.style.position = "absolute";
                heroEl.style.opacity = "1";
                heroEl.style.zIndex = "100";
            }
            gsap.set(".hero-content", { opacity: 0, scale: 0.85 });
            if (navbar) {
                navbar.classList.add("nav-solid");
                navbar.classList.remove("nav-hidden");
            }
            unlockScroll();
        } else {
            // Normal start from the top
            pageState = "hero";
            window.scrollTo(0, 0);
            lockScroll();
        }
    }, 50);

    function playEntrance() {
        if (pageState !== "hero") return;
        pageState = "animating";
        lockScroll();

        const targetScroll = spacer ? spacer.offsetHeight : window.innerHeight;

        const tl = gsap.timeline({
            onComplete: () => {
                if (heroEl) {
                    heroEl.style.position = "absolute";
                    heroEl.style.opacity = "1";
                    heroEl.style.zIndex = "100";
                }
                
                state.frame = 0;
                state.lastDrawnFrame = -1;
                render();

                if (navbar) {
                    navbar.classList.remove("nav-hidden");
                    navbar.classList.add("nav-solid");
                }

                setTimeout(() => {
                    pageState = "content";
                    unlockScroll();
                }, 100);
            }
        });

        if (navbar) navbar.classList.add("nav-hidden");

        tl.to(".hero-content", {
            opacity: 0, scale: 0.85,
            duration: 0.5, ease: "power1.in"
        }, 0);

        tl.to(state, {
            frame: FRAME_COUNT - 1,
            ease: "power1.inOut",
            onUpdate: render,
            duration: 2.0
        }, 0.1);

        const scrollObj = { y: 0 };
        tl.to(scrollObj, {
            y: targetScroll,
            duration: 0.8,
            ease: "power2.inOut",
            onUpdate: () => window.scrollTo(0, scrollObj.y)
        }, 1.3);
    }

    window.addEventListener('wheel', (e) => {
        if (pageState === "hero" || pageState === "animating") {
            e.preventDefault();
        }
        if (pageState === "hero" && e.deltaY > 0) {
            playEntrance();
        }
    }, { passive: false });

    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
        if (pageState === "hero" || pageState === "animating") {
            e.preventDefault();
        }
        const deltaY = touchStartY - e.touches[0].clientY;
        if (pageState === "hero" && deltaY > 20) {
            playEntrance();
        }
    }, { passive: false });

    window.addEventListener('scroll', () => {
        if (pageState !== "content") return;

        if (window.scrollY <= 2) {
            pageState = "hero";
            lockScroll();
            window.scrollTo(0, 0);

            if (heroEl) {
                heroEl.style.position = "fixed";
            }
            gsap.set(".hero-content", { opacity: 1, scale: 1 });
            
            if (navbar) {
                navbar.classList.remove("nav-solid");
                navbar.classList.remove("nav-hidden");
            }
        }
    });
});
