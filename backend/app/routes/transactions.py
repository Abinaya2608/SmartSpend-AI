from datetime import date
from decimal import Decimal, InvalidOperation

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import User, Category, Transaction

transactions_bp = Blueprint(
    "transactions", __name__, url_prefix="/api/transactions"
)


def transaction_response(transaction):
    return {
        "id": transaction.id,
        "title": transaction.title,
        "type": transaction.type,
        "amount": float(transaction.amount),
        "category": transaction.category.name if transaction.category else "Others",
        "category_id": transaction.category_id,
        "payment_method": transaction.payment_method,
        "date": transaction.date.isoformat()
    }


def get_user_category(user_id, name, transaction_type):
    category = Category.query.filter_by(
        user_id=user_id,
        name=name,
        type=transaction_type
    ).first()

    if not category:
        category = Category(
            user_id=user_id,
            name=name,
            type=transaction_type
        )
        db.session.add(category)
        db.session.flush()

    return category


@transactions_bp.route("", methods=["GET"])
@jwt_required()
def get_transactions():
    user_id = int(get_jwt_identity())

    query = Transaction.query.filter_by(user_id=user_id)

    month = request.args.get("month")
    year = request.args.get("year")
    transaction_type = request.args.get("type")

    if month:
        try:
            month = int(month)
            if month < 1 or month > 12:
                raise ValueError
            query = query.filter(
                db.extract("month", Transaction.date) == month
            )
        except ValueError:
            return jsonify({"message": "Invalid month"}), 400

    if year:
        try:
            year = int(year)
            query = query.filter(
                db.extract("year", Transaction.date) == year
            )
        except ValueError:
            return jsonify({"message": "Invalid year"}), 400

    if transaction_type:
        if transaction_type not in ["income", "expense"]:
            return jsonify({"message": "Invalid transaction type"}), 400
        query = query.filter_by(type=transaction_type)

    transactions = query.order_by(Transaction.date.desc()).all()

    return jsonify([
        transaction_response(item) for item in transactions
    ]), 200


@transactions_bp.route("", methods=["POST"])
@jwt_required()
def add_transaction():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    title = str(data.get("title", "")).strip()
    transaction_type = data.get("type")
    category_name = str(data.get("category", "Others")).strip()
    payment_method = str(data.get("payment_method", data.get("paymentMethod", ""))).strip()

    if not title or not payment_method:
        return jsonify({"message": "Title and payment method are required"}), 400

    if transaction_type not in ["income", "expense"]:
        return jsonify({"message": "Type must be income or expense"}), 400

    try:
        amount = Decimal(str(data.get("amount", "")))
        if not amount.is_finite() or amount <= 0:
            raise InvalidOperation
    except (InvalidOperation, ValueError):
        return jsonify({"message": "Enter a valid positive amount"}), 400

    try:
        transaction_date = date.fromisoformat(
            data.get("date", date.today().isoformat())
        )
    except (ValueError, TypeError):
        return jsonify({"message": "Date must use YYYY-MM-DD format"}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    try:
        category = get_user_category(
            user_id,
            category_name or "Others",
            transaction_type
        )

        transaction = Transaction(
            user_id=user_id,
            category_id=category.id,
            title=title,
            type=transaction_type,
            amount=amount,
            payment_method=payment_method,
            date=transaction_date
        )

        db.session.add(transaction)
        db.session.commit()

        return jsonify({
            "message": "Transaction saved successfully",
            "transaction": transaction_response(transaction)
        }), 201

    except Exception:
        db.session.rollback()
        return jsonify({"message": "Unable to save transaction"}), 500


@transactions_bp.route("/<int:transaction_id>", methods=["DELETE"])
@jwt_required()
def delete_transaction(transaction_id):
    user_id = int(get_jwt_identity())

    transaction = Transaction.query.filter_by(
        id=transaction_id,
        user_id=user_id
    ).first()

    if not transaction:
        return jsonify({"message": "Transaction not found"}), 404

    db.session.delete(transaction)
    db.session.commit()

    return jsonify({"message": "Transaction deleted successfully"}), 200