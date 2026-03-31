-- Create wishlist table to store books users want to borrow
CREATE TABLE IF NOT EXISTS wishlist (
    wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_id INT NOT NULL,
    book_id INT NOT NULL,
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_book_wishlist (moodle_id, book_id),
    FOREIGN KEY (moodle_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);

-- Create wishlist_notifications table to notify users when a book becomes available
CREATE TABLE IF NOT EXISTS wishlist_notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_id INT NOT NULL,
    book_id INT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (moodle_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);
