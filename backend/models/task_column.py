from models.base import ProjectBaseModel
from database import db
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

class TaskColumn(ProjectBaseModel):
    """Task model: which columns are selected"""
    __tablename__ = 'task_column'
    
    task_id = db.Column(db.Integer, nullable=False, comment='Task ID')
    table_name = db.Column(db.String(100), nullable=False, comment='Table name')
    column_name = db.Column(db.String(100), nullable=False, comment='Column name')

    __table_args__ = (
        db.Index('ix_task_column_task_id', 'task_id'),
    )

class TaskColumnSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = TaskColumn
        load_instance = True
        include_relationships = True
        sqla_session = db.session

task_column_schema = TaskColumnSchema()
task_columns_schema = TaskColumnSchema(many=True)
