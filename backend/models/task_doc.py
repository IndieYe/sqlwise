from models.base import ProjectBaseModel
from database import db
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

class TaskDoc(ProjectBaseModel):
    """Task model: which documents are selected"""
    __tablename__ = 'task_doc'
    
    task_id = db.Column(db.Integer, nullable=False, comment='Task ID')
    doc_id = db.Column(db.Integer, nullable=False, comment='Document definition ID')

    __table_args__ = (
        db.Index('ix_task_doc_task_id', 'task_id'),
    )

class TaskDocSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = TaskDoc
        load_instance = True
        include_relationships = True
        sqla_session = db.session

task_doc_schema = TaskDocSchema()
task_docs_schema = TaskDocSchema(many=True)
