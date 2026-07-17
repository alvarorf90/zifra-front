import React from "react";

const Loading = ({ show }) => {
  if (!show) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <p className="loading-text">Espere un momento...</p>
    </div>
  );
};

export default Loading;
