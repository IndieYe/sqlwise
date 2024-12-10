import { useEffect, useState, useRef, MouseEvent } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Job } from '@/api-docs';
import { twMerge } from 'tailwind-merge';
import { HiCheck, HiClock, HiExclamation, HiDatabase, HiX } from 'react-icons/hi';
import { Modal, Tooltip } from 'flowbite-react';
import { toast } from 'react-toastify';
import { MdContentCopy } from 'react-icons/md';
import { mainApi } from '@/App';
import useTask from '@/hooks/useTask';
import { useTranslation } from 'react-i18next';

// Add JobDataModal component
interface JobDataModalProps {
    show: boolean;
    onClose: () => void;
    jobData: any;
}

function JobDataModal({ show, onClose, jobData }: JobDataModalProps) {
    const { t } = useTranslation();
    const prompt = jobData?.prompt

    const handleCopyPrompt = async () => {
        if (prompt) {
            try {
                await navigator.clipboard.writeText(prompt);
                toast.success(t('jobList.promptCopied'));
            } catch (err) {
                toast.error(t('jobList.copyFailed'));
            }
        }
    };

    return (
        <Modal show={show} onClose={onClose} dismissible>
            <Modal.Header>{t('jobList.taskData')}</Modal.Header>
            <Modal.Body>
                {prompt && <div>
                    <div className="flex justify-between items-center">
                        <div className="text-lg font-bold">{t('jobList.prompt')}</div>
                        <button
                            className="text-gray-500 hover:text-gray-700"
                            onClick={handleCopyPrompt}>
                            <MdContentCopy className="w-4 h-4" />
                        </button>
                    </div>
                    <pre className="whitespace-pre-wrap overflow-auto max-h-[60vh] text-sm">
                        {prompt}
                    </pre>
                </div>}
            </Modal.Body>
        </Modal>
    );
}

// Modify JobItem component
interface JobItemProps {
    job: Job;
    isHovered: boolean;
}

function JobItem({ job, isHovered }: JobItemProps) {
    const { t } = useTranslation();
    const [showDataModal, setShowDataModal] = useState(false);
    const job_cost_time = job.job_cost_time;
    const taskId = useAppSelector(state => state.task.taskId);
    const {refreshTask} = useTask()

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <HiCheck className="text-green-500" />;
            case 'running':
                return <HiClock className="text-blue-500 animate-spin" />;
            case 'fail':
                return <HiExclamation className="text-red-500" />;
            case 'canceled':
                return <HiX className="text-gray-500" />;
            default: // Initial
                return <HiClock className="text-gray-500" />;
        }
    };

    const cancelJob = async () => {
        if (job.id && taskId) {
            try {
                await mainApi.mainJobsJobIdCancelPost(job.id);
                refreshTask(taskId);
                toast.success(t('jobList.taskCanceled'));
            } catch (err) {
                toast.error(t('jobList.cancelFailed'));
            }
        }
    }

    const handleCopyError = async () => {
        if (job.error_message) {
            try {
                await navigator.clipboard.writeText(job.error_message);
                toast.success(t('jobList.errorCopied'));
            } catch (err) {
                toast.error(t('jobList.copyFailed'));
            }
        }
    };

    const showCancelButton = job.job_status && 
        !['success', 'fail', 'canceled'].includes(job.job_status);

    return (
        <div className="flex flex-col text-sm text-gray-600 hover:bg-gray-50 p-1 rounded">
            <div className="flex items-center space-x-2">
                <div className="relative">
                    {getStatusIcon(job.job_status || '')}
                </div>
                <span>{job.job_type_display_name}</span>
                {job.job_data && (
                    <Tooltip content={t('jobList.viewTaskData')}>
                        <HiDatabase
                            className="text-gray-500 hover:text-gray-700 cursor-pointer"
                            onClick={() => setShowDataModal(true)}
                        />
                    </Tooltip>
                )}
                {job_cost_time ? (
                    <span className="text-xs text-gray-400">
                        {(job_cost_time / 1000).toFixed(1)}s
                    </span>
                ) : null}
                {showCancelButton && (
                    <Tooltip content={t('jobList.cancelTask')}>
                        <button
                            onClick={cancelJob}
                            className="text-gray-500 hover:text-red-500 flex items-center justify-center"
                        >
                            <HiX className="w-4 h-4" />
                        </button>
                    </Tooltip>
                )}
            </div>
            {isHovered && job.error_message && (
                <div className="ml-6 mt-1 flex items-center gap-2">
                    <Tooltip content={t('jobList.clickToCopyError')}>
                        <div
                            onClick={handleCopyError}
                            className="text-red-500 text-xs max-w-[30vw] cursor-pointer hover:text-red-600 truncate"
                            title={job.error_message}
                        >
                            {job.error_message}
                        </div>
                    </Tooltip>
                </div>
            )}
            <JobDataModal
                show={showDataModal}
                onClose={() => setShowDataModal(false)}
                jobData={job.job_data}
            />
        </div>
    );
}

// JobList 组件保持不变
export function JobList() {
    const { t } = useTranslation();
    const jobs = useAppSelector(state => state.task.jobs);
    const [isHovered, setIsHovered] = useState(false);
    const [lastJob, setLastJob] = useState<Job>();
    
    // Add new state and refs for dragging
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ y: window.innerHeight - 200 });
    const dragRef = useRef<{
        startY: number;
        startPosY: number;
    } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (jobs && jobs.length > 0) {
            setLastJob(jobs[jobs.length - 1]);
        }
    }, [jobs]);

    // Add drag handlers
    const handleMouseDown = (e: MouseEvent) => {
        // Only allow dragging from the header
        if (!(e.target as HTMLElement).closest('.drag-handle')) return;
        
        setIsDragging(true);
        dragRef.current = {
            startY: e.clientY,
            startPosY: position.y
        };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !dragRef.current || !containerRef.current) return;

        const deltaY = e.clientY - dragRef.current.startY;
        const newY = dragRef.current.startPosY + deltaY;

        // Calculate boundaries
        const containerHeight = containerRef.current.offsetHeight;
        const windowHeight = window.innerHeight;
        
        // Prevent dragging outside screen bounds
        const maxY = windowHeight - 100; // Keep at least 100px from bottom
        const minY = containerHeight + 50; // Keep at least 50px from top
        
        const clampedY = Math.min(maxY, Math.max(minY, newY));
        
        setPosition({ y: clampedY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        dragRef.current = null;
    };

    useEffect(() => {
        // Set initial position if not set
        if (position.y === 0 && containerRef.current) {
            setPosition({ y: window.innerHeight - 200 }); // Initial position from bottom
        }
    }, []);

    if (!jobs || jobs.length === 0) return null;

    return (
        <div
            ref={containerRef}
            className={twMerge(
                "fixed z-10 right-6 bg-white rounded-lg shadow-lg overflow-hidden",
                !isHovered && "opacity-75",
                isDragging && "cursor-grabbing"
            )}
            style={{
                top: `${position.y}px`,
                transform: 'translateY(-100%)', // Position from top edge
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setIsDragging(false);
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {(isHovered || isDragging) && (
                <div className="px-3 py-2 border-b border-gray-200 drag-handle cursor-grab select-none">
                    <h3 className="text-sm font-medium">{t('jobList.taskRecords')}</h3>
                </div>
            )}
            <div className={twMerge(
                "transition-all duration-300 ease-in-out",
                isHovered ? "max-h-60" : "max-h-10",
                "overflow-y-auto"
            )}>
                <div className="p-2 space-y-2">
                    {isHovered && jobs.slice(0, -1).map((job) => (
                        <JobItem key={job.id} job={job} isHovered={isHovered} />
                    ))}
                    {lastJob && <JobItem job={lastJob} isHovered={isHovered} />}
                </div>
            </div>
        </div>
    );
} 