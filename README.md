# Online Shopping System

Full-stack E-Commerce project using HTML, CSS, JavaScript, Node.js/Express and XAMPP MySQL.

## Run

1. Start Apache and MySQL in XAMPP.
2. Open phpMyAdmin and import `database.sql`.
3. Open a terminal in this folder.
4. Run:
   `npm install`
5. Run:
   `npm run dev`
6. Open:
   `http://localhost:3000`

## Create Admin

Register normally at `/register.html`, then in phpMyAdmin run:

```sql
UPDATE users SET role='admin' WHERE email='your-email@example.com';
```

Log out and log in again.

## Main features

- Customer registration/login
- Product browsing/search/filter
- Product details
- Shopping cart
- Checkout
- Order history
- Stock reduction after order
- Admin dashboard
- Product CRUD
- Order status management
- User management
