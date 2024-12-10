from . import scheduler
from models.project import Project
from models.definition_table import DefinitionTable
from models.definition_column import DefinitionColumn
from models.definition_doc import DefinitionDoc
from models.task import Task
from services.def_service import DefService
from services.task_service import TaskService
from database import db
from app import app

# Task for adding to vector database
@scheduler.task('interval', id='add_to_vector_db_job', seconds=1, coalesce=True, max_instances=1)
def add_to_vector_db_job():
    with app.app_context():
        session = db.session
        
        table_count = 0
        column_count = 0
        doc_count = 0
        task_count = 0
        
        # Query 10 pending table definitions
        table_definitions = session.query(DefinitionTable).filter_by(def_waiting=True).limit(10).all()
        for table_definition in table_definitions:
            DefService.add_or_update_table_vector_db(table_definition)
            table_definition.def_waiting = False
            table_count += 1
        if table_count > 0:
            print(f"Number of table definitions added to vector database: {table_count}")
        
        # Query 10 pending column definitions
        column_definitions = session.query(DefinitionColumn).filter_by(def_waiting=True).limit(10).all()
        for column_definition in column_definitions:
            DefService.add_or_update_column_vector_db(column_definition)
            column_definition.def_waiting = False
            column_count += 1
        if column_count > 0:
            print(f"Number of column definitions added to vector database: {column_count}")
        
        # Query 10 pending document definitions
        doc_definitions = session.query(DefinitionDoc).filter_by(def_waiting=True).limit(10).all()
        for doc_definition in doc_definitions:
            DefService.refresh_doc_vector_db(doc_definition)
            doc_definition.def_waiting = False
            doc_count += 1
        if doc_count > 0:
            print(f"Number of document definitions added to vector database: {doc_count}")
        
        # Query 10 pending tasks
        tasks = session.query(Task).filter_by(def_waiting=True).limit(10).all()
        for task in tasks:
            TaskService.refresh_task_vector_db(task)
            task.def_waiting = False
            task_count += 1
        if task_count > 0:
            print(f"Number of tasks added to vector database: {task_count}")
        
        session.commit()
        
        # # Check if building is complete
        # if table_count + column_count + doc_count + task_count == 0:
        #     index_model = session.query(IndexModel).first()
        #     if index_model.status == IndexModelStatus.BUILDING.value:
        #         index_model.status = IndexModelStatus.READY.value
        #         session.commit()
        
# Task for removing old version table and column definitions
@scheduler.task('interval', id='remove_old_version_defs_job', seconds=10, coalesce=True, max_instances=1)
def remove_old_version_defs_job():
    with app.app_context():
        session = db.session
        table_count = 0
        column_count = 0
        
        # Query 50 old version table definitions
        table_definitions = session.query(DefinitionTable) \
            .join(Project, Project.id == DefinitionTable.project_id) \
            .filter(DefinitionTable.def_version < Project.cur_version) \
            .limit(50).all()
        for table_definition in table_definitions:
            DefService.remove_table_vector_db(table_definition)
            session.delete(table_definition)
            table_count += 1
        if table_count > 0:
            print(f"Number of old version table definitions deleted: {table_count}")
            
        # Query 50 old version column definitions
        column_definitions = session.query(DefinitionColumn) \
            .join(Project, Project.id == DefinitionColumn.project_id) \
            .filter(DefinitionColumn.def_version < Project.cur_version) \
            .limit(50).all()
        for column_definition in column_definitions:
            DefService.remove_column_vector_db(column_definition)
            session.delete(column_definition)
            column_count += 1
        if column_count > 0:
            print(f"Number of old version column definitions deleted: {column_count}")
            
        if table_count + column_count > 0:
            session.commit()