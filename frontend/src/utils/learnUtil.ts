import { Schema, TableDescDTO, ColumnDescDTO, TableRelationDTO } from '../api-docs';

//new: new, newOverride: new override, stay: stay, modify: modify, none: none
export const getTableCellType = (schema: Schema | undefined, table: TableDescDTO): TableCellType => {
    const oldTable = schema?.tables?.find(t => t.table === table.table);
    const oldComment = oldTable?.ai_comment;
    return oldTable ? (oldComment ? (oldComment === table.desc ? 'stay' : 'modify') : (oldTable.comment ? 'newOverride' : 'new')) : 'none';
}

//new: new, newOverride: new override, stay: stay, modify: modify, none: none
export const getColumnCellType = (schema: Schema | undefined, column: ColumnDescDTO): ColumnCellType => {
    const oldColumn = schema?.columns?.find(c => c.table === column.table && c.column === column.column);
    const oldComment = oldColumn?.ai_comment;
    return oldColumn ? (oldComment ? (oldComment === column.desc ? 'stay' : 'modify') : (oldColumn.comment ? 'newOverride' : 'new')) : 'none';
}

export const reverseRelationType = (relation_type: string) => {
    return relation_type === '1-1' ? '1-1' : relation_type === '1-n' ? 'n-1' : relation_type === 'n-1' ? '1-n' : 'n-n';
}

// Reverse relation
export const reverseRelation = (relation: TableRelationDTO): TableRelationDTO => {
    const newRelationType = reverseRelationType(relation.relation_type);
    return {
        table1: relation.table2,
        column1: relation.column2,
        table2: relation.table1,
        column2: relation.column1,
        relation_type: newRelationType
    }
}

const getRelationCellType_ = (schema: Schema | undefined, relation: TableRelationDTO): RelationCellType => {
    const hasTableNotExist = !schema?.tables?.find(t => t.table === relation.table1) || !schema?.tables?.find(t => t.table === relation.table2);
    const exists = schema?.relations?.find(r => 
        r.table1 === relation.table1 && 
        r.column1 === relation.column1 && 
        r.table2 === relation.table2 && 
        r.column2 === relation.column2
    );
    if (hasTableNotExist) return 'none';
    if (exists) {
        if (!exists.relation_type && !relation.relation_type) return 'stay';
        return exists.relation_type === relation.relation_type ? 'stay' : 'modify';
    }
    return 'new';
}

// Will detect relations and reverse relations
export const getRelationCellType = (schema: Schema | undefined, relation: TableRelationDTO): RelationCellType => {
    const cellType = getRelationCellType_(schema, relation);
    // Table does not exist
    if (cellType === 'none') return 'none';
    // New, then detect
    if (cellType === 'new') {
        return getRelationCellType_(schema, reverseRelation(relation));
    }
    // Already exists
    return cellType;
}

export const getOldRelation = (schema: Schema | undefined, relation: {table1: string, column1: string, table2: string, column2: string, relation_type: string}): TableRelationDTO | undefined => {
    let result: TableRelationDTO | undefined = schema?.relations?.find(r => r.table1 === relation.table1 && r.column1 === relation.column1 && r.table2 === relation.table2 && r.column2 === relation.column2);
    if (!result) {
        relation = reverseRelation(relation);
        result = schema?.relations?.find(r => r.table1 === relation.table1 && r.column1 === relation.column1 && r.table2 === relation.table2 && r.column2 === relation.column2);
        result = result ? reverseRelation(result) : undefined;
    }
    return result;
}

// Table1 and Table2 relationship type, optional values: 1-1(one to one), 1-n(one to many), n-1(many to one), n-n(many to many)
export const getRelationTypeName = (t: any, relation_type: string | undefined) => {
    if (relation_type === '1-1') return t('ddl.oneToOne');
    if (relation_type === '1-n') return t('ddl.oneToMany');
    if (relation_type === 'n-1') return t('ddl.manyToOne');
    if (relation_type === 'n-n') return t('ddl.manyToMany');
    return '';
}