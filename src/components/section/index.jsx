import React from 'react'

export default function Section({ className = "", style = {}, children }) {
  return (
    <div className="sa-section">
      <div className={`section-content section-padding ${className}`} style={style}>
        <div className="container">
          <>
            {children}
          </>
        </div>
      </div>
    </div>
  )
}
