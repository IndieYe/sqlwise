from models.definition_column import DefinitionColumn
from models.definition_table import DefinitionTable
from models.definition_relation import DefinitionRelation
from dto.schema_dto import DefinitionTableDTO, DefinitionColumnDTO, DefinitionRelationDTO, SchemaDTO
from dto.ai_comment_dto import UpdateAICommentDTO
from dto.definition_doc_query_result_dto import DefinitionDocQueryResultDTO
from flask_smorest import abort
from models.definition_doc import DefinitionDoc
from models.project import Project
from dto.definition_rule_dto import DefinitionRuleDTO
from models.definition_rule import DefinitionRule
from utils.utils import reverse_relation_type
from dto.gen_ai_comments_dto import GenAICommentsTableDTO
from services.openai_service import OpenAIService
from utils.utils import extract_json
from dto.gen_ai_comments_dto import GenAICommentsResponseDTO, GenAICommentsResponseColumnDTO, GenAICommentsColumnDTO
from database import db
from models.task import Task
from dto.project_settings_dto import ProjectSettingsDTO
from models.task_doc import TaskDoc
from models.task_sql import TaskSQL
from models.task_table import TaskTable
from models.task_column import TaskColumn
from models.job import Job
from dto.update_ddl_by_query_dto import UpdateDDLByQueryDTO
from dto.refresh_index_query_dto import RefreshIndexQueryDTO
from dto.disable_table_query import DisableTableQueryDTO
from utils.prompt_util import get_gen_ai_comments

class DefService:
    def disable_table(session, query: DisableTableQueryDTO):
        """Disable table"""
        session.query(DefinitionTable).filter_by(project_id=query.project_id, def_table=query.table).update({
            DefinitionTable.disabled: query.disabled,
            DefinitionTable.def_waiting: True
        })
        
    @staticmethod
    def update_ddl(session, project_id: int, table_csv_reader, column_csv_reader):
        """Update DDL"""
        project = session.query(Project).get(project_id)
        
        # Increment version number
        new_version = project.cur_version + 1
        
        # Import table definitions
        DefService.import_table_definitions(session, project_id, table_csv_reader, new_version)
        # Import column definitions 
        DefService.import_column_definitions(session, project_id, column_csv_reader, new_version)
        
        # Update project
        project.cur_version = new_version
    
    @staticmethod
    def update_ddl_by_query(session, update_ddl_by_query_dto: UpdateDDLByQueryDTO):
        """Update DDL using query result json"""
        project = session.query(Project).get(update_ddl_by_query_dto.project_id)
        
        # Increment version number
        new_version = project.cur_version + 1
        
        # Import table definitions
        for table in update_ddl_by_query_dto.tables:
            DefService.add_or_update_table_definition(session, update_ddl_by_query_dto.project_id, table.table, table.comment, cur_version=new_version)
        # Import column definitions
        for column in update_ddl_by_query_dto.columns:
            DefService.add_or_update_column_definition(session, update_ddl_by_query_dto.project_id, column.table, column.column, column.type, column.comment, cur_version=new_version)
        
        # Update project
        project.cur_version = new_version
    
    @staticmethod
    def refresh_index(session, query: RefreshIndexQueryDTO):
        """Refresh index"""
        project = session.query(Project).get(query.project_id)
        
        # table
        if query.refresh_table:
            # clear table_def_store
            from vector_stores import table_def_store
            table_def_store.delete_documents(where={"project_id": query.project_id})
            # Re-add to vector database
            session.query(DefinitionTable).filter_by(project_id=query.project_id, def_version=project.cur_version).update({
                DefinitionTable.def_waiting: True
            })
            
        # column
        if query.refresh_column:
            # clear column_def_store
            from vector_stores import column_def_store
            column_def_store.delete_documents(where={"project_id": query.project_id})
            # Re-add to vector database
            session.query(DefinitionColumn).filter_by(project_id=query.project_id, def_version=project.cur_version).update({
                DefinitionColumn.def_waiting: True
            })
            
        # doc
        if query.refresh_doc:
            # clear doc_def_store
            from vector_stores import doc_def_store
            doc_def_store.delete_documents(where={"project_id": query.project_id})
            # Re-add to vector database
            session.query(DefinitionDoc).filter_by(project_id=query.project_id).update({
                DefinitionDoc.def_waiting: True
            })
            
        # sql log
        if query.refresh_sql:
            # clear sql_log_store
            from vector_stores import sql_log_store
            sql_log_store.delete_documents(where={"project_id": query.project_id})
            # Re-add to vector database
            session.query(Task).filter_by(project_id=query.project_id, sql_refer=True).update({
                Task.def_waiting: True
            })
        
    @staticmethod
    def get_project_settings(session, project_id: int) -> ProjectSettingsDTO:
        """Get project settings"""
        project = session.query(Project).get(project_id)
        
        # Get count of tables waiting for vector building
        vector_waiting_table_count = session.query(DefinitionTable).filter_by(def_waiting=True).count()
        # Get count of columns waiting for vector building  
        vector_waiting_column_count = session.query(DefinitionColumn).filter_by(def_waiting=True).count()
        # Get count of docs waiting for vector building
        vector_waiting_doc_count = session.query(DefinitionDoc).filter_by(def_waiting=True).count()
        # Get count of tasks waiting for vector building
        vector_waiting_task_count = session.query(Task).filter_by(def_waiting=True).count()
        
        definition_doc_count = session.query(DefinitionDoc).filter_by(project_id=project_id).count()
        definition_rule_count = session.query(DefinitionRule).filter_by(project_id=project_id).count()
        definition_table_count = session.query(DefinitionTable).filter_by(project_id=project_id).count()
        definition_column_count = session.query(DefinitionColumn).filter_by(project_id=project_id).count()
        definition_relation_count = session.query(DefinitionRelation).filter_by(project_id=project_id).count()
        
        task_count = session.query(Task).filter_by(project_id=project_id).count()
        task_doc_count = session.query(TaskDoc).filter_by(project_id=project_id).count()
        task_sql_count = session.query(TaskSQL).filter_by(project_id=project_id).count()
        task_table_count = session.query(TaskTable).filter_by(project_id=project_id).count()
        task_column_count = session.query(TaskColumn).filter_by(project_id=project_id).count()
        job_count = session.query(Job).filter_by(project_id=project_id).count()
        
        project_settings = ProjectSettingsDTO(
            name=project.name,
            description=project.description,
            db_type=project.db_type,
            db_version=project.db_version,
            vector_waiting_table_count=vector_waiting_table_count,
            vector_waiting_column_count=vector_waiting_column_count,
            vector_waiting_doc_count=vector_waiting_doc_count,
            vector_waiting_task_count=vector_waiting_task_count,
            definition_doc_count=definition_doc_count,
            definition_rule_count=definition_rule_count,
            definition_table_count=definition_table_count,
            definition_column_count=definition_column_count,
            definition_relation_count=definition_relation_count,
            task_count=task_count,
            task_doc_count=task_doc_count,
            task_sql_count=task_sql_count,
            task_table_count=task_table_count,
            task_column_count=task_column_count,
            job_count=job_count
        )
        
        return project_settings
    
    @staticmethod
    def get_schema(session, project_id: int) -> SchemaDTO:
        """Get the entire schema"""
        # get all table definitions
        table_definitions = session.query(DefinitionTable).filter_by(project_id=project_id).order_by(DefinitionTable.def_table).all()
        # get all column definitions
        column_definitions = session.query(DefinitionColumn).filter_by(project_id=project_id).order_by(DefinitionColumn.def_table, DefinitionColumn.def_column).all()
        # get all relation definitions
        relation_definitions = session.query(DefinitionRelation).filter_by(project_id=project_id).order_by(DefinitionRelation.table1, DefinitionRelation.column1, DefinitionRelation.table2, DefinitionRelation.column2, DefinitionRelation.relation_type).all()
        # get all rule definitions
        rule_definitions = session.query(DefinitionRule).filter_by(project_id=project_id, disabled=False).order_by(DefinitionRule.id).all()
        # convert to dto
        table_dtos = [DefinitionTableDTO(table=table.def_table, comment=table.def_comment, ai_comment=table.def_ai_comment, disabled=table.disabled) for table in table_definitions]
        column_dtos = [DefinitionColumnDTO(table=column.def_table, column=column.def_column, type=column.def_type, comment=column.def_comment, ai_comment=column.def_ai_comment) for column in column_definitions]
        relation_dtos = [DefinitionRelationDTO(table1=relation.table1, column1=relation.column1, table2=relation.table2, column2=relation.column2, relation_type=relation.relation_type) for relation in relation_definitions]
        rule_dtos = [DefinitionRuleDTO(id=rule.id, name=rule.name, content=rule.content, def_selected=rule.def_selected, disabled=rule.disabled) for rule in rule_definitions]
        return SchemaDTO(tables=table_dtos, columns=column_dtos, relations=relation_dtos, rules=rule_dtos)
    
    @staticmethod
    def add_or_update_table_definition(session, project_id: int, table_name: str, table_comment: str | None = None, ai_comment: str = None, cur_version: int = 1):
        """Add or update table definition"""
        table_name = table_name.strip()
        table_comment = table_comment.strip().strip('"') if table_comment else None
        ai_comment = ai_comment.strip() if ai_comment else None
        
        # Check if table already exists
        table_definition = session.query(DefinitionTable).filter_by(
            project_id=project_id,
            def_table=table_name,
        ).first()
        
        if table_definition:
            # Update existing record
            if table_definition.def_comment != table_comment:
                table_definition.def_comment = table_comment
                table_definition.def_waiting = True
        else:
            # Create new record
            table_definition = DefinitionTable(
                project_id=project_id,
                def_table=table_name,
                def_comment=table_comment,
                def_waiting=True,
            )
            session.add(table_definition)
        
        table_definition.def_version = cur_version
        session.commit()
        
    @staticmethod
    def add_or_update_table_vector_db(table_definition: DefinitionTable):
        table_name = table_definition.def_table
        table_comment = table_definition.def_comment
        ai_comment = table_definition.def_ai_comment
        
        # Priority:
        # 1. ai_comment
        # 2. table_comment
        # 3. table_name
        final_comment = ai_comment if ai_comment else table_comment if table_comment else table_name
            
        # Add to vector store
        from vector_stores import table_def_store
        table_def_store.add_document(
            document=f"Table: {table_name}\nDescription: {final_comment}",
            metadata={
                "project_id": table_definition.project_id,
                "table": table_name,
                "version": table_definition.def_version,
                "disabled": table_definition.disabled or False
            },
            doc_id=str(table_definition.id)
        )

    @staticmethod
    def remove_table_vector_db(table_definition: DefinitionTable):
        table_name = table_definition.def_table
        from vector_stores import table_def_store
        table_def_store.delete_documents(where={
            "$and": [
                {"project_id": {"$eq": table_definition.project_id}},
                {"table": {"$eq": table_name}},
                {"version": {"$eq": table_definition.def_version}}
            ]
        })
        
    @staticmethod
    def add_or_update_column_definition(session, project_id: int, table_name: str, column_name: str, data_type: str, comment: str | None = None, ai_comment: str = None, cur_version: int = 1):
        """Add or update column definition"""
        table_name = table_name.strip()
        column_name = column_name.strip()
        data_type = data_type.strip()
        comment = comment.strip().strip('"') if comment else None
        ai_comment = ai_comment.strip() if ai_comment else None
        
        # Check if column already exists
        column_definition = session.query(DefinitionColumn).filter_by(
            project_id=project_id,
            def_table=table_name,
            def_column=column_name
        ).first()
        
        if column_definition:
            # Update existing record
            if column_definition.def_type != data_type or column_definition.def_comment != comment:
                column_definition.def_type = data_type
                column_definition.def_comment = comment
                column_definition.def_waiting = True
        else:
            # Create new record
            column_definition = DefinitionColumn(
                project_id=project_id,
                def_table=table_name,
                def_column=column_name,
                def_type=data_type,
                def_comment=comment,
                def_waiting=True,
            )
            session.add(column_definition)
        
        column_definition.def_version = cur_version
        session.commit()
        
    @staticmethod
    def add_or_update_column_vector_db(column_definition: DefinitionColumn):
        table_name = column_definition.def_table
        column_name = column_definition.def_column
        data_type = column_definition.def_type
        comment = column_definition.def_comment
        ai_comment = column_definition.def_ai_comment
        
        # Priority:
        # 1. ai_comment
        # 2. comment
        # 3. column_name
        final_comment = ai_comment if ai_comment else comment if comment else column_name
            
        # Add to vector store
        from vector_stores import column_def_store
        column_def_store.add_document(
            document=f"Table: {table_name}\nColumn: {column_name}\nDescription: {final_comment}",
            metadata={
                "project_id": column_definition.project_id,
                "table": table_name,
                "column": column_name,
                "data_type": data_type,
                "version": column_definition.def_version
            },
            doc_id=str(column_definition.id)
        )

    @staticmethod
    def remove_column_vector_db(column_definition: DefinitionColumn):
        table_name = column_definition.def_table
        column_name = column_definition.def_column
        from vector_stores import column_def_store
        column_def_store.delete_documents(where={
            "$and": [
                {"project_id": {"$eq": column_definition.project_id}},
                {"table": {"$eq": table_name}},
                {"column": {"$eq": column_name}},
                {"version": {"$eq": column_definition.def_version}}
            ]
        })
        
    @staticmethod
    def import_table_definitions(session, project_id: int, csv_reader, cur_version):
        """Import table definitions from CSV data"""
        # Verify CSV headers
        headers = next(csv_reader)
        expected_headers = ['table_name', 'table_comment']
        if len(headers) < len(expected_headers):
            abort(400, message='Invalid CSV format. Table Missing required columns')
        
        # Process data rows
        row_count = 0
        for row in csv_reader:
            if len(row) >= 2:
                table_name, table_comment = row[:2]
                # Basic data validation
                if not table_name.strip():
                    continue  # Skip empty lines
                
                DefService.add_or_update_table_definition(session, project_id, table_name, table_comment, cur_version=cur_version)
                row_count += 1
        
        if row_count == 0:
            abort(400, message='No valid data found in CSV file')
            
        session.commit()
        return row_count
    
    @staticmethod
    def import_column_definitions(session, project_id: int, csv_reader, cur_version):
        """Import column definitions from CSV data"""
        # Verify CSV headers
        headers = next(csv_reader)
        expected_headers = ['table_name', 'column_name', 'data_type', 'comment']
        if len(headers) < len(expected_headers):
            abort(400, message='Invalid CSV format. Column Missing required columns')
        
        # Process data rows
        row_count = 0
        for row in csv_reader:
            if len(row) >= 4:
                table_name, column_name, data_type, comment = row[:4]
                # Basic data validation
                if not all([table_name.strip(), column_name.strip(), data_type.strip()]):
                    continue  # Skip empty lines
                
                DefService.add_or_update_column_definition(session, project_id, table_name, column_name, data_type, comment, cur_version=cur_version)
                row_count += 1
        
        if row_count == 0:
            abort(400, message='No valid data found in CSV file')
            
        session.commit()
        return row_count
    
    @staticmethod
    def update_ai_comment(session, update_ai_comment_dto: UpdateAICommentDTO):
        """Update AI comments for tables and columns"""
        project_id = update_ai_comment_dto.project_id
        table = update_ai_comment_dto.table
        comment = update_ai_comment_dto.comment
        columns = update_ai_comment_dto.columns
        relations = update_ai_comment_dto.relations
        
        session.query(DefinitionTable).filter_by(project_id=project_id, def_table=table).update({
            DefinitionTable.def_ai_comment: comment,
            DefinitionTable.def_waiting: True
        })
        
        for column in columns:
            column_def = session.query(DefinitionColumn).filter_by(project_id=project_id, def_table=table, def_column=column.col).first()
            # Performance optimization: only update if AI comment has changed
            if column_def and column_def.def_ai_comment != column.comment:
                column_def.update(def_ai_comment=column.comment, def_waiting=True)
        
        # First delete relations where table1 or table2 matches the table
        session.query(DefinitionRelation).filter_by(project_id=project_id, table1=table).delete()
        session.query(DefinitionRelation).filter_by(project_id=project_id, table2=table).delete()
        
        # Then add new relations
        for relation in relations:
            relation_definition = session.query(DefinitionRelation).filter_by(project_id=project_id, table1=relation.table1, column1=relation.column1, table2=relation.table2, column2=relation.column2).first()
            if relation_definition:
                relation_definition.update(relation_type=relation.relation_type)
            else:
                relation_definition = session.query(DefinitionRelation).filter_by(project_id=project_id, table1=relation.table2, column1=relation.column2, table2=relation.table1, column2=relation.column1).first()
                if relation_definition:
                    relation_definition.update(relation_type=reverse_relation_type(relation.relation_type))
                else:
                    session.add(DefinitionRelation(project_id=project_id, table1=relation.table1, column1=relation.column1, table2=relation.table2, column2=relation.column2, relation_type=relation.relation_type))
        
    @staticmethod
    def delete_relation(session, project_id: int, table1, column1, table2, column2):
        """Delete relation"""
        session.query(DefinitionRelation).filter_by(project_id=project_id, table1=table1, column1=column1, table2=table2, column2=column2).delete()
        session.query(DefinitionRelation).filter_by(project_id=project_id, table1=table2, column1=column2, table2=table1, column2=column1).delete()
        
    @staticmethod
    def paginate_doc_definitions(session, project_id: int, page=1, per_page=20):
        """Get document definition list"""
        pagination = DefinitionDoc.query.filter_by(project_id=project_id).order_by(
            DefinitionDoc.id.desc()
        ).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # Return pagination object directly, let the upper layer handle serialization
        return pagination
    
    @staticmethod
    def refresh_doc_vector_db(doc_definition: DefinitionDoc, is_delete=False):
        """Update document vector database"""
        from vector_stores import doc_def_store
        if is_delete:
            doc_def_store.delete_documents(where={"id": doc_definition.id})
        else:
            doc_def_store.add_document(
                document=doc_definition.def_doc,
                metadata={
                    "project_id": doc_definition.project_id,
                    "id": doc_definition.id, 
                    "content": doc_definition.def_doc,
                    "def_selected": doc_definition.def_selected or False,
                    "disabled": doc_definition.disabled or False
                },
                doc_id=str(doc_definition.id)
            )
    
    @staticmethod
    def add_doc_definition(session, project_id: int, def_doc, def_selected=False, disabled=False):
        """Add document definition"""
        doc_definition = DefinitionDoc(project_id=project_id, def_doc=def_doc, def_selected=def_selected, def_waiting=True, disabled=disabled)
        session.add(doc_definition)
        
    @staticmethod
    def update_doc_definition(session, id, def_doc, def_selected=False, disabled=False):
        """Update document definition"""
        doc_definition = session.query(DefinitionDoc).get(id)
        doc_definition.def_doc = def_doc
        doc_definition.def_selected = def_selected
        doc_definition.def_waiting = True
        doc_definition.disabled = disabled
        
    @staticmethod
    def delete_doc_definition(session, id):
        """Delete document definition"""
        doc_definition = session.query(DefinitionDoc).get(id)
        session.delete(doc_definition)
        
        # Delete vector database
        DefService.refresh_doc_vector_db(doc_definition, is_delete=True)

    @staticmethod
    def query_doc_definition(project_id, query):
        """Query document definition"""
        from vector_stores import doc_def_store
        doc_definitions = doc_def_store.query_documents(query, n_results=5, where={"$and": [
            {"project_id": {"$eq": project_id}}, 
            {"def_selected": {"$eq": False}},
            {"disabled": {"$eq": False}}
        ]})
        return [DefinitionDocQueryResultDTO(id=doc['id'], def_doc=doc['content'], def_selected=doc['def_selected'], disabled=doc['disabled']) for doc in doc_definitions['metadatas'][0]]

    @staticmethod
    def add_rule_definition(session, project_id: int, name, content, def_selected=False, disabled=False):
        """Add rule definition"""
        rule_definition = DefinitionRule(project_id=project_id, name=name, content=content, def_selected=def_selected, disabled=disabled)
        session.add(rule_definition)

    @staticmethod
    def update_rule_definition(session, id, name, content, def_selected=False, disabled=False):
        """Update rule definition"""
        session.query(DefinitionRule).filter_by(id=id).update({
            DefinitionRule.name: name, 
            DefinitionRule.content: content, 
            DefinitionRule.def_selected: def_selected,
            DefinitionRule.disabled: disabled
        })

    @staticmethod
    def delete_rule_definition(session, id):
        """Delete rule definition"""
        session.query(DefinitionRule).filter_by(id=id).delete()

    @staticmethod
    def paginate_rule_definitions(session, project_id: int, page=1, per_page=20):
        """Get rule definition pagination list"""
        pagination = DefinitionRule.query.filter_by(project_id=project_id).order_by(
            DefinitionRule.id.desc()
        ).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # Return pagination object directly, let the upper layer handle serialization
        return pagination

    @staticmethod
    async def gen_table_ai_comments(session, project_id: int, table: str) -> GenAICommentsResponseDTO:
        """Generate AI comments for tables"""
        table_definition = session.query(DefinitionTable).filter_by(project_id=project_id, def_table=table).first()
        if not table_definition:
            abort(400, message=f'Table {table} not found')
        
        # Get column definitions
        column_definitions = session.query(DefinitionColumn).filter_by(project_id=project_id, def_table=table).all()
        columns = [GenAICommentsColumnDTO(column=column.def_column, type=column.def_type, comment=column.def_comment) for column in column_definitions]
        tableDTO: GenAICommentsTableDTO = GenAICommentsTableDTO(table=table_definition.def_table, comment=table_definition.def_comment, columns=columns)
        
        prompt = get_gen_ai_comments(tableDTO)
        result_str = await OpenAIService.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            response_format={
                'type': 'json_object'
            },
        )
        result_json = extract_json(result_str)
        table_json = result_json['table']
        columns_json = table_json['cols']
        return GenAICommentsResponseDTO(table=table_json['t'], comment=table_json['v'], columns=[GenAICommentsResponseColumnDTO(column=col['c'], comment=col['v']) for col in columns_json])