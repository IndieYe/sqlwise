from models.base import ProjectBaseModel
from database import db
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

class Task(ProjectBaseModel):
    """Task model"""
    __tablename__ = 'task'
    
    question = db.Column(db.Text, nullable=False, comment='User question content')
    question_supplement = db.Column(db.Text, comment='Question supplement')
    options = db.Column(db.JSON, nullable=False, default={}, comment='Task options')
    rules = db.Column(db.JSON, comment='Rule id list')
    related_columns = db.Column(db.Text, comment='Related columns')
    sql = db.Column(db.Text, comment='Generated SQL')
    sql_right = db.Column(db.Boolean, comment='Whether the generated SQL is correct')
    sql_refer = db.Column(db.Boolean, comment='Whether it can be referenced')
    learn_result = db.Column(db.Text, comment='Learning result')
    def_waiting = db.Column(db.Boolean, default=False, comment='Whether to wait for construction')
    
    def __repr__(self):
        return f"<Task(id={self.id}, question={self.question[:20]}...)>"

class TaskSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Task
        load_instance = True
        include_relationships = True
        sqla_session = db.session

task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True) 