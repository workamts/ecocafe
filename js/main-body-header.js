/*==============================
=   EcoCafé - JS
=   File: main-body-header.js
==============================*/

/*==============================
=   Scroll-based Animations
==============================*/

let lastScrollY = window.scrollY;
let scrollDirection = "down";

// Detect scroll direction
window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;
    scrollDirection = currentScrollY > lastScrollY ? "down" : "up";
    lastScrollY = currentScrollY;
});

const navigationType = performance.getEntriesByType("navigation")[0]?.type;

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const el = entry.target;

        if (
            entry.isIntersecting &&
            (
                scrollDirection === "down" ||
                (navigationType === "reload" && !el.dataset.revealedOnReload)
            )
        ) {
            el.classList.add("visible");
            el.classList.remove("animate");
            void el.offsetWidth; // Force reflow to restart animation
            el.classList.add("animate");

            // Mark as revealed on reload to prevent repeating
            if (navigationType === "reload") {
                el.dataset.revealedOnReload = "true";
            }
        }
    });
}, { threshold: 0 });

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.scroll__reveal').forEach(el => observer.observe(el));
});



/*=========================================
=   User Session & UI Authentication UI   =
=========================================*/

document.addEventListener("DOMContentLoaded", () => {
    const greeting = document.getElementById("user-greeting");
    const loginLink = document.querySelector('a[href*="login/login.html"]');
    const registerLink = document.querySelector('a[href*="register/register.html"]');
    const logoutBtn = document.getElementById("logout-btn");
    const userMenu = document.getElementById("user-menu");
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    const loggedInEmail = localStorage.getItem("loggedInUser");

    if (loggedInEmail && users[loggedInEmail]) {
        const user = users[loggedInEmail];
        const firstName = user.name ? user.name.split(" ")[0] : loggedInEmail.split("@")[0];

        greeting.textContent = `${firstName}`;
        loginLink.style.display = "none";
        registerLink.style.display = "none";
        logoutBtn.style.display = "flex";
    } else {
        greeting.textContent = "";
        loginLink.style.display = "flex";
        registerLink.style.display = "flex";
        logoutBtn.style.display = "none";
    }

    // Handle logout from visible button
    logoutBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("loggedInUser");
        location.reload();
    });

    // Populate user menu based on auth status
    if (loggedInEmail) {
        userMenu.innerHTML = `<a href="#" id="logout-link">Sign out</a>`;

        document.getElementById("logout-link").addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("loggedInUser");
            window.location.reload();
        });
    } else {
        userMenu.innerHTML = `
            <a href="../login/login.html">Login</a>
            <a href="../register/register.html">Register</a>
        `;
    }

    // Toggle user menu when clicking #access
    const accessDiv = document.getElementById("access");
    if (accessDiv && userMenu) {
        accessDiv.addEventListener("click", (e) => {
            e.stopPropagation();
            userMenu.classList.toggle("show");
        });

        // Close menu on outside click
        document.addEventListener("click", (e) => {
            if (!accessDiv.contains(e.target) && !userMenu.contains(e.target)) {
                userMenu.classList.remove("show");
            }
        });
    }
});



/*==============================
=   User Menu Interaction UX   =
==============================*/

const userIcon = document.querySelector('.user__icon');
const userMenu = document.getElementById('user-menu');

// Toggle user menu on user icon click
userIcon?.addEventListener('click', (e) => {
    e.stopPropagation();
    userMenu.classList.toggle('show');
});

// Close user menu when clicking outside
document.addEventListener('click', (e) => {
    if (!document.getElementById('user-container')?.contains(e.target)) {
        userMenu.classList.remove('show');
    }
});

// Hide user menu on scroll
window.addEventListener('scroll', () => {
    if (userMenu.classList.contains('show')) {
        userMenu.classList.remove('show');
    }
});
