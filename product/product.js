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

        // If it is an array, convert to an object using the title
        if (Array.isArray(productsData)) {
            const productDict = {};
            for (const prod of productsData) {
                productDict[prod.title] = prod;
            }
            productsData = productDict;
        }

        localStorage.setItem('productsData', JSON.stringify(productsData));
    }

    const params = new URLSearchParams(window.location.search);
    const productTitle = params.get('product');

    // If productsData is in array, convert it to object
    if (Array.isArray(productsData)) {
        const fixedProductsData = {};
        productsData.forEach(prod => {
            fixedProductsData[prod.title] = prod;
        });
        productsData = fixedProductsData;
        localStorage.setItem('productsData', JSON.stringify(productsData)); // update localStorage
    }

    const product = productsData[productTitle];

    // --- Show Product Information ---
    function renderProductInfo() {
        if (!product) {
            document.querySelector('.product__detail--title').textContent = "Product not found";
            document.querySelector('.product__detail--origin').textContent = "";
            document.querySelector('.product__detail--pricekg').textContent = "";
            document.querySelector('.product__detail--priceg').textContent = "";
            document.querySelector('.product__detail--shortdesc').textContent = "";
            // Limpiar tabs
            const descTab = document.querySelector('.tab__content.detalles .product__description--text');
            if (descTab) descTab.innerHTML = '';
            const benefitsTab = document.querySelector('.tab__content.benefits .product__description--benefits');
            if (benefitsTab) benefitsTab.innerHTML = '';
            const infoTab = document.querySelector('.tab__content.info .product__details--list');
            if (infoTab) infoTab.innerHTML = '';
            return;
        }

        document.querySelector('.product__detail--title').textContent = productTitle;
        document.querySelector('.product__detail--origin').textContent = product.origin || '';
        document.querySelector('.product__detail--pricekg').textContent = `$${product.pricekg.toLocaleString('es-CO')} kg`;
        document.querySelector('.product__detail--priceg').textContent = `$${product.priceg.toLocaleString('es-CO')} g`;
        document.querySelector('.product__detail--shortdesc').textContent = product.shortdesc || '';

        // Description (details tab)
        const descTab = document.querySelector('.tab__content.detalles .product__description--text');
        if (descTab) {
            descTab.innerHTML = '';
            if (Array.isArray(product.description)) {
                product.description.forEach(paragraph => {
                    const p = document.createElement('p');
                    p.textContent = paragraph;
                    descTab.appendChild(p);
                });
            } else if (typeof product.description === 'string') {
                const p = document.createElement('p');
                p.textContent = product.description;
                descTab.appendChild(p);
            }
        }

        // Benefits (tab benefits)
        const benefitsTab = document.querySelector('.tab__content.benefits .product__description--benefits');
        if (benefitsTab) {
            benefitsTab.innerHTML = '';
            (product.benefits || []).forEach(b => {
                const li = document.createElement('li');
                li.textContent = `- ${b}`;
                benefitsTab.appendChild(li);
            });
        }

        // Additional information (info tab)
        const infoTab = document.querySelector('.tab__content.info .product__details--list');
        if (infoTab) {
            infoTab.innerHTML = '';
            (product.additional || []).forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${item.label}:</strong> ${item.value}`;
                infoTab.appendChild(li);
            });
        }
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
        // Adjust image paths to work from any subfolder
        let mainImgPath = product.images[0];
        if (mainImgPath && !mainImgPath.startsWith('/') && !mainImgPath.startsWith('http')) {
            mainImgPath = '../' + mainImgPath;
        }
        mainImg.src = mainImgPath;
        mainImg.alt = productTitle;
        thumbsContainer.innerHTML = '';
        product.images.forEach((img, idx) => {
            let thumbPath = img;
            if (thumbPath && !thumbPath.startsWith('/') && !thumbPath.startsWith('http')) {
                thumbPath = '../' + thumbPath;
            }
            const thumb = document.createElement('img');
            thumb.src = thumbPath;
            thumb.alt = productTitle + ' miniature';
            if (idx === 0) thumb.classList.add('active');
            thumb.addEventListener('click', () => {
                mainImg.src = thumbPath;
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
                const tabContent = document.querySelector('.tab__content.' + btn.dataset.tab);
                if (tabContent) tabContent.classList.add('active');
            });
        });
    }

    fetch('../comments-coffe.json')
        .then(res => res.json())
        .then(json => {
            const existing = localStorage.getItem('commentsData');
            if (!existing) {
                localStorage.setItem('commentsData', JSON.stringify(json));
            }
            loadComments();
            const updateCarousel = setupCommentsCarousel();
            setupAddComment(updateCarousel);
        })
        .catch(err => {
            console.error('Error loading comments JSON:', err);
            loadComments();
            const updateCarousel = setupCommentsCarousel();
            setupAddComment(updateCarousel);
        });

    // Mapping product names to comment keys
    const commentsKeyMap = {
        'Coffee Beans': 'coffeeBeans',
        'Ground Coffee': 'groundCoffee',
        'Coffee Capsules': 'capsuleCoffee',
        'Green Coffee (unroasted)': 'greenCoffee'
    };

    // --- Comments by Product ---
    function loadComments() {
        const commentsData = JSON.parse(localStorage.getItem('commentsData') || '{}');
        const commentsKey = commentsKeyMap[productTitle] || productTitle;
        console.log('productTitle:', productTitle);
        console.log('commentsKey:', commentsKey);
        console.log('commentsData keys:', Object.keys(commentsData));
        console.log('commentsData[commentsKey]:', commentsData[commentsKey]);
        const productComments = commentsData[commentsKey] || [];
        const track = document.querySelector(".comments__track");
        const wrapper = document.querySelector(".comments__carousel");
        const msgClass = 'no-comments-msg';

        // Delete previous message if it exists
        let prevMsg = document.querySelector('.' + msgClass);
        if (prevMsg) prevMsg.remove();
        if (!track) return;
        track.innerHTML = '';
        if (productComments.length === 0) {
            // Show message and hide carousel
            const msg = document.createElement('p');
            msg.className = msgClass;
            msg.textContent = 'There are no comments.';
            track.parentNode.insertBefore(msg, track);
            if (wrapper) wrapper.style.display = 'none';
            return;
        } else {
            if (wrapper) wrapper.style.display = '';
        }
        productComments.forEach(c => {
            const article = document.createElement('article');
            article.className = 'comments__article';
            article.innerHTML =
                `<span>${c.name}</span>
                <strong>${'⭐️'.repeat(c.rating)}</strong>
                <p>“${c.text}”</p>`;
            track.appendChild(article);
        });
        console.log('productTitle:', productTitle);
        console.log('product:', product);
        console.log('product.title:', product?.title);
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
                const commentsKey = commentsKeyMap[productTitle] || productTitle;
                if (!commentsData[commentsKey]) commentsData[commentsKey] = [];
                commentsData[commentsKey].push({ name, rating, text });
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
            if (name !== productTitle && p.stock > 0) {
                const card = document.createElement('div');
                card.className = 'suggestion__card';

                // Image
                if (p.images && p.images[0]) {
                    let sugImgPath = p.images[0];
                    if (sugImgPath && !sugImgPath.startsWith('/') && !sugImgPath.startsWith('http')) {
                        sugImgPath = '../' + sugImgPath;
                    }
                    const img = document.createElement('img');
                    img.src = sugImgPath;
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
                priceKg.textContent = `$${p.pricekg.toLocaleString('es-CO')} kg`;
                card.appendChild(priceKg);

                // Price per g
                const priceG = document.createElement('p');
                priceG.className = 'suggestion__card--priceg';
                priceG.textContent = `$${p.priceg.toLocaleString('es-CO')} g`;
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
        let currentIndex = 0;

        const track = document.querySelector(".suggestions__track");
        const cards = track ? track.querySelectorAll(".suggestion__card") : [];
        const wrapper = document.querySelector(".suggestions__wrapper");

        const leftBtn = document.querySelector(".arrow.left");
        const rightBtn = document.querySelector(".arrow.right");

        function updateCarousel() {
            const cards = track ? track.querySelectorAll(".suggestion__card") : [];
            if (!track || !wrapper || cards.length === 0) return;

            const cardWidth = 300;
            const gap = 30;
            const totalWidth = cards.length * (cardWidth + gap) - gap;
            const wrapperWidth = wrapper.offsetWidth;

            const visible = Math.max(1, Math.floor((wrapperWidth + gap) / (cardWidth + gap)));
            const maxIndex = Math.max(0, cards.length - visible);

            //Ensures that currentIndex is within limits
            if (currentIndex < 0) currentIndex = 0;
            if (currentIndex > maxIndex) currentIndex = maxIndex;

            // Dynamic side padding to display latest full cards
            const sidePadding = wrapperWidth >= totalWidth ? 0 : (wrapperWidth - cardWidth) / 50;
            track.style.paddingInline = `${sidePadding}px`;

            // Calculate displacement
            let offset = currentIndex * (cardWidth + gap);
            const maxOffset = Math.max(0, totalWidth + sidePadding * 2 - wrapperWidth);
            if (offset > maxOffset) offset = maxOffset;

            track.style.transform = `translateX(-${offset}px)`;

            // Visual centering if all products fit
            if (totalWidth <= wrapperWidth) {
                track.style.marginLeft = 'auto';
                track.style.marginRight = 'auto';
            } else {
                track.style.marginLeft = '0';
                track.style.marginRight = '0';
            }

            // Arrows
            if (leftBtn) leftBtn.disabled = currentIndex === 0;
            if (rightBtn) rightBtn.disabled = currentIndex === maxIndex;
        }

        // Navigation events
        if (leftBtn) {
            leftBtn.addEventListener('click', () => {
                currentIndex--;
                updateCarousel();
            });
        }

        if (rightBtn) {
            rightBtn.addEventListener('click', () => {
                currentIndex++;
                updateCarousel();
            });
        }

        window.addEventListener('resize', updateCarousel);

        // Initialize carousel after rendering products
        setTimeout(() => {
            currentIndex = 0;
            updateCarousel();
        }, 300);
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
            const stock = product ? product.stock : 0;
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

                const stock = product ? product.stock : 0;
                let cart = JSON.parse(localStorage.getItem('cart') || '{}');
                const qty = parseInt(input.value) || 1;
                const key = `${productTitle}|1`;

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
                        productName: productTitle,
                        quantity: qty,
                        kgPerUnit: 1,
                        pricekg: product.pricekg,
                        image: product.images && product.images[0] ? product.images[0] : ''
                    };
                }

                // Save cart and products
                localStorage.setItem('cart', JSON.stringify(cart));
                product.stock -= qty;
                if (product.stock < 0) product.stock = 0;
                productsData[productTitle].stock = product.stock;
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