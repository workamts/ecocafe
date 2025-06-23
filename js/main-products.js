/*==============================
=   EcoCafé - JS
=   File: main-products.js
==============================*/

/*==============================
=   Global variables
==============================*/
let cart = {};
let productsData;
let cartToggle, cartPanel, cartOverlay, closeCartBtn, cartCount, cartContentContainer, cartFooterTotal, emptyCartBtn, checkoutBtn, productsContainer, adminBtn, adminForm, submitNewProductBtn, body;



/*==============================
=   Cart functions
==============================*/
function openCart() {
    cartPanel.setAttribute('aria-hidden', 'false');
    cartPanel.classList.add("open");
    cartOverlay.classList.add("show");
    document.body.classList.add("no-scroll");
    cartToggle.setAttribute('aria-expanded', 'true');
}

function closeCart() {
    cartPanel.setAttribute('aria-hidden', 'true');
    cartPanel.classList.remove("open");
    cartOverlay.classList.remove("show");
    cartOverlay.addEventListener('click', () => closeCart());
    document.body.classList.remove("no-scroll");
    cartToggle.setAttribute('aria-expanded', 'false');

}

function loadCart() {
    const savedCart = localStorage.getItem('cart');
    cart = savedCart ? JSON.parse(savedCart) : {};
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const totalItems = Object.values(cart).reduce((acc, item) => acc + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;
}

function updateCartTotal() {
    const total = Object.values(cart).reduce(
        (acc, item) => acc + item.quantity * item.kgPerUnit * item.pricePerKg,
        0
    );
    if (cartFooterTotal) cartFooterTotal.textContent = `$${total.toLocaleString('es-CO')},00`;
}


function renderCart() {
    if (!cartContentContainer) return;
    cartContentContainer.innerHTML = '';
    if (Object.keys(cart).length === 0) {
        cartContentContainer.innerHTML = '<p>Your cart is empty.</p>';
        updateCartCount();
        updateCartTotal();
        return;
    }
    const template = document.getElementById('cart-item-template');
    Object.entries(cart).forEach(([key, item]) => {
        const clone = template.content.cloneNode(true);
        // Rellenar datos
        const img = clone.querySelector('.cart__img');
        img.src = item.image;
        img.alt = `Imagen del producto ${item.productName}`;

        clone.querySelector('.cart__product--name').textContent = item.productName;
        clone.querySelector('.cart__kg').textContent = `${item.kgPerUnit} kg`;
        clone.querySelector('.cart__qty').textContent = item.quantity;
        clone.querySelector('.cart__qty--value').value = item.quantity;
        clone.querySelector('.item__total').textContent = `$${(item.pricePerKg * item.kgPerUnit * item.quantity).toLocaleString('es-CO')},00`;

        // Botones
        const btnDecrease = clone.querySelector('.cart__btn--decrease');
        const btnIncrease = clone.querySelector('.cart__btn--increase');
        const btnRemove = clone.querySelector('.remove__item');
        btnDecrease.onclick = () => adjustQuantity(key, -1);
        btnIncrease.onclick = () => adjustQuantity(key, 1);
        btnRemove.onclick = () => {
            removeItem(key);
            if (typeof renderCartSummary === 'function') renderCartSummary();
        };

        const qtyInput = clone.querySelector('.cart__qty--value');

        qtyInput.addEventListener('focus', function() {
            setTimeout(() => qtyInput.select(), 0);
        });

        qtyInput.addEventListener('input', function() {
            qtyInput.value = qtyInput.value.replace(/\D/g, '');
            let val = parseInt(qtyInput.value);
            if (val > 1000) qtyInput.value = 1000;
        });

        // If it is empty or less than 1 when you check out, enter 1 and update your cart.
        qtyInput.addEventListener('blur', function() {
            let value = parseInt(qtyInput.value, 10);
            if (qtyInput.value === '' || isNaN(value) || value < 1) {
                qtyInput.value = 1;
                value = 1;
            }
            // Validate available stock
            const totalKgOtherPresentations = Object.entries(cart).reduce((acc, [k, v]) => {
                if (v.productName === item.productName && k !== key) {
                    return acc + v.quantity * v.kgPerUnit;
                }
                return acc;
            }, 0);
            const totalKgAfter = value * item.kgPerUnit;
            if (totalKgOtherPresentations + totalKgAfter > productsData[item.productName].stockKg + item.quantity * item.kgPerUnit) {
                showCartStockWarning(item.productName, productsData[item.productName].stockKg - totalKgOtherPresentations + item.quantity * item.kgPerUnit);
                qtyInput.value = item.quantity; // Revert to previous value
                return;
            }
            // Update quantity and stock
            productsData[item.productName].stockKg += (item.quantity - value) * item.kgPerUnit;
            item.quantity = value;
            localStorage.setItem('productsData', JSON.stringify(productsData));
            saveCart();
            renderCart();
        });

        // Button +
        btnIncrease.addEventListener('click', () => {
            let current = parseInt(qtyInput.value) || 1;
            if (current < 1000) {
                qtyInput.value = current + 1;
                qtyInput.dispatchEvent(new Event('blur')); // To update the cart and stock
            }
        });

        // Button -
        btnDecrease.addEventListener('click', () => {
            let current = parseInt(qtyInput.value) || 1;
            if (current > 1) {
                qtyInput.value = current - 1;
                qtyInput.dispatchEvent(new Event('blur')); // To update the cart and stock
            }
        });

        // Accessibility
        clone.querySelector('.cart__content').setAttribute('aria-label', `Product in cart: ${item.productName}, presentation ${item.kgPerUnit} kg`);
        btnDecrease.setAttribute('data-key', key);
        btnIncrease.setAttribute('data-key', key);
        btnRemove.setAttribute('data-key', key);

        cartContentContainer.appendChild(clone);
    });
    updateCartCount();
    updateCartTotal();
}

function adjustQuantity(key, delta) {
    if (!cart[key]) return;
    const item = cart[key];
    const newQty = item.quantity + delta;
    if (newQty < 1) {
        productsData[item.productName].stockKg += item.quantity * item.kgPerUnit;
        delete cart[key];
    } else {
        const totalKgAfter = newQty * item.kgPerUnit;
        const totalKgInCartForProduct = Object.entries(cart).reduce((acc, [k, v]) => {
            if (v.productName === item.productName && k !== key) {
                return acc + v.quantity * v.kgPerUnit;
            }
            return acc;
        }, 0);
        if (totalKgInCartForProduct + totalKgAfter <= productsData[item.productName].stockKg + item.quantity * item.kgPerUnit) {
            productsData[item.productName].stockKg += (item.quantity - newQty) * item.kgPerUnit;
            item.quantity = newQty;
        } else {
            showCartStockWarning(item.productName, productsData[item.productName].stockKg - totalKgInCartForProduct + item.quantity * item.kgPerUnit);
            return;
        }
    }
    localStorage.setItem('productsData', JSON.stringify(productsData));
    saveCart();
    renderCart();
}

function showCartStockWarning(productName, stockDisponible) {
    let warning = document.getElementById('cart-stock-warning');
    if (!warning) {
        warning = document.createElement('div');
        warning.id = 'cart-stock-warning';
        warning.className = 'stock-warning';
        cartContentContainer.prepend(warning);
    }
    if (!productName) productName = "product";
    if (typeof stockDisponible !== "number" || isNaN(stockDisponible)) stockDisponible = 0;
    if (stockDisponible <= 0) {
        warning.textContent = `There are no more products in stock for "${productName}".`;
    } else {
        warning.textContent = `Insufficient stock for "${productName}". Stock available: ${stockDisponible} kg.`;
    }
    setTimeout(() => {
        if (warning) warning.remove();
    }, 4000);
}

function removeItem(key) {
    if (cart[key]) {
        const item = cart[key];
        if (productsData[item.productName]) {
            productsData[item.productName].stockKg += item.quantity * item.kgPerUnit;
            localStorage.setItem('productsData', JSON.stringify(productsData));
        }
        delete cart[key];
        saveCart();
        renderCart();
    }
}



/*==============================
=   SHOPPING CART SIDE PANEL
=   AND DYNAMIC PRODUCTS
==============================*/

document.addEventListener('DOMContentLoaded', () => {
    // --- Duplicate ribbon items ---
    const ribbonTrack = document.querySelector('.ribbon__track');
    if (ribbonTrack) {
        // Clones all current children and adds them to the end
        const items = Array.from(ribbonTrack.children);
        items.forEach(item => {
            const clone = item.cloneNode(true);
            ribbonTrack.appendChild(clone);
        });
    }

    // --- Utilities and initial data ---
    const isUserLoggedIn = () => !!localStorage.getItem('loggedInUser');
    if (!localStorage.getItem('userBalance')) localStorage.setItem('userBalance', '500000');

    fetch('../products-coffee.json')
        .then(res => res.json())
        .then(data => {
            // Convertir array a objeto usando 'name' como clave
            const productMap = {};
            data.forEach(product => {
            productMap[product.name] = {
                origin: product.origin,
                shortdesc: product.shortdesc,
                description: product.description,
                pricePerKg: product.precio_kg_cop,
                pricePerG: product.precio_g_cop,
                stockKg: 20, // Puedes ajustar el stock inicial
                images: product.images || [],
                benefits: product.benefits || [],
                additional: product.additional || []
            };
            });

            // Si no hay datos guardados, usar este JSON y guardarlo en localStorage
            if (!localStorage.getItem('productsData')) {
            localStorage.setItem('productsData', JSON.stringify(productMap));
            }

            // Asignar productos desde localStorage o fallback
            window.defaultProducts = productMap;
            productsData = JSON.parse(localStorage.getItem('productsData')) || productMap;

            renderProducts();
            addProductListeners();
            renderCart();
        })
        .catch(err => {
            console.error('Error loading coffee products:', err);
        });

    // --- Items DOM ---
    cartToggle = document.getElementById('cart-container');
    cartPanel = document.getElementById('cart-panel');
    cartOverlay = document.getElementById('overlay');
    closeCartBtn = document.getElementById('close-cart-btn');

    // --- Close the cart panel when clicking outside (overlay) ---
    cartOverlay.addEventListener('click', () => {
        if (cartPanel.classList.contains('open')) {
            closeCart();
        }
    });

    cartCount = document.getElementById('cart-count');
    cartContentContainer = document.getElementById('grid-shopping-cart-products');
    cartFooterTotal = document.querySelector('#cart-panel .cart__footer strong + span, #cart-panel .cart__footer span');
    emptyCartBtn = document.getElementById('empty-cart-btn');
    checkoutBtn = document.querySelector('.checkout__btn');
    productsContainer = document.getElementById('products-container');
    adminBtn = document.getElementById('admin-add-product-btn');

    // --- Show the admin button only if the user is admin ---
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    const loggedInEmail = localStorage.getItem("loggedInUser");
    const isAdmin = users[loggedInEmail]?.role === "admin";
    if (adminBtn) {
        adminBtn.style.display = isAdmin ? "block" : "none";
    }

    adminForm = document.getElementById('admin-product-form');
    submitNewProductBtn = document.getElementById('submit-new-product');
    body = document.body;

    // --- Rendering products using existing nodes ---
    function renderProducts() {
        productsContainer.innerHTML = '';
        const template = document.getElementById('product-card-template');
        Object.entries(productsData).forEach(([name, data]) => {
            const clone = template.content.cloneNode(true);

            // Fill in data
            clone.querySelector('.product__card--image').src = data.images && data.images[0] ? data.images[0] : (data.image || '');
            clone.querySelector('.product__card--image').alt = `Product ${name}`;
            clone.querySelector('.product__card--title').textContent = name;
            clone.querySelector('.stock__available').textContent = data.stockKg;

            // Show elements only for admin
            clone.querySelectorAll('.admin__only').forEach(el => {
                if (isAdmin) {
                    if (el.tagName === 'BUTTON') {
                        el.style.display = 'inline-flex';
                    } else {
                        el.style.display = 'block';
                    }
                } else {
                    el.style.display = 'none';
                }
            });

            // Delete product function (admin only)
            const btnDelete = clone.querySelector('.btn__delete--product');
            if (btnDelete) {
                btnDelete.onclick = () => {
                    if (confirm(`Surely you want to delete "${name}"?`)) {
                        delete productsData[name];
                        localStorage.setItem('productsData', JSON.stringify(productsData));
                        // Remove from cart if it exists
                        Object.keys(cart).forEach(key => {
                            if (cart[key].productName === name) {
                                delete cart[key];
                            }
                        });
                        saveCart();
                        renderProducts();
                        addProductListeners();
                        renderCart();
                    }
                };
            }

            // --- Visual warning of low or no stock ---
            const stockWarning = clone.querySelector('.stock__warning');
            const btnAdd = clone.querySelector('.btn__add--product');
            if (data.stockKg <= 10 && data.stockKg > 0) {
                stockWarning.textContent = `¡They are left alone ${data.stockKg} kg in stock!`;
                stockWarning.style.display = 'inline';
            } else if (data.stockKg === 0) {
                stockWarning.textContent = 'There are no more products in stock.';
                stockWarning.style.display = 'inline';
                btnAdd.disabled = true;
            }

            const card = clone.querySelector('.product__card');
            if (card) {
                card.style.cursor = "pointer";
                card.addEventListener('click', (e) => {
                    // Prevents clicking on internal buttons (add/remove) from triggering navigation
                    if (
                        e.target.classList.contains('btn__add--product') ||
                        e.target.classList.contains('btn__delete--product') ||
                        e.target.classList.contains('btn__increase') ||
                        e.target.classList.contains('btn__decrease') ||
                        e.target.classList.contains('product__list--item') ||
                        e.target.classList.contains('quantity__input')
                    ) return;
                    window.location.href = `../product/product.html?product=${encodeURIComponent(name)}`;
                });
            }
            productsContainer.appendChild(clone);
        });
        document.querySelectorAll('.scroll__reveal').forEach(el => observer.observe(el));
    }

    // --- Listeners in products ---
    function addProductListeners() {
        document.querySelectorAll('.product__card').forEach(card => {
            const btnAdd = card.querySelector('.btn__add--product');
            const productName = card.querySelector('.product__card--title').textContent.trim();
            const quantityInput = card.querySelector('.quantity__input');
            const btnIncrease = card.querySelector('.btn__increase');
            const btnDecrease = card.querySelector('.btn__decrease');
            const priceDisplay = card.querySelector('.container__price--purchase span');
            const kiloButtons = card.querySelectorAll('.product__list--item');
            let selectedKg = 1;
            let quantity = 1;
            const pricePerKg = productsData[productName].pricePerKg;

            // Initialize
            kiloButtons.forEach((btn, i) => {
                if (i === 0) btn.classList.add('active');
            });
            priceDisplay.textContent = `$${(pricePerKg * selectedKg).toLocaleString('es-CO')},00`;

            // Change presentation
            kiloButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    kiloButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedKg = parseInt(btn.getAttribute('data-kilo'), 10);
                    updatePrice();
                });
            });

            // Change quantity
            btnIncrease.addEventListener('click', () => {
                let qty = parseInt(quantityInput.value);
                const totalKgAfter = (qty + 1) * selectedKg;
                if (totalKgAfter <= productsData[productName].stockKg) {
                    quantityInput.value = qty + 1;
                    updatePrice();
                } else {
                    showProductStockWarning(card, productName, productsData[productName].stockKg);
                }
            });
            btnDecrease.addEventListener('click', () => {
                let qty = parseInt(quantityInput.value);
                if (qty > 1) {
                    quantityInput.value = qty - 1;
                    updatePrice();
                }
            });

            function updatePrice() {
                const qty = parseInt(quantityInput.value);
                const totalPrice = pricePerKg * selectedKg * qty;
                priceDisplay.textContent = `$${totalPrice.toLocaleString('es-CO')},00`;
            }

            // --- Add to cart ---
            btnAdd.addEventListener('click', () => {
                if (!isUserLoggedIn()) {
                    window.location.href = "../login/login.html";
                    return;
                }
                const qty = parseInt(quantityInput.value);
                const key = `${productName}|${selectedKg}`;

                // Calculate total kg in cart for this product without counting this presentation
                let totalKgOtherPresentations = Object.entries(cart).reduce((acc, [k, v]) => {
                    if (v.productName === productName && k !== key) {
                        return acc + v.quantity * v.kgPerUnit;
                    }
                    return acc;
                }, 0);

                const newTotalKgForThisKey = (cart[key] ? cart[key].quantity : 0) * selectedKg + qty * selectedKg;
                if (totalKgOtherPresentations + newTotalKgForThisKey > productsData[productName].stockKg) {
                    showProductStockWarning(card, productName, productsData[productName].stockKg - totalKgOtherPresentations);
                    return;
                }

                // Discount stock in real time
                productsData[productName].stockKg -= qty * selectedKg;
                if (productsData[productName].stockKg < 0) productsData[productName].stockKg = 0;
                localStorage.setItem('productsData', JSON.stringify(productsData));
                renderProducts();
                addProductListeners();

                if (cart[key]) {
                    cart[key].quantity += qty;
                } else {
                    cart[key] = {
                        productName,
                        quantity: qty,
                        kgPerUnit: selectedKg,
                        pricePerKg,
                        image: productsData[productName].images && productsData[productName].images[0] ? productsData[productName].images[0] : (productsData[productName].image || '')
                    };
                }
                saveCart();
                renderCart();
                openCart();
            });
        });
    }

    // Visual stock message on the product card
    function showProductStockWarning(card, productName, stockDisponible) {
        let warning = card.querySelector('.stock-warning');
        if (!warning) {
            warning = document.createElement('span');
            warning.className = 'stock-warning';
            card.querySelector('.product__details').appendChild(warning);
        }
        warning.style.display = 'inline';
        if (stockDisponible <= 0) {
            warning.textContent = `There are no more products in stock for "${productName}".`;
            card.querySelector('.btn__add--product').disabled = true;
        } else {
            warning.textContent = `Insufficient stock for "${productName}". Available stock: ${stockDisponible} kg.`;
        }
        setTimeout(() => {
            if (warning) warning.style.display = 'none';
        }, 3500);
    }

    // --- Admin: Add products (complete form) ---
    if (adminBtn && adminForm && submitNewProductBtn) {
        adminBtn.classList.add('btn-agregar-producto');
        adminForm.classList.add('form-agregar-producto');
        adminBtn.addEventListener('click', () => {
            adminForm.classList.toggle('show');
        });
        submitNewProductBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Get all values ​​from the form
            const name = document.getElementById('new-product-name').value.trim();
            const origin = document.getElementById('new-product-origin').value.trim();
            const shortdesc = document.getElementById('new-product-shortdesc').value.trim();
            const description = document.getElementById('new-product-description').value.trim();
            const pricePerKg = parseInt(document.getElementById('new-product-pricekg').value, 10);
            const pricePerG = parseInt(document.getElementById('new-product-priceg').value, 10);
            const stockKg = parseInt(document.getElementById('new-product-stock').value, 10);
            const images = document.getElementById('new-product-images').value.split(',').map(s => s.trim()).filter(Boolean);
            const benefits = document.getElementById('new-product-benefits').value.split('\n').map(s => s.trim()).filter(Boolean);
            const additional = document.getElementById('new-product-additional').value.split('\n').map(line => {
                const [label, ...rest] = line.split(':');
                return label && rest.length ? { label: label.trim(), value: rest.join(':').trim() } : null;
            }).filter(Boolean);

            if (!name || !origin || !shortdesc || !description || !pricePerKg || !pricePerG || !stockKg || images.length === 0) {
                showAdminWarning('Complete all required fields.');
                return;
            }
            if (productsData[name]) {
                showAdminWarning('There is already a product with that name.');
                return;
            }
            productsData[name] = {
                origin,
                shortdesc,
                description,
                pricePerKg,
                pricePerG,
                stockKg,
                images,
                benefits,
                additional
            };
            localStorage.setItem('productsData', JSON.stringify(productsData));
            renderProducts();
            addProductListeners();
            adminForm.classList.remove('show');
            // Clear fields
            adminForm.reset();
        });
    }

    function showAdminWarning(msg) {
        let warning = adminForm.querySelector('.stock-warning');
        if (!warning) {
            warning = document.createElement('span');
            warning.className = 'stock-warning';
            adminForm.appendChild(warning);
        }
        warning.textContent = msg;
        warning.style.display = 'block';
        setTimeout(() => {
            if (warning) warning.style.display = 'none';
        }, 3500);
    }

    // --- Empty cart and buy ---
    emptyCartBtn.addEventListener('click', () => {
        // Return stock of all products in the cart
        Object.values(cart).forEach(item => {
            if (productsData[item.productName]) {
                productsData[item.productName].stockKg += item.quantity * item.kgPerUnit;
            }
        });
        localStorage.setItem('productsData', JSON.stringify(productsData));
        cart = {};
        saveCart();
        renderProducts();
        addProductListeners();
        renderCart();
    });

    checkoutBtn.addEventListener('click', () => {
        e.preventDefault();
        if (!isUserLoggedIn()) {
            window.location.href = "../login/login.html";
            return;
        }
        if (Object.keys(cart).length === 0) {
            showCartStockWarning('carrito', 0);
            return;
        }
        // Balance simulation
        const userBalance = parseInt(localStorage.getItem('userBalance') || '0', 10);
        const total = Object.values(cart).reduce(
            (acc, item) => acc + item.quantity * item.kgPerUnit * item.pricePerKg,
            0
        );
        if (userBalance < total) {
            showCartBalanceWarning();
            return;
        }
        // Discount balance
        localStorage.setItem('userBalance', (userBalance - total).toString());
        // Save purchase for checkout
        localStorage.setItem('lastOrder', JSON.stringify(cart));

        // Empty cart
        cart = {};
        saveCart();
        renderProducts();
        addProductListeners();
        renderCart();
        closeCart();

        // Redirect to checkout
        window.location.href = "../checkout/checkout.html";
    });

    // --- Cart panel ---
    cartToggle.addEventListener('click', () => openCart());
    closeCartBtn.addEventListener('click', () => closeCart());

    // --- Initialization ---
    loadCart();
    renderProducts();
    addProductListeners();
    renderCart();

    // Look at the animated elements again
    document.querySelectorAll('.scroll__reveal').forEach(el => observer.observe(el));
});

// Add this function before exporting cart functionso
function showCartBalanceWarning() {
    let warning = document.getElementById('cart-stock-warning');
    if (!warning) {
        warning = document.createElement('div');
        warning.id = 'cart-stock-warning';
        warning.className = 'stock-warning';
        cartContentContainer.prepend(warning);
    }
    warning.textContent = `Insufficient balance to complete the purchase.`;
    setTimeout(() => {
        if (warning) warning.remove();
    }, 4000);
}


// --- EXPORT CART FUNCTIONS ---
window.renderCart = renderCart;
window.loadCart = loadCart;
window.updateCartCount = updateCartCount;
window.openCart = openCart;