import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setFinalLearnColumns, setFinalLearnRelations, setFinalLearnTables, setSelectedLearningItems } from '@/store/slices/recordsSlice';
import { TableRelation } from '@/api-docs';
import { twMerge } from 'tailwind-merge';
import React, { useMemo } from 'react';
import { FaMinus } from 'react-icons/fa';
import { FaPen } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { MdAddTask } from 'react-icons/md';
import { getOldRelation, getRelationTypeName } from '@/utils/learnUtil';
import { useMemoizedFn } from 'ahooks';
import { useTranslation } from 'react-i18next';

interface DetailItemProps {
    children: React.ReactNode;
    selected?: boolean;
    onSelect?: (id: string) => void;
    id: string;
}

function DetailItem({ children, selected, onSelect, id }: DetailItemProps) {
    return (
        <div
            className={twMerge(
                "text-sm select-none flex gap-2 px-3 py-2 border-2 rounded-lg transition-colors cursor-pointer",
                selected ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
            )}
            onClick={() => onSelect?.(id)}
        >
            {children}
        </div>
    );
}

interface TableInputProps {
    id: string;
    onSelect?: (id: string, selected: boolean) => void;
}

const TableInput = ({ id, onSelect }: TableInputProps) => {
    const dispatch = useAppDispatch();
    const finalLearnTables = useAppSelector(state => state.records.finalLearnTables);
    const table = useAppSelector(state => state.records.finalLearnTables?.find(t => t.table === id.split(':')[1]));

    const handleDescChange = useMemoizedFn((id: string, desc: string) => {
        // Keep order
        const newTables = [...finalLearnTables!];
        const index = newTables.findIndex(t => t.table === id.split(':')[1]);
        if (index >= 0) {
            newTables[index] = {
                table: id.split(':')[1],
                desc
            };
        } else {
            newTables.push({
                table: id.split(':')[1],
                desc
            });
        }
        dispatch(setFinalLearnTables(newTables));

        // Select
        onSelect?.(id, true);
    });
    return <input className='w-full border border-gray-100 rounded-lg px-2 py-1 text-sm' value={table?.desc} onClick={e => e.stopPropagation()} onChange={e => handleDescChange(id, e.target.value)}/>;
}

interface TableNotesProps {
    showNew?: boolean;
    showNewOverride?: boolean;
    showModified?: boolean;
    showUnchanged?: boolean;
    showNone?: boolean;
}

export function TableNotes({ showNew = true, showNewOverride = false, showModified = false, showUnchanged = false, showNone = false }: TableNotesProps) {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const tableCellTypes = useAppSelector(state => state.records.tableCellTypes);
    const learnTables = useAppSelector(state => state.records.learnTables);
    const finalLearnTables = useAppSelector(state => state.records.finalLearnTables);
    const selectedItems = useAppSelector(state => state.records.selectedLearningItems);
    const schema = useAppSelector(state => state.schema.schema);

    const handleSelect = (id: string, selected?: boolean) => {
        const newSelectedItems = [...selectedItems];
        const index = newSelectedItems.indexOf(id);

        if (index >= 0) {
            if (selected === false || selected === undefined) newSelectedItems.splice(index, 1);
        } else {
            if (selected === true || selected === undefined) newSelectedItems.push(id);
        }

        dispatch(setSelectedLearningItems(newSelectedItems));
    };

    if (!finalLearnTables?.length) return null;

    const filteredTables = useMemo(() => finalLearnTables.filter(table => {
        const cellType = tableCellTypes[table.table!];

        return (cellType === 'new' && showNew) ||
            (cellType === 'newOverride' && showNewOverride) ||
            (cellType === 'modify' && showModified) ||
            (cellType === 'stay' && showUnchanged) ||
            (cellType === 'none' && showNone);
    }), [finalLearnTables, learnTables, schema, showNew, showNewOverride, showModified, showUnchanged, showNone]);

    if (!filteredTables.length) return null;

    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <h3 className="text-md font-semibold">{t('learning.tableNotes')}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
                {filteredTables.map((table, index) => {
                    const id = `table:${table.table}`;
                    const selected = selectedItems.includes(id);
                    const oldTable = schema?.tables?.find(t => t.table === table.table);
                    const cellType = tableCellTypes[table.table!];

                    return (
                        <DetailItem
                            key={index}
                            id={id}
                            selected={selected}
                            onSelect={handleSelect}
                        >
                            <div className="flex flex-col gap-1">
                                <div className={`flex items-center justify-center gap-1 text-sm ${cellType === 'new' ? 'bg-green-100' :
                                    cellType === 'newOverride' ? 'bg-cyan-100' :
                                        cellType === 'modify' ? 'bg-blue-100' :
                                            cellType === 'none' ? 'bg-red-100' :
                                                'bg-gray-100'
                                    }`}>
                                    {cellType === 'new' && (
                                        <>
                                            <FaPlus className="text-green-500" />
                                            <span className="text-green-600">{t('learning.newAiComment')}</span>
                                        </>
                                    )}
                                    {cellType === 'newOverride' && (
                                        <>
                                            <MdAddTask className="text-green-500" />
                                            <span className="text-green-600">{t('learning.overrideDefaultComment')}</span>
                                        </>
                                    )}
                                    {cellType === 'modify' && (
                                        <>
                                            <FaPen className="text-blue-500" />
                                            <span className="text-blue-600">{t('learning.modifyAiComment')}</span>
                                        </>
                                    )}
                                    {cellType === 'stay' && (
                                        <>
                                            <FaMinus className="text-gray-400" />
                                            <span className="text-gray-500">{t('learning.noChange')}</span>
                                        </>
                                    )}
                                    {cellType === 'none' && (
                                        <>
                                            <IoClose className="text-red-400" />
                                            <span className="text-red-500">{t('learning.tableNotExist')}</span>
                                        </>
                                    )}
                                </div>
                                <div className="font-mono text-blue-600">
                                    {table.table}
                                </div>
                                {cellType === 'modify' ? (
                                    <div className="flex flex-col gap-1">
                                        <div className="text-gray-400 line-through">
                                            {oldTable?.ai_comment}
                                        </div>
                                        <div className="text-gray-600">
                                            <TableInput id={id} onSelect={handleSelect}/>
                                        </div>
                                    </div>
                                ) : cellType === 'newOverride' ? (
                                    <div className="flex flex-col gap-1">
                                        <div className="text-gray-400 line-through">
                                            {oldTable?.comment}
                                        </div>
                                        <div className="text-gray-600">
                                            <TableInput id={id} onSelect={handleSelect}/>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-600">
                                        <TableInput id={id} onSelect={handleSelect}/>
                                    </div>
                                )}
                            </div>
                        </DetailItem>
                    );
                })}
            </div>
        </div>
    );
}

interface ColumnInputProps {
    id: string;
    onSelect?: (id: string, selected: boolean) => void;
}

const ColumnInput = ({ id, onSelect }: ColumnInputProps) => {
    const dispatch = useAppDispatch();
    const finalLearnColumns = useAppSelector(state => state.records.finalLearnColumns);
    const column = useAppSelector(state => state.records.finalLearnColumns?.find(c => c.table === id.split(':')[1] && c.column === id.split(':')[2]));

    const handleDescChange = useMemoizedFn((id: string, desc: string) => {
        // Keep order
        const newColumns = [...finalLearnColumns!];
        const index = newColumns.findIndex(c => c.table === id.split(':')[1] && c.column === id.split(':')[2]);
        if (index >= 0) {
            newColumns[index] = {
                table: id.split(':')[1],
                column: id.split(':')[2], 
                desc
            };
        } else {
            newColumns.push({
                table: id.split(':')[1],
                column: id.split(':')[2],
                desc
            });
        }
        dispatch(setFinalLearnColumns(newColumns));

        // Select
        onSelect?.(id, true);
    });

    return <input className='w-full border border-gray-100 rounded-lg px-2 py-1 text-sm' value={column?.desc} onClick={e => e.stopPropagation()} onChange={e => handleDescChange(id, e.target.value)}/>;
}

interface ColumnNotesProps {
    showNew?: boolean;
    showNewOverride?: boolean;
    showModified?: boolean;
    showUnchanged?: boolean;
    showNone?: boolean;
}

export function ColumnNotes({ showNew = true, showNewOverride = false, showModified = false, showUnchanged = false, showNone = false }: ColumnNotesProps) {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const columnCellTypes = useAppSelector(state => state.records.columnCellTypes);
    const learnColumns = useAppSelector(state => state.records.learnColumns);
    const finalLearnColumns = useAppSelector(state => state.records.finalLearnColumns);
    const selectedItems = useAppSelector(state => state.records.selectedLearningItems);
    const schema = useAppSelector(state => state.schema.schema);

    const handleSelect = (id: string, selected?: boolean) => {
        const newSelectedItems = [...selectedItems];
        const index = newSelectedItems.indexOf(id);

        if (index >= 0) {
            if (selected === false || selected === undefined) newSelectedItems.splice(index, 1);
        } else {
            if (selected === true || selected === undefined) newSelectedItems.push(id);
        }

        dispatch(setSelectedLearningItems(newSelectedItems));
    };

    if (!finalLearnColumns?.length) return null;

    const filteredColumns = useMemo(() => finalLearnColumns.filter(column => {
        const cellType = columnCellTypes[`${column.table}:${column.column}`];

        return (cellType === 'new' && showNew) ||
            (cellType === 'newOverride' && showNewOverride) ||
            (cellType === 'modify' && showModified) ||
            (cellType === 'stay' && showUnchanged) ||
            (cellType === 'none' && showNone);
    }), [finalLearnColumns, learnColumns, schema, showNew, showNewOverride, showModified, showUnchanged, showNone]);

    if (!filteredColumns.length) return null;

    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <h3 className="text-md font-semibold">{t('learning.columnNotes')}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
                {filteredColumns.map((column) => {
                    const id = `column:${column.table}:${column.column}`;
                    const selected = selectedItems.includes(id);
                    const oldColumn = schema?.columns?.find(c => c.table === column.table && c.column === column.column);
                    const cellType = columnCellTypes[`${column.table}:${column.column}`];

                    return (
                        <DetailItem
                            key={id}
                            id={id}
                            selected={selected}
                            onSelect={() => handleSelect(id)}
                        >
                            <div className="flex flex-col gap-1">
                                <div className={`flex items-center justify-center gap-1 text-sm ${cellType === 'new' ? 'bg-green-100' :
                                    cellType === 'newOverride' ? 'bg-cyan-100' :
                                        cellType === 'modify' ? 'bg-blue-100' :
                                            cellType === 'none' ? 'bg-red-100' :
                                                'bg-gray-100'
                                    }`}>
                                    {cellType === 'new' && (
                                        <>
                                            <FaPlus className="text-green-500" />
                                            <span className="text-green-600">{t('learning.newAiComment')}</span>
                                        </>
                                    )}
                                    {cellType === 'newOverride' && (
                                        <>
                                            <MdAddTask className="text-green-500" />
                                            <span className="text-green-600">{t('learning.overrideDefaultComment')}</span>
                                        </>
                                    )}
                                    {cellType === 'modify' && (
                                        <>
                                            <FaPen className="text-blue-500" />
                                            <span className="text-blue-600">{t('learning.modifyAiComment')}</span>
                                        </>
                                    )}
                                    {cellType === 'stay' && (
                                        <>
                                            <FaMinus className="text-gray-400" />
                                            <span className="text-gray-500">{t('learning.noChange')}</span>
                                        </>
                                    )}
                                    {cellType === 'none' && (
                                        <>
                                            <IoClose className="text-red-400" />
                                            <span className="text-red-500">{t('learning.columnNotExist')}</span>
                                        </>
                                    )}
                                </div>
                                <div className="font-mono text-blue-600">
                                    {`${column.table}.${column.column}`}
                                </div>
                                {cellType === 'modify' ? (
                                    <div className="flex flex-col gap-1">
                                        <div className="text-gray-400 line-through">
                                            {oldColumn?.ai_comment}
                                        </div>
                                        <div className="text-gray-600">
                                            <ColumnInput id={id} onSelect={handleSelect}/>
                                        </div>
                                    </div>
                                ) : cellType === 'newOverride' ? (
                                    <div className="flex flex-col gap-1">
                                        <div className="text-gray-400 line-through">
                                            {oldColumn?.comment}
                                        </div>
                                        <div className="text-gray-600">
                                            <ColumnInput id={id} onSelect={handleSelect}/>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-600">
                                        <ColumnInput id={id} onSelect={handleSelect}/>
                                    </div>
                                )}
                            </div>
                        </DetailItem>
                    );
                })}
            </div>
        </div>
    );
}

interface TableRelationsProps {
    showNew?: boolean;
    showUnchanged?: boolean;
    showModified?: boolean;
    showNone?: boolean;
}

export function TableRelations({ showNew = true, showUnchanged = false, showModified = false, showNone = false }: TableRelationsProps) {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const relationCellTypes = useAppSelector(state => state.records.relationCellTypes);
    const finalLearnRelations = useAppSelector(state => state.records.finalLearnRelations);
    const selectedItems = useAppSelector(state => state.records.selectedLearningItems);
    const schema = useAppSelector(state => state.schema.schema);

    const filteredRelations = useMemo(() => {
        if (!finalLearnRelations?.length) return [];
        
        return finalLearnRelations.filter(relation => {
            const cellType = relationCellTypes[`${relation.table1}:${relation.column1}:${relation.table2}:${relation.column2}`];

            return (cellType === 'new' && showNew) ||
                (cellType === 'stay' && showUnchanged) ||
                (cellType === 'modify' && showModified) ||
                (cellType === 'none' && showNone);
        });
    }, [finalLearnRelations, relationCellTypes, showNew, showUnchanged, showModified, showNone]);

    const handleSelect = (id: string, selected?: boolean) => {
        const newSelectedItems = [...selectedItems];
        const index = newSelectedItems.indexOf(id);

        if (index >= 0) {
            if (selected === false || selected === undefined) newSelectedItems.splice(index, 1);
        } else {
            if (selected === true || selected === undefined) newSelectedItems.push(id);
        }

        dispatch(setSelectedLearningItems(newSelectedItems));
    };

    const handleRelationTypeChange = (id: string, relation: TableRelation, newType: string) => {
        const updatedRelation = {
            ...relation,
            relation_type: newType,
            table1: relation.table1!,
            column1: relation.column1!,
            table2: relation.table2!,
            column2: relation.column2!
        };
        // Keep order, find the original position
        const newRelations = [...finalLearnRelations!];
        const index = newRelations.findIndex(r => 
            r.table1 === relation.table1 && 
            r.column1 === relation.column1 && 
            r.table2 === relation.table2 && 
            r.column2 === relation.column2
        );
        if (index >= 0) {
            newRelations[index] = updatedRelation;
        } else {
            newRelations.push(updatedRelation);
        }
        dispatch(setFinalLearnRelations(newRelations));
        // Select
        handleSelect(id, true);
    };

    if (!finalLearnRelations?.length) return null;
    if (!filteredRelations.length) return null;

    return (
        <div>
            <h3 className="text-md font-semibold mb-2">{t('learning.tableRelations')}</h3>
            <div className="flex flex-wrap gap-2">
                {filteredRelations.map((relation) => {
                    const id = `relation:${relation.table1}:${relation.column1}:${relation.table2}:${relation.column2}`;
                    const selected = selectedItems.includes(id);
                    const cellType = relationCellTypes[`${relation.table1}:${relation.column1}:${relation.table2}:${relation.column2}`];
                    const oldRelation = getOldRelation(schema, {
                        table1: relation.table1!,
                        column1: relation.column1!,
                        table2: relation.table2!,
                        column2: relation.column2!,
                        relation_type: relation.relation_type!
                    });

                    return (
                        <DetailItem
                            key={id}
                            id={id}
                            selected={selected}
                            onSelect={() => handleSelect(id)}
                        >
                            <div className="flex flex-col gap-1">
                                <div className={`flex items-center justify-center gap-1 text-sm ${cellType === 'new' ? 'bg-green-100' :
                                    cellType === 'stay' ? 'bg-gray-100' :
                                        cellType === 'modify' ? 'bg-blue-100' :
                                            'bg-red-100'
                                    }`}>
                                    {cellType === 'new' && (
                                        <>
                                            <FaPlus className="text-green-500" />
                                            <span className="text-green-600">{t('learning.newRelation')}</span>
                                        </>
                                    )}
                                    {cellType === 'stay' && (
                                        <>
                                            <FaMinus className="text-gray-400" />
                                            <span className="text-gray-500">{t('learning.noChange')}</span>
                                        </>
                                    )}
                                    {cellType === 'modify' && (
                                        <>
                                            <FaPen className="text-blue-500" />
                                            <span className="text-blue-600">{t('learning.modifyRelation')}</span>
                                        </>
                                    )}
                                    {cellType === 'none' && (
                                        <>
                                            <IoClose className="text-red-400" />
                                            <span className="text-red-500">{t('learning.tableNotExist')}</span>
                                        </>
                                    )}
                                </div>
                                <div className="font-mono text-blue-600 text-center">
                                    {`${relation.table1}.${relation.column1}`}
                                </div>
                                <div className="text-gray-600 text-center">
                                    {cellType === 'modify' && (
                                        <div className="text-gray-400 line-through">
                                            {getRelationTypeName(t, oldRelation?.relation_type)}
                                        </div>
                                    )}
                                    <select
                                        value={relation?.relation_type || ''}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onChange={(e) => {
                                            handleRelationTypeChange(id, relation, e.target.value)
                                        }}
                                        className="mx-auto rounded-lg border border-gray-300 px-2 py-1 text-sm"
                                    >
                                        <option disabled value="">{t('learning.selectRelationType')}</option>
                                        <option value="1-1">{t('learning.oneToOne')}</option>
                                        <option value="1-n">{t('learning.oneToMany')}</option>
                                        <option value="n-1">{t('learning.manyToOne')}</option>
                                        <option value="n-n">{t('learning.manyToMany')}</option>
                                    </select>
                                </div>
                                <div className="font-mono text-blue-600 text-center">
                                    {`${relation.table2}.${relation.column2}`}
                                </div>
                            </div>
                        </DetailItem>
                    );
                })}
            </div>
        </div>
    );
} 