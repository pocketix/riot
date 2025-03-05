import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DeleteIconContainer } from "@/styles/dashboard/CardGlobal";
import { FaTrash } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

export interface ItemDeleteAlertDialogProps {
    onSuccess: () => void
}

export function ItemDeleteAlertDialog({ onSuccess }: ItemDeleteAlertDialogProps) {
    const [open, setOpen] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = (event: MouseEvent) => {
        if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
            setOpen(false);
        }
    };

    useEffect(() => {
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);

    return (
        <AlertDialog open={open} onOpenChange={() => setOpen(!open)}>
            <AlertDialogTrigger asChild>
                <DeleteIconContainer>
                    <FaTrash />
                </DeleteIconContainer>
            </AlertDialogTrigger>
            <AlertDialogContent ref={dialogRef}>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setOpen(false)}>Cancel</AlertDialogCancel>
                    <Button variant="destructive" onClick={onSuccess}>Continue</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}