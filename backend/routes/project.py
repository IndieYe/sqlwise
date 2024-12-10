from flask.views import MethodView
from flask_smorest import Blueprint, abort
from marshmallow import Schema, fields
from services.project_service import ProjectService
from models.project import ProjectSchema
from flask import jsonify
from database import session_scope
from utils.schemas import MessageResponseSchema
from models.project import Project

# create blueprint
project_bp = Blueprint('project', __name__, description='Project operations')

class CreateProjectSchema(Schema):
    name = fields.Str(required=True, description='Project name')
    description = fields.Str(required=True, description='Project description')
    db_type = fields.Str(required=True, description='Database type')
    db_version = fields.Str(required=True, description='Database version information')

class UpdateProjectSchema(Schema):
    name = fields.Str(required=True, description='Project name')
    description = fields.Str(required=True, description='Project description')
    db_type = fields.Str(required=True, description='Database type')
    db_version = fields.Str(required=True, description='Database version information')

class ProjectListResponseSchema(Schema):
    projects = fields.List(fields.Nested(ProjectSchema), description='Project list')

@project_bp.route('/project')
class ProjectView(MethodView):
    @project_bp.arguments(CreateProjectSchema)
    @project_bp.response(200, MessageResponseSchema)
    def post(self, json_data):
        """Create new project"""
        try:
            with session_scope() as session:
                ProjectService.create_project(
                    session,
                    json_data['name'],
                    json_data['description'],
                    json_data['db_type'],
                    json_data['db_version']
                )
                return {'message': 'Project created'}
        except Exception as e:
            abort(400, message=str(e))

    @project_bp.response(200, ProjectListResponseSchema)
    def get(self):
        """Get all project list"""
        try:
            with session_scope(read_only=True) as session:
                projects = ProjectService.get_all_projects(session)
                return {"projects": projects}
        except Exception as e:
            abort(400, message=str(e))

@project_bp.route('/project/<int:id>')
class ProjectDetailView(MethodView):
    @project_bp.arguments(UpdateProjectSchema)
    @project_bp.response(200, ProjectSchema)
    def put(self, json_data, id):
        """Update project information"""
        try:
            with session_scope() as session:
                ProjectService.update_project(
                    session,
                    id,
                    json_data['name'],
                    json_data['description'],
                    json_data['db_type'],
                    json_data['db_version']
                )
                
            with session_scope(read_only=True) as session:
                return session.query(Project).get(id)
        except ValueError as e:
            abort(404, message=str(e))
        except Exception as e:
            abort(400, message=str(e))

    @project_bp.response(200, ProjectSchema)
    def get(self, id):
        """Get project detail"""
        with session_scope(read_only=True) as session:
            project = ProjectService.get_project_by_id(session, id)
            session.refresh(project)
            return project

    @project_bp.response(204)
    def delete(self, id):
        """Delete project"""
        try:
            with session_scope() as session:
                ProjectService.delete_project(session, id)
        except ValueError as e:
            abort(404, message=str(e))
        except Exception as e:
            abort(400, message=str(e))

@project_bp.route('/example', methods=['POST'])
class CreateExampleProjectView(MethodView):
    """Create an example project with predefined documents and rules"""
    @project_bp.response(200, MessageResponseSchema)
    def post(self):
        with session_scope() as session:
            ProjectService.create_example_project(session)
            return {'message': 'Example project created successfully'}
