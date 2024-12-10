from typing import List
from datetime import datetime
from dto.job_dto import JobDTO
from dto.learn_result_dto import LearnResultDTO
from marshmallow_dataclass import dataclass

@dataclass
class TaskTableDTO:
    table_name: str

@dataclass    
class TaskColumnDTO:
    table_name: str
    column_name: str
    
@dataclass    
class TaskDocDTO:
    doc_id: int
    def_doc: str
    
@dataclass    
class TaskSQLDTO:
    task_id: int
    question: str
    sql: str

@dataclass
class TaskDTO:
    id: int
    project_id: int
    version: int
    question: str
    question_supplement: str
    options: dict
    rules: List[int]
    related_columns: str
    sql: str
    sql_right: bool
    sql_refer: bool
    learn_result: LearnResultDTO
    created_at: datetime
    updated_at: datetime
    tables: List[TaskTableDTO]
    columns: List[TaskColumnDTO] 
    docs: List[TaskDocDTO]
    sqls: List[TaskSQLDTO]
    jobs: List[JobDTO]