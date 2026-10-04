import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";

function Borrowings() {
    const navigate = useNavigate();

    const [borrowings, setBorrowings] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");

    // =====================================================
    // LOAD BORROWINGS
    // =====================================================

    const loadBorrowings = async () => {
        try {
            setLoading(true);

            const response = await fetch(
                "http://127.0.0.1:3000/api/admin/borrowings",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (response.ok) {
                setBorrowings(data.borrowings || []);
            } else {
                alert(
                    data.error ||
                    data.message ||
                    "Failed to load borrowings"
                );
            }

        } catch (error) {
            console.error(
                "Borrowings loading error:",
                error
            );

            alert("Unable to connect to backend");

        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // PAGE LOAD
    // =====================================================

    useEffect(() => {
        if (!token) {
            navigate("/");
            return;
        }

        loadBorrowings();
    }, []);

    // =====================================================
    // RETURN LAPTOP
    // =====================================================

    const handleReturn = async (issueId) => {

        const condition = prompt(
            "Enter laptop condition after return:\n\nExample:\nGood\nDamaged\nNeeds Repair"
        );

        if (condition === null) {
            return;
        }

        const remarks = prompt(
            "Enter remarks (optional):"
        );

        try {

            const response = await fetch(
                `http://127.0.0.1:3000/api/admin/borrowings/${issueId}/return`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        condition_after: condition,
                        remarks: remarks || "",
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {

                alert(
                    "Laptop returned successfully!"
                );

                loadBorrowings();

            } else {

                alert(
                    data.error ||
                    data.message ||
                    "Return failed"
                );
            }

        } catch (error) {

            console.error(
                "Return laptop error:",
                error
            );

            alert(
                "Unable to connect to backend"
            );
        }
    };

    // =====================================================
    // COUNTS
    // =====================================================

    const activeCount = borrowings.filter(
        (item) => item.status === "ACTIVE"
    ).length;

    const overdueCount = borrowings.filter(
        (item) => item.status === "OVERDUE"
    ).length;

    // =====================================================
    // LOGOUT
    // =====================================================

    const logout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");

        navigate("/");
    };

    // =====================================================
    // LOADING SCREEN
    // =====================================================

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    width: "100%",
                    background: "#f3f6fa",
                    fontFamily: "Arial, sans-serif",
                }}
            >

                {/* COMMON SIDEBAR */}

                <AdminSidebar />


                {/* MAIN CONTENT */}

                <main
                    style={{
                        marginLeft: "234px",
                        width: "calc(100% - 234px)",
                        minHeight: "100vh",
                        padding: "34px 38px",
                        boxSizing: "border-box",
                    }}
                >

                    <h2
                        style={{
                            color: "#172033",
                            fontSize: "24px",
                            margin: 0,
                        }}
                    >
                        Loading Borrowings...
                    </h2>

                </main>

            </div>
        );
    }

    // =====================================================
    // MAIN UI
    // =====================================================

    return (
        <div
            style={{
                minHeight: "100vh",
                width: "100%",
                background: "#f3f6fa",
                fontFamily: "Arial, sans-serif",
            }}
        >

            {/* =================================================
                COMMON ADMIN SIDEBAR
            ================================================= */}

            <AdminSidebar />


            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main
                style={{
                    marginLeft: "234px",
                    width: "calc(100% - 234px)",
                    minHeight: "100vh",
                    background: "#f3f6fa",
                    padding: "34px 38px",
                    boxSizing: "border-box",
                }}
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <header
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "28px",
                    }}
                >

                    <div>

                        <h1
                            style={{
                                margin: 0,
                                color: "#172033",
                                fontSize: "36px",
                                fontWeight: "700",
                                lineHeight: "1.2",
                            }}
                        >
                            Borrowings
                        </h1>

                        <p
                            style={{
                                margin: "8px 0 0",
                                color: "#64748b",
                                fontSize: "16px",
                            }}
                        >
                            Manage issued laptops, return
                            deadlines and laptop returns.
                        </p>

                    </div>


                    {/* LOGOUT */}

                    <button
                        type="button"
                        style={{
                            background: "#ef2b2d",
                            color: "white",
                            border: "none",
                            padding: "10px 22px",
                            borderRadius: "7px",
                            fontSize: "14px",
                            fontWeight: "700",
                            cursor: "pointer",
                        }}
                        onClick={logout}
                    >
                        Logout
                    </button>

                </header>


                {/* =================================================
                    SUMMARY CARDS
                ================================================= */}

                <section
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(3, minmax(0, 1fr))",
                        gap: "18px",
                        marginBottom: "30px",
                    }}
                >

                    {/* TOTAL */}

                    <div
                        style={{
                            ...cardStyle,
                            minHeight: "135px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                        }}
                    >

                        <div
                            style={{
                                width: "55px",
                                height: "55px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#eef2ff",
                                borderRadius: "10px",
                                fontSize: "28px",
                                marginBottom: "10px",
                            }}
                        >
                            📦
                        </div>

                        <div
                            style={{
                                fontSize: "28px",
                                fontWeight: "700",
                                color: "#172033",
                            }}
                        >
                            {borrowings.length}
                        </div>

                        <div
                            style={{
                                marginTop: "3px",
                                fontSize: "16px",
                                color: "#64748b",
                            }}
                        >
                            Total Borrowings
                        </div>

                    </div>


                    {/* ACTIVE */}

                    <div
                        style={{
                            ...cardStyle,
                            minHeight: "135px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                        }}
                    >

                        <div
                            style={{
                                width: "55px",
                                height: "55px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#eef2ff",
                                borderRadius: "10px",
                                fontSize: "28px",
                                marginBottom: "10px",
                            }}
                        >
                            💻
                        </div>

                        <div
                            style={{
                                fontSize: "28px",
                                fontWeight: "700",
                                color: "#172033",
                            }}
                        >
                            {activeCount}
                        </div>

                        <div
                            style={{
                                marginTop: "3px",
                                fontSize: "16px",
                                color: "#64748b",
                            }}
                        >
                            Active
                        </div>

                    </div>


                    {/* OVERDUE */}

                    <div
                        style={{
                            ...cardStyle,
                            minHeight: "135px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                        }}
                    >

                        <div
                            style={{
                                width: "55px",
                                height: "55px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#eef2ff",
                                borderRadius: "10px",
                                fontSize: "28px",
                                marginBottom: "10px",
                            }}
                        >
                            ⚠️
                        </div>

                        <div
                            style={{
                                fontSize: "28px",
                                fontWeight: "700",
                                color: "#172033",
                            }}
                        >
                            {overdueCount}
                        </div>

                        <div
                            style={{
                                marginTop: "3px",
                                fontSize: "16px",
                                color: "#64748b",
                            }}
                        >
                            Overdue
                        </div>

                    </div>

                </section>


                {/* =================================================
                    ISSUED LAPTOPS
                ================================================= */}

                <section
                    style={{
                        ...cardStyle,
                        width: "100%",
                    }}
                >

                    <div
                        style={{
                            textAlign: "center",
                            marginBottom: "22px",
                        }}
                    >

                        <h2
                            style={cardTitleStyle}
                        >
                            Issued Laptops
                        </h2>

                        <p
                            style={{
                                margin: "6px 0 0",
                                color: "#64748b",
                                fontSize: "16px",
                            }}
                        >
                            Students currently holding
                            library laptops
                        </p>

                    </div>


                    {/* EMPTY */}

                    {borrowings.length === 0 && (

                        <div
                            style={{
                                textAlign: "center",
                                padding: "50px 20px",
                            }}
                        >

                            <div
                                style={{
                                    fontSize: "45px",
                                    marginBottom: "12px",
                                }}
                            >
                                📦
                            </div>

                            <h3
                                style={{
                                    margin: "0 0 8px",
                                    color: "#172033",
                                    fontSize: "20px",
                                }}
                            >
                                No Active Borrowings
                            </h3>

                            <p
                                style={{
                                    margin: 0,
                                    color: "#64748b",
                                    fontSize: "15px",
                                }}
                            >
                                There are currently no
                                laptops issued to students.
                            </p>

                        </div>

                    )}


                    {/* TABLE */}

                    {borrowings.length > 0 && (

                        <div
                            style={{
                                width: "100%",
                                overflowX: "auto",
                            }}
                        >

                            <table
                                style={{
                                    width: "100%",
                                    minWidth: "1050px",
                                    borderCollapse: "collapse",
                                }}
                            >

                                <thead>

                                    <tr>

                                        <th
                                            style={
                                                tableHeaderStyle
                                            }
                                        >
                                            Issue ID
                                        </th>

                                        <th
                                            style={
                                                tableHeaderStyle
                                            }
                                        >
                                            Student
                                        </th>

                                        <th
                                            style={
                                                tableHeaderStyle
                                            }
                                        >
                                            Laptop
                                        </th>

                                        <th
                                            style={
                                                tableHeaderStyle
                                            }
                                        >
                                            Issue Date
                                        </th>

                                        <th
                                            style={
                                                tableHeaderStyle
                                            }
                                        >
                                            Return Deadline
                                        </th>

                                        <th
                                            style={
                                                tableHeaderStyle
                                            }
                                        >
                                            Status
                                        </th>

                                        <th
                                            style={
                                                tableHeaderStyle
                                            }
                                        >
                                            Action
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {borrowings.map(
                                        (item) => (

                                            <tr
                                                key={
                                                    item.issue_id
                                                }
                                            >

                                                {/* ISSUE ID */}

                                                <td
                                                    style={
                                                        tableCellStyle
                                                    }
                                                >
                                                    <strong
                                                        style={{
                                                            color:
                                                                "#172033",
                                                        }}
                                                    >
                                                        #
                                                        {
                                                            item.issue_id
                                                        }
                                                    </strong>
                                                </td>


                                                {/* STUDENT */}

                                                <td
                                                    style={
                                                        tableCellStyle
                                                    }
                                                >

                                                    <div
                                                        style={{
                                                            display:
                                                                "flex",
                                                            flexDirection:
                                                                "column",
                                                            gap: "4px",
                                                        }}
                                                    >

                                                        <strong
                                                            style={{
                                                                color:
                                                                    "#172033",
                                                                fontSize:
                                                                    "14px",
                                                            }}
                                                        >
                                                            {
                                                                item.student_name
                                                            }
                                                        </strong>

                                                        <span
                                                            style={{
                                                                color:
                                                                    "#64748b",
                                                                fontSize:
                                                                    "12px",
                                                            }}
                                                        >
                                                            {
                                                                item.student_number
                                                            }
                                                        </span>

                                                    </div>

                                                </td>


                                                {/* LAPTOP */}

                                                <td
                                                    style={
                                                        tableCellStyle
                                                    }
                                                >

                                                    <div
                                                        style={{
                                                            display:
                                                                "flex",
                                                            flexDirection:
                                                                "column",
                                                            gap: "4px",
                                                        }}
                                                    >

                                                        <strong
                                                            style={{
                                                                color:
                                                                    "#172033",
                                                                fontSize:
                                                                    "14px",
                                                            }}
                                                        >
                                                            {
                                                                item.laptop_code
                                                            }
                                                        </strong>

                                                        <span
                                                            style={{
                                                                color:
                                                                    "#64748b",
                                                                fontSize:
                                                                    "12px",
                                                            }}
                                                        >
                                                            {
                                                                item.brand
                                                            }{" "}
                                                            {
                                                                item.model
                                                            }
                                                        </span>

                                                    </div>

                                                </td>


                                                {/* ISSUE DATE */}

                                                <td
                                                    style={
                                                        tableCellStyle
                                                    }
                                                >
                                                    {
                                                        item.issue_datetime
                                                            ? new Date(
                                                                item.issue_datetime
                                                            ).toLocaleString(
                                                                "en-IN"
                                                            )
                                                            : "N/A"
                                                    }
                                                </td>


                                                {/* RETURN DEADLINE */}

                                                <td
                                                    style={
                                                        tableCellStyle
                                                    }
                                                >
                                                    {
                                                        item.return_deadline
                                                            ? new Date(
                                                                item.return_deadline
                                                            ).toLocaleString(
                                                                "en-IN"
                                                            )
                                                            : "N/A"
                                                    }
                                                </td>


                                                {/* STATUS */}

                                                <td
                                                    style={
                                                        tableCellStyle
                                                    }
                                                >

                                                    <span
                                                        style={{
                                                            display:
                                                                "inline-block",
                                                            padding:
                                                                "6px 11px",
                                                            borderRadius:
                                                                "20px",
                                                            fontSize:
                                                                "12px",
                                                            fontWeight:
                                                                "700",
                                                            background:
                                                                item.status ===
                                                                "OVERDUE"
                                                                    ? "#fee2e2"
                                                                    : "#dcfce7",
                                                            color:
                                                                item.status ===
                                                                "OVERDUE"
                                                                    ? "#991b1b"
                                                                    : "#166534",
                                                        }}
                                                    >
                                                        {
                                                            item.status
                                                        }
                                                    </span>

                                                </td>


                                                {/* ACTION */}

                                                <td
                                                    style={
                                                        tableCellStyle
                                                    }
                                                >

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleReturn(
                                                                item.issue_id
                                                            )
                                                        }
                                                        style={{
                                                            border:
                                                                "none",
                                                            background:
                                                                "#2563eb",
                                                            color:
                                                                "white",
                                                            padding:
                                                                "9px 14px",
                                                            borderRadius:
                                                                "7px",
                                                            cursor:
                                                                "pointer",
                                                            fontSize:
                                                                "13px",
                                                            fontWeight:
                                                                "700",
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                    >
                                                        Return Laptop
                                                    </button>

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


// =========================================================
// COMMON CARD STYLE
// =========================================================

const cardStyle = {
    background: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow:
        "0 2px 10px rgba(15, 23, 42, 0.07)",
    boxSizing: "border-box",
};


// =========================================================
// CARD TITLE
// =========================================================

const cardTitleStyle = {
    margin: 0,
    color: "#172033",
    fontSize: "22px",
    fontWeight: "700",
};


// =========================================================
// TABLE HEADER
// =========================================================

const tableHeaderStyle = {
    padding: "14px 12px",
    textAlign: "left",
    background: "#f1f5f9",
    color: "#172033",
    fontSize: "14px",
    fontWeight: "700",
    borderBottom: "1px solid #cbd5e1",
    whiteSpace: "nowrap",
};


// =========================================================
// TABLE CELL
// =========================================================

const tableCellStyle = {
    padding: "14px 12px",
    color: "#334155",
    fontSize: "14px",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
};


export default Borrowings;