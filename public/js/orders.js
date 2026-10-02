const checkoutForm = document.getElementById("checkoutForm");

if (checkoutForm) {
    checkoutForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        if (!token) {
            location.href = "login.html";
            return;
        }

        const shipping_address = document.getElementById("shippingAddress").value.trim();

        const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ shipping_address })
        });

        const result = await response.json();
        document.getElementById("checkoutMessage").textContent = result.message;

        if (response.ok) {
            checkoutForm.reset();
            setTimeout(() => location.href = "orders.html", 900);
        }
    });
}

async function loadOrders() {
    const box = document.getElementById("ordersContainer");
    if (!box) return;

    const token = localStorage.getItem("token");
    if (!token) {
        box.innerHTML = '<p>Please <a href="login.html">login</a> first.</p>';
        return;
    }

    const response = await fetch("/api/orders", {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const orders = await response.json();

    if (!orders.length) {
        box.innerHTML = "<p>No orders found.</p>";
        return;
    }

    box.innerHTML = orders.map(o => `
        <div class="order-card">
            <div class="order-head">
                <h3>Order #${o.id}</h3>
                <span class="status">${o.status}</span>
            </div>
            <p><strong>Total:</strong> ${Number(o.total_amount).toFixed(2)} ETB</p>
            <p><strong>Address:</strong> ${o.shipping_address}</p>
            <p><strong>Date:</strong> ${new Date(o.order_date).toLocaleString()}</p>
            <a class="text-link" href="order-details.html?id=${o.id}">View details</a>
        </div>
    `).join("");
}
loadOrders();
