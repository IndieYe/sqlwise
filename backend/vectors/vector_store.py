from abc import ABC, abstractmethod

class VectorStore(ABC):
    """Abstract base class for vector databases"""
    
    @abstractmethod
    def add_document(self, document, metadata, doc_id):
        """Add document to vector storage"""
        pass
    
    @abstractmethod
    def query_documents(self, query_text, n_results=1):
        """Query documents"""
        pass
    
    @abstractmethod
    def delete_documents(self, where):
        """Delete documents"""
        pass
    
    @abstractmethod
    def clear_collection(self):
        """Clear collection"""
        pass