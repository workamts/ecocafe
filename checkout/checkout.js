/*==============================
=   EcoCafé - CSS
=   Page: checkout
=   File: checkout.js
==============================*/

/*==============================
=   Form to Make Payment
==============================*/

// --- Simulate user balance and cart ---
let userBalance = parseInt(localStorage.getItem('userBalance') || '20000', 10);
let currentBalance = userBalance;
let submitting = false;

// Load cart from localStorage (real app structure)
let checkoutCartObj = JSON.parse(localStorage.getItem('cart')) || {};
let checkoutCart = Object.entries(checkoutCartObj).map(([key, item]) => ({ ...item, _key: key }));


// --- Discount simulation ---
let appliedDiscount = 0;
let appliedDiscountCode = "";

function applyDiscount(code) {
    code = code.trim().toUpperCase();
    if (code === "ECO10") {
        appliedDiscount = 0.10; // 10%
        appliedDiscountCode = code;
        return { success: true, message: "10% discount applied." };
    }
    appliedDiscount = 0;
    appliedDiscountCode = "";
    return { success: false, message: "Invalid or expired code." };
}


// --- Validation and UI utilities ---
function setInputState(input, valid, message = "") {
    if (!input) return;

    let msg = input.parentElement.querySelector('.input__error');
    if (!msg) {
        msg = document.createElement('div');
        msg.className = 'input__error';
        input.parentElement.appendChild(msg);
    }
    msg.textContent = valid ? "" : message;
}

function addLiveValidation(input, validator, message) {
    input.addEventListener('input', () => {
        const valid = validator(input.value);
        setInputState(input, valid, message);
    });
}


// --- Render cart products in summary ---
function renderCartSummary() {
    const resumen = document.getElementById('order-summary-products');
    if (!resumen) return;

    // Busca el template
    const template = resumen.querySelector('article.item[style*="display: none"]');
    if (!template) {
        resumen.textContent = "Product template not found.";
        return;
    }

    // Clear previous products (keep the template)
    resumen.querySelectorAll('article.item:not([style*="display: none"])').forEach(e => e.remove());

    if (checkoutCart.length === 0) {
        if (!resumen.querySelector('.empty__cart--msg')) {
            const msg = document.createElement('p');
            msg.className = 'empty__cart--msg';
            msg.textContent = "Your cart is empty.";
            resumen.appendChild(msg);
        }
        updateOrderTotal();
        return;
    } else {
        const msg = resumen.querySelector('.empty__cart--msg');
        if (msg) msg.remove();
    }

    checkoutCart.forEach(producto => {
        const clone = template.cloneNode(true);
        clone.style.display = "flex";

        // Image
        const img = clone.querySelector('img');
        if (img) {
            img.src = producto.image || producto.imagen || '';
            img.alt = producto.productName || producto.nombre || '';
        }

        // Quantity in the top right corner
        const qty = producto.quantity || producto.cantidad || 0;
        const qtySpan = clone.querySelector('.item__quantity');
        if (qtySpan) {
            qtySpan.textContent = `x${qty}`;
        }

        // Name
        const nameP = clone.querySelector('.item__details > p');
        if (nameP) nameP.textContent = producto.productName || producto.nombre || '';

        // Presentation and quantity
        const attrs = clone.querySelectorAll('.product__attribute');
        if (attrs[0]) {
            const label = attrs[0].querySelector('.product__label');
            const value = attrs[0].querySelector('.product__value');
            if (label) label.textContent = 'Presentation:';
            if (value) value.textContent = producto.kgPerUnit ? (producto.kgPerUnit + " kg") : (producto.presentacion || 'Unknown');
        }
        if (attrs[1]) {
            const label = attrs[1].querySelector('.product__label');
            const value = attrs[1].querySelector('.product__value');
            if (label) label.textContent = 'Quantity:';
            if (value) value.textContent = qty;
        }

        // PTotal price per product
        const precioUnitario = producto.pricePerKg || producto.precio || 0;
        const precioTotal = precioUnitario * qty * (producto.kgPerUnit || 1);
        const totalDiv = clone.querySelector('.product__total');
        if (totalDiv) {
            totalDiv.textContent = `Total: $${precioTotal.toLocaleString('es-CO')},00`;
        }

        // Remove button
        let removeBtn = clone.querySelector('.remove__item');
        if (!removeBtn) {
            removeBtn = document.createElement('button');
            removeBtn.className = 'remove__item';
            removeBtn.type = 'button';
            clone.appendChild(removeBtn);
        } else {
            removeBtn.type = 'button';
        }
        removeBtn.onclick = () => {
            delete checkoutCartObj[producto._key];
            checkoutCart = checkoutCart.filter(p => p._key !== producto._key);
            localStorage.setItem('cart', JSON.stringify(checkoutCartObj));
            renderCartSummary();
            updateOrderTotal();
        };

        resumen.appendChild(clone);
    });
    updateOrderTotal();
}

// --- Update order total and selected shipping method ---
function updateOrderTotal() {
    let subtotal = checkoutCart.reduce((sum, p) => {
        const precio = p.pricePerKg || p.precio || 0;
        const cantidad = p.quantity || p.cantidad || 0;
        const kgPerUnit = p.kgPerUnit || 1;
        return sum + (precio * cantidad * kgPerUnit);
    }, 0);

    // Shipping (adjust according to your selection logic)
    let envio = 0;
    const shippingRadios = document.querySelectorAll('input[name="shipping"]');
    if (shippingRadios.length > 1 && shippingRadios[1].checked) {
        envio = 10000;
    } else {
        envio = 5000;
    }

    // Update totals in the DOM
    const summary = document.getElementById('summary-total');
    if (summary) {
        const spans = summary.querySelectorAll('span');
        if (spans[0]) spans[0].textContent = `$${subtotal.toLocaleString('es-CO')},00`;
        if (spans[1]) spans[1].textContent = `$${envio.toLocaleString('es-CO')},00`;
        if (spans[2]) spans[2].textContent = `$${(subtotal + envio).toLocaleString('es-CO')},00`;
    }
}


// --- Show/hide payment gateway fields based on selected method ---
function showPaymentGateway(method) {
    document.querySelectorAll('.payment__extra').forEach(div => {
        div.setAttribute('aria-hidden', 'true');
    });
    if (!method) return;
    // Find the .payment__extra div for the method
    const radio = document.getElementById(method);
    if (radio) {
        const paymentOption = radio.closest('.payment__option');
        if (paymentOption) {
            const extra = paymentOption.querySelector('.payment__extra');
            if (extra) extra.setAttribute('aria-hidden', 'false');
        }
    }
}


// --- Payment gateway fields validation ---
function validatePaymentGateway(method) {
    let valid = true;
    let messages = [];
    let firstErrorInput = null;

    // Credit/debit card (MercadoPago, Sistecredito)
    if (method === 'mp' || method === 'sc') {
        const cardNumber = document.getElementById('card-number-' + method);
        const cardName = document.getElementById('card-name-' + method);
        const cardExp = document.getElementById('card-exp-' + method);
        const cardCvv = document.getElementById('card-cvv-' + method);

        const cardNumberOk = cardNumber && /^[0-9]{16}$/.test(cardNumber.value.trim());
        setInputState(cardNumber, cardNumberOk, "Invalid card number (16 digits).");
        if (!cardNumberOk) { valid = false; messages.push('Invalid card number.'); if (!firstErrorInput) firstErrorInput = cardNumber; }

        const cardNameOk = cardName && cardName.value.trim().length >= 3;
        setInputState(cardName, cardNameOk, "Cardholder name required.");
        if (!cardNameOk) { valid = false; messages.push('Cardholder name required.'); if (!firstErrorInput) firstErrorInput = cardName; }

        const cardExpOk = cardExp && /^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExp.value.trim());
        setInputState(cardExp, cardExpOk, "Format MM/YY.");
        if (!cardExpOk) { valid = false; messages.push('Invalid expiration date.'); if (!firstErrorInput) firstErrorInput = cardExp; }

        const cardCvvOk = cardCvv && /^[0-9]{3,4}$/.test(cardCvv.value.trim());
        setInputState(cardCvv, cardCvvOk, "Invalid CVV.");
        if (!cardCvvOk) { valid = false; messages.push('Invalid CVV.'); if (!firstErrorInput) firstErrorInput = cardCvv; }
    }

    // PSE
    if (method === 'pse') {
        const pseBank = document.getElementById('pse-bank');
        const pseBankOk = pseBank && pseBank.value.trim().length > 0;
        setInputState(pseBank, pseBankOk, "Select a bank.");
        if (!pseBankOk) { valid = false; messages.push('Select a bank for PSE.'); if (!firstErrorInput) firstErrorInput = pseBank; }
    }

    // Cash on delivery
    if (method === 'pce') {
        const addressInput = document.querySelector('input[name="address"]');
        const phoneInput = document.querySelector('input[name="phone"]');
        const addressOk = addressInput && addressInput.value.trim().length >= 5;
        setInputState(addressInput, addressOk, "Confirm your address.");
        if (!addressOk) { valid = false; messages.push('Confirm your address for cash on delivery.'); if (!firstErrorInput) firstErrorInput = addressInput; }
        const phoneOk = phoneInput && /^[0-9]{7,15}$/.test(phoneInput.value.trim());
        setInputState(phoneInput, phoneOk, "Confirm your phone.");
        if (!phoneOk) { valid = false; messages.push('Confirm your phone for cash on delivery.'); if (!firstErrorInput) firstErrorInput = phoneInput; }
    }
    return { valid, messages, firstErrorInput };
}


// --- Main form validation ---
function validateForm() {
    let valid = true;
    let messages = [];
    let firstErrorInput = null;

    // Name
    const nameInput = document.querySelector('input[name="name"]');
    const nameVal = nameInput ? nameInput.value.trim() : "";
    const nameOk = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,}$/.test(nameVal);
    setInputState(nameInput, nameOk, "Enter a valid name (min 3 letters, only letters and spaces).");
    if (!nameOk) { valid = false; messages.push('Invalid name.'); if (!firstErrorInput) firstErrorInput = nameInput; }

    // Last name
    const lastNameInput = document.querySelector('input[name="last-names"]');
    const lastNameVal = lastNameInput ? lastNameInput.value.trim() : "";
    const lastNameOk = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,}$/.test(lastNameVal);
    setInputState(lastNameInput, lastNameOk, "Enter a valid last name (min 3 letters, only letters and spaces).");
    if (!lastNameOk) { valid = false; messages.push('Invalid last name.'); if (!firstErrorInput) firstErrorInput = lastNameInput; }

    // Document Type
    const docTypeInput = document.querySelector('select[name="doc-type"]');
    if (docTypeInput && docTypeInput.value === "") {
        valid = false;
        messages.push('Select document type.');
        if (!firstErrorInput) firstErrorInput = docTypeInput;
    }

    // Document number
    const docInput = document.querySelector('input[name="document-number"]');
    const docVal = docInput ? docInput.value.trim() : "";
    const docOk = /^[0-9A-Za-z]{5,20}$/.test(docVal);
    setInputState(docInput, docOk, "Enter a valid document number (5-20 characters).");
    if (!docOk) { valid = false; messages.push('Invalid document number.'); if (!firstErrorInput) firstErrorInput = docInput; }

    // Email
    const emailInput = document.querySelector('input[name="email"]');
    const emailVal = emailInput ? emailInput.value.trim() : "";
    const emailOk = /^[\w\.-]+@[\w\.-]+\.\w{2,}$/.test(emailVal);
    setInputState(emailInput, emailOk, "Enter a valid email address..");
    if (!emailOk) { valid = false; messages.push('Invalid email address.'); if (!firstErrorInput) firstErrorInput = emailInput; }

    // Phone
    const phoneInput = document.querySelector('input[name="phone"]');
    const phoneVal = phoneInput ? phoneInput.value.trim() : "";
    const phoneOk = /^[0-9]{7,15}$/.test(phoneVal);
    setInputState(phoneInput, phoneOk, "Enter a valid phone (numbers only, 7-15 digits).");
    if (!phoneOk) { valid = false; messages.push('Invalid phone.'); if (!firstErrorInput) firstErrorInput = phoneInput; }

    // Country
    const countryInput = document.querySelector('input[name="country"]');
    const countryVal = countryInput ? countryInput.value.trim() : "";
    const countryOk = countryVal.length >= 3;
    setInputState(countryInput, countryOk, "Enter a valid country.");
    if (!countryOk) { valid = false; messages.push('Invalid country.'); if (!firstErrorInput) firstErrorInput = countryInput; }

    // City
    const cityInput = document.querySelector('input[name="city"]');
    const cityVal = cityInput ? cityInput.value.trim() : "";
    const cityOk = cityVal.length >= 2;
    setInputState(cityInput, cityOk, "Enter a valid city.");
    if (!cityOk) { valid = false; messages.push('Invalid city.'); if (!firstErrorInput) firstErrorInput = cityInput; }

    // Address
    const addressInput = document.querySelector('input[name="address"]');
    const addressVal = addressInput ? addressInput.value.trim() : "";
    const addressOk = addressVal.length >= 5;
    setInputState(addressInput, addressOk, "Enter a valid address (min 5 characters).");
    if (!addressOk) { valid = false; messages.push('Invalid address.'); if (!firstErrorInput) firstErrorInput = addressInput; }

    // Postal code
    const postalInput = document.querySelector('input[name="postal-code"]');
    const postalVal = postalInput ? postalInput.value.trim() : "";
    const postalOk = /^[0-9]{4,10}$/.test(postalVal);
    setInputState(postalInput, postalOk, "Enter a valid postal code (4-10 digits).");
    if (!postalOk) { valid = false; messages.push('Invalid postal code.'); if (!firstErrorInput) firstErrorInput = postalInput; }

    // Shipping method
    const shippingInputs = document.querySelectorAll('input[name="shipping"]');
    const shippingInput = document.querySelector('input[name="shipping"]:checked');
    if (!shippingInput) {
        valid = false;
        messages.push('Select a shipping method.');
        if (!firstErrorInput && shippingInputs.length) firstErrorInput = shippingInputs[0];
    }

    // Payment method
    const paymentInputs = document.querySelectorAll('input[name="payment"]');
    const paymentInput = document.querySelector('input[name="payment"]:checked');
    if (!paymentInput) {
        valid = false;
        messages.push('Select a payment method.');
        if (!firstErrorInput && paymentInputs.length) firstErrorInput = paymentInputs[0];
    }

    // Validate payment gateway fields
    if (paymentInput) {
        const paymentMethod = paymentInput.id;
        const gatewayValidation = validatePaymentGateway(paymentMethod);
        if (!gatewayValidation.valid) {
            valid = false;
            messages = messages.concat(gatewayValidation.messages);
            if (!firstErrorInput && gatewayValidation.firstErrorInput) firstErrorInput = gatewayValidation.firstErrorInput;
        }
    }

    // Discount code
    const discountInput = document.querySelector('input[name="discount-code"]');
    if (discountInput && discountInput.value.trim() !== "") {
        const result = applyDiscount(discountInput.value);
        if (!result.success) {
            valid = false;
            messages.push(result.message);
            if (!firstErrorInput) firstErrorInput = discountInput;
            setInputState(discountInput, false, result.message);
        } else {
            setInputState(discountInput, true, "");
        }
    }

    // Sufficient balance
    let shippingCost = 0;
    if (shippingInput && shippingInput.closest('.shipping__option')) {
        const priceText = shippingInput.closest('.shipping__option').querySelector('.price').textContent || "$0";
        shippingCost = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
    }
    let subtotal = checkoutCart.reduce((sum, p) => {
        const precio = p.pricePerKg || p.precio || 0;
        const cantidad = p.quantity || p.cantidad || 0;
        const kgPerUnit = p.kgPerUnit || 1;
        return sum + (precio * cantidad * kgPerUnit);
    }, 0);
    let discountAmount = Math.floor(subtotal * appliedDiscount);
    const totalOrder = subtotal - discountAmount + shippingCost;

    if (currentBalance < totalOrder) {
        valid = false;
        messages.push('Insufficient balance to complete payment.');
    }

    // Cart not empty
    if (checkoutCart.length === 0) {
        valid = false;
        messages.push('No products in the cart.');
    }

    return { valid, messages, firstErrorInput, totalOrder };
}


// --- Show error message ---
function showErrors(messages) {
    let errorDiv = document.querySelector('.form__errors');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'form__errors';
        errorDiv.setAttribute('tabindex', '-1');
        const form = document.querySelector('form');
        if (form) form.prepend(errorDiv);
    }

    // If only insufficient balance, show only that
    if (
        messages.length === 1 &&
        messages[0].toLowerCase().includes('insufficient balance')
    ) {
        errorDiv.innerHTML = `<div class="input__error">${messages[0]}</div>`;
        errorDiv.style.display = 'block';
        errorDiv.focus();
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    errorDiv.style.display = 'block';
    errorDiv.focus();
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


// --- Show success message and update balance/cart ---
function showSuccess(totalOrder) {
    localStorage.setItem('lastPaymentMethod', document.querySelector('input[name="payment"]:checked')?.id || '');

     // Show modal
    const modal = document.getElementById('modal-success');
    const backdrop = document.getElementById('modal-backdrop');
    if (modal && backdrop) {
        modal.style.display = 'block';
        backdrop.style.display = 'block';
        modal.focus();
        modal.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            modal.style.display = 'none';
            backdrop.style.display = 'none';
            window.location.href = '../index.html';
        }, 3000);
    }
}


// --- Update visible balance ---
function updateBalance() {
    let saldoDiv = document.querySelector('.user__balance');
    if (saldoDiv) {
        saldoDiv.textContent = 'Available balance: $' + currentBalance;
    }
}


// --- Save user data for future use ---
function saveUserData() {
    const fields = ['name', 'email', 'phone', 'country', 'city', 'postal', 'document', 'address'];
    let data = {};
    fields.forEach(f => {
        const input = document.querySelector(`input[name="${f}"]`);
        if (input) data[f] = input.value.trim();
    });
    localStorage.setItem('checkoutUserData', JSON.stringify(data));
}


// --- Load saved user data ---
function loadUserData() {
    const data = JSON.parse(localStorage.getItem('checkoutUserData') || '{}');
    Object.entries(data).forEach(([key, value]) => {
        const input = document.querySelector(`input[name="${key}"]`);
        if (input) input.value = value;
    });
}


// --- Restrict characters in payment method inputs ---
function restrictPaymentInputs() {
    // Only numbers for card and CVV
    document.querySelectorAll('#card-number-mp, #card-number-sc, #card-cvv-mp, #card-cvv-sc').forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    });
    // Only letters and spaces for cardholder name
    document.querySelectorAll('#card-name-mp, #card-name-sc').forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ ]/g, '');
        });
    });
    // Only MM/YY format for expiration
    document.querySelectorAll('#card-exp-mp, #card-exp-sc').forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9/]/g, '').slice(0, 5);
        });
    });
}


// --- Save payment method data ---
function savePaymentData(method) {
    let data = {};
    if (method === 'mp' || method === 'sc') {
        data['card-number'] = document.getElementById('card-number-' + method)?.value || '';
        data['card-name'] = document.getElementById('card-name-' + method)?.value || '';
        data['card-exp'] = document.getElementById('card-exp-' + method)?.value || '';
        data['card-cvv'] = document.getElementById('card-cvv-' + method)?.value || '';
    }
    if (method === 'pse') {
        data['pse-bank'] = document.getElementById('pse-bank')?.value || '';
    }
    localStorage.setItem('paymentData-' + method, JSON.stringify(data));
}


// --- Load payment method data ---
function loadPaymentData(method) {
    const data = JSON.parse(localStorage.getItem('paymentData-' + method) || '{}');
    if (method === 'mp' || method === 'sc') {
        if (data['card-number']) document.getElementById('card-number-' + method).value = data['card-number'];
        if (data['card-name']) document.getElementById('card-name-' + method).value = data['card-name'];
        if (data['card-exp']) document.getElementById('card-exp-' + method).value = data['card-exp'];
        if (data['card-cvv']) document.getElementById('card-cvv-' + method).value = data['card-cvv'];
    }
    if (method === 'pse') {
        if (data['pse-bank']) document.getElementById('pse-bank').value = data['pse-bank'];
    }
}

function isVisible(element) {
    if (!element) return false;
    // If the element or any parent has display: none or visibility: hidden or aria-hidden="true"
    let el = element;
    while (el) {
        if (el.style && (el.style.display === "none" || el.style.visibility === "hidden")) return false;
        if (el.getAttribute && el.getAttribute("aria-hidden") === "true") return false;
        if (el.offsetParent === null && el !== document.body) return false;
        el = el.parentElement;
    }
    return true;
}


// --- Initialization and events ---
window.addEventListener('DOMContentLoaded', () => {
    renderCartSummary();

    let saldoDiv = document.querySelector('.user__balance');
    if (!saldoDiv) {
        saldoDiv = document.createElement('div');
        saldoDiv.className = 'user__balance';
        saldoDiv.textContent = 'Available balance: $' + currentBalance;
        document.querySelector('form').prepend(saldoDiv);
    }
    loadUserData();
    restrictPaymentInputs();

    // Live validation for main fields
    const nameInput = document.querySelector('input[name="name"]');
    if (nameInput) addLiveValidation(nameInput, v => /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,}$/.test(v.trim()), "Enter a valid name (min 3 letters, only letters and spaces).");

    const lastNameInput = document.querySelector('input[name="last-names"]');
    if (lastNameInput) addLiveValidation(lastNameInput, v => /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,}$/.test(v.trim()), "Enter a valid last name (min 3 letters, only letters and spaces).");

    const docInput = document.querySelector('input[name="document-number"]');
    if (docInput) addLiveValidation(docInput, v => /^[0-9A-Za-z]{5,20}$/.test(v.trim()), "Enter a valid document number (5-20 characters).");

    const emailInput = document.querySelector('input[name="email"]');
    if (emailInput) addLiveValidation(emailInput, v => /^[\w\.-]+@[\w\.-]+\.\w{2,}$/.test(v.trim()), "Enter a valid email address.");

    const phoneInput = document.querySelector('input[name="phone"]');
    if (phoneInput) addLiveValidation(phoneInput, v => /^[0-9]{7,15}$/.test(v.trim()), "Enter a valid phone (numbers only, 7-15 digits).");

    const countryInput = document.querySelector('input[name="country"]');
    if (countryInput) addLiveValidation(countryInput, v => v.trim().length >= 3, "Enter a valid country.");

    const cityInput = document.querySelector('input[name="city"]');
    if (cityInput) addLiveValidation(cityInput, v => v.trim().length >= 2, "Enter a valid city.");

    const addressInput = document.querySelector('input[name="address"]');
    if (addressInput) addLiveValidation(addressInput, v => v.trim().length >= 5, "Enter a valid address (min 5 characters).");

    const postalInput = document.querySelector('input[name="postal-code"]');
    if (postalInput) addLiveValidation(postalInput, v => /^[0-9]{4,10}$/.test(v.trim()), "Enter a valid postal code (4-10 digits).");

    // Show/hide payment gateway fields based on selected method
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', function() {
            showPaymentGateway(this.id);
            loadPaymentData(this.id);
        });
        if (radio.checked) {
            showPaymentGateway(radio.id);
            loadPaymentData(radio.id);
        }
    });

    // Update summary when shipping method changes
    document.querySelectorAll('input[name="shipping"]').forEach(input => {
        input.addEventListener('change', updateOrderTotal);
    });

    // Select last used payment method
    const lastMethod = localStorage.getItem('lastPaymentMethod');
    if (lastMethod) {
        const lastRadio = document.getElementById(lastMethod);
        if (lastRadio) {
            lastRadio.checked = true;
            showPaymentGateway(lastMethod);
        }
    }

    // Handle form submission
    const payNowBtn = document.getElementById('pay-now');
    const form = document.getElementById('checkout-form');
    if (payNowBtn && form) {
        payNowBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Run the same logic as form submit
            const { valid, messages, firstErrorInput, totalOrder } = validateForm();
            if (!valid) {
                showErrors(messages);
                console.log('firstErrorInput:', firstErrorInput);

                if (firstErrorInput) {
                    if (typeof firstErrorInput.focus === 'function') {
                        firstErrorInput.focus();
                    }
                    if (firstErrorInput.type === 'radio' || firstErrorInput.tagName === 'SELECT') {
                        const group = document.getElementsByName(firstErrorInput.name);
                        for (let el of group) {
                            if (isVisible(el)) {
                                el.focus();
                                break;
                            }
                        }
                    }
                    const scrollTarget = firstErrorInput.closest('.form-group, .shipping__option, .payment__option') || firstErrorInput;
                    scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }

            // Simulate balance
            if (currentBalance < totalOrder) {
                showErrors(['Insufficient balance to complete payment.']);
                return;
            }

            // Save payment method data
            const paymentInput = document.querySelector('input[name="payment"]:checked');
            if (paymentInput) {
                savePaymentData(paymentInput.id);
            }

            // Deduct balance and clear cart
            currentBalance -= totalOrder;
            localStorage.setItem('userBalance', currentBalance);
            localStorage.removeItem('cart');
            checkoutCartObj = {};
            checkoutCart = [];

            // Show success message and update balance/cart
            showSuccess(totalOrder);
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
        });
    }
});


// --- Center footer ---
function centerFooter() {
    const form = document.getElementById('checkout-form');
    const footer = document.querySelector('footer');
    if (!form || !footer) return;

    const formRect = form.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    footer.style.left = (formRect.left + scrollLeft) + 'px';
    footer.style.width = formRect.width + 'px';
}

window.addEventListener('resize', centerFooter);
window.addEventListener('DOMContentLoaded', centerFooter);