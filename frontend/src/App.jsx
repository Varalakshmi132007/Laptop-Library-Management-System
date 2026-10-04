import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";

import AdminDashboard from "./pages/AdminDashboard";
import ManageLaptops from "./pages/ManageLaptops";
import ManageStudents from "./pages/ManageStudents";
import ManageRequests from "./pages/ManageRequests";
import Borrowings from "./pages/Borrowings";
import Maintenance from "./pages/Maintenance";
import Reports from "./Reports";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* LOGIN */}
                <Route
                    path="/"
                    element={<Login />}
                />

                {/* STUDENT */}
                <Route
                    path="/student"
                    element={<StudentDashboard />}
                />

                {/* ADMIN DASHBOARD */}
                <Route
                    path="/admin"
                    element={<AdminDashboard />}
                />

                {/* ADMIN LAPTOPS */}
                <Route
                    path="/admin/laptops"
                    element={<ManageLaptops />}
                />

                {/* ADMIN STUDENTS */}
                <Route
                    path="/admin/students"
                    element={<ManageStudents />}
                />

                {/* ADMIN REQUESTS */}
                <Route
                    path="/admin/requests"
                    element={<ManageRequests />}
                />

                {/* ADMIN BORROWINGS */}
                <Route
                    path="/admin/borrowings"
                    element={<Borrowings />}
                />

                {/* ADMIN MAINTENANCE */}
                <Route
                    path="/admin/maintenance"
                    element={<Maintenance />}
                />

                {/* ADMIN REPORTS */}
                <Route
                    path="/admin/reports"
                    element={<Reports />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;