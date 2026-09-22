require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

console.log("JWT SECRET LOADED:", !!process.env.JWT_SECRET);

const app = express();
const PORT = 3000;

// Allow JSON requests
app.use(express.json());


// =====================================================
// MYSQL CONNECTION
// =====================================================

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});


// Connect to MySQL
db.connect((err) => {

    if (err) {
        console.log("MySQL connection failed:", err);
    } else {
        console.log("MySQL connected successfully!");
    }

});


// =====================================================
// HOME ROUTE
// =====================================================

app.get("/", (req, res) => {

    res.send("Laptop Library Backend is running!");

});


// =====================================================
// JWT AUTHENTICATION MIDDLEWARE
// =====================================================

function authenticateToken(req, res, next) {

    const authHeader = req.headers["authorization"];

    const token = authHeader && authHeader.split(" ")[1];

    // No token
    if (!token) {

        return res.status(401).json({
            error: "Access token required"
        });

    }

    // Verify token
    jwt.verify(
        token,
        process.env.JWT_SECRET,
        (err, user) => {

            if (err) {

                return res.status(403).json({
                    error: "Invalid or expired token"
                });

            }

            // Store decoded user information
            req.user = user;

            next();

        }
    );

}


// =====================================================
// GET ALL LAPTOPS
// PROTECTED ROUTE
// =====================================================

app.get("/api/laptops", authenticateToken, (req, res) => {

    db.query(
        "SELECT * FROM laptops",
        (err, results) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    error: "Failed to fetch laptops"
                });

            }

            res.json(results);

        }
    );

});


// =====================================================
// STUDENT / ADMIN LOGIN
// =====================================================

app.post("/api/login", async (req, res) => {

    const {
        email,
        password
    } = req.body;


    // Check required fields
    if (!email || !password) {

        return res.status(400).json({
            error: "Email and password are required"
        });

    }


    try {

        // Find user
        const sql =
            "SELECT * FROM users WHERE email = ?";


        db.query(
            sql,
            [email],
            async (err, results) => {

                if (err) {

                    console.log(
                        "Database error:",
                        err
                    );

                    return res.status(500).json({
                        error: "Database error"
                    });

                }


                // User not found
                if (results.length === 0) {

                    return res.status(401).json({
                        error: "Invalid email or password"
                    });

                }


                const user = results[0];


                // Check password
                const passwordMatch =
                    await bcrypt.compare(
                        password,
                        user.password
                    );


                if (!passwordMatch) {

                    return res.status(401).json({
                        error: "Invalid email or password"
                    });

                }


                // =====================================================
                // CREATE JWT TOKEN
                // =====================================================

                const token = jwt.sign(

                    {
                        user_id: user.user_id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        student_id: user.student_id
                    },

                    process.env.JWT_SECRET,

                    {
                        expiresIn: "1d"
                    }

                );


                // Login successful
                res.json({

                    message: "Login successful",

                    token: token,

                    user: {

                        user_id: user.user_id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        student_id: user.student_id

                    }

                });

            }
        );

    } catch (error) {

        console.log(
            "Login error:",
            error
        );

        res.status(500).json({
            error: "Server error"
        });

    }

});
// =====================================================
// ADMIN - LAPTOP SUMMARY
// PROTECTED ROUTE
// =====================================================

app.get(
    "/api/admin/laptops/summary",
    authenticateToken,
    (req, res) => {

        const sql = `
            SELECT
                COUNT(*) AS total_laptops,

                SUM(
                    CASE
                        WHEN status = 'AVAILABLE'
                        THEN 1
                        ELSE 0
                    END
                ) AS available_laptops,

                SUM(
                    CASE
                        WHEN status = 'ISSUED'
                        THEN 1
                        ELSE 0
                    END
                ) AS issued_laptops,

                SUM(
                    CASE
                        WHEN status = 'MAINTENANCE'
                        THEN 1
                        ELSE 0
                    END
                ) AS maintenance_laptops,

                SUM(
                    CASE
                        WHEN status = 'INACTIVE'
                        THEN 1
                        ELSE 0
                    END
                ) AS inactive_laptops

            FROM laptops
        `;

        db.query(sql, (err, results) => {

            if (err) {

                console.log(
                    "Laptop summary error:",
                    err
                );

                return res.status(500).json({
                    error: "Failed to fetch laptop summary"
                });

            }

            res.json(results[0]);

        });

    }
);


// =====================================================
// STUDENT DASHBOARD
// PROTECTED ROUTE
// =====================================================

app.get(
    "/api/student/dashboard",
    authenticateToken,
    (req, res) => {

        // Get student ID from JWT
        const studentId =
            req.user.student_id;


        // =================================================
        // GET STUDENT DETAILS
        // =================================================

        const studentSql = `

            SELECT

                student_id,
                name,
                email,
                student_number,
                department,
                year,
                phone,
                status

            FROM students

            WHERE student_id = ?

        `;


        db.query(
            studentSql,
            [studentId],
            (err, studentResults) => {

                if (err) {

                    console.log(
                        "Student query error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to fetch student details"
                    });

                }


                // Student not found
                if (studentResults.length === 0) {

                    return res.status(404).json({
                        error: "Student not found"
                    });

                }


                const student =
                    studentResults[0];


                // =================================================
                // GET BORROWING HISTORY
                // =================================================

                const borrowingSql = `

                    SELECT

                        b.issue_id,
                        b.issue_datetime,
                        b.return_deadline,
                        b.actual_return_datetime,
                        b.status,
                        b.condition_before,
                        b.condition_after,
                        b.remarks,

                        l.laptop_id,
                        l.laptop_code,
                        l.brand,
                        l.model,
                        l.processor,
                        l.ram,
                        l.storage,
                        l.operating_system

                    FROM borrowings b

                    JOIN laptops l
                        ON b.laptop_id = l.laptop_id

                    WHERE b.student_id = ?

                    ORDER BY b.issue_datetime DESC

                `;


                db.query(
                    borrowingSql,
                    [studentId],
                    (err, borrowingResults) => {

                        if (err) {

                            console.log(
                                "Borrowing query error:",
                                err
                            );

                            return res.status(500).json({
                                error:
                                    "Failed to fetch borrowing details"
                            });

                        }


                        // =================================================
                        // SEND DASHBOARD DATA
                        // =================================================

                        res.json({

                            student: student,

                            borrowings:
                                borrowingResults

                        });

                    }
                );

            }
        );

    }
);

// =====================================================
// ADMIN - ADD NEW LAPTOP
// PROTECTED ROUTE
// =====================================================

app.post(
    "/api/admin/laptops",
    authenticateToken,
    (req, res) => {

        const {
            laptop_code,
            brand,
            model,
            processor,
            ram,
            storage,
            operating_system,
            condition_status,
            purchase_date
        } = req.body;


        // Check required fields
        if (
            !laptop_code ||
            !brand ||
            !model
        ) {

            return res.status(400).json({
                error: "Laptop code, brand and model are required"
            });

        }


        const sql = `
            INSERT INTO laptops (
                laptop_code,
                brand,
                model,
                processor,
                ram,
                storage,
                operating_system,
                condition_status,
                purchase_date
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;


        const values = [
            laptop_code,
            brand,
            model,
            processor || null,
            ram || null,
            storage || null,
            operating_system || null,
            condition_status || "Good",
            purchase_date || null
        ];


        db.query(
            sql,
            values,
            (err, result) => {

                if (err) {

                    console.log(
                        "Add laptop error:",
                        err
                    );


                    // Duplicate laptop code
                    if (err.code === "ER_DUP_ENTRY") {

                        return res.status(409).json({
                            error: "Laptop code already exists"
                        });

                    }


                    return res.status(500).json({
                        error: "Failed to add laptop"
                    });

                }


                res.status(201).json({

                    message: "Laptop added successfully",

                    laptop_id: result.insertId

                });

            }
        );

    }
);


// =====================================================
// START SERVER
// =====================================================
// =====================================================
// ADMIN - UPDATE LAPTOP
// PROTECTED ROUTE
// =====================================================

app.put(
    "/api/admin/laptops/:id",
    authenticateToken,
    (req, res) => {
        console.log("UPDATE LAPTOP ROUTE HIT");
        const laptopId = req.params.id;

        const {
            brand,
            model,
            processor,
            ram,
            storage,
            operating_system,
            condition_status,
            purchase_date
        } = req.body;


        // Check required fields
        if (!brand || !model) {

            return res.status(400).json({
                error: "Brand and model are required"
            });

        }


        const sql = `
            UPDATE laptops
            SET
                brand = ?,
                model = ?,
                processor = ?,
                ram = ?,
                storage = ?,
                operating_system = ?,
                condition_status = ?,
                purchase_date = ?
            WHERE laptop_id = ?
        `;


        const values = [
            brand,
            model,
            processor || null,
            ram || null,
            storage || null,
            operating_system || null,
            condition_status || "Good",
            purchase_date || null,
            laptopId
        ];


        db.query(
            sql,
            values,
            (err, result) => {

                if (err) {

                    console.log(
                        "Update laptop error:",
                        err
                    );

                    return res.status(500).json({
                        error: "Failed to update laptop"
                    });

                }


                // Laptop ID does not exist
                if (result.affectedRows === 0) {

                    return res.status(404).json({
                        error: "Laptop not found"
                    });

                }


                res.json({
                    message: "Laptop updated successfully"
                });

            }
        );

    }
);
// =====================================================
// ADMIN - DEACTIVATE LAPTOP
// PROTECTED ROUTE
// =====================================================

app.put(
    "/api/admin/laptops/:id/deactivate",
    authenticateToken,
    (req, res) => {

        const laptopId = req.params.id;

        const sql = `
            UPDATE laptops
            SET status = 'INACTIVE'
            WHERE laptop_id = ?
        `;

        db.query(sql, [laptopId], (err, result) => {

            if (err) {
                console.log("Deactivate laptop error:", err);

                return res.status(500).json({
                    error: "Failed to deactivate laptop"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: "Laptop not found"
                });
            }

            res.json({
                message: "Laptop deactivated successfully"
            });
        });
    }
);
console.log("EDIT LAPTOP ROUTE LOADED");
app.listen(
    PORT,
    "127.0.0.1",
    () => {

        console.log(
            `Server running at http://127.0.0.1:${PORT}`
        );

    }
);