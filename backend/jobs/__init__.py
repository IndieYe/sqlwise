from flask_apscheduler import APScheduler
import os

scheduler = APScheduler()

def init_scheduler(app):
    # Apply scheduler configuration
    app.config['SCHEDULER_API_ENABLED'] = True
    app.config['SCHEDULER_TIMEZONE'] = "Asia/Shanghai"
    
    scheduler.init_app(app)
    
    # Import jobs module to register tasks
    from . import job_job
    from . import job_vector_db
    
    scheduler.start()
    app.logger.info("Scheduler started successfully")
