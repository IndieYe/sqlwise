from marshmallow_dataclass import dataclass

@dataclass
class UpdateDDLByQueryTableDTO:
    table: str
    comment: str | None = None

@dataclass
class UpdateDDLByQueryColumnDTO:
    table: str
    column: str
    type: str
    comment: str | None = None

@dataclass
class UpdateDDLByQueryDTO:
    project_id: int
    tables: list[UpdateDDLByQueryTableDTO]
    columns: list[UpdateDDLByQueryColumnDTO]
