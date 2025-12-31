import React, { useState } from 'react';

const Modal = ({ isOpen, closeModal, userData }) => {
  if (!isOpen) return null;

  console.log(userData.fullName);

  return (
    <div className="modalOverlay">
      <div className="modalContent">
        <button className="closeButton" onClick={closeModal}>X</button>
        <h2>{userData.fullName}</h2>
        <img src={userData.img} alt="Document" className="documentImg" />
        <p><strong>Seller Type:</strong> {userData.isCompany ? "Company" : "Freelancer"}</p>
      </div>
    </div>
  );
};

export default Modal;
