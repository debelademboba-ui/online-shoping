async function loadHome() {
    try {
        const [pRes, cRes] = await Promise.all([
            fetch("/api/products"),
            fetch("/api/categories")
        ]);
        const products = await pRes.json();
        const categories = await cRes.json();

        const productBox = document.getElementById("featuredProducts");
        const categoryBox = document.getElementById("categoryContainer");

        if (productBox) {
            productBox.innerHTML = products.slice(0, 4).map(product => `
                <div class="product-card">
                    <img src="images/${product.image || "default.jpg"}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>${product.description || ""}</p>
                    <strong>${Number(product.price).toFixed(2)} ETB</strong>
                    <a class="btn" href="product-details.html?id=${product.id}">View Product</a>
                </div>
            `).join("");
        }

        if (categoryBox) {
            categoryBox.innerHTML = categories.map(c => `
                <div class="category-card">
                    <h3>${c.name}</h3>
                    <p>${c.description || ""}</p>
                    <a href="products.html" class="text-link">View products</a>
                </div>
            `).join("");
        }
    } catch (e) {
        console.error(e);
    }
}
loadHome();
