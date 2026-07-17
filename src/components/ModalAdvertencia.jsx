import React from "react";

const ModalAdvertencia = ({ visible, msjAdvertencia, onClose}) => {
  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Advertencia</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="msj-advertencia">
          <div style={{marginRight:"5px"}}>⚠️</div>
          <p>{msjAdvertencia}</p>
        </div>  
        <div className="modal-buttons">
          <button className="modal-btn-save" onClick={onClose}>Aceptar</button>
        </div>
      </div>
    </div>
  );
};

export default ModalAdvertencia;
