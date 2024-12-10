from models.base import BaseModel
from database import db
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, auto_field

class Project(BaseModel):
    """Project model"""
    __tablename__ = 'project'
    
    name = db.Column(db.String(20), comment='Project name')
    description = db.Column(db.String(200), comment='Project description')
    db_type = db.Column(db.String(20), comment='Database type')
    db_version = db.Column(db.String(255), comment='Database version information')
    cur_version = db.Column(db.Integer, default=1, comment='Current index version')

class ProjectSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Project
        load_instance = True
        include_relationships = True
        sqla_session = db.session

project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)
