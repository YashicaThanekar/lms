# Wishlist Feature Setup Guide

## Overview
The Wishlist feature allows users to save books they want to borrow when they become available. Books that are currently issued can be wishlisted and users will be able to see availability status.

## Setup Instructions

### 1. Database Setup
Run the SQL script to create the required tables:

```bash
# Connect to your MySQL database and run:
mysql -u your_user -p your_database < backend/create_wishlist_table.sql
```

Or run these queries directly in your MySQL client:

```sql
-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_id INT NOT NULL,
    book_id INT NOT NULL,
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_book_wishlist (moodle_id, book_id),
    FOREIGN KEY (moodle_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);

-- Create wishlist notifications table (for future notifications)
CREATE TABLE IF NOT EXISTS wishlist_notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_id INT NOT NULL,
    book_id INT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (moodle_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);
```

### 2. Backend Setup
The wishlist routes are already integrated. Make sure your backend is running:

```bash
cd backend
python run.py
```

### 3. Features Available

#### For Users:
1. **View Wishlist** - Click the heart icon in the top-right navigation
2. **Add to Wishlist** - Click the heart button on any book card
3. **Remove from Wishlist** - Click the heart button again or from the wishlist modal
4. **Check Availability** - Wishlist shows whether books are available or waiting for return

#### API Endpoints Available:

```
POST /add-to-wishlist
  Body: { "book_id": <int> }
  Returns: 201 Created or 409 Conflict (already in wishlist)

DELETE /remove-from-wishlist
  Body: { "book_id": <int> }
  Returns: 200 OK or 404 Not Found

GET /wishlist
  Returns: {
    "wishlist": [
      {
        "wishlist_id": <int>,
        "book_id": <int>,
        "book_name": <string>,
        "publisher": <string>,
        "cover_url": <string>,
        "rating": <float>,
        "available_copies": <int>,
        "total_copies": <int>,
        "added_date": <timestamp>
      }
    ],
    "count": <int>
  }

POST /wishlist/check-availability
  Returns: {
    "available_books": [
      {
        "book_id": <int>,
        "book_name": <string>,
        "available_copies": <int>
      }
    ],
    "count": <int>
  }
```

## Frontend Components

### Files Modified:
- **[Home.jsx](lms/src/Home.jsx)** - Main dashboard with wishlist integration
- **[Home.css](lms/src/Home.css)** - Wishlist button and card styles

### Files Created:
- **[Wishlist.jsx](lms/src/components/Wishlist.jsx)** - Wishlist modal component
- **[Wishlist.css](lms/src/components/Wishlist.css)** - Wishlist modal styling

## UI/UX Features

1. **Wishlist Badge** - Shows count of wishlisted books in the navbar
2. **Heart Button on Book Cards** - Quick add/remove from wishlist
3. **Wishlist Modal** - Detailed view of all wishlisted books with:
   - Book cover image (lazy loaded)
   - Title, publisher, description
   - Rating with star display
   - Availability status (Available / Waiting for return)
   - Date added
   - Remove button

4. **Notifications** - Toast notifications for user actions

## Technical Details

### Database Relations
- **wishlist** table links users with books
- Unique constraint prevents duplicate entries
- Foreign keys ensure data integrity with CASCADE delete

### Frontend Implementation
- Uses JWT token authentication from Redux/LocalStorage
- Uses Intersection Observer for lazy loading images
- Responsive design for mobile and desktop
- Smooth animations and transitions

## Future Enhancements
1. Email notifications when books become available
2. Automatic request creation when book becomes available
3. Wishlist sharing with other users
4. Wishlist collections/folders
5. Add suggested books to wishlist based on ratings/categories

## Troubleshooting

### "Book not found in wishlist" error
- Browser cache might be outdated. Hard refresh the page (Ctrl+Shift+R)

### "Authentication failed" error
- Make sure you're logged in
- Check that the Bearer token is valid

### Wishlist not persisting
- Verify the database tables are created correctly
- Check MySQL connection in backend logs

---

**Setup Status:** ✅ Complete and Ready to Use!
