from flask_smorest import Blueprint
from flask.views import MethodView
from marshmallow import Schema, fields

test_bp = Blueprint('test', __name__)

class TranslateSchema(Schema):
    text = fields.Str(description='Text')
    target_language = fields.Str(description='Target language')
    source_language = fields.Str(description='Source language', default=None)
    
class TranslateResponseSchema(Schema):
    translated_text = fields.Str(description='Translated text')

class SearchTableDefStoreSchema(Schema):
    query_text = fields.Str(description='Query text')
    n_results = fields.Int(description='Result number', default=5)
    
class SearchTableDefStoreResponseSchema(Schema):
    results = fields.List(fields.Dict(description='Result'), description='Query results')

@test_bp.route('/search_table_def_store', methods=['POST'])
class SearchTableDefStore(MethodView):
    @test_bp.arguments(SearchTableDefStoreSchema)
    @test_bp.response(200, SearchTableDefStoreResponseSchema)
    def post(self, json_data):
        from vector_stores import table_def_store
        results = table_def_store.query_documents(json_data.get('query_text'), n_results=json_data.get('n_results'), where={"project_id": 2})
        return {'results': results['metadatas'][0]}

@test_bp.route('/translate', methods=['POST'])
class Translate(MethodView):
    @test_bp.arguments(TranslateSchema)
    @test_bp.response(200, TranslateResponseSchema)
    def post(self, json_data):
        """Translate text"""
        from services.translate_service import translate_service
        text = json_data.get('text')
        target_language = json_data.get('target_language')
        source_language = json_data.get('source_language', None)
        
        if not text or not target_language:
            return {'message': 'Missing required parameters'}, 400
            
        try:
            translated_text = translate_service.translate(
                text=text,
                target_language=target_language,
                source_language=source_language
            )
            return {'translated_text': translated_text}
        except Exception as e:
            return {'message': str(e)}, 500