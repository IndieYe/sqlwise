from marshmallow_dataclass import dataclass

@dataclass
class DefinitionDocQueryResultDTO:
    id: int
    def_doc: str
    def_selected: bool
    disabled: bool