from models.base import ProjectBaseModel
from database import db
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

class TaskSQL(ProjectBaseModel):
    """Task model: which SQL records are selected"""
    __tablename__ = 'task_sql'
    
    task_id = db.Column(db.Integer, nullable=False, comment='Task ID')
    sql_id = db.Column(db.Integer, nullable=False, comment='SQL record ID')

    __table_args__ = (
        db.Index('ix_task_sql_task_id', 'task_id'),
    )

class TaskSQLSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = TaskSQL
        load_instance = True
        include_relationships = True
        sqla_session = db.session

task_sql_schema = TaskSQLSchema()
task_sqls_schema = TaskSQLSchema(many=True)
