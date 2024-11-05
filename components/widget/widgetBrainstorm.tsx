import React, { useCallback, useEffect, useState, useRef } from "react";
import { AllWidgetType } from "@/lib/type";

interface BrainstormInputProps {
  onCreateNode: (text: string) => void;
  isActive: boolean;
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>;
  setTool: React.Dispatch<React.SetStateAction<"select" | AllWidgetType>>;
}

const BrainstormInput: React.FC<BrainstormInputProps> = ({
  onCreateNode,
  isActive,
  setIsActive,
  setTool,
}) => {
  const [inputText, setInputText] = useState("");
  const [isSelected, setIsSelected] = useState(false);
  const isProcessing = useRef(false);

  // Shift+T 단축키 핸들러 수정
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "T") {
        e.preventDefault();
        setIsActive((prev: boolean) => !prev);
        setTool("brainStorm" as AllWidgetType);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsActive, setTool]);

  // 텍스트 입력 처리
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputText(e.target.value);
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        // 중복 처리 방지
        if (isProcessing.current) return;
        isProcessing.current = true;

        if (inputText.trim()) {
          onCreateNode(inputText);
          setInputText("");
        }

        // 처리 완료 후 플래그 리셋
        setTimeout(() => {
          isProcessing.current = false;
        }, 100);
      }
    },
    [inputText, onCreateNode]
  );

  // textarea에 focus 이벤트 핸들러 추가
  const handleFocus = () => setIsSelected(true);
  const handleBlur = () => setIsSelected(false);

  if (!isActive) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        top: "20%",
        transform: "translateY(-50%)",
        width: "300px",
        zIndex: 1000,
      }}
    >
      <textarea
        value={inputText}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={`아이디어를 입력하세요!

사용법:
ON/OFF - Shift + T / 버튼 클릭
Ctrl/Cmd + Enter로 생성`}
        style={{
          width: "100%",
          height: "150px",
          padding: "10px",
          borderRadius: "8px",
          border: `2px solid ${isSelected ? "#00A3FF" : "#E5E5E5"}`,
          outline: "none",
          resize: "none",
          fontSize: "16px",
          opacity: isSelected ? "100%" : "70%",
          transition: "all 0.2s ease",
          backgroundColor: "white",
          boxShadow: isSelected ? "0 0 0 1px #00A3FF" : "none",
        }}
        autoFocus
      />
    </div>
  );
};

export default BrainstormInput;
