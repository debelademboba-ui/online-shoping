async function loadCart() {
    const token = localStorage.getItem("token");
    const container = document.getElementById("cartContainer");
    const totalBox = document.getElementById("cartTotal");
    if (!container) return;

    if (!token) {
        container.innerHTML = '<p>Please <a href="login.html">login</a> to view your cart.</p>';
        return;
    }

    const response = await fetch("/api/cart", {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const items = await response.json();

    if (!items.length) {
        container.innerHTML = "<p>Your cart is empty.</p>";
        totalBox.innerHTML = "";
        return;
    }

    let total = 0;
    container.innerHTML = items.map(item => {
        total += Number(item.subtotal);
        return `
            <div class="cart-item">
                <img src="images/${item.image || "default.jpg"}" alt="${item.name}">
                <div class="cart-info">
                    <h3>${item.name}</h3>
                    <p>Price: ${Number(item.price).toFixed(2)} ETB</p>
                    <label>Quantity:
                        <input type="number" min="1" value="${item.quantity}"
                               onchange="updateCartItem(${item.id}, this.value)">
                    </label>
                    <p>Subtotal: ${Number(item.subtotal).toFixed(2)} ETB</p>
                    <button class="danger-btn" onclick="removeCartItem(${item.id})">Remove</button>
                </div>
            </div>
        `;
    }).join("");

    totalBox.innerHTML = `
        <div class="cart-summary">
            <h2>Total: ${total.toFixed(2)} ETB</h2>
            <a href="checkout.html" class="btn">Checkout</a>
        </div>
    `;
}

async function updateCartItem(id, quantity) {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/cart/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: Number(quantity) })
    });
    const result = await response.json();
    if (!response.ok) alert(result.message);
    loadCart();
}

async function removeCartItem(id) {
    const token = localStorage.getItem("token");
    await fetch(`/api/cart/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });
    loadCart();
}

loadCart();
