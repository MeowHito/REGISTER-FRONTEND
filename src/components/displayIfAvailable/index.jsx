import React from 'react'

function DisplayIfAvailable({ data, label, classNameLabel, type = "row", children }) {
  return (
    <>
      {data || children ? (
        <div className={` flex ${type == "row" ? "flex-row" : "flex-col"} my-2`}>
          <div className={classNameLabel || "font-semibold mr-3 whitespace-nowrap"} >{label}</div>
          {data ? <div>{data}</div> : children}
        </div>
      ) : null}
    </>
  )
}

export default DisplayIfAvailable
