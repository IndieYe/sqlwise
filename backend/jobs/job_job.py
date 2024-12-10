from . import scheduler
from services.task_service import TaskService
from services.job_service import JobService
from enums import JobType, JobStatus
import asyncio
import time
from models.job import Job
from models.task import Task
from database import db
from app import app
from database import session_scope

# Define scheduled task
@scheduler.task('interval', id='job', seconds=2, coalesce=True, max_instances=1)
def job():
    with app.app_context():
        with session_scope() as session:
            while True:
                # Query all jobs with initial status
                job_ids = JobService.get_init_job_ids()
                if len(job_ids) == 0:
                    break
                print(f"jobs count: {len(job_ids)}")
                for job_id in job_ids:
                    try:
                        # Update job status
                        job = session.query(Job).get(job_id)
                        if job.job_status != JobStatus.INIT.value:
                            print(f"job {job_id} status is not INIT, skip")
                            continue
                        job_type = job.job_type
                        job.job_status = JobStatus.RUNNING.value
                        session.commit()
                        
                        # Execute task (time-consuming)
                        start_time = time.time()
                        if job_type == JobType.GENERATE_SQL.value:
                            asyncio.run(TaskService.generate_sql_async(session, job_id))
                        elif job_type == JobType.GEN_RELATED_COLUMNS.value:
                            asyncio.run(TaskService.gen_related_columns_async(session, job_id))
                        elif job_type == JobType.MATCH_DOC.value:
                            asyncio.run(TaskService.match_doc_async(session, job_id))
                        elif job_type == JobType.MATCH_SQL_LOG.value:
                            asyncio.run(TaskService.match_sql_log_async(session, job_id))
                        elif job_type == JobType.MATCH_DDL.value:
                            asyncio.run(TaskService.match_ddl_async(session, job_id))
                        elif job_type == JobType.LEARN_FROM_SQL.value:
                            asyncio.run(TaskService.learn_from_sql_async(session, job_id))
                        
                        end_time = time.time()
                        job_cost_time = int((end_time - start_time) * 1000)
                        # Update job status
                        job = session.query(Job).get(job_id)
                        if job.job_status != JobStatus.RUNNING.value:
                            print(f"job {job_id} status is not RUNNING, skip")
                            continue
                        job.job_status = JobStatus.SUCCESS.value
                        job.job_cost_time = job_cost_time
                        session.commit()
                        
                        # Create next job based on task options
                        task_options = session.query(Task).get(job.task_id).options
                        if job_type == JobType.MATCH_DOC.value:
                            if task_options.get('autoMatchSqlLog'):
                                JobService.create_job(session, job.task_id, JobType.MATCH_SQL_LOG.value)
                        elif job_type == JobType.MATCH_SQL_LOG.value:
                            if task_options.get('autoGenRelatedColumns'):
                                JobService.create_job(session, job.task_id, JobType.GEN_RELATED_COLUMNS.value)
                        elif job_type == JobType.GEN_RELATED_COLUMNS.value:
                            if task_options.get('autoMatchDDL'):
                                JobService.create_job(session, job.task_id, JobType.MATCH_DDL.value)
                        elif job_type == JobType.MATCH_DDL.value:
                            if task_options.get('autoGenSql'):
                                JobService.create_job(session, job.task_id, JobType.GENERATE_SQL.value)
                        elif job_type == JobType.GENERATE_SQL.value:
                            pass
                        elif job_type == JobType.LEARN_FROM_SQL.value:
                            pass
                    except Exception as e:
                        # Update job status on error
                        job = session.query(Job).get(job_id)
                        if job.job_status != JobStatus.RUNNING.value:
                            print(f"job {job_id} status is not RUNNING, skip")
                            continue
                        job.job_status = JobStatus.FAIL.value
                        job.error_message = str(e)
                        session.commit()
