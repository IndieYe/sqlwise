from dataclasses import dataclass
from typing import List

@dataclass
class TableDescDTO:
    table: str
    desc: str

@dataclass
class ColumnDescDTO:
    table: str 
    column: str
    desc: str

@dataclass
class TableRelationDTO:
    table1: str
    column1: str
    table2: str
    column2: str
    relation_type: str

@dataclass
class LearnResultDTO:
    tables: List[TableDescDTO]
    columns: List[ColumnDescDTO]
    relations: List[TableRelationDTO]
