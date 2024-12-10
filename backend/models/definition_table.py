from models.base import ProjectBaseModel
from database import db
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

class DefinitionTable(ProjectBaseModel):
    """Table definition model"""
    __tablename__ = 'definition_table'
    
    def_table = db.Column(db.String(100), nullable=False, comment='Table name')
    def_comment = db.Column(db.String(500), comment='Table comment') 
    def_ai_comment = db.Column(db.String(500), comment='AI table comment')
    def_waiting = db.Column(db.Boolean, default=False, comment='Whether waiting for building')
    def_version = db.Column(db.Integer, default=1, comment='Current index version')
    disabled = db.Column(db.Boolean, default=False, comment='Whether disabled')
    
    __table_args__ = (
        db.Index('uix_table_definition_def_table', 'project_id', 'def_table', unique=True),
        db.Index('ix_table_definition_def_waiting', 'def_waiting'),
        db.Index('ix_table_definition_def_version', 'def_version'),
    )

class DefinitionTableSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = DefinitionTable
        load_instance = True
        include_relationships = True
        sqla_session = db.session

definition_table_schema = DefinitionTableSchema()
definition_tables_schema = DefinitionTableSchema(many=True)