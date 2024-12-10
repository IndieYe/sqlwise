from marshmallow_dataclass import dataclass

@dataclass
class SelectedColumnDTO:
    table: str
    columns: list[str]