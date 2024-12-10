from marshmallow_dataclass import dataclass

@dataclass
class ProjectSettingsDTO:
    name: str
    description: str
    db_type: str
    db_version: str
    
    vector_waiting_table_count: int
    vector_waiting_column_count: int
    vector_waiting_doc_count: int
    vector_waiting_task_count: int

    definition_doc_count: int
    definition_rule_count: int
    definition_table_count: int
    definition_column_count: int
    definition_relation_count: int
    
    task_count: int
    task_doc_count: int
    task_sql_count: int
    task_table_count: int
    task_column_count: int
    job_count: int
