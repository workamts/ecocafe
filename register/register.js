/*==============================
=   EcoCafé - JS
=   Page: Register
=   File: Register.js
==============================*/

/*==============================
=   Register Form
==============================*/

document.addEventListener("DOMContentLoaded", () => {
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    const loggedInEmail = localStorage.getItem("loggedInUser");

    if (loggedInEmail && users[loggedInEmail]) {
        window.location.href = "../index.html";
        return;
    }

    const form = document.getElementById("register-form");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("register-email");
    const passwordInput = document.getElementById("register-password");
    const confirmPasswordInput = document.getElementById("confirm-password");
    const termsCheckbox = document.getElementById("terms");
    const showPassword = document.getElementById("show-register-password");
    const showConfirmPassword = document.getElementById("show-confirm-password");
    const registerMessage = document.getElementById("register-message");
    const btnRegister = document.getElementById("btn-register");

    confirmPasswordInput.addEventListener("paste", (e) => e.preventDefault());
    passwordInput.addEventListener("copy", (e) => e.preventDefault());

    showPassword.addEventListener("change", () => {
        passwordInput.type = showPassword.checked ? "text" : "password";
    });

    showConfirmPassword.addEventListener("change", () => {
        confirmPasswordInput.type = showConfirmPassword.checked ? "text" : "password";
    });

    nameInput.addEventListener("input", () => {
        validateName();
        checkFormValidity();
    });
    emailInput.addEventListener("input", () => {
        validateEmail();
        checkFormValidity();
    });
    passwordInput.addEventListener("input", () => {
        validatePassword();
        checkFormValidity();
    });
    confirmPasswordInput.addEventListener("input", () => {
        validateConfirmPassword();
        checkFormValidity();
    });
    termsCheckbox.addEventListener("change", checkFormValidity);

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        registerMessage.textContent = "";
        registerMessage.classList.remove("success", "error");

        // Validate all fields and display errors if missing
        const validName = validateName();
        const validEmail = validateEmail();
        const validPassword = validatePassword();
        const validConfirm = validateConfirmPassword();
        let validTerms = true;

        if (!termsCheckbox.checked) {
            showError("terms", "You must accept the terms and conditions.");
            validTerms = false;
        } else {
            showError("terms", "");
        }

        // If any field is invalid, do not submit the form
        if (!(validName && validEmail && validPassword && validConfirm && validTerms)) {
            checkFormValidity();
            return;
        }

        const email = emailInput.value.trim().toLowerCase();
        const user = {
            name: nameInput.value.trim(),
            email,
            password: passwordInput.value.trim(),
        };

        saveUser(email, user);
        localStorage.setItem("loggedInUser", email);
        showRegisterMessage("✅ Account created successfully!", "success");
        form.reset();

        setTimeout(() => {
            window.location.href = "../index.html";
        }, 1000);
    });

    function validateName() {
        const value = nameInput.value.trim();
        const regex = /^[a-zA-Z\s]{3,40}$/;
        if (!value) {
            showFieldError(nameInput, "name", "Full name is required.");
            return false;
        }
        if (!regex.test(value)) {
            showFieldError(nameInput, "name", "Name must be 3-40 letters and spaces.");
            return false;
        }
        clearFieldError(nameInput, "name");
        return true;
    }

    function validateEmail() {
        const value = emailInput.value.trim();
        const regex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if (!value) {
            showFieldError(emailInput, "register-email", "Email is required.");
            return false;
        }
        if (!regex.test(value)) {
            showFieldError(emailInput, "register-email", "Enter a valid email address.");
            return false;
        }
        clearFieldError(emailInput, "register-email");
        return true;
    }

    function validatePassword() {
        const value = passwordInput.value.trim();
        if (!value) {
            showFieldError(passwordInput, "register-password", "Password is required.");
            return false;
        }
        const valid = value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value);
        if (!valid) {
            showFieldError(passwordInput, "register-password", "At least 8 chars, one uppercase and one number.");
            return false;
        }
        clearFieldError(passwordInput, "register-password");
        if (confirmPasswordInput.value.trim() !== "") {
            validateConfirmPassword();
        }
        return true;
    }

    function validateConfirmPassword() {
        const value = confirmPasswordInput.value.trim();
        if (!value) {
            showFieldError(confirmPasswordInput, "confirm-password", "Please confirm your password.");
            return false;
        }
        if (value !== passwordInput.value.trim()) {
            showFieldError(confirmPasswordInput, "confirm-password", "Passwords do not match.");
            return false;
        }
        clearFieldError(confirmPasswordInput, "confirm-password");
        return true;
    }

    function showRegisterMessage(message, type = "") {
        registerMessage.textContent = message;
        registerMessage.classList.remove("success", "error");
        if (type) registerMessage.classList.add(type);
        registerMessage.style.opacity = "1";
        if (type === "success") {
            setTimeout(() => {
                registerMessage.textContent = "";
                registerMessage.classList.remove("success");
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

    function showError(id, message) {
        document.getElementById(`${id}-error`).textContent = message;
    }

    function saveUser(email, user) {
        users[email] = user;
        localStorage.setItem("users", JSON.stringify(users));
    }

    // Enable/disable button according to validity
    function checkFormValidity() {
        const valid =
            validateName() &&
            validateEmail() &&
            validatePassword() &&
            validateConfirmPassword() &&
            termsCheckbox.checked;
        btnRegister.disabled = !valid;
    }

    // Initializes the button state on page load
    checkFormValidity();
});