import { Modal } from "flowbite-react";
import { useAppSelector } from "@/store/hooks";
import { useAppDispatch } from "@/store/hooks";
import { setShowAICommentModal, setAICommentTable } from "@/store/slices/recordsSlice";
import TableCommentEditor from "@/components/ddl/TableCommentEditor";
import { useTranslation } from "react-i18next";

const AICommentModal = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const showAICommentModal = useAppSelector(state => state.records.showAICommentModal);
    const aiCommentTable = useAppSelector(state => state.records.aiCommentTable);
    
    const handleClose = () => {
        dispatch(setShowAICommentModal(false));
        dispatch(setAICommentTable(undefined));
    };

    const handleConfirm = () => {
        handleClose();
    };

    return (
        <Modal
            show={showAICommentModal}
            onClose={handleClose}
            dismissible
            size="4xl"
            position="top-center"
        >
            <Modal.Header>
                <span>{t('aiCommentModal.title')}</span>
            </Modal.Header>
            <Modal.Body>
                {aiCommentTable && (
                    <TableCommentEditor 
                        tableName={aiCommentTable}
                        onConfirm={handleConfirm}
                        onCancel={handleClose}
                    />
                )}
            </Modal.Body>
        </Modal>
    );
};

export default AICommentModal; 