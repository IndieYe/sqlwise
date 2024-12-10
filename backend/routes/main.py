from flask.views import MethodView
from flask_smorest import Blueprint, abort
from marshmallow import Schema, fields
from services.task_service import TaskService
from services.def_service import DefService
import asyncio
from flask import request
from services.job_service import JobService
from dto.ai_comment_dto import UpdateAICommentDTO
from dto.definition_rule_dto import DefinitionRuleDTO
from dto.task_dto import TaskDTO
from utils.schemas import MessageResponseSchema, PaginationQuerySchema, ProjectIdQuerySchema, PaginationBaseSchema
from models.definition_relation import DefinitionRelationSchema
from dto.project_settings_dto import ProjectSettingsDTO
from models.definition_doc import DefinitionDocSchema, definition_doc_schema
from dto.gen_ai_comments_dto import GenAICommentsResponseDTO
import csv
from io import StringIO
from dto.update_ddl_by_query_dto import UpdateDDLByQueryDTO
from dto.refresh_index_query_dto import RefreshIndexQueryDTO
from dto.disable_table_query import DisableTableQueryDTO
from dto.update_task_query import UpdateTaskQueryDTO
from dto.definition_doc_query_result_dto import DefinitionDocQueryResultDTO
from models.definition_rule import DefinitionRuleSchema
from utils.schemas import PaginationSchema
from database import session_scope

# Create a blueprint
main_bp = Blueprint('main', __name__, description='Main operations')

class GenerateSchema(Schema):
    taskId = fields.Int(required=True, description='Task ID')
    
class UpdateColumnDDLSchema(Schema):
    table = fields.Str(description='Table name')
    columns = fields.List(fields.Str, description='Column name list')
    
class UpdateTaskDDLSchema(Schema):
    taskId = fields.Int(description='Task ID')
    columns = fields.List(fields.Nested(UpdateColumnDDLSchema), description='Column')
    
class UpdateTaskSqlLogSchema(Schema):
    taskId = fields.Int(description='Task ID')
    sqlIds = fields.List(fields.Int, description='SQL ID list')
    
class UpdateTaskDocSchema(Schema):
    taskId = fields.Int(description='Task ID')
    docIds = fields.List(fields.Int, description='Document ID list')
    
class AddJobSchema(Schema):
    task_id = fields.Int(description='Task ID')
    job_type = fields.Str(description='Task type')
    
class DeleteJobSchema(Schema):
    job_id = fields.Int(description='Task ID')
    
class JobSchema(Schema):
    id = fields.Int(description='Task ID')
    job_type = fields.Str(description='Task type')
    job_type_display_name = fields.Str(description='Task type name')
    job_data = fields.Dict(description='Task data')
    job_status = fields.Str(description='Task status')
    job_status_display_name = fields.Str(description='Task status name')
    success = fields.Bool(description='Whether successful')
    error_message = fields.Str(description='Error message')
    created_at = fields.DateTime(description='Create time')
    updated_at = fields.DateTime(description='Update time')
    job_cost_time = fields.Int(description='Task cost time, unit: ms')

class JobListResponseSchema(Schema):
    jobs = fields.List(fields.Nested(JobSchema), description='Task list')

# 定义请求Schema
class QuestionSchema(Schema):
    question = fields.Str(required=True, description='User question')
    
# 定义请求Schema
class AskQuestionSchema(Schema):
    project_id = fields.Int(description='Project ID', required=True)
    question = fields.Str(required=True, description='User question')
    question_supplement = fields.Str(required=False, description='Question supplement')
    options = fields.Dict(required=False, description='Task options', default={})
    rules = fields.List(fields.Int, required=False, description='Rule id list', default=[])
    
# 定义响应Schema
class OptimizeQuestionResponseSchema(Schema):
    question = fields.Str(description='Optimized question')

class TaskResponseSchema(Schema):
    task_id = fields.Int(description='Created task ID')

# 新增 Schema 类定义
class TaskTableSchema(Schema):
    table_name = fields.Str(description='Table name')

class TaskColumnSchema(Schema):
    table_name = fields.Str(description='Table name')
    column_name = fields.Str(description='Column name')

class TaskDocSchema(Schema):
    doc_id = fields.Int(description='Document ID')
    def_doc = fields.Str(description='Document definition')

class TaskSQLSchema(Schema):
    task_id = fields.Int(description='Task ID') # sql_id对应的任务ID
    question = fields.Str(description='User question')
    sql = fields.Str(description='Generated SQL')

class LearnSchema(Schema):
    taskId = fields.Int(description='Task ID')
    
class TableDescSchema(Schema):
    table = fields.Str(description='Table name')
    desc = fields.Str(description='Table description')
    
class ColumnDescSchema(Schema):
    table = fields.Str(description='Table name')
    column = fields.Str(description='Column name')
    desc = fields.Str(description='Column description')
    
class TableRelationSchema(Schema):
    table1 = fields.Str(description='Table 1')
    column1 = fields.Str(description='Table 1 column')
    table2 = fields.Str(description='Table 2')
    column2 = fields.Str(description='Table 2 column')
    relation_type = fields.Str(allow_none=True, description='Table 1 and Table 2 relationship type, optional values: 1-1(one to one), 1-n(one to many), n-1(many to one), n-n(many to many)')
    
class LearnResultSchema(Schema):
    tables = fields.List(fields.Nested(TableDescSchema), description='Table description list')
    columns = fields.List(fields.Nested(ColumnDescSchema), description='Column description list')
    relations = fields.List(fields.Nested(TableRelationSchema), description='Table relation list')
    
TaskSchema = TaskDTO.Schema()

class DefinitionTableSchema(Schema):
    table = fields.Str(description='Table name')
    comment = fields.Str(description='Table comment')
    ai_comment = fields.Str(description='AI table comment')
    disabled = fields.Bool(description='Whether to disable')

class DefinitionColumnSchema(Schema):
    table = fields.Str(description='Table name')
    column = fields.Str(description='Column name')
    type = fields.Str(description='Column type')
    comment = fields.Str(description='Column comment')
    ai_comment = fields.Str(description='AI column comment')

RuleDefinitionSchema = DefinitionRuleDTO.Schema()
    
class SchemaSchema(Schema):
    tables = fields.List(fields.Nested(DefinitionTableSchema), description='Table definition list')
    columns = fields.List(fields.Nested(DefinitionColumnSchema), description='Column definition list')
    relations = fields.List(fields.Nested(DefinitionRelationSchema), description='Relation definition list')
    rules = fields.List(fields.Nested(RuleDefinitionSchema), description='Rule definition list')
    
class SelectedColumnSchema(Schema):
    table = fields.Str(description='Table name')
    columns = fields.List(fields.Str, description='Column name list')

class SelectedColumnsSchema(Schema):
    taskId = fields.Int(description='Task ID')
    selectedColumns = fields.List(fields.Nested(SelectedColumnSchema), description='Selected columns')
    selectedDocs = fields.List(fields.Int, description='Selected document ID list')
    selectedSqls = fields.List(fields.Int, description='Selected SQL ID list')

class TaskQuestionSchema(Schema):
    id = fields.Int(description='Task ID')
    question = fields.Str(description='User question')
    sql_right = fields.Bool(description='Whether the generated SQL is correct')
    sql_refer = fields.Bool(description='Whether it can be referenced')

class PaginationResponseSchema(Schema):
    items = fields.List(fields.Nested(TaskQuestionSchema), description='Question list')
    total = fields.Int(description='Total')
    page = fields.Int(description='Current page')
    per_page = fields.Int(description='Per page')

class UpdateQuestionSchema(Schema):
    taskId = fields.Int(description='Task ID')
    question = fields.Str(description='Question')
    question_supplement = fields.Str(description='Question supplement')
    
class UpdateSqlSchema(Schema):
    taskId = fields.Int(description='Task ID')
    sql = fields.Str(description='SQL')

class UpdateSqlFeedbackSchema(Schema):
    taskId = fields.Int(description='Task ID')
    sqlRight = fields.Bool(description='Whether the generated SQL is correct')
    sqlRefer = fields.Bool(description='Whether it can be referenced')
    
class VectorSQLSchema(Schema):
    task_id = fields.Int(description='Task ID')
    question = fields.Str(description='User question')
    sql = fields.Str(description='Generated SQL')
    
class SearchSQLLogSchema(Schema):
    project_id = fields.Int(description='Project ID', required=True)
    content = fields.Str(description='Search content')
    
class SearchSQLLogResponseSchema(Schema):
    sqls = fields.List(fields.Nested(VectorSQLSchema), description='SQL list')
    
class AcceptLearnResultSchema(Schema):
    taskId = fields.Int(description='Task ID')
    learnResult = fields.Nested(LearnResultSchema, description='Learning result')
    
class ColumnAICommentSchema(Schema):
    col = fields.Str(description='Column name')
    comment = fields.Str(description='Column AI comment')
    
class UpdateAICommentSchema(Schema):
    project_id = fields.Int(description='Project ID', required=True)
    table = fields.Str(description='Table name')
    comment = fields.Str(description='Table AI comment')
    columns = fields.List(fields.Nested(ColumnAICommentSchema), description='Column AI comment list')
    relations = fields.List(fields.Nested(TableRelationSchema), description='Table relation AI comment list')
    
class RelationSchema(Schema):
    project_id = fields.Int(description='Project ID', required=True)
    table1 = fields.Str(description='Table 1')
    column1 = fields.Str(description='Table 1 column')
    table2 = fields.Str(description='Table 2')
    column2 = fields.Str(description='Table 2 column')
    
class ReAskQuestionSchema(Schema):
    taskId = fields.Int(description='Task ID')
    
RefreshIndexQuerySchema = RefreshIndexQueryDTO.Schema()

class ImportColumnByQuerySchema(Schema):
    message = fields.Str()

class ImportColumnCsvSchema(Schema):
    file = fields.Raw(type='file', required=True)

class ImportColumnByQuerySchema(Schema):
    message = fields.Str()

class ImportColumnCsvSchema(Schema):
    file = fields.Raw(type='file', required=True)

# DocDefinitionSchema = DocDefinitionDTO.Schema()

class DocDefinitionIdSchema(Schema):
    id = fields.Int(description='ID')

class DocDefinitionQuerySchema(Schema):
    project_id = fields.Int(description='Project ID', required=True)
    query = fields.Str(description='Document definition')

class BuildIndexModelSchema(Schema):
    table_csv_file = fields.Field(
        metadata={
            "type": "string",
            "format": "binary",
            "description": "Table CSV file"
        },
        required=True
    )
    column_csv_file = fields.Field(
        metadata={
            "type": "string",
            "format": "binary",
            "description": "Column CSV file"
        },
        required=True
    )

class RuleDefinitionAddSchema(Schema):
    project_id = fields.Int(description='Project ID', required=True)
    name = fields.Str(required=True)
    content = fields.Str(required=True)
    def_selected = fields.Bool(required=True)
    disabled = fields.Bool(required=True)

class RuleDefinitionUpdateSchema(Schema):
    id = fields.Int(description='ID')
    name = fields.Str(required=True)
    content = fields.Str(required=True)
    def_selected = fields.Bool(required=True)
    disabled = fields.Bool(required=True)
    
class RuleDefinitionIdSchema(Schema):
    id = fields.Int(description='ID')

class RuleDefinitionsResponseSchema(Schema):
    rule_definitions = fields.List(fields.Nested(RuleDefinitionSchema), description='Rule definition list')

class GenTableAICommentsSchema(Schema):
    project_id = fields.Int(description='Project ID', required=True)
    table = fields.Str(required=True)

UpdateDDLByQuerySchema = UpdateDDLByQueryDTO.Schema()

UpdateTaskQuerySchema = UpdateTaskQueryDTO.Schema()

# add configuration constant
ALLOWED_EXTENSIONS = {'csv', 'txt'}  # allowed file extensions
MAX_CONTENT_LENGTH = 1 * 1024 * 1024  # maximum file size limit of 1MB

# add auxiliary function
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

ProjectSettingsSchema = ProjectSettingsDTO.Schema()

class ProjectIdSchema(Schema):
    project_id = fields.Int(description='Project ID', required=True)

@main_bp.route('/updateDDL')
class UpdateDDL(MethodView):
    @main_bp.arguments(BuildIndexModelSchema, location='files')
    @main_bp.arguments(ProjectIdSchema, location='query')
    @main_bp.response(200, MessageResponseSchema)
    def post(self, files_data, json_data):
        """Update DDL"""
        with session_scope() as session:
            # check if the file exists
            if 'table_csv_file' not in request.files:
                abort(400, message='No table CSV file uploaded')
            if 'column_csv_file' not in request.files:
                abort(400, message='No column CSV file uploaded')
            
            table_csv_file = request.files['table_csv_file']
            column_csv_file = request.files['column_csv_file']
            
            # check file content
            try:
                table_csv_content = table_csv_file.read().decode('utf-8')
                table_csv_reader = csv.reader(StringIO(table_csv_content))
            except UnicodeDecodeError:
                abort(400, message='Invalid table CSV file encoding. Please use UTF-8 encoded files')
            except csv.Error:
                abort(400, message='Invalid table CSV file format')
            
            try:
                column_csv_content = column_csv_file.read().decode('utf-8')
                column_csv_reader = csv.reader(StringIO(column_csv_content))
            except UnicodeDecodeError:
                abort(400, message='Invalid column CSV file encoding. Please use UTF-8 encoded files')
            except csv.Error:
                abort(400, message='Invalid column CSV file format')
            
            DefService.update_ddl(session, json_data['project_id'], table_csv_reader, column_csv_reader)
            return {'message': 'DDL updated'}

@main_bp.route('/updateDDLByQuery')
class UpdateDDLByQuery(MethodView):
    @main_bp.arguments(UpdateDDLByQuerySchema)
    @main_bp.response(200, MessageResponseSchema)
    def post(self, json_data):
        """Update DDL"""
        with session_scope() as session:
            DefService.update_ddl_by_query(session, json_data)
            return {'message': 'DDL updated'}

@main_bp.route('/refreshIndex')
class RefreshIndex(MethodView):
    @main_bp.arguments(RefreshIndexQuerySchema)
    @main_bp.response(200, MessageResponseSchema)
    def post(self, query):
        """Refresh index"""
        with session_scope() as session:
            DefService.refresh_index(session, query)
            return {'message': 'Index refreshed'}

class DefinitionDocPostSchema(Schema):
    project_id = fields.Int(description='Project ID', required=True)
    def_doc = fields.Str(description='Document content', required=True)
    def_selected = fields.Bool(description='Whether default selected', required=True)
    disabled = fields.Bool(description='Whether disabled', required=True)

class DefinitionDocPutSchema(Schema):
    id = fields.Int(description='ID', required=True)
    def_doc = fields.Str(description='Document content', required=True)
    def_selected = fields.Bool(description='Whether default selected', required=True)
    disabled = fields.Bool(description='Whether disabled', required=True)

@main_bp.route('/docDefinition')
class DocDefinitionView(MethodView):
    @main_bp.arguments(DefinitionDocPostSchema)
    @main_bp.response(200, MessageResponseSchema)
    def post(self, json_data):
        """Add document definition"""
        with session_scope() as session:
            DefService.add_doc_definition(session, json_data['project_id'], json_data['def_doc'], json_data['def_selected'], json_data['disabled'])
            return {'message': 'Doc definition added'}

    @main_bp.arguments(DefinitionDocPutSchema)
    @main_bp.response(200, MessageResponseSchema)
    def put(self, json_data):
        """Update document definition"""
        with session_scope() as session:
            DefService.update_doc_definition(session, json_data['id'], json_data['def_doc'], json_data['def_selected'], json_data['disabled'])
            return {'message': 'Doc definition updated'}

@main_bp.route('/deleteDocDefinition')
class DeleteDocDefinition(MethodView):
    @main_bp.arguments(DocDefinitionIdSchema)
    @main_bp.response(200, MessageResponseSchema)
    def delete(self, json_data):
        """Delete document definition"""
        with session_scope() as session:
            DefService.delete_doc_definition(session, json_data['id'])
            return {'message': 'Doc definition deleted'}

@main_bp.route('/docDefinitions')
class DocDefinitions(MethodView):
    @main_bp.arguments(PaginationQuerySchema, location='query')
    @main_bp.arguments(ProjectIdSchema, location='query')
    @main_bp.response(200, PaginationSchema.create(DefinitionDocSchema, 'DocDefinitionPaginationSchema'))
    def get(self, pagination_args, json_data):
        """Get all document definition list"""
        with session_scope(read_only=True) as session:
            return DefService.paginate_doc_definitions(
                session,
                json_data['project_id'],
                pagination_args['page'], 
                pagination_args['per_page']
            )

class DocDefinitionQueryResponseSchema(Schema):
    doc_definitions = fields.List(fields.Nested(DefinitionDocQueryResultDTO.Schema()), description='Document definition list')

@main_bp.route('/queryDocDefinition')
class QueryDocDefinition(MethodView):
    @main_bp.arguments(DocDefinitionQuerySchema)
    @main_bp.response(200, DocDefinitionQueryResponseSchema)
    def post(self, json_data):
        """Query document definition"""
        doc_definitions = DefService.query_doc_definition(json_data['project_id'], json_data['query'])
        return {'doc_definitions': doc_definitions}

@main_bp.route('/addRuleDefinition')
class AddRuleDefinition(MethodView):
    @main_bp.arguments(RuleDefinitionAddSchema)
    @main_bp.response(200, MessageResponseSchema)
    def post(self, json_data):
        """Add rule definition"""
        with session_scope() as session:
            DefService.add_rule_definition(
                session,
                json_data['project_id'],
                json_data['name'],
                json_data['content'],
                json_data['def_selected'],
                json_data['disabled']
            )
            return {'message': 'Rule definition added'}

@main_bp.route('/updateRuleDefinition')
class UpdateRuleDefinition(MethodView):
    @main_bp.arguments(RuleDefinitionUpdateSchema)
    @main_bp.response(200, MessageResponseSchema)
    def put(self, json_data):
        """Update rule definition"""
        with session_scope() as session:
            DefService.update_rule_definition(
                session,
                json_data['id'],
                json_data['name'],
                json_data['content'],
                json_data['def_selected'],
                json_data['disabled']
            )
            return {'message': 'Rule definition updated'}

@main_bp.route('/deleteRuleDefinition')
class DeleteRuleDefinition(MethodView):
    @main_bp.arguments(RuleDefinitionIdSchema)
    @main_bp.response(200, MessageResponseSchema)
    def delete(self, json_data):
        """Delete rule definition"""
        with session_scope() as session:
            DefService.delete_rule_definition(session, json_data['id'])
            return {'message': 'Rule definition deleted'}

@main_bp.route('/ruleDefinitions')
class RuleDefinitions(MethodView):
    @main_bp.arguments(PaginationQuerySchema, location='query')
    @main_bp.arguments(ProjectIdSchema, location='query')
    @main_bp.response(200, PaginationSchema.create(DefinitionRuleSchema, 'RuleDefinitionPaginationSchema'))
    def get(self, pagination_args, json_data):
        """Get rule definition pagination list"""
        with session_scope(read_only=True) as session:
            return DefService.paginate_rule_definitions(
                session,
                json_data['project_id'],
                pagination_args['page'],
                pagination_args['per_page']
            )
        
DisableTableQuerySchema = DisableTableQueryDTO.Schema()

@main_bp.route('/disableTable')
class DisableTable(MethodView):
    @main_bp.arguments(DisableTableQuerySchema)
    @main_bp.response(200, MessageResponseSchema)
    def post(self, query):
        """Disable table"""
        with session_scope() as session:
            DefService.disable_table(session, query)
            return {'message': 'Table disabled'}

@main_bp.route('/genTableAIComments')
class GenTableAIComments(MethodView):
    @main_bp.arguments(GenTableAICommentsSchema)
    @main_bp.response(200, GenAICommentsResponseDTO.Schema())
    def post(self, json_data):
        """Generate table AI comments"""
        with session_scope(read_only=True) as session:
            return DefService.gen_table_ai_comments(session, json_data['project_id'], json_data['table'])

@main_bp.route('/optimize-question')
class OptimizeQuestion(MethodView):
    @main_bp.arguments(QuestionSchema)
    @main_bp.response(200, OptimizeQuestionResponseSchema)
    def post(self, json_data):
        """Optimize user question"""
        question = asyncio.run(TaskService.optimize_question(json_data['question']))
        return {"question": question}

@main_bp.route('/ask')
class Ask(MethodView):
    @main_bp.arguments(AskQuestionSchema)
    @main_bp.response(200, TaskResponseSchema)
    def post(self, json_data):
        """Create new sql generation task"""
        with session_scope() as session:
            task_id = asyncio.run(TaskService.create_task(
                session,
                json_data['project_id'],
                json_data['question'], 
                json_data['question_supplement'],
                options=json_data.get('options', []),
                rules=json_data.get('rules', [])
            ))
            return {"task_id": task_id}

@main_bp.route('/re-ask')
class ReAsk(MethodView):
    @main_bp.arguments(ReAskQuestionSchema)
    @main_bp.response(200, TaskResponseSchema)
    def post(self, json_data):
        """Re-create sql generation task"""
        with session_scope() as session:
            task_id = asyncio.run(TaskService.re_create_task(session, json_data['taskId']))
            return {"task_id": task_id}

@main_bp.route('/task/<int:task_id>')
class TaskResource(MethodView):
    @main_bp.response(200, TaskSchema)
    def get(self, task_id):
        """Get specified task information"""
        with session_scope(read_only=True) as session:
            task = TaskService.get_task_detail(session, task_id)
            if not task:
                abort(404, message='Task not found')
            return task

    @main_bp.response(200, MessageResponseSchema)
    def delete(self, task_id):
        """Delete task"""
        with session_scope() as session:
            TaskService.delete_task(session, task_id)
            return {'message': 'Task deleted'}

@main_bp.route('/generate')
class Generate(MethodView):
    @main_bp.arguments(GenerateSchema)
    @main_bp.response(200, MessageResponseSchema)
    def post(self, json_data):
        """Request to generate SQL"""
        with session_scope() as session:
            TaskService.req_generate_sql(
                session,
                json_data['taskId']
        )
        return {'message': 'SQL generation started'}

@main_bp.route('/schema')
class Schema(MethodView):
    @main_bp.arguments(ProjectIdSchema, location='query')
    @main_bp.response(200, SchemaSchema)
    def get(self, json_data):
        """Get the whole schema"""
        with session_scope(read_only=True) as session:
            return DefService.get_schema(session, json_data['project_id'])

@main_bp.route('/search-sql-log')
class SearchSQLLog(MethodView):
    @main_bp.arguments(SearchSQLLogSchema)
    @main_bp.response(200, SearchSQLLogResponseSchema)
    def post(self, json_data):
        """Search SQL log"""
        return {
            'sqls': TaskService.search_sql_log(json_data['project_id'], json_data['content'])
        }

@main_bp.route('/update-task')
class UpdateTask(MethodView):
    @main_bp.arguments(UpdateTaskQuerySchema)
    @main_bp.response(200, MessageResponseSchema)
    def post(self, query):
        """Update task"""
        with session_scope() as session:
            TaskService.update_task(session, query)
            return {'message': 'Task updated'}

@main_bp.route('/update-question')
class UpdateQuestion(MethodView):
    @main_bp.arguments(UpdateQuestionSchema)
    @main_bp.response(200, MessageResponseSchema)
    def post(self, json_data):
        """Update task question"""
        with session_scope() as session:
            TaskService.update_question(session, json_data['taskId'], json_data['question'], json_data['question_supplement'])
            return {'message': 'Question updated'}

@main_bp.route('/update-task-doc')
class UpdateTaskDoc(MethodView):
    @main_bp.arguments(UpdateTaskDocSchema)
    @main_bp.response(200, MessageResponseSchema)
    def post(self, json_data):
        """Update task document"""
        with session_scope() as session:
            TaskService.update_task_doc(session, json_data['taskId'], json_data['docIds'])
            return {'message': 'Task doc updated'}

@main_bp.route('/update-task-sql')
class UpdateTaskSql(MethodView):
    @main_bp.arguments(UpdateTaskSqlLogSchema)
    @main_bp.response(200, MessageResponseSchema)
    def post(self, json_data):
        """Update task sql log"""
        with session_scope() as session:
            TaskService.update_task_sql_log(session, json_data['taskId'], json_data['sqlIds'])
            return {'message': 'Task sql log updated'}

@main_bp.route('/update-task-ddl')
class UpdateTaskDDL(MethodView):
    @main_bp.arguments(UpdateTaskDDLSchema)
    @main_bp.response(200, MessageResponseSchema)
    def post(self, json_data):
        """Update task ddl"""
        with session_scope() as session:
            TaskService.update_selected_columns(session, json_data['taskId'], json_data['columns'])
            return {'message': 'Task ddl updated'}

@main_bp.route('/update-sql')
class UpdateSQL(MethodView):
    @main_bp.arguments(UpdateSqlSchema)
    @main_bp.response(200, MessageResponseSchema)
    def post(self, json_data):
        """Update task sql"""
        with session_scope() as session:
            TaskService.update_sql(session, json_data['taskId'], json_data['sql'])
            return {'message': 'SQL updated'}

@main_bp.route('/accept-learn-result')
class AcceptLearnResult(MethodView):
    @main_bp.arguments(AcceptLearnResultSchema)
    @main_bp.response(200, MessageResponseSchema)
    def post(self, json_data):
        """Accept learn result"""
        with session_scope() as session:
            TaskService.accept_learn_result(session, json_data['taskId'], json_data['learnResult'])
            return {'message': 'Learn result accepted'}

@main_bp.route('/update-sql-feedback')
class UpdateSQLFeedback(MethodView):
    @main_bp.arguments(UpdateSqlFeedbackSchema)
    @main_bp.response(200, MessageResponseSchema)
    def post(self, json_data):
        """Update task sql feedback"""
        with session_scope() as session:
            TaskService.update_sql_feedback(
                session,
                json_data['taskId'],
                json_data['sqlRight'],
                json_data['sqlRefer']
            )
            return {'message': 'SQL feedback updated'}

@main_bp.route('/questions')
class Questions(MethodView):
    @main_bp.arguments(PaginationQuerySchema, location='query')
    @main_bp.arguments(ProjectIdSchema, location='query')
    @main_bp.response(200, PaginationResponseSchema)
    def get(self, pagination_args, json_data):
        """Get all task questions list"""
        return TaskService.paginate_questions(json_data['project_id'], pagination_args['page'], pagination_args['per_page'])

@main_bp.route('/jobs')
class Jobs(MethodView):
    @main_bp.arguments(AddJobSchema)
    @main_bp.response(200, MessageResponseSchema)
    def post(self, json_data):
        """Add job"""
        with session_scope() as session:
            JobService.create_job(session, json_data['task_id'], json_data['job_type'])
            return {'message': 'Job added'}

@main_bp.route('/jobs/<int:job_id>/cancel')
class CancelJob(MethodView):
    @main_bp.response(200, MessageResponseSchema)
    def post(self, job_id):
        """Cancel job"""
        with session_scope() as session:
            JobService.cancel_job(session, job_id)
            return {'message': 'Job canceled'}

@main_bp.route('/task/<int:task_id>/jobs')
class TaskJobs(MethodView):
    @main_bp.response(200, JobListResponseSchema)
    def get(self, task_id):
        """Get all jobs of specified task"""
        with session_scope(read_only=True) as session:
            return {"jobs": JobService.get_jobs(session, task_id)}

@main_bp.route('/jobs/<int:job_id>')
class JobDetail(MethodView):
    @main_bp.response(200, JobSchema)
    def get(self, job_id):
        """Get specified job detail"""
        with session_scope(read_only=True) as session:
            return JobService.get_job(session, job_id)

@main_bp.route('/learn')
class Learn(MethodView):
    @main_bp.arguments(LearnSchema)
    @main_bp.response(200, MessageResponseSchema)
    def post(self, json_data):
        """Learn"""
        with session_scope() as session:
            TaskService.learn(session, json_data['taskId'])
            return {'message': 'Learn started'}

@main_bp.route('/update-ai-comment')
class UpdateAIComment(MethodView):
    @main_bp.arguments(UpdateAICommentSchema)
    @main_bp.response(200, MessageResponseSchema)
    def post(self, json_data):
        """Update table and column AI comments"""
        with session_scope() as session:
            DefService.update_ai_comment(session, UpdateAICommentDTO.from_dict(json_data))
            return {'message': 'AI comment updated'}

@main_bp.route('/relation')
class Relation(MethodView):
    @main_bp.arguments(RelationSchema)
    @main_bp.response(200, MessageResponseSchema)
    def delete(self, json_data):
        """Delete relation"""
        with session_scope() as session:
            DefService.delete_relation(
                session,
                json_data['project_id'],
                json_data['table1'],
                json_data['column1'],
                json_data['table2'],
                json_data['column2']
            )
            return {'message': 'Relation deleted'}

@main_bp.route('/projectSettings')
class ProjectSettings(MethodView):
    @main_bp.arguments(ProjectIdQuerySchema, location='query')
    @main_bp.response(200, ProjectSettingsSchema)
    def get(self, query_args):
        """Get project settings"""
        with session_scope(read_only=True) as session:
            return DefService.get_project_settings(session, query_args['project_id'])
