import { Button, ToggleSwitch, Tooltip } from 'flowbite-react';
import { FaThumbsUp, FaThumbsDown, FaCheck } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface SqlFeedbackProps {
  onFeedback: (isPositive: boolean, canRefer?: boolean) => void;
  sqlRight?: boolean;
  sqlRefer?: boolean;
}

export function SqlFeedback({ onFeedback, sqlRight, sqlRefer }: SqlFeedbackProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full flex flex-col items-center gap-3 my-3">
      <div className="flex items-center justify-center gap-4">
        <Button
          size="sm"
          color={sqlRight === true ? "success" : "gray"}
          onClick={() => onFeedback(true, true)}
        >
          <div className="flex items-center">
            <FaThumbsUp className="w-4 h-4 mr-2" />
            <span>{t('sqlFeedback.correct')}</span>
            {sqlRight === true && <FaCheck className="w-3 h-3 ml-1" />}
          </div>
        </Button>
        <Button
          size="sm"
          color={sqlRight === false ? "failure" : "gray"}
          onClick={() => onFeedback(false)}
        >
          <div className="flex items-center">
            <FaThumbsDown className="w-4 h-4 mr-2" />
            <span>{t('sqlFeedback.incorrect')}</span>
            {sqlRight === false && <FaCheck className="w-3 h-3 ml-1" />}
          </div>
        </Button>
      </div>

      {sqlRight === true && (
        <div className="flex items-center gap-2">
          <Tooltip content={t('sqlFeedback.referenceTooltip')}>
            <div className="flex items-center gap-2">
              <ToggleSwitch
                checked={sqlRefer ?? false}
                onChange={(checked) => onFeedback(true, checked)}
              />
              <span className="text-sm text-gray-500">
                {t('sqlFeedback.addToReference')}
              </span>
            </div>
          </Tooltip>
        </div>
      )}
    </div>
  );
} 