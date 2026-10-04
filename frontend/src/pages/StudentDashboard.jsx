import { useEffect, useState } from "react";

function StudentDashboard() {
    const [student, setStudent] = useState(null);
    const [laptops, setLaptops] = useState([]);
    const [currentLaptop, setCurrentLaptop] = useState(null);
    const [history, setHistory] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [laptopLoading, setLaptopLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);

    const [timeRemaining, setTimeRemaining] = useState("");

    const token = localStorage.getItem("token");

    /* =====================================================
       LOGOUT
    ===================================================== */

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");

        window.location.href = "/";
    };

    /* =====================================================
       LOAD STUDENT DETAILS
    ===================================================== */

    const loadStudent = async () => {
        try {
            const response = await fetch(
                "http://127.0.0.1:3000/api/student/dashboard",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(
                    "Student loading error:",
                    data.error
                );
                return;
            }

            setStudent(data.student);

        } catch (error) {
            console.error(
                "Student connection error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       LOAD LAPTOPS
    ===================================================== */

    const loadLaptops = async () => {
        try {
            setLaptopLoading(true);

            const response = await fetch(
                "http://127.0.0.1:3000/api/laptops",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(
                    "Laptop loading error:",
                    data.error
                );

                setLaptops([]);

                return;
            }

            /*
             * Backend returns:
             *
             * {
             *     laptops: [...]
             * }
             */

            setLaptops(data.laptops || []);

        } catch (error) {
            console.error(
                "Laptop connection error:",
                error
            );

            setLaptops([]);

        } finally {
            setLaptopLoading(false);
        }
    };

    /* =====================================================
       LOAD CURRENT LAPTOP
    ===================================================== */

    const loadCurrentLaptop = async () => {
        try {

            const response = await fetch(
                "http://127.0.0.1:3000/api/student/current-laptop",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            /*
             * 404 means student does not currently
             * have a laptop.
             *
             * This is not an error for our dashboard.
             */

            if (response.status === 404) {
                setCurrentLaptop(null);
                return;
            }

            if (!response.ok) {
                console.error(
                    "Current laptop error:",
                    data.error || data.message
                );

                setCurrentLaptop(null);
                return;
            }

            setCurrentLaptop(data.laptop);

        } catch (error) {

            console.error(
                "Current laptop connection error:",
                error
            );

        }
    };

    /* =====================================================
       LOAD BORROWING HISTORY
    ===================================================== */

    const loadHistory = async () => {

        try {

            setHistoryLoading(true);

            const response = await fetch(
                "http://127.0.0.1:3000/api/student/borrowing-history",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {

                console.error(
                    "History loading error:",
                    data.error
                );

                setHistory([]);

                return;
            }

            setHistory(data.history || []);

        } catch (error) {

            console.error(
                "History connection error:",
                error
            );

            setHistory([]);

        } finally {

            setHistoryLoading(false);

        }
    };

    /* =====================================================
       INITIAL LOAD
    ===================================================== */
    const handleRequestLaptop = async (laptopId) => {
    const confirmRequest = window.confirm(
        "Do you want to request this laptop?"
    );

    if (!confirmRequest) {
        return;
    }

    try {
        const response = await fetch(
            "http://127.0.0.1:3000/api/student/request-laptop",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    laptop_id: laptopId
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Failed to request laptop");
            return;
        }

        alert(
    "Laptop request submitted successfully. Please wait for admin approval."
);

setPendingRequests((prev) => [
    ...prev,
    laptopId
]);

loadLaptops();


    } catch (error) {
        console.error("Request laptop error:", error);
        alert("Cannot connect to server");
    }
};
    useEffect(() => {

        if (!token) {
            window.location.href = "/";
            return;
        }

        loadStudent();
        loadLaptops();
        loadCurrentLaptop();
        loadHistory();

    }, []);

    /* =====================================================
       3-DAY COUNTDOWN
    ===================================================== */

    useEffect(() => {

        if (!currentLaptop) {
            setTimeRemaining("");
            return;
        }

        const calculateTime = () => {

            const deadline =
                new Date(
                    currentLaptop.return_deadline
                );

            const now = new Date();

            let difference =
                deadline.getTime() -
                now.getTime();

            /*
             * If deadline has passed
             */

            if (difference <= 0) {

                setTimeRemaining(
                    "OVERDUE"
                );

                return;
            }

            const totalSeconds =
                Math.floor(
                    difference / 1000
                );

            const days =
                Math.floor(
                    totalSeconds /
                    (24 * 60 * 60)
                );

            const hours =
                Math.floor(
                    (totalSeconds %
                        (24 * 60 * 60)) /
                        (60 * 60)
                );

            const minutes =
                Math.floor(
                    (totalSeconds %
                        (60 * 60)) /
                        60
                );

            const seconds =
                totalSeconds % 60;

            setTimeRemaining(
                `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`
            );
        };

        calculateTime();

        const interval =
            setInterval(
                calculateTime,
                1000
            );

        return () => {
            clearInterval(interval);
        };

    }, [currentLaptop]);

    /* =====================================================
       DATE FORMAT
    ===================================================== */

    const formatDate = (dateValue) => {

        if (!dateValue) {
            return "-";
        }

        const date =
            new Date(dateValue);

        if (isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleString();
    };

    /* =====================================================
       AVAILABLE LAPTOPS
    ===================================================== */

    const availableLaptops =
        laptops.filter(
            (laptop) =>
                laptop.status ===
                "AVAILABLE"
        );

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {

        return (
            <div className="loading-page">
                <h2>
                    Loading Student Dashboard...
                </h2>
            </div>
        );
    }

    /* =====================================================
       PAGE
    ===================================================== */

    return (
        <div className="student-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="student-header">

                <div className="logo">
                    💻 Laptop Library
                </div>

                <div className="header-right">

                    <span>
                        Student Dashboard
                    </span>

                    <button
                        className="logout-button"
                        onClick={logout}
                    >
                        Logout
                    </button>

                </div>

            </header>

            {/* =================================================
                MAIN
            ================================================= */}

            <main className="student-main">

                {/* =================================================
                    WELCOME
                ================================================= */}

                <section className="welcome-card">

                    <h1>
                        Welcome,{" "}
                        {student?.name || "Student"}!
                    </h1>

                    <div className="student-details">

                        <p>
                            <strong>
                                Student Number:
                            </strong>{" "}
                            {student?.student_number ||
                                "-"}
                        </p>

                        <p>
                            <strong>
                                Department:
                            </strong>{" "}
                            {student?.department ||
                                "-"}
                        </p>

                        <p>
                            <strong>
                                Year:
                            </strong>{" "}
                            {student?.year ||
                                "-"}
                        </p>

                        <p>
                            <strong>
                                Email:
                            </strong>{" "}
                            {student?.email ||
                                "-"}
                        </p>

                    </div>

                </section>

                {/* =================================================
                    CURRENT LAPTOP
                ================================================= */}

                <section className="section-card">

                    <h2>
                        💻 My Laptop
                    </h2>

                    {!currentLaptop && (
                        <div className="empty-message">
                            <p>
                                You currently do not
                                have a laptop.
                            </p>
                        </div>
                    )}

                    {currentLaptop && (
                        <div className="current-laptop">

                            <h3>
                                {
                                    currentLaptop.laptop_code
                                }
                            </h3>

                            <div className="laptop-details">

                                <p>
                                    <strong>
                                        Brand:
                                    </strong>{" "}
                                    {
                                        currentLaptop.brand
                                    }
                                </p>

                                <p>
                                    <strong>
                                        Model:
                                    </strong>{" "}
                                    {
                                        currentLaptop.model
                                    }
                                </p>

                                <p>
                                    <strong>
                                        Processor:
                                    </strong>{" "}
                                    {
                                        currentLaptop.processor ||
                                        "-"
                                    }
                                </p>

                                <p>
                                    <strong>
                                        RAM:
                                    </strong>{" "}
                                    {
                                        currentLaptop.ram ||
                                        "-"
                                    }
                                </p>

                                <p>
                                    <strong>
                                        Storage:
                                    </strong>{" "}
                                    {
                                        currentLaptop.storage ||
                                        "-"
                                    }
                                </p>

                                <p>
                                    <strong>
                                        Operating System:
                                    </strong>{" "}
                                    {
                                        currentLaptop.operating_system ||
                                        "-"
                                    }
                                </p>

                                <p>
                                    <strong>
                                        Issue Date:
                                    </strong>{" "}
                                    {formatDate(
                                        currentLaptop.issue_datetime
                                    )}
                                </p>

                                <p>
                                    <strong>
                                        Return Deadline:
                                    </strong>{" "}
                                    {formatDate(
                                        currentLaptop.return_deadline
                                    )}
                                </p>

                            </div>

                            <div className="countdown-box">

                                <div className="countdown-title">
                                    Time Remaining
                                </div>

                                <div className="countdown">

                                    {timeRemaining ===
                                    "OVERDUE"
                                        ? "⚠️ OVERDUE"
                                        : timeRemaining}

                                </div>

                            </div>

                            <div className="status-row">

                                <strong>
                                    Status:
                                </strong>

                                <span
                                    className={
                                        currentLaptop.borrowing_status ===
                                        "OVERDUE"
                                            ? "status overdue"
                                            : "status active"
                                    }
                                >
                                    {
                                        currentLaptop.borrowing_status
                                    }
                                </span>

                            </div>

                        </div>
                    )}

                </section>

                {/* =================================================
                    AVAILABLE LAPTOPS
                ================================================= */}

                <section className="section-card">

                    <h2>
                        📚 Available Laptops
                    </h2>

                    {laptopLoading && (
                        <div className="empty-message">
                            <p>
                                Loading laptops...
                            </p>
                        </div>
                    )}

                    {!laptopLoading &&
                        availableLaptops.length === 0 && (
                            <div className="empty-message">

                                <p>
                                    No laptops are
                                    currently available.
                                </p>

                            </div>
                        )}

                    {!laptopLoading &&
                        availableLaptops.length >
                            0 && (

                            <div className="laptop-grid">

                                {availableLaptops.map(
                                    (laptop) => (

                                        <div
                                            className="laptop-card"
                                            key={
                                                laptop.laptop_id
                                            }
                                        >

                                            <h3>
                                                {
                                                    laptop.laptop_code
                                                }
                                            </h3>

                                            <p>
                                                <strong>
                                                    Brand:
                                                </strong>{" "}
                                                {
                                                    laptop.brand
                                                }
                                            </p>

                                            <p>
                                                <strong>
                                                    Model:
                                                </strong>{" "}
                                                {
                                                    laptop.model
                                                }
                                            </p>

                                            <p>
                                                <strong>
                                                    Processor:
                                                </strong>{" "}
                                                {
                                                    laptop.processor ||
                                                    "-"
                                                }
                                            </p>

                                            <p>
                                                <strong>
                                                    RAM:
                                                </strong>{" "}
                                                {
                                                    laptop.ram ||
                                                    "-"
                                                }
                                            </p>

                                            <p>
                                                <strong>
                                                    Storage:
                                                </strong>{" "}
                                                {
                                                    laptop.storage ||
                                                    "-"
                                                }
                                            </p>

                                            <p>
                                                <strong>
                                                    OS:
                                                </strong>{" "}
                                                {
                                                    laptop.operating_system ||
                                                    "-"
                                                }
                                            </p>

                                            <div className="available-badge">
                                                AVAILABLE
                                            </div>

                                            <button
    className={
        pendingRequests.includes(laptop.laptop_id)
            ? "request-button pending"
            : "request-button"
    }
    onClick={() => handleRequestLaptop(laptop.laptop_id)}
    disabled={pendingRequests.includes(laptop.laptop_id)}
>
    {pendingRequests.includes(laptop.laptop_id)
        ? "🟡 ⏳ Request Pending"
        : "💻 Request Laptop"}
</button>

                                        </div>

                                    )
                                )}

                            </div>
                        )}

                </section>

                {/* =================================================
                    BORROWING HISTORY
                ================================================= */}

                <section className="section-card">

                    <h2>
                        📋 Borrowing History
                    </h2>

                    {historyLoading && (
                        <div className="empty-message">
                            <p>
                                Loading borrowing
                                history...
                            </p>
                        </div>
                    )}

                    {!historyLoading &&
                        history.length === 0 && (
                            <div className="empty-message">
                                <p>
                                    No borrowing history
                                    available.
                                </p>
                            </div>
                        )}

                    {!historyLoading &&
                        history.length > 0 && (

                            <div className="history-container">

                                {history.map(
                                    (item) => (

                                        <div
                                            className="history-card"
                                            key={
                                                item.issue_id
                                            }
                                        >

                                            <div className="history-header">

                                                <h3>
                                                    {
                                                        item.laptop_code
                                                    }
                                                </h3>

                                                <span
                                                    className={
                                                        item.status ===
                                                        "RETURNED"
                                                            ? "history-status returned"
                                                            : item.status ===
                                                              "OVERDUE"
                                                            ? "history-status overdue"
                                                            : "history-status active"
                                                    }
                                                >
                                                    {
                                                        item.status
                                                    }
                                                </span>

                                            </div>

                                            <p>
                                                <strong>
                                                    Brand:
                                                </strong>{" "}
                                                {
                                                    item.brand
                                                }
                                            </p>

                                            <p>
                                                <strong>
                                                    Model:
                                                </strong>{" "}
                                                {
                                                    item.model
                                                }
                                            </p>

                                            <p>
                                                <strong>
                                                    Issue Date:
                                                </strong>{" "}
                                                {formatDate(
                                                    item.issue_datetime
                                                )}
                                            </p>

                                            <p>
                                                <strong>
                                                    Return Deadline:
                                                </strong>{" "}
                                                {formatDate(
                                                    item.return_deadline
                                                )}
                                            </p>

                                            <p>
                                                <strong>
                                                    Actual Return:
                                                </strong>{" "}
                                                {formatDate(
                                                    item.actual_return_datetime
                                                )}
                                            </p>

                                            {item.condition_before && (
                                                <p>
                                                    <strong>
                                                        Condition Before:
                                                    </strong>{" "}
                                                    {
                                                        item.condition_before
                                                    }
                                                </p>
                                            )}

                                            {item.condition_after && (
                                                <p>
                                                    <strong>
                                                        Condition After:
                                                    </strong>{" "}
                                                    {
                                                        item.condition_after
                                                    }
                                                </p>
                                            )}

                                        </div>

                                    )
                                )}

                            </div>
                        )}

                </section>

            </main>

            {/* =================================================
                CSS
            ================================================= */}

            <style>{`

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    font-family: Arial, sans-serif;
                    background: #f4f6f8;
                    color: #1f2937;
                }

                .student-page {
                    min-height: 100vh;
                    background: #f4f6f8;
                }

                /* HEADER */

                .student-header {
                    background: #1f2937;
                    color: white;
                    min-height: 75px;
                    padding: 15px 35px;

                    display: flex;
                    align-items: center;
                    justify-content: space-between;

                    gap: 20px;
                }

                .logo {
                    font-size: 24px;
                    font-weight: bold;
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .header-right span {
                    font-size: 16px;
                    font-weight: 600;
                }

                .logout-button {
                    background: #dc2626;
                    color: white;

                    border: none;
                    border-radius: 6px;

                    padding: 10px 18px;

                    font-size: 14px;
                    font-weight: bold;

                    cursor: pointer;
                }

                .logout-button:hover {
                    background: #b91c1c;
                }

                /* MAIN */

                .student-main {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 30px 25px 50px;
                }

                /* WELCOME */

                .welcome-card {
                    background: white;

                    border-radius: 12px;

                    padding: 25px;

                    margin-bottom: 25px;

                    box-shadow:
                        0 3px 12px
                        rgba(0, 0, 0, 0.08);
                }

                .welcome-card h1 {
                    margin: 0 0 20px;

                    font-size: 30px;

                    color: #1f2937;
                }

                .student-details {
                    display: grid;

                    grid-template-columns:
                        repeat(2, 1fr);

                    gap: 10px 30px;
                }

                .student-details p {
                    margin: 0;

                    color: #4b5563;
                }

                /* SECTIONS */

                .section-card {
                    background: white;

                    border-radius: 12px;

                    padding: 25px;

                    margin-bottom: 25px;

                    box-shadow:
                        0 3px 12px
                        rgba(0, 0, 0, 0.08);
                }

                .section-card h2 {
                    margin: 0 0 20px;

                    font-size: 23px;

                    color: #1f2937;
                }

                /* CURRENT LAPTOP */

                .current-laptop {
                    border: 1px solid #e5e7eb;

                    border-radius: 10px;

                    padding: 20px;
                }

                .current-laptop h3 {
                    margin: 0 0 20px;

                    font-size: 25px;

                    color: #2563eb;
                }

                .laptop-details {
                    display: grid;

                    grid-template-columns:
                        repeat(2, 1fr);

                    gap: 10px 30px;
                }

                .laptop-details p {
                    margin: 0;

                    color: #4b5563;
                }

                /* COUNTDOWN */

                .countdown-box {
                    margin-top: 25px;

                    padding: 20px;

                    background: #eff6ff;

                    border-radius: 10px;

                    text-align: center;
                }

                .countdown-title {
                    font-size: 14px;

                    color: #6b7280;

                    margin-bottom: 8px;
                }

                .countdown {
                    font-size: 25px;

                    font-weight: bold;

                    color: #2563eb;
                }

                .status-row {
                    margin-top: 20px;

                    display: flex;

                    align-items: center;

                    gap: 10px;
                }

                .status {
                    padding: 6px 12px;

                    border-radius: 20px;

                    font-size: 12px;

                    font-weight: bold;
                }

                .status.active {
                    background: #dcfce7;
                    color: #166534;
                }

                .status.overdue {
                    background: #fee2e2;
                    color: #991b1b;
                }

                /* LAPTOP GRID */

                .laptop-grid {
                    display: grid;

                    grid-template-columns:
                        repeat(
                            auto-fit,
                            minmax(260px, 1fr)
                        );

                    gap: 20px;
                }

                .laptop-card {
                    border: 1px solid #e5e7eb;

                    border-radius: 10px;

                    padding: 20px;

                    transition:
                        transform 0.2s,
                        box-shadow 0.2s;
                }

                .laptop-card:hover {
                    transform:
                        translateY(-2px);

                    box-shadow:
                        0 5px 15px
                        rgba(0, 0, 0, 0.08);
                }

                .laptop-card h3 {
                    margin: 0 0 15px;

                    color: #2563eb;

                    font-size: 21px;
                }

                .laptop-card p {
                    margin: 8px 0;

                    color: #4b5563;
                }

                .available-badge {
                    display: inline-block;

                    margin-top: 10px;

                    padding: 6px 10px;

                    background: #dcfce7;

                    color: #166534;

                    border-radius: 20px;

                    font-size: 11px;

                    font-weight: bold;
                }

                .request-button {
    width: 100%;
    margin-top: 15px;
    padding: 11px 15px;

    background: #2563eb;
    color: white;

    border: none;
    border-radius: 7px;

    font-size: 14px;
    font-weight: bold;

    cursor: pointer;
}

.request-button:hover {
    background: #1d4ed8;
}

.request-button:disabled {
    cursor: not-allowed;
    opacity: 0.9;
}

.request-button.pending {
    background: #f59e0b;
    color: white;
}

.request-button.pending:hover {
    background: #d97706;
}

                .request-info {
                    margin-top: 15px !important;

                    font-size: 13px;

                    color: #6b7280 !important;
                }

                /* HISTORY */

                .history-container {
                    display: flex;

                    flex-direction: column;

                    gap: 15px;
                }

                .history-card {
                    border: 1px solid #e5e7eb;

                    border-radius: 10px;

                    padding: 20px;
                }

                .history-header {
                    display: flex;

                    align-items: center;

                    justify-content: space-between;

                    gap: 15px;

                    margin-bottom: 15px;
                }

                .history-header h3 {
                    margin: 0;

                    color: #2563eb;

                    font-size: 21px;
                }

                .history-card p {
                    margin: 8px 0;

                    color: #4b5563;
                }

                .history-status {
                    padding: 6px 12px;

                    border-radius: 20px;

                    font-size: 11px;

                    font-weight: bold;

                    white-space: nowrap;
                }

                .history-status.returned {
                    background: #dcfce7;

                    color: #166534;
                }

                .history-status.active {
                    background: #dbeafe;

                    color: #1d4ed8;
                }

                .history-status.overdue {
                    background: #fee2e2;

                    color: #991b1b;
                }

                /* EMPTY */

                .empty-message {
                    text-align: center;

                    padding: 35px 20px;

                    color: #6b7280;
                }

                .empty-message p {
                    margin: 0;
                }

                /* LOADING */

                .loading-page {
                    min-height: 100vh;

                    display: flex;

                    justify-content: center;

                    align-items: center;

                    background: #f4f6f8;

                    color: #374151;
                }

                /* RESPONSIVE */

                @media (max-width: 700px) {

                    .student-header {
                        flex-direction: column;

                        align-items: flex-start;

                        padding: 20px;
                    }

                    .header-right {
                        width: 100%;

                        justify-content:
                            space-between;
                    }

                    .student-main {
                        padding: 20px 15px;
                    }

                    .student-details {
                        grid-template-columns: 1fr;
                    }

                    .laptop-details {
                        grid-template-columns: 1fr;
                    }

                    .welcome-card h1 {
                        font-size: 25px;
                    }

                    .section-card {
                        padding: 18px;
                    }

                    .countdown {
                        font-size: 20px;
                    }

                    .history-header {
                        flex-direction: column;

                        align-items: flex-start;
                    }

                }

            `}</style>

        </div>
    );
}

export default StudentDashboard;