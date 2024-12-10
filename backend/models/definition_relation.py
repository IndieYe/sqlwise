from models.base import ProjectBaseModel
from database import db
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

class DefinitionRelation(ProjectBaseModel):
    """Relation definition model"""
    __tablename__ = 'definition_relation'
    
    table1 = db.Column(db.String(100), nullable=False, comment='Table name 1')
    column1 = db.Column(db.String(100), nullable=False, comment='Table 1 column name')
    table2 = db.Column(db.String(100), nullable=False, comment='Table name 2')
    column2 = db.Column(db.String(100), nullable=False, comment='Table 2 column name')
    relation_type = db.Column(db.String(100), nullable=False, comment='Relationship type between table 1 and table 2, options: 1-1(one-to-one),1-n(one-to-many),n-1(many-to-one),n-n(many-to-many)')

    __table_args__ = (
        db.UniqueConstraint('project_id', 'table1', 'column1', 'table2', 'column2', name='uix_relation_definition'),
    )

class DefinitionRelationSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = DefinitionRelation
        load_instance = True
        include_relationships = True
        sqla_session = db.session

definition_relation_schema = DefinitionRelationSchema()
definition_relations_schema = DefinitionRelationSchema(many=True)