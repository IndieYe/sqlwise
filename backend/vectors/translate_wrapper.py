from vectors.vector_store import VectorStore

class TranslateWrapper(VectorStore):
    def __init__(self, vector_store: VectorStore, target_language: str='en'):
        self.vector_store = vector_store
        self.target_language = target_language
    
    def add_document(self, document, metadata, doc_id):
        from services.translate_service import translate_service
        try:
            if translate_service.is_active():
                translated_document = translate_service.translate(document, self.target_language)
            else:
                translated_document = document
        except Exception as e:
            translated_document = document
        self.vector_store.add_document(translated_document, metadata, doc_id)

    def query_documents(self, query_text, n_results=1, where=None):
        from services.translate_service import translate_service
        try:
            if translate_service.is_active():
                translated_query_text = translate_service.translate(query_text, self.target_language)
            else:
                translated_query_text = query_text
        except Exception as e:
            translated_query_text = query_text
        return self.vector_store.query_documents(translated_query_text, n_results, where)

    def delete_documents(self, where):
        self.vector_store.delete_documents(where)

    def clear_collection(self):
        self.vector_store.clear_collection()