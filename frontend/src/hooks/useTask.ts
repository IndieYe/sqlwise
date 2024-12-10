import { useCallback } from "react"
import { mainApi } from "../App"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { setDocsModified, setEditingDocs, setEditingQuestion, setEditingSql, setLearnColumns, setLearnRelations, setLearnTables, setQuestionModified, setSelectedColumns, setSelectedLearningItems, setSelectedRules, setShowEditModal, setEditingSqls, setQuestionsTotalPages, setFinalLearnTables, setFinalLearnColumns, setFinalLearnRelations, setTableCellTypes, setColumnCellTypes, setRelationCellTypes, setTaskOptions, setEditingQuestionSupplement } from "../store/slices/recordsSlice"
import { setEditTable } from "../store/slices/recordsSlice"
import { setCurrentJob, setJobs, setQuestions, setTask, setTaskId } from "../store/slices/taskSlice"
import { setSchema } from "@/store/slices/schemaSlice"
import { useMemoizedFn } from "ahooks"
import { getRelationCellType } from "@/utils/learnUtil"
import { getColumnCellType } from "@/utils/learnUtil"
import { getTableCellType } from "@/utils/learnUtil"
import { TaskDTO } from "@/api-docs/api"
import { getSelectedColumns } from "@/utils/bizUtil"

const useTask = () => {
    const dispatch = useAppDispatch()
    const schema = useAppSelector(state => state.schema.schema)
    const currentTaskId = useAppSelector(state => state.task.taskId)
    const envData = useAppSelector(state => state.app.envData)
    const questionsPage = useAppSelector(state => state.records.questions_page)
    const questionsPageSize = useAppSelector(state => state.records.questions_page_size)
    const projectId = useAppSelector(state => state.app.projectId)
    const editingQuestionSupplement = useAppSelector(state => state.records.editingQuestionSupplement)

    const refreshQuestions = useCallback(async () => {
        const res = await mainApi.mainQuestionsGet(projectId, questionsPage, questionsPageSize)
        dispatch(setQuestions(res.data.items || []))
        dispatch(setQuestionsTotalPages(Math.ceil((res.data.total || 0) / questionsPageSize)))
    }, [dispatch, questionsPage, questionsPageSize, projectId])

    const updateQuestion = useCallback(async (taskId: number, question: string) => {
        await mainApi.mainUpdateQuestionPost({
            taskId, 
            question,
            question_supplement: editingQuestionSupplement
        })
        refreshQuestions()
    }, [refreshQuestions, editingQuestionSupplement])

    const updateSql = useCallback(async (taskId: number, sql: string) => {
        await mainApi.mainUpdateSqlPost({taskId, sql})
    }, [])

    const newTask = useMemoizedFn(async () => {
        dispatch(setTaskId())
        dispatch(setTask())

        dispatch(setJobs([]))
        dispatch(setCurrentJob())

        dispatch(setSelectedRules(schema?.rules?.filter(rule => rule.def_selected).map(rule => rule.id) || []))
        dispatch(setSelectedColumns([]))
        
        dispatch(setQuestionModified(false))
        dispatch(setEditingQuestion(''))
        dispatch(setEditingQuestionSupplement(''))

        dispatch(setEditingSql(''))

        dispatch(setShowEditModal(false))
        dispatch(setEditTable(undefined))

        dispatch(setLearnTables([]))
        dispatch(setLearnColumns([]))
        dispatch(setLearnRelations([]))
        dispatch(setTableCellTypes({}))
        dispatch(setColumnCellTypes({}))
        dispatch(setRelationCellTypes({}))
        dispatch(setFinalLearnTables([]))
        dispatch(setFinalLearnColumns([]))
        dispatch(setFinalLearnRelations([]))
        dispatch(setSelectedLearningItems([]))

        dispatch(setDocsModified(false))
        dispatch(setEditingDocs([]))
        dispatch(setTaskOptions(null))
    })

    const deleteTask = useMemoizedFn(async (taskId: number) => {
        await mainApi.mainTaskTaskIdDelete(taskId)
        refreshQuestions()
        if (taskId === currentTaskId) {
            newTask()
        }
    })

    const applyTask = useMemoizedFn(async (task: TaskDTO) => {
        //set question
        dispatch(setEditingQuestion(task.question??''))
        //set questionSupplement
        dispatch(setEditingQuestionSupplement(task.question_supplement??''))
        //set taskOptions
        dispatch(setTaskOptions(task.options as any))
        //set selectedRules
        dispatch(setSelectedRules(task.rules || []))
        //set editingSql
        dispatch(setEditingSql(task.sql??''))
        //set editingDocs
        dispatch(setEditingDocs(task.docs || []))
        //set editingSqls
        dispatch(setEditingSqls(task.sqls || []))
        //set selectedColumns
        const selectedColumns = getSelectedColumns(task.columns, schema!)
        dispatch(setSelectedColumns(selectedColumns))

        //jobs
        const jobs = task.jobs
        dispatch(setJobs(jobs))
        dispatch(setCurrentJob(jobs?.[jobs.length - 1]))

        //learnTables
        dispatch(setLearnTables(task.learn_result?.tables || []))
        dispatch(setLearnColumns(task.learn_result?.columns || []))
        dispatch(setLearnRelations(task.learn_result?.relations || []))
        dispatch(setTableCellTypes(task.learn_result?.tables?.reduce((acc, table) => {
            acc[table.table!] = getTableCellType(schema, table);
            return acc;
        }, {} as Record<string, TableCellType>)))
        dispatch(setColumnCellTypes(task.learn_result?.columns?.reduce((acc, column) => {
            acc[`${column.table}:${column.column}`] = getColumnCellType(schema, column);
            return acc;
        }, {} as Record<string, ColumnCellType>)))
        dispatch(setRelationCellTypes(task.learn_result?.relations?.reduce((acc, relation) => {
            acc[`${relation.table1}:${relation.column1}:${relation.table2}:${relation.column2}`] = getRelationCellType(schema, relation);
            return acc;
        }, {} as Record<string, RelationCellType>)))
        dispatch(setFinalLearnTables(task.learn_result?.tables || []))
        dispatch(setFinalLearnColumns(task.learn_result?.columns || []))
        dispatch(setFinalLearnRelations(task.learn_result?.relations || []))
        dispatch(setSelectedLearningItems([]))
    })

    const refreshTask = useMemoizedFn(async (taskId: number) => {
        dispatch(setTaskId(taskId))

        const res = await mainApi.mainTaskTaskIdGet(taskId)
        const task = res.data
        dispatch(setTask(task))
        applyTask(task)
    })

    const addTask = useMemoizedFn(async (question: string, questionSupplement: string, rules: number[]) => {
        if (!question.trim()) return
        
        const res = await mainApi.mainAskPost({
            project_id: projectId,
            question: question.trim(),
            question_supplement: questionSupplement.trim(),
            options: {
                autoMatchSqlLog: envData.autoMatchSqlLog,
                autoGenRelatedColumns: envData.autoGenRelatedColumns,
                autoMatchDDL: envData.autoMatchDDL,
                autoGenSql: envData.autoGenSql,
                autoLearnOnRight: envData.autoLearnOnRight,
                matchDocCount: envData.matchDocCount,
                matchSqlLogCount: envData.matchSqlLogCount,
                matchDdlTableCount: envData.matchDdlTableCount,
                matchDdlColumnCount: envData.matchDdlColumnCount,
            },
            rules
        })
        const taskId = res.data?.task_id
        if (!taskId) return
        
        refreshQuestions()
        refreshTask(taskId)
    })

    const reAddTask = useMemoizedFn(async (taskId: number) => {
        await mainApi.mainReAskPost({
            taskId
        })
        refreshQuestions()
        refreshTask(taskId)
    })

    const refreshSchema = useCallback(async () => {
        if (!projectId) return
        const res = await mainApi.mainSchemaGet(projectId)
        dispatch(setSchema(res.data))
        dispatch(setSelectedRules(res.data?.rules?.filter(rule => rule.def_selected).map(rule => rule.id) || []))
    }, [dispatch, projectId])

    return {
        newTask,
        addTask,
        reAddTask,
        deleteTask,
        refreshTask,
        applyTask,
        refreshQuestions,
        updateQuestion,
        updateSql,
        refreshSchema
    }
}

export default useTask
