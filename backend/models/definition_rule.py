from models.base import ProjectBaseModel
from database import db
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

class DefinitionRule(ProjectBaseModel):
    """Rule definition model"""
    __tablename__ = 'definition_rule'
    
    name = db.Column(db.String(100), nullable=False, comment='Rule name')
    content = db.Column(db.Text, nullable=False, comment='Rule content')
    def_selected = db.Column(db.Boolean, default=False, comment='Whether default selected')
    disabled = db.Column(db.Boolean, default=False, comment='Whether disabled')

    __table_args__ = (
        db.Index('idx_definition_rule_def_selected', 'def_selected'),
    )

class DefinitionRuleSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = DefinitionRule
        load_instance = True
        include_relationships = True
        sqla_session = db.session

definition_rule_schema = DefinitionRuleSchema()
definition_rules_schema = DefinitionRuleSchema(many=True)