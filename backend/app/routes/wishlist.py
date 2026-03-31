from flask import Flask, Blueprint, jsonify, request, current_app
from app.db import get_connection
from datetime import datetime
import jwt

wishlist = Blueprint("wishlist", __name__)


def ensure_wishlist_tables(cursor):
    """Create wishlist and notification tables if they don't exist"""
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS wishlist (
            wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
            moodle_id INT NOT NULL,
            book_id INT NOT NULL,
            added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_book_wishlist (moodle_id, book_id),
            FOREIGN KEY (moodle_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS wishlist_notifications (
            notification_id INT AUTO_INCREMENT PRIMARY KEY,
            moodle_id INT NOT NULL,
            book_id INT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (moodle_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
        )
        """
    )


def get_user_from_token(request):
    """Extract moodle_id from JWT token"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None, ("token missing", 401)
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(
            token,
            current_app.config["SECRET_KEY"],
            algorithms=["HS256"]
        )
        return payload.get("moodle_id"), None
    except jwt.ExpiredSignatureError:
        return None, ("token expired", 401)
    except jwt.InvalidTokenError:
        return None, ("invalid token", 401)


@wishlist.route("/add-to-wishlist", methods=["POST"])
def add_to_wishlist():
    """Add a book to user's wishlist"""
    moodle_id, error = get_user_from_token(request)
    if error:
        return jsonify({"message": error[0]}), error[1]
    
    data = request.get_json()
    book_id = data.get("book_id")
    
    if not book_id:
        return jsonify({"message": "book_id is required"}), 400
    
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        ensure_wishlist_tables(cursor)
        
        # Check if book exists
        cursor.execute("SELECT book_id FROM books WHERE book_id = %s", (book_id,))
        if not cursor.fetchone():
            return jsonify({"message": "Book not found"}), 404
        
        # Check if already in wishlist
        cursor.execute(
            "SELECT wishlist_id FROM wishlist WHERE moodle_id = %s AND book_id = %s",
            (moodle_id, book_id)
        )
        if cursor.fetchone():
            return jsonify({"message": "Book already in wishlist"}), 409
        
        # Add to wishlist
        cursor.execute(
            "INSERT INTO wishlist (moodle_id, book_id) VALUES (%s, %s)",
            (moodle_id, book_id)
        )
        conn.commit()
        
        return jsonify({"message": "Book added to wishlist successfully"}), 201
    
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


@wishlist.route("/remove-from-wishlist", methods=["DELETE"])
def remove_from_wishlist():
    """Remove a book from user's wishlist"""
    moodle_id, error = get_user_from_token(request)
    if error:
        return jsonify({"message": error[0]}), error[1]
    
    data = request.get_json()
    book_id = data.get("book_id")
    
    if not book_id:
        return jsonify({"message": "book_id is required"}), 400
    
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        ensure_wishlist_tables(cursor)
        
        cursor.execute(
            "DELETE FROM wishlist WHERE moodle_id = %s AND book_id = %s",
            (moodle_id, book_id)
        )
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({"message": "Book not found in wishlist"}), 404
        
        return jsonify({"message": "Book removed from wishlist"}), 200
    
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


@wishlist.route("/wishlist", methods=["GET"])
def get_wishlist():
    """Get all books in user's wishlist with their availability status"""
    moodle_id, error = get_user_from_token(request)
    if error:
        return jsonify({"message": error[0]}), error[1]
    
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        ensure_wishlist_tables(cursor)
        
        cursor.execute("""
            SELECT 
                w.wishlist_id,
                b.book_id,
                b.book_name,
                b.publisher,
                b.description,
                b.cover_url,
                COALESCE(b.rating, 0) AS rating,
                COUNT(bc.copy_id) AS total_copies,
                COUNT(bc.copy_id) 
                - COUNT(CASE WHEN t.status = 'issued' THEN 1 END) 
                AS available_copies,
                w.added_date
            FROM wishlist w
            JOIN books b ON w.book_id = b.book_id
            LEFT JOIN book_copies bc ON b.book_id = bc.book_id
            LEFT JOIN transactions t ON bc.copy_id = t.copy_id AND t.status = 'issued'
            WHERE w.moodle_id = %s
            GROUP BY 
                w.wishlist_id,
                b.book_id,
                b.book_name,
                b.publisher,
                b.description,
                b.cover_url,
                b.rating,
                w.added_date
            ORDER BY w.added_date DESC
        """, (moodle_id,))
        
        wishlist_items = cursor.fetchall()
        
        return jsonify({
            "wishlist": wishlist_items,
            "count": len(wishlist_items)
        }), 200
    
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


@wishlist.route("/wishlist/check-availability", methods=["POST"])
def check_wishlist_availability():
    """
    Check if any wishlist items have become available
    (used to notify users when a book they want is no longer issued)
    """
    moodle_id, error = get_user_from_token(request)
    if error:
        return jsonify({"message": error[0]}), error[1]
    
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        ensure_wishlist_tables(cursor)
        
        # Find books in wishlist that now have available copies
        cursor.execute("""
            SELECT 
                b.book_id,
                b.book_name,
                COUNT(bc.copy_id) 
                - COUNT(CASE WHEN t.status = 'issued' THEN 1 END) 
                AS available_copies
            FROM wishlist w
            JOIN books b ON w.book_id = b.book_id
            LEFT JOIN book_copies bc ON b.book_id = bc.book_id
            LEFT JOIN transactions t ON bc.copy_id = t.copy_id AND t.status = 'issued'
            WHERE w.moodle_id = %s
            GROUP BY b.book_id, b.book_name
            HAVING available_copies > 0
        """, (moodle_id,))
        
        available_books = cursor.fetchall()
        
        return jsonify({
            "available_books": available_books,
            "count": len(available_books)
        }), 200
    
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()
