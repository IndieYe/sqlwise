import { ChangeEvent, useEffect, useRef, useCallback, useState } from 'react'
import { IoColorWandOutline } from 'react-icons/io5'
import { Button, Tooltip } from 'flowbite-react'
import { mainApi } from '@/App'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import useTask from '@/hooks/useTask'
import { setEditingQuestion, setEditingQuestionSupplement } from '@/store/slices/recordsSlice'
import { FaPlus, FaSpinner } from 'react-icons/fa6'
import { IoClose } from 'react-icons/io5'
import { OptimizedQuestion } from './OptimizedQuestion'
import { toast } from 'react-toastify'
import { MdRefresh } from 'react-icons/md'
import { RuleList } from './RuleList'
import QuestionSupplement from './QuestionSupplement'
import { useTranslation } from 'react-i18next'

export function QuestionInput() {
  const dispatch = useAppDispatch()
  const taskId = useAppSelector(state => state.task.taskId)
  const editingQuestionSupplement = useAppSelector(state => state.records.editingQuestionSupplement)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { refreshTask, updateQuestion, addTask, reAddTask } = useTask()
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [controller, setController] = useState<AbortController | null>(null)
  const [showCancelIcon, setShowCancelIcon] = useState(false)
  const [optimizedQuestion, setOptimizedQuestion] = useState<string | null>(null)
  const editingQuestion = useAppSelector(state => state.records.editingQuestion)
  const selectedRules = useAppSelector(state => state.records.selectedRules)
  const taskModified = useAppSelector(state => state.records.taskModified)
  const { t } = useTranslation()

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = '44px'
    }
  }, [])

  // When taskId changes, clear optimization results
  useEffect(() => {
    setOptimizedQuestion(null)
  }, [taskId])

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setEditingQuestion(e.target.value))
  }, [])

  const handleSupplementChange = useCallback((value: string) => {
    dispatch(setEditingQuestionSupplement(value))
  }, [])

  // When editingQuestion changes, adjust height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [editingQuestion])

  const handleSubmit = useCallback(async () => {
    if (!taskId) {
      addTask(editingQuestion.trim(), editingQuestionSupplement.trim(), selectedRules)
    } else {
      reAddTask(taskId)
    }
  }, [editingQuestion, addTask, taskId, reAddTask, selectedRules, editingQuestionSupplement])

  const handleOptimize = useCallback(async () => {
    if (!editingQuestion?.trim()) {
      toast.error(t('question.noContent'))
      return
    }

    // Clear optimization results before optimization
    setOptimizedQuestion(null)

    try {
      setIsOptimizing(true)
      const abortController = new AbortController()
      setController(abortController)

      const res = await mainApi.mainOptimizeQuestionPost({
        question: editingQuestion.trim()
      }, { signal: abortController.signal })

      setOptimizedQuestion(res.data.question ?? null)
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(t('question.optimizeCanceled'))
      } else {
        console.error(t('question.optimizeFailed'), error)
        toast.error(t('question.optimizeFailed'))
      }
    } finally {
      setIsOptimizing(false)
      setController(null)
    }
  }, [editingQuestion, t])

  const handleCancelOptimize = useCallback(() => {
    if (controller) {
      controller.abort()
      setIsOptimizing(false)
      setController(null)
    }
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
  }, [controller])

  const handleAcceptOptimized = useCallback(async () => {
    if (optimizedQuestion) {
      if (taskId) {
        await updateQuestion(taskId, optimizedQuestion)
        await refreshTask(taskId);
      } else {
        dispatch(setEditingQuestion(optimizedQuestion))
      }
      setOptimizedQuestion(null)
    }
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
  }, [optimizedQuestion, taskId, refreshTask, updateQuestion])

  const handleRejectOptimized = useCallback(() => {
    setOptimizedQuestion(null)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
  }, [])

  return (
    <div className="w-full">
      <div className="w-full border rounded-lg overflow-hidden">
        <div className="w-full flex justify-between items-center text-left bg-cyan-700 p-2 text-white">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{t('question.title')}</h2>
          </div>
        </div>
        <div className="relative">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={editingQuestion}
              onChange={handleChange}
              placeholder={t('question.placeholder')}
              rows={1}
              disabled={isOptimizing || !!optimizedQuestion}
              className="block w-full p-3 pb-10 text-sm text-gray-900 bg-white border-0 resize-none overflow-hidden focus:ring-0"
            />
            <div className="absolute top-2 right-2">
              <Tooltip content={isOptimizing ? t('question.cancel') : t('question.optimize')}>
                <button
                  onClick={isOptimizing ? handleCancelOptimize : handleOptimize}
                  className="text-gray-500 hover:text-cyan-700 transition-colors"
                  onMouseEnter={() => {
                    if (isOptimizing) {
                      setShowCancelIcon(true)
                    }
                  }}
                  onMouseLeave={() => {
                    if (isOptimizing) {
                      setShowCancelIcon(false)
                    }
                  }}
                >
                  {isOptimizing ? (
                    showCancelIcon ? (
                      <IoClose className="h-5 w-5 text-red-500" />
                    ) : (
                      <FaSpinner className="h-5 w-5 animate-spin text-cyan-700" />
                    )
                  ) : (
                    <IoColorWandOutline className="h-5 w-5" />
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
          <div>
            {optimizedQuestion && (
              <OptimizedQuestion
                optimizedQuestion={optimizedQuestion}
                onAccept={handleAcceptOptimized}
                onReject={handleRejectOptimized}
              />
            )}
          </div>
          <div className="p-3 border-t">
            <QuestionSupplement
              value={editingQuestionSupplement}
              onChange={handleSupplementChange}
              disabled={isOptimizing || !!optimizedQuestion}
            />
          </div>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-50 border-t">
          <div className="flex flex-col items-start">
            <RuleList />
          </div>
          <Button onClick={handleSubmit} disabled={taskModified}>
            <div className="flex items-center gap-2">
              {taskId ? <MdRefresh className="h-4 w-4" /> : <FaPlus className="h-4 w-4" />}
              <span>{taskId ? t('question.reAsk') : t('question.add')}</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  )
}