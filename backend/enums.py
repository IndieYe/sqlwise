from base_enum import BaseEnum

class JobType(BaseEnum):
    """Job type enumeration"""
    GEN_RELATED_COLUMNS = ('gen_related_columns', 'Generate Related Columns')
    MATCH_DOC = ('match_doc', 'Match Document')
    MATCH_SQL_LOG = ('match_sql_log', 'Match SQL Log')
    MATCH_DDL = ('match_ddl', 'Match DDL')
    GENERATE_SQL = ('generate_sql', 'Generate SQL')
    LEARN_FROM_SQL = ('learn_from_sql', 'Learn')

class JobStatus(BaseEnum):
    """Job status enumeration"""
    INIT = ('init', 'Initial')    # Initial state
    RUNNING = ('running', 'Running')  # In progress
    SUCCESS = ('success', 'Success')    # Successful
    FAIL = ('fail', 'Failed')    # Failed
    CANCELED = ('canceled', 'Canceled')    # Canceled

class DbType(BaseEnum):
    """Database type enumeration"""
    SQLITE = ('sqlite', 'SQLite')
    MYSQL = ('mysql', 'MySQL')
    POSTGRESQL = ('postgresql', 'PostgreSQL')
    SQLSERVER = ('sqlserver', 'SQLServer')
    