import os
from vectors.vector_chroma import ChromaDBHandler
from vectors.translate_wrapper import TranslateWrapper

table_def_store = TranslateWrapper(
    vector_store=ChromaDBHandler(
        host=os.getenv("CHROMA_HOST", "localhost"),
        port=int(os.getenv("CHROMA_PORT", "8000")),
        collection_name="table_def"
    ),
    target_language='en'
)

column_def_store = TranslateWrapper(
    vector_store=ChromaDBHandler(
    host=os.getenv("CHROMA_HOST", "localhost"),
    port=int(os.getenv("CHROMA_PORT", "8000")),
        collection_name="column_def"
    ),
    target_language='en'
)

doc_def_store = TranslateWrapper(
    vector_store=ChromaDBHandler(
        host=os.getenv("CHROMA_HOST", "localhost"),
        port=int(os.getenv("CHROMA_PORT", "8000")),
        collection_name="doc_def"
    ),
    target_language='en'
)

sql_log_store = TranslateWrapper(
    vector_store=ChromaDBHandler(
        host=os.getenv("CHROMA_HOST", "localhost"),
        port=int(os.getenv("CHROMA_PORT", "8000")),
        collection_name="sql_log"
    ),
    target_language='en'
)