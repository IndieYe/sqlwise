from models.task import Task
from models.task_column import TaskColumn
from models.task_table import TaskTable
from dto.task_dto import TaskDTO, TaskTableDTO, TaskColumnDTO, TaskSQLDTO, TaskDocDTO
from dto.selected_column_dto import SelectedColumnDTO
from utils.structure_util import get_table_structure_markdown, get_relation_structure_markdown, get_sql_log_structure_markdown
from models.definition_doc import DefinitionDoc
import json
from utils.utils import extract_json
from models.job import Job
from enums import JobType, JobStatus
from services.job_service import JobService
from database import OptimisticLockException
from models.task_sql import TaskSQL
from models.task_doc import TaskDoc
import sqlparse
import logging
from dto.learn_result_dto import LearnResultDTO
from models.definition_table import DefinitionTable
from models.definition_column import DefinitionColumn
from models.definition_relation import DefinitionRelation
from utils.structure_util import get_doc_content, get_rule_structure_markdown
from utils.utils import reverse_relation_type
from models.project import Project
from database import db
from dto.update_task_query import UpdateTaskQueryDTO
from utils.prompt_util import get_gen_sql, get_gen_related_columns, get_learn, get_optimize_question

# 1. AI: AI generates all possible "table names & field names"
# 2. Vector DB: First query tables, iterate through each table name to get top n results 
# 3. Vector DB: Then filter columns within these tables
class TaskService:
    @staticmethod
    def update_task(session, query: UpdateTaskQueryDTO):
        task = session.query(Task).get(query.task_id)
        
        if query.question_modified:
            task.update(question=query.question)
        if query.question_supplement_modified:
            task.update(question_supplement=query.question_supplement)
        if query.options_modified:
            task.update(options=query.options)
        if query.rules_modified:
            task.update(rules=query.rules)
        if query.doc_ids_modified:
            # Delete existing records
            session.query(TaskDoc).filter(TaskDoc.task_id == task.id).delete()
            # Add new records
            for doc_id in query.doc_ids:
                task_doc = TaskDoc(project_id=task.project_id, task_id=task.id, doc_id=doc_id)
                session.add(task_doc)
        if query.sql_ids_modified:
            # Delete existing records
            session.query(TaskSQL).filter(TaskSQL.task_id == task.id).delete()
            # Add new records
            for sql_id in query.sql_ids:
                task_sql = TaskSQL(project_id=task.project_id, task_id=task.id, sql_id=sql_id)
                session.add(task_sql)
        if query.columns_modified:
            # Delete existing table and column records
            session.query(TaskTable).filter(TaskTable.task_id == task.id).delete()
            session.query(TaskColumn).filter(TaskColumn.task_id == task.id).delete()
            
            # Get unique table names
            unique_tables = {col.table for col in query.columns}
            
            # Insert new table records
            for table_name in unique_tables:
                task_table = TaskTable(
                    project_id=task.project_id,
                    task_id=task.id,
                    table_name=table_name
                )
                session.add(task_table)
                
            # Insert new column records
            for column in query.columns:
                for column_name in column.columns:
                    task_column = TaskColumn(
                        project_id=task.project_id,
                        task_id=task.id,
                        table_name=column.table,
                        column_name=column_name
                    )
                    session.add(task_column)
        if query.sql_modified:
            task.update(sql=query.sql)
    
    @staticmethod
    def check_job_status(session, job_id: int) -> bool:
        """Check job status"""
        job = session.query(Job).get(job_id)
        if job.job_status == JobStatus.CANCELED.value:
            return False
        if job.job_status != JobStatus.RUNNING.value:
            raise ValueError('job status is not running')
        return True
    
    @staticmethod
    def refresh_task_vector_db(task: Task, is_delete: bool = False):
        """
        Update task's vector database
        """
        from vector_stores import sql_log_store
        if task.sql_refer and not is_delete:
            sql_log_store.add_document(task.question, {
                "project_id": task.project_id,
                "task_id": str(task.id), 
                "question": task.question, 
                "sql": task.sql,
            }, str(task.id))
        else:
            sql_log_store.delete_documents({"task_id": str(task.id)})
    
    @staticmethod
    async def optimize_question(question: str) -> str:
        """
        Optimize user question
        """
        prompt = get_optimize_question(question)
        from services.openai_service import OpenAIService
        optimized_question_str = await OpenAIService.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            response_format={
                'type': 'json_object'
            },
        )
        optimized_question_json = extract_json(optimized_question_str)
        optimized_question = optimized_question_json['result']
        return optimized_question
    
    @staticmethod
    async def create_task(session, project_id: int, question: str, question_supplement: str, options: dict = None, rules: list[int] = None) -> int:
        """
        Create a new task
        
        Args:
            question: User's question
            
        Returns:
            Task: Created task instance
        """
        task = Task(project_id=project_id, question=question, question_supplement=question_supplement, options=options, rules=rules)
        session.add(task)
        session.commit()
        
        # Create job
        JobService.create_job(session, task.id, JobType.MATCH_DOC.value)

        return task.id
            
    @staticmethod
    async def re_create_task(session, task_id: int) -> int:
        """
        Recreate a task
        
        Args:
            task_id: Task ID
        """
        task = session.query(Task).get(task_id)
        if not task:
            raise ValueError('Task not found')
        
        # Create job
        JobService.create_job(session, task_id, JobType.MATCH_DOC.value)

        return task_id
            
    @staticmethod
    def delete_task(session, task_id: int):
        """
        Delete a task
        """
        # task
        task = session.query(Task).get(task_id)
        session.delete(task)
        # job
        session.query(Job).filter(Job.task_id == task_id).delete()
        # task_doc
        session.query(TaskDoc).filter(TaskDoc.task_id == task_id).delete()
        # task_sql
        session.query(TaskSQL).filter(TaskSQL.task_id == task_id).delete()
        # task_table
        session.query(TaskTable).filter(TaskTable.task_id == task_id).delete()
        # task_column
        session.query(TaskColumn).filter(TaskColumn.task_id == task_id).delete()
        
        # Delete vector database
        TaskService.refresh_task_vector_db(task, is_delete=True)
            
    @staticmethod
    def get_task_detail(session, task_id: int) -> TaskDTO:
        """
        Get task details including associated tables and columns
        
        Args:
            task_id: Task ID
            
        Returns:
            TaskDTO: Task details, returns None if not found
        """
        task = session.query(Task).get(task_id)
        if not task:
            return None
            
        return TaskService.task_to_task_dto(session, task)
            
    @staticmethod
    def task_to_task_dto(session, task: Task):
        # Get associated SQL records
        task_sqls = session.query(TaskSQL.sql_id, Task.question, Task.sql)\
            .join(Task, TaskSQL.sql_id == Task.id)\
            .filter(TaskSQL.task_id == task.id)\
            .order_by(TaskSQL.id)\
            .all()
        # Get associated table and column information
        task_tables = session.query(TaskTable).filter(TaskTable.task_id == task.id).all()
        task_columns = session.query(TaskColumn).filter(TaskColumn.task_id == task.id).all()
        # Get jobs
        jobs = session.query(Job).filter(Job.task_id == task.id).order_by(Job.id.asc()).all()
        # Get associated documents
        task_docs = session.query(TaskDoc.id, TaskDoc.doc_id, DefinitionDoc.def_doc)\
            .join(DefinitionDoc, TaskDoc.doc_id == DefinitionDoc.id)\
            .filter(TaskDoc.task_id == task.id)\
            .all()
        # Get learning results
        learn_result = json.loads(task.learn_result) if task.learn_result else None
        
        return TaskDTO(id=task.id,
                       project_id=task.project_id,
                       version=task.version,
                       question=task.question,
                       question_supplement=task.question_supplement,
                       options=task.options,
                       rules=task.rules,
                       related_columns=task.related_columns,
                       sql=task.sql,
                       sql_right=task.sql_right,
                       sql_refer=task.sql_refer,
                       learn_result=learn_result,
                       created_at=task.created_at,
                       updated_at=task.updated_at,
                       tables=[TaskTableDTO(table_name=t.table_name) for t in task_tables],
                       columns=[TaskColumnDTO(table_name=c.table_name, column_name=c.column_name) 
                               for c in task_columns],
                       docs=[TaskDocDTO(doc_id=d.doc_id, def_doc=d.def_doc) for d in task_docs],
                       sqls=[TaskSQLDTO(task_id=s.sql_id, question=s.question, sql=s.sql) for s in task_sqls],
                       jobs=[JobService.job_to_job_dto(job) for job in jobs]
                    )
            
    @staticmethod
    def update_selected_columns(session, task_id: int, selected_columns: list[SelectedColumnDTO]):
        """
        Update selected tables and columns for a task
        
        Args:
            task_id: Task ID
            selected_columns: List of selected column information
        """
        # Check if the task exists
        task = session.query(Task).get(task_id)
        if not task:
            raise ValueError('Task not found')
            
        # Delete existing table and column records
        session.query(TaskTable).filter(TaskTable.task_id == task_id).delete()
        session.query(TaskColumn).filter(TaskColumn.task_id == task_id).delete()
        
        # Get unique table names
        unique_tables = {col['table'] for col in selected_columns}
        
        # Insert new table records
        for table_name in unique_tables:
            task_table = TaskTable(
                project_id=task.project_id,
                task_id=task_id,
                table_name=table_name
            )
            session.add(task_table)
            
        # Insert new column records
        for column in selected_columns:
            for column_name in column['columns']:
                task_column = TaskColumn(
                    project_id=task.project_id,
                    task_id=task_id,
                    table_name=column['table'],
                    column_name=column_name
                )
                session.add(task_column)
            
    @staticmethod
    def update_selected_docs(session, task_id: int, selected_docs: list[int]):
        """
        Update selected documents for a task
        """
        task = session.query(Task).get(task_id)
        # task_doc table record update
        # Delete existing records
        session.query(TaskDoc).filter(TaskDoc.task_id == task_id).delete()
        # Insert new records
        for doc_id in selected_docs:
            task_doc = TaskDoc(
                project_id=task.project_id,
                task_id=task_id,
                doc_id=doc_id
            )
            session.add(task_doc)
        session.commit()
        
    @staticmethod
    async def gen_related_columns_async(session, job_id: int):
        """
        Async task to generate related columns
        """
        job = session.query(Job).get(job_id)
        task_id = job.task_id
        
        task = session.query(Task).get(task_id)
        task_version = task.version
        question = task.question
        question_supplement = task.question_supplement
        
        # Build prompt
        
        # Get associated documents
        doc_content = get_doc_content(session, task_id)
        
        # Get associated SQL records
        sql_content = get_sql_log_structure_markdown(session, task_id)
        
        prompt = get_gen_related_columns(question, question_supplement, doc_content, sql_content)
        # Write to job
        job = session.query(Job).get(job_id)
        json_data = job.job_data or {}
        json_data['prompt'] = prompt
        job.update(job_data=json_data)
        session.commit()
    
        # related_columns
        from services.openai_service import OpenAIService
        related_columns_str = await OpenAIService.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            response_format={
                'type': 'json_object'
            },
        )

        # Check job status
        if not TaskService.check_job_status(session, job_id):
            return
        
        # Extract json
        related_columns = extract_json(related_columns_str)
        # Update task's related_columns
        task = session.query(Task).get(task.id)
        if task_version != task.version:
            raise OptimisticLockException()
        task.update(related_columns=json.dumps(related_columns))
        session.commit()
        
    @staticmethod
    async def match_doc_async(session, job_id: int):
        """
        Async task to match documents
        """
        job = session.query(Job).get(job_id)
        task_id = job.task_id
        
        task = session.query(Task).get(task_id)
        # Vector database: query top 5 results
        from vector_stores import doc_def_store
        results = doc_def_store.query_documents(task.question,
                                                n_results=task.options.get('matchDocCount', 5),
                                                where={"$and": [
                                                    {"project_id": {"$eq": task.project_id}},
                                                    {"def_selected": {"$eq": False}},
                                                    {"disabled": {"$eq": False}}
                                                ]})
        
        # Record added doc_ids to prevent duplicates
        added_doc_ids = set()
        
        # Add default selected (and not disabled) docs
        doc_definitions = session.query(DefinitionDoc).filter_by(project_id=task.project_id, def_selected=True, disabled=False).all()
        for doc_definition in doc_definitions:
            if doc_definition.id not in added_doc_ids:
                task_doc = TaskDoc(project_id=task.project_id, task_id=task_id, doc_id=doc_definition.id)
                session.add(task_doc)
                added_doc_ids.add(doc_definition.id)
                
        # Add new docs
        for result in results['metadatas'][0]:
            doc_id = result['id']
            if doc_id not in added_doc_ids:
                task_doc = TaskDoc(project_id=task.project_id, task_id=task_id, doc_id=doc_id)
                session.add(task_doc)
                added_doc_ids.add(doc_id)
            
        session.commit()
        
        
    @staticmethod
    async def match_sql_log_async(session, job_id: int):
        """
        Async task to match SQL logs
        """
        job = session.query(Job).get(job_id)
        task_id = job.task_id
        
        task = session.query(Task).get(task_id)
        
        # Vector database: query top 5 results
        from vector_stores import sql_log_store
        results = sql_log_store.query_documents(task.question,
                                                n_results=task.options.get('matchSqlLogCount', 5),
                                                where={"project_id": task.project_id})
        
        # Add new task_sql records
        for result in results['metadatas'][0]:
            task_sql = TaskSQL(project_id=task.project_id, task_id=task_id, sql_id=result['task_id'])
            session.add(task_sql)
        session.commit()
        
        
    @staticmethod
    async def match_ddl_async(session, job_id: int):
        """
        Async task to match DDL
        """
        job = session.query(Job).get(job_id)
        task_id = job.task_id
        
        task = session.query(Task).get(task_id)
        related_columns_info = json.loads(task.related_columns)
        related_tables = related_columns_info['tables']
        related_columns = related_columns_info['columns']
        
        # Vector database: first query tables, then query top 5 results for each table
        from vector_stores import table_def_store, column_def_store
        all_table_set = set()
        
        # Use thread pool to concurrently query tables
        from concurrent.futures import ThreadPoolExecutor
        
        def query_table(related_table):
            table_name = related_table['t']
            table_description = related_table['d']
            results = table_def_store.query_documents(f"Table: {table_name}\nDescription: {table_description}",
                                                      n_results=task.options.get('matchDdlTableCount', 5),
                                                      where={"$and": [
                                                          {"project_id": {"$eq": task.project_id}},
                                                          {"disabled": {"$eq": False}}
                                                      ]})
            return [metadata['table'] for metadata in results['metadatas'][0]]
            
        with ThreadPoolExecutor(max_workers=3) as executor:
            table_results = list(executor.map(query_table, related_tables))
            for tables in table_results:
                all_table_set.update(tables)
        
        # Vector database: query top 5 results for each table
        all_columns = {}
        
        def query_column(related_column):
            table_name = related_column['t']
            column_name = related_column['c']
            column_description = related_column['d']
            results = column_def_store.query_documents(f"Table: {table_name}\nColumn: {column_name}\nDescription: {column_description}",
                                                       n_results=task.options.get('matchDdlColumnCount', 5),
                                                       where={"$and": [{"table": {"$in": list(all_table_set)}},
                                                                      {"project_id": task.project_id}]})
            return [(result['table'], result['column']) for result in results['metadatas'][0]]
            
        with ThreadPoolExecutor(max_workers=3) as executor:
            column_results = list(executor.map(query_column, related_columns))
            for table_column_pairs in column_results:
                for table, column in table_column_pairs:
                    table_set = all_columns.get(table, set())
                    table_set.add(column)
                    all_columns[table] = table_set
                
        # Add new task_table records
        for table_name in all_columns:
            task_table = TaskTable(
                project_id=task.project_id,
                task_id=task.id,
                table_name=table_name
            )
            session.add(task_table)
        # Add new task_column records
        for table_name in all_columns:
            for column_name in all_columns.get(table_name):
                task_column = TaskColumn(
                    project_id=task.project_id,
                    task_id=task.id,
                    table_name=table_name,
                    column_name=column_name
                )
                session.add(task_column)
        session.commit()
        
    @staticmethod
    async def generate_sql_async(session, job_id: int):
        """
        Async task to generate SQL
        """
        job = session.query(Job).get(job_id)
        job_version = job.version
        task_id = job.task_id
        
        # Get table structure markdown
        table_structure_markdown = get_table_structure_markdown(session, task_id)
        relation_structure_markdown = get_relation_structure_markdown(session, task_id)
        
        task = session.query(Task).get(task_id)
        project = session.query(Project).get(task.project_id)
        task_version = task.version

        # Get associated documents
        doc_content = get_doc_content(session, task_id)
        # Get associated SQL records
        sql_content = get_sql_log_structure_markdown(session, task_id)
        
        # Get rules structure markdown
        rules_structure_markdown = get_rule_structure_markdown(session, task)
        
        # Build prompt
        prompt = get_gen_sql(
            task.question,
            task.question_supplement,
            doc_content,
            sql_content,
            table_structure_markdown,
            relation_structure_markdown,
            rules_structure_markdown,
            project.db_type,
            project.db_version
        )
        # Update job (add prompt to json)
        job = session.query(Job).get(job_id)
        if job_version != job.version:
            raise OptimisticLockException()
        json_data = job.job_data or {}
        json_data['prompt'] = prompt
        job.update(job_data=json_data)
        session.commit()

        # Call OpenAI to generate SQL
        from services.openai_service import OpenAIService
        sql_str = await OpenAIService.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            response_format={
                'type': 'json_object'
            },
        )
        
        # Check job status
        if not TaskService.check_job_status(session, job_id):
            return
        
        sql_json = extract_json(sql_str)
        sql_content = sql_json['sql']
        
        # Format SQL
        sql_content = sqlparse.format(sql_content, reident=True, keyword_case='upper')
        
        # Update task
        task = session.query(Task).get(task_id)
        if task_version != task.version:
            raise OptimisticLockException()
        task.update(sql=sql_content)
        session.commit()
        

    @staticmethod
    def req_generate_sql(session, task_id: int):
        """
        Request to generate SQL
        """ 
        # Get task
        task = session.query(Task).get(task_id)
        if not task:
            raise ValueError('Task not found')
        # The last job is still running
        last_job = session.query(Job).filter(Job.task_id == task_id).order_by(Job.created_at.desc()).first()
        if last_job and last_job.job_status != JobStatus.SUCCESS.value and last_job.job_status != JobStatus.FAIL.value:
            raise ValueError('last job is running')
        
        # Reset sql_right and sql_refer
        task.update(sql_right=None, sql_refer=None)
        
        # Create job
        JobService.create_job(session, task_id, JobType.GENERATE_SQL.value)
        
    @staticmethod
    def learn(session, task_id: int):
        """Learning process"""
        # Get task
        task = session.query(Task).get(task_id)
        if not task:
            raise ValueError('Task not found')
        
        # sql is not empty
        if not task.sql:
            raise ValueError('sql is empty')
        
        # Create job
        JobService.create_job(session, task_id, JobType.LEARN_FROM_SQL.value)

    @staticmethod
    def search_sql_log(project_id: int, content: str) -> list[dict]:
        """
        Search SQL logs
        """
        from vector_stores import sql_log_store
        results = sql_log_store.query_documents(content, n_results=10, where={"project_id": project_id})
        return results['metadatas'][0]

    @staticmethod
    def update_question(session, task_id: int, question: str, question_supplement: str):
        """
        Update task question
        """
        task = session.query(Task).get(task_id)
        task.update(question=question, question_supplement=question_supplement)
        
    @staticmethod
    def update_task_doc(session, task_id: int, doc_ids: list[int]):
        """
        Update task documents
        """
        task = session.query(Task).get(task_id)
        # Delete existing records
        session.query(TaskDoc).filter(TaskDoc.task_id == task_id).delete()
        # Add new records
        for doc_id in doc_ids:
            task_doc = TaskDoc(project_id=task.project_id, task_id=task_id, doc_id=doc_id)
            session.add(task_doc)
            
    @staticmethod
    def update_task_sql_log(session, task_id: int, sql_ids: list[int]):
        """
        Update task SQL log references
        """
        task = session.query(Task).get(task_id)
        # Delete existing records
        session.query(TaskSQL).filter(TaskSQL.task_id == task_id).delete()
        # Add new records
        for sql_id in sql_ids:
            task_sql = TaskSQL(project_id=task.project_id, task_id=task_id, sql_id=sql_id)
            session.add(task_sql)
        
    @staticmethod
    def update_sql(session, task_id: int, sql: str):
        """
        Update task SQL
        """
        task = session.query(Task).get(task_id)
        task.update(sql=sql)
        
    @staticmethod
    def update_sql_feedback(session, task_id: int, sql_right: bool, sql_refer: bool):
        """
        Update SQL feedback for a task
        """
        task: Task = session.query(Task).get(task_id)
        task.update(sql_right=sql_right, sql_refer=sql_refer, def_waiting=True)
        
        # Add learning job
        if sql_right and not task.learn_result and task.options.get('autoLearnOnRight'):
            # Check if the current job exists
            job = session.query(Job).filter(Job.task_id == task_id).order_by(Job.id.desc()).first()
            if not job or job.job_status in [JobStatus.SUCCESS.value, JobStatus.FAIL.value, JobStatus.CANCELED.value]:
                JobService.create_job(session, task_id, JobType.LEARN_FROM_SQL.value)
        
    @staticmethod
    async def learn_from_sql_async(session, job_id: int):
        """
        Async task to learn from SQL
        """
        job = session.query(Job).get(job_id)
        task_id = job.task_id
        
        # Get table structure markdown
        table_structure_markdown = get_table_structure_markdown(session, task_id)
        sql_structure_markdown = get_sql_log_structure_markdown(session, task_id)
        
        task = session.query(Task).get(task_id)
        task_version = task.version

        # Build prompt
        prompt = get_learn(
            task.question,
            task.question_supplement,
            task.sql,
            table_structure_markdown,
            sql_structure_markdown
        )
        # Write to job
        job = session.query(Job).get(job_id)
        json_data = job.job_data or {}
        json_data['prompt'] = prompt
        job.update(job_data=json_data)
        session.commit()
        # Call OpenAI to generate SQL
        from services.openai_service import OpenAIService
        resp_str = await OpenAIService.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            response_format={
                'type': 'json_object'
            },
        )
        
        # Check job status
        if not TaskService.check_job_status(session, job_id):
            return
        
        resp_json = extract_json(resp_str)
        
        # Update task
        task = session.query(Task).get(task_id)
        if not task.learn_result:   
            task.update(learn_result=json.dumps(resp_json, ensure_ascii=False))
            session.commit()

    @staticmethod
    def accept_learn_result(session, task_id: int, learn_result: LearnResultDTO):
        """Accept learning results"""        
        task = session.query(Task).get(task_id)
        
        # Update table descriptions in TableDefinition
        for table in learn_result['tables']:
            table_definition: DefinitionTable = session.query(DefinitionTable).filter(DefinitionTable.project_id == task.project_id, DefinitionTable.def_table == table['table']).first()
            if table_definition:
                table_definition.update(def_ai_comment=table['desc'], def_waiting=True)
            
        # Update descriptions in ColumnDefinition
        for column in learn_result['columns']:
            column_definition: DefinitionColumn = session.query(DefinitionColumn).filter(DefinitionColumn.project_id == task.project_id, DefinitionColumn.def_table == column['table'], DefinitionColumn.def_column == column['column']).first()
            if column_definition:
                column_definition.update(def_ai_comment=column['desc'], def_waiting=True)
            
        # Add records to RelationDefinition
        for relation in learn_result['relations']:
            relation_definition = session.query(DefinitionRelation).filter(DefinitionRelation.project_id == task.project_id, DefinitionRelation.table1 == relation['table1'], DefinitionRelation.column1 == relation['column1'], DefinitionRelation.table2 == relation['table2'], DefinitionRelation.column2 == relation['column2']).first()
            if not relation_definition:
                relation_definition = session.query(DefinitionRelation).filter(DefinitionRelation.project_id == task.project_id, DefinitionRelation.table1 == relation['table2'], DefinitionRelation.column1 == relation['column2'], DefinitionRelation.table2 == relation['table1'], DefinitionRelation.column2 == relation['column1']).first()
                if not relation_definition:
                    relation_definition = DefinitionRelation(project_id=task.project_id, table1=relation['table1'], column1=relation['column1'], table2=relation['table2'], column2=relation['column2'], relation_type=relation['relation_type'])
                    session.add(relation_definition)
                else:
                    relation_definition.update(relation_type=reverse_relation_type(relation['relation_type']))
            else:
                relation_definition.update(relation_type=relation['relation_type'])

    @staticmethod
    def paginate_questions(project_id: int, page: int, per_page: int) -> dict:
        """
        Get paginated list of all task questions
        """
        pagination = Task.query.filter_by(project_id=project_id).with_entities(
            Task.id,
            Task.question,
            Task.sql_right,
            Task.sql_refer
        ).order_by(
            Task.id.desc()
        ).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return pagination