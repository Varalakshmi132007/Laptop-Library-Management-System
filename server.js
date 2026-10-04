const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

const app = express();

const PORT = 3000;

const JWT_SECRET =
    process.env.JWT_SECRET || "laptop_library_secret_key";

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());
app.use(helmet());
app.use(express.json());

/* =========================================================
   MYSQL CONNECTION
========================================================= */

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) {
        console.error("MySQL connection error:", err);
        return;
    }

    console.log("MySQL connected successfully!");
});

/* =========================================================
   JWT AUTHENTICATION
========================================================= */

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            error: "Access token required"
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            error: "Access token required"
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                error: "Invalid or expired token"
            });
        }

        req.user = user;
        next();
    });
}

/* =========================================================
   ADMIN AUTHORIZATION
========================================================= */

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({
            error: "Admin access required"
        });
    }

    next();
}

/* =========================================================
   VALIDATION
========================================================= */

function handleValidation(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: errors.array()[0].msg
        });
    }

    next();
}

/* =========================================================
   RATE LIMITER
========================================================= */

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: "Too many login attempts. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

/* =========================================================
   ACTIVITY LOG
========================================================= */

function logActivity(userId, userName, action, description) {
    const sql = `
        INSERT INTO activity_logs
        (
            user_id,
            user_name,
            action,
            description
        )
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            userId || null,
            userName || "System",
            action,
            description
        ],
        (err) => {
            if (err) {
                console.error("Activity log error:", err);
            }
        }
    );
}

/* =========================================================
   NOTIFICATION
========================================================= */

function createNotification(
    recipientType,
    recipientId,
    message,
    type = "INFO"
) {
    const sql = `
        INSERT INTO notifications
        (
            recipient_type,
            recipient_id,
            message,
            type
        )
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            recipientType,
            recipientId || null,
            message,
            type
        ],
        (err) => {
            if (err) {
                console.error(
                    "Notification creation error:",
                    err
                );
            }
        }
    );
}

/* =========================================================
   HOME
========================================================= */

app.get("/", (req, res) => {
    res.send("Laptop Library Backend is running!");
});

/* =========================================================
   LOGIN
========================================================= */

app.post(
    "/api/login",
    loginLimiter,
    [
        body("email")
            .isEmail()
            .withMessage("Valid email is required"),

        body("password")
            .notEmpty()
            .withMessage("Password is required")
    ],
    handleValidation,
    (req, res) => {
        const { email, password } = req.body;

        const cleanEmail = email.trim().toLowerCase();

        const sql = `
            SELECT
                user_id,
                name,
                email,
                password,
                role,
                student_id,
                status
            FROM users
            WHERE email = ?
            LIMIT 1
        `;

        db.query(
            sql,
            [cleanEmail],
            async (err, results) => {

                if (err) {
                    console.error(
                        "Login database error:",
                        err
                    );

                    return res.status(500).json({
                        error: "Database error"
                    });
                }

                if (results.length === 0) {
                    return res.status(401).json({
                        error:
                            "Invalid email or password"
                    });
                }

                const user = results[0];

                if (user.status !== "ACTIVE") {
                    return res.status(403).json({
                        error:
                            "User account is inactive"
                    });
                }

                try {

                    const passwordMatch =
                        await bcrypt.compare(
                            password,
                            user.password
                        );

                    if (!passwordMatch) {
                        return res.status(401).json({
                            error:
                                "Invalid email or password"
                        });
                    }

                    const token = jwt.sign(
                        {
                            user_id: user.user_id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            student_id:
                                user.student_id
                        },
                        JWT_SECRET,
                        {
                            expiresIn: "1d"
                        }
                    );

                    logActivity(
                        user.user_id,
                        user.name,
                        "LOGIN",
                        `${user.role} ${user.name} logged in`
                    );

                    res.json({
                        message:
                            "Login successful",

                        token,

                        role: user.role,

                        user: {
                            user_id:
                                user.user_id,

                            name:
                                user.name,

                            email:
                                user.email,

                            role:
                                user.role,

                            student_id:
                                user.student_id
                        }
                    });

                } catch (error) {

                    console.error(
                        "Password comparison error:",
                        error
                    );

                    return res.status(500).json({
                        error: "Login failed"
                    });
                }
            }
        );
    }
);

/* =========================================================
   GET ALL LAPTOPS
========================================================= */

app.get(
    "/api/laptops",
    authenticateToken,
    (req, res) => {

        const sql = `
            SELECT *
            FROM laptops
            ORDER BY laptop_id ASC
        `;

        db.query(sql, (err, results) => {

            if (err) {
                console.error(
                    "Laptop loading error:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to load laptops"
                });
            }

            res.json({
                laptops: results
            });
        });
    }
);

/* =========================================================
   ADMIN LAPTOP SUMMARY
========================================================= */

app.get(
    "/api/admin/laptops/summary",
    authenticateToken,
    requireAdmin,
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
                console.error(
                    "Laptop summary error:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to fetch laptop summary"
                });
            }

            res.json(results[0]);
        });
    }
);

/* =========================================================
   ADMIN ADD LAPTOP
========================================================= */

app.post(
    "/api/admin/laptops",
    authenticateToken,
    requireAdmin,
    [
        body("laptop_code")
            .trim()
            .notEmpty()
            .withMessage(
                "Laptop code is required"
            ),

        body("brand")
            .trim()
            .notEmpty()
            .withMessage(
                "Brand is required"
            ),

        body("model")
            .trim()
            .notEmpty()
            .withMessage(
                "Model is required"
            )
    ],
    handleValidation,
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

        const sql = `
            INSERT INTO laptops
            (
                laptop_code,
                brand,
                model,
                processor,
                ram,
                storage,
                operating_system,
                condition_status,
                purchase_date,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE')
        `;

        db.query(
            sql,
            [
                laptop_code,
                brand,
                model,
                processor || null,
                ram || null,
                storage || null,
                operating_system || null,
                condition_status || "Good",
                purchase_date || null
            ],
            (err, result) => {

                if (err) {
                    console.error(
                        "Add laptop error:",
                        err
                    );

                    if (
                        err.code ===
                        "ER_DUP_ENTRY"
                    ) {
                        return res.status(409).json({
                            error:
                                "Laptop code already exists"
                        });
                    }

                    return res.status(500).json({
                        error:
                            "Failed to add laptop"
                    });
                }

                logActivity(
                    req.user.user_id,
                    req.user.name,
                    "LAPTOP_ADDED",
                    `Laptop ${laptop_code} (${brand} ${model}) added to inventory`
                );

                res.json({
                    message:
                        "Laptop added successfully",

                    laptop_id:
                        result.insertId
                });
            }
        );
    }
);

/* =========================================================
   ADMIN EDIT LAPTOP
========================================================= */

app.put(
    "/api/admin/laptops/:id",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const laptopId =
            req.params.id;

        const {
            laptop_code,
            brand,
            model,
            processor,
            ram,
            storage,
            operating_system,
            status,
            condition_status,
            purchase_date
        } = req.body;

        if (
            !laptop_code ||
            !brand ||
            !model
        ) {
            return res.status(400).json({
                error:
                    "Laptop code, brand and model are required"
            });
        }

        const sql = `
            UPDATE laptops
            SET
                laptop_code = ?,
                brand = ?,
                model = ?,
                processor = ?,
                ram = ?,
                storage = ?,
                operating_system = ?,
                status = ?,
                condition_status = ?,
                purchase_date = ?
            WHERE laptop_id = ?
        `;

        db.query(
            sql,
            [
                laptop_code,
                brand,
                model,
                processor || null,
                ram || null,
                storage || null,
                operating_system || null,
                status || "AVAILABLE",
                condition_status || "Good",
                purchase_date || null,
                laptopId
            ],
            (err, result) => {

                if (err) {
                    console.error(
                        "Edit laptop error:",
                        err
                    );

                    if (
                        err.code ===
                        "ER_DUP_ENTRY"
                    ) {
                        return res.status(409).json({
                            error:
                                "Laptop code already exists"
                        });
                    }

                    return res.status(500).json({
                        error:
                            "Failed to update laptop"
                    });
                }

                if (
                    result.affectedRows === 0
                ) {
                    return res.status(404).json({
                        error:
                            "Laptop not found"
                    });
                }

                logActivity(
                    req.user.user_id,
                    req.user.name,
                    "LAPTOP_EDITED",
                    `Laptop ${laptop_code} details updated`
                );

                res.json({
                    message:
                        "Laptop updated successfully"
                });
            }
        );
    }
);

/* =========================================================
   ADMIN - ADD NEW STUDENT
   IMPORTANT:
   Creates BOTH:
   1. students record
   2. users login record
========================================================= */

app.post(
    "/api/admin/students",
    authenticateToken,
    requireAdmin,
    [
        body("name")
            .trim()
            .notEmpty()
            .withMessage(
                "Name is required"
            ),

        body("email")
            .isEmail()
            .withMessage(
                "Valid email is required"
            ),

        body("student_number")
            .trim()
            .notEmpty()
            .withMessage(
                "Student number is required"
            ),

        body("department")
            .trim()
            .notEmpty()
            .withMessage(
                "Department is required"
            ),

        body("year")
            .isInt({
                min: 1,
                max: 5
            })
            .withMessage(
                "Year must be a number between 1 and 5"
            )
    ],
    handleValidation,
    async (req, res) => {

        try {

            const {
                name,
                email,
                student_number,
                department,
                year,
                phone
            } = req.body;

            const cleanName =
                name.trim();

            const cleanEmail =
                email.trim().toLowerCase();

            const cleanStudentNumber =
                student_number.trim();

            /*
            =========================================
            DEFAULT PASSWORD
            =========================================
            */

            const defaultPassword =
                "student@123";

            /*
            =========================================
            HASH PASSWORD
            =========================================
            */

            const hashedPassword =
                await bcrypt.hash(
                    defaultPassword,
                    10
                );

            /*
            =========================================
            CHECK EMAIL
            =========================================
            */

            const checkEmailSql = `
                SELECT user_id
                FROM users
                WHERE email = ?
                LIMIT 1
            `;

            db.query(
                checkEmailSql,
                [cleanEmail],
                (emailErr, emailResults) => {

                    if (emailErr) {

                        console.error(
                            "Email check error:",
                            emailErr
                        );

                        return res.status(500).json({
                            error:
                                "Database error"
                        });
                    }

                    if (
                        emailResults.length > 0
                    ) {

                        return res.status(409).json({
                            error:
                                "Email already exists"
                        });
                    }

                    /*
                    =========================================
                    CHECK STUDENT NUMBER
                    =========================================
                    */

                    const checkStudentSql = `
                        SELECT student_id
                        FROM students
                        WHERE student_number = ?
                        LIMIT 1
                    `;

                    db.query(
                        checkStudentSql,
                        [cleanStudentNumber],
                        (
                            studentErr,
                            studentResults
                        ) => {

                            if (studentErr) {

                                console.error(
                                    "Student number check error:",
                                    studentErr
                                );

                                return res.status(500).json({
                                    error:
                                        "Database error"
                                });
                            }

                            if (
                                studentResults.length > 0
                            ) {

                                return res.status(409).json({
                                    error:
                                        "Student number already exists"
                                });
                            }

                            /*
                            =========================================
                            INSERT INTO STUDENTS
                            =========================================
                            */

                            const studentSql = `
                                INSERT INTO students
                                (
                                    name,
                                    email,
                                    student_number,
                                    department,
                                    year,
                                    password,
                                    phone,
                                    status
                                )
                                VALUES
                                (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
                            `;

                            const studentValues = [
                                cleanName,
                                cleanEmail,
                                cleanStudentNumber,
                                department.trim(),
                                Number(year),
                                hashedPassword,
                                phone || null
                            ];

                            db.query(
                                studentSql,
                                studentValues,
                                (
                                    studentInsertErr,
                                    studentResult
                                ) => {

                                    if (
                                        studentInsertErr
                                    ) {

                                        console.error(
                                            "Student insert error:",
                                            studentInsertErr
                                        );

                                        return res.status(500).json({
                                            error:
                                                studentInsertErr.sqlMessage ||
                                                "Failed to add student"
                                        });
                                    }

                                    const studentId =
                                        studentResult.insertId;

                                    /*
                                    =========================================
                                    CREATE USER LOGIN ACCOUNT
                                    =========================================
                                    */

                                    const userSql = `
                                        INSERT INTO users
                                        (
                                            name,
                                            email,
                                            password,
                                            role,
                                            student_id,
                                            status
                                        )
                                        VALUES
                                        (?, ?, ?, 'STUDENT', ?, 'ACTIVE')
                                    `;

                                    const userValues = [
                                        cleanName,
                                        cleanEmail,
                                        hashedPassword,
                                        studentId
                                    ];

                                    db.query(
                                        userSql,
                                        userValues,
                                        (
                                            userErr,
                                            userResult
                                        ) => {

                                            if (userErr) {

                                                console.error(
                                                    "User account creation error:",
                                                    userErr
                                                );

                                                /*
                                                Roll back student
                                                if user creation fails
                                                */

                                                const deleteStudentSql = `
                                                    DELETE FROM students
                                                    WHERE student_id = ?
                                                `;

                                                db.query(
                                                    deleteStudentSql,
                                                    [studentId],
                                                    () => {}
                                                );

                                                return res.status(500).json({
                                                    error:
                                                        "Student created but login account could not be created"
                                                });
                                            }

                                            /*
                                            =========================================
                                            ACTIVITY LOG
                                            =========================================
                                            */

                                            logActivity(
                                                req.user.user_id,
                                                req.user.name,
                                                "STUDENT_REGISTERED",
                                                `Student ${cleanName} (${cleanStudentNumber}) added by admin`
                                            );

                                            /*
                                            =========================================
                                            SUCCESS
                                            =========================================
                                            */

                                            res.status(201).json({

                                                message:
                                                    "Student added successfully",

                                                student_id:
                                                    studentId,

                                                user_id:
                                                    userResult.insertId,

                                                default_password:
                                                    defaultPassword
                                            });
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );

        } catch (error) {

            console.error(
                "Add student error:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to add student"
            });
        }
    }
);

/* =========================================================
   ADMIN STUDENTS
========================================================= */

app.get(
    "/api/admin/students",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const {
            search = "",
            department = "",
            status = ""
        } = req.query;

        let sql = `
            SELECT
                student_id,
                name,
                email,
                student_number,
                department,
                year,
                phone,
                status,
                created_at
            FROM students
            WHERE 1 = 1
        `;

        const values = [];

        if (search) {

            sql += `
                AND
                (
                    name LIKE ?
                    OR email LIKE ?
                    OR student_number LIKE ?
                )
            `;

            const searchValue =
                `%${search}%`;

            values.push(
                searchValue,
                searchValue,
                searchValue
            );
        }

        if (department) {

            sql += `
                AND department = ?
            `;

            values.push(department);
        }

        if (status) {

            sql += `
                AND status = ?
            `;

            values.push(status);
        }

        sql += `
            ORDER BY student_id DESC
        `;

        db.query(
            sql,
            values,
            (err, results) => {

                if (err) {

                    console.error(
                        "Student loading error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to load students"
                    });
                }

                res.json({
                    students:
                        results
                });
            }
        );
    }
);

/* =========================================================
   DEACTIVATE STUDENT
========================================================= */

app.put(
    "/api/admin/students/:id/deactivate",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const studentId =
            req.params.id;

        const updateStudentQuery = `
            UPDATE students
            SET status = 'INACTIVE'
            WHERE student_id = ?
        `;

        db.query(
            updateStudentQuery,
            [studentId],
            (err, studentResult) => {

                if (err) {

                    console.error(
                        "Update students table error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Database error"
                    });
                }

                if (
                    studentResult.affectedRows === 0
                ) {

                    return res.status(404).json({
                        error:
                            "Student not found"
                    });
                }

                const updateUserQuery = `
                    UPDATE users
                    SET status = 'INACTIVE'
                    WHERE student_id = ?
                `;

                db.query(
                    updateUserQuery,
                    [studentId],
                    (err) => {

                        if (err) {

                            console.error(
                                "Update users table error:",
                                err
                            );

                            return res.status(500).json({
                                error:
                                    "Failed to deactivate user account"
                            });
                        }

                        res.json({
                            message:
                                "Student deactivated successfully"
                        });
                    }
                );
            }
        );
    }
);

/* =========================================================
   REACTIVATE STUDENT
========================================================= */

app.put(
    "/api/admin/students/:id/reactivate",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const studentId =
            req.params.id;

        const updateStudentQuery = `
            UPDATE students
            SET status = 'ACTIVE'
            WHERE student_id = ?
        `;

        db.query(
            updateStudentQuery,
            [studentId],
            (err, studentResult) => {

                if (err) {

                    console.error(
                        "Update students table error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Database error"
                    });
                }

                if (
                    studentResult.affectedRows === 0
                ) {

                    return res.status(404).json({
                        error:
                            "Student not found"
                    });
                }

                const updateUserQuery = `
                    UPDATE users
                    SET status = 'ACTIVE'
                    WHERE student_id = ?
                `;

                db.query(
                    updateUserQuery,
                    [studentId],
                    (err) => {

                        if (err) {

                            console.error(
                                "Update users table error:",
                                err
                            );

                            return res.status(500).json({
                                error:
                                    "Failed to reactivate user account"
                            });
                        }

                        res.json({
                            message:
                                "Student reactivated successfully"
                        });
                    }
                );
            }
        );
    }
);

/* =========================================================
   STUDENT DASHBOARD
========================================================= */

app.get(
    "/api/student/dashboard",
    authenticateToken,
    (req, res) => {

        const studentId =
            req.user.student_id;

        if (!studentId) {

            return res.status(400).json({
                error:
                    "Student account is not linked to a student"
            });
        }

        const sql = `
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
            sql,
            [studentId],
            (err, results) => {

                if (err) {

                    console.error(
                        "Student dashboard error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Database error"
                    });
                }

                if (
                    results.length === 0
                ) {

                    return res.status(404).json({
                        error:
                            "Student not found"
                    });
                }

                res.json({
                    student:
                        results[0]
                });
            }
        );
    }
);

/* =========================================================
   STUDENT REQUEST LAPTOP
========================================================= */

app.post(
    "/api/student/request-laptop",
    authenticateToken,
    (req, res) => {

        const studentId =
            req.user.student_id;

        const laptopId =
            req.body.laptop_id;

        if (!studentId) {

            return res.status(400).json({
                error:
                    "Student account is not linked"
            });
        }

        if (!laptopId) {

            return res.status(400).json({
                error:
                    "Laptop ID is required"
            });
        }

        const activeBorrowingSql = `
            SELECT issue_id
            FROM borrowings
            WHERE student_id = ?
            AND status IN ('ACTIVE', 'OVERDUE')
            LIMIT 1
        `;

        db.query(
            activeBorrowingSql,
            [studentId],
            (err, borrowingResults) => {

                if (err) {

                    console.error(
                        "Active borrowing check error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Database error"
                    });
                }

                if (
                    borrowingResults.length > 0
                ) {

                    return res.status(400).json({
                        error:
                            "Student already has an active laptop"
                    });
                }

                const pendingRequestSql = `
                    SELECT request_id
                    FROM laptop_requests
                    WHERE student_id = ?
                    AND status = 'PENDING'
                    LIMIT 1
                `;

                db.query(
                    pendingRequestSql,
                    [studentId],
                    (err, pendingResults) => {

                        if (err) {

                            console.error(
                                "Pending request check error:",
                                err
                            );

                            return res.status(500).json({
                                error:
                                    "Database error"
                            });
                        }

                        if (
                            pendingResults.length > 0
                        ) {

                            return res.status(400).json({
                                error:
                                    "You already have a pending laptop request"
                            });
                        }

                        const laptopSql = `
                            SELECT
                                laptop_id,
                                status
                            FROM laptops
                            WHERE laptop_id = ?
                            LIMIT 1
                        `;

                        db.query(
                            laptopSql,
                            [laptopId],
                            (err, laptopResults) => {

                                if (err) {

                                    console.error(
                                        "Laptop check error:",
                                        err
                                    );

                                    return res.status(500).json({
                                        error:
                                            "Database error"
                                    });
                                }

                                if (
                                    laptopResults.length === 0
                                ) {

                                    return res.status(404).json({
                                        error:
                                            "Laptop not found"
                                    });
                                }

                                if (
                                    laptopResults[0].status !==
                                    "AVAILABLE"
                                ) {

                                    return res.status(400).json({
                                        error:
                                            "Laptop is not available"
                                    });
                                }

                                const insertSql = `
                                    INSERT INTO laptop_requests
                                    (
                                        student_id,
                                        laptop_id,
                                        status
                                    )
                                    VALUES
                                    (?, ?, 'PENDING')
                                `;

                                db.query(
                                    insertSql,
                                    [
                                        studentId,
                                        laptopId
                                    ],
                                    (err, result) => {

                                        if (err) {

                                            console.error(
                                                "Create request error:",
                                                err
                                            );

                                            return res.status(500).json({
                                                error:
                                                    "Failed to create laptop request"
                                            });
                                        }

                                        createNotification(
                                            "ADMIN",
                                            null,
                                            `New laptop request from ${req.user.name} for laptop ID ${laptopId}`,
                                            "REQUEST"
                                        );

                                        res.json({
                                            message:
                                                "Laptop request submitted successfully",

                                            request_id:
                                                result.insertId
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }
);

/* =========================================================
   ADMIN VIEW REQUESTS
========================================================= */

app.get(
    "/api/admin/requests",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const sql = `
            SELECT
                r.request_id,
                r.student_id,
                r.laptop_id,
                r.request_datetime,
                r.status,
                r.approved_by,
                r.approved_datetime,
                r.remarks,

                s.name AS student_name,
                s.student_number,
                s.email AS student_email,

                l.laptop_code,
                l.brand,
                l.model,
                l.status AS laptop_status

            FROM laptop_requests r

            JOIN students s
                ON r.student_id = s.student_id

            JOIN laptops l
                ON r.laptop_id = l.laptop_id

            ORDER BY
                r.request_datetime DESC
        `;

        db.query(
            sql,
            (err, results) => {

                if (err) {

                    console.error(
                        "Admin requests error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to load requests"
                    });
                }

                res.json({
                    total_requests:
                        results.length,

                    requests:
                        results
                });
            }
        );
    }
);

/* =========================================================
   APPROVE REQUEST + ISSUE LAPTOP
========================================================= */

app.put(
    "/api/admin/requests/:requestId/approve",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const requestId =
            req.params.requestId;

        const adminId =
            req.user.user_id;

        const requestSql = `
            SELECT
                request_id,
                student_id,
                laptop_id,
                status
            FROM laptop_requests
            WHERE request_id = ?
            LIMIT 1
        `;

        db.query(
            requestSql,
            [requestId],
            (err, requestResults) => {

                if (err) {

                    console.error(
                        "Request lookup error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Database error"
                    });
                }

                if (
                    requestResults.length === 0
                ) {

                    return res.status(404).json({
                        error:
                            "Request not found"
                    });
                }

                const request =
                    requestResults[0];

                if (
                    request.status !==
                    "PENDING"
                ) {

                    return res.status(400).json({
                        error:
                            "Request is not pending"
                    });
                }

                const studentSql = `
                    SELECT
                        student_id,
                        status
                    FROM students
                    WHERE student_id = ?
                `;

                db.query(
                    studentSql,
                    [request.student_id],
                    (err, studentResults) => {

                        if (err) {

                            console.error(
                                "Student check error:",
                                err
                            );

                            return res.status(500).json({
                                error:
                                    "Database error"
                            });
                        }

                        if (
                            studentResults.length === 0
                        ) {

                            return res.status(404).json({
                                error:
                                    "Student not found"
                            });
                        }

                        if (
                            studentResults[0].status !==
                            "ACTIVE"
                        ) {

                            return res.status(400).json({
                                error:
                                    "Student account is inactive"
                            });
                        }

                        const activeBorrowingSql = `
                            SELECT issue_id
                            FROM borrowings
                            WHERE student_id = ?
                            AND status IN ('ACTIVE', 'OVERDUE')
                            LIMIT 1
                        `;

                        db.query(
                            activeBorrowingSql,
                            [request.student_id],
                            (err, borrowingResults) => {

                                if (err) {

                                    console.error(
                                        "Borrowing check error:",
                                        err
                                    );

                                    return res.status(500).json({
                                        error:
                                            "Database error"
                                    });
                                }

                                if (
                                    borrowingResults.length > 0
                                ) {

                                    return res.status(400).json({
                                        error:
                                            "Student already has an active laptop"
                                    });
                                }

                                const laptopSql = `
                                    SELECT
                                        laptop_id,
                                        laptop_code,
                                        status,
                                        condition_status
                                    FROM laptops
                                    WHERE laptop_id = ?
                                    LIMIT 1
                                `;

                                db.query(
                                    laptopSql,
                                    [request.laptop_id],
                                    (err, laptopResults) => {

                                        if (err) {

                                            console.error(
                                                "Laptop check error:",
                                                err
                                            );

                                            return res.status(500).json({
                                                error:
                                                    "Database error"
                                            });
                                        }

                                        if (
                                            laptopResults.length === 0
                                        ) {

                                            return res.status(404).json({
                                                error:
                                                    "Laptop not found"
                                            });
                                        }

                                        const laptop =
                                            laptopResults[0];

                                        if (
                                            laptop.status !==
                                            "AVAILABLE"
                                        ) {

                                            return res.status(400).json({
                                                error:
                                                    "Laptop is no longer available"
                                            });
                                        }

                                        const issueDatetime =
                                            new Date();

                                        const returnDeadline =
                                            new Date(
                                                issueDatetime.getTime() +
                                                3 *
                                                24 *
                                                60 *
                                                60 *
                                                1000
                                            );

                                        const issueDatetimeSQL =
                                            issueDatetime
                                                .toISOString()
                                                .slice(0, 19)
                                                .replace(
                                                    "T",
                                                    " "
                                                );

                                        const returnDeadlineSQL =
                                            returnDeadline
                                                .toISOString()
                                                .slice(0, 19)
                                                .replace(
                                                    "T",
                                                    " "
                                                );

                                        const borrowingSql = `
                                            INSERT INTO borrowings
                                            (
                                                student_id,
                                                laptop_id,
                                                issue_datetime,
                                                return_deadline,
                                                status,
                                                condition_before,
                                                issued_by,
                                                remarks
                                            )
                                            VALUES
                                            (
                                                ?,
                                                ?,
                                                ?,
                                                ?,
                                                'ACTIVE',
                                                ?,
                                                ?,
                                                ?
                                            )
                                        `;

                                        db.query(
                                            borrowingSql,
                                            [
                                                request.student_id,
                                                request.laptop_id,
                                                issueDatetimeSQL,
                                                returnDeadlineSQL,
                                                laptop.condition_status ||
                                                    "Good",
                                                adminId,
                                                "Issued through approved laptop request"
                                            ],
                                            (err, borrowingResult) => {

                                                if (err) {

                                                    console.error(
                                                        "Borrowing creation error:",
                                                        err
                                                    );

                                                    return res.status(500).json({
                                                        error:
                                                            "Failed to create borrowing"
                                                    });
                                                }

                                                const updateLaptopSql = `
                                                    UPDATE laptops
                                                    SET status = 'ISSUED'
                                                    WHERE laptop_id = ?
                                                    AND status = 'AVAILABLE'
                                                `;

                                                db.query(
                                                    updateLaptopSql,
                                                    [
                                                        request.laptop_id
                                                    ],
                                                    (err, laptopResult) => {

                                                        if (err) {

                                                            console.error(
                                                                "Laptop update error:",
                                                                err
                                                            );

                                                            return res.status(500).json({
                                                                error:
                                                                    "Failed to update laptop status"
                                                            });
                                                        }

                                                        if (
                                                            laptopResult.affectedRows === 0
                                                        ) {

                                                            return res.status(400).json({
                                                                error:
                                                                    "Laptop could not be issued"
                                                            });
                                                        }

                                                        const updateRequestSql = `
                                                            UPDATE laptop_requests
                                                            SET
                                                                status = 'APPROVED',
                                                                approved_by = ?,
                                                                approved_datetime = NOW()
                                                            WHERE
                                                                request_id = ?
                                                            AND status = 'PENDING'
                                                        `;

                                                        db.query(
                                                            updateRequestSql,
                                                            [
                                                                adminId,
                                                                requestId
                                                            ],
                                                            (err) => {

                                                                if (err) {

                                                                    console.error(
                                                                        "Request update error:",
                                                                        err
                                                                    );

                                                                    return res.status(500).json({
                                                                        error:
                                                                            "Failed to update request"
                                                                    });
                                                                }

                                                                logActivity(
                                                                    adminId,
                                                                    req.user.name,
                                                                    "LAPTOP_ISSUED",
                                                                    `Laptop ${laptop.laptop_code || request.laptop_id} issued to student ID ${request.student_id}`
                                                                );

                                                                createNotification(
                                                                    "STUDENT",
                                                                    request.student_id,
                                                                    "Your laptop request has been approved and issued.",
                                                                    "SUCCESS"
                                                                );

                                                                res.json({
                                                                    message:
                                                                        "Request approved and laptop issued successfully",

                                                                    issue_id:
                                                                        borrowingResult.insertId,

                                                                    return_deadline:
                                                                        returnDeadlineSQL
                                                                });
                                                            }
                                                        );
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }
);

/* =========================================================
   REJECT REQUEST
========================================================= */

app.put(
    "/api/admin/requests/:requestId/reject",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const requestId =
            req.params.requestId;

        const adminId =
            req.user.user_id;

        const remarks =
            req.body.remarks || "";

        const lookupSql = `
            SELECT student_id
            FROM laptop_requests
            WHERE request_id = ?
            LIMIT 1
        `;

        db.query(
            lookupSql,
            [requestId],
            (lookupErr, lookupResults) => {

                if (lookupErr) {

                    console.error(
                        "Reject lookup error:",
                        lookupErr
                    );

                    return res.status(500).json({
                        error:
                            "Database error"
                    });
                }

                const targetStudentId =
                    lookupResults.length > 0
                        ? lookupResults[0].student_id
                        : null;

                const sql = `
                    UPDATE laptop_requests
                    SET
                        status = 'REJECTED',
                        approved_by = ?,
                        approved_datetime = NOW(),
                        remarks = ?
                    WHERE
                        request_id = ?
                        AND status = 'PENDING'
                `;

                db.query(
                    sql,
                    [
                        adminId,
                        remarks,
                        requestId
                    ],
                    (err, result) => {

                        if (err) {

                            console.error(
                                "Reject request error:",
                                err
                            );

                            return res.status(500).json({
                                error:
                                    "Failed to reject request"
                            });
                        }

                        if (
                            result.affectedRows === 0
                        ) {

                            return res.status(400).json({
                                error:
                                    "Request not found or request is not pending"
                            });
                        }

                        logActivity(
                            adminId,
                            req.user.name,
                            "REQUEST_REJECTED",
                            `Laptop request #${requestId} rejected`
                        );

                        if (targetStudentId) {

                            createNotification(
                                "STUDENT",
                                targetStudentId,
                                "Your laptop request was rejected. Contact the library for details.",
                                "WARNING"
                            );
                        }

                        res.json({
                            message:
                                "Laptop request rejected successfully"
                        });
                    }
                );
            }
        );
    }
);

/* =========================================================
   CURRENT STUDENT LAPTOP
========================================================= */

app.get(
    "/api/student/current-laptop",
    authenticateToken,
    (req, res) => {

        const studentId =
            req.user.student_id;

        if (!studentId) {

            return res.status(400).json({
                error:
                    "Student account is not linked"
            });
        }

        const sql = `
            SELECT
                b.issue_id,
                b.issue_datetime,
                b.return_deadline,
                b.status AS borrowing_status,
                b.condition_before,

                l.laptop_id,
                l.laptop_code,
                l.brand,
                l.model,
                l.processor,
                l.ram,
                l.storage,
                l.operating_system,
                l.status AS laptop_status

            FROM borrowings b

            JOIN laptops l
                ON b.laptop_id = l.laptop_id

            WHERE
                b.student_id = ?

            AND
                b.status IN ('ACTIVE', 'OVERDUE')

            ORDER BY
                b.issue_datetime DESC

            LIMIT 1
        `;

        db.query(
            sql,
            [studentId],
            (err, results) => {

                if (err) {

                    console.error(
                        "Current laptop error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Database error"
                    });
                }

                if (
                    results.length === 0
                ) {

                    return res.status(404).json({
                        message:
                            "No active laptop found"
                    });
                }

                const laptop =
                    results[0];

                if (
                    laptop.borrowing_status ===
                    "ACTIVE" &&
                    new Date(
                        laptop.return_deadline
                    ) < new Date()
                ) {
                    laptop.borrowing_status =
                        "OVERDUE";
                }

                res.json({
                    message:
                        "Current laptop retrieved successfully",

                    laptop
                });
            }
        );
    }
);

/* =========================================================
   STUDENT BORROWING HISTORY
========================================================= */

app.get(
    "/api/student/borrowing-history",
    authenticateToken,
    (req, res) => {

        const studentId =
            req.user.student_id;

        if (!studentId) {

            return res.status(400).json({
                error:
                    "Student account is not linked"
            });
        }

        const sql = `
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

            WHERE
                b.student_id = ?

            ORDER BY
                b.issue_datetime DESC
        `;

        db.query(
            sql,
            [studentId],
            (err, results) => {

                if (err) {

                    console.error(
                        "Borrowing history error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Database error"
                    });
                }

                res.json({
                    message:
                        "Borrowing history retrieved successfully",

                    total_records:
                        results.length,

                    history:
                        results
                });
            }
        );
    }
);

/* =========================================================
   ADMIN VIEW BORROWINGS
========================================================= */

app.get(
    "/api/admin/borrowings",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const sql = `
            SELECT
                b.issue_id,
                b.student_id,
                b.laptop_id,
                b.issue_datetime,
                b.return_deadline,
                b.actual_return_datetime,
                b.status,
                b.condition_before,
                b.condition_after,
                b.remarks,

                s.name AS student_name,
                s.student_number,

                l.laptop_code,
                l.brand,
                l.model

            FROM borrowings b

            JOIN students s
                ON b.student_id = s.student_id

            JOIN laptops l
                ON b.laptop_id = l.laptop_id

            WHERE b.status IN ('ACTIVE', 'OVERDUE')

            ORDER BY
                b.return_deadline ASC
        `;

        db.query(
            sql,
            (err, results) => {

                if (err) {

                    console.error(
                        "Error loading borrowings:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to load borrowings"
                    });
                }

                res.json({
                    borrowings:
                        results
                });
            }
        );
    }
);

/* =========================================================
   ADMIN BORROWING HISTORY
========================================================= */

app.get(
    "/api/admin/borrowings/history",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const {
            search = "",
            status = "",
            start_date = "",
            end_date = ""
        } = req.query;

        let sql = `
            SELECT
                b.issue_id,
                b.student_id,
                b.laptop_id,
                b.issue_datetime,
                b.return_deadline,
                b.actual_return_datetime,
                b.status,
                b.condition_before,
                b.condition_after,
                b.remarks,

                s.name AS student_name,
                s.student_number,

                l.laptop_code,
                l.brand,
                l.model

            FROM borrowings b

            JOIN students s
                ON b.student_id = s.student_id

            JOIN laptops l
                ON b.laptop_id = l.laptop_id

            WHERE 1 = 1
        `;

        const values = [];

        if (search) {

            sql += `
                AND
                (
                    s.name LIKE ?
                    OR s.student_number LIKE ?
                    OR l.laptop_code LIKE ?
                )
            `;

            const searchValue =
                `%${search}%`;

            values.push(
                searchValue,
                searchValue,
                searchValue
            );
        }

        if (status) {

            sql += `
                AND b.status = ?
            `;

            values.push(status);
        }

        if (start_date) {

            sql += `
                AND b.issue_datetime >= ?
            `;

            values.push(start_date);
        }

        if (end_date) {

            sql += `
                AND b.issue_datetime <= ?
            `;

            values.push(end_date);
        }

        sql += `
            ORDER BY
                b.issue_datetime DESC
        `;

        db.query(
            sql,
            values,
            (err, results) => {

                if (err) {

                    console.error(
                        "Borrowing history admin error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to load borrowing history"
                    });
                }

                res.json({
                    total_records:
                        results.length,

                    history:
                        results
                });
            }
        );
    }
);

/* =========================================================
   ADMIN RETURN LAPTOP
========================================================= */

app.put(
    "/api/admin/borrowings/:issueId/return",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const issueId =
            req.params.issueId;

        const adminId =
            req.user.user_id;

        const conditionAfter =
            req.body.condition_after ||
            "Good";

        const remarks =
            req.body.remarks || "";

        const borrowingSql = `
            SELECT
                issue_id,
                laptop_id,
                student_id,
                status
            FROM borrowings
            WHERE issue_id = ?
            LIMIT 1
        `;

        db.query(
            borrowingSql,
            [issueId],
            (err, results) => {

                if (err) {

                    console.error(
                        "Return lookup error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Database error"
                    });
                }

                if (
                    results.length === 0
                ) {

                    return res.status(404).json({
                        error:
                            "Borrowing record not found"
                    });
                }

                const borrowing =
                    results[0];

                if (
                    borrowing.status !== "ACTIVE" &&
                    borrowing.status !== "OVERDUE"
                ) {

                    return res.status(400).json({
                        error:
                            "This laptop has already been returned"
                    });
                }

                const lowerCondition =
                    conditionAfter.toLowerCase();

                const newLaptopStatus =
                    lowerCondition.includes("damage") ||
                    lowerCondition.includes("damaged") ||
                    lowerCondition.includes("repair")
                        ? "MAINTENANCE"
                        : "AVAILABLE";

                const updateBorrowingSql = `
                    UPDATE borrowings
                    SET
                        actual_return_datetime = NOW(),
                        status = 'RETURNED',
                        condition_after = ?,
                        returned_to = ?,
                        remarks = ?
                    WHERE issue_id = ?
                `;

                db.query(
                    updateBorrowingSql,
                    [
                        conditionAfter,
                        adminId,
                        remarks,
                        issueId
                    ],
                    (err) => {

                        if (err) {

                            console.error(
                                "Return borrowing error:",
                                err
                            );

                            return res.status(500).json({
                                error:
                                    "Failed to return laptop"
                            });
                        }

                        const updateLaptopSql = `
                            UPDATE laptops
                            SET
                                status = ?,
                                condition_status = ?
                            WHERE laptop_id = ?
                        `;

                        db.query(
                            updateLaptopSql,
                            [
                                newLaptopStatus,
                                conditionAfter,
                                borrowing.laptop_id
                            ],
                            (err) => {

                                if (err) {

                                    console.error(
                                        "Laptop return update error:",
                                        err
                                    );

                                    return res.status(500).json({
                                        error:
                                            "Failed to update laptop"
                                    });
                                }

                                logActivity(
                                    adminId,
                                    req.user.name,
                                    "LAPTOP_RETURNED",
                                    `Laptop ID ${borrowing.laptop_id} returned, condition: ${conditionAfter}`
                                );

                                if (
                                    newLaptopStatus ===
                                    "MAINTENANCE"
                                ) {

                                    logActivity(
                                        adminId,
                                        req.user.name,
                                        "LAPTOP_MAINTENANCE",
                                        `Laptop ID ${borrowing.laptop_id} moved to maintenance due to damage`
                                    );

                                    const maintenanceSql = `
                                        INSERT INTO maintenance
                                        (
                                            laptop_id,
                                            issue_description,
                                            reported_date,
                                            status,
                                            remarks
                                        )
                                        VALUES
                                        (
                                            ?,
                                            ?,
                                            NOW(),
                                            'REPORTED',
                                            ?
                                        )
                                    `;

                                    db.query(
                                        maintenanceSql,
                                        [
                                            borrowing.laptop_id,
                                            conditionAfter,
                                            remarks || null
                                        ],
                                        (
                                            maintenanceErr,
                                            maintenanceResult
                                        ) => {

                                            if (
                                                maintenanceErr
                                            ) {

                                                console.error(
                                                    "Automatic maintenance record error:",
                                                    maintenanceErr
                                                );

                                                return res.status(500).json({
                                                    error:
                                                        "Laptop was returned, but maintenance record could not be created"
                                                });
                                            }

                                            createNotification(
                                                "STUDENT",
                                                borrowing.student_id,
                                                "Your laptop return has been processed successfully.",
                                                "SUCCESS"
                                            );

                                            return res.json({
                                                message:
                                                    "Laptop returned and maintenance record created successfully",

                                                laptop_status:
                                                    newLaptopStatus,

                                                maintenance_id:
                                                    maintenanceResult.insertId
                                            });
                                        }
                                    );

                                } else {

                                    createNotification(
                                        "STUDENT",
                                        borrowing.student_id,
                                        "Your laptop return has been processed successfully.",
                                        "SUCCESS"
                                    );

                                    return res.json({
                                        message:
                                            "Laptop returned successfully",

                                        laptop_status:
                                            newLaptopStatus
                                    });
                                }
                            }
                        );
                    }
                );
            }
        );
    }
);

/* =========================================================
   STUDENT NOTIFICATIONS
========================================================= */

app.get(
    "/api/student/notifications",
    authenticateToken,
    (req, res) => {

        const studentId =
            req.user.student_id;

        const sql = `
            SELECT
                notification_id,
                message,
                type,
                is_read,
                created_at
            FROM notifications
            WHERE
                recipient_type = 'STUDENT'
                AND recipient_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `;

        db.query(
            sql,
            [studentId],
            (err, results) => {

                if (err) {

                    console.error(
                        "Student notifications error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to load notifications"
                    });
                }

                const unreadCount =
                    results.filter(
                        (n) => !n.is_read
                    ).length;

                res.json({
                    notifications:
                        results,

                    unread_count:
                        unreadCount
                });
            }
        );
    }
);

/* =========================================================
   MARK STUDENT NOTIFICATION READ
========================================================= */

app.put(
    "/api/student/notifications/:id/read",
    authenticateToken,
    (req, res) => {

        const studentId =
            req.user.student_id;

        const notificationId =
            req.params.id;

        const sql = `
            UPDATE notifications
            SET is_read = 1
            WHERE
                notification_id = ?
                AND recipient_type = 'STUDENT'
                AND recipient_id = ?
        `;

        db.query(
            sql,
            [
                notificationId,
                studentId
            ],
            (err, result) => {

                if (err) {

                    console.error(
                        "Mark notification read error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to update notification"
                    });
                }

                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({
                        error:
                            "Notification not found"
                    });
                }

                res.json({
                    message:
                        "Notification marked as read"
                });
            }
        );
    }
);

/* =========================================================
   MARK ALL STUDENT NOTIFICATIONS READ
========================================================= */

app.put(
    "/api/student/notifications/read-all",
    authenticateToken,
    (req, res) => {

        const studentId =
            req.user.student_id;

        const sql = `
            UPDATE notifications
            SET is_read = 1
            WHERE
                recipient_type = 'STUDENT'
                AND recipient_id = ?
                AND is_read = 0
        `;

        db.query(
            sql,
            [studentId],
            (err, result) => {

                if (err) {

                    console.error(
                        "Mark all read error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to update notifications"
                    });
                }

                res.json({
                    message:
                        "All notifications marked as read",

                    updated:
                        result.affectedRows
                });
            }
        );
    }
);

/* =========================================================
   ADMIN NOTIFICATIONS
========================================================= */

app.get(
    "/api/admin/notifications",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const sql = `
            SELECT
                notification_id,
                message,
                type,
                is_read,
                created_at
            FROM notifications
            WHERE recipient_type = 'ADMIN'
            ORDER BY created_at DESC
            LIMIT 50
        `;

        db.query(
            sql,
            (err, results) => {

                if (err) {

                    console.error(
                        "Admin notifications error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to load notifications"
                    });
                }

                const unreadCount =
                    results.filter(
                        (n) => !n.is_read
                    ).length;

                res.json({
                    notifications:
                        results,

                    unread_count:
                        unreadCount
                });
            }
        );
    }
);

/* =========================================================
   MARK ADMIN NOTIFICATION READ
========================================================= */

app.put(
    "/api/admin/notifications/:id/read",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const notificationId =
            req.params.id;

        const sql = `
            UPDATE notifications
            SET is_read = 1
            WHERE
                notification_id = ?
                AND recipient_type = 'ADMIN'
        `;

        db.query(
            sql,
            [notificationId],
            (err, result) => {

                if (err) {

                    console.error(
                        "Mark admin notification read error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to update notification"
                    });
                }

                res.json({
                    message:
                        "Notification marked as read"
                });
            }
        );
    }
);

/* =========================================================
   ADMIN ACTIVITY LOGS
========================================================= */

app.get(
    "/api/admin/activity-logs",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const {
            action = "",
            start_date = "",
            end_date = "",
            limit = 100
        } = req.query;

        let sql = `
            SELECT
                log_id,
                user_id,
                user_name,
                action,
                description,
                created_at
            FROM activity_logs
            WHERE 1 = 1
        `;

        const values = [];

        if (action) {

            sql += `
                AND action = ?
            `;

            values.push(action);
        }

        if (start_date) {

            sql += `
                AND created_at >= ?
            `;

            values.push(start_date);
        }

        if (end_date) {

            sql += `
                AND created_at <= ?
            `;

            values.push(end_date);
        }

        sql += `
            ORDER BY created_at DESC
            LIMIT ?
        `;

        values.push(
            Number(limit)
        );

        db.query(
            sql,
            values,
            (err, results) => {

                if (err) {

                    console.error(
                        "Activity log fetch error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to load activity logs"
                    });
                }

                res.json({
                    total:
                        results.length,

                    logs:
                        results
                });
            }
        );
    }
);

/* =========================================================
   ADMIN REPORTS - LAPTOP USAGE
========================================================= */

app.get(
    "/api/admin/reports/laptop-usage",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const sql = `
            SELECT
                l.laptop_id,
                l.laptop_code,
                l.brand,
                l.model,
                l.status AS current_status,

                COUNT(b.issue_id)
                    AS total_issues,

                SUM(
                    CASE
                        WHEN b.status = 'RETURNED'
                        THEN 1
                        ELSE 0
                    END
                ) AS total_returns,

                SUM(
                    CASE
                        WHEN b.status IN
                            ('ACTIVE', 'OVERDUE')
                        THEN 1
                        ELSE 0
                    END
                ) AS currently_active

            FROM laptops l

            LEFT JOIN borrowings b
                ON l.laptop_id = b.laptop_id

            GROUP BY
                l.laptop_id,
                l.laptop_code,
                l.brand,
                l.model,
                l.status

            ORDER BY
                total_issues DESC
        `;

        db.query(
            sql,
            (err, results) => {

                if (err) {

                    console.error(
                        "Laptop usage report error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to generate report"
                    });
                }

                res.json({
                    report:
                        results
                });
            }
        );
    }
);

/* =========================================================
   ADMIN REPORTS - STUDENT USAGE
========================================================= */

app.get(
    "/api/admin/reports/student-usage",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const sql = `
            SELECT
                s.student_id,
                s.name,
                s.student_number,
                s.department,

                COUNT(b.issue_id)
                    AS total_sessions,

                ROUND(
                    SUM(
                        CASE
                            WHEN b.status = 'RETURNED'
                            THEN TIMESTAMPDIFF(
                                MINUTE,
                                b.issue_datetime,
                                b.actual_return_datetime
                            )
                            ELSE 0
                        END
                    ) / 60,
                    2
                ) AS total_usage_hours

            FROM students s

            LEFT JOIN borrowings b
                ON s.student_id = b.student_id

            GROUP BY
                s.student_id,
                s.name,
                s.student_number,
                s.department

            HAVING
                total_sessions > 0

            ORDER BY
                total_sessions DESC
        `;

        db.query(
            sql,
            (err, results) => {

                if (err) {

                    console.error(
                        "Student usage report error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to generate report"
                    });
                }

                res.json({
                    report:
                        results
                });
            }
        );
    }
);

/* =========================================================
   ADMIN REPORTS - OVERDUE
========================================================= */

app.get(
    "/api/admin/reports/overdue",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const sql = `
            SELECT
                b.issue_id,
                s.name AS student_name,
                s.student_number,

                l.laptop_code,
                l.brand,
                l.model,

                b.return_deadline,

                TIMESTAMPDIFF(
                    HOUR,
                    b.return_deadline,
                    NOW()
                ) AS hours_overdue

            FROM borrowings b

            JOIN students s
                ON b.student_id = s.student_id

            JOIN laptops l
                ON b.laptop_id = l.laptop_id

            WHERE
                b.status = 'OVERDUE'

            ORDER BY
                b.return_deadline ASC
        `;

        db.query(
            sql,
            (err, results) => {

                if (err) {

                    console.error(
                        "Overdue report error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to generate report"
                    });
                }

                res.json({
                    report:
                        results
                });
            }
        );
    }
);

/* =========================================================
   AUTOMATIC OVERDUE CHECKER
========================================================= */

function updateOverdueBorrowings() {

    const findSql = `
        SELECT
            issue_id,
            student_id,
            laptop_id
        FROM borrowings
        WHERE
            status = 'ACTIVE'
            AND return_deadline < NOW()
    `;

    db.query(
        findSql,
        (err, rows) => {

            if (err) {

                console.error(
                    "Overdue lookup error:",
                    err
                );

                return;
            }

            if (rows.length === 0) {
                return;
            }

            const ids =
                rows.map(
                    (r) => r.issue_id
                );

            const updateSql = `
                UPDATE borrowings
                SET status = 'OVERDUE'
                WHERE issue_id IN (?)
            `;

            db.query(
                updateSql,
                [ids],
                (updateErr, result) => {

                    if (updateErr) {

                        console.error(
                            "Overdue update error:",
                            updateErr
                        );

                        return;
                    }

                    console.log(
                        `${result.affectedRows} borrowing(s) marked as OVERDUE`
                    );

                    rows.forEach(
                        (row) => {

                            logActivity(
                                null,
                                "System",
                                "LAPTOP_OVERDUE",
                                `Borrowing #${row.issue_id} (laptop ID ${row.laptop_id}) is now overdue`
                            );

                            createNotification(
                                "STUDENT",
                                row.student_id,
                                "Your laptop return time has expired. Please return it immediately.",
                                "WARNING"
                            );

                            createNotification(
                                "ADMIN",
                                null,
                                `Laptop (borrowing #${row.issue_id}) is overdue for return`,
                                "WARNING"
                            );
                        }
                    );
                }
            );
        }
    );
}

setInterval(
    updateOverdueBorrowings,
    60 * 1000
);

updateOverdueBorrowings();

/* =========================================================
   ADMIN - MAINTENANCE
========================================================= */

app.get(
    "/api/admin/maintenance",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const sql = `
            SELECT
                m.maintenance_id,
                m.laptop_id,
                l.laptop_code,
                l.brand,
                l.model,
                m.issue_description,
                m.reported_date,
                m.repair_date,
                m.completed_date,
                m.status,
                m.remarks

            FROM maintenance m

            JOIN laptops l
                ON m.laptop_id = l.laptop_id

            ORDER BY
                m.reported_date DESC
        `;

        db.query(
            sql,
            (err, results) => {

                if (err) {

                    console.error(
                        "Maintenance fetch error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to fetch maintenance records"
                    });
                }

                res.json(results);
            }
        );
    }
);

/* =========================================================
   ADMIN - REPORT MAINTENANCE
========================================================= */

app.post(
    "/api/admin/maintenance",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const {
            laptop_id,
            issue_description,
            remarks
        } = req.body;

        if (
            !laptop_id ||
            !issue_description
        ) {

            return res.status(400).json({
                error:
                    "Laptop and issue description are required"
            });
        }

        const checkSql = `
            SELECT
                laptop_id,
                laptop_code,
                status
            FROM laptops
            WHERE laptop_id = ?
        `;

        db.query(
            checkSql,
            [laptop_id],
            (err, laptops) => {

                if (err) {

                    console.error(
                        "Laptop check error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to check laptop"
                    });
                }

                if (
                    laptops.length === 0
                ) {

                    return res.status(404).json({
                        error:
                            "Laptop not found"
                    });
                }

                const laptop =
                    laptops[0];

                if (
                    laptop.status ===
                    "ISSUED"
                ) {

                    return res.status(400).json({
                        error:
                            "This laptop is currently issued. Return the laptop before reporting maintenance."
                    });
                }

                if (
                    laptop.status ===
                    "INACTIVE"
                ) {

                    return res.status(400).json({
                        error:
                            "This laptop is inactive."
                    });
                }

                if (
                    laptop.status ===
                    "MAINTENANCE"
                ) {

                    return res.status(400).json({
                        error:
                            "This laptop is already under maintenance."
                    });
                }

                const insertSql = `
                    INSERT INTO maintenance
                    (
                        laptop_id,
                        issue_description,
                        reported_date,
                        status,
                        remarks
                    )
                    VALUES
                    (?, ?, NOW(), 'REPORTED', ?)
                `;

                db.query(
                    insertSql,
                    [
                        laptop_id,
                        issue_description,
                        remarks || null
                    ],
                    (insertErr, result) => {

                        if (insertErr) {

                            console.error(
                                "Maintenance insert error:",
                                insertErr
                            );

                            return res.status(500).json({
                                error:
                                    "Failed to create maintenance record"
                            });
                        }

                        const updateSql = `
                            UPDATE laptops
                            SET status = 'MAINTENANCE'
                            WHERE laptop_id = ?
                        `;

                        db.query(
                            updateSql,
                            [laptop_id],
                            (updateErr) => {

                                if (updateErr) {

                                    console.error(
                                        "Laptop status update error:",
                                        updateErr
                                    );

                                    return res.status(500).json({
                                        error:
                                            "Maintenance created but laptop status update failed"
                                    });
                                }

                                res.status(201).json({
                                    message:
                                        "Maintenance reported successfully",

                                    maintenance_id:
                                        result.insertId,

                                    laptop_id:
                                        laptop_id
                                });
                            }
                        );
                    }
                );
            }
        );
    }
);

/* =========================================================
   ADMIN - START MAINTENANCE
========================================================= */

app.put(
    "/api/admin/maintenance/:maintenanceId/start",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const {
            maintenanceId
        } = req.params;

        const sql = `
            UPDATE maintenance
            SET
                status = 'IN_PROGRESS',
                repair_date = NOW()
            WHERE
                maintenance_id = ?
                AND status = 'REPORTED'
        `;

        db.query(
            sql,
            [maintenanceId],
            (err, result) => {

                if (err) {

                    console.error(
                        "Start maintenance error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to start maintenance"
                    });
                }

                if (
                    result.affectedRows === 0
                ) {

                    return res.status(400).json({
                        error:
                            "Maintenance record not found or repair has already started."
                    });
                }

                res.json({
                    message:
                        "Repair started successfully"
                });
            }
        );
    }
);

/* =========================================================
   ADMIN - COMPLETE MAINTENANCE
========================================================= */

app.put(
    "/api/admin/maintenance/:maintenanceId/complete",
    authenticateToken,
    requireAdmin,
    (req, res) => {

        const {
            maintenanceId
        } = req.params;

        const {
            remarks
        } = req.body;

        const findSql = `
            SELECT
                maintenance_id,
                laptop_id,
                status
            FROM maintenance
            WHERE maintenance_id = ?
        `;

        db.query(
            findSql,
            [maintenanceId],
            (err, records) => {

                if (err) {

                    console.error(
                        "Find maintenance error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to find maintenance record"
                    });
                }

                if (
                    records.length === 0
                ) {

                    return res.status(404).json({
                        error:
                            "Maintenance record not found"
                    });
                }

                const maintenance =
                    records[0];

                if (
                    maintenance.status !==
                    "IN_PROGRESS"
                ) {

                    return res.status(400).json({
                        error:
                            "Only maintenance in progress can be completed."
                    });
                }

                const updateMaintenanceSql = `
                    UPDATE maintenance
                    SET
                        status = 'COMPLETED',
                        completed_date = NOW(),
                        remarks = ?
                    WHERE maintenance_id = ?
                `;

                db.query(
                    updateMaintenanceSql,
                    [
                        remarks || null,
                        maintenanceId
                    ],
                    (updateErr) => {

                        if (updateErr) {

                            console.error(
                                "Complete maintenance error:",
                                updateErr
                            );

                            return res.status(500).json({
                                error:
                                    "Failed to complete maintenance"
                            });
                        }

                        const updateLaptopSql = `
                            UPDATE laptops
                            SET status = 'AVAILABLE'
                            WHERE laptop_id = ?
                        `;

                        db.query(
                            updateLaptopSql,
                            [maintenance.laptop_id],
                            (laptopErr) => {

                                if (laptopErr) {

                                    console.error(
                                        "Laptop status update error:",
                                        laptopErr
                                    );

                                    return res.status(500).json({
                                        error:
                                            "Maintenance completed but laptop status update failed"
                                    });
                                }

                                res.json({
                                    message:
                                        "Maintenance completed and laptop is available again"
                                });
                            }
                        );
                    }
                );
            }
        );
    }
);

/* =========================================================
   START SERVER
========================================================= */

app.listen(
    PORT,
    "127.0.0.1",
    () => {

        console.log(
            `Server running at http://127.0.0.1:${PORT}`
        );

        console.log(
            "JWT SECRET LOADED:",
            !!JWT_SECRET
        );

        console.log(
            "ALL ROUTES LOADED"
        );
    }
);