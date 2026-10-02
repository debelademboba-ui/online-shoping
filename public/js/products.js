let allProducts = [];

async function loadAllProducts() {
    const response = await fetch("/api/products");
    allProducts = await response.json();
    displayProducts(allProducts);
    await loadCategories();
}

function displayProducts(products) {
    const container = document.getElementById("productsContainer");
    if (!container) return;

    if (!products.length) {
        container.innerHTML = "<p>No products found.</p>";
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="images/${product.image || "default.jpg"}" alt="${product.name}">
            <span class="badge">${product.category_name || "General"}</span>
            <h3>${product.name}</h3>
            <p>${product.description || ""}</p>
            <strong>${Number(product.price).toFixed(2)} ETB</strong>
            <p>Stock: ${product.quantity}</p>
            <a class="btn" href="product-details.html?id=${product.id}">Details</a>
        </div>
    `).join("");
}

async function loadCategories() {
    const select = document.getElementById("categoryFilter");
    if (!select) return;

    const response = await fetch("/api/categories");
    const categories = await response.json();

    select.innerHTML = '<option value="">All Categories</option>' +
        categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
}

const searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener("input", filterProducts);
}
const categoryFilter = document.getElementById("categoryFilter");
if (categoryFilter) {
    categoryFilter.addEventListener("change", filterProducts);
}

function filterProducts() {
    const keyword = (searchInput?.value || "").toLowerCase();
    const category = categoryFilter?.value || "";

    const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(keyword) &&
        (!category || String(p.category_id) === String(category))
    );

    displayProducts(filtered);
}

async function loadProductDetails() {
    const id = new URLSearchParams(location.search).get("id");
    const box = document.getElementById("productDetails");
    if (!box || !id) return;

    const response = await fetch(`/api/products/${id}`);
    const product = await response.json();

    if (!response.ok) {
        box.innerHTML = `<p>${product.message}</p>`;
        return;
    }

    box.innerHTML = `
        <div class="product-detail">
            <img src="images/${product.image || "default.jpg"}" alt="${product.name}">
            <div>
                <span class="badge">${product.category_name || "General"}</span>
                <h1>${product.name}</h1>
                <p>${product.description || ""}</p>
                <h2>${Number(product.price).toFixed(2)} ETB</h2>
                <p>Available stock: ${product.quantity}</p>
                <input type="number" id="productQuantity" min="1" max="${product.quantity}" value="1">
                <button class="btn" onclick="addToCart(${product.id})">Add to Cart</button>
            </div>
        </div>
    `;
}

async function addToCart(productId) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please login first.");
        location.href = "login.html";
        return;
    }

    const quantity = Number(document.getElementById("productQuantity")?.value || 1);

    const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: productId, quantity })
    });

    const result = await response.json();
    alert(result.message);
}

if (document.getElementById("productsContainer")) loadAllProducts();
if (document.getElementById("productDetails")) loadProductDetails();
