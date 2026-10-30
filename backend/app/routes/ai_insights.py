
import json
import time
from datetime import date

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from google import genai
from google.genai import errors

from app.extensions import db
from app.models import Transaction, Budget
from config import Config


ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")


def generate_fallback_insights(data):
    """Generate three data-based insights when Gemini is unavailable."""

    income = data["total_income"]
    expenses = data["total_expenses"]
    savings = data["savings"]
    budget = data["budget_limit"]
    remaining = data["remaining_budget"]
    categories = data["top_expense_categories"]

    # 1. Spending pattern
    if not data["has_transactions"]:
        spending = {
            "title": "Start Tracking Your Spending",
            "description": (
                "You have no transactions recorded this month. "
                "Add your income and expenses to understand your spending."
            )
        }
    elif categories:
        top_category = categories[0]
        spending = {
            "title": "Your Highest Spending Category",
            "description": (
                f"{top_category['category']} is your highest expense "
                f"category at ₹{top_category['amount']:,.2f} this month."
            )
        }
    else:
        spending = {
            "title": "No Expenses Recorded",
            "description": (
                "You have recorded income but no expenses this month. "
                "Continue tracking your transactions."
            )
        }

    # 2. Budget analysis
    if budget <= 0:
        budget_insight = {
            "title": "Set a Monthly Budget",
            "description": (
                "You haven't set a monthly budget yet. "
                "Create one to monitor your expenses and manage spending."
            )
        }
    elif remaining < 0:
        budget_insight = {
            "title": "Budget Exceeded",
            "description": (
                f"You have exceeded your monthly budget by "
                f"₹{abs(remaining):,.2f}. Review non-essential expenses."
            )
        }
    else:
        used_percentage = (expenses / budget) * 100 if budget else 0

        budget_insight = {
            "title": "Monthly Budget Status",
            "description": (
                f"You have used {used_percentage:.1f}% of your budget "
                f"and have ₹{remaining:,.2f} remaining."
            )
        }

    # 3. Saving recommendation
    if not data["has_transactions"]:
        saving = {
            "title": "Build Your Financial Overview",
            "description": (
                "Start by recording your income and expenses. "
                "This will help identify realistic saving opportunities."
            )
        }
    elif savings < 0:
        saving = {
            "title": "Review Your Spending",
            "description": (
                f"Your expenses exceed your income by ₹{abs(savings):,.2f}. "
                "Review discretionary spending and prioritize essential costs."
            )
        }
    elif savings == 0:
        saving = {
            "title": "Work Towards Saving",
            "description": (
                "Your recorded income and expenses are equal. "
                "Look for small expenses you can reduce to begin saving."
            )
        }
    else:
        saving = {
            "title": "Keep Building Your Savings",
            "description": (
                f"You have ₹{savings:,.2f} remaining after expenses. "
                "Consider setting aside a portion of this amount regularly."
            )
        }

    return [spending, budget_insight, saving]


def validate_insights(result):
    if not isinstance(result, dict):
        return False

    insights = result.get("insights")

    if not isinstance(insights, list) or len(insights) != 3:
        return False

    for insight in insights:
        if not isinstance(insight, dict):
            return False

        if not isinstance(insight.get("title"), str):
            return False

        if not isinstance(insight.get("description"), str):
            return False

        if not insight["title"].strip() or not insight["description"].strip():
            return False

    return True


@ai_bp.route("/insights", methods=["GET"])
@jwt_required()
def get_ai_insights():

    if not Config.GEMINI_API_KEY:
        return jsonify({
            "message": "Gemini API key is not configured."
        }), 500

    try:
        user_id = int(get_jwt_identity())
        today = date.today()

        transactions = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.date >= date(today.year, today.month, 1),
            Transaction.date <= today
        ).all()

        income = 0.0
        expenses = 0.0
        category_totals = {}

        for transaction in transactions:
            amount = float(transaction.amount)

            if transaction.type == "income":
                income += amount

            elif transaction.type == "expense":
                expenses += amount

                category = (
                    transaction.category.name
                    if transaction.category
                    else "Others"
                )

                category_totals[category] = (
                    category_totals.get(category, 0) + amount
                )

        budget = Budget.query.filter_by(
            user_id=user_id,
            month=today.month,
            year=today.year
        ).first()

        budget_limit = float(budget.total_limit) if budget else 0.0
        remaining_budget = budget_limit - expenses

        top_categories = sorted(
            category_totals.items(),
            key=lambda item: item[1],
            reverse=True
        )[:5]

        spending_data = {
            "month": today.strftime("%B %Y"),
            "total_income": round(income, 2),
            "total_expenses": round(expenses, 2),
            "savings": round(income - expenses, 2),
            "budget_limit": round(budget_limit, 2),
            "budget_used": round(expenses, 2),
            "remaining_budget": round(remaining_budget, 2),
            "has_transactions": len(transactions) > 0,
            "top_expense_categories": [
                {
                    "category": name,
                    "amount": round(amount, 2)
                }
                for name, amount in top_categories
            ]
        }

        fallback_insights = generate_fallback_insights(spending_data)

        prompt = f"""
You are SmartSpend AI, a personal finance spending assistant.

Analyze this user's financial data for {spending_data["month"]}.

FINANCIAL DATA:
{json.dumps(spending_data, indent=2)}

Generate exactly THREE concise personalized insights:

1. Spending Pattern
2. Budget Analysis
3. Saving Recommendation

RULES:
- Use Indian Rupees (₹).
- Use only the supplied financial data.
- Do not invent transactions or amounts.
- Do not claim spending trends from one month.
- If there are no transactions, explain that data is insufficient.
- If no budget exists, recommend setting one.
- Do not recommend investment products.
- Return valid JSON only using this structure:

{{
  "insights": [
    {{"title": "Short title", "description": "Description"}},
    {{"title": "Short title", "description": "Description"}},
    {{"title": "Short title", "description": "Description"}}
  ]
}}
"""

        client = genai.Client(api_key=Config.GEMINI_API_KEY)

        # Retry temporary Gemini service errors.
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model="gemini-3.8-flash",
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json"
                    }
                )

                result = json.loads(response.text)

                if not validate_insights(result):
                    raise ValueError("Invalid Gemini insight response.")

                return jsonify({
                    "message": "AI insights generated successfully",
                    "month": spending_data["month"],
                    "source": "gemini",
                    "insights": result["insights"]
                }), 200

            except errors.APIError as error:
                # Retry only temporary server/rate-limit failures.
                if error.code not in (429, 500, 502, 503, 504):
                    raise

                if attempt < 2:
                    time.sleep(2 ** attempt)
                else:
                    break

        # Gemini remains unavailable: use actual financial data.
        return jsonify({
            "message": "Insights generated using financial data.",
            "month": spending_data["month"],
            "source": "fallback",
            "insights": fallback_insights
        }), 200

    except Exception:
        db.session.rollback()

        import traceback
        traceback.print_exc()

        return jsonify({
            "message": "Unable to generate AI insights. Please try again."
        }), 500
