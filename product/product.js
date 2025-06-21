/*==============================
=   EcoCafé - JS
=   Page: Product
=   File: main-products.js
==============================*/

document.addEventListener('DOMContentLoaded', () => {
    // --- Try Loading Products From LocalStorage ---
    let productsData = {};
    try {
        productsData = JSON.parse(localStorage.getItem('productsData') || '{}');
    } catch (e) {
        productsData = {};
    }
    // If productsData is empty, use the default products and save them
    if (!productsData || Object.keys(productsData).length === 0) {
        productsData = window.defaultProducts;
        localStorage.setItem('productsData', JSON.stringify(productsData));
    }

    const params = new URLSearchParams(window.location.search);
    const productName = params.get('product');
    const product = productsData[productName];

    // --- Show Product Information ---
    function renderProductInfo() {
        if (!product) {
            document.querySelector('.product__detail--title').textContent = "Product not found";
            document.querySelector('.product__detail--origin').textContent = "";
            document.querySelector('.product__detail--pricekg').textContent = "";
            document.querySelector('.product__detail--priceg').textContent = "";
            document.querySelector('.product__detail--shortdesc').textContent = "";
            document.querySelector('.product__description--text').textContent = "";
            document.querySelector('.product__description--benefits').innerHTML = "";
            document.querySelector('.product__details--list').innerHTML = "";
            return;
        }

        document.querySelector('.product__detail--title').textContent = productName;
        document.querySelector('.product__detail--origin').textContent = product.origin || '';
        document.querySelector('.product__detail--pricekg').textContent = `$${product.pricePerKg.toLocaleString('es-CO')} kg`;
        document.querySelector('.product__detail--priceg').textContent = `$${product.pricePerG.toLocaleString('es-CO')} g`;
        document.querySelector('.product__detail--shortdesc').textContent = product.shortdesc || '';
        const descContainer = document.querySelector('.product__description--text');
        descContainer.innerHTML = '';
        if (Array.isArray(product.description)) {
            product.description.forEach(paragraph => {
                const p = document.createElement('p');
                p.textContent = paragraph;
                descContainer.appendChild(p);
            });
        } else if (typeof product.description === 'string') {
            const p = document.createElement('p');
            p.textContent = product.description;
            descContainer.appendChild(p);
        }

        // Benefits
        const benefits = document.querySelector('.product__description--benefits');
        benefits.innerHTML = '';
        (product.benefits || []).forEach(b => {
            const li = document.createElement('li');
            li.textContent = `- ${b}`;
            benefits.appendChild(li);
        });

        // Additional information
        const additional = document.querySelector('.product__details--list');
        additional.innerHTML = '';
        (product.additional || []).forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${item.label}:</strong> ${item.value}`;
            additional.appendChild(li);
        });
    }

    // --- Image and Thumbnail Gallery ---
    function renderGallery() {
        const mainImg = document.querySelector('.product__detail--main-img');
        const thumbsContainer = document.querySelector('.product__detail--thumbnails');
        if (!mainImg || !thumbsContainer || !product || !product.images || product.images.length === 0) {
            if (mainImg) mainImg.src = '';
            if (thumbsContainer) thumbsContainer.innerHTML = '';
            return;
        }
        mainImg.src = product.images[0];
        mainImg.alt = productName;
        thumbsContainer.innerHTML = '';
        product.images.forEach((img, idx) => {
            const thumb = document.createElement('img');
            thumb.src = img;
            thumb.alt = productName + ' miniature';
            if (idx === 0) thumb.classList.add('active');
            thumb.addEventListener('click', () => {
                mainImg.src = img;
                thumbsContainer.querySelectorAll('img').forEach(i => i.classList.remove('active'));
                thumb.classList.add('active');
            });
            thumbsContainer.appendChild(thumb);
        });
    }

    // --- Main Image Zoom ---
    function setupZoom() {
        const mainImg = document.querySelector('.product__detail--main-img');
        const zoomButton = document.querySelector('.zoom__icon');
        const zoomModal = document.getElementById('zoomModal');
        const zoomedImg = document.querySelector('.zoomed__img');
        const closeZoom = document.querySelector('.close__zoom');
        if (zoomButton && zoomModal && zoomedImg && mainImg) {
            zoomButton.addEventListener('click', () => {
                zoomedImg.src = mainImg.src;
                zoomModal.classList.add('active');
                document.body.classList.add('modal-open'); // Lock background scroll
            });
        }

        // Unlock background scroll
        if (closeZoom && zoomModal) {
            closeZoom.addEventListener('click', () => {
                zoomModal.classList.remove('active');
                document.body.classList.remove('modal-open');
            });
        }
        if (zoomModal) {
            zoomModal.addEventListener('click', (e) => {
                if (e.target === zoomModal) {
                    zoomModal.classList.remove('active');
                    document.body.classList.remove('modal-open');
                }
            });
        }
    }

    // --- Miniature Carousels ---
    function setupThumbCarousel() {
        const thumbTrack = document.querySelector('.product__detail--thumbnails');
        const thumbLeft = document.querySelector('.thumb-arrow.left');
        const thumbRight = document.querySelector('.thumb-arrow.right');
        const thumbWrapper = document.querySelector('.thumbnails__wrapper');
        let thumbIndex = 0;
        function updateThumbs() {
            const thumbs = thumbTrack ? thumbTrack.querySelectorAll('img') : [];
            if (!thumbTrack || !thumbWrapper || thumbs.length === 0) return;
            const thumbWidth = thumbs[0].offsetWidth + 8;
            const visibleThumbs = Math.floor(thumbWrapper.offsetWidth / thumbWidth);
            const maxIndex = thumbs.length - visibleThumbs;
            if (thumbIndex < 0) thumbIndex = 0;
            if (thumbIndex > maxIndex) thumbIndex = maxIndex;
            thumbTrack.style.transform = `translateX(-${thumbIndex * thumbWidth}px)`;
        }
        if (thumbLeft) thumbLeft.addEventListener('click', () => { thumbIndex--; updateThumbs(); });
        if (thumbRight) thumbRight.addEventListener('click', () => { thumbIndex++; updateThumbs(); });
        window.addEventListener('resize', updateThumbs);
        setTimeout(updateThumbs, 200);
    }

    // --- Additional Information Tabs ---
    function setupTabs() {
        document.querySelectorAll('.description__tabs .tab__btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.description__tabs .tab__btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab__content').forEach(tc => tc.classList.remove('active'));
                btn.classList.add('active');
                document.querySelector('.tab__content.' + btn.dataset.tab).classList.add('active');
            });
        });
    }

    // --- Comments by Product ---
    function loadComments() {
        const commentsData = JSON.parse(localStorage.getItem('commentsData') || '{}');
        const productComments = commentsData[productName] || [];
        const track = document.querySelector(".comments__track");
        if (!track) return;
        track.innerHTML = '';
        productComments.forEach(c => {
            const article = document.createElement('article');
            article.className = 'comments__article';
            article.innerHTML = 
                `<span>${c.name}</span>
                <strong>${'⭐️'.repeat(c.rating)}</strong>
                <p>“${c.text}”</p>`;
            track.appendChild(article);
        });
    }

    // --- Comment Carousel ---
    function setupCommentsCarousel() {
        let currentIndex = 0;
        function updateCarousel() {
            const track = document.querySelector(".comments__track");
            const comments = track ? track.querySelectorAll(".comments__article") : [];
            const wrapper = document.querySelector(".comments__wrapper");
            if (!track || !wrapper || comments.length === 0) return;

            const cardWidth = 350;
            const gap = 30;
            const visible = Math.max(1, Math.floor((wrapper.offsetWidth + gap) / (cardWidth + gap)));
            const maxIndex = Math.max(0, comments.length - visible);

            let offset = 0;
            if (comments.length <= visible) {
                // Center all comments if they fit
                const totalWidth = comments.length * cardWidth + (comments.length - 1) * gap;
                offset = -(wrapper.offsetWidth - totalWidth) / 2;
            } else if (currentIndex === maxIndex) {
                const totalWidth = comments.length * (cardWidth + gap) - gap;
                offset = Math.max(0, totalWidth - wrapper.offsetWidth);
            } else {
                // Center the active comment normally
                const center = Math.floor(visible / 2);
                let focusIndex = currentIndex + center;
                if (focusIndex > comments.length - 1) focusIndex = comments.length - 1;
                offset = (focusIndex - center) * (cardWidth + gap) - (wrapper.offsetWidth - cardWidth) / 2;
                if (offset < 0) offset = 0;
                // Do not let the right edge pass
                const totalWidth = comments.length * (cardWidth + gap) - gap;
                const maxOffset = Math.max(0, totalWidth - wrapper.offsetWidth);
                if (offset > maxOffset) offset = maxOffset;
            }
            track.style.transform = `translateX(-${offset}px)`;

            // Arrows
            leftBtn.disabled = currentIndex === 0;
            rightBtn.disabled = currentIndex === maxIndex;
        }

        const leftBtn = document.querySelector(".comments__arrow.left");
        const rightBtn = document.querySelector(".comments__arrow.right");
        if (leftBtn) leftBtn.addEventListener("click", () => {
            if (currentIndex > 0) { currentIndex--; updateCarousel(); }
        });

        if (rightBtn) rightBtn.addEventListener("click", () => {
            const track = document.querySelector(".comments__track");
            const comments = track ? track.querySelectorAll(".comments__article") : [];
            const wrapper = document.querySelector(".comments__wrapper");
            const cardWidth = 350;
            const gap = 30;
            const visible = Math.max(1, Math.floor((wrapper.offsetWidth + gap) / (cardWidth + gap)));
            const maxIndex = Math.max(0, comments.length - visible);
            if (currentIndex < maxIndex) { currentIndex++; updateCarousel(); }
        });
        window.addEventListener("resize", updateCarousel);
        setTimeout(updateCarousel, 200);
        return updateCarousel;
    }

    // --- Add Comment ---
    function setupAddComment(updateCarousel) {
        const commentForm = document.getElementById('add-comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const name = document.getElementById('comment-name').value;
                const rating = parseInt(document.getElementById('comment-rating').value);
                const text = document.getElementById('comment-text').value;
                const commentsData = JSON.parse(localStorage.getItem('commentsData') || '{}');
                if (!commentsData[productName]) commentsData[productName] = [];
                commentsData[productName].push({ name, rating, text });
                localStorage.setItem('commentsData', JSON.stringify(commentsData));
                loadComments();
                commentForm.reset();
                setTimeout(updateCarousel, 100);
            });
        }
    }

    // --- Product Suggestions ---
    function loadSuggestions() {
        const sugTrack = document.querySelector('.suggestions__track');
        if (!sugTrack) return;
        sugTrack.innerHTML = '';
        Object.keys(productsData).forEach(name => {
            const p = productsData[name];
            if (name !== productName && p.stockKg > 0) {
                const card = document.createElement('div');
                card.className = 'suggestion__card';

                // Image
                if (p.images && p.images[0]) {
                    const img = document.createElement('img');
                    img.src = p.images[0];
                    img.alt = name;
                    card.appendChild(img);
                }

                // Qualification
                const title = document.createElement('h3');
                title.className = 'suggestion__card--title';
                title.textContent = name;
                card.appendChild(title);

                // Price per kg
                const priceKg = document.createElement('p');
                priceKg.className = 'suggestion__card--pricekg';
                priceKg.textContent = `$${p.pricePerKg.toLocaleString('es-CO')} kg`;
                card.appendChild(priceKg);

                // Price per g
                const priceG = document.createElement('p');
                priceG.className = 'suggestion__card--priceg';
                priceG.textContent = `$${p.pricePerG.toLocaleString('es-CO')} g`;
                card.appendChild(priceG);

                // View product button
                const btnContainer = document.createElement('div');
                btnContainer.className = 'container__btn--see';
                const btn = document.createElement('a');
                btn.className = 'btn__see--product';
                btn.href = `product.html?product=${encodeURIComponent(name)}`;
                btn.textContent = 'View product';
                btnContainer.appendChild(btn);
                card.appendChild(btnContainer);

                sugTrack.appendChild(card);
            }
        });
    }

    // --- Suggestion Carousel ---
    function setupSuggestionsCarousel() {
        let sugIndex = 0;
        function updateSuggestions() {
            const track = document.querySelector(".suggestions__track");
            const cards = track ? track.querySelectorAll(".suggestion__card") : [];
            const wrapper = document.querySelector(".suggestions__wrapper");
            if (!track || !wrapper || cards.length === 0) return;

            const cardWidth = 300;
            const gap = 20;
            const totalWidth = cards.length * cardWidth + (cards.length - 1) * gap;
            const maxWidth = 1200;
            const windowWidth = window.innerWidth;
            // The maximum width allowed per window and per quantity of products
            const wrapperWidth = Math.min(maxWidth, windowWidth, totalWidth);

            wrapper.style.maxWidth = wrapperWidth + "px";
            wrapper.style.width = wrapperWidth + "px";

            const visible = Math.max(1, Math.floor((wrapperWidth + gap) / (cardWidth + gap)));
            const maxIndex = Math.max(0, cards.length - visible);

            let offset = 0;
            if (cards.length <= visible) {
                // Center all cards if they fit
                offset = -(wrapperWidth - totalWidth) / 2;
            } else if (sugIndex === maxIndex) {
                offset = Math.max(0, totalWidth - wrapperWidth);
            } else {
                // Center the active card normally
                const center = Math.floor(visible / 2);
                let focusIndex = sugIndex + center;
                if (focusIndex > cards.length - 1) focusIndex = cards.length - 1;
                offset = (focusIndex - center) * (cardWidth + gap) - (wrapperWidth - cardWidth) / 2;
                if (offset < 0) offset = 0;

                // Do not let the right edge pass
                const maxOffset = Math.max(0, totalWidth - wrapperWidth);
                if (offset > maxOffset) offset = maxOffset;
            }
            track.style.transform = `translateX(-${offset}px)`;

            // Arrows
            leftBtn.disabled = sugIndex === 0;
            rightBtn.disabled = sugIndex === maxIndex;
        }

        const sugLeftBtn = document.querySelector('.arrow.left');
        const sugRightBtn = document.querySelector('.arrow.right');
        if (sugLeftBtn) sugLeftBtn.addEventListener('click', () => { 
            if (sugLeftBtn.disabled) return;
            sugIndex--; updateSuggestions(); 
        });
        if (sugRightBtn) sugRightBtn.addEventListener('click', () => { 
            if (sugRightBtn.disabled) return;
            sugIndex++; updateSuggestions(); 
        });
        window.addEventListener('resize', updateSuggestions);
        setTimeout(updateSuggestions, 200);
    }

    // --- Quantity Interaction ---
    function setupQuantityInput() {
        const input = document.getElementById('quantity');
        const incrementBtn = document.querySelector('.increment');
        const decrementBtn = document.querySelector('.decrement');

        if (input) {
            input.addEventListener('focus', function() {
                setTimeout(() => input.select(), 0);
            });
            input.addEventListener('input', function() {
                input.value = input.value.replace(/\D/g, '');
                let val = parseInt(input.value);
                if (val > 1000) input.value = 1000;
            });
            input.addEventListener('blur', function() {
                // If it is empty when you exit, put 1
                if (input.value === '' || isNaN(parseInt(input.value)) || parseInt(input.value) < 1) {
                    input.value = 1;
                }
            });
        }
        
        if (incrementBtn && input) incrementBtn.addEventListener('click', () => {
            let current = parseInt(input.value) || 0;
            if (current < 1000) input.value = current + 1;
        });
        if (decrementBtn && input) decrementBtn.addEventListener('click', () => {
            let current = parseInt(input.value) || 1;
            if (current > 1) input.value = current - 1;
        });
    }

    // --- Add to Cart Form Control ---
    function setupAddToCart() {
        const form = document.querySelector('.product__detail--purchase');
        const input = document.getElementById('quantity');
        const btnAdd = document.querySelector('.btn__add--cart');
        const warningId = 'stock-warning-msg';

        // Show Stock Warning
        function showStockWarning(msg) {
            let warning = document.getElementById(warningId);
            if (!warning) {
                warning = document.createElement('span');
                warning.id = warningId;
                warning.className = 'stock-warning';
                btnAdd.parentNode.insertBefore(warning, btnAdd);
            }
            warning.textContent = msg;
            warning.style.display = 'block';
            setTimeout(() => {
                if (warning) warning.style.display = 'none';
            }, 3500);
        }

        // Update Stock Status
        function updateStockState() {
            const stock = product ? product.stockKg : 0;
            const qty = parseInt(input.value) || 1;
            if (stock < qty) {
                btnAdd.disabled = true;
                showStockWarning('Not enough stock available.');
            } else if (stock <= 10) {
                btnAdd.disabled = false;
                showStockWarning(`They are left alone ${stock} 1 kg units in stock!`);
            } else {
                btnAdd.disabled = false;
            }
        }

        if (input) {
            input.addEventListener('input', updateStockState);
            input.addEventListener('change', updateStockState);
        }

        if (form && btnAdd) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();

                const stock = product ? product.stockKg : 0;
                let cart = JSON.parse(localStorage.getItem('cart') || '{}');
                const qty = parseInt(input.value) || 1;
                const key = `${productName}|1`;

                // Check stock
                if (stock < qty) {
                    showStockWarning('Not enough stock available.');
                    btnAdd.disabled = true;
                    return;
                }

                // Add to cart
                if (cart[key]) {
                    if (cart[key].quantity + qty > stock) {
                        showStockWarning('Not enough stock available.');
                        btnAdd.disabled = true;
                        return;
                    }
                    cart[key].quantity += qty;
                } else {
                    cart[key] = {
                        productName,
                        quantity: qty,
                        kgPerUnit: 1,
                        pricePerKg: product.pricePerKg,
                        image: product.images && product.images[0] ? product.images[0] : ''
                    };
                }

                // Save cart and products
                localStorage.setItem('cart', JSON.stringify(cart));
                product.stockKg -= qty;
                if (product.stockKg < 0) product.stockKg = 0;
                productsData[productName].stockKg = product.stockKg;
                localStorage.setItem('productsData', JSON.stringify(productsData));

                // Update the cart panel and counter
                if (typeof loadCart === "function") loadCart();
                if (typeof renderCart === "function") renderCart();
                if (typeof updateCartCount === "function") updateCartCount();
                if (typeof openCart === "function") openCart();

                // Update product info (stock in UI)
                renderProductInfo();

                // success message
                showStockWarning('¡Producto agregado al carrito!');
            });
            // Initial state
            updateStockState();
        }
    }

    // --- Initialization ---
    renderProductInfo();
    renderGallery();
    setupZoom();
    setupThumbCarousel();
    setupTabs();
    loadComments();
    const updateCarousel = setupCommentsCarousel();
    setupAddComment(updateCarousel);
    loadSuggestions();
    setupSuggestionsCarousel();
    setupQuantityInput();
    setupAddToCart();
});