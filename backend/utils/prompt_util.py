import os
import chevron
from dto.gen_ai_comments_dto import GenAICommentsTableDTO
from enums import DbType

def get_gen_ai_comments(table: GenAICommentsTableDTO) -> str:
    """
    Generate AI comments based on table information
    """
    
    markdowns = []
    markdowns.append(f"## {table.table}\n")
    markdowns.append(f"{table.comment}\n")
    
    markdowns.append("### Column Information\n")
    markdowns.append("| Column | Type | Comment |")
    markdowns.append("|--------|------|---------|")
    
    for col in table.columns:
        markdowns.append(f"| {col.column} | {col.type} | {col.comment} |")
        
    tableStr = "\n".join(markdowns)

    # Read the template
    template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                'prompt_templates/gen_ai_comments.mustache')
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()
        
    return chevron.render(template, {
        'tableStr': tableStr
    })

def get_gen_sql(question: str, question_supplement: str, doc_content: str, sql_content: str, table_structure: str, relation_structure: str, rules: str, db_type: str, db_version: str) -> str:
    """
    Generate SQL based on user's question
    """
    db_type_name = DbType.get_display_name_by_value(db_type)

    # Read the template
    template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                'prompt_templates/gen_sql.mustache')
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()
        
    return chevron.render(template, {
        'question': question, 
        'question_supplement': question_supplement, 
        'doc_content': doc_content, 
        'sql_content': sql_content, 
        'table_structure': table_structure, 
        'relation_structure': relation_structure, 
        'rules': rules, 
        'db_type_name': db_type_name, 
        'db_version': db_version
    })
    
def get_gen_related_columns(question: str, question_supplement: str, doc_content: str, sql_content: str) -> str:
    """
    Generate related columns based on user's question
    """
    # Read the template
    template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                'prompt_templates/gen_related_columns.mustache')
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()
        
    return chevron.render(template, {
        'question': question, 
        'question_supplement': question_supplement, 
        'doc_content': doc_content, 
        'sql_content': sql_content
    })

def get_learn(question: str, question_supplement: str, sql: str, table_structure: str, sql_structure: str) -> str:
    """
    Generate learning prompt
    """
    # Read the template
    template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                'prompt_templates/learn.mustache')
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()
        
    return chevron.render(template, {
        'question': question, 
        'question_supplement': question_supplement, 
        'sql': sql, 
        'table_structure': table_structure, 
        'sql_structure': sql_structure
    })
    
def get_optimize_question(question: str) -> str:
    """
    Generate optimize question prompt
    """
    # Read the template
    template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                'prompt_templates/optimize_question.mustache')
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()
        
    return chevron.render(template, {
        'question': question
    })