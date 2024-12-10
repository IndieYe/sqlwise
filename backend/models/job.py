from models.base import ProjectBaseModel
from database import db
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from enums import JobStatus

class Job(ProjectBaseModel):
    """Task model"""
    __tablename__ = 'job'
    
    task_id = db.Column(db.Integer, nullable=False, comment='Task ID')
    job_type = db.Column(db.String(20), nullable=False, comment='Task type')
    job_data = db.Column(db.JSON, comment='Task data')
    job_status = db.Column(db.String(20), nullable=False, default=JobStatus.INIT.value, comment='Task status')
    job_cost_time = db.Column(db.Integer, nullable=False, default=0, comment='Task cost time, unit: ms')
    error_message = db.Column(db.Text, comment='Error message')

class JobSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Job
        load_instance = True
        include_relationships = True
        sqla_session = db.session

job_schema = JobSchema()
jobs_schema = JobSchema(many=True)
    