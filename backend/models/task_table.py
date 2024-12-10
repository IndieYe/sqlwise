from models.base import ProjectBaseModel
from database import db
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

class TaskTable(ProjectBaseModel):
    """Task model: which tables are selected"""
    __tablename__ = 'task_table'
    
    task_id = db.Column(db.Integer, nullable=False, comment='Task ID')
    table_name = db.Column(db.String(100), nullable=False, comment='Table name')

    __table_args__ = (
        db.Index('ix_task_table_task_id', 'task_id'),
    )

class TaskTableSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = TaskTable
        load_instance = True
        include_relationships = True
        sqla_session = db.session

task_table_schema = TaskTableSchema()
task_tables_schema = TaskTableSchema(many=True)
