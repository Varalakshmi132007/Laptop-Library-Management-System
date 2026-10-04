import { useEffect, useState } from "react";

function Students() {

    // =====================================================
    // STATE
    // =====================================================

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState("");
    const [year, setYear] = useState("");
    const [status, setStatus] = useState("");

    // ADD STUDENT FORM
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        student_number: "",
        department: "CSE",
        year: "1",
        phone: ""
    });

    const token = localStorage.getItem("token");


    // =====================================================
    // LOAD STUDENTS
    // =====================================================

    const loadStudents = async () => {

        try {

            setLoading(true);

            const params = new URLSearchParams();

            if (search.trim() !== "") {
                params.append(
                    "search",
                    search.trim()
                );
            }

            if (department !== "") {
                params.append(
                    "department",
                    department
                );
            }

            if (status !== "") {
                params.append(
                    "status",
                    status
                );
            }

            const response = await fetch(
                `http://127.0.0.1:3000/api/admin/students?${params.toString()}`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.error ||
                    "Failed to load students"
                );

                setStudents([]);

                return;
            }

            let studentList =
                data.students || [];

            // YEAR FILTER
            if (year !== "") {

                studentList =
                    studentList.filter(
                        (student) =>
                            String(student.year) ===
                            String(year)
                    );
            }

            setStudents(studentList);

        } catch (error) {

            console.error(
                "Load students error:",
                error
            );

            alert(
                "Could not connect to the server."
            );

        } finally {

            setLoading(false);

        }
    };


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        if (!token) {

            window.location.href = "/";

            return;
        }

        loadStudents();

    }, [department, status, year]);


    // =====================================================
    // SEARCH
    // =====================================================

    const handleSearch = (e) => {

        e.preventDefault();

        loadStudents();
    };


    // =====================================================
    // CLEAR FILTERS
    // =====================================================

    const clearFilters = () => {

        setSearch("");
        setDepartment("");
        setYear("");
        setStatus("");

        setTimeout(() => {
            loadStudents();
        }, 0);
    };


    // =====================================================
    // FORM INPUT
    // =====================================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setFormData({
            ...formData,
            [name]: value
        });
    };


    // =====================================================
    // OPEN ADD STUDENT FORM
    // =====================================================

    const openAddStudentForm = () => {

        setShowForm(true);
    };


    // =====================================================
    // CLOSE ADD STUDENT FORM
    // =====================================================

    const closeAddStudentForm = () => {

        setShowForm(false);

        setFormData({
            name: "",
            email: "",
            student_number: "",
            department: "CSE",
            year: "1",
            phone: ""
        });
    };


    // =====================================================
    // ADD STUDENT
    // =====================================================

    const addStudent = async (e) => {

        e.preventDefault();

        // BASIC VALIDATION

        if (
            formData.name.trim() === "" ||
            formData.email.trim() === "" ||
            formData.student_number.trim() === "" ||
            formData.department === "" ||
            formData.year === ""
        ) {

            alert(
                "Please fill all required fields."
            );

            return;
        }


        try {

            const response = await fetch(
                "http://127.0.0.1:3000/api/admin/students",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        name:
                            formData.name.trim(),

                        email:
                            formData.email.trim(),

                        student_number:
                            formData.student_number.trim(),

                        department:
                            formData.department,

                        year:
                            Number(formData.year),

                        phone:
                            formData.phone.trim()
                                || null
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.error ||
                    "Failed to add student"
                );

                return;
            }

            alert(
                "Student added successfully!"
            );


            // CLOSE FORM

            closeAddStudentForm();


            // REFRESH STUDENT LIST

            await loadStudents();

        } catch (error) {

            console.error(
                "Add student error:",
                error
            );

            alert(
                "Could not connect to the server."
            );
        }
    };


    // =====================================================
    // DEACTIVATE STUDENT
    // =====================================================

    const deactivateStudent = async (
        studentId
    ) => {

        const confirmAction =
            window.confirm(
                "Are you sure you want to deactivate this student?"
            );

        if (!confirmAction) {
            return;
        }


        try {

            const response =
                await fetch(
                    `http://127.0.0.1:3000/api/admin/students/${studentId}/deactivate`,
                    {
                        method: "PUT",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.error ||
                    "Failed to deactivate student"
                );

                return;
            }

            alert(
                "Student deactivated successfully!"
            );

            loadStudents();

        } catch (error) {

            console.error(
                "Deactivate student error:",
                error
            );

            alert(
                "Could not connect to the server."
            );
        }
    };


    // =====================================================
    // REACTIVATE STUDENT
    // =====================================================

    const reactivateStudent = async (
        studentId
    ) => {

        const confirmAction =
            window.confirm(
                "Are you sure you want to reactivate this student?"
            );

        if (!confirmAction) {
            return;
        }


        try {

            const response =
                await fetch(
                    `http://127.0.0.1:3000/api/admin/students/${studentId}/reactivate`,
                    {
                        method: "PUT",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.error ||
                    "Failed to reactivate student"
                );

                return;
            }

            alert(
                "Student reactivated successfully!"
            );

            loadStudents();

        } catch (error) {

            console.error(
                "Reactivate student error:",
                error
            );

            alert(
                "Could not connect to the server."
            );
        }
    };


    // =====================================================
    // LOGOUT
    // =====================================================

    const logout = () => {

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "role"
        );

        window.location.href = "/";
    };


    // =====================================================
    // LOADING SCREEN
    // =====================================================

    if (loading) {

        return (
            <div className="students-loading">

                <h2>
                    Loading students...
                </h2>

            </div>
        );
    }


    // =====================================================
    // MAIN UI
    // =====================================================

    return (

        <div className="students-page">


            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="students-sidebar">

                <div className="sidebar-title">
                    💻 Laptop Library
                </div>


                <div
                    className="sidebar-item"
                    onClick={() =>
                        window.location.href =
                            "/admin"
                    }
                >
                    📊 Dashboard
                </div>


                <div
                    className="sidebar-item"
                    onClick={() =>
                        window.location.href =
                            "/admin/laptops"
                    }
                >
                    💻 Laptops
                </div>


                <div
                    className="sidebar-item active"
                >
                    👨‍🎓 Students
                </div>


                <div
                    className="sidebar-item"
                    onClick={() =>
                        window.location.href =
                            "/admin/requests"
                    }
                >
                    📋 Requests
                </div>


                <div
                    className="sidebar-item"
                    onClick={() =>
                        window.location.href =
                            "/admin/borrowings"
                    }
                >
                    📚 Borrowings
                </div>


                <div
                    className="sidebar-item"
                    onClick={() =>
                        window.location.href =
                            "/admin/maintenance"
                    }
                >
                    🔧 Maintenance
                </div>

            </aside>


            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main className="students-main">


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="students-header">

                    <div>

                        <h1>
                            Manage Students
                        </h1>

                        <p>
                            View and manage registered
                            students.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="logout-button"
                        onClick={logout}
                    >
                        Logout
                    </button>

                </div>


                {/* =================================================
                    ADD STUDENT BUTTON
                ================================================= */}

                <div className="add-student-container">

                    <button
                        type="button"
                        className="add-student-button"
                        onClick={
                            openAddStudentForm
                        }
                    >
                        + Add Student
                    </button>

                </div>


                {/* =================================================
                    ADD STUDENT FORM
                ================================================= */}

                {showForm && (

                    <section className="student-form-card">

                        <div className="form-header">

                            <h2>
                                Add New Student
                            </h2>

                            <button
                                type="button"
                                className="close-form-button"
                                onClick={
                                    closeAddStudentForm
                                }
                            >
                                ✕
                            </button>

                        </div>


                        <form
                            onSubmit={addStudent}
                        >

                            <div className="student-form-grid">


                                {/* NAME */}

                                <div className="form-group">

                                    <label>
                                        Full Name *
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Enter full name"
                                        value={
                                            formData.name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    />

                                </div>


                                {/* EMAIL */}

                                <div className="form-group">

                                    <label>
                                        Email *
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="student@example.com"
                                        value={
                                            formData.email
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    />

                                </div>


                                {/* STUDENT NUMBER */}

                                <div className="form-group">

                                    <label>
                                        Student Number *
                                    </label>

                                    <input
                                        type="text"
                                        name="student_number"
                                        placeholder="STU002"
                                        value={
                                            formData.student_number
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    />

                                </div>


                                {/* DEPARTMENT */}

                                <div className="form-group">

                                    <label>
                                        Department *
                                    </label>

                                    <select
                                        name="department"
                                        value={
                                            formData.department
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    >

                                        <option value="CSE">
                                            CSE
                                        </option>

                                        <option value="ISE">
                                            ISE
                                        </option>

                                        <option value="ECE">
                                            ECE
                                        </option>

                                        <option value="EEE">
                                            EEE
                                        </option>

                                        <option value="ME">
                                            ME
                                        </option>

                                        <option value="CIVIL">
                                            CIVIL
                                        </option>

                                    </select>

                                </div>


                                {/* YEAR */}

                                <div className="form-group">

                                    <label>
                                        Year *
                                    </label>

                                    <select
                                        name="year"
                                        value={
                                            formData.year
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    >

                                        <option value="1">
                                            1st Year
                                        </option>

                                        <option value="2">
                                            2nd Year
                                        </option>

                                        <option value="3">
                                            3rd Year
                                        </option>

                                        <option value="4">
                                            4th Year
                                        </option>

                                    </select>

                                </div>


                                {/* PHONE */}

                                <div className="form-group">

                                    <label>
                                        Phone
                                    </label>

                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="9876543210"
                                        value={
                                            formData.phone
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </div>

                            </div>


                            {/* FORM BUTTONS */}

                            <div className="form-buttons">

                                <button
                                    type="submit"
                                    className="save-student-button"
                                >
                                    Add Student
                                </button>


                                <button
                                    type="button"
                                    className="cancel-student-button"
                                    onClick={
                                        closeAddStudentForm
                                    }
                                >
                                    Cancel
                                </button>

                            </div>

                        </form>

                    </section>

                )}


                {/* =================================================
                    SEARCH & FILTER
                ================================================= */}

                <section className="filter-card">

                    <h2>
                        Search & Filter
                    </h2>


                    <form
                        className="filter-grid"
                        onSubmit={
                            handleSearch
                        }
                    >

                        <input
                            type="text"
                            placeholder="Search name, email or student number"
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />


                        <select
                            value={department}
                            onChange={(e) =>
                                setDepartment(
                                    e.target.value
                                )
                            }
                        >

                            <option value="">
                                All Departments
                            </option>

                            <option value="CSE">
                                CSE
                            </option>

                            <option value="ISE">
                                ISE
                            </option>

                            <option value="ECE">
                                ECE
                            </option>

                            <option value="EEE">
                                EEE
                            </option>

                            <option value="ME">
                                ME
                            </option>

                            <option value="CIVIL">
                                CIVIL
                            </option>

                        </select>


                        <select
                            value={year}
                            onChange={(e) =>
                                setYear(
                                    e.target.value
                                )
                            }
                        >

                            <option value="">
                                All Years
                            </option>

                            <option value="1">
                                1st Year
                            </option>

                            <option value="2">
                                2nd Year
                            </option>

                            <option value="3">
                                3rd Year
                            </option>

                            <option value="4">
                                4th Year
                            </option>

                        </select>


                        <select
                            value={status}
                            onChange={(e) =>
                                setStatus(
                                    e.target.value
                                )
                            }
                        >

                            <option value="">
                                All Status
                            </option>

                            <option value="ACTIVE">
                                Active
                            </option>

                            <option value="INACTIVE">
                                Inactive
                            </option>

                        </select>


                        <button
                            type="submit"
                            className="search-button"
                        >
                            🔍 Search
                        </button>


                        <button
                            type="button"
                            className="clear-button"
                            onClick={
                                clearFilters
                            }
                        >
                            Clear Filters
                        </button>

                    </form>

                </section>


                {/* =================================================
                    STUDENT COUNT
                ================================================= */}

                <div className="student-count">

                    Showing{" "}

                    <strong>
                        {students.length}
                    </strong>{" "}

                    student
                    {students.length !== 1
                        ? "s"
                        : ""}

                </div>


                {/* =================================================
                    STUDENTS TABLE
                ================================================= */}

                <section className="students-table-card">

                    <div className="table-wrapper">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Name
                                    </th>

                                    <th>
                                        Student Number
                                    </th>

                                    <th>
                                        Email
                                    </th>

                                    <th>
                                        Department
                                    </th>

                                    <th>
                                        Year
                                    </th>

                                    <th>
                                        Phone
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

                                {students.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="8"
                                            className="no-students"
                                        >
                                            No students found.
                                        </td>

                                    </tr>

                                ) : (

                                    students.map(
                                        (student) => (

                                            <tr
                                                key={
                                                    student.student_id
                                                }
                                            >

                                                <td>
                                                    <strong>
                                                        {
                                                            student.name
                                                        }
                                                    </strong>
                                                </td>

                                                <td>
                                                    {
                                                        student.student_number
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        student.email
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        student.department
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        student.year
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        student.phone ||
                                                        "—"
                                                    }
                                                </td>

                                                <td>

                                                    <span
                                                        className={
                                                            student.status ===
                                                            "ACTIVE"
                                                                ? "status active"
                                                                : "status inactive"
                                                        }
                                                    >
                                                        {
                                                            student.status
                                                        }
                                                    </span>

                                                </td>

                                                <td>

                                                    {student.status ===
                                                    "ACTIVE" ? (

                                                        <button
                                                            type="button"
                                                            className="action-button deactivate"
                                                            onClick={() =>
                                                                deactivateStudent(
                                                                    student.student_id
                                                                )
                                                            }
                                                        >
                                                            Deactivate
                                                        </button>

                                                    ) : (

                                                        <button
                                                            type="button"
                                                            className="action-button reactivate"
                                                            onClick={() =>
                                                                reactivateStudent(
                                                                    student.student_id
                                                                )
                                                            }
                                                        >
                                                            Reactivate
                                                        </button>

                                                    )}

                                                </td>

                                            </tr>

                                        )
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>

            </main>


            {/* =================================================
                PAGE CSS
            ================================================= */}

            <style>{`

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    font-family: Arial, sans-serif;
                }

                .students-page {
                    min-height: 100vh;
                    background: #f4f6f8;
                    color: #1f2937;
                }

                /* SIDEBAR */

                .students-sidebar {
                    position: fixed;
                    left: 0;
                    top: 0;
                    bottom: 0;

                    width: 250px;

                    background: #111827;
                    color: white;

                    padding: 25px 15px;

                    z-index: 100;
                }

                .sidebar-title {
                    font-size: 21px;
                    font-weight: bold;

                    margin-bottom: 30px;
                    padding-left: 10px;
                }

                .sidebar-item {
                    padding: 14px 15px;

                    margin-bottom: 7px;

                    border-radius: 8px;

                    cursor: pointer;

                    font-size: 15px;
                }

                .sidebar-item:hover {
                    background: #374151;
                }

                .sidebar-item.active {
                    background: #2563eb;
                }

                /* MAIN */

                .students-main {
                    margin-left: 250px;

                    width: calc(100% - 250px);

                    padding: 30px;
                }

                /* HEADER */

                .students-header {
                    display: flex;

                    justify-content: space-between;
                    align-items: center;

                    margin-bottom: 20px;
                }

                .students-header h1 {
                    margin: 0 0 7px;

                    font-size: 30px;

                    color: #111827;
                }

                .students-header p {
                    margin: 0;

                    color: #6b7280;
                }

                .logout-button {
                    border: none;

                    background: #dc2626;
                    color: white;

                    padding: 11px 20px;

                    border-radius: 7px;

                    cursor: pointer;

                    font-weight: bold;
                }

                .logout-button:hover {
                    background: #b91c1c;
                }

                /* ADD BUTTON */

                .add-student-container {
                    margin-bottom: 20px;
                }

                .add-student-button {
                    display: inline-block;

                    background: #2563eb;
                    color: white;

                    border: none;

                    padding: 12px 22px;

                    border-radius: 7px;

                    cursor: pointer;

                    font-size: 14px;

                    font-weight: bold;
                }

                .add-student-button:hover {
                    background: #1d4ed8;
                }

                /* ADD FORM */

                .student-form-card {
                    background: white;

                    padding: 25px;

                    border-radius: 12px;

                    box-shadow:
                        0 2px 10px
                        rgba(0, 0, 0, 0.08);

                    margin-bottom: 25px;
                }

                .form-header {
                    display: flex;

                    justify-content: space-between;
                    align-items: center;

                    margin-bottom: 20px;
                }

                .form-header h2 {
                    margin: 0;

                    font-size: 20px;

                    color: #111827;
                }

                .close-form-button {
                    border: none;

                    background: #f3f4f6;

                    color: #374151;

                    width: 35px;
                    height: 35px;

                    border-radius: 6px;

                    cursor: pointer;

                    font-size: 16px;
                }

                .close-form-button:hover {
                    background: #e5e7eb;
                }

                .student-form-grid {
                    display: grid;

                    grid-template-columns:
                        repeat(2, 1fr);

                    gap: 18px;
                }

                .form-group {
                    display: flex;

                    flex-direction: column;

                    gap: 7px;
                }

                .form-group label {
                    font-size: 13px;

                    font-weight: bold;

                    color: #374151;
                }

                .form-group input,
                .form-group select {
                    width: 100%;

                    padding: 11px 12px;

                    border: 1px solid #d1d5db;

                    border-radius: 7px;

                    background: white;

                    color: #111827;

                    font-size: 14px;
                }

                .form-group input:focus,
                .form-group select:focus {
                    outline: none;

                    border-color: #2563eb;
                }

                .form-buttons {
                    display: flex;

                    gap: 12px;

                    margin-top: 22px;
                }

                .save-student-button {
                    border: none;

                    background: #16a34a;
                    color: white;

                    padding: 11px 20px;

                    border-radius: 7px;

                    cursor: pointer;

                    font-weight: bold;
                }

                .save-student-button:hover {
                    background: #15803d;
                }

                .cancel-student-button {
                    border: none;

                    background: #6b7280;
                    color: white;

                    padding: 11px 20px;

                    border-radius: 7px;

                    cursor: pointer;

                    font-weight: bold;
                }

                .cancel-student-button:hover {
                    background: #4b5563;
                }

                /* FILTER */

                .filter-card {
                    background: white;

                    padding: 22px;

                    border-radius: 12px;

                    box-shadow:
                        0 2px 10px
                        rgba(0, 0, 0, 0.08);

                    margin-bottom: 20px;
                }

                .filter-card h2 {
                    margin: 0 0 18px;

                    font-size: 19px;

                    color: #111827;
                }

                .filter-grid {
                    display: grid;

                    grid-template-columns:
                        2fr 1fr 1fr 1fr auto auto;

                    gap: 12px;
                }

                .filter-grid input,
                .filter-grid select {
                    padding: 11px 12px;

                    border: 1px solid #d1d5db;

                    border-radius: 7px;

                    font-size: 14px;

                    background: white;

                    color: #111827;
                }

                .search-button {
                    border: none;

                    background: #2563eb;
                    color: white;

                    padding: 11px 17px;

                    border-radius: 7px;

                    cursor: pointer;

                    font-weight: bold;
                }

                .search-button:hover {
                    background: #1d4ed8;
                }

                .clear-button {
                    border: none;

                    background: #6b7280;
                    color: white;

                    padding: 11px 17px;

                    border-radius: 7px;

                    cursor: pointer;

                    font-weight: bold;
                }

                .clear-button:hover {
                    background: #4b5563;
                }

                /* COUNT */

                .student-count {
                    margin-bottom: 12px;

                    color: #4b5563;

                    font-size: 14px;
                }

                /* TABLE */

                .students-table-card {
                    background: white;

                    border-radius: 12px;

                    box-shadow:
                        0 2px 10px
                        rgba(0, 0, 0, 0.08);

                    overflow: hidden;
                }

                .table-wrapper {
                    overflow-x: auto;
                }

                table {
                    width: 100%;

                    min-width: 1000px;

                    border-collapse: collapse;
                }

                th {
                    background: #f3f4f6;

                    color: #374151;

                    font-size: 13px;

                    text-align: left;

                    padding: 15px;

                    border-bottom:
                        1px solid #e5e7eb;

                    white-space: nowrap;
                }

                td {
                    padding: 15px;

                    border-bottom:
                        1px solid #e5e7eb;

                    font-size: 14px;

                    color: #374151;
                }

                tbody tr:hover {
                    background: #f9fafb;
                }

                .status {
                    display: inline-block;

                    padding: 6px 10px;

                    border-radius: 20px;

                    font-size: 12px;

                    font-weight: bold;
                }

                .status.active {
                    background: #dcfce7;

                    color: #166534;
                }

                .status.inactive {
                    background: #fee2e2;

                    color: #991b1b;
                }

                .action-button {
                    border: none;

                    padding: 8px 12px;

                    border-radius: 6px;

                    cursor: pointer;

                    font-size: 12px;

                    font-weight: bold;
                }

                .action-button.deactivate {
                    background: #fee2e2;

                    color: #b91c1c;
                }

                .action-button.reactivate {
                    background: #dcfce7;

                    color: #166534;
                }

                .no-students {
                    text-align: center;

                    padding: 40px;

                    color: #6b7280;
                }

                /* LOADING */

                .students-loading {
                    min-height: 100vh;

                    display: flex;

                    justify-content: center;
                    align-items: center;

                    background: #f4f6f8;

                    color: #111827;

                    font-family: Arial, sans-serif;
                }

                /* RESPONSIVE */

                @media (max-width: 1100px) {

                    .filter-grid {
                        grid-template-columns:
                            repeat(3, 1fr);
                    }

                    .student-form-grid {
                        grid-template-columns:
                            1fr;
                    }
                }

                @media (max-width: 700px) {

                    .students-sidebar {
                        width: 200px;
                    }

                    .students-main {
                        margin-left: 200px;

                        width: calc(100% - 200px);

                        padding: 20px;
                    }

                    .students-header {
                        align-items: flex-start;

                        gap: 15px;
                    }

                    .students-header h1 {
                        font-size: 24px;
                    }

                    .filter-grid {
                        grid-template-columns:
                            1fr;
                    }
                }

            `}</style>

        </div>
    );
}

export default Students;