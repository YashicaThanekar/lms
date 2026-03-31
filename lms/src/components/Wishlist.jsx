import React, { useState, useEffect } from "react";

const Wishlist = ({ onClose, userToken }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const DEFAULT_COVER = "/assets/demo.png";

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://127.0.0.1:5000/wishlist", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data.wishlist || []);
        setError("");
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || "Failed to load wishlist");
      }
    } catch (err) {
      console.error("Fetch wishlist error:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (bookId) => {
    try {
      setRemovingId(bookId);
      const response = await fetch("http://127.0.0.1:5000/remove-from-wishlist", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ book_id: bookId }),
      });

      if (response.ok) {
        setWishlistItems((prev) =>
          prev.filter((item) => item.book_id !== bookId)
        );
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.message || "Failed to remove from wishlist");
      }
    } catch (err) {
      console.error("Remove from wishlist error:", err);
      alert("Failed to connect to server");
    } finally {
      setRemovingId(null);
    }
  };

  const renderStars = (rating) => {
    const normalized = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    return (
      <span style={{ color: "#f4b400", fontSize: "0.9rem" }}>
        {Array.from({ length: 5 }, (_, index) => (
          <i
            key={index}
            className={
              index < normalized ? "fa-solid fa-star" : "fa-regular fa-star"
            }
            style={{ marginRight: 2 }}
          ></i>
        ))}
      </span>
    );
  };

  return (
    <div className="wishlist-overlay" onClick={onClose}>
      <div className="wishlist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wishlist-header">
          <h2>
            <i className="fa-solid fa-heart"></i> My Wishlist
          </h2>
          <button className="wishlist-close" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="wishlist-content">
          {loading ? (
            <div className="wishlist-empty">
              <p>Loading wishlist...</p>
            </div>
          ) : error ? (
            <div className="wishlist-empty" style={{ color: "#c0392b" }}>
              <p>{error}</p>
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="wishlist-empty">
              <i className="fa-solid fa-heart" style={{ fontSize: "2rem" }}></i>
              <p>Your wishlist is empty</p>
              <p style={{ fontSize: "0.9rem", color: "#666" }}>
                Add books you want to borrow when they become available
              </p>
            </div>
          ) : (
            <div className="wishlist-items">
              {wishlistItems.map((item) => (
                <div key={item.book_id} className="wishlist-item">
                  <img
                    src={item.cover_url || DEFAULT_COVER}
                    alt={item.book_name}
                    className="wishlist-cover"
                  />
                  <div className="wishlist-item-details">
                    <h4>{item.book_name}</h4>
                    <p className="wishlist-publisher">{item.publisher}</p>
                    <p className="wishlist-description">{item.description}</p>
                    <div className="wishlist-rating">
                      {renderStars(item.rating)}
                      <span style={{ marginLeft: 6, fontSize: "0.85rem" }}>
                        {Number(item.rating || 0).toFixed(1)}
                      </span>
                    </div>
                    <div className="wishlist-availability">
                      {item.available_copies > 0 ? (
                        <span className="availability-available">
                          <i className="fa-solid fa-check-circle"></i> Available
                          ({item.available_copies}/{item.total_copies})
                        </span>
                      ) : (
                        <span className="availability-unavailable">
                          <i className="fa-solid fa-clock"></i> Waiting for return
                          (0/{item.total_copies})
                        </span>
                      )}
                    </div>
                    <p className="wishlist-added">
                      Added: {new Date(item.added_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    className="wishlist-remove-btn"
                    onClick={() => handleRemoveFromWishlist(item.book_id)}
                    disabled={removingId === item.book_id}
                  >
                    {removingId === item.book_id ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i> Removing
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-heart-crack"></i> Remove
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
