import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Arrow } from "@/styles/dashboard/CardGlobal";
import { FiMinusSquare, FiPlusSquare } from "react-icons/fi";
import { Separator } from "@/components/ui/separator";

export interface ResizePopoverProps {
    children?: React.ReactNode;
    onDecrease?: () => void;
    onIncrease?: () => void;
    maxValue?: number;
    minValue?: number;
    currentValue?: number;
    rightEdge?: boolean;
    disabled?: boolean;
    setHighlight: (highlight: 'width' | 'height' | null) => void;
    highlight: 'width' | 'height';
}

export function ResizePopover({ children, onDecrease, onIncrease, disabled, currentValue, maxValue, minValue, rightEdge, setHighlight, highlight }: ResizePopoverProps) {
    return (
        <Popover onOpenChange={(isOpen) => setHighlight(isOpen ? highlight : null)}>
            <PopoverTrigger asChild>
                {children ? (
                    <Arrow disabled={disabled}>
                        {children}
                    </Arrow>
                ) : (
                    <Button variant="secondary">Resize</Button>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-fit h-fit flex gap-2 p-2">
                <Arrow disabled={disabled || (currentValue === maxValue) || rightEdge} onClick={onIncrease} $green={true}>
                    <FiPlusSquare />
                </Arrow>
                <Separator orientation="vertical" className="h-6" />
                <Arrow disabled={disabled || (currentValue === minValue)} onClick={onDecrease} $red={true}>
                    <FiMinusSquare />
                </Arrow>
            </PopoverContent>
        </Popover >
    )
}
