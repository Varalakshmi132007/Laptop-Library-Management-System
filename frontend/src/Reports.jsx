import React, { useEffect, useState } from "react";
import AdminSidebar from "./components/AdminSidebar";

const API_BASE_URL = "http://localhost:3000";

function Reports() {
    const [laptopReport, setLaptopReport] = useState([]);
    const [studentReport, setStudentReport] = useState([]);
    const [overdueReport, setOverdueReport] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================================
    // GET TOKEN
    // =========================================

    const getToken = () => {
        return localStorage.getItem("token");
    };

    // =========================================
    // EXPORT DATA TO CSV
    // =========================================

    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) {
            alert("No data available to export.");
            return;
        }

        const headers = Object.keys(data[0]);

        const csvRows = [
            headers.join(","),
            ...data.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header] ?? "";

                        return `"${String(value).replace(
                            /"/g,
                            '""'
                        )}"`;
                    })
                    .join(",")
            ),
        ];

        const csvContent = csvRows.join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = filename;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    // =========================================
    // FETCH REPORTS
    // =========================================

    const fetchReports = async () => {
        try {
            setLoading(true);
            setError("");

            const token = getToken();

            if (!token) {
                setError(
                    "Authentication token not found. Please login again."
                );
                return;
            }

            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            };

            const [
                laptopResponse,
                studentResponse,
                overdueResponse,
            ] = await Promise.all([
                fetch(
                    `${API_BASE_URL}/api/admin/reports/laptop-usage`,
                    {
                        headers,
                    }
                ),

                fetch(
                    `${API_BASE_URL}/api/admin/reports/student-usage`,
                    {
                        headers,
                    }
                ),

                fetch(
                    `${API_BASE_URL}/api/admin/reports/overdue`,
                    {
                        headers,
                    }
                ),
            ]);

            // =========================================
            // AUTHORIZATION CHECK
            // =========================================

            if (
                laptopResponse.status === 401 ||
                laptopResponse.status === 403 ||
                studentResponse.status === 401 ||
                studentResponse.status === 403 ||
                overdueResponse.status === 401 ||
                overdueResponse.status === 403
            ) {
                setError(
                    "You are not authorized to view reports."
                );
                return;
            }

            // =========================================
            // RESPONSE CHECK
            // =========================================

            if (!laptopResponse.ok) {
                throw new Error(
                    "Failed to load laptop usage report."
                );
            }

            if (!studentResponse.ok) {
                throw new Error(
                    "Failed to load student usage report."
                );
            }

            if (!overdueResponse.ok) {
                throw new Error(
                    "Failed to load overdue report."
                );
            }

            // =========================================
            // CONVERT TO JSON
            // =========================================

            const laptopData =
                await laptopResponse.json();

            const studentData =
                await studentResponse.json();

            const overdueData =
                await overdueResponse.json();

            // =========================================
            // STORE REPORT DATA
            // =========================================

            setLaptopReport(
                laptopData.report || []
            );

            setStudentReport(
                studentData.report || []
            );

            setOverdueReport(
                overdueData.report || []
            );

        } catch (err) {
            console.error(
                "Reports error:",
                err
            );

            setError(
                err.message ||
                "Failed to load reports."
            );

        } finally {
            setLoading(false);
        }
    };

    // =========================================
    // LOAD REPORTS ON PAGE OPEN
    // =========================================

    useEffect(() => {
        fetchReports();
    }, []);

    // =========================================
    // LOADING SCREEN
    // =========================================

    if (loading) {
        return (
            <div style={styles.page}>

                <AdminSidebar />

                <main style={styles.mainContent}>

                    <div style={styles.loadingBox}>

                        <div style={styles.spinner}></div>

                        <p>
                            Loading reports...
                        </p>

                    </div>

                </main>

            </div>
        );
    }

    // =========================================
    // MAIN REPORT PAGE
    // =========================================

    return (
        <div style={styles.page}>

            {/* =====================================
                COMMON ADMIN SIDEBAR
            ====================================== */}

            <AdminSidebar />


            {/* =====================================
                MAIN CONTENT
            ====================================== */}

            <main style={styles.mainContent}>

                {/* =====================================
                    HEADER
                ====================================== */}

                <div style={styles.header}>

                    <div>

                        <h1 style={styles.title}>
                            Reports
                        </h1>

                        <p style={styles.subtitle}>
                            Library usage and borrowing reports
                        </p>

                    </div>


                    <button
                        style={styles.refreshButton}
                        onClick={fetchReports}
                    >
                        ↻ Refresh Reports
                    </button>

                </div>


                {/* =====================================
                    ERROR MESSAGE
                ====================================== */}

                {error && (
                    <div style={styles.errorBox}>
                        ⚠️ {error}
                    </div>
                )}


                {/* =====================================
                    SUMMARY CARDS
                ====================================== */}

                <div style={styles.cardsContainer}>

                    {/* LAPTOPS */}

                    <div style={styles.card}>

                        <div style={styles.cardIcon}>
                            💻
                        </div>

                        <div>

                            <p style={styles.cardLabel}>
                                Laptops
                            </p>

                            <h2 style={styles.cardNumber}>
                                {laptopReport.length}
                            </h2>

                            <p style={styles.cardText}>
                                In usage report
                            </p>

                        </div>

                    </div>


                    {/* STUDENTS */}

                    <div style={styles.card}>

                        <div style={styles.cardIcon}>
                            👨‍🎓
                        </div>

                        <div>

                            <p style={styles.cardLabel}>
                                Students
                            </p>

                            <h2 style={styles.cardNumber}>
                                {studentReport.length}
                            </h2>

                            <p style={styles.cardText}>
                                Usage records
                            </p>

                        </div>

                    </div>


                    {/* OVERDUE */}

                    <div style={styles.card}>

                        <div style={styles.cardIcon}>
                            ⚠️
                        </div>

                        <div>

                            <p style={styles.cardLabel}>
                                Overdue
                            </p>

                            <h2 style={styles.cardNumber}>
                                {overdueReport.length}
                            </h2>

                            <p style={styles.cardText}>
                                Overdue records
                            </p>

                        </div>

                    </div>

                </div>


                {/* =====================================
                    LAPTOP USAGE REPORT
                ====================================== */}

                <section style={styles.section}>

                    <div style={styles.sectionHeader}>

                        <div>

                            <h2 style={styles.sectionTitle}>
                                💻 Laptop Usage Report
                            </h2>

                            <p style={styles.sectionSubtitle}>
                                Laptop issue and return activity
                            </p>

                        </div>

                        <button
                            style={styles.exportButton}
                            onClick={() =>
                                exportToCSV(
                                    laptopReport,
                                    "laptop-usage-report.csv"
                                )
                            }
                        >
                            📥 Export CSV
                        </button>

                    </div>


                    {laptopReport.length === 0 ? (

                        <div style={styles.emptyBox}>
                            No laptop usage data available.
                        </div>

                    ) : (

                        <div style={styles.tableContainer}>

                            <table style={styles.table}>

                                <thead>

                                    <tr>

                                        <th style={styles.th}>
                                            Laptop Code
                                        </th>

                                        <th style={styles.th}>
                                            Brand
                                        </th>

                                        <th style={styles.th}>
                                            Model
                                        </th>

                                        <th style={styles.th}>
                                            Status
                                        </th>

                                        <th style={styles.th}>
                                            Total Issues
                                        </th>

                                        <th style={styles.th}>
                                            Returns
                                        </th>

                                        <th style={styles.th}>
                                            Active
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {laptopReport.map(
                                        (laptop) => (

                                            <tr
                                                key={
                                                    laptop.laptop_id
                                                }
                                            >

                                                <td style={styles.td}>
                                                    <strong>
                                                        {
                                                            laptop.laptop_code
                                                        }
                                                    </strong>
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        laptop.brand
                                                    }
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        laptop.model
                                                    }
                                                </td>

                                                <td style={styles.td}>

                                                    <span
                                                        style={getStatusStyle(
                                                            laptop.current_status
                                                        )}
                                                    >
                                                        {
                                                            laptop.current_status
                                                        }
                                                    </span>

                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        laptop.total_issues
                                                    }
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        laptop.total_returns
                                                    }
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        laptop.currently_active
                                                    }
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>


                {/* =====================================
                    STUDENT USAGE REPORT
                ====================================== */}

                <section style={styles.section}>

                    <div style={styles.sectionHeader}>

                        <div>

                            <h2 style={styles.sectionTitle}>
                                👨‍🎓 Student Usage Report
                            </h2>

                            <p style={styles.sectionSubtitle}>
                                Student borrowing activity
                            </p>

                        </div>

                        <button
                            style={styles.exportButton}
                            onClick={() =>
                                exportToCSV(
                                    studentReport,
                                    "student-usage-report.csv"
                                )
                            }
                        >
                            📥 Export CSV
                        </button>

                    </div>


                    {studentReport.length === 0 ? (

                        <div style={styles.emptyBox}>
                            No student usage data available.
                        </div>

                    ) : (

                        <div style={styles.tableContainer}>

                            <table style={styles.table}>

                                <thead>

                                    <tr>

                                        <th style={styles.th}>
                                            Student ID
                                        </th>

                                        <th style={styles.th}>
                                            Name
                                        </th>

                                        <th style={styles.th}>
                                            Student Number
                                        </th>

                                        <th style={styles.th}>
                                            Department
                                        </th>

                                        <th style={styles.th}>
                                            Total Sessions
                                        </th>

                                        <th style={styles.th}>
                                            Usage Hours
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {studentReport.map(
                                        (student) => (

                                            <tr
                                                key={
                                                    student.student_id
                                                }
                                            >

                                                <td style={styles.td}>
                                                    {
                                                        student.student_id
                                                    }
                                                </td>

                                                <td style={styles.td}>
                                                    <strong>
                                                        {
                                                            student.name
                                                        }
                                                    </strong>
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        student.student_number ||
                                                        "-"
                                                    }
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        student.department ||
                                                        "-"
                                                    }
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        student.total_sessions
                                                    }
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        student.total_usage_hours
                                                    }{" "}
                                                    hrs
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>


                {/* =====================================
                    OVERDUE REPORT
                ====================================== */}

                <section style={styles.section}>

                    <div style={styles.sectionHeader}>

                        <div>

                            <h2 style={styles.sectionTitle}>
                                ⚠️ Overdue Report
                            </h2>

                            <p style={styles.sectionSubtitle}>
                                Currently overdue laptop borrowings
                            </p>

                        </div>

                        <button
                            style={styles.exportButton}
                            onClick={() =>
                                exportToCSV(
                                    overdueReport,
                                    "overdue-report.csv"
                                )
                            }
                        >
                            📥 Export CSV
                        </button>

                    </div>


                    {overdueReport.length === 0 ? (

                        <div style={styles.successBox}>
                            ✅ No overdue laptops.
                        </div>

                    ) : (

                        <div style={styles.tableContainer}>

                            <table style={styles.table}>

                                <thead>

                                    <tr>

                                        <th style={styles.th}>
                                            Student
                                        </th>

                                        <th style={styles.th}>
                                            Student Number
                                        </th>

                                        <th style={styles.th}>
                                            Laptop Code
                                        </th>

                                        <th style={styles.th}>
                                            Brand
                                        </th>

                                        <th style={styles.th}>
                                            Model
                                        </th>

                                        <th style={styles.th}>
                                            Return Deadline
                                        </th>

                                        <th style={styles.th}>
                                            Hours Overdue
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {overdueReport.map(
                                        (item) => (

                                            <tr
                                                key={
                                                    item.issue_id
                                                }
                                            >

                                                <td style={styles.td}>
                                                    <strong>
                                                        {
                                                            item.student_name
                                                        }
                                                    </strong>
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        item.student_number
                                                    }
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        item.laptop_code
                                                    }
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        item.brand
                                                    }
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        item.model
                                                    }
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        formatDate(
                                                            item.return_deadline
                                                        )
                                                    }
                                                </td>

                                                <td style={styles.td}>

                                                    <span
                                                        style={
                                                            styles.overdueBadge
                                                        }
                                                    >
                                                        {
                                                            item.hours_overdue
                                                        }{" "}
                                                        hrs
                                                    </span>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </main>

        </div>
    );
}


// =========================================
// FORMAT DATE
// =========================================

function formatDate(dateString) {
    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleString();
}


// =========================================
// STATUS BADGE
// =========================================

function getStatusStyle(status) {
    const normalizedStatus =
        String(status || "").toUpperCase();

    if (normalizedStatus === "AVAILABLE") {
        return {
            ...styles.statusBadge,
            backgroundColor: "#dcfce7",
            color: "#166534",
        };
    }

    if (normalizedStatus === "ISSUED") {
        return {
            ...styles.statusBadge,
            backgroundColor: "#dbeafe",
            color: "#1d4ed8",
        };
    }

    if (normalizedStatus === "MAINTENANCE") {
        return {
            ...styles.statusBadge,
            backgroundColor: "#fef3c7",
            color: "#92400e",
        };
    }

    if (normalizedStatus === "INACTIVE") {
        return {
            ...styles.statusBadge,
            backgroundColor: "#f3f4f6",
            color: "#374151",
        };
    }

    return {
        ...styles.statusBadge,
        backgroundColor: "#f3f4f6",
        color: "#374151",
    };
}


// =========================================
// STYLES
// =========================================

const styles = {

    page: {
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#f3f6fa",
        fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        boxSizing: "border-box",
    },


    // =========================================
    // MAIN CONTENT
    // =========================================

    mainContent: {
        marginLeft: "234px",
        width: "calc(100% - 234px)",
        minHeight: "100vh",
        padding: "28px 38px 50px",
        backgroundColor: "#f3f6fa",
        boxSizing: "border-box",
    },


    // =========================================
    // HEADER
    // =========================================

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "28px",
        gap: "20px",
        flexWrap: "wrap",
    },


    title: {
        margin: 0,
        fontSize: "30px",
        fontWeight: "700",
        color: "#111827",
    },


    subtitle: {
        margin: "6px 0 0",
        color: "#6b7280",
        fontSize: "14px",
    },


    refreshButton: {
        border: "none",
        borderRadius: "8px",
        padding: "11px 18px",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
    },


    // =========================================
    // SUMMARY CARDS
    // =========================================

    cardsContainer: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
        marginBottom: "28px",
    },


    card: {
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.04)",
    },


    cardIcon: {
        width: "50px",
        height: "50px",
        borderRadius: "10px",
        backgroundColor: "#eff6ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        flexShrink: 0,
    },


    cardLabel: {
        margin: 0,
        color: "#6b7280",
        fontSize: "13px",
    },


    cardNumber: {
        margin: "3px 0",
        color: "#111827",
        fontSize: "25px",
    },


    cardText: {
        margin: 0,
        color: "#9ca3af",
        fontSize: "12px",
    },


    // =========================================
    // SECTION
    // =========================================

    section: {
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        marginBottom: "24px",
        overflow: "hidden",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.03)",
    },


    sectionHeader: {
        padding: "20px 22px",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        flexWrap: "wrap",
    },


    sectionTitle: {
        margin: 0,
        fontSize: "19px",
        fontWeight: "700",
        color: "#111827",
    },


    sectionSubtitle: {
        margin: "5px 0 0",
        color: "#6b7280",
        fontSize: "13px",
    },


    exportButton: {
        border: "none",
        borderRadius: "8px",
        padding: "10px 15px",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        whiteSpace: "nowrap",
    },


    // =========================================
    // TABLE
    // =========================================

    tableContainer: {
        width: "100%",
        overflowX: "auto",
    },


    table: {
        width: "100%",
        borderCollapse: "collapse",
        minWidth: "850px",
    },


    th: {
        textAlign: "left",
        padding: "13px 16px",
        backgroundColor: "#f9fafb",
        color: "#4b5563",
        fontSize: "12px",
        fontWeight: "700",
        borderBottom:
            "1px solid #e5e7eb",
        whiteSpace: "nowrap",
    },


    td: {
        padding: "14px 16px",
        color: "#374151",
        fontSize: "13px",
        borderBottom:
            "1px solid #f1f5f9",
        whiteSpace: "nowrap",
    },


    // =========================================
    // STATUS
    // =========================================

    statusBadge: {
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: "700",
    },


    overdueBadge: {
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: "999px",
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
        fontSize: "11px",
        fontWeight: "700",
    },


    // =========================================
    // EMPTY / SUCCESS / ERROR
    // =========================================

    emptyBox: {
        padding: "35px",
        textAlign: "center",
        color: "#6b7280",
        fontSize: "14px",
    },


    successBox: {
        padding: "20px",
        margin: "18px",
        borderRadius: "8px",
        backgroundColor: "#ecfdf5",
        color: "#047857",
        fontSize: "14px",
        fontWeight: "600",
    },


    errorBox: {
        marginBottom: "20px",
        padding: "14px 16px",
        borderRadius: "8px",
        backgroundColor: "#fef2f2",
        color: "#b91c1c",
        border: "1px solid #fecaca",
        fontSize: "14px",
    },


    // =========================================
    // LOADING
    // =========================================

    loadingBox: {
        minHeight: "400px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#6b7280",
    },


    spinner: {
        width: "30px",
        height: "30px",
        border: "3px solid #e5e7eb",
        borderTop:
            "3px solid #2563eb",
        borderRadius: "50%",
        marginBottom: "12px",
    },
};


export default Reports;