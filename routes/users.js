const express = require("express");
const db = require("../config/db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const router = express.Router();

router.get("/profile", authenticateToken, (req, res) => {
    db.query(`SELECT id,name,email,role,phone,address,created_at FROM users WHERE id=?`,
        [req.user.id], (err, rows) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json(rows[0]);
        });
});

router.get("/", authenticateToken, requireAdmin, (req, res) => {
    db.query(`SELECT id,name,email,role,phone,address,created_at FROM users ORDER BY id DESC`,
        (err, rows) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json(rows);
        });
});

module.exports = router;
