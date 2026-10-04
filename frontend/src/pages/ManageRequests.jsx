import { useEffect, useState } from "react";

function ManageRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");

    // ===============================
    // LOAD REQUESTS
    // ===============================

    const loadRequests = async () => {
        try {
            setLoading(true);

            const response = await fetch(
                "http://127.0.0.1:3000/api/admin/requests",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setRequests(data.requests || []);
            } else {
                console.error(data.error);
                setRequests([]);
            }

        } catch (error) {
            console.error("Request loading error:", error);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };


    // ===============================
    // PAGE LOAD
    // ===============================

    useEffect(() => {
        if (!token) {
            window.location.href = "/";
            return;
        }

        loadRequests();
    }, []);


    // ===============================
    // APPROVE REQUEST
    // ===============================

    const handleApprove = async (requestId) => {

        const confirmApprove = window.confirm(
            "Are you sure you want to approve this laptop request?"
        );

        if (!confirmApprove) {
            return;
        }

        try {

            const response = await fetch(
                `http://127.0.0.1:3000/api/admin/requests/${requestId}/approve`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(
                    data.error ||
                    "Failed to approve request"
                );

                return;
            }

            alert("Request approved successfully");

            loadRequests();

        } catch (error) {

            console.error(
                "Approve request error:",
                error
            );

            alert("Cannot connect to server");
        }
    };

    // ===============================
// REJECT REQUEST
// ===============================

const handleReject = async (requestId) => {

    const confirmReject = window.confirm(
        "Are you sure you want to reject this laptop request?"
    );

    if (!confirmReject) {
        return;
    }

    try {

        const response = await fetch(
            `http://127.0.0.1:3000/api/admin/requests/${requestId}/reject`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(
                data.error ||
                "Failed to reject request"
            );

            return;
        }

        alert("Request rejected successfully");

        loadRequests();

    } catch (error) {

        console.error(
            "Reject request error:",
            error
        );

        alert("Cannot connect to server");
    }
};
    // ===============================
    // LOGOUT
    // ===============================

    const logout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("role");

        window.location.href = "/";
    };


    // ===============================
    // SIDEBAR NAVIGATION
    // ===============================

    const goTo = (path) => {
        window.location.href = path;
    };


    // ===============================
    // PAGE
    // ===============================

    return (

        <div className="request-page">

            {/* =================================
                SIDEBAR
            ================================= */}

            <aside className="request-sidebar">

                <div className="sidebar-logo">
                    💻 Laptop Library
                </div>


                <div
                    className="sidebar-item"
                    onClick={() => goTo("/admin")}
                >
                    📊
                    <span>Dashboard</span>
                </div>


                <div
                    className="sidebar-item"
                    onClick={() => goTo("/admin/laptops")}
                >
                    💻
                    <span>Laptops</span>
                </div>


                <div
                    className="sidebar-item"
                    onClick={() => goTo("/admin/students")}
                >
                    👨‍🎓
                    <span>Students</span>
                </div>


                <div
                    className="sidebar-item active"
                >
                    📋
                    <span>Requests</span>
                </div>


                <div
                    className="sidebar-item"
                    onClick={() => goTo("/admin/borrowings")}
                >
                    📚
                    <span>Borrowings</span>
                </div>


                <div
                    className="sidebar-item"
                    onClick={() => goTo("/admin/maintenance")}
                >
                    🔧
                    <span>Maintenance</span>
                </div>

            </aside>


            {/* =================================
                MAIN CONTENT
            ================================= */}

            <main className="request-main">


                {/* =================================
                    HEADER
                ================================= */}

                <header className="request-header">

                    <div>

                        <h1>
                            Manage Laptop Requests
                        </h1>

                        <p>
                            Review and manage student laptop requests.
                        </p>

                    </div>


                    <button
                        className="logout-button"
                        onClick={logout}
                    >
                        Logout
                    </button>

                </header>


                {/* =================================
                    REQUEST CARD
                ================================= */}

                <section className="request-card">

                    <div className="request-card-header">

                        <div>

                            <h2>
                                All Laptop Requests
                            </h2>

                            <p>
                                View and process laptop borrowing requests.
                            </p>

                        </div>


                        <div className="request-count">

                            {requests.length} Request
                            {requests.length !== 1 ? "s" : ""}

                        </div>

                    </div>


                    {/* =================================
                        LOADING
                    ================================= */}

                    {loading && (

                        <div className="message-box">

                            <div className="loading-spinner">
                                ⏳
                            </div>

                            <p>
                                Loading requests...
                            </p>

                        </div>

                    )}


                    {/* =================================
                        NO REQUESTS
                    ================================= */}

                    {!loading && requests.length === 0 && (

                        <div className="message-box">

                            <div className="empty-icon">
                                📋
                            </div>

                            <h3>
                                No laptop requests found
                            </h3>

                            <p>
                                There are currently no student laptop requests.
                            </p>

                        </div>

                    )}


                    {/* =================================
                        REQUEST TABLE
                    ================================= */}

                    {!loading && requests.length > 0 && (

                        <div className="table-container">

                            <table className="request-table">

                                <thead>

                                    <tr>

                                        <th>
                                            Request ID
                                        </th>

                                        <th>
                                            Student
                                        </th>

                                        <th>
                                            Student Number
                                        </th>

                                        <th>
                                            Laptop
                                        </th>

                                        <th>
                                            Requested Date
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Actions
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {requests.map((request) => (

                                        <tr
                                            key={request.request_id}
                                        >

                                            {/* REQUEST ID */}

                                            <td data-label="Request ID">

                                                <span className="request-id">
                                                    #{request.request_id}
                                                </span>

                                            </td>


                                            {/* STUDENT */}

                                            <td data-label="Student">

                                                <div className="student-name">

                                                    {request.student_name ||
                                                        request.name ||
                                                        "Unknown"}

                                                </div>

                                            </td>


                                            {/* STUDENT NUMBER */}

                                            <td data-label="Student Number">

                                                {request.student_number || "-"}

                                            </td>


                                            {/* LAPTOP */}

                                            <td data-label="Laptop">

                                                <span className="laptop-code">

                                                    {request.laptop_code ||
                                                        "Unknown"}

                                                </span>

                                            </td>


                                            {/* DATE */}

                                            <td data-label="Requested Date">

                                                {request.request_datetime
                                                    ? new Date(
                                                        request.request_datetime
                                                    ).toLocaleString()
                                                    : "-"}

                                            </td>


                                            {/* STATUS */}

                                            <td data-label="Status">

                                                <span
                                                    className={
                                                        request.status ===
                                                        "APPROVED"
                                                            ? "status-badge approved"
                                                            : request.status ===
                                                              "PENDING"
                                                            ? "status-badge pending"
                                                            : "status-badge rejected"
                                                    }
                                                >

                                                    {request.status}

                                                </span>

                                            </td>


                                            {/* ACTIONS */}

                                            <td data-label="Actions">

                                               {request.status === "PENDING" && (

    <div className="action-buttons">

        <button
            className="approve-button"
            onClick={() =>
                handleApprove(
                    request.request_id
                )
            }
        >
            ✓ Approve
        </button>

        <button
            className="reject-button"
            onClick={() =>
                handleReject(
                    request.request_id
                )
            }
        >
            ✕ Reject
        </button>

    </div>

)}

                                                {request.status ===
                                                    "APPROVED" && (

                                                    <span className="approved-text">
                                                        ✓ Approved
                                                    </span>

                                                )}


                                                {request.status ===
                                                    "REJECTED" && (

                                                    <span className="rejected-text">
                                                        ✕ Rejected
                                                    </span>

                                                )}

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </main>


            {/* =================================
                PAGE CSS
            ================================= */}

            <style>{`

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                }

                .request-page {
                    min-height: 100vh;
                    background: #f4f6f8;
                    font-family: Arial, sans-serif;
                    color: #1f2937;
                }


                /* ============================
                   SIDEBAR
                ============================ */

                .request-sidebar {
                    position: fixed;
                    left: 0;
                    top: 0;
                    width: 230px;
                    height: 100vh;

                    background: #1f2937;
                    color: white;

                    padding: 25px 15px;

                    z-index: 100;
                }


                .sidebar-logo {
                    font-size: 20px;
                    font-weight: bold;
                    text-align: center;

                    margin-bottom: 30px;
                    white-space: nowrap;
                }


                .sidebar-item {
                    display: flex;
                    align-items: center;

                    gap: 12px;

                    padding: 13px 15px;

                    margin: 8px 0;

                    border-radius: 7px;

                    cursor: pointer;

                    font-size: 16px;

                    transition:
                        background 0.2s,
                        transform 0.2s;
                }


                .sidebar-item:hover {
                    background: #374151;
                }


                .sidebar-item.active {
                    background: #2563eb;
                }


                .sidebar-item:hover {
                    transform: translateX(2px);
                }


                /* ============================
                   MAIN
                ============================ */

                .request-main {
                    margin-left: 230px;

                    width: calc(100% - 230px);

                    min-height: 100vh;

                    padding: 35px;
                }


                /* ============================
                   HEADER
                ============================ */

                .request-header {
                    display: flex;

                    justify-content: space-between;

                    align-items: center;

                    gap: 20px;

                    margin-bottom: 30px;
                }


                .request-header h1 {
                    margin: 0 0 8px 0;

                    font-size: 34px;

                    color: #1f2937;
                }


                .request-header p {
                    margin: 0;

                    color: #6b7280;

                    font-size: 16px;
                }


                .logout-button {
                    background: #dc2626;

                    color: white;

                    border: none;

                    padding: 11px 20px;

                    border-radius: 6px;

                    cursor: pointer;

                    font-size: 14px;

                    font-weight: bold;

                    white-space: nowrap;
                }


                .logout-button:hover {
                    background: #b91c1c;
                }


                /* ============================
                   CARD
                ============================ */

                .request-card {
                    background: white;

                    border-radius: 12px;

                    padding: 25px;

                    box-shadow:
                        0 3px 12px rgba(0, 0, 0, 0.08);

                    width: 100%;
                }


                .request-card-header {
                    display: flex;

                    justify-content: space-between;

                    align-items: center;

                    gap: 20px;

                    margin-bottom: 20px;
                }


                .request-card-header h2 {
                    margin: 0 0 6px 0;

                    font-size: 22px;

                    color: #1f2937;
                }


                .request-card-header p {
                    margin: 0;

                    color: #6b7280;

                    font-size: 14px;
                }


                .request-count {
                    background: #eff6ff;

                    color: #2563eb;

                    padding: 8px 14px;

                    border-radius: 20px;

                    font-size: 13px;

                    font-weight: bold;

                    white-space: nowrap;
                }


                /* ============================
                   TABLE
                ============================ */

                .table-container {
                    width: 100%;

                    overflow-x: auto;

                    -webkit-overflow-scrolling: touch;
                }


                .request-table {
                    width: 100%;

                    border-collapse: collapse;

                    table-layout: fixed;
                }


                .request-table th {
                    background: #f3f4f6;

                    color: #374151;

                    font-size: 14px;

                    font-weight: bold;

                    padding: 14px 10px;

                    text-align: left;

                    border-bottom: 2px solid #e5e7eb;

                    word-break: normal;
                }


                .request-table td {
                    padding: 15px 10px;

                    border-bottom: 1px solid #e5e7eb;

                    color: #4b5563;

                    font-size: 14px;

                    vertical-align: middle;

                    overflow-wrap: anywhere;
                }


                .request-table tbody tr:hover {
                    background: #f9fafb;
                }


                /* COLUMN WIDTHS */

                .request-table th:nth-child(1),
                .request-table td:nth-child(1) {
                    width: 9%;
                }


                .request-table th:nth-child(2),
                .request-table td:nth-child(2) {
                    width: 16%;
                }


                .request-table th:nth-child(3),
                .request-table td:nth-child(3) {
                    width: 15%;
                }


                .request-table th:nth-child(4),
                .request-table td:nth-child(4) {
                    width: 11%;
                }


                .request-table th:nth-child(5),
                .request-table td:nth-child(5) {
                    width: 19%;
                }


                .request-table th:nth-child(6),
                .request-table td:nth-child(6) {
                    width: 13%;
                }


                .request-table th:nth-child(7),
                .request-table td:nth-child(7) {
                    width: 17%;
                }


                .request-id {
                    font-weight: bold;

                    color: #374151;
                }


                .student-name {
                    font-weight: 600;

                    color: #1f2937;
                }


                .laptop-code {
                    font-weight: bold;

                    color: #2563eb;
                }


                /* ============================
                   STATUS
                ============================ */

                .status-badge {
                    display: inline-block;

                    padding: 6px 10px;

                    border-radius: 20px;

                    font-size: 11px;

                    font-weight: bold;

                    white-space: nowrap;
                }


                .status-badge.approved {
                    background: #dcfce7;

                    color: #166534;
                }


                .status-badge.pending {
                    background: #fef3c7;

                    color: #92400e;
                }


                .status-badge.rejected {
                    background: #fee2e2;

                    color: #991b1b;
                }

                
                /* ============================
                   BUTTONS
                ============================ */

                .approve-button {
                    background: #16a34a;

                    color: white;

                    border: none;

                    padding: 8px 13px;

                    border-radius: 6px;

                    cursor: pointer;

                    font-size: 13px;

                    font-weight: bold;

                    white-space: nowrap;
                }


                .approve-button:hover {
                    background: #15803d;
                }


                .approved-text {
                    color: #16a34a;

                    font-weight: bold;

                    font-size: 13px;

                    white-space: nowrap;
                }


                .rejected-text {
                    color: #dc2626;

                    font-weight: bold;

                    font-size: 13px;

                    white-space: nowrap;
                }


                /* ============================
                   LOADING / EMPTY
                ============================ */

                .message-box {
                    text-align: center;

                    padding: 50px 20px;

                    color: #6b7280;
                }


                .loading-spinner {
                    font-size: 30px;

                    margin-bottom: 10px;
                }


                .empty-icon {
                    font-size: 40px;

                    margin-bottom: 10px;
                }


                .message-box h3 {
                    margin: 5px 0;

                    color: #374151;
                }


                .message-box p {
                    margin: 5px 0;

                    color: #6b7280;
                }


                /* ============================
                   TABLET
                ============================ */

                @media (max-width: 1100px) {

                    .request-main {
                        padding: 25px;
                    }


                    .request-header h1 {
                        font-size: 30px;
                    }


                    .request-table th,
                    .request-table td {
                        padding: 12px 8px;

                        font-size: 13px;
                    }

                }


                /* ============================
                   MOBILE
                ============================ */

                @media (max-width: 800px) {

                    .request-sidebar {
                        position: relative;

                        width: 100%;

                        height: auto;

                        padding: 15px;
                    }


                    .sidebar-logo {
                        margin-bottom: 15px;
                    }


                    .sidebar-item {
                        display: inline-flex;

                        margin: 4px;

                        padding: 10px 12px;
                    }


                    .request-main {
                        margin-left: 0;

                        width: 100%;

                        padding: 20px;
                    }


                    .request-header {
                        flex-direction: column;

                        align-items: flex-start;
                    }


                    .request-header h1 {
                        font-size: 27px;
                    }


                    .logout-button {
                        align-self: flex-end;
                    }


                    .request-card {
                        padding: 18px;
                    }


                    .request-card-header {
                        flex-direction: column;

                        align-items: flex-start;
                    }


                    .table-container {
                        overflow-x: visible;
                    }


                    .request-table,
                    .request-table thead,
                    .request-table tbody,
                    .request-table th,
                    .request-table td,
                    .request-table tr {
                        display: block;

                        width: 100%;
                    }


                    .request-table thead {
                        display: none;
                    }


                    .request-table tr {
                        margin-bottom: 15px;

                        border: 1px solid #e5e7eb;

                        border-radius: 8px;

                        padding: 10px;

                        background: white;
                    }


                    .request-table td {
                        display: flex;

                        justify-content: space-between;

                        align-items: center;

                        gap: 15px;

                        border-bottom: 1px solid #f0f0f0;

                        padding: 11px 8px;

                        text-align: right;
                    }


                    .request-table td:last-child {
                        border-bottom: none;
                    }


                    .request-table td::before {
                        content: attr(data-label);

                        font-weight: bold;

                        color: #374151;

                        text-align: left;

                        flex-shrink: 0;
                    }


                    .request-table td > * {
                        text-align: right;
                    }

                }

            `}</style>

        </div>
    );
}

export default ManageRequests;