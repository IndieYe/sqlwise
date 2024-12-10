from marshmallow_dataclass import dataclass

@dataclass
class RefreshIndexQueryDTO:
    project_id: int
    refresh_table: bool = False
    refresh_column: bool = False
    refresh_doc: bool = False
    refresh_sql: bool = False
