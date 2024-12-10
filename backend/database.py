from flask_sqlalchemy import SQLAlchemy
import importlib
import pkgutil
import os
from contextlib import contextmanager

# Define database engine options as a constant
DB_ENGINE_OPTIONS = {
    "pool_pre_ping": True,
    "pool_recycle": 300,  # 5 minutes
    "pool_size": 5,  # 增加连接池大小
    "pool_timeout": 30,  # 添加连接超时
    "max_overflow": 10,  # 增加最大溢出连接数
    "pool_use_lifo": True,  # 使用LIFO策略以更好地处理突发负载
}

# Create SQLAlchemy instance with engine options
db = SQLAlchemy(engine_options=DB_ENGINE_OPTIONS)

class OptimisticLockException(Exception):
    """Exception for optimistic locking"""
    def __init__(self, message="Concurrent modification conflict, please refresh and try again"):
        super().__init__(message)

def init_db(app):
    """Initialize database"""
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = DB_ENGINE_OPTIONS
    
    # Initialize SQLAlchemy
    db.init_app(app)
    
    # Import all models
    import models
    for _, name, _ in pkgutil.iter_modules(models.__path__):
        importlib.import_module(f'models.{name}')
    
    # Create all tables
    with app.app_context():
        db.create_all()

# def get_db():
#     """Get database session"""
#     return db.session

@contextmanager
def session_scope(read_only=False):
    """提供一个事务范围的会话上下文
    Args:
        read_only (bool): 如果为True，则不会尝试提交事务
    """
    session = db.session
    try:
        yield session
        if not read_only:
            session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()
