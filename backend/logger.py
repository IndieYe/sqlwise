import logging
from logging.handlers import RotatingFileHandler
import os

# Create logs directory if it doesn't exist
if not os.path.exists('logs'):
    os.makedirs('logs')

my_logger = logging.getLogger(__name__)
# Configure log format
formatter = logging.Formatter(
    '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
)
file_handler = logging.FileHandler('logs/my_logger.log')
file_handler.setFormatter(formatter)
file_handler.setLevel(logging.INFO)
my_logger.addHandler(file_handler)

def init_logger():
    """Initialize logger configuration"""
    # Configure root logger
    logging.basicConfig(level=logging.INFO)
    root_logger = logging.getLogger()

    # Configure log format
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    )

    # File handler - with size-based rotation
    file_handler = RotatingFileHandler(
        'logs/app.log',
        maxBytes=10485760,  # 10MB
        backupCount=10,
        encoding='utf-8'
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.ERROR)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)

    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Add handlers to root logger
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)

    return root_logger 