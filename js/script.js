/*==========================================================
Gopal Krishna Advanced Rural Research Foundation
JavaScript
==========================================================*/

document.addEventListener("DOMContentLoaded", function () {

    /* ===========================
       Navbar Background on Scroll
    =========================== */

    const navbar = document.querySelector(".navbar");
    const isHomePage = document.getElementById("sequence-canvas") !== null;

    if (!isHomePage) {
        window.addEventListener("scroll", function () {
            if (window.scrollY > 80) {
                navbar.classList.add("nav-solid");
            } else {
                navbar.classList.remove("nav-solid");
            }
        });
    }


    /* ===========================
       Animated Statistics
    =========================== */

    const counters = document.querySelectorAll(".stats h1");

    counters.forEach(counter => {

        const value = counter.innerText;

        if (!isNaN(parseInt(value))) {

            const target = parseInt(value);

            let count = 0;

            const speed = target / 80;

            function updateCounter() {

                count += speed;

                if (count < target) {

                    counter.innerText = Math.floor(count);

                    requestAnimationFrame(updateCounter);

                } else {

                    counter.innerText = value;

                }

            }

            updateCounter();

        }

    });


    /* ===========================
       Scroll Reveal Animation
    =========================== */

    const revealElements = document.querySelectorAll(

        ".division-card, .news-card, .research-grid span"

    );

    const observer = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0px)";

            }

        });

    }, {

        threshold:0.2

    });

    revealElements.forEach(el=>{

        el.style.opacity="0";
        el.style.transform="translateY(60px)";
        el.style.transition="all .8s ease";

        observer.observe(el);

    });


    /* ===========================
       Smooth Anchor Scroll
    =========================== */

    document.querySelectorAll('a[href^="#"]').forEach(anchor=>{

        anchor.addEventListener("click",function(e){

            e.preventDefault();

            document.querySelector(this.getAttribute("href"))
            .scrollIntoView({

                behavior:"smooth"

            });

        });

    });


    /* ===========================
       Active Navigation
    =========================== */

    const links=document.querySelectorAll(".nav-link");

    links.forEach(link=>{

        link.addEventListener("click",function(){

            links.forEach(l=>l.classList.remove("active"));

            this.classList.add("active");

        });

    });

});


/* ===========================
   Scroll To Top Button
=========================== */

const scrollButton=document.createElement("button");

scrollButton.innerHTML="↑";

scrollButton.id="topButton";

document.body.appendChild(scrollButton);

scrollButton.style.position="fixed";
scrollButton.style.right="25px";
scrollButton.style.bottom="25px";
scrollButton.style.width="50px";
scrollButton.style.height="50px";
scrollButton.style.borderRadius="50%";
scrollButton.style.border="none";
scrollButton.style.background="#2E7D32";
scrollButton.style.color="white";
scrollButton.style.fontSize="24px";
scrollButton.style.cursor="pointer";
scrollButton.style.display="none";
scrollButton.style.zIndex="9999";
scrollButton.style.boxShadow="0 8px 20px rgba(0,0,0,.3)";

window.addEventListener("scroll",function(){

    if(window.scrollY>300){

        scrollButton.style.display="block";

    }

    else{

        scrollButton.style.display="none";

    }

});

scrollButton.onclick=function(){

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

};


/* ===========================
   Hero Text Fade In
=========================== */

window.onload=function(){

    const hero=document.querySelector(".hero-content");

    hero.style.opacity="0";

    hero.style.transform="translateY(30px)";

    hero.style.transition="all 1.2s ease";

    setTimeout(function(){

        hero.style.opacity="1";

        hero.style.transform="translateY(0px)";

    },300);

};


/* ===========================
   Footer Year
=========================== */

const footer=document.querySelector("footer center");

if(footer){

footer.innerHTML="© "+new Date().getFullYear()+
" Gopal Krishna Advanced Rural Research Foundation";

}
