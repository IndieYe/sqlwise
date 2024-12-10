from database import db
from models.project import Project
from typing import List
from models.definition_column import DefinitionColumn
from models.definition_relation import DefinitionRelation
from models.definition_doc import DefinitionDoc
from models.definition_table import DefinitionTable
from models.definition_rule import DefinitionRule
from models.task import Task
import csv
import os
from sqlalchemy.orm import Session

class ProjectService:
    @staticmethod
    def create_project(session: Session, name: str, description: str, db_type: str, db_version: str) -> Project:
        """Create a new project"""
        project = Project(name=name, description=description, db_type=db_type, db_version=db_version)
        session.add(project)
        return project

    @staticmethod
    def update_project(session: Session, id: int, name: str, description: str, db_type: str, db_version: str) -> Project:
        """Update project information"""
        project = session.query(Project).get(id)
        if not project:
            raise ValueError(f"Project with id {id} not found")
        
        project.update(
            name=name,
            description=description,
            db_type=db_type,
            db_version=db_version
        )
        return project

    @staticmethod
    def delete_project(session: Session, id: int) -> None:
        """Delete a project and all its related records"""
        project = session.query(Project).get(id)
        if not project:
            raise ValueError(f"Project with id {id} not found")
        
        # Delete all related records
        session.query(DefinitionTable).filter(DefinitionTable.project_id == id).delete()
        session.query(DefinitionColumn).filter(DefinitionColumn.project_id == id).delete()
        session.query(DefinitionRelation).filter(DefinitionRelation.project_id == id).delete()
        session.query(DefinitionDoc).filter(DefinitionDoc.project_id == id).delete()
        session.query(DefinitionRule).filter(DefinitionRule.project_id == id).delete()
        session.query(Task).filter(Task.project_id == id).delete()
        
        # Delete project
        session.delete(project)

    @staticmethod
    def get_all_projects(session: Session) -> List[Project]:
        """Get all projects list"""
        return session.query(Project).order_by(Project.id).all()

    @staticmethod
    def get_project_by_id(session: Session, id: int) -> Project:
        """Get project by ID"""
        project = session.query(Project).get(id)
        if not project:
            raise ValueError(f"Project with id {id} not found")
        return project

    @classmethod
    def create_example_project(cls, session: Session):
        """Create an example project with predefined tables, columns, documents and rules"""
        # Create a new project
        project = Project(
            name="Example Project",
            description="An example project with predefined tables and rules",
            db_type="mysql",
            db_version="8.0"
        )
        session.add(project)
        session.flush()  # Get project.id

        # Read demo tables from CSV
        demo_tables_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'assets', 'demo_tables.csv')
        with open(demo_tables_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                table = DefinitionTable(
                    project_id=project.id,
                    def_table=row['TABLE_NAME'],
                    def_comment=row['TABLE_COMMENT'],
                    def_waiting=True
                )
                session.add(table)
        
        # Read demo columns from CSV
        demo_columns_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'assets', 'demo_columns.csv')
        with open(demo_columns_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                column = DefinitionColumn(
                    project_id=project.id,
                    def_table=row['TABLE_NAME'],
                    def_column=row['COLUMN_NAME'],
                    def_type=row['COLUMN_TYPE'],
                    def_comment=row['COLUMN_COMMENT'],
                    def_waiting=True
                )
                session.add(column)

        # Create example documents
        example_docs = [
            {
                "def_doc": "The order table contains basic order information, and the user table contains basic user information.\n"
                          "The order table is linked to the user table through user_id.\n"
                          "Order status: 0-Pending 1-Paid 2-Shipped 3-Delivered 4-Cancelled",
                "def_selected": True
            },
            {
                "def_doc": "The product table contains basic product information.\n"
                          "The order_item table is a junction table between order and product, containing product information within order.\n"
                          "Product status: 1-Active 0-Inactive",
                "def_selected": False
            }
        ]
        
        for doc in example_docs:
            definition_doc = DefinitionDoc(
                project_id=project.id,
                def_doc=doc["def_doc"],
                def_selected=doc["def_selected"]
            )
            session.add(definition_doc)

        # Create example rules
        example_rules = [
            {
                "name": "Prefer LEFT JOIN",
                "content": "When writing SQL queries, prefer LEFT JOIN over INNER JOIN to preserve all records from the main table.",
                "def_selected": False
            },
            {
                "name": "Use Table Aliases",
                "content": "Use meaningful table aliases in SQL queries to improve readability. For example: 'o' for order table, 'u' for user table.",
                "def_selected": False
            },
            {
                "name": "Filter Condition Placement",
                "content": "Place non-join filter conditions in the WHERE clause, and join conditions in the ON clause.",
                "def_selected": True
            }
        ]

        for rule in example_rules:
            definition_rule = DefinitionRule(
                project_id=project.id,
                name=rule["name"],
                content=rule["content"],
                def_selected=rule["def_selected"]
            )
            session.add(definition_rule)

        return project