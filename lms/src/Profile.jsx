import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import "./Profile.css";
import LazyImage from "./components/LazyImage";

const Profile = () => {
  const [username, setUsername] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUsername(userData.moodle_id);
      setName(userData.name || "");
      setDepartment(userData.department || "");
    }
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      const user = localStorage.getItem("user");
      if (!user) return;
      const userData = JSON.parse(user);
      const token = userData?.token;
      if (!token) return;
      setHistoryLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:5000/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data.transaction_history || []);
        }
      } catch (e) {
        console.error("Error fetching history:", e);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest(".user-menu-wrapper")) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserDropdown]);

  const handleUserMenuClick = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const handleMenuOptionClick = (option) => {
    if (option === "profile") {
      navigate("/profile");
    }
    setShowUserDropdown(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleEditClick = () => {
    setEditName(name);
    setEditDepartment(department);
    setShowEditModal(true);
  };

  const handleEditSave = () => {
    setName(editName);
    setDepartment(editDepartment);

    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      userData.name = editName;
      userData.department = editDepartment;
      localStorage.setItem("user", JSON.stringify(userData));
    }
    setShowEditModal(false);
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
  };

  return (
    <div>
      <nav className="home-nav">
        <LazyImage
          className="logo-image"
          src="/assets/apsit.png"
          alt="Library Logo"
          placeholder="/assets/demo.png"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/home")}
        />
        <h1
          style={{ cursor: "pointer", display: "inline-block", marginLeft: 10 }}
          onClick={() => navigate("/home")}
        >
          PCT's A. P. Shah Institute of Technology
        </h1>
        <div className="user-section">
          <div className="user-menu-wrapper">
            <span className="user-greeting" onClick={handleUserMenuClick}>
              Hi, {username} <i className="fa-solid fa-chevron-down"></i>
            </span>
            {showUserDropdown && (
              <div className="user-dropdown">
                <div
                  className="user-dropdown-option"
                  onClick={() => handleMenuOptionClick("profile")}
                >
                  <i className="fa-solid fa-user"></i> Profile
                </div>
              </div>
            )}
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i> Logout
          </button>
        </div>
      </nav>
      {/* Nav ends here*/}

      {/* Profile card below navbar */}
      <div className="profile-content">
        <div className="profile-card">
          <LazyImage
            src="/assets/profile-icon.png"
            alt="Profile"
            className="profile-avatar"
            placeholder="/assets/demo.png"
          />
          <div className="profile-details">
            <div>
              <b>Name:</b> {name}
            </div>
            <div>
              <b>Email:</b> {username ? `${username}@apsit.edu.in` : ""}
            </div>
            <div>
              <b>Department:</b> {department}
            </div>

            {/*Profile edit karneko*/}
            <div>
              <span className="profile-edit-link" onClick={handleEditClick}>
                Edit
              </span>
            </div>
          </div>
        </div>

        {/* History Card */}
        <div className="profile-card profile-history-card">
          <h2 className="profile-history-heading">History</h2>
          {historyLoading ? (
            <div className="history-loading">
              <i className="fa-solid fa-spinner fa-spin"></i> Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="history-empty">No past borrowed books</div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.transaction_id}>
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
                      <td>
                        <span className={`history-status ${item.status}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {showEditModal && (
          <div className="profile-edit-overlay">
            <div className="profile-edit-modal">
              <h3>Edit Profile</h3>
              <div className="profile-edit-form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="profile-edit-form-group">
                <label>Department:</label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                />
              </div>
              <div className="profile-edit-modal-actions">
                <button onClick={handleEditSave} className="profile-edit-save">
                  Save
                </button>
                <button
                  onClick={handleEditCancel}
                  className="profile-edit-cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
