
from datetime import date
from decimal import Decimal, InvalidOperation

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import Budget, Transaction


budgets_bp = Blueprint("budgets", __name__, url_prefix="/api/budgets")


def budget_response(budget, user_id):
    expenses = db.session.query(
        db.func.coalesce(db.func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense",
        db.extract("month", Transaction.date) == budget.month,
        db.extract("year", Transaction.date) == budget.year
    ).scalar()

    spent = Decimal(str(expenses))
    limit = Decimal(str(budget.total_limit))
    remaining = limit - spent

    percentage = float((spent / limit) * 100) if limit > 0 else 0

    return {
        "id": budget.id,
        "month": budget.month,
        "year": budget.year,
        "total_limit": float(limit),
        "total_expenses": float(spent),
        "remaining": float(remaining),
        "percentage": round(percentage, 2),
        "status": (
            "EXCEEDED" if percentage > 100
            else "WARNING" if percentage >= 80
            else "NORMAL"
        ),
        "created_at": budget.created_at.isoformat()
    }


def validate_budget_amount(value):
    try:
        amount = Decimal(str(value))
        if not amount.is_finite() or amount <= 0:
            raise InvalidOperation
        return amount
    except (InvalidOperation, ValueError, TypeError):
        return None


@budgets_bp.route("", methods=["GET"])
@jwt_required()
def get_budget():
    user_id = int(get_jwt_identity())
    today = date.today()

    try:
        month = int(request.args.get("month", today.month))
        year = int(request.args.get("year", today.year))
        if not 1 <= month <= 12 or not 2000 <= year <= 2100:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid month or year"}), 400

    budget = Budget.query.filter_by(
        user_id=user_id, month=month, year=year
    ).first()

    if not budget:
        return jsonify({
            "budget": None,
            "message": "No budget set for this month",
            "total_expenses": 0,
            "remaining": 0,
            "percentage": 0
        }), 200

    return jsonify({"budget": budget_response(budget, user_id)}), 200


@budgets_bp.route("/history", methods=["GET"])
@jwt_required()
def budget_history():
    user_id = int(get_jwt_identity())

    budgets = Budget.query.filter_by(
        user_id=user_id
    ).order_by(
        Budget.year.desc(), Budget.month.desc()
    ).all()

    return jsonify({
        "budgets": [
            budget_response(budget, user_id) for budget in budgets
        ]
    }), 200


@budgets_bp.route("", methods=["POST"])
@jwt_required()
def create_or_update_budget():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    today = date.today()

    try:
        month = int(data.get("month", today.month))
        year = int(data.get("year", today.year))
        if not 1 <= month <= 12 or not 2000 <= year <= 2100:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid month or year"}), 400

    total_limit = validate_budget_amount(data.get("total_limit"))
    if total_limit is None:
        return jsonify({
            "message": "Enter a valid positive budget amount"
        }), 400

    try:
        budget = Budget.query.filter_by(
            user_id=user_id, month=month, year=year
        ).first()

        if budget:
            budget.total_limit = total_limit
            message = "Budget updated successfully"
            status = 200
        else:
            budget = Budget(
                user_id=user_id,
                month=month,
                year=year,
                total_limit=total_limit
            )
            db.session.add(budget)
            message = "Budget created successfully"
            status = 201

        db.session.commit()

        return jsonify({
            "message": message,
            "budget": budget_response(budget, user_id)
        }), status

    except Exception:
        db.session.rollback()
        return jsonify({"message": "Unable to save budget"}), 500


@budgets_bp.route("/<int:budget_id>", methods=["PUT"])
@jwt_required()
def update_budget(budget_id):
    user_id = int(get_jwt_identity())

    budget = Budget.query.filter_by(
        id=budget_id, user_id=user_id
    ).first()

    if not budget:
        return jsonify({"message": "Budget not found"}), 404

    data = request.get_json(silent=True) or {}
    total_limit = validate_budget_amount(data.get("total_limit"))

    if total_limit is None:
        return jsonify({
            "message": "Enter a valid positive budget amount"
        }), 400

    try:
        budget.total_limit = total_limit
        db.session.commit()
        return jsonify({
            "message": "Budget updated successfully",
            "budget": budget_response(budget, user_id)
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Unable to update budget"}), 500


@budgets_bp.route("/<int:budget_id>", methods=["DELETE"])
@jwt_required()
def delete_budget(budget_id):
    user_id = int(get_jwt_identity())

    budget = Budget.query.filter_by(
        id=budget_id, user_id=user_id
    ).first()

    if not budget:
        return jsonify({"message": "Budget not found"}), 404

    try:
        db.session.delete(budget)
        db.session.commit()
        return jsonify({"message": "Budget deleted successfully"}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Unable to delete budget"}), 500
