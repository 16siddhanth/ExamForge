import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentName: string;
  questionsCount: number;
}

export const ConfirmDeleteDialog = ({
  isOpen,
  onClose,
  onConfirm,
  documentName,
  questionsCount,
}: ConfirmDeleteDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-left">Delete Document</AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-left">
            Are you sure you want to delete <strong>"{documentName}"</strong>?
            <br />
            <br />
            This action will permanently:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Remove the document file from storage</li>
              <li>Delete all {questionsCount} generated questions from this document</li>
              <li>Remove all associated quiz data</li>
            </ul>
            <br />
            <strong className="text-red-600">This action cannot be undone.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Delete Document
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
