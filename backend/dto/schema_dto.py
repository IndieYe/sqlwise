from dataclasses import dataclass
from typing import List
from dto.definition_rule_dto import DefinitionRuleDTO

@dataclass
class DefinitionTableDTO:
    table: str
    comment: str
    ai_comment: str
    disabled: bool

@dataclass    
class DefinitionColumnDTO:
    table: str
    type: str
    column: str
    comment: str
    ai_comment: str

@dataclass
class DefinitionRelationDTO:
    table1: str
    column1: str
    table2: str
    column2: str
    relation_type: str

@dataclass
class SchemaDTO:
    tables: List[DefinitionTableDTO]
    columns: List[DefinitionColumnDTO] 
    relations: List[DefinitionRelationDTO]
    rules: List[DefinitionRuleDTO]