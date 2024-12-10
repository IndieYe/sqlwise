export const DB_TYPES = {
    SQLITE: 'sqlite',
    MYSQL: 'mysql',
    POSTGRESQL: 'postgresql',
    SQLSERVER: 'sqlserver'
} as const;

export const DB_TYPE_LABELS = {
    [DB_TYPES.SQLITE]: 'SQLite',
    [DB_TYPES.MYSQL]: 'MySQL',
    [DB_TYPES.POSTGRESQL]: 'PostgreSQL',
    [DB_TYPES.SQLSERVER]: 'SQLServer'
} as const;

export type DbType = typeof DB_TYPES[keyof typeof DB_TYPES];

export const DB_TABLE_QUERIES = {
    [DB_TYPES.SQLITE]: `SELECT json_group_array(
  json_object(
    'table', name,
    'comment', ''
  )
) as tables
FROM sqlite_master
WHERE type='table' AND name NOT LIKE 'sqlite_%';`,
    [DB_TYPES.MYSQL]: `SELECT JSON_ARRAYAGG(
               JSON_OBJECT(
                       'table', t.TABLE_NAME,
                       'comment', t.TABLE_COMMENT
               )
       ) tables
FROM information_schema.TABLES t
WHERE t.TABLE_TYPE = 'BASE TABLE'
  AND t.TABLE_SCHEMA = 'YOUR_DATABASE_NAME'`,
    [DB_TYPES.POSTGRESQL]: `SELECT json_agg(
    json_build_object(
        'table', table_name,
        'comment', obj_description((table_schema || '.' || table_name)::regclass, 'pg_class')
    )
) as tables
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
    AND table_schema = 'YOUR_SCHEMA';`,
    [DB_TYPES.SQLSERVER]: `SELECT (
    SELECT
        t.name AS 'table',
        CAST(value AS VARCHAR(1000)) AS 'comment'
    FROM sys.tables t
    LEFT JOIN sys.extended_properties ep ON ep.major_id = t.object_id
        AND ep.minor_id = 0
        AND ep.name = 'MS_Description'
    WHERE t.type = 'U'
        AND SCHEMA_NAME(t.schema_id) = 'YOUR_SCHEMA'
    FOR JSON PATH
) AS tables;`
} as const;

export const DB_COLUMN_QUERIES = {
    [DB_TYPES.SQLITE]: `WITH RECURSIVE columns AS (
  SELECT
    m.name as table_name,
    p.name as column_name,
    p.type as column_type
  FROM sqlite_master m
  JOIN pragma_table_info(m.name) p
  WHERE m.type='table' AND m.name NOT LIKE 'sqlite_%'
)
SELECT json_group_array(
  json_object(
    'table', table_name,
    'column', column_name,
    'type', column_type,
    'comment', ''
  )
) as columns
FROM columns;`,
    [DB_TYPES.MYSQL]: `SELECT JSON_ARRAYAGG(
               JSON_OBJECT(
                       'table', c.TABLE_NAME,
                       'column', c.COLUMN_NAME,
                       'type', c.COLUMN_TYPE,
                       'comment', c.COLUMN_COMMENT
               )
       ) columns
FROM information_schema.COLUMNS c
         JOIN information_schema.TABLES t
              ON c.TABLE_SCHEMA = t.TABLE_SCHEMA AND c.TABLE_NAME = t.TABLE_NAME
WHERE t.TABLE_TYPE = 'BASE TABLE'
  AND c.TABLE_SCHEMA = 'YOUR_DATABASE_NAME'`,
    [DB_TYPES.POSTGRESQL]: `SELECT JSON_AGG(
    JSON_BUILD_OBJECT(
        'table', c.table_name,
        'column', c.column_name,
        'type', pg_catalog.format_type(c.udt_name::regtype, c.character_maximum_length),
        'comment', pd.description
    )
) columns
FROM information_schema.columns c
JOIN information_schema.tables t
    ON c.table_schema = t.table_schema
    AND c.table_name = t.table_name
LEFT JOIN pg_description pd
    ON pd.objoid = (quote_ident(c.table_schema) || '.' || quote_ident(c.table_name))::regclass
    AND pd.objsubid = c.ordinal_position
WHERE t.table_type = 'BASE TABLE'
AND c.table_schema = 'YOUR_SCHEMA';`,
    [DB_TYPES.SQLSERVER]: `SELECT c.TABLE_NAME as 'table',
       c.COLUMN_NAME as 'column',
       c.DATA_TYPE as 'type',
       prop.value as 'comment'
FROM INFORMATION_SCHEMA.COLUMNS c
         JOIN INFORMATION_SCHEMA.TABLES t
              ON c.TABLE_CATALOG = t.TABLE_CATALOG
              AND c.TABLE_SCHEMA = t.TABLE_SCHEMA
              AND c.TABLE_NAME = t.TABLE_NAME
         LEFT JOIN sys.extended_properties prop
                   ON OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME) = prop.major_id
                       AND c.ORDINAL_POSITION = prop.minor_id
WHERE t.TABLE_TYPE = 'BASE TABLE'
  AND c.TABLE_SCHEMA = 'YOUR_SCHEMA'
FOR JSON PATH`
} as const;
