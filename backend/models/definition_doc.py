from models.base import ProjectBaseModel
from database import db
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

class DefinitionDoc(ProjectBaseModel):
    """Document definition model"""
    __tablename__ = 'definition_doc'
    
    def_doc = db.Column(db.Text, nullable=False, comment='Document content')
    def_selected = db.Column(db.Boolean, default=False, comment='Whether default selected')
    def_waiting = db.Column(db.Boolean, default=False, comment='Whether waiting for building')
    disabled = db.Column(db.Boolean, default=False, comment='Whether disabled')

    # Non-unique index: def_selected
    __table_args__ = (db.Index('idx_definition_doc_def_selected', 'def_selected'),)
    
class DefinitionDocSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = DefinitionDoc
        load_instance = True
        include_relationships = True
        sqla_session = db.session
        
definition_doc_schema = DefinitionDocSchema()
definition_docs_schema = DefinitionDocSchema(many=True)