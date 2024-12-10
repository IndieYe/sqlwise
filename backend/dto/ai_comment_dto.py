from dataclasses import dataclass
from typing import List
from dataclasses_json import dataclass_json
from dto.learn_result_dto import TableRelationDTO

@dataclass_json
@dataclass
class ColumnAICommentDTO:
    col: str
    comment: str

@dataclass_json
@dataclass
class UpdateAICommentDTO:
    project_id: int
    table: str
    comment: str
    columns: List[ColumnAICommentDTO]
    relations: List[TableRelationDTO]