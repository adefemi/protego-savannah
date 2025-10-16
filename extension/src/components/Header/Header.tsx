/**
 * Header Component
 * Displays the app title and refresh button
 */

import React from "react";
import "./Header.scss";

interface HeaderProps {
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh }) => {
  return (
    <header className="header">
      <h1>📊 Page History</h1>
      <button
        onClick={onRefresh}
        className="refresh-btn"
        title="Refresh"
        aria-label="Refresh page data"
      >
        🔄
      </button>
    </header>
  );
};
