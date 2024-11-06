//팝업 창 생성 컴포넌트
import { ArrowLeft, Pin, SquarePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import FocusControlBar from "./FocusControlBar";
interface CreateBoardDialogProps {
  contentTitle: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  open?: boolean; // open prop 추가
  onOpenChange?: (open: boolean) => void; // onOpenChange prop 추가
}

export default function CreateBoardDialog({
  contentTitle,
  handleInputChange,
  handleSaveClick,
  className,
  open,
  onOpenChange,
}: CreateBoardDialogProps) {
  // Ctrl+Enter 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSaveClick();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`w-full gap-5 rounded-md bg-popover p-6 ${className} bg-white`}
      >
        <DialogHeader>
          <DialogTitle className="w-full pb-2 display-undefine-display-01">
            보드 주제를 입력하세요
          </DialogTitle>
        </DialogHeader>
        <div className="grid w-full items-center gap-1.5">
          <Input
            id="title"
            value={contentTitle}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full border-none"
            placeholder="Enter your focus"
            autoFocus
          />
        </div>
        <DialogFooter className="flex w-full items-end justify-end gap-2">
          <div className="w-full p-5">
            {/* VersionBar 컴포넌트 사용 */}
            <FocusControlBar
              version="v.3.26"
              createdDate="24.08.17"
              createdTime="08:28"
              showSettings={true} // 설정 버튼 보이기
              showPause={true} // 일시정지 버튼 숨기기
              showPlay={true} // 시작 버튼 보이기
            />
          </div>
          <Button onClick={handleSaveClick} className="mt-4">
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
