from flask import Flask
from flask_cors import CORS

from config import Config
from app.extensions import db, migrate, jwt, bcrypt
from app import models
from app.routes import auth_bp, transactions_bp, budgets_bp

from app.routes import (
    auth_bp,
    transactions_bp,
    budgets_bp,
    analytics_bp,
    ai_bp,
    wallet_bp
)
def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": ["http://localhost:5173"]
            }
        }
    )

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)

    @app.route("/")
    def home():
        return {
            "message": "SmartSpend AI Backend is running!",
            "status": "success"
        }

    app.register_blueprint(auth_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(budgets_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(wallet_bp)
    return app