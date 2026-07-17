import React from "react";

const ModalExito = ({ visible, msjExito, onClose}) => {
  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Acción exitosa</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="msj-exito" style={{display:"inline-flex", alignItems:"center"}}>
          <div style={{marginRight:"5px"}}>☑️</div>
          <p>{msjExito}</p>
        </div>  
        <div className="modal-buttons">
          <button className="modal-btn-save" onClick={onClose}>Aceptar</button>
        </div>
      </div>
    </div>
  );
};

export default ModalExito;
