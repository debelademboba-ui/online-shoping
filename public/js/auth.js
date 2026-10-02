const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value,
            phone: document.getElementById("phone").value.trim(),
            address: document.getElementById("address").value.trim()
        };

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            document.getElementById("registerMessage").textContent = result.message;
            if (response.ok) {
                registerForm.reset();
                setTimeout(() => location.href = "login.html", 900);
            }
        } catch {
            document.getElementById("registerMessage").textContent = "Server connection failed.";
        }
    });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: document.getElementById("email").value.trim(),
                    password: document.getElementById("password").value
                })
            });

            const result = await response.json();
            document.getElementById("loginMessage").textContent = result.message;

            if (response.ok) {
                localStorage.setItem("token", result.token);
                localStorage.setItem("user", JSON.stringify(result.user));
                location.href = result.user.role === "admin" ? "admin/dashboard.html" : "index.html";
            }
        } catch {
            document.getElementById("loginMessage").textContent = "Server connection failed.";
        }
    });
}
