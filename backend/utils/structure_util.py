from models.task_doc import TaskDoc
from models.definition_doc import DefinitionDoc
from models.task import Task
from models.definition_rule import DefinitionRule
from models.definition_relation import DefinitionRelation
from models.task_table import TaskTable
from models.task_sql import TaskSQL
from models.definition_table import DefinitionTable
from models.definition_column import DefinitionColumn
from models.task_column import TaskColumn
from dto.gen_ai_comments_dto import GenAICommentsTableDTO
from database import db

def fix_question(question: str) -> str:
    """
    Fix line breaks in the question
    """
    return question.replace('\n', ' ')

def get_rule_structure_markdown(session, task: Task) -> str:
    """
    Get markdown description of rules
    Separated by ---
    """
    rules = session.query(DefinitionRule).filter(DefinitionRule.id.in_(task.rules)).order_by(DefinitionRule.id).all()
    return "\n\n---\n\n".join([rule.content for rule in rules])

def get_doc_content(session, task_id: int) -> str:
    """
    Get associated document content
    Separated by ---
    """
    task_docs = session.query(TaskDoc.id, DefinitionDoc.def_doc)\
        .join(DefinitionDoc, DefinitionDoc.id == TaskDoc.doc_id)\
        .filter(TaskDoc.task_id == task_id)\
        .all()
    
    contents = []
    for task_doc in task_docs:
        content = task_doc.def_doc
        contents.append(content)
        
    return "\n\n---\n\n".join(contents)

def get_sql_log_structure_markdown(session, task_id: int) -> str:
    """
    Get SQL log table structure description (markdown format)
    Separated by ---
    """
    # Get associated SQL records (replace line breaks with spaces in questions)
    task_sqls = session.query(TaskSQL.id, Task.question, Task.sql)\
        .join(Task, Task.id == TaskSQL.sql_id)\
        .filter(TaskSQL.task_id == task_id)\
        .all()

    markdowns = []
    for s in task_sqls:
        markdown = []
        markdown.append(f"## {fix_question(s.question)}\n")
        markdown.append("```sql")
        markdown.append(f"{s.sql}")
        markdown.append("```")
        markdowns.append("\n".join(markdown))
        
    return "\n\n---\n\n".join(markdowns)

def get_table_structure_markdown(session, task_id: int) -> str:
    """
    Generate table structure description based on selected columns (markdown format)
    
    Args:
        task_id: Task ID
        
    Returns:
        str: Table structure description in markdown format
    """
    # Get all table and column definitions
    table_defs = {t.def_table: t.def_ai_comment or t.def_comment for t in session.query(DefinitionTable).all()}
    column_defs = {
        f"{c.def_table}.{c.def_column}": {
            "type": c.def_type,
            "comment": c.def_ai_comment or c.def_comment
        } for c in session.query(DefinitionColumn).all()
    }
    
    selected_columns = session.query(TaskColumn).filter(TaskColumn.task_id == task_id).all()
    
    # Group selected columns by table
    table_columns = {}
    for col in selected_columns:
        if col.table_name not in table_columns:
            table_columns[col.table_name] = []
        table_columns[col.table_name].append(col.column_name)
    
    # Generate markdown
    markdowns = []
    for table_name, columns in table_columns.items():
        markdown = []
        # Add table title and description
        table_comment = table_defs.get(table_name, '')
        markdown.append(f"## {table_name}\n")
        if table_comment:
            markdown.append(f"{table_comment}\n")
        
        # Add column headers
        markdown.append("| Column | Type | Description |")
        markdown.append("|--------|------|-------------|")
        
        # Add column information
        for column in columns:
            col_key = f"{table_name}.{column}"
            col_info = column_defs.get(col_key, {"type": "", "comment": ""})
            markdown.append(
                f"| {column} | {col_info['type']} | {col_info['comment']} |"
            )
        markdowns.append("\n".join(markdown))
    
    return "\n\n".join(markdowns)
    
def get_relation_structure_markdown(session, task_id: int) -> str:
    """
    Generate table relationship description based on selected tables (markdown format)
    
    Args:
        task_id: Task ID
        
    Returns:
        str: Table relationship description in markdown format
    """
    # Get task-related tables
    selected_tables = session.query(TaskTable).filter(TaskTable.task_id == task_id).all()
    table_names = [t.table_name for t in selected_tables]
    
    # Get related table relationship definitions
    relations = session.query(DefinitionRelation).filter(
        DefinitionRelation.table1.in_(table_names),
        DefinitionRelation.table2.in_(table_names)
    ).all()
    
    # Generate markdown
    markdowns = []
    if relations:
        markdown = []
        markdown.append("## Table Relationships\n")
        
        # Add headers
        markdown.append("| Table1 | Column1 | Table2 | Column2 | Relationship Type |")
        markdown.append("|--------|---------|---------|---------|------------------|")
        
        # Add relationship information
        for relation in relations:
            markdown.append(
                f"| {relation.table1} | {relation.column1} | "
                f"{relation.table2} | {relation.column2} | {relation.relation_type} |"
            )
        markdowns.append("\n".join(markdown))
    
    return "\n\n".join(markdowns) 
