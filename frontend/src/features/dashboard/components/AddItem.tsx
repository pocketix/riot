import { Button } from "./ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog"
import { FaPlus } from "react-icons/fa6";
import { AddItemForm } from "./AddItemForm";
import { useState } from "react";

export function AddItemModal() {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <Dialog open={dialogOpen} onOpenChange={() => setDialogOpen(!dialogOpen)}>
            <DialogTrigger asChild className="fixed bottom-4 right-4">
                <Button>
                    <FaPlus />
                </Button>
            </DialogTrigger>
            <DialogContent className="w-full sm:w-fit max-h-[80vh] p-1 sm:p-6 overflow-y-auto overflow-x-hidden">
                <DialogHeader>
                    <DialogTitle>Add new item to dashboard</DialogTitle>
                    <DialogDescription>
                        Select a device you wish to add to the dashboard.
                    </DialogDescription>
                </DialogHeader>
                <AddItemForm setDialogOpen={setDialogOpen} />
            </DialogContent>
        </Dialog >
    )
}