import { useLocation, useNavigate } from "react-router-dom";
import "./AdminSidebar.css";

function AdminSidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            icon: "📊",
            name: "Dashboard",
            path: "/admin",
        },
        {
            icon: "💻",
            name: "Laptops",
            path: "/admin/laptops",
        },
        {
            icon: "👨‍🎓",
            name: "Students",
            path: "/admin/students",
        },
        {
            icon: "📋",
            name: "Requests",
            path: "/admin/requests",
        },
        {
            icon: "📚",
            name: "Borrowings",
            path: "/admin/borrowings",
        },
        {
            icon: "🔧",
            name: "Maintenance",
            path: "/admin/maintenance",
        },
        {
            icon: "📈",
            name: "Reports",
            path: "/admin/reports",
        },
    ];

    return (
        <aside className="common-admin-sidebar">

            {/* LOGO */}
            <div className="common-sidebar-logo">
                <span className="sidebar-logo-full">
                    💻 Laptop Library
                </span>

                <span className="sidebar-logo-mobile">
                    💻
                </span>
            </div>

            {/* MENU */}
            <nav className="common-sidebar-menu">

                {menuItems.map((item) => {

                    const isActive =
                        location.pathname === item.path;

                    return (
                        <button
                            key={item.path}
                            type="button"
                            className={
                                isActive
                                    ? "common-sidebar-link active"
                                    : "common-sidebar-link"
                            }
                            onClick={() => navigate(item.path)}
                        >
                            <span className="common-sidebar-icon">
                                {item.icon}
                            </span>

                            <span className="common-sidebar-text">
                                {item.name}
                            </span>
                        </button>
                    );
                })}

            </nav>
        </aside>
    );
}

export default AdminSidebar;