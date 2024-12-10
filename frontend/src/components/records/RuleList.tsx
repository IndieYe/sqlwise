import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setSelectedRules, mergeTaskOptions } from '@/store/slices/recordsSlice'
import { mergeEnvData } from '@/store/slices/appSlice'
import { FaBrain, FaCheck, FaPaperPlane, FaArrowRight } from 'react-icons/fa'
import { HiOutlineBookOpen, HiDocumentText } from 'react-icons/hi'
import { useState, useRef, useEffect, useMemo } from 'react'
import {  
  FaHistory, 
  FaColumns, 
  FaDatabase,
  FaChevronDown
} from 'react-icons/fa'
import { useTranslation } from 'react-i18next';

function StepIndicator() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch()
  const envData = useAppSelector(state => state.app.envData)
  const taskId = useAppSelector(state => state.task.taskId)
  const taskOptions = useAppSelector(state => state.records.taskOptions)
  const [showDocDropdown, setShowDocDropdown] = useState(false)
  const [showSqlLogDropdown, setShowSqlLogDropdown] = useState(false)
  const [showDdlDropdown, setShowDdlDropdown] = useState(false)
  const docDropdownRef = useRef<HTMLDivElement>(null)
  const sqlLogDropdownRef = useRef<HTMLDivElement>(null)
  const ddlDropdownRef = useRef<HTMLDivElement>(null)

  const options = taskId ? taskOptions : envData
  const docCount = options?.[taskId ? 'matchDocCount' : 'matchDocCount'] ?? 5
  const sqlLogCount = options?.[taskId ? 'matchSqlLogCount' : 'matchSqlLogCount'] ?? 5
  const ddlTableCount = options?.[taskId ? 'matchDdlTableCount' : 'matchDdlTableCount'] ?? 5
  const ddlColumnCount = options?.[taskId ? 'matchDdlColumnCount' : 'matchDdlColumnCount'] ?? 5

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (docDropdownRef.current && !docDropdownRef.current.contains(event.target as Node)) {
        setShowDocDropdown(false)
      }
      if (sqlLogDropdownRef.current && !sqlLogDropdownRef.current.contains(event.target as Node)) {
        setShowSqlLogDropdown(false)
      }
      if (ddlDropdownRef.current && !ddlDropdownRef.current.contains(event.target as Node)) {
        setShowDdlDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLineClick = (field: string) => {
    if (taskId) {
      dispatch(mergeTaskOptions({ [field]: !taskOptions?.[field as keyof typeof taskOptions] }))
    } else {
      dispatch(mergeEnvData({ [field]: !envData[field as keyof typeof envData] }))
    }
  }

  const handleDocCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (taskId) {
      dispatch(mergeTaskOptions({ matchDocCount: value }))
    } else {
      dispatch(mergeEnvData({ matchDocCount: value }))
    }
  }

  const handleSqlLogCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (taskId) {
      dispatch(mergeTaskOptions({ matchSqlLogCount: value }))
    } else {
      dispatch(mergeEnvData({ matchSqlLogCount: value }))
    }
  }

  const handleDdlTableCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (taskId) {
      dispatch(mergeTaskOptions({ matchDdlTableCount: value }))
    } else {
      dispatch(mergeEnvData({ matchDdlTableCount: value }))
    }
  }

  const handleDdlColumnCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (taskId) {
      dispatch(mergeTaskOptions({ matchDdlColumnCount: value }))
    } else {
      dispatch(mergeEnvData({ matchDdlColumnCount: value }))
    }
  }

  const STEPS = useMemo(() => [
    { 
      id: 'matchDoc',
      icon: HiDocumentText, 
      label: (count: number) => t('ruleList.matchDoc', { count }),
      nextField: 'autoMatchSqlLog',
      arrowTooltip: t('ruleList.autoMatchSqlLogTip')
    },
    { 
      id: 'matchSqlLog',
      icon: FaHistory, 
      label: (count: number) => t('ruleList.matchSqlLog', { count }),
      nextField: 'autoGenRelatedColumns',
      arrowTooltip: t('ruleList.autoGenRelatedColumnsTip')
    },
    { 
      id: 'genRelatedColumns',
      icon: FaColumns, 
      label: t('ruleList.genRelatedColumns'),
      nextField: 'autoMatchDDL',
      arrowTooltip: t('ruleList.autoMatchDDLTip')
    },
    { 
      id: 'matchDDL',
      icon: FaDatabase, 
      label: (tableCount: number, columnCount: number) => t('ruleList.matchDDL', { tableCount, columnCount }),
      nextField: 'autoGenSql',
      arrowTooltip: t('ruleList.autoGenSqlTip')
    },
    { 
      id: 'genSql',
      icon: FaPaperPlane, 
      label: t('ruleList.genSql'),
      nextField: 'autoLearnOnRight',
      arrowTooltip: t('ruleList.autoLearnOnRightTip')
    },
    { 
      id: 'learnOnRight',
      icon: FaBrain, 
      label: t('ruleList.learnOnRight'),
      nextField: null
    }
  ], [t]);

  return (
    <div className="flex items-center justify-between mb-3 px-1">
      {STEPS.map((step, index) => (
        <div key={index} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <step.icon className="w-4 h-4" />
            </div>
            <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">
              {typeof step.label === 'function' ? (
                step.id === 'matchDoc' ? (
                  <div className="relative" ref={docDropdownRef}>
                    <button
                      onClick={() => setShowDocDropdown(!showDocDropdown)}
                      className="flex items-center gap-1 hover:text-blue-500"
                    >
                      {step.label(docCount, 0)}
                      <FaChevronDown className={`w-2.5 h-2.5 transition-transform ${showDocDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showDocDropdown && (
                      <div 
                        className="fixed bg-white rounded-lg shadow-lg border border-gray-200 p-3"
                        style={{
                          top: docDropdownRef.current ? 
                            docDropdownRef.current.getBoundingClientRect().bottom + 5 : 0,
                          left: docDropdownRef.current ? 
                            docDropdownRef.current.getBoundingClientRect().left : 0,
                          zIndex: 1000
                        }}
                      >
                        <input
                          type="range"
                          min="3"
                          max="10"
                          value={docCount}
                          onChange={handleDocCountChange}
                          className="w-32"
                        />
                        <div className="text-center mt-1 text-gray-600">{docCount}</div>
                      </div>
                    )}
                  </div>
                ) : step.id === 'matchSqlLog' ? (
                  <div className="relative" ref={sqlLogDropdownRef}>
                    <button
                      onClick={() => setShowSqlLogDropdown(!showSqlLogDropdown)}
                      className="flex items-center gap-1 hover:text-blue-500"
                    >
                      {step.label(sqlLogCount, 0)}
                      <FaChevronDown className={`w-2.5 h-2.5 transition-transform ${showSqlLogDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showSqlLogDropdown && (
                      <div 
                        className="fixed bg-white rounded-lg shadow-lg border border-gray-200 p-3"
                        style={{
                          top: sqlLogDropdownRef.current ? 
                            sqlLogDropdownRef.current.getBoundingClientRect().bottom + 5 : 0,
                          left: sqlLogDropdownRef.current ? 
                            sqlLogDropdownRef.current.getBoundingClientRect().left : 0,
                          zIndex: 1000
                        }}
                      >
                        <input
                          type="range"
                          min="3"
                          max="10"
                          value={sqlLogCount}
                          onChange={handleSqlLogCountChange}
                          className="w-32"
                        />
                        <div className="text-center mt-1 text-gray-600">{sqlLogCount}</div>
                      </div>
                    )}
                  </div>
                ) : step.id === 'matchDDL' ? (
                  <div className="relative" ref={ddlDropdownRef}>
                    <button
                      onClick={() => setShowDdlDropdown(!showDdlDropdown)}
                      className="flex items-center gap-1 hover:text-blue-500"
                    >
                      {step.label(ddlTableCount, ddlColumnCount)}
                      <FaChevronDown className={`w-2.5 h-2.5 transition-transform ${showDdlDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showDdlDropdown && (
                      <div 
                        className="fixed bg-white rounded-lg shadow-lg border border-gray-200 p-3"
                        style={{
                          top: ddlDropdownRef.current ? 
                            ddlDropdownRef.current.getBoundingClientRect().bottom + 5 : 0,
                          left: ddlDropdownRef.current ? 
                            ddlDropdownRef.current.getBoundingClientRect().left : 0,
                          zIndex: 1000
                        }}
                      >
                        <div className="text-xs text-gray-500 mb-2">
                          {t('ruleList.matchDdlTip', { tableCount: ddlTableCount, columnCount: ddlColumnCount })}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-gray-600 mb-1">{t('ruleList.matchTableCount')}</div>
                            <input
                              type="range"
                              min="3"
                              max="10"
                              value={ddlTableCount}
                              onChange={handleDdlTableCountChange}
                              className="w-32"
                            />
                            <div className="text-center mt-1 text-gray-600">{ddlTableCount}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">{t('ruleList.matchColumnCount')}</div>
                            <input
                              type="range"
                              min="3"
                              max="10"
                              value={ddlColumnCount}
                              onChange={handleDdlColumnCountChange}
                              className="w-32"
                            />
                            <div className="text-center mt-1 text-gray-600">{ddlColumnCount}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  step.label(0, 0)
                )
              ) : (
                step.label
              )}
            </span>
          </div>
          {index < STEPS.length - 1 && step.nextField && (
            <div className="flex-1 flex items-center justify-center">
              <div 
                className="flex items-center w-full relative group cursor-pointer"
                onClick={() => handleLineClick(step.nextField!)}
              >
                <div className={`flex-1 h-[1px] transition-colors duration-200 ${
                  options?.[step.nextField as keyof typeof options] 
                    ? 'bg-blue-500' 
                    : 'bg-gray-300'
                }`} />
                <div className="relative">
                  <FaArrowRight className={`select-none mx-1 transition-colors duration-200 ${
                    options?.[step.nextField as keyof typeof options]
                      ? 'text-blue-500'
                      : 'text-gray-300'
                  }`} />
                  {step.arrowTooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                        {step.arrowTooltip}
                      </div>
                      <div className="w-2 h-2 bg-gray-800 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function RuleList() {
  const dispatch = useAppDispatch()
  const schema = useAppSelector(state => state.schema.schema)
  const selectedRules = useAppSelector(state => state.records.selectedRules)

  const handleRuleToggle = (ruleId: number) => {
    const newSelectedRules = selectedRules.includes(ruleId)
      ? selectedRules.filter(id => id !== ruleId)
      : [...selectedRules, ruleId]
    dispatch(setSelectedRules(newSelectedRules))
  }

  return (
    <div>
      <StepIndicator />
      <div className="flex flex-wrap gap-1 mb-2">
        {schema?.rules?.map((rule) => (
          <div
            key={rule.id}
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs cursor-pointer select-none ${
              selectedRules.includes(rule.id!)
                ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                : 'bg-blue-100 text-blue-800 border-2 border-transparent'
            }`}
            onClick={() => handleRuleToggle(rule.id!)}
          >
            {selectedRules.includes(rule.id!) ? (
              <FaCheck className="w-3 h-3 mr-1" />
            ) : (
              <HiOutlineBookOpen className="w-3 h-3 mr-1 opacity-30" />
            )}
            {rule.name}
          </div>
        ))}
      </div>
    </div>
  )
} 