import chromadb
from vectors.vector_store import VectorStore

class ChromaDBHandler(VectorStore):
    def __init__(self, host, port, collection_name):
        self.client = chromadb.HttpClient(host=host, port=port)
        self.collection = self.client.get_or_create_collection(name=collection_name)
        print(f"Initialized ChromaDBHandler for collection: {collection_name}")
    
    def add_document(self, document, metadata, doc_id):
        self.collection.upsert(
            documents=[document],
            metadatas=[metadata],
            ids=[doc_id]
        )
    
    def query_documents(self, query_text, n_results=1, where=None):
        return self.collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where=where
        )

    def delete_documents(self, where):
        self.collection.delete(where=where)

    def clear_collection(self):
        self.collection.delete(ids=self.collection.get()["ids"])