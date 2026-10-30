
from datetime import date

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models import Transaction


wallet_bp = Blueprint(
    "wallet",
    __name__,
    url_prefix="/api/wallet"
)


@wallet_bp.route("", methods=["GET"])
@jwt_required()
def get_wallet():

    user_id = int(get_jwt_identity())

    try:
        # Fetch all transactions belonging to the logged-in user.
        all_transactions = Transaction.query.filter_by(
            user_id=user_id
        ).order_by(
            Transaction.date.desc(),
            Transaction.created_at.desc()
        ).all()

        total_income = 0.0
        total_expenses = 0.0
        payment_methods = {}

        for transaction in all_transactions:
            amount = float(transaction.amount)

            if transaction.type == "income":
                total_income += amount

            elif transaction.type == "expense":
                total_expenses += amount

                method = transaction.payment_method or "Other"
                payment_methods[method] = (
                    payment_methods.get(method, 0) + amount
                )

        # Apply filters only to the transaction history.
        filtered_transactions = all_transactions

        month = request.args.get("month", type=int)
        year = request.args.get("year", type=int)
        transaction_type = request.args.get("type")
        payment_method = request.args.get("payment_method")

        if month is not None:
            if month < 1 or month > 12:
                return jsonify({"message": "Invalid month."}), 400

            filtered_transactions = [
                t for t in filtered_transactions
                if t.date.month == month
            ]

        if year is not None:
            if year < 2000 or year > 2100:
                return jsonify({"message": "Invalid year."}), 400

            filtered_transactions = [
                t for t in filtered_transactions
                if t.date.year == year
            ]

        if transaction_type:
            if transaction_type not in ("income", "expense"):
                return jsonify({
                    "message": "Invalid transaction type."
                }), 400

            filtered_transactions = [
                t for t in filtered_transactions
                if t.type == transaction_type
            ]

        if payment_method:
            filtered_transactions = [
                t for t in filtered_transactions
                if t.payment_method == payment_method
            ]

        # Current month's totals.
        today = date.today()

        current_month_transactions = [
            t for t in all_transactions
            if t.date.month == today.month
            and t.date.year == today.year
        ]

        monthly_income = sum(
            float(t.amount)
            for t in current_month_transactions
            if t.type == "income"
        )

        monthly_expenses = sum(
            float(t.amount)
            for t in current_month_transactions
            if t.type == "expense"
        )

        transaction_data = []

        for transaction in filtered_transactions:
            transaction_data.append({
                "id": transaction.id,
                "title": transaction.title,
                "type": transaction.type,
                "amount": float(transaction.amount),
                "category": (
                    transaction.category.name
                    if transaction.category else "Others"
                ),
                "payment_method": transaction.payment_method,
                "date": transaction.date.isoformat()
            })

        return jsonify({
            "summary": {
                "total_balance": round(
                    total_income - total_expenses, 2
                ),
                "total_income": round(total_income, 2),
                "total_expenses": round(total_expenses, 2),
                "monthly_income": round(monthly_income, 2),
                "monthly_expenses": round(monthly_expenses, 2)
            },
            "payment_methods": [
                {
                    "name": name,
                    "amount": round(amount, 2)
                }
                for name, amount in sorted(
                    payment_methods.items(),
                    key=lambda item: item[1],
                    reverse=True
                )
            ],
            "transactions": transaction_data,
            "transaction_count": len(transaction_data)
        }), 200

    except Exception:
        import traceback
        traceback.print_exc()

        return jsonify({
            "message": "Unable to load wallet information."
        }), 500
