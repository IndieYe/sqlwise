from marshmallow import Schema, fields
from marshmallow_dataclass import class_schema

class MessageResponseSchema(Schema):
    message = fields.Str(description='Return message')

class PaginationQuerySchema(Schema):
    page = fields.Int(load_default=1, description="Page number")
    per_page = fields.Int(load_default=20, description="Number of items per page")

class ProjectIdQuerySchema(Schema):
    project_id = fields.Int(description="Project ID")

class PaginationBaseSchema(Schema):
    """Base schema for pagination responses"""
    items = fields.List(fields.Nested(Schema), description='List of items')
    total = fields.Int(description='Total number of items')
    page = fields.Int(description='Current page number')
    per_page = fields.Int(description='Number of items per page')
    pages = fields.Int(description='Total number of pages')

class PaginationSchema:
    """Generic pagination schema factory"""
    @classmethod
    def create(cls, nested_schema, name):
        class_dict = {
            '__name__': name,
            'items': fields.List(fields.Nested(nested_schema))
        }
        return type(name, (PaginationBaseSchema,), class_dict)