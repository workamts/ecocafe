/*==============================
=   EcoCafé - JS
=   Page: login
=   File: login.js
==============================*/

/*==============================
=   Login Form
==============================*/

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const loginEmail = document.getElementById("login-email");
    const loginPassword = document.getElementById("login-password");
    const showLoginPassword = document.getElementById("show-login-password");
    const loginMessage = document.getElementById("login-message");

    showLoginPassword.addEventListener("change", () => {
        loginPassword.type = showLoginPassword.checked ? "text" : "password";
    });

    loginEmail.addEventListener("input", validateLoginEmail);
    loginPassword.addEventListener("input", validateLoginPassword);

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        loginMessage.textContent = "";
        loginMessage.classList.remove("success", "error");

        const email = loginEmail.value.trim().toLowerCase();
        const password = loginPassword.value.trim();

        let valid = validateLoginEmail() & validateLoginPassword();
        if (!valid) return;

        const users = JSON.parse(localStorage.getItem("users") || "{}");
        const savedUser = users[email];

        if (!savedUser || savedUser.password !== password) {
            showLoginMessage("Incorrect email or password.", "error");
            return;
        }

        localStorage.setItem("loggedInUser", email);
        showLoginMessage("✅ Welcome back!", "success");

        setTimeout(() => {
            window.location.href = "../index.html";
        }, 1000);
    });

    function validateLoginEmail() {
        const email = loginEmail.value.trim();
        const regex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if (!regex.test(email)) {
            showFieldError(loginEmail, "login-email", "Please enter a valid email.");
            return false;
        }
        clearFieldError(loginEmail, "login-email");
        return true;
    }

    function validateLoginPassword() {
        const password = loginPassword.value.trim();
        if (password.length < 8) {
            showFieldError(loginPassword, "login-password", "The password must be at least 8 characters long..");
            return false;
        }
        clearFieldError(loginPassword, "login-password");
        return true;
    }

    function showLoginMessage(message, type = "") {
        loginMessage.textContent = message;
        loginMessage.classList.remove("success", "error");
        if (type) loginMessage.classList.add(type); // type: 'success' or 'error'
        loginMessage.style.opacity = "1";
        if (type === "success") {
            setTimeout(() => {
                loginMessage.textContent = "";
                loginMessage.classList.remove("success");
            }, 4000);
        }
    }

    function showFieldError(input, id, message) {
        input.setAttribute("aria-invalid", "true");
        document.getElementById(`${id}-error`).textContent = message;
    }

    function clearFieldError(input, id) {
        input.setAttribute("aria-invalid", "false");
        document.getElementById(`${id}-error`).textContent = "";
    }
});