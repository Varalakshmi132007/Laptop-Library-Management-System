import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import "./AdminDashboard.css";

function AdminDashboard() {
    const navigate = useNavigate();

    const [summary, setSummary] = useState({
        total_laptops: 0,
        available_laptops: 0,
        issued_laptops: 0,
        maintenance_laptops: 0
    });

    const [requests, setRequests] = useState([]);

    const [loading, setLoading] = useState(true);

    // =========================================
    // GET TOKEN
    // =========================================

    const token = localStorage.getItem("token");

    // =========================================
    // LOGOUT
    // =========================================

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");

        navigate("/");
    };

    // =========================================
    // FETCH DASHBOARD DATA
    // =========================================

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                if (!token) {
                    navigate("/");
                    return;
                }

                // -------------------------------
                // FETCH LAPTOP SUMMARY
                // -------------------------------

                const summaryResponse = await fetch(
                    "http://127.0.0.1:3000/api/admin/laptops/summary",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (summaryResponse.status === 401 ||
                    summaryResponse.status === 403) {

                    localStorage.removeItem("token");
                    localStorage.removeItem("role");
                    localStorage.removeItem("user");

                    navigate("/");
                    return;
                }

                const summaryData =
                    await summaryResponse.json();

                if (summaryResponse.ok) {
                    setSummary({
                        total_laptops:
                            summaryData.total_laptops || 0,

                        available_laptops:
                            summaryData.available_laptops || 0,

                        issued_laptops:
                            summaryData.issued_laptops || 0,

                        maintenance_laptops:
                            summaryData.maintenance_laptops || 0
                    });
                }

                // -------------------------------
                // FETCH RECENT REQUESTS
                // -------------------------------

                const requestsResponse = await fetch(
                    "http://127.0.0.1:3000/api/admin/requests",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (
                    requestsResponse.status === 401 ||
                    requestsResponse.status === 403
                ) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("role");
                    localStorage.removeItem("user");

                    navigate("/");
                    return;
                }

                const requestsData =
                    await requestsResponse.json();

                if (requestsResponse.ok) {

                    let requestList = [];

                    // Handle different possible backend formats
                    if (Array.isArray(requestsData)) {
                        requestList = requestsData;
                    } else if (
                        Array.isArray(requestsData.requests)
                    ) {
                        requestList = requestsData.requests;
                    } else if (
                        Array.isArray(requestsData.data)
                    ) {
                        requestList = requestsData.data;
                    }

                    // Show latest requests first
                    requestList.sort((a, b) => {
                        return (
                            Number(b.request_id || 0) -
                            Number(a.request_id || 0)
                        );
                    });

                    // Show only latest 8
                    setRequests(
                        requestList.slice(0, 8)
                    );
                }

            } catch (error) {
                console.error(
                    "Dashboard loading error:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();

    }, [navigate, token]);

    // =========================================
    // FORMAT DATE
    // =========================================

    const formatDate = (dateValue) => {

        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleString();
    };

    // =========================================
    // STATUS CLASS
    // =========================================

    const getStatusClass = (status) => {

        const normalizedStatus =
            String(status || "").toUpperCase();

        if (normalizedStatus === "APPROVED") {
            return "dashboard-status dashboard-status-approved";
        }

        if (normalizedStatus === "REJECTED") {
            return "dashboard-status dashboard-status-rejected";
        }

        return "dashboard-status dashboard-status-pending";
    };

    // =========================================
    // LOADING
    // =========================================

    if (loading) {
        return (
            <div className="dashboard-page">

                <AdminSidebar />

                <main className="dashboard-main">

                    <div className="dashboard-loading">
                        Loading dashboard...
                    </div>

                </main>

            </div>
        );
    }

    // =========================================
    // DASHBOARD UI
    // =========================================

    return (
        <div className="dashboard-page">

            {/* SIDEBAR */}

            <AdminSidebar />

            {/* MAIN CONTENT */}

            <main className="dashboard-main">

                {/* =====================================
                    HEADER
                ===================================== */}

                <header className="dashboard-header">

                    <div>

                        <h1>
                            Admin Dashboard
                        </h1>

                        <p>
                            Manage laptops, students and
                            borrowing activities.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="dashboard-logout"
                        onClick={logout}
                    >
                        Logout
                    </button>

                </header>

                {/* =====================================
                    SUMMARY CARDS
                ===================================== */}

                <section className="dashboard-summary-grid">

                    {/* TOTAL LAPTOPS */}

                    <div className="dashboard-summary-card">

                        <h3>
                            Total Laptops
                        </h3>

                        <div className="dashboard-summary-number">
                            {summary.total_laptops}
                        </div>

                    </div>

                    {/* AVAILABLE */}

                    <div className="dashboard-summary-card">

                        <h3>
                            Available
                        </h3>

                        <div className="dashboard-summary-number">
                            {summary.available_laptops}
                        </div>

                    </div>

                    {/* ISSUED */}

                    <div className="dashboard-summary-card">

                        <h3>
                            Issued
                        </h3>

                        <div className="dashboard-summary-number">
                            {summary.issued_laptops}
                        </div>

                    </div>

                    {/* MAINTENANCE */}

                    <div className="dashboard-summary-card">

                        <h3>
                            Maintenance
                        </h3>

                        <div className="dashboard-summary-number">
                            {summary.maintenance_laptops}
                        </div>

                    </div>

                </section>

                {/* =====================================
                    RECENT REQUESTS
                ===================================== */}

                <section className="dashboard-request-section">

                    <h2>
                        Recent Laptop Requests
                    </h2>

                    {requests.length === 0 ? (

                        <div className="dashboard-no-requests">
                            No laptop requests found.
                        </div>

                    ) : (

                        <div className="dashboard-table-wrapper">

                            <table className="dashboard-request-table">

                                <thead>

                                    <tr>

                                        <th>
                                            Request ID
                                        </th>

                                        <th>
                                            Student
                                        </th>

                                        <th>
                                            Laptop
                                        </th>

                                        <th>
                                            Date
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {requests.map(
                                        (request, index) => (

                                            <tr
                                                key={
                                                    request.request_id ||
                                                    index
                                                }
                                            >

                                                {/* REQUEST ID */}

                                                <td>
                                                    #
                                                    {request.request_id ||
                                                        "-"}
                                                </td>

                                                {/* STUDENT */}

                                                <td>
                                                    {request.student_name ||
                                                        request.name ||
                                                        request.student ||
                                                        "-"}
                                                </td>

                                                {/* LAPTOP */}

                                                <td>
                                                    {request.laptop_code ||
                                                        request.code ||
                                                        request.laptop ||
                                                        "-"}
                                                </td>

                                                {/* DATE */}

                                                <td>
                                                    {formatDate(
                                                        request.request_datetime ||
                                                        request.request_date ||
                                                        request.created_at
                                                    )}
                                                </td>

                                                {/* STATUS */}

                                                <td>

                                                    <span
                                                        className={getStatusClass(
                                                            request.status
                                                        )}
                                                    >
                                                        {String(
                                                            request.status ||
                                                                "PENDING"
                                                        ).toUpperCase()}
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

export default AdminDashboard;