from models.job import Job
from models.task_doc import TaskDoc
from models.task_sql import TaskSQL
from models.task_table import TaskTable
from models.task_column import TaskColumn
from models.task import Task
from enums import JobStatus
from dto.job_dto import JobDTO
from database import db
from enums import JobType

class JobService:
    @staticmethod
    def job_to_job_dto(job: Job):
        return JobDTO(id=job.id,
                     version=job.version,
                     task_id=job.task_id,
                     project_id=job.project_id,
                     job_type=job.job_type, 
                     job_data=job.job_data,
                     job_status=job.job_status,
                     job_type_display_name=JobType.get_display_name_by_value(job.job_type),
                     job_status_display_name=JobStatus.get_display_name_by_value(job.job_status),
                     error_message=job.error_message, 
                     created_at=job.created_at, 
                     updated_at=job.updated_at,
                     job_cost_time=job.job_cost_time)
            
    @staticmethod
    def create_job(session, task_id: int, job_type: str):
        """Create a new job"""
        task = session.query(Task).get(task_id)
        if not task:
            raise ValueError("Task does not exist")
        # Clean up task information
        if job_type == JobType.MATCH_DOC.value:
            session.query(TaskDoc).filter(TaskDoc.task_id == task_id).delete()
        if job_type == JobType.MATCH_SQL_LOG.value:
            session.query(TaskSQL).filter(TaskSQL.task_id == task_id).delete()
        if job_type == JobType.GEN_RELATED_COLUMNS.value:
            task.related_columns = None
            session.commit()
        if job_type == JobType.MATCH_DDL.value:
            session.query(TaskTable).filter(TaskTable.task_id == task_id).delete()
            session.query(TaskColumn).filter(TaskColumn.task_id == task_id).delete()
        if job_type == JobType.GENERATE_SQL.value:
            task.sql = None
            task.sql_right = None
            task.sql_refer = None
            session.commit()
        if job_type == JobType.LEARN_FROM_SQL.value:
            task.learn_result = None
            session.commit()
        
        # Create job
        job = Job(project_id=task.project_id, task_id=task_id, job_type=job_type)
        session.add(job)
        
    @staticmethod
    def cancel_job(session, job_id: int):
        """Cancel a job"""
        session.query(Job).filter(Job.id == job_id).update({'job_status': JobStatus.CANCELED.value})
        
    @staticmethod
    def get_init_job_ids() -> list[int]:
        """Get all job IDs with initialization status"""
        session = db.session
        return [job.id for job in session.query(Job).filter(Job.job_status == JobStatus.INIT.value).all()]
    
    @staticmethod
    def get_jobs(session, task_id: int) -> list[JobDTO]:
        """Get all jobs for a specific task"""
        jobs = session.query(Job).filter(Job.task_id == task_id).all()
        return [JobService.job_to_job_dto(job) for job in jobs]
    
    @staticmethod
    def get_job(session, job_id: int) -> JobDTO:
        """Get details of a specific job"""
        job = session.query(Job).get(job_id)
        return JobService.job_to_job_dto(job)