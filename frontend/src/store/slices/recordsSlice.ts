import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VectorSQL, TableDesc, ColumnDesc, TableRelation } from '../../api-docs';

export interface SelectedColumn {
  table: string
  columns: string[]
}

export interface SelectedDoc {
  def_doc: string
  doc_id: number
}

interface RecordsState {
  editingQuestion: string
  editingQuestionSupplement: string
  // Business data state
  taskOptions: {
    autoMatchSqlLog: boolean
    autoGenRelatedColumns: boolean
    autoMatchDDL: boolean
    autoGenSql: boolean
    autoLearnOnRight: boolean
    matchDocCount: number
    matchSqlLogCount: number
    matchDdlTableCount: number
    matchDdlColumnCount: number
  } | null
  selectedRules: number[] // Store selected rule IDs
  editingSql: string
  editingDocs: SelectedDoc[]
  editingSqls: VectorSQL[]
  selectedColumns: SelectedColumn[]

  questionModified: boolean
  questionSupplementModified: boolean
  optionsModified: boolean
  rulesModified: boolean
  sqlModified: boolean
  docsModified: boolean
  sqlsModified: boolean
  ddlModified: boolean

  taskModified: boolean

  // Question list
  questions_page: number // Current page
  questions_total_pages: number // Total pages
  questions_page_size: number // Items per page

  // Display states
  activeTab: number
  showEditModal: boolean
  editTable?: string

  // Learning results
  learnTables: TableDesc[]
  tableCellTypes: Record<string, TableCellType>
  learnColumns: ColumnDesc[]
  columnCellTypes: Record<string, ColumnCellType>
  learnRelations: TableRelation[]
  relationCellTypes: Record<string, RelationCellType>
  finalLearnTables: TableDesc[] // Modifiable
  finalLearnColumns: ColumnDesc[]
  finalLearnRelations: TableRelation[]
  selectedLearningItems: string[] // Store selected item IDs

  // AI comment
  showAICommentModal: boolean
  aiCommentTable?: string
}

const initialState: RecordsState = {
  selectedColumns: [],
  activeTab: 0,
  showEditModal: false,
  editTable: undefined,
  sqlModified: false,
  questions_page: 1,
  questions_total_pages: 1,
  questions_page_size: 20,
  questionModified: false,
  questionSupplementModified: false,
  editingQuestion: '',
  editingSql: '',
  editingQuestionSupplement: '',
  learnTables: [],
  tableCellTypes: {},
  learnColumns: [],
  columnCellTypes: {},
  learnRelations: [],
  relationCellTypes: {},
  finalLearnTables: [],
  finalLearnColumns: [],
  finalLearnRelations: [],
  selectedLearningItems: [],
  showAICommentModal: false,
  aiCommentTable: undefined,
  selectedRules: [],
  docsModified: false,
  editingDocs: [],
  sqlsModified: false,
  editingSqls: [],
  ddlModified: false,
  taskOptions: null,
  taskModified: false,
  optionsModified: false,
  rulesModified: false,
};

export const recordsSlice = createSlice({
  name: 'records',
  initialState,
  reducers: {
    setSelectedColumns: (state, action: PayloadAction<SelectedColumn[]>) => {
      state.selectedColumns = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<number>) => {
      state.activeTab = action.payload;
    },
    setShowEditModal: (state, action: PayloadAction<boolean>) => {
      state.showEditModal = action.payload;
    },
    setEditTable: (state, action: PayloadAction<string | undefined>) => {
      state.editTable = action.payload;
    },
    setQuestionsPage: (state, action: PayloadAction<number>) => {
      state.questions_page = action.payload;
    },
    setQuestionsTotalPages: (state, action: PayloadAction<number>) => {
      state.questions_total_pages = action.payload;
    },
    setSqlModified: (state, action: PayloadAction<boolean>) => {
      state.sqlModified = action.payload;
    },
    setEditingSql: (state, action: PayloadAction<string>) => {
      state.editingSql = action.payload;
    },
    setQuestionModified: (state, action: PayloadAction<boolean>) => {
      state.questionModified = action.payload;
    },
    setQuestionSupplementModified: (state, action: PayloadAction<boolean>) => {
      state.questionSupplementModified = action.payload;
    },
    setEditingQuestion: (state, action: PayloadAction<string>) => {
      state.editingQuestion = action.payload;
    },
    setEditingQuestionSupplement: (state, action: PayloadAction<string>) => {
      state.editingQuestionSupplement = action.payload;
    },
    setLearnTables: (state, action: PayloadAction<TableDesc[]>) => {
      state.learnTables = action.payload;
    },
    setLearnColumns: (state, action: PayloadAction<ColumnDesc[]>) => {
      state.learnColumns = action.payload;
    },
    setLearnRelations: (state, action: PayloadAction<TableRelation[]>) => {
      state.learnRelations = action.payload;
    },
    setTableCellTypes: (state, action: PayloadAction<Record<string, TableCellType>>) => {
      state.tableCellTypes = action.payload;
    },
    setColumnCellTypes: (state, action: PayloadAction<Record<string, ColumnCellType>>) => {
      state.columnCellTypes = action.payload;
    },
    setRelationCellTypes: (state, action: PayloadAction<Record<string, RelationCellType>>) => {
      state.relationCellTypes = action.payload;
    },
    setFinalLearnTables: (state, action: PayloadAction<TableDesc[]>) => {
      state.finalLearnTables = action.payload;
    },
    setFinalLearnColumns: (state, action: PayloadAction<ColumnDesc[]>) => {
      state.finalLearnColumns = action.payload;
    },
    setFinalLearnRelations: (state, action: PayloadAction<TableRelation[]>) => {
      state.finalLearnRelations = action.payload;
    },
    setSelectedLearningItems: (state, action: PayloadAction<string[]>) => {
      state.selectedLearningItems = action.payload;
    },
    setLearnResults: (state, action: PayloadAction<{
      tables: TableDesc[],
      columns: ColumnDesc[],
      relations: TableRelation[]
    }>) => {
      state.learnTables = action.payload.tables;
      state.learnColumns = action.payload.columns;
      state.learnRelations = action.payload.relations;
    },
    setShowAICommentModal: (state, action: PayloadAction<boolean>) => {
      state.showAICommentModal = action.payload;
    },
    setAICommentTable: (state, action: PayloadAction<string | undefined>) => {
      state.aiCommentTable = action.payload;
    },
    setSelectedRules: (state, action: PayloadAction<number[]>) => {
      state.selectedRules = action.payload;
    },
    setRulesModified: (state, action: PayloadAction<boolean>) => {
      state.rulesModified = action.payload;
    },
    setDocsModified: (state, action: PayloadAction<boolean>) => {
      state.docsModified = action.payload;
    },
    setEditingDocs: (state, action: PayloadAction<SelectedDoc[]>) => {
      state.editingDocs = action.payload;
    },
    setSqlsModified: (state, action: PayloadAction<boolean>) => {
      state.sqlsModified = action.payload;
    },
    setEditingSqls: (state, action: PayloadAction<VectorSQL[]>) => {
      state.editingSqls = action.payload;
    },
    setDdlModified: (state, action: PayloadAction<boolean>) => {
      state.ddlModified = action.payload;
    },
    setTaskOptions: (state, action: PayloadAction<RecordsState['taskOptions']>) => {
      state.taskOptions = action.payload;
    },
    setOptionsModified: (state, action: PayloadAction<boolean>) => {
      state.optionsModified = action.payload;
    },
    mergeTaskOptions: (state, action: PayloadAction<Partial<NonNullable<RecordsState['taskOptions']>>>) => {
      if (state.taskOptions) {
        state.taskOptions = { ...state.taskOptions, ...action.payload };
      }
    },
    restoreTaskOptions: (state) => {
      state.optionsModified = false;
    },
    setTaskModified: (state, action: PayloadAction<boolean>) => {
      state.taskModified = action.payload;
    },
    restoreSelectedRules: (state) => {
      state.rulesModified = false;
    },
  },
});

export const { 
  setSelectedColumns, 
  setShowEditModal, 
  setEditTable, 
  setActiveTab,
  setSqlModified, 
  setEditingSql, 
  setQuestionModified, 
  setQuestionSupplementModified,
  setEditingQuestion,
  setEditingQuestionSupplement,
  setQuestionsPage,
  setQuestionsTotalPages,
  setLearnTables,
  setLearnColumns,
  setLearnRelations,
  setTableCellTypes,
  setColumnCellTypes,
  setRelationCellTypes,
  setFinalLearnTables,
  setFinalLearnColumns,
  setFinalLearnRelations,
  setSelectedLearningItems,
  setLearnResults,
  setShowAICommentModal,
  setAICommentTable,
  setSelectedRules,
  setDocsModified,
  setEditingDocs,
  setSqlsModified,
  setEditingSqls,
  setDdlModified,
  setTaskOptions,
  mergeTaskOptions,
  restoreTaskOptions,
  setOptionsModified,
  setTaskModified,
  setRulesModified,
  restoreSelectedRules,
} = recordsSlice.actions;

export default recordsSlice.reducer; 