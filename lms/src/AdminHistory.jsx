import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";
import LazyImage from "./components/LazyImage";

const Navbar = ({ onLogout }) => {
  return (
    <nav
      className="navbar-style"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <LazyImage
          src="/assets/apsit.png"
          alt="College Logo"
          className="navbar-logo"
          placeholder="/assets/demo.png"
        />
        <span
          style={{
            fontSize: "2.2rem",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: 1,
          }}
        >
          PCT's A. P. Shah Institute of Technology
        </span>
      </div>
      <button
        className="logout-btn"
        style={{
          background: "#e0b96a",
          color: "#2d3e2f",
          fontWeight: 600,
          fontSize: "1.1rem",
          padding: "10px 28px",
        }}
        onClick={onLogout}
      >
        <i className="fa-solid fa-right-from-bracket"></i> Logout
      </button>
    </nav>
  );
};

const AdminHistory = () => {
  const navigate = useNavigate();
  const [requestHistory, setRequestHistory] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      const raw = localStorage.getItem("user");
      if (!raw) {
        navigate("/");
        return;
      }

      let token = null;
      try {
        token = JSON.parse(raw)?.token;
      } catch {
        localStorage.removeItem("user");
        navigate("/");
        return;
      }

      if (!token) {
        navigate("/");
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:5000/admin/history", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          setRequestHistory(data.request_history || []);
          setTransactionHistory(data.transaction_history || []);
        } else if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("user");
          navigate("/");
        } else {
          setError(data.message || "Failed to load admin history");
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="admin-page-wrapper">
      <Navbar onLogout={handleLogout} />
      <div className="admin-container">
        {/* Sidebar Navigation */}
        <div className="admin-sidebar">
          <div className="sidebar-menu">
            <button
              className="menu-item"
              onClick={() =>
                navigate("/admin", { state: { activeTab: "allBooks" } })
              }
            >
              <i className="fa-solid fa-book"></i> All Books
            </button>
            <button
              className="menu-item"
              onClick={() =>
                navigate("/admin", { state: { activeTab: "userBooks" } })
              }
            >
              <i className="fa-solid fa-search"></i> View User Books
            </button>
            <button
              className="menu-item"
              onClick={() =>
                navigate("/admin", { state: { activeTab: "requests" } })
              }
            >
              <i className="fa-solid fa-hourglass-half"></i> Pending Requests
            </button>
            <button
              className="menu-item"
              onClick={() =>
                navigate("/admin", { state: { activeTab: "issuedBooks" } })
              }
            >
              <i className="fa-solid fa-book-open-reader"></i> All Issued Books
            </button>
            <button
              className="menu-item"
              onClick={() =>
                navigate("/admin", { state: { activeTab: "students" } })
              }
            >
              <i className="fa-solid fa-users"></i> Students Data
            </button>
            <button
              className="menu-item"
              onClick={() =>
                navigate("/admin", { state: { activeTab: "addBook" } })
              }
            >
              <i className="fa-solid fa-square-plus"></i> Add Book
            </button>
            <button
              className="menu-item"
              onClick={() =>
                navigate("/admin", { state: { activeTab: "analytics" } })
              }
            >
              <i className="fa-solid fa-chart-bar"></i> Analytics
            </button>
            <button
              className="menu-item active"
              onClick={() => navigate("/admin-history")}
            >
              <i className="fa-solid fa-clock-rotate-left"></i> History
            </button>
          </div>
        </div>
        <div className="admin-main-content">
          {loading && <p>Loading history...</p>}
          {error && <p style={{ color: "#c0392b" }}>{error}</p>}

          {!loading && !error && (
            <>
              <h3>All Request History</h3>
              {requestHistory.length === 0 ? (
                <p>No request history found.</p>
              ) : (
                <div
                  className="table-wrapper"
                  style={{
                    marginBottom: "24px",
                    backgroundColor: "white",
                    padding: "10px",
                    borderRadius: "10px",
                  }}
                >
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Moodle ID</th>
                        <th>Student</th>
                        <th>Book</th>
                        <th>Status</th>
                        <th>Requested On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestHistory.map((item) => (
                        <tr key={item.request_id}>
                          <td>{item.request_id}</td>
                          <td>{item.moodle_id}</td>
                          <td>{item.fullname || "-"}</td>
                          <td>{item.book_name}</td>
                          <td style={{ textTransform: "capitalize" }}>
                            {item.status}
                          </td>
                          <td>
                            {item.request_date
                              ? new Date(item.request_date).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h3>All Transaction History</h3>
              {transactionHistory.length === 0 ? (
                <p>No transaction history found.</p>
              ) : (
                <div
                  className="table-wrapper"
                  style={{
                    backgroundColor: "white",
                    padding: "10px",
                    borderRadius: "10px",
                  }}
                >
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Moodle ID</th>
                        <th>Student</th>
                        <th>Book</th>
                        <th>Issue Date</th>
                        <th>Due Date</th>
                        <th>Return Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionHistory.map((item) => (
                        <tr key={item.transaction_id}>
                          <td>{item.transaction_id}</td>
                          <td>{item.moodle_id}</td>
                          <td>{item.fullname || "-"}</td>
                          <td>{item.book_name}</td>
                          <td>
                            {item.issue_date
                              ? new Date(item.issue_date).toLocaleDateString()
                              : "-"}
                          </td>
                          <td>
                            {item.due_date
                              ? new Date(item.due_date).toLocaleDateString()
                              : "-"}
                          </td>
                          <td>
                            {item.return_date
                              ? new Date(item.return_date).toLocaleDateString()
                              : "-"}
                          </td>
                          <td style={{ textTransform: "capitalize" }}>
                            {item.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHistory;
