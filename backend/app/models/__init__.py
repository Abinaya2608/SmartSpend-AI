from datetime import datetime, date
from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    transactions = db.relationship(
        "Transaction", back_populates="user", cascade="all, delete-orphan"
    )
    budgets = db.relationship(
        "Budget", back_populates="user", cascade="all, delete-orphan"
    )
    categories = db.relationship(
        "Category", back_populates="user", cascade="all, delete-orphan"
    )


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=True
    )
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # income or expense

    user = db.relationship("User", back_populates="categories")
    transactions = db.relationship("Transaction", back_populates="category")


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    category_id = db.Column(
        db.Integer, db.ForeignKey("categories.id"), nullable=True
    )
    title = db.Column(db.String(150), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # income or expense
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    date = db.Column(db.Date, nullable=False, default=date.today)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="transactions")
    category = db.relationship("Category", back_populates="transactions")


class Budget(db.Model):
    __tablename__ = "budgets"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    total_limit = db.Column(db.Numeric(12, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="budgets")

    __table_args__ = (
        db.UniqueConstraint(
            "user_id", "month", "year",
            name="unique_user_monthly_budget"
        ),
    )