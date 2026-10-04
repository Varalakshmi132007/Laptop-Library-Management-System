import { useEffect, useState } from "react";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [savedEmails, setSavedEmails] = useState([]);

    // =====================================================
    // LOAD PREVIOUSLY USED EMAILS
    // =====================================================

    useEffect(() => {
        const storedEmails =
            JSON.parse(localStorage.getItem("loginEmails")) || [];

        setSavedEmails(storedEmails);
    }, []);


    // =====================================================
    // SAVE EMAIL
    // =====================================================

    const saveEmail = (emailToSave) => {
        const cleanEmail = emailToSave.trim();

        if (!cleanEmail) {
            return;
        }

        const existingEmails =
            JSON.parse(localStorage.getItem("loginEmails")) || [];

        // Remove duplicate email
        const updatedEmails = existingEmails.filter(
            (item) => item !== cleanEmail
        );

        // Put latest email at the top
        updatedEmails.unshift(cleanEmail);

        // Keep only last 5 emails
        const limitedEmails = updatedEmails.slice(0, 5);

        localStorage.setItem(
            "loginEmails",
            JSON.stringify(limitedEmails)
        );

        setSavedEmails(limitedEmails);
    };


    // =====================================================
    // LOGIN
    // =====================================================

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(
                "http://127.0.0.1:3000/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(
                    data.error ||
                    "Login failed"
                );

                return;
            }


            // =================================================
            // REMEMBER SUCCESSFULLY USED EMAIL
            // =================================================

            saveEmail(email);


            // =================================================
            // SAVE LOGIN INFORMATION
            // =================================================

            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "role",
                data.user.role
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );


            // =================================================
            // GO TO DASHBOARD
            // =================================================

            if (data.user.role === "STUDENT") {

                window.location.href = "/student";

            }

            else if (data.user.role === "ADMIN") {

                window.location.href = "/admin";

            }

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            alert(
                "Cannot connect to server"
            );
        }
    };


    // =====================================================
    // PAGE
    // =====================================================

    return (
        <div style={styles.page}>

            <div style={styles.loginCard}>

                {/* =========================================
                    LOGO
                ========================================== */}

                <div style={styles.logo}>
                    💻
                </div>


                {/* =========================================
                    TITLE
                ========================================== */}

                <h1 style={styles.title}>
                    Laptop Library
                </h1>


                {/* =========================================
                    SUBTITLE
                ========================================== */}

                <p style={styles.subtitle}>
                    Laptop Library Management System
                </p>


                {/* =========================================
                    LOGIN TITLE
                ========================================== */}

                <h2 style={styles.loginTitle}>
                    Login
                </h2>


                {/* =========================================
                    LOGIN FORM
                ========================================== */}

                <form onSubmit={handleLogin}>

                    {/* EMAIL */}

                    <div style={styles.inputGroup}>

                        <label style={styles.label}>
                            Email
                        </label>

                        <input
                            list="saved-emails"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            autoComplete="username"
                            required
                            style={styles.input}
                        />


                        {/* SAVED EMAILS */}

                        <datalist id="saved-emails">

                            {savedEmails.map(
                                (savedEmail, index) => (
                                    <option
                                        key={index}
                                        value={savedEmail}
                                    />
                                )
                            )}

                        </datalist>

                    </div>


                    {/* PASSWORD */}

                    <div style={styles.inputGroup}>

                        <label style={styles.label}>
                            Password
                        </label>

                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            autoComplete="current-password"
                            required
                            style={styles.input}
                        />

                    </div>


                    {/* LOGIN BUTTON */}

                    <button
                        type="submit"
                        style={styles.loginButton}
                    >
                        Login
                    </button>

                </form>

            </div>

        </div>
    );
}


// =========================================================
// STYLES
// =========================================================

const styles = {

    // =====================================================
    // FULL SCREEN PAGE
    // =====================================================

    page: {
        position: "fixed",

        top: 0,
        left: 0,
        right: 0,
        bottom: 0,

        width: "100vw",
        height: "100vh",

        minWidth: "100vw",
        minHeight: "100vh",

        display: "flex",

        justifyContent: "center",
        alignItems: "center",

        background: "#f3f4f6",

        margin: 0,
        padding: "30px",

        boxSizing: "border-box",

        fontFamily:
            "Arial, Helvetica, sans-serif",

        overflow: "auto",

        zIndex: 9999
    },


    // =====================================================
    // LOGIN CARD
    // =====================================================

    loginCard: {
        width: "380px",

        maxWidth: "100%",

        background: "#ffffff",

        padding: "40px",

        borderRadius: "12px",

        boxShadow:
            "0 8px 25px rgba(0, 0, 0, 0.12)",

        textAlign: "center",

        boxSizing: "border-box"
    },


    // =====================================================
    // LOGO
    // =====================================================

    logo: {
        fontSize: "42px",

        marginBottom: "8px"
    },


    // =====================================================
    // MAIN TITLE
    // =====================================================

    title: {
        margin: 0,

        fontSize: "30px",

        color: "#1f2937"
    },


    // =====================================================
    // SUBTITLE
    // =====================================================

    subtitle: {
        marginTop: "8px",

        marginBottom: "28px",

        color: "#6b7280",

        fontSize: "14px"
    },


    // =====================================================
    // LOGIN TITLE
    // =====================================================

    loginTitle: {
        marginBottom: "24px",

        color: "#111827",

        fontSize: "22px"
    },


    // =====================================================
    // INPUT GROUP
    // =====================================================

    inputGroup: {
        textAlign: "left",

        marginBottom: "18px",

        width: "100%"
    },


    // =====================================================
    // LABEL
    // =====================================================

    label: {
        display: "block",

        marginBottom: "7px",

        fontWeight: "600",

        color: "#374151",

        fontSize: "14px"
    },


    // =====================================================
    // INPUT
    // =====================================================

    input: {
        display: "block",

        width: "100%",

        height: "45px",

        boxSizing: "border-box",

        padding: "12px",

        border: "1px solid #d1d5db",

        borderRadius: "7px",

        fontSize: "15px",

        outline: "none",

        background: "#ffffff",

        color: "#111827"
    },


    // =====================================================
    // LOGIN BUTTON
    // =====================================================

    loginButton: {
        width: "100%",

        height: "45px",

        padding: "12px",

        marginTop: "8px",

        border: "none",

        borderRadius: "7px",

        background: "#2563eb",

        color: "#ffffff",

        fontSize: "16px",

        fontWeight: "600",

        cursor: "pointer"
    }
};


export default Login;