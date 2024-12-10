from marshmallow_dataclass import dataclass

@dataclass
class UpdateTaskColumnQueryDTO:
    table: str
    columns: list[str]

@dataclass
class UpdateTaskQueryDTO:
    task_id: int
    
    question: str
    question_supplement: str
    options: dict
    rules: list[int]
    doc_ids: list[int]
    sql_ids: list[int]
    columns: list[UpdateTaskColumnQueryDTO]
    sql: str
    
    question_modified: bool | None = False
    question_supplement_modified: bool | None = False
    options_modified: bool | None = False
    rules_modified: bool | None = False
    doc_ids_modified: bool | None = False
    sql_ids_modified: bool | None = False
    columns_modified: bool | None = False
    sql_modified: bool | None = False
    