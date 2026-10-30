
from datetime import date, timedelta
from statistics import median

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

from app.extensions import db
from app.models import Transaction

analytics_bp = Blueprint(
    "analytics",
    __name__,
    url_prefix="/api/analytics"
)


def get_user_id():
    return int(get_jwt_identity())


@analytics_bp.route("/monthly", methods=["GET"])
@jwt_required()
def monthly_analytics():
    user_id = get_user_id()

    try:
        months = int(request.args.get("months", 6))
        if months not in (6, 12):
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"message": "Months must be 6 or 12"}), 400

    today = date.today()
    current_index = today.year * 12 + today.month - 1
    start_index = current_index - months + 1

    start_year = start_index // 12
    start_month = start_index % 12 + 1
    start_date = date(start_year, start_month, 1)

    monthly_totals = {}

    for offset in range(months):
        index = start_index + offset
        year = index // 12
        month = index % 12 + 1

        monthly_totals[(year, month)] = {
            "label": date(year, month, 1).strftime("%b %Y"),
            "income": 0.0,
            "expenses": 0.0,
            "savings": 0.0
        }

    transactions = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.date >= start_date,
        Transaction.date <= today
    ).all()

    for transaction in transactions:
        key = (transaction.date.year, transaction.date.month)

        if key not in monthly_totals:
            continue

        amount = float(transaction.amount)

        if transaction.type == "income":
            monthly_totals[key]["income"] += amount
        elif transaction.type == "expense":
            monthly_totals[key]["expenses"] += amount

    for item in monthly_totals.values():
        item["savings"] = round(item["income"] - item["expenses"], 2)
        item["income"] = round(item["income"], 2)
        item["expenses"] = round(item["expenses"], 2)

    return jsonify({
        "months": list(monthly_totals.values())
    }), 200


@analytics_bp.route("/summary", methods=["GET"])
@jwt_required()
def financial_summary():
    user_id = get_user_id()
    today = date.today()

    month_start = date(today.year, today.month, 1)
    year_start = date(today.year, 1, 1)

    def calculate(start_date):
        results = db.session.query(
            Transaction.type,
            func.coalesce(func.sum(Transaction.amount), 0)
        ).filter(
            Transaction.user_id == user_id,
            Transaction.date >= start_date,
            Transaction.date <= today
        ).group_by(Transaction.type).all()

        totals = {"income": 0.0, "expense": 0.0}

        for transaction_type, amount in results:
            if transaction_type in totals:
                totals[transaction_type] = float(amount)

        totals["savings"] = totals["income"] - totals["expense"]
        return totals

    return jsonify({
        "monthly": calculate(month_start),
        "yearly": calculate(year_start),
        "generated_on": today.isoformat()
    }), 200


@analytics_bp.route("/categories", methods=["GET"])
@jwt_required()
def category_analytics():
    user_id = get_user_id()
    today = date.today()

    try:
        month = int(request.args.get("month", today.month))
        year = int(request.args.get("year", today.year))

        if not 1 <= month <= 12 or not 2000 <= year <= 2100:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid month or year"}), 400

    results = db.session.query(
        Transaction.category_id,
        func.coalesce(func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense",
        func.extract("month", Transaction.date) == month,
        func.extract("year", Transaction.date) == year
    ).group_by(Transaction.category_id).all()

    category_ids = [item[0] for item in results if item[0] is not None]

    from app.models import Category

    category_names = {
        category.id: category.name
        for category in Category.query.filter(
            (Category.user_id == user_id) | (Category.user_id.is_(None)),
            Category.id.in_(category_ids)
        ).all()
    }

    categories = [
        {
            "category": category_names.get(category_id, "Others")
            if category_id is not None else "Others",
            "amount": round(float(amount), 2)
        }
        for category_id, amount in results
    ]

    categories.sort(key=lambda item: item["amount"], reverse=True)

    total = sum(item["amount"] for item in categories)

    for item in categories:
        item["percentage"] = round(
            item["amount"] / total * 100, 2
        ) if total else 0

    return jsonify({
        "month": month,
        "year": year,
        "total_expenses": round(total, 2),
        "categories": categories
    }), 200


@analytics_bp.route("/anomalies", methods=["GET"])
@jwt_required()
def detect_anomalies():
    user_id = get_user_id()
    today = date.today()
    start_date = today - timedelta(days=180)

    transactions = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense",
        Transaction.date >= start_date,
        Transaction.date <= today
    ).order_by(Transaction.date.asc()).all()

    anomalies = []

    for transaction in transactions:
        category_name = (
            transaction.category.name
            if transaction.category else "Others"
        )

        current_amount = float(transaction.amount)
        comparison_start = transaction.date - timedelta(days=90)

        historical_amounts = [
            float(previous.amount)
            for previous in transactions
            if previous.id != transaction.id
            and previous.date >= comparison_start
            and previous.date < transaction.date
            and previous.category_id == transaction.category_id
        ]

        if len(historical_amounts) < 3:
            continue

        usual_amount = median(historical_amounts)

        if usual_amount > 0 and current_amount >= usual_amount * 2.5:
            severity = (
                "HIGH"
                if current_amount >= usual_amount * 3.5
                else "MEDIUM"
            )

            anomalies.append({
                "transaction_id": transaction.id,
                "title": transaction.title,
                "category": category_name,
                "amount": round(current_amount, 2),
                "usual_amount": round(usual_amount, 2),
                "date": transaction.date.isoformat(),
                "severity": severity,
                "reason": (
                    f"This expense is {current_amount / usual_amount:.1f} "
                    f"times your usual {category_name} spending."
                )
            })

    anomalies.sort(key=lambda item: item["date"], reverse=True)

    return jsonify({
        "message": "Expense anomaly detection completed",
        "total_anomalies": len(anomalies),
        "anomalies": anomalies
    }), 200
