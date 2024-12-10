import React, { useCallback, useMemo, useState } from 'react'
import { HiChevronDown } from 'react-icons/hi'
import DDLRefs from '@/components/records/refs/DDLRefs'
import { useAppSelector } from '@/store/hooks'
import SqlRefs from '@/components/records/refs/SqlRefs'
import DocRefs from './refs/DocRefs'
import RelatedColumnsRefs from './refs/RelatedColumnsRefs'
import { MdRefresh } from 'react-icons/md'
import { Tooltip } from 'flowbite-react'
import { mainApi } from '@/App'
import { toast } from 'react-toastify'
import { useMemoizedFn } from 'ahooks'
import useTask from '@/hooks/useTask'
import { useTranslation } from 'react-i18next'

export const Refs: React.FC = () => {
  const { t } = useTranslation()

  const refs = useMemo(() => [
    {
      code: 'doc',
      title: t('refs.docTitle'),
      description: t('refs.docDescription'),
      defaultExpanded: false
    },
    {
      code: 'sql',
      title: t('refs.sqlTitle'),
      description: t('refs.sqlDescription'),
      defaultExpanded: false
    },
    {
      code: 'related_columns',
      title: t('refs.relatedColumnsTitle'),
      description: t('refs.relatedColumnsDescription'),
      defaultExpanded: false
    },
    {
      code: 'ddl',
      title: t('refs.ddlTitle'),
      description: t('refs.ddlDescription'),
      defaultExpanded: true
    },
  ], [t])

  const { refreshTask } = useTask()
  // Control the expanded/collapsed state of each reference
  const [expandedRefs, setExpandedRefs] = useState<boolean[]>(
    refs.map(ref => ref.defaultExpanded)
  )
  // Document count
  const editingDocs = useAppSelector(state => state.records.editingDocs)
  // SQL count
  const sqlCount = useAppSelector(state => state.records.editingSqls.length)
  // Selected table and column count
  const tableCount = useAppSelector(state => state.records.selectedColumns.length)
  const columnCount = useAppSelector(state => state.records.selectedColumns.reduce((acc, curr) => acc + curr.columns.length, 0))
  // Related column count
  const task = useAppSelector(state => state.task.task)
  const relatedColumnsCount = task?.related_columns ? JSON.parse(task.related_columns).columns.length : 0

  // Toggle the expanded/collapsed state of the specified index reference
  const toggleRef = useCallback((index: number) => {
    setExpandedRefs(prev => {
      const newState = [...prev]
      newState[index] = !newState[index]
      return newState
    })
  }, [])

  const refreshJob = useMemoizedFn(async (code: string) => {
    const job_type = code === 'doc' ? 'match_doc' : code === 'sql' ? 'match_sql_log' : code === 'ddl' ? 'match_ddl' : code === 'related_columns' ? 'gen_related_columns' : ''
    if (!job_type) return
    if (!task?.id) return

    await mainApi.mainJobsPost({
      task_id: task.id,
      job_type
    })

    refreshTask(task.id)
    toast.success(t('common.refreshSuccess'))
  })

  return (
    <div className={`transition-all duration-300 ease-in-out opacity-100 rounded-b-lg`}>
      <div className="space-y-4">
        {refs.map((ref, index) => (
          <div
            key={index}
            className="bg-gray-50 shadow-md"
          >
            <div
              onClick={() => toggleRef(index)}
              className="w-full flex justify-between items-center text-left p-4 cursor-pointer"
            >
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold text-blue-700 flex items-center gap-4">
                  {ref.title}

                  {/* Refresh button */}
                  <Tooltip content={t('common.refresh')}>
                    <button className="text-sm font-normal text-gray-500 flex items-center justify-center hover:text-cyan-600 transition-colors duration-300"
                      onClick={(e) => {
                        e.stopPropagation()
                        refreshJob(ref.code)
                      }}>
                      <MdRefresh className="w-4 h-4 hover:rotate-180 transition-transform duration-300" />
                    </button>
                  </Tooltip>

                  {ref.code === 'doc' && <span className="text-sm font-normal text-gray-500">
                    {t('ruleList.matchDoc', { count: editingDocs.length })}
                  </span>}
                  {ref.code === 'sql' && <span className="text-sm font-normal text-gray-500">
                    {t('ruleList.matchSqlLog', { count: sqlCount })}
                  </span>}
                  {ref.code === 'ddl' && <span className="text-sm font-normal text-gray-500">
                    {t('ruleList.matchDDL', { tableCount, columnCount })}
                  </span>}
                  {ref.code === 'related_columns' && <span className="text-sm font-normal text-gray-500">
                    {t('refs.generateColumns', { count: relatedColumnsCount })}
                  </span>}
                </h3>
                <span className="text-gray-500 text-xs">
                  {ref.description}
                </span>
              </div>
              <HiChevronDown
                className={`w-5 h-5 transform transition-transform duration-300 ${expandedRefs[index] ? 'rotate-180' : ''
                  }`}
              />
            </div>
            <div className={`transition-all duration-300 ease-in-out ${expandedRefs[index] ? 'opacity-100' : 'opacity-0 max-h-0'
              } overflow-hidden`}>
              <div className="px-4 pb-2">
                {ref.code === 'doc' && <DocRefs />}
                {ref.code === 'sql' && <SqlRefs />}
                {ref.code === 'related_columns' && <RelatedColumnsRefs />}
                {ref.code === 'ddl' && <DDLRefs />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 