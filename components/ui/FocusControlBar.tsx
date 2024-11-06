import React from "react";
import { FaCog, FaPause, FaPlay } from "react-icons/fa";

interface FocusControlBarProps {
  version: string; // 버전명
  createdDate: string; // 생성된 년.월.일
  createdTime: string; // 생성된 시:분
  showSettings?: boolean; // 설정 버튼 표시 여부
  showPause?: boolean; // 일시정지 버튼 표시 여부
  showPlay?: boolean; // 시작 버튼 표시 여부
}

const FocusControlBar: React.FC<FocusControlBarProps> = ({
  version,
  createdDate,
  createdTime,
  showSettings = true,
  showPause = true,
  showPlay = true,
}) => {
  return (
    <div className="flex w-full items-center justify-between rounded-lg bg-gray-100 p-3 shadow-md">
      {/* 왼쪽 정보 텍스트 */}
      <div className="text-sm text-gray-700">
        <span>{version}</span> &middot; <span>{createdDate}</span> &middot;{" "}
        <span>{createdTime}</span>
      </div>

      {/* 오른쪽 버튼 그룹 */}
      <div className="flex gap-5">
        {showSettings && (
          <button className="text-xl text-gray-700 transition hover:text-blue-500">
            <FaCog />
          </button>
        )}
        {showPause && (
          <button className="text-xl text-gray-700 transition hover:text-blue-500">
            <FaPause />
          </button>
        )}
        {showPlay && (
          <button className="text-xl text-gray-700 transition hover:text-blue-500">
            <FaPlay />
          </button>
        )}
      </div>
    </div>
  );
};

export default FocusControlBar;
