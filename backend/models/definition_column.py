from models.base import ProjectBaseModel
from database import db
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

class DefinitionColumn(ProjectBaseModel):
    """Column definition model"""
    __tablename__ = 'definition_column'
    
    def_table = db.Column(db.String(100), nullable=False, comment='Table name')
    def_type = db.Column(db.String(50), nullable=False, comment='Field type')
    def_column = db.Column(db.String(100), nullable=False, comment='Field name')
    def_comment = db.Column(db.String(500), comment='Field comment') 
    def_ai_comment = db.Column(db.String(500), comment='AI field comment')
    def_waiting = db.Column(db.Boolean, default=False, comment='Whether waiting for building')
    def_version = db.Column(db.Integer, default=1, comment='Current index version')

    __table_args__ = (
        db.UniqueConstraint('project_id', 'def_table', 'def_column', name='uix_table_column'),
        db.Index('ix_column_definition_def_waiting', 'def_waiting'),
        db.Index('ix_column_definition_def_version', 'def_version'),
    )

class DefinitionColumnSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = DefinitionColumn
        load_instance = True
        include_relationships = True
        sqla_session = db.session

definition_column_schema = DefinitionColumnSchema()
definition_columns_schema = DefinitionColumnSchema(many=True)
