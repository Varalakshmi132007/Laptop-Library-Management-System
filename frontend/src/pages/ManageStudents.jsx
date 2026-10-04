import { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";

function ManageStudents() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState("");
    const [status, setStatus] = useState("");

    // =====================================================
    // ADD STUDENT MODAL
    // =====================================================

    const [showAddStudent, setShowAddStudent] = useState(false);

    const [studentForm, setStudentForm] = useState({
        name: "",
        email: "",
        student_number: "",
        department: "CSE",
        year: "1",
        phone: "",
        password: ""
    });

    const [addingStudent, setAddingStudent] = useState(false);

    const token = localStorage.getItem("token");

    // =====================================================
    // LOAD STUDENTS
    // =====================================================

    const loadStudents = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            if (search) {
                params.append("search", search);
            }

            if (department) {
                params.append("department", department);
            }

            if (status) {
                params.append("status", status);
            }

            const response = await fetch(
                `http://127.0.0.1:3000/api/admin/students?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setStudents(data.students || []);
            } else {
                console.error(data.error);
                setStudents([]);
            }
        } catch (error) {
            console.error("Student loading error:", error);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // PAGE LOAD
    // =====================================================

    useEffect(() => {
        if (!token) {
            window.location.href = "/";
            return;
        }

        loadStudents();
    }, []);

    // =====================================================
    // SEARCH
    // =====================================================

    const handleSearch = (e) => {
        e.preventDefault();
        loadStudents();
    };

    // =====================================================
    // ADD STUDENT FORM CHANGE
    // =====================================================

    const handleStudentFormChange = (e) => {
        const { name, value } = e.target;

        setStudentForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // =====================================================
    // ADD STUDENT
    // =====================================================

    const handleAddStudent = async (e) => {
        e.preventDefault();

        if (
            !studentForm.name ||
            !studentForm.email ||
            !studentForm.student_number ||
            !studentForm.department ||
            !studentForm.year ||
            !studentForm.phone ||
            !studentForm.password
        ) {
            alert("Please fill all fields.");
            return;
        }

        try {
            setAddingStudent(true);

            const response = await fetch(
                "http://127.0.0.1:3000/api/admin/students",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: studentForm.name,
                        email: studentForm.email,
                        student_number: studentForm.student_number,
                        department: studentForm.department,
                        year: Number(studentForm.year),
                        phone: studentForm.phone,
                        password: studentForm.password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Failed to add student.");
                return;
            }

            alert("Student added successfully!");

            // Close popup
            setShowAddStudent(false);

            // Clear form
            setStudentForm({
                name: "",
                email: "",
                student_number: "",
                department: "CSE",
                year: "1",
                phone: "",
                password: ""
            });

            // Refresh students
            loadStudents();
        } catch (error) {
            console.error("Add student error:", error);
            alert("Cannot connect to server.");
        } finally {
            setAddingStudent(false);
        }
    };

    // =====================================================
    // DEACTIVATE STUDENT
    // =====================================================

    const handleDeactivate = async (studentId) => {
        const confirmDeactivate = window.confirm(
            "Are you sure you want to deactivate this student?"
        );

        if (!confirmDeactivate) {
            return;
        }

        try {
            const response = await fetch(
                `http://127.0.0.1:3000/api/admin/students/${studentId}/deactivate`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Failed to deactivate student");
                return;
            }

            alert("Student deactivated successfully");

            loadStudents();
        } catch (error) {
            console.error(
                "Deactivate student error:",
                error
            );

            alert("Cannot connect to server");
        }
    };

    // =====================================================
    // REACTIVATE STUDENT
    // =====================================================

    const handleReactivate = async (studentId) => {
        const confirmReactivate = window.confirm(
            "Are you sure you want to reactivate this student?"
        );

        if (!confirmReactivate) {
            return;
        }

        try {
            const response = await fetch(
                `http://127.0.0.1:3000/api/admin/students/${studentId}/reactivate`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Failed to reactivate student");
                return;
            }

            alert("Student reactivated successfully");

            loadStudents();
        } catch (error) {
            console.error(
                "Reactivate student error:",
                error
            );

            alert("Cannot connect to server");
        }
    };

    // =====================================================
    // LOGOUT
    // =====================================================

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");

        window.location.href = "/";
    };

    // =====================================================
    // PAGE UI
    // =====================================================

    return (
        <div
            style={{
                minHeight: "100vh",
                width: "100%",
                background: "#f3f6fa",
                fontFamily: "Arial, sans-serif"
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
                    padding: "30px 38px",
                    boxSizing: "border-box"
                }}
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "30px",
                        gap: "20px"
                    }}
                >

                    <div>
                        <h1
                            style={{
                                margin: 0,
                                color: "#172033",
                                fontSize: "36px"
                            }}
                        >
                            Manage Students
                        </h1>

                        <p
                            style={{
                                marginTop: "8px",
                                color: "#64748b",
                                fontSize: "16px"
                            }}
                        >
                            View and manage registered students.
                        </p>
                    </div>


                    {/* =================================================
                        HEADER BUTTONS
                    ================================================= */}

                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            alignItems: "center"
                        }}
                    >

                        {/* ADD STUDENT */}

                        <button
                            type="button"
                            onClick={() => setShowAddStudent(true)}
                            style={{
                                background: "#2563eb",
                                color: "white",
                                border: "none",
                                padding: "11px 20px",
                                borderRadius: "7px",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "600",
                                whiteSpace: "nowrap"
                            }}
                        >
                            + Add Student
                        </button>


                        {/* LOGOUT */}

                        <button
                            onClick={logout}
                            style={{
                                background: "#dc2626",
                                color: "white",
                                border: "none",
                                padding: "11px 22px",
                                borderRadius: "7px",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "600",
                                whiteSpace: "nowrap"
                            }}
                        >
                            Logout
                        </button>

                    </div>

                </div>


                {/* =================================================
                    SEARCH STUDENTS
                ================================================= */}

                <section
                    style={{
                        background: "white",
                        padding: "24px",
                        borderRadius: "12px",
                        marginBottom: "25px",
                        boxShadow:
                            "0 2px 8px rgba(0, 0, 0, 0.08)"
                    }}
                >

                    <h2
                        style={{
                            marginBottom: "8px",
                            color: "#172033",
                            fontSize: "24px"
                        }}
                    >
                        Search Students
                    </h2>

                    <p
                        style={{
                            marginBottom: "20px",
                            color: "#64748b",
                            fontSize: "14px"
                        }}
                    >
                        Search and filter registered students.
                    </p>


                    <form
                        onSubmit={handleSearch}
                        style={{
                            display: "flex",
                            gap: "10px",
                            width: "100%",
                            alignItems: "center",
                            flexWrap: "wrap"
                        }}
                    >

                        <input
                            type="text"
                            placeholder="Search name, email or student number"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            style={{
                                flex: "1",
                                minWidth: "220px",
                                height: "38px",
                                padding: "0 12px",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                outline: "none",
                                fontSize: "13px",
                                boxSizing: "border-box"
                            }}
                        />


                        <select
                            value={department}
                            onChange={(e) =>
                                setDepartment(e.target.value)
                            }
                            style={{
                                flex: "1",
                                minWidth: "180px",
                                height: "38px",
                                padding: "0 12px",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                background: "white",
                                outline: "none",
                                fontSize: "13px",
                                boxSizing: "border-box"
                            }}
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

                        </select>


                        <select
                            value={status}
                            onChange={(e) =>
                                setStatus(e.target.value)
                            }
                            style={{
                                flex: "1",
                                minWidth: "180px",
                                height: "38px",
                                padding: "0 12px",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                background: "white",
                                outline: "none",
                                fontSize: "13px",
                                boxSizing: "border-box"
                            }}
                        >

                            <option value="">
                                All Status
                            </option>

                            <option value="ACTIVE">
                                ACTIVE
                            </option>

                            <option value="INACTIVE">
                                INACTIVE
                            </option>

                        </select>


                        <button
                            type="submit"
                            style={{
                                height: "38px",
                                background: "#2563eb",
                                color: "white",
                                border: "none",
                                padding: "0 20px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "600"
                            }}
                        >
                            Search
                        </button>

                    </form>

                </section>


                {/* =================================================
                    ALL STUDENTS
                ================================================= */}

                <section
                    style={{
                        background: "white",
                        padding: "24px",
                        borderRadius: "12px",
                        boxShadow:
                            "0 2px 8px rgba(0, 0, 0, 0.08)",
                        width: "100%",
                        boxSizing: "border-box"
                    }}
                >

                    <h2
                        style={{
                            marginBottom: "8px",
                            color: "#172033",
                            fontSize: "24px"
                        }}
                    >
                        All Students
                    </h2>

                    <p
                        style={{
                            marginBottom: "20px",
                            color: "#64748b",
                            fontSize: "14px"
                        }}
                    >
                        View all registered students.
                    </p>


                    {loading ? (

                        <p
                            style={{
                                color: "#64748b",
                                padding: "20px 0"
                            }}
                        >
                            Loading students...
                        </p>

                    ) : students.length === 0 ? (

                        <p
                            style={{
                                color: "#64748b",
                                padding: "20px 0"
                            }}
                        >
                            No students found.
                        </p>

                    ) : (

                        <div
                            style={{
                                width: "100%",
                                overflowX: "auto"
                            }}
                        >

                            <table
                                style={{
                                    width: "100%",
                                    minWidth: "900px",
                                    borderCollapse: "collapse",
                                    marginTop: "10px"
                                }}
                            >

                                <thead>

                                    <tr>

                                        <th style={thStyle}>
                                            ID
                                        </th>

                                        <th style={thStyle}>
                                            Student Number
                                        </th>

                                        <th style={thStyle}>
                                            Name
                                        </th>

                                        <th style={thStyle}>
                                            Email
                                        </th>

                                        <th style={thStyle}>
                                            Department
                                        </th>

                                        <th style={thStyle}>
                                            Year
                                        </th>

                                        <th style={thStyle}>
                                            Phone
                                        </th>

                                        <th style={thStyle}>
                                            Status
                                        </th>

                                        <th style={thStyle}>
                                            Actions
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {students.map((student) => (

                                        <tr
                                            key={student.student_id}
                                        >

                                            <td style={tdStyle}>
                                                {student.student_id}
                                            </td>

                                            <td style={tdStyle}>
                                                {student.student_number}
                                            </td>

                                            <td style={tdStyle}>
                                                {student.name}
                                            </td>

                                            <td style={tdStyle}>
                                                {student.email}
                                            </td>

                                            <td style={tdStyle}>
                                                {student.department || "-"}
                                            </td>

                                            <td style={tdStyle}>
                                                {student.year || "-"}
                                            </td>

                                            <td style={tdStyle}>
                                                {student.phone || "-"}
                                            </td>

                                            <td style={tdStyle}>

                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        background:
                                                            student.status === "ACTIVE"
                                                                ? "#dcfce7"
                                                                : "#fee2e2",
                                                        color:
                                                            student.status === "ACTIVE"
                                                                ? "#166534"
                                                                : "#991b1b",
                                                        padding: "5px 10px",
                                                        borderRadius: "15px",
                                                        fontSize: "12px",
                                                        fontWeight: "bold"
                                                    }}
                                                >
                                                    {student.status}
                                                </span>

                                            </td>


                                            <td style={tdStyle}>

                                                {student.status === "ACTIVE" && (

                                                    <button
                                                        onClick={() =>
                                                            handleDeactivate(
                                                                student.student_id
                                                            )
                                                        }
                                                        style={{
                                                            background: "#dc2626",
                                                            color: "white",
                                                            border: "none",
                                                            padding: "7px 12px",
                                                            borderRadius: "5px",
                                                            cursor: "pointer",
                                                            fontSize: "12px"
                                                        }}
                                                    >
                                                        Deactivate
                                                    </button>

                                                )}


                                                {student.status === "INACTIVE" && (

                                                    <button
                                                        onClick={() =>
                                                            handleReactivate(
                                                                student.student_id
                                                            )
                                                        }
                                                        style={{
                                                            background: "#16a34a",
                                                            color: "white",
                                                            border: "none",
                                                            padding: "7px 12px",
                                                            borderRadius: "5px",
                                                            cursor: "pointer",
                                                            fontSize: "12px"
                                                        }}
                                                    >
                                                        Reactivate
                                                    </button>

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


            {/* =====================================================
                ADD STUDENT MODAL
            ===================================================== */}

            {showAddStudent && (

                <div
                    onClick={() => setShowAddStudent(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(15, 23, 42, 0.55)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2000,
                        padding: "20px",
                        boxSizing: "border-box"
                    }}
                >

                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: "620px",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            background: "white",
                            borderRadius: "14px",
                            boxShadow:
                                "0 20px 50px rgba(0, 0, 0, 0.25)",
                            padding: "28px",
                            boxSizing: "border-box"
                        }}
                    >

                        {/* MODAL HEADER */}

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "24px"
                            }}
                        >

                            <div>

                                <h2
                                    style={{
                                        margin: 0,
                                        color: "#172033",
                                        fontSize: "26px"
                                    }}
                                >
                                    Add New Student
                                </h2>

                                <p
                                    style={{
                                        marginTop: "6px",
                                        marginBottom: 0,
                                        color: "#64748b",
                                        fontSize: "14px"
                                    }}
                                >
                                    Create a new student account.
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    setShowAddStudent(false)
                                }
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    border: "none",
                                    borderRadius: "50%",
                                    background: "#f1f5f9",
                                    color: "#475569",
                                    fontSize: "20px",
                                    cursor: "pointer"
                                }}
                            >
                                ×
                            </button>

                        </div>


                        {/* FORM */}

                        <form onSubmit={handleAddStudent}>

                            {/* NAME */}

                            <div style={formGroupStyle}>

                                <label style={labelStyle}>
                                    Student Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={studentForm.name}
                                    onChange={handleStudentFormChange}
                                    placeholder="Enter student name"
                                    style={inputStyle}
                                />

                            </div>


                            {/* EMAIL */}

                            <div style={formGroupStyle}>

                                <label style={labelStyle}>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={studentForm.email}
                                    onChange={handleStudentFormChange}
                                    placeholder="Enter email address"
                                    style={inputStyle}
                                />

                            </div>


                            {/* STUDENT NUMBER */}

                            <div style={formGroupStyle}>

                                <label style={labelStyle}>
                                    Student Number
                                </label>

                                <input
                                    type="text"
                                    name="student_number"
                                    value={studentForm.student_number}
                                    onChange={handleStudentFormChange}
                                    placeholder="Example: STU002"
                                    style={inputStyle}
                                />

                            </div>


                            {/* DEPARTMENT + YEAR */}

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "1fr 1fr",
                                    gap: "16px"
                                }}
                            >

                                <div style={formGroupStyle}>

                                    <label style={labelStyle}>
                                        Department
                                    </label>

                                    <select
                                        name="department"
                                        value={
                                            studentForm.department
                                        }
                                        onChange={
                                            handleStudentFormChange
                                        }
                                        style={inputStyle}
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

                                    </select>

                                </div>


                                <div style={formGroupStyle}>

                                    <label style={labelStyle}>
                                        Year
                                    </label>

                                    <select
                                        name="year"
                                        value={studentForm.year}
                                        onChange={
                                            handleStudentFormChange
                                        }
                                        style={inputStyle}
                                    >

                                        <option value="1">
                                            1
                                        </option>

                                        <option value="2">
                                            2
                                        </option>

                                        <option value="3">
                                            3
                                        </option>

                                        <option value="4">
                                            4
                                        </option>

                                    </select>

                                </div>

                            </div>


                            {/* PHONE */}

                            <div style={formGroupStyle}>

                                <label style={labelStyle}>
                                    Phone Number
                                </label>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={studentForm.phone}
                                    onChange={handleStudentFormChange}
                                    placeholder="Enter phone number"
                                    style={inputStyle}
                                />

                            </div>


                            {/* PASSWORD */}

                            <div style={formGroupStyle}>

                                <label style={labelStyle}>
                                    Login Password
                                </label>

                                <input
                                    type="password"
                                    name="password"
                                    value={studentForm.password}
                                    onChange={handleStudentFormChange}
                                    placeholder="Create login password"
                                    style={inputStyle}
                                />

                            </div>


                            {/* BUTTONS */}

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: "12px",
                                    marginTop: "28px"
                                }}
                            >

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowAddStudent(false)
                                    }
                                    style={{
                                        background: "#e2e8f0",
                                        color: "#334155",
                                        border: "none",
                                        padding: "11px 20px",
                                        borderRadius: "7px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: "600"
                                    }}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    disabled={addingStudent}
                                    style={{
                                        background:
                                            addingStudent
                                                ? "#93c5fd"
                                                : "#2563eb",
                                        color: "white",
                                        border: "none",
                                        padding: "11px 22px",
                                        borderRadius: "7px",
                                        cursor:
                                            addingStudent
                                                ? "not-allowed"
                                                : "pointer",
                                        fontSize: "14px",
                                        fontWeight: "600"
                                    }}
                                >
                                    {addingStudent
                                        ? "Adding..."
                                        : "Add Student"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}


// =====================================================
// FORM STYLES
// =====================================================

const formGroupStyle = {
    marginBottom: "17px"
};

const labelStyle = {
    display: "block",
    marginBottom: "7px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "600"
};

const inputStyle = {
    width: "100%",
    height: "42px",
    padding: "0 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    outline: "none",
    background: "white",
    color: "#172033",
    fontSize: "14px",
    boxSizing: "border-box"
};


// =====================================================
// TABLE STYLES
// =====================================================

const thStyle = {
    padding: "13px",
    textAlign: "left",
    background: "#f1f5f9",
    color: "#172033",
    borderBottom: "1px solid #dbe2ea",
    fontSize: "13px",
    fontWeight: "700",
    whiteSpace: "nowrap"
};

const tdStyle = {
    padding: "13px",
    borderBottom: "1px solid #e2e8f0",
    color: "#172033",
    fontSize: "13px",
    whiteSpace: "nowrap"
};

export default ManageStudents;