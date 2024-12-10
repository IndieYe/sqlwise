import { Button, Table} from "flowbite-react";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toast } from "react-toastify";
import { setSelectedTable } from "@/store/slices/ddlSlice";
import { HiTrash, HiLightningBolt, HiPlus, HiPencil, HiCheck } from "react-icons/hi";
import { mainApi } from "@/App";
import useTask from "@/hooks/useTask";
import { getRelationTypeName, reverseRelationType } from "@/utils/learnUtil";
import { TableRelationDTO } from "@/api-docs";
import RelationEditModal from "./RelationEditModal";
import { useTranslation } from "react-i18next";

interface TableCommentEditorProps {
    tableName: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

// Add new type definition
interface CommentDiff {
    oldComment: string;
    newComment: string;
    isNew: boolean;
}

interface ColumnCommentWithDiff extends CommentDiff {
    col: string;
}

const TableCommentEditor = ({ tableName, onConfirm, onCancel }: TableCommentEditorProps) => {
    const { t } = useTranslation();
    const schema = useAppSelector(state => state.schema.schema);
    const dispatch = useAppDispatch();
    const {refreshSchema} = useTask();

    const [tableDefComment, setTableDefComment] = useState('');
    const [tableComment, setTableComment] = useState('');
    const [columnComments, setColumnComments] = useState<{col: string, comment: string}[]>([]);
    const [changedRelations, setChangedRelations] = useState<TableRelationDTO[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [tableCommentDiff, setTableCommentDiff] = useState<CommentDiff | null>(null);
    const [columnCommentDiffs, setColumnCommentDiffs] = useState<ColumnCommentWithDiff[]>([]);
    const [appliedComments, setAppliedComments] = useState<Set<string>>(new Set());
    const [showRelationModal, setShowRelationModal] = useState(false);
    const [editingRelation, setEditingRelation] = useState<{
        currentColumn: string;
        otherTable: string;
        otherColumn: string;
        relationType: string;
    } | null>(null);
    const projectId = useAppSelector(state => state.app.projectId);

    // Add tracking modified status
    const [hasChanges, setHasChanges] = useState(false);

    // Save original values for comparison
    const [originalState, setOriginalState] = useState({
        tableComment: '',
        columnComments: [] as {col: string, comment: string}[],
        relations: [] as TableRelationDTO[]
    });

    // Get all columns of the current edited table
    const currentColumns = schema?.columns?.filter(col => col.table === tableName) || [];

    useEffect(() => {
        if (schema?.tables && tableName) {
            // Set table definition comment
            setTableDefComment(schema.tables?.find(t => t.table === tableName)?.comment || '');
            // Set table AI comment
            const table = schema.tables.find(t => t.table === tableName);
            setTableComment(table?.ai_comment || '');

            // Set column AI comments
            const comments = currentColumns.map(col => ({
                col: col.column!,
                comment: col.ai_comment || ''
            }));
            setColumnComments(comments);

            // Save original state
            setOriginalState({
                tableComment: table?.ai_comment || '',
                columnComments: comments,
                relations: schema.relations?.filter(r => 
                    r.table1 === tableName || r.table2 === tableName
                ).map(r => ({
                    table1: r.table1,
                    column1: r.column1,
                    table2: r.table2,
                    column2: r.column2,
                    relation_type: r.relation_type
                })) || []
            });
        }
    }, [schema, tableName]);

    // Load all related relations when initialized
    useEffect(() => {
        if (schema?.relations && tableName) {
            // Find all relations related to the current table
            const tableRelations = schema.relations.filter(r => 
                r.table1 === tableName || r.table2 === tableName
            ).map(r => ({
                table1: r.table1,
                column1: r.column1,
                table2: r.table2,
                column2: r.column2,
                relation_type: r.relation_type
            }));
            
            setChangedRelations(tableRelations);
        }
    }, [schema?.relations, tableName]);

    // Check if there are any changes
    useEffect(() => {
        const hasTableCommentChange = tableComment !== originalState.tableComment;
        
        const hasColumnCommentChanges = columnComments.some(current => {
            const original = originalState.columnComments.find(c => c.col === current.col);
            return original?.comment !== current.comment;
        });

        const hasRelationChanges = changedRelations.length !== originalState.relations.length ||
            changedRelations.some(current => {
                return !originalState.relations.some(original => 
                    original.table1 === current.table1 &&
                    original.column1 === current.column1 &&
                    original.table2 === current.table2 &&
                    original.column2 === current.column2 &&
                    original.relation_type === current.relation_type
                );
            });

        setHasChanges(hasTableCommentChange || hasColumnCommentChanges || hasRelationChanges);
    }, [tableComment, columnComments, changedRelations, originalState]);

    const handleConfirm = async () => {
        try {
            await mainApi.mainUpdateAiCommentPost({
                project_id: projectId,
                table: tableName,
                comment: tableComment,
                columns: columnComments,
                relations: changedRelations
            });
            refreshSchema();
            // Reset all states
            setAppliedComments(new Set());
            setTableCommentDiff(null);
            setColumnCommentDiffs([]);
            setChangedRelations([]);
            setIsGenerating(false);
            toast.success(t('ddl.tableComments.updateSuccess'));
            onConfirm();
        } catch (error) {
            toast.error(t('common.unknownError'));
            console.error('Error updating AI comments:', error);
        }
    };

    const handleColumnCommentChange = (columnName: string, comment: string) => {
        setColumnComments(prev => 
            prev.map(c => 
                c.col === columnName ? { ...c, comment } : c
            )
        );
    };

    const handleRelationClick = (otherTable: string) => {
        dispatch(setSelectedTable(otherTable));
    };

    const handleDeleteRelation = (column: string, otherTable: string, otherColumn: string) => {
        // Remove the corresponding relation from changedRelations
        setChangedRelations(prev => 
            prev.filter(r => 
                !(
                    (r.table1 === tableName && r.column1 === column && 
                     r.table2 === otherTable && r.column2 === otherColumn) ||
                    (r.table2 === tableName && r.column2 === column && 
                     r.table1 === otherTable && r.column1 === otherColumn)
                )
            )
        );
    };

    const handleGenerateAIComment = async () => {
        setIsGenerating(true);
        try {
            const response = await mainApi.mainGenTableAICommentsPost({
                project_id: projectId,
                table: tableName
            });
            if (response.data) {
                // Handle table comment
                if (response.data.comment !== tableComment) {
                    if (!tableComment) {
                        setTableComment(response.data.comment || '');
                        setAppliedComments(prev => new Set(prev).add('table'));
                    } else {
                        setTableCommentDiff({
                            oldComment: tableComment,
                            newComment: response.data.comment || '',
                            isNew: false
                        });
                    }
                }

                // Handle column comments
                const newDiffs: ColumnCommentWithDiff[] = [];
                response.data.columns?.forEach(newCol => {
                    const existingComment = columnComments.find(c => c.col === newCol.column);
                    if (newCol.comment !== existingComment?.comment) {
                        if (!existingComment?.comment) {
                            setColumnComments(prev => 
                                prev.map(c => 
                                    c.col === newCol.column 
                                        ? { ...c, comment: newCol.comment || '' } 
                                        : c
                                )
                            );
                            setAppliedComments(prev => new Set(prev).add(newCol.column));
                        } else {
                            newDiffs.push({
                                col: newCol.column,
                                oldComment: existingComment.comment,
                                newComment: newCol.comment || '',
                                isNew: false
                            });
                        }
                    }
                });
                setColumnCommentDiffs(newDiffs);

                toast.success(t('ddl.tableComments.generateSuccess'));
                if (newDiffs.length > 0) {
                    toast.info(t('ddl.tableComments.hasChanges'));
                }
            }
        } catch (error) {
            toast.error(t('common.unknownError'));
            console.error('Error generating AI comments:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApplyTableComment = () => {
        if (tableCommentDiff) {
            setTableComment(tableCommentDiff.newComment);
            setAppliedComments(prev => new Set(prev).add('table'));
            setTableCommentDiff(null);
        }
    };

    const handleApplyColumnComment = (col: string) => {
        const diff = columnCommentDiffs.find(d => d.col === col);
        if (diff) {
            setColumnComments(prev => 
                prev.map(c => c.col === col ? { ...c, comment: diff.newComment } : c)
            );
            setColumnCommentDiffs(prev => prev.filter(d => d.col !== col));
            setAppliedComments(prev => new Set(prev).add(col));
        }
    };

    // Add a new relation button and handling function in the table cell
    const handleAddRelation = (column: string) => {
        setEditingRelation({
            currentColumn: column,
            otherTable: schema?.tables?.[0]?.table || '', // Default to the first table
            otherColumn: '',
            relationType: '1-1' // Default relation type
        });
        setShowRelationModal(true);
    };

    return (
        <div className="space-y-4 pb-20">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">{tableName}</h2>
                <div className="text-sm text-gray-500">{tableDefComment}</div>
                <div className="flex-1 space-y-2">
                    {tableCommentDiff?.isNew ? (
                        <div className="relative">
                            <textarea
                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg overflow-hidden placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                value={tableCommentDiff.newComment}
                                onChange={e => setTableCommentDiff({
                                    ...tableCommentDiff,
                                    newComment: e.target.value
                                })}
                                placeholder={t('ddl.tableComments.pleaseInputComment')}
                                rows={1}
                            />
                            <HiPlus className="absolute left-2 top-2.5 h-4 w-4 text-green-500" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="relative">
                                <textarea
                                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg overflow-hidden placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={tableComment}
                                    onChange={e => setTableComment(e.target.value)}
                                    placeholder={t('ddl.tableComments.pleaseInputComment')}
                                    rows={1}
                                />
                                {appliedComments.has('table') ? (
                                    <HiCheck className="absolute left-2 top-2.5 h-4 w-4 text-green-500" />
                                ) : tableCommentDiff && (
                                    <HiPencil className="absolute left-2 top-2.5 h-4 w-4 text-blue-500" />
                                )}
                            </div>
                            {tableCommentDiff && (
                                <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                                    <div className="flex-1 text-sm">
                                        {tableCommentDiff.newComment}
                                    </div>
                                    <button
                                        onClick={handleApplyTableComment}
                                        className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 font-medium rounded-md hover:bg-blue-50 transition-colors"
                                    >
                                        {t('ddl.tableComments.apply')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <Button 
                    size="sm"
                    onClick={handleGenerateAIComment}
                    className="flex items-center gap-2"
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <span className="animate-spin">
                                <HiLightningBolt className="h-4 w-4" />
                            </span>
                            {t('ddl.tableComments.generating')}
                        </>
                    ) : (
                        <>
                            <HiLightningBolt className="h-4 w-4" />
                            {t('ddl.tableComments.generateAiComments')}
                        </>
                    )}
                </Button>
            </div>
            <div className="overflow-x-auto">
                <Table striped>
                    <Table.Head>
                        <Table.HeadCell className="py-2 min-w-[120px]">{t('ddl.tableComments.columnName')}</Table.HeadCell>
                        <Table.HeadCell className="py-2 min-w-[100px]">{t('ddl.tableComments.columnType')}</Table.HeadCell>
                        <Table.HeadCell className="py-2 min-w-[150px]">{t('ddl.tableComments.columnComment')}</Table.HeadCell>
                        <Table.HeadCell className="py-2 min-w-[300px]">{t('ddl.tableComments.aiComment')}</Table.HeadCell>
                        <Table.HeadCell className="py-2 min-w-[200px]">{t('ddl.tableComments.relations')}</Table.HeadCell>
                    </Table.Head>
                    <Table.Body>
                        {currentColumns.map((column) => {
                            // Get all relations related to the current column from changedRelations
                            const columnRelations = changedRelations.filter(r => 
                                (r.table1 === tableName && r.column1 === column.column) ||
                                (r.table2 === tableName && r.column2 === column.column)
                            );

                            // Build arrays for display
                            let otherTables: string[] = [];
                            let otherColumns: string[] = [];
                            let relationTypes: string[] = [];
                            
                            columnRelations.forEach(relation => {
                                if (relation.table1 === tableName && relation.column1 === column.column) {
                                    otherTables.push(relation.table2);
                                    otherColumns.push(relation.column2);
                                    relationTypes.push(relation.relation_type);
                                } else {
                                    otherTables.push(relation.table1);
                                    otherColumns.push(relation.column1);
                                    relationTypes.push(reverseRelationType(relation.relation_type));
                                }
                            });

                            return <Table.Row key={column.column}>
                                <Table.Cell className="py-1">{column.column}</Table.Cell>
                                <Table.Cell className="py-1">{column.type}</Table.Cell>
                                <Table.Cell className="py-1">{column.comment || ''}</Table.Cell>
                                <Table.Cell className="py-1 min-w-[250px]">
                                    {columnCommentDiffs.find(d => d.col === column.column)?.isNew ? (
                                        <div className="relative">
                                            <textarea
                                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg overflow-hidden placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                                value={columnCommentDiffs.find(d => d.col === column.column)?.newComment || ''}
                                                onChange={e => {
                                                    const newValue = e.target.value;
                                                    setColumnCommentDiffs(prev => prev.map(d => 
                                                        d.col === column.column ? { ...d, newComment: newValue } : d
                                                    ));
                                                }}
                                                placeholder={t('ddl.tableComments.pleaseInputComment')}
                                                rows={1}
                                            />
                                            <HiPlus className="absolute left-2 top-2.5 h-4 w-4 text-green-500" />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <textarea
                                                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg overflow-hidden placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                                    value={columnComments.find(c => c.col === column.column)?.comment || ''}
                                                    onChange={e => handleColumnCommentChange(column.column!, e.target.value)}
                                                    placeholder={t('ddl.tableComments.pleaseInputComment')}
                                                    rows={1}
                                                />
                                                {appliedComments.has(column.column!) ? (
                                                    <HiCheck className="absolute left-2 top-2.5 h-4 w-4 text-green-500" />
                                                ) : columnCommentDiffs.find(d => d.col === column.column) && (
                                                    <HiPencil className="absolute left-2 top-2.5 h-4 w-4 text-blue-500" />
                                                )}
                                            </div>
                                            {columnCommentDiffs.find(d => d.col === column.column) && (
                                                <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                                                    <div className="flex-1 text-sm">
                                                        {columnCommentDiffs.find(d => d.col === column.column)?.newComment}
                                                    </div>
                                                    <button 
                                                        onClick={() => handleApplyColumnComment(column.column!)}
                                                        className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 font-medium rounded-md hover:bg-blue-50 transition-colors"
                                                    >
                                                        {t('ddl.tableComments.apply')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Table.Cell>
                                <Table.Cell className="py-1">
                                    <div className="space-y-2 group">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 py-1 rounded transition-colors flex items-center justify-center gap-1"
                                                onClick={() => handleAddRelation(column.column!)}
                                            >
                                                <HiPlus className="h-4 w-4" />
                                                {t('ddl.tableComments.addRelation')}
                                            </button>
                                        </div>
                                        {otherTables.length > 0 && otherTables.map((otherTable, idx) => {
                                            const otherColumn = otherColumns[idx];
                                            const relationType = relationTypes[idx];

                                            return <div key={`${otherTable}-${otherColumn}`} className="font-mono flex items-center gap-2 group">
                                                <div>
                                                    <a href="#" 
                                                        className="text-blue-600 hover:text-blue-800 hover:underline" 
                                                        onClick={() => handleRelationClick(otherTable)}
                                                    >
                                                        {otherTable}
                                                    </a>
                                                    <span>.</span>
                                                    {otherColumn}
                                                </div>
                                                <span className="shrink-0 px-2 py-1 text-sm text-gray-500">
                                                    {getRelationTypeName(t, relationType)}
                                                </span>
                                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                                    <button
                                                        className="text-gray-500 hover:text-blue-500 transition-all"
                                                        title="Edit relation"
                                                        onClick={() => {
                                                            setEditingRelation({
                                                                currentColumn: column.column!,
                                                                otherTable,
                                                                otherColumn,
                                                                relationType: relationType
                                                            });
                                                            setShowRelationModal(true);
                                                        }}
                                                    >
                                                        <HiPencil className="h-4 w-4" />
                                                    </button>
                                                    <button 
                                                        className="text-gray-500 hover:text-red-500 transition-all"
                                                        title="Delete relation"
                                                        onClick={() => handleDeleteRelation(column.column!, otherTable, otherColumn)}
                                                    >
                                                        <HiTrash className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        })}
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        })}
                    </Table.Body>
                </Table>
            </div>
            {hasChanges && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
                    <Button onClick={handleConfirm} className="shadow-lg">
                        {t('common.submit')}
                    </Button>
                    {onCancel && (
                        <Button color="gray" onClick={onCancel} className="shadow-lg">
                            {t('common.cancel')}
                        </Button>
                    )}
                </div>
            )}
            {editingRelation && (
                <RelationEditModal
                    show={showRelationModal}
                    onClose={() => {
                        setShowRelationModal(false);
                        setEditingRelation(null);
                    }}
                    onConfirm={(relation) => {
                        setChangedRelations(prev => {
                            const filtered = prev.filter(r => 
                                !(r.table1 === tableName && r.column1 === editingRelation.currentColumn && 
                                  r.table2 === editingRelation.otherTable && r.column2 === editingRelation.otherColumn) &&
                                !(r.table2 === tableName && r.column2 === editingRelation.currentColumn && 
                                  r.table1 === editingRelation.otherTable && r.column1 === editingRelation.otherColumn)
                            );
                            return [...filtered, relation];
                        });
                        setShowRelationModal(false);
                        setEditingRelation(null);
                    }}
                    currentTable={tableName}
                    currentColumn={editingRelation.currentColumn}
                    otherTable={editingRelation.otherTable}
                    otherColumn={editingRelation.otherColumn}
                    relationType={editingRelation.relationType}
                    schema={schema}
                />
            )}
        </div>
    );
};

export default TableCommentEditor; 