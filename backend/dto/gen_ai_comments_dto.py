from typing import List
from marshmallow_dataclass import dataclass

@dataclass
class GenAICommentsColumnDTO:
    """
    Column information DTO
    """
    column: str
    type: str
    comment: str
    
@dataclass
class GenAICommentsTableDTO:
    """
    Table information DTO
    """
    table: str
    comment: str
    columns: List[GenAICommentsColumnDTO]
    
@dataclass
class GenAICommentsResponseColumnDTO:
    """Column information for AI generated comments"""
    column: str
    comment: str

@dataclass
class GenAICommentsResponseDTO:
    """Response DTO for AI generated comments"""
    table: str
    comment: str
    columns: list[GenAICommentsResponseColumnDTO]
    