import { Button } from 'flowbite-react'
import { IoCheckmark, IoClose } from 'react-icons/io5'
import { useTranslation } from 'react-i18next'

interface OptimizedQuestionProps {
  optimizedQuestion: string
  onAccept: () => void
  onReject: () => void
}

export function OptimizedQuestion({ optimizedQuestion, onAccept, onReject }: OptimizedQuestionProps) {
  const { t } = useTranslation()
  
  return (
    <div className="w-full border-t bg-cyan-50 p-3">
      <div className="text-sm text-gray-800 mb-3 whitespace-pre-wrap">{optimizedQuestion}</div>
      <div className="flex justify-end gap-2">
        <Button
          size="xs"
          color="gray"
          onClick={onReject}
        >
          <IoClose className="mr-1 h-4 w-4" />
          {t('common.cancel')}
        </Button>
        <Button
          size="xs"
          onClick={onAccept}
        >
          <IoCheckmark className="mr-1 h-4 w-4" />
          {t('question.useOptimized')}
        </Button>
      </div>
    </div>
  )
} 