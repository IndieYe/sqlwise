from marshmallow_dataclass import dataclass

@dataclass
class DisableTableQueryDTO:
    project_id: int
    table: str
    disabled: bool