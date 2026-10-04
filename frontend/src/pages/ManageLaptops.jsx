import { useEffect, useState } from "react";

import AdminSidebar from "../components/AdminSidebar";

import "./ManageLaptops.css";

function ManageLaptops() {

    const [laptops, setLaptops] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [formData, setFormData] = useState({
        laptop_code: "",
        brand: "",
        model: "",
        processor: "",
        ram: "",
        storage: "",
        operating_system: "",
        condition_status: "Good",
        purchase_date: ""
    });

    const token = localStorage.getItem("token");


    // =========================================
    // LOAD LAPTOPS
    // =========================================

    const loadLaptops = async () => {

        try {

            const response = await fetch(
                "http://127.0.0.1:3000/api/laptops",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (
                response.ok &&
                Array.isArray(data.laptops)
            ) {
                setLaptops(data.laptops);
            }

        } catch (error) {

            console.error(
                "Laptop loading error:",
                error
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {

        if (!token) {

            window.location.href = "/";
            return;
        }

        loadLaptops();

    }, []);


    // =========================================
    // HANDLE INPUT
    // =========================================

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };


    // =========================================
    // RESET FORM
    // =========================================

    const resetForm = () => {

        setFormData({
            laptop_code: "",
            brand: "",
            model: "",
            processor: "",
            ram: "",
            storage: "",
            operating_system: "",
            condition_status: "Good",
            purchase_date: ""
        });

        setEditingId(null);
        setShowForm(false);
    };


    // =========================================
    // ADD LAPTOP
    // =========================================

    const addLaptop = async (e) => {

        e.preventDefault();

        try {

            const response = await fetch(
                "http://127.0.0.1:3000/api/admin/laptops",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify(formData)
                }
            );

            const data = await response.json();

            if (!response.ok) {

                alert(
                    data.error ||
                    "Failed to add laptop"
                );

                return;
            }

            alert(
                "Laptop added successfully!"
            );

            resetForm();

            loadLaptops();

        } catch (error) {

            console.error(
                "Add laptop error:",
                error
            );

            alert(
                "Could not connect to server."
            );
        }
    };


    // =========================================
    // START EDIT
    // =========================================

    const startEdit = (laptop) => {

        setEditingId(
            laptop.laptop_id
        );

        setFormData({
            laptop_code:
                laptop.laptop_code || "",

            brand:
                laptop.brand || "",

            model:
                laptop.model || "",

            processor:
                laptop.processor || "",

            ram:
                laptop.ram || "",

            storage:
                laptop.storage || "",

            operating_system:
                laptop.operating_system || "",

            condition_status:
                laptop.condition_status || "Good",

            purchase_date:
                laptop.purchase_date
                    ? laptop.purchase_date.substring(0, 10)
                    : ""
        });

        setShowForm(true);
    };


    // =========================================
    // UPDATE LAPTOP
    // =========================================

    const updateLaptop = async (e) => {

        e.preventDefault();

        try {

            const response = await fetch(
                `http://127.0.0.1:3000/api/admin/laptops/${editingId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify(formData)
                }
            );

            const data = await response.json();

            if (!response.ok) {

                alert(
                    data.error ||
                    "Failed to update laptop"
                );

                return;
            }

            alert(
                "Laptop updated successfully!"
            );

            resetForm();

            loadLaptops();

        } catch (error) {

            console.error(
                "Update laptop error:",
                error
            );

            alert(
                "Could not connect to server."
            );
        }
    };


    // =========================================
    // DEACTIVATE LAPTOP
    // =========================================

    const deactivateLaptop = async (id) => {

        const confirmDeactivate =
            window.confirm(
                "Are you sure you want to deactivate this laptop?"
            );

        if (!confirmDeactivate) {
            return;
        }

        try {

            const response = await fetch(
                `http://127.0.0.1:3000/api/admin/laptops/${id}/deactivate`,
                {
                    method: "PUT",

                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {

                alert(
                    data.error ||
                    "Failed to deactivate laptop"
                );

                return;
            }

            alert(
                "Laptop deactivated successfully!"
            );

            loadLaptops();

        } catch (error) {

            console.error(
                "Deactivate error:",
                error
            );

            alert(
                "Could not connect to server."
            );
        }
    };


    // =========================================
    // CLEAR FILTERS
    // =========================================

    const clearFilters = () => {

        setSearchTerm("");
        setStatusFilter("ALL");

    };


    // =========================================
    // FILTER LAPTOPS
    // =========================================

    const filteredLaptops =
        laptops.filter((laptop) => {

            const search =
                searchTerm
                    .toLowerCase()
                    .trim();

            const matchesSearch =
                search === "" ||

                String(
                    laptop.laptop_code || ""
                )
                    .toLowerCase()
                    .includes(search) ||

                String(
                    laptop.brand || ""
                )
                    .toLowerCase()
                    .includes(search) ||

                String(
                    laptop.model || ""
                )
                    .toLowerCase()
                    .includes(search) ||

                String(
                    laptop.processor || ""
                )
                    .toLowerCase()
                    .includes(search);

            const matchesStatus =
                statusFilter === "ALL" ||
                String(
                    laptop.status || ""
                ).toUpperCase() === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        });


    // =========================================
    // LOGOUT
    // =========================================

    const logout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");

        window.location.href = "/";
    };


    // =========================================
    // LOADING
    // =========================================

    if (loading) {

        return (

            <div className="laptops-page">

                <AdminSidebar />

                <main className="laptops-main">

                    <div className="laptops-loading">
                        Loading laptops...
                    </div>

                </main>

            </div>
        );
    }


    return (

        <div className="laptops-page">

            {/* COMMON SIDEBAR */}

            <AdminSidebar />


            {/* MAIN */}

            <main className="laptops-main">

                {/* =================================
                    HEADER
                ================================= */}

                <header className="laptops-header">

                    <div>

                        <h1>
                            Manage Laptops
                        </h1>

                        <p>
                            Add, edit and manage
                            library laptops.
                        </p>

                    </div>

                    <button
                        className="laptops-logout"
                        onClick={logout}
                    >
                        Logout
                    </button>

                </header>


                {/* =================================
                    ADD LAPTOP BUTTON
                ================================= */}

                <button
                    className="laptops-add-btn"
                    onClick={() => {

                        if (showForm) {
                            resetForm();
                        } else {
                            setShowForm(true);
                        }

                    }}
                >
                    {showForm
                        ? "Close Form"
                        : "+ Add Laptop"}
                </button>


                {/* =================================
                    FORM
                ================================= */}

                {showForm && (

                    <section className="laptops-form-card">

                        <h2>
                            {editingId
                                ? "Edit Laptop"
                                : "Add New Laptop"}
                        </h2>

                        <form
                            onSubmit={
                                editingId
                                    ? updateLaptop
                                    : addLaptop
                            }
                        >

                            <div className="laptops-form-grid">

                                <input
                                    name="laptop_code"
                                    placeholder="Laptop Code"
                                    value={
                                        formData.laptop_code
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                    disabled={
                                        !!editingId
                                    }
                                />

                                <input
                                    name="brand"
                                    placeholder="Brand"
                                    value={
                                        formData.brand
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                                <input
                                    name="model"
                                    placeholder="Model"
                                    value={
                                        formData.model
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                                <input
                                    name="processor"
                                    placeholder="Processor"
                                    value={
                                        formData.processor
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                                <input
                                    name="ram"
                                    placeholder="RAM"
                                    value={
                                        formData.ram
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                                <input
                                    name="storage"
                                    placeholder="Storage"
                                    value={
                                        formData.storage
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                                <input
                                    name="operating_system"
                                    placeholder="Operating System"
                                    value={
                                        formData.operating_system
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                                <input
                                    name="condition_status"
                                    placeholder="Condition"
                                    value={
                                        formData.condition_status
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                                <input
                                    type="date"
                                    name="purchase_date"
                                    value={
                                        formData.purchase_date
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </div>


                            <div className="laptops-form-buttons">

                                <button
                                    type="submit"
                                    className="laptops-submit-btn"
                                >
                                    {editingId
                                        ? "Update Laptop"
                                        : "Add Laptop"}
                                </button>

                                <button
                                    type="button"
                                    className="laptops-cancel-btn"
                                    onClick={
                                        resetForm
                                    }
                                >
                                    Cancel
                                </button>

                            </div>

                        </form>

                    </section>
                )}


                {/* =================================
                    SEARCH & FILTER
                ================================= */}

                <section className="laptops-filter-card">

                    <div className="laptops-filter-header">

                        <div>

                            <h2>
                                🔍 Search & Filter
                            </h2>

                            <p>
                                Find laptops quickly
                                using the search box
                                or status filter.
                            </p>

                        </div>

                        <button
                            className="laptops-clear-btn"
                            onClick={clearFilters}
                        >
                            ✕ Clear Filters
                        </button>

                    </div>


                    <div className="laptops-filter-row">

                        <div className="laptops-search-box">

                            <span>
                                🔍
                            </span>

                            <input
                                type="text"
                                placeholder="Search by code, brand, model or processor..."
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(
                                        e.target.value
                                    )
                                }
                            />

                        </div>


                        <label className="laptops-status-label">
                            Status
                        </label>

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                        >

                            <option value="ALL">
                                All Status
                            </option>

                            <option value="AVAILABLE">
                                Available
                            </option>

                            <option value="ISSUED">
                                Issued
                            </option>

                            <option value="MAINTENANCE">
                                Maintenance
                            </option>

                            <option value="INACTIVE">
                                Inactive
                            </option>

                        </select>

                    </div>


                    <p className="laptops-count">

                        Showing{" "}

                        <strong>
                            {filteredLaptops.length}
                        </strong>{" "}

                        of{" "}

                        <strong>
                            {laptops.length}
                        </strong>{" "}

                        laptops

                    </p>

                </section>


                {/* =================================
                    LAPTOP TABLE
                ================================= */}

                <section className="laptops-table-card">

                    <h2>
                        All Laptops
                    </h2>

                    {filteredLaptops.length === 0 ? (

                        <div className="laptops-no-results">

                            <div>
                                💻
                            </div>

                            <h3>
                                No laptops found
                            </h3>

                            <p>
                                Try changing your
                                search or filter.
                            </p>

                            {(searchTerm ||
                                statusFilter !== "ALL") && (

                                <button
                                    onClick={
                                        clearFilters
                                    }
                                >
                                    Clear Search & Filters
                                </button>

                            )}

                        </div>

                    ) : (

                        <div className="laptops-table-wrapper">

                            <table className="laptops-table">

                                <thead>

                                    <tr>
                                        <th>Code</th>
                                        <th>Brand</th>
                                        <th>Model</th>
                                        <th>Processor</th>
                                        <th>RAM</th>
                                        <th>Storage</th>
                                        <th>OS</th>
                                        <th>Condition</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {filteredLaptops.map(
                                        (laptop) => (

                                            <tr
                                                key={
                                                    laptop.laptop_id
                                                }
                                            >

                                                <td>
                                                    {
                                                        laptop.laptop_code
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        laptop.brand
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        laptop.model
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        laptop.processor
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        laptop.ram
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        laptop.storage
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        laptop.operating_system
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        laptop.condition_status
                                                    }
                                                </td>

                                                <td>

                                                    <span
                                                        className={`laptops-status laptops-status-${String(
                                                            laptop.status || ""
                                                        ).toLowerCase()}`}
                                                    >
                                                        {
                                                            laptop.status
                                                        }
                                                    </span>

                                                </td>

                                                <td>

                                                    {laptop.status !==
                                                        "INACTIVE" && (

                                                        <div className="laptops-action-buttons">

                                                            <button
                                                                className="laptops-edit-btn"
                                                                onClick={() =>
                                                                    startEdit(
                                                                        laptop
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                className="laptops-deactivate-btn"
                                                                onClick={() =>
                                                                    deactivateLaptop(
                                                                        laptop.laptop_id
                                                                    )
                                                                }
                                                            >
                                                                Deactivate
                                                            </button>

                                                        </div>
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

        </div>
    );
}

export default ManageLaptops;