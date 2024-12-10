from flask import Flask
from flask_smorest import Api
from dotenv import load_dotenv
from flask_cors import CORS
from sqlalchemy.exc import SQLAlchemyError
from openai import OpenAIError
import traceback
from jobs import init_scheduler
from database import db, init_db, OptimisticLockException
from logger import init_logger
from routes.main import main_bp
from routes.test import test_bp
from routes.project import project_bp
import os

# Load .env file
load_dotenv()

# Import routes
from routes.main import main_bp
from routes.test import test_bp
from routes.project import project_bp

# Initialize logger
logger = init_logger()

# Create Flask instance
app = Flask(__name__)

# API configuration
app.config["API_TITLE"] = "SQLWise API"
app.config["API_VERSION"] = "1.0"
app.config["OPENAPI_VERSION"] = "3.0.2"
app.config["OPENAPI_URL_PREFIX"] = "/api"
app.config["OPENAPI_SWAGGER_UI_PATH"] = "/swagger-ui"
app.config["OPENAPI_SWAGGER_UI_URL"] = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"

# Initialize API
api = Api(app)

translator_key = os.getenv('AZURE_TRANSLATOR_KEY')
if translator_key:
    app.logger.info("Azure Translator service is active!")
else:
    app.logger.info("Azure Translator service is not active!")

# Log startup
app.logger.info('Application startup')

# Register error handlers
@app.errorhandler(SQLAlchemyError)
def handle_db_error(error):
    app.logger.error(f"Database error: {str(error)}\n{traceback.format_exc()}")
    return {
        'code': 500,
        'message': f"Database error: {str(error)}"
    }, 500

@app.errorhandler(ValueError)
def handle_validation_error(error):
    app.logger.error(f"Validation error: {str(error)}\n{traceback.format_exc()}")
    return {
        'code': 400,
        'message': str(error)
    }, 400

@app.errorhandler(Exception)
def handle_generic_error(error):
    app.logger.error(f"Internal server error: {str(error)}\n{traceback.format_exc()}")
    return {
        'code': 500,
        'message': f"Internal server error: {str(error)}"
    }, 500

@app.errorhandler(OpenAIError)
def handle_openai_error(error):
    app.logger.error(f"OpenAI API error: {str(error)}\n{traceback.format_exc()}")
    return {
        'code': 500,
        'message': f"OpenAI API error: {str(error)}"
    }, 500

@app.errorhandler(OptimisticLockException)
def handle_optimistic_lock_error(error):
    return {
        'code': 409,
        'message': str(error)
    }, 409

@app.before_request
def setup_db_connection():
    """确保每个请求都有新的数据库会话"""
    try:
        if not db.session.is_active:
            db.session.remove()
            db.session = db.create_scoped_session()
            app.logger.debug("Created new database session")
    except Exception as e:
        app.logger.error(f"Error setting up database session: {str(e)}")
        raise

@app.teardown_appcontext
def shutdown_session(exception=None):
    """确保请求结束后正确清理数据库会话"""
    try:
        if db.session.is_active:
            if exception:
                db.session.rollback()
            db.session.remove()
    except Exception as e:
        app.logger.error(f"Error during session cleanup: {str(e)}")
    finally:
        # 确保连接返回到连接池
        db.session.close()

# Enable CORS
CORS(app, resources={r"/*": {"origins": "*"}})

# Register blueprints
api.register_blueprint(main_bp, url_prefix='/main')
api.register_blueprint(test_bp, url_prefix='/test')
api.register_blueprint(project_bp)

# Initialize database
init_db(app)

if __name__ == "__main__":
    # This code block only runs when directly running python app.py
    # When using gunicorn, this code block will not be executed
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        init_scheduler(app)
    app.run(debug=True, host='0.0.0.0', port=8000)
