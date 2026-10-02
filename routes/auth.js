const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email and password are required" });
        }

        db.query("SELECT id FROM users WHERE email = ?", [email], async (err, rows) => {
            if (err) return res.status(500).json({ message: err.message });
            if (rows.length) return res.status(400).json({ message: "Email already exists" });

            const hash = await bcrypt.hash(password, 10);
            db.query(
                "INSERT INTO users (name,email,password,phone,address) VALUES (?,?,?,?,?)",
                [name, email, hash, phone || null, address || null],
                (err, result) => {
                    if (err) return res.status(500).json({ message: err.message });
                    res.status(201).json({ message: "Registration successful", userId: result.insertId });
                }
            );
        });
    } catch {
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!rows.length) return res.status(401).json({ message: "Invalid email or password" });

        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ message: "Invalid email or password" });

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    });
});

module.exports = router;
