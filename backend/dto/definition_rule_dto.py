from marshmallow_dataclass import dataclass

@dataclass
class DefinitionRuleDTO:
    id: int
    name: str
    content: str
    def_selected: bool
    disabled: bool