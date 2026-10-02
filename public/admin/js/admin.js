const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !user || user.role !== "admin") {
    location.href = "../login.html";
}

const authHeaders = () => ({
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
});

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    location.href = "../login.html";
}

async function getJSON(url, options={}) {
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
}

async function loadDashboard() {
    if (!document.getElementById("productCount")) return;
    try {
        const [products, users, orders] = await Promise.all([
            getJSON("/api/products"),
            getJSON("/api/users", {headers: authHeaders()}),
            getJSON("/api/orders", {headers: authHeaders()})
        ]);
        document.getElementById("productCount").textContent = products.length;
        document.getElementById("userCount").textContent = users.length;
        document.getElementById("orderCount").textContent = orders.length;
    } catch(e) {
        document.getElementById("adminMessage").textContent = e.message;
    }
}

async function loadProductCategories() {
    const select = document.getElementById("categoryId");
    if (!select) return;
    const cats = await getJSON("/api/categories");
    select.innerHTML = '<option value="">Select category</option>' +
        cats.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
}

async function loadAdminProducts() {
    const box = document.getElementById("adminProducts");
    if (!box) return;
    const products = await getJSON("/api/products");
    box.innerHTML = `<table class="admin-table"><thead><tr><th>ID</th><th>Name</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>` +
        products.map(p => `<tr><td>${p.id}</td><td>${p.name}</td><td>${Number(p.price).toFixed(2)} ETB</td><td>${p.quantity}</td><td><button class="btn" onclick='editProduct(${JSON.stringify(p)})'>Edit</button> <button class="danger-btn" onclick="deleteProduct(${p.id})">Delete</button></td></tr>`).join("") +
        `</tbody></table>`;
}

function editProduct(p) {
    document.getElementById("productId").value = p.id;
    document.getElementById("categoryId").value = p.category_id || "";
    document.getElementById("productName").value = p.name;
    document.getElementById("productDescription").value = p.description || "";
    document.getElementById("productPrice").value = p.price;
    document.getElementById("productQuantity").value = p.quantity;
    document.getElementById("productImage").value = p.image || "";
    window.scrollTo({top:0,behavior:"smooth"});
}

function resetProductForm() {
    document.getElementById("productForm")?.reset();
    document.getElementById("productId").value = "";
}

async function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById("productId").value;
    const data = {
        category_id: document.getElementById("categoryId").value || null,
        name: document.getElementById("productName").value,
        description: document.getElementById("productDescription").value,
        price: Number(document.getElementById("productPrice").value),
        quantity: Number(document.getElementById("productQuantity").value),
        image: document.getElementById("productImage").value
    };
    const response = await fetch(id ? `/api/products/${id}` : "/api/products", {
        method: id ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(data)
    });
    const result = await response.json();
    document.getElementById("productMessage").textContent = result.message;
    if (response.ok) { resetProductForm(); loadAdminProducts(); }
}

async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    await getJSON(`/api/products/${id}`, {method:"DELETE", headers:authHeaders()});
    loadAdminProducts();
}

async function loadAdminOrders() {
    const box = document.getElementById("adminOrders");
    if (!box) return;
    const orders = await getJSON("/api/orders", {headers:authHeaders()});
    const statuses = ["Pending","Confirmed","Processing","Shipped","Delivered","Cancelled"];
    box.innerHTML = orders.map(o => `
        <div class="order-card">
            <div class="order-head"><h3>Order #${o.id}</h3><span>${o.status}</span></div>
            <p>Customer: ${o.customer_name} (${o.email})</p>
            <p>Total: ${Number(o.total_amount).toFixed(2)} ETB</p>
            <p>Address: ${o.shipping_address}</p>
            <select onchange="updateOrderStatus(${o.id}, this.value)">
                ${statuses.map(s => `<option ${s===o.status?"selected":""}>${s}</option>`).join("")}
            </select>
        </div>
    `).join("");
}

async function updateOrderStatus(id, status) {
    const result = await getJSON(`/api/orders/${id}/status`, {
        method:"PUT", headers:authHeaders(), body:JSON.stringify({status})
    });
    alert(result.message);
    loadAdminOrders();
}

async function loadUsers() {
    const box = document.getElementById("usersContainer");
    if (!box) return;
    const users = await getJSON("/api/users", {headers:authHeaders()});
    box.innerHTML = `<table class="admin-table"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Created</th></tr></thead><tbody>` +
        users.map(u => `<tr><td>${u.id}</td><td>${u.name}</td><td>${u.email}</td><td>${u.role}</td><td>${u.phone || "-"}</td><td>${new Date(u.created_at).toLocaleDateString()}</td></tr>`).join("") +
        `</tbody></table>`;
}

document.getElementById("productForm")?.addEventListener("submit", saveProduct);
loadDashboard();
loadProductCategories();
loadAdminProducts();
loadAdminOrders();
loadUsers();
