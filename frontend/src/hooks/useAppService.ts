import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import useTask from './useTask'
import { useInterval } from 'ahooks'
import { setActiveTab, setSqlModified, setTaskModified, setQuestionModified, setQuestionSupplementModified, setOptionsModified, setRulesModified, setDocsModified, setSqlsModified, setDdlModified } from '../store/slices/recordsSlice'
import { useParams } from 'react-router-dom'
import { setProjectId } from '@/store/slices/appSlice'
import { getSelectedColumns } from '@/utils/bizUtil'

const useAppService = () => {
    const dispatch = useAppDispatch()
    const currentJob = useAppSelector(state => state.task.currentJob)
    const taskId = useAppSelector(state => state.task.taskId)
    const task = useAppSelector(state => state.task.task)
    const editingSql = useAppSelector(state => state.records.editingSql)
    const editingQuestion = useAppSelector(state => state.records.editingQuestion)
    const editingQuestionSupplement = useAppSelector(state => state.records.editingQuestionSupplement)
    const taskOptions = useAppSelector(state => state.records.taskOptions)
    const selectedRules = useAppSelector(state => state.records.selectedRules)
    const editingDocs = useAppSelector(state => state.records.editingDocs)
    const editingSqls = useAppSelector(state => state.records.editingSqls)
    const selectedColumns = useAppSelector(state => state.records.selectedColumns)
    const schema = useAppSelector(state => state.schema.schema)
    const {refreshTask, refreshSchema} = useTask()

    // Get project ID
    const { projectId } = useParams()
    useEffect(() => {
        if (projectId) {
            dispatch(setProjectId(parseInt(projectId)))
        }
    }, [projectId])

    // If taskId does not exist, set activeTab to 0
    useEffect(() => {
        if (!taskId) {
            dispatch(setActiveTab(0))
        }
    }, [taskId])

    // Detect various modification statuses
    useEffect(() => {
        if (taskId && task) {
            // Detect if the question has been modified
            const taskQuestion_ = task.question || ''
            const questionModified = editingQuestion !== taskQuestion_
            dispatch(setQuestionModified(questionModified))
            
            // Detect if the question supplement has been modified
            const taskQuestionSupplement_ = task.question_supplement || ''
            const questionSupplementModified = editingQuestionSupplement !== taskQuestionSupplement_
            dispatch(setQuestionSupplementModified(questionSupplementModified))
            
            // Detect if the task options have been modified
            const taskOptions_ = task?.options || {}
            const optionsModified = JSON.stringify(taskOptions) !== JSON.stringify(taskOptions_)
            dispatch(setOptionsModified(optionsModified))
            
            // Detect if the rules have been modified
            const taskRules_ = task?.rules || []
            const rulesModified = JSON.stringify(selectedRules) !== JSON.stringify(taskRules_)
            dispatch(setRulesModified(rulesModified))
            
            // Detect if the SQL has been modified
            const taskSql_ = task.sql || ''
            const sqlModified = editingSql !== taskSql_
            dispatch(setSqlModified(sqlModified))

            // Detect if the documents have been modified
            const taskDocs_ = task?.docs || []
            const docsModified = JSON.stringify(editingDocs) !== JSON.stringify(taskDocs_)
            dispatch(setDocsModified(docsModified))

            // Detect if the SQLs have been modified
            const taskSqls_ = task?.sqls || []
            const sqlsModified = JSON.stringify(editingSqls) !== JSON.stringify(taskSqls_)
            dispatch(setSqlsModified(sqlsModified))

            // Detect if the DDL has been modified
            const taskSelectedColumns_ = getSelectedColumns(task?.columns, schema!)
            const ddlModified = JSON.stringify(selectedColumns) !== JSON.stringify(taskSelectedColumns_)
            dispatch(setDdlModified(ddlModified))
            
            // Detect if the overall task has been modified
            const taskModified = questionModified || 
                             questionSupplementModified || 
                             optionsModified || 
                             rulesModified || 
                             sqlModified ||
                             docsModified ||
                             sqlsModified ||
                             ddlModified
            dispatch(setTaskModified(taskModified))
        }
    }, [
        taskId,
        task,
        editingQuestion,
        editingQuestionSupplement,
        editingSql,
        taskOptions,
        selectedRules,
        editingDocs,
        editingSqls,
        selectedColumns,
        schema,
        dispatch
    ])

    // Initial get schema
    useEffect(() => {
        refreshSchema()
    }, [refreshSchema])

    // Every 1 second, detect: if the job is currently init or running, refresh
    useInterval(() => {
        if (taskId && (currentJob?.job_status === 'init' || currentJob?.job_status === 'running')) {
            refreshTask(taskId)
        }
    }, 1000)
}

export default useAppService