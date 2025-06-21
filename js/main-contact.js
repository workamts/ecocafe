/*==============================
=   EcoCafé - JS
=   File: main-contact.js
==============================*/

/*==============================
=   Contact form
==============================*/
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const successMsg = document.getElementById('form-success');
    const honeypot = form.querySelector('input[name="website"]');
    let submitStartTime = Date.now();

    // Custom validations
    const validators = {
        fullname: value => {
            if (!value.trim()) return { type: 'required', msg: 'The name is required.' };
            if (value.length < 3) return { type: 'min', msg: 'Must have at least 3 characters.' };
            if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s.'-]+$/.test(value)) return { type: 'format', msg: 'Only letters and spaces.' };
            return null;
        },
        email: value => {
            if (!value.trim()) return { type: 'required', msg: 'Only letters and spaces.' };
            if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(value)) return { type: 'format', msg: 'Invalid email.' };
            return null;
        },
        subject: value => {
            if (!value.trim()) return { type: 'required', msg: 'The subject is mandatory.' };
            if (value.length < 4) return { type: 'min', msg: 'Must have at least 4 characters.' };
            if (value.length > 80) return { type: 'max', msg: 'Maximum 80 characters.' };
            return null;
        },
        message: value => {
            if (!value.trim()) return { type: 'required', msg: 'The message is required.' };
            if (value.length < 10) return { type: 'min', msg: 'Must have at least 10 characters.' };
            if (value.length > 1000) return { type: 'max', msg: 'Maximum 1000 characters.' };
            return null;
        },
        terms: checked => checked ? null : { type: 'required', msg: 'You must accept the privacy policy.' }
    };

    // Fields to validate
    const fields = ['fullname', 'email', 'phone', 'subject', 'message', 'terms'];

    // --- Phone filter ---
    const phoneInput = form.elements['phone'];
    if (phoneInput) {
        phoneInput.addEventListener('input', function () {
            let val = this.value;

            val = val.replace(/[^\d+\s]/g, '');
            val = val.replace(/^(\+{2,})/, '+');
            val = val.replace(/(?!^)\+/, '');
            val = val.replace(/\s{2,}/g, ' ');

            let compact = val.replace(/\s+/g, '');

            // Only accepts 2-digit country code
            let match = compact.match(/^(\+)(\d{2})(\d{7,16})$/);
            if (match) {
                let code = match[1] + match[2];
                let rest = match[3];
                val = code + ' ' + rest;
            } else if (compact.match(/^(\+)(\d{2})$/)) {
                // Only country code, no number yet
                val = compact;
            } else {
                // If no country code, just clean up extra spaces
                val = val.replace(/\s+/g, ' ');
            }

            this.value = val.trim();
        });
    }

    // --- Validator JS ---
    validators.phone = value => {
        if (!value) return null;
        const cleaned = value.replace(/[^\d]/g, '');
        if (cleaned.length < 7 || cleaned.length > 16) {
            return { type: 'format', msg: 'Invalid phone number. Must be between 7 and 16 digits.' };
        }
        // Only accepts 2-digit country code
        if (!/^(\+\d{2}\s)?\d{7,16}$/.test(value.replace(/\s+/g, ''))) {
            return { type: 'format', msg: 'Invalid phone number. Use format +57 1234567890 or 3124696123' };
        }
        return null;
    };

    // --- Visual feedback and messages ---
    function showError(field, error, forceRequired = false) {
        const input = form.elements[field];
        const errorDiv = document.getElementById(`${field}-error`);
        let show = false;
        let msg = '';

        // For required fields, only display the "required" error if forceRequired is true
        if (
            (field === 'fullname' || field === 'email' || field === 'subject' || field === 'message' || field === 'terms')
            && error
        ) {
            if (error.type === 'required' && !forceRequired) {
                show = false;
            } else {
                show = true;
                msg = error.msg;
            }
        } else if (error) {
            show = true;
            msg = error.msg || error;
        }

        if (input) {
            const isEmpty = field === 'terms'
                ? !input.checked
                : !input.value.trim();
            if (show) {
                input.setAttribute('aria-invalid', 'true');
            } else if (!show && !isEmpty) {
                input.setAttribute('aria-invalid', 'false');
            } else {
                input.removeAttribute('aria-invalid');
            }
        }
        errorDiv.textContent = show ? msg : '';
        errorDiv.style.display = show ? 'block' : 'none';
    }

    // --- Validate a single field ---
    function validateField(field, forceRequired = false) {
        let value;
        if (field === 'terms') {
            value = form.elements[field].checked;
        } else {
            value = form.elements[field].value;
        }
        const error = validators[field](value);
        showError(field, error, forceRequired);
        return !error;
    }

    // --- Validate the entire form ---
    function validateForm() {
        let valid = true;
        fields.forEach(field => {
            if (!validateField(field)) valid = false;
        });
        // Honeypot and minimum time (2s)
        if (honeypot.value) valid = false;
        if (Date.now() - submitStartTime < 2000) valid = false;

        // Change the visual and accessible state of the button (DO NOT use disabled)
        if (!valid) {
            submitBtn.classList.add('is-disabled');
            submitBtn.setAttribute('aria-disabled', 'true');
        } else {
            submitBtn.classList.remove('is-disabled');
            submitBtn.setAttribute('aria-disabled', 'false');
        }
        return valid;
    }

    // Real-time validation (does not show "required")
    fields.forEach(field => {
        const el = form.elements[field];
        if (!el) return;
        el.addEventListener(field === 'terms' ? 'change' : 'input', () => {
            validateField(field, false);
            validateForm();
        });
        el.addEventListener('blur', () => validateField(field, false));
    });

    // Enable button only if all are valid and minimum time has passed
    form.addEventListener('input', validateForm);

    // Show "required" errors if they try to click the "disabled" button
    submitBtn.addEventListener('click', function (e) {
        if (submitBtn.classList.contains('is-disabled')) {
            e.preventDefault();
            fields.forEach(field => {
                validateField(field, true);
            });
            return false;
        }
    });

    // --- Simulated shipment ---
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        let valid = true;
        fields.forEach(field => {
            // Force show "required" error when submitting
            if (!validateField(field, true)) valid = false;
        });
        if (!valid) return;

        // Loading animation
        submitBtn.setAttribute('aria-busy', 'true');
        document.getElementById('submit-btn-loader').style.display = 'inline-block';
        document.getElementById('submit-btn-text').textContent = 'Sending...';

        setTimeout(() => {
            submitBtn.setAttribute('aria-busy', 'false');
            document.getElementById('submit-btn-loader').style.display = 'none';
            document.getElementById('submit-btn-text').textContent = 'Send message';
            successMsg.textContent = "Message sent successfully! We'll get back to you soon!";
            successMsg.classList.add('active');
            form.reset();
            fields.forEach(field => showError(field, ''));
            submitBtn.classList.add('is-disabled');
            submitBtn.setAttribute('aria-disabled', 'true');
            submitStartTime = Date.now();
        }, 1800);
    });

    // Initial
    validateForm();

    // --- Auto-resize for textarea ---
    const textarea = document.querySelector('#contact-form textarea');
    if (!textarea) return;
    textarea.addEventListener('input', function () {
        this.style.height = 'auto';
        const maxHeight = parseInt(getComputedStyle(this).maxHeight);

        if (this.scrollHeight <= maxHeight) {
            this.style.height = this.scrollHeight + 'px';
        } else {
            this.style.height = maxHeight + 'px';
        }
    });
});