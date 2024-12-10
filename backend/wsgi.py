from app import app
from jobs import init_scheduler

def on_post_fork(server, worker):
    """This runs in each worker process."""
    from database import db
    
    with app.app_context():
        if hasattr(db, 'engine'):
            # 断开继承自主进程的数据库连接
            db.engine.dispose()

def on_when_ready(server):
    """This runs in the master process before spawning workers."""
    app.logger.info('Initializing scheduler in master process')
    with app.app_context():
        try:
            init_scheduler(app)
            app.logger.info('Scheduler initialized successfully')
        except Exception as e:
            app.logger.error(f'Failed to initialize scheduler: {str(e)}')

if __name__ == "__main__":
    app.run()