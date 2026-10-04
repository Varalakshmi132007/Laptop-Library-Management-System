import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";

function Maintenance() {
    const navigate = useNavigate();

    const [maintenance, setMaintenance] = useState([]);
    const [laptops, setLaptops] = useState([]);

    const [showForm, setShowForm] = useState(false);

    const [selectedLaptop, setSelectedLaptop] = useState("");
    const [issueDescription, setIssueDescription] = useState("");
    const [remarks, setRemarks] = useState("");

    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("token");

    // =====================================================
    // CHECK LOGIN
    // =====================================================

    useEffect(() => {
        if (!token) {
            navigate("/");
            return;
        }

        loadMaintenance();
        loadLaptops();
    }, []);

    // =====================================================
    // LOAD MAINTENANCE
    // =====================================================

    const loadMaintenance = async () => {
        try {
            const response = await fetch(
                "http://127.0.0.1:3000/api/admin/maintenance",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to load maintenance records"
                );
            }

            const data = await response.json();

            setMaintenance(
                Array.isArray(data) ? data : []
            );

        } catch (error) {
            console.error(
                "Maintenance error:",
                error
            );
        }
    };

    // =====================================================
    // LOAD LAPTOPS
    // =====================================================

    const loadLaptops = async () => {
        try {
            const response = await fetch(
                "http://127.0.0.1:3000/api/laptops",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to load laptops"
                );
            }

            const data = await response.json();

            setLaptops(
                Array.isArray(data) ? data : []
            );

        } catch (error) {
            console.error(
                "Laptop loading error:",
                error
            );
        }
    };

    // =====================================================
    // REPORT MAINTENANCE
    // =====================================================

    const reportMaintenance = async (event) => {
        event.preventDefault();

        if (!selectedLaptop) {
            alert("Please select a laptop.");
            return;
        }

        if (!issueDescription.trim()) {
            alert("Please enter the issue.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "http://127.0.0.1:3000/api/admin/maintenance",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        laptop_id: Number(selectedLaptop),
                        issue_description:
                            issueDescription.trim(),
                        remarks: remarks.trim(),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Failed to report maintenance"
                );
            }

            alert(
                "Maintenance reported successfully."
            );

            setSelectedLaptop("");
            setIssueDescription("");
            setRemarks("");
            setShowForm(false);

            loadMaintenance();
            loadLaptops();

        } catch (error) {
            console.error(error);
            alert(error.message);

        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // START REPAIR
    // =====================================================

    const startRepair = async (maintenanceId) => {
        const confirmRepair = window.confirm(
            "Do you want to start repair?"
        );

        if (!confirmRepair) {
            return;
        }

        try {
            const response = await fetch(
                `http://127.0.0.1:3000/api/admin/maintenance/${maintenanceId}/start`,
                {
                    method: "PUT",

                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Failed to start repair"
                );
            }

            alert("Repair started.");

            loadMaintenance();
            loadLaptops();

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    // =====================================================
    // COMPLETE REPAIR
    // =====================================================

    const completeRepair = async (maintenanceId) => {
        const repairRemarks = window.prompt(
            "Enter repair completion remarks:",
            "Laptop repaired"
        );

        if (repairRemarks === null) {
            return;
        }

        try {
            const response = await fetch(
                `http://127.0.0.1:3000/api/admin/maintenance/${maintenanceId}/complete`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        remarks: repairRemarks,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Failed to complete repair"
                );
            }

            alert("Repair completed.");

            loadMaintenance();
            loadLaptops();

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

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
    // COUNTS
    // =====================================================

    const total = maintenance.length;

    const reported = maintenance.filter(
        (item) => item.status === "REPORTED"
    ).length;

    const inProgress = maintenance.filter(
        (item) => item.status === "IN_PROGRESS"
    ).length;

    const completed = maintenance.filter(
        (item) => item.status === "COMPLETED"
    ).length;

    // =====================================================
    // AVAILABLE LAPTOPS
    // =====================================================

    const availableLaptops = laptops.filter(
        (laptop) =>
            laptop.status === "AVAILABLE"
    );

    // =====================================================
    // DATE FORMAT
    // =====================================================

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleString(
            "en-IN"
        );
    };

    // =====================================================
    // PAGE
    // =====================================================

    return (
        <div className="maintenance-page">

            {/* =================================================
                SHARED ADMIN SIDEBAR
            ================================================= */}

            <AdminSidebar />


            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main className="maintenance-main">

                {/* =================================================
                    HEADER
                ================================================= */}

                <header className="maintenance-header">

                    <div>
                        <h1>
                            Maintenance
                        </h1>

                        <p>
                            Manage laptops that require
                            repair or maintenance.
                        </p>
                    </div>

                    <button
                        className="logout-button"
                        onClick={logout}
                    >
                        Logout
                    </button>

                </header>


                {/* =================================================
                    REPORT BUTTON
                ================================================= */}

                <div className="maintenance-actions">

                    <button
                        className="report-button"
                        onClick={() =>
                            setShowForm(!showForm)
                        }
                    >
                        🔧 + Report Maintenance
                    </button>

                </div>


                {/* =================================================
                    REPORT FORM
                ================================================= */}

                {showForm && (

                    <div className="maintenance-form">

                        <h2>
                            Report Maintenance
                        </h2>

                        <form
                            onSubmit={
                                reportMaintenance
                            }
                        >

                            <label>
                                Select Laptop
                            </label>

                            <select
                                value={
                                    selectedLaptop
                                }
                                onChange={(event) =>
                                    setSelectedLaptop(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="">
                                    Select an available laptop
                                </option>

                                {availableLaptops.map(
                                    (laptop) => (

                                        <option
                                            key={
                                                laptop.laptop_id
                                            }
                                            value={
                                                laptop.laptop_id
                                            }
                                        >
                                            {
                                                laptop.laptop_code
                                            }{" "}
                                            -{" "}
                                            {
                                                laptop.brand
                                            }{" "}
                                            {
                                                laptop.model
                                            }
                                        </option>

                                    )
                                )}

                            </select>


                            <label>
                                Issue Description
                            </label>

                            <input
                                type="text"
                                placeholder="Example: Keyboard not working"
                                value={
                                    issueDescription
                                }
                                onChange={(event) =>
                                    setIssueDescription(
                                        event.target.value
                                    )
                                }
                            />


                            <label>
                                Remarks
                            </label>

                            <textarea
                                rows="3"
                                placeholder="Additional remarks"
                                value={remarks}
                                onChange={(event) =>
                                    setRemarks(
                                        event.target.value
                                    )
                                }
                            />


                            <div className="form-buttons">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() =>
                                        setShowForm(false)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="submit-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Reporting..."
                                        : "Report Maintenance"}
                                </button>

                            </div>

                        </form>

                    </div>

                )}


                {/* =================================================
                    SUMMARY CARDS
                ================================================= */}

                <div className="maintenance-summary">

                    <div className="summary-card">
                        <h3>
                            Total Maintenance
                        </h3>

                        <strong>
                            {total}
                        </strong>
                    </div>


                    <div className="summary-card">
                        <h3>
                            Reported
                        </h3>

                        <strong>
                            {reported}
                        </strong>
                    </div>


                    <div className="summary-card">
                        <h3>
                            In Progress
                        </h3>

                        <strong>
                            {inProgress}
                        </strong>
                    </div>


                    <div className="summary-card">
                        <h3>
                            Completed
                        </h3>

                        <strong>
                            {completed}
                        </strong>
                    </div>

                </div>


                {/* =================================================
                    MAINTENANCE TABLE
                ================================================= */}

                <section className="maintenance-table-card">

                    <h2>
                        Maintenance Records
                    </h2>

                    {maintenance.length === 0 ? (

                        <div className="empty">
                            No maintenance records found.
                        </div>

                    ) : (

                        <div className="table-container">

                            <table>

                                <thead>

                                    <tr>

                                        <th>
                                            ID
                                        </th>

                                        <th>
                                            Laptop
                                        </th>

                                        <th>
                                            Issue
                                        </th>

                                        <th>
                                            Reported Date
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Remarks
                                        </th>

                                        <th>
                                            Actions
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {maintenance.map(
                                        (item) => (

                                            <tr
                                                key={
                                                    item.maintenance_id
                                                }
                                            >

                                                <td>
                                                    #
                                                    {
                                                        item.maintenance_id
                                                    }
                                                </td>


                                                <td>

                                                    <strong>
                                                        {
                                                            item.laptop_code
                                                        }
                                                    </strong>

                                                    <br />

                                                    <small>
                                                        {
                                                            item.brand
                                                        }{" "}
                                                        {
                                                            item.model
                                                        }
                                                    </small>

                                                </td>


                                                <td>
                                                    {
                                                        item.issue_description
                                                    }
                                                </td>


                                                <td>
                                                    {formatDate(
                                                        item.reported_date
                                                    )}
                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            "status " +
                                                            item.status.toLowerCase()
                                                        }
                                                    >
                                                        {
                                                            item.status
                                                        }
                                                    </span>

                                                </td>


                                                <td>
                                                    {
                                                        item.remarks ||
                                                        "-"
                                                    }
                                                </td>


                                                <td>

                                                    {item.status ===
                                                        "REPORTED" && (

                                                        <button
                                                            className="start-button"
                                                            onClick={() =>
                                                                startRepair(
                                                                    item.maintenance_id
                                                                )
                                                            }
                                                        >
                                                            🔧 Start Repair
                                                        </button>

                                                    )}


                                                    {item.status ===
                                                        "IN_PROGRESS" && (

                                                        <button
                                                            className="complete-button"
                                                            onClick={() =>
                                                                completeRepair(
                                                                    item.maintenance_id
                                                                )
                                                            }
                                                        >
                                                            ✓ Complete Repair
                                                        </button>

                                                    )}


                                                    {item.status ===
                                                        "COMPLETED" && (

                                                        <span className="completed">
                                                            ✓ Completed
                                                        </span>

                                                    )}

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


            {/* =================================================
                PAGE CSS
            ================================================= */}

            <style>{`

                * {
                    box-sizing: border-box;
                }

                html,
                body,
                #root {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    min-height: 100%;
                }

                body {
                    font-family: Arial, Helvetica, sans-serif;
                    background: #f3f6fa;
                }


                /* =============================================
                   PAGE
                ============================================= */

                .maintenance-page {
                    width: 100%;
                    min-height: 100vh;
                    background: #f3f6fa;
                }


                /* =============================================
                   MAIN CONTENT

                   IMPORTANT:
                   Shared AdminSidebar = 234px
                ============================================= */

                .maintenance-main {
                    margin-left: 234px;
                    width: calc(100% - 234px);
                    min-height: 100vh;
                    padding: 0 42px 50px;
                    box-sizing: border-box;
                    background: #f3f6fa;
                }


                /* =============================================
                   HEADER
                ============================================= */

                .maintenance-header {
                    min-height: 140px;
                    padding: 40px 0 25px;

                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }


                .maintenance-header h1 {
                    margin: 0 0 10px;
                    font-size: 32px;
                    color: #1f2937;
                }


                .maintenance-header p {
                    margin: 0;
                    color: #64748b;
                    font-size: 16px;
                }


                /* =============================================
                   LOGOUT
                ============================================= */

                .logout-button {
                    border: none;
                    background: #ef4444;
                    color: white;

                    padding: 11px 23px;

                    border-radius: 7px;

                    font-weight: 600;

                    cursor: pointer;
                }

                .logout-button:hover {
                    background: #dc2626;
                }


                /* =============================================
                   REPORT ACTION
                ============================================= */

                .maintenance-actions {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 20px;
                }


                .report-button {
                    border: none;
                    background: #2563eb;
                    color: white;

                    padding: 12px 20px;

                    border-radius: 7px;

                    font-weight: 700;

                    cursor: pointer;
                }


                .report-button:hover {
                    background: #1d4ed8;
                }


                /* =============================================
                   FORM
                ============================================= */

                .maintenance-form {
                    background: white;

                    border-radius: 10px;

                    padding: 25px;

                    margin-bottom: 25px;

                    box-shadow:
                        0 2px 10px rgba(0, 0, 0, 0.06);
                }


                .maintenance-form h2 {
                    margin-top: 0;
                    color: #334155;
                }


                .maintenance-form form {
                    display: flex;
                    flex-direction: column;
                    gap: 9px;
                }


                .maintenance-form label {
                    color: #475569;

                    font-size: 14px;

                    font-weight: 600;

                    margin-top: 8px;
                }


                .maintenance-form input,
                .maintenance-form select,
                .maintenance-form textarea {
                    width: 100%;

                    padding: 12px;

                    border: 1px solid #cbd5e1;

                    border-radius: 6px;

                    font-size: 14px;

                    font-family: inherit;
                }


                .maintenance-form input:focus,
                .maintenance-form select:focus,
                .maintenance-form textarea:focus {
                    outline: none;
                    border-color: #2563eb;
                }


                .form-buttons {
                    display: flex;

                    justify-content: flex-end;

                    gap: 10px;

                    margin-top: 15px;
                }


                .cancel-button,
                .submit-button {
                    border: none;

                    padding: 11px 18px;

                    border-radius: 6px;

                    cursor: pointer;

                    font-weight: 600;
                }


                .cancel-button {
                    background: #e2e8f0;
                    color: #334155;
                }


                .cancel-button:hover {
                    background: #cbd5e1;
                }


                .submit-button {
                    background: #2563eb;
                    color: white;
                }


                .submit-button:hover {
                    background: #1d4ed8;
                }


                .submit-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }


                /* =============================================
                   SUMMARY
                ============================================= */

                .maintenance-summary {
                    display: grid;

                    grid-template-columns:
                        repeat(4, minmax(0, 1fr));

                    gap: 18px;

                    margin-bottom: 28px;
                }


                .summary-card {
                    min-height: 130px;

                    background: white;

                    border-radius: 10px;

                    display: flex;

                    flex-direction: column;

                    align-items: center;

                    justify-content: center;

                    box-shadow:
                        0 2px 10px rgba(0, 0, 0, 0.06);
                }


                .summary-card h3 {
                    margin: 0 0 12px;

                    color: #64748b;

                    font-size: 16px;
                }


                .summary-card strong {
                    font-size: 28px;

                    color: #334155;
                }


                /* =============================================
                   TABLE CARD
                ============================================= */

                .maintenance-table-card {
                    background: white;

                    border-radius: 10px;

                    padding: 25px;

                    box-shadow:
                        0 2px 10px rgba(0, 0, 0, 0.06);
                }


                .maintenance-table-card h2 {
                    text-align: center;

                    color: #334155;

                    margin-top: 0;

                    margin-bottom: 20px;
                }


                .table-container {
                    width: 100%;

                    overflow-x: auto;
                }


                table {
                    width: 100%;

                    min-width: 900px;

                    border-collapse: collapse;
                }


                th {
                    padding: 14px 10px;

                    text-align: left;

                    color: #64748b;

                    border-bottom: 2px solid #e2e8f0;
                }


                td {
                    padding: 15px 10px;

                    border-bottom: 1px solid #e2e8f0;

                    color: #475569;
                }


                td small {
                    color: #94a3b8;
                }


                /* =============================================
                   STATUS
                ============================================= */

                .status {
                    display: inline-block;

                    padding: 6px 10px;

                    border-radius: 20px;

                    font-size: 11px;

                    font-weight: 700;
                }


                .status.reported {
                    background: #fef3c7;

                    color: #92400e;
                }


                .status.in_progress {
                    background: #dbeafe;

                    color: #1d4ed8;
                }


                .status.completed {
                    background: #d1fae5;

                    color: #047857;
                }


                /* =============================================
                   ACTION BUTTONS
                ============================================= */

                .start-button,
                .complete-button {
                    border: none;

                    padding: 9px 12px;

                    border-radius: 6px;

                    cursor: pointer;

                    font-size: 12px;

                    font-weight: 700;
                }


                .start-button {
                    background: #dbeafe;

                    color: #1d4ed8;
                }


                .start-button:hover {
                    background: #bfdbfe;
                }


                .complete-button {
                    background: #d1fae5;

                    color: #047857;
                }


                .complete-button:hover {
                    background: #a7f3d0;
                }


                .completed {
                    color: #059669;

                    font-weight: 700;

                    white-space: nowrap;
                }


                /* =============================================
                   EMPTY
                ============================================= */

                .empty {
                    text-align: center;

                    padding: 50px;

                    color: #64748b;
                }


                /* =============================================
                   RESPONSIVE
                ============================================= */

                @media (min-width: 600px) and (max-width: 1199px) {

                    .maintenance-main {
                        margin-left: 220px;

                        width: calc(100% - 220px);

                        padding-left: 25px;

                        padding-right: 25px;
                    }

                    .maintenance-summary {
                        grid-template-columns:
                            repeat(2, minmax(0, 1fr));
                    }

                }


                @media (max-width: 599px) {

                    .maintenance-main {
                        margin-left: 60px;

                        width: calc(100% - 60px);

                        padding-left: 18px;

                        padding-right: 18px;
                    }

                    .maintenance-header {
                        flex-direction: column;

                        gap: 20px;
                    }

                    .maintenance-summary {
                        grid-template-columns: 1fr;
                    }

                }


                @media (max-width: 399px) {

                    .maintenance-main {
                        margin-left: 56px;

                        width: calc(100% - 56px);

                        padding-left: 15px;

                        padding-right: 15px;
                    }

                }

            `}</style>

        </div>
    );
}

export default Maintenance;