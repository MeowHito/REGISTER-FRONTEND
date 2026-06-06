import { NOT_FOUND_IMG } from 'assets'
import React from 'react'

function DisplayImageIfAvailable({ data }) {
  return (
    <>
      {data ? (
        <div className="flex justify-center my-3">
          <div className="min-w-[400px]">
            <img
              className="w-full h-full rounded object-cover"
              src={data || NOT_FOUND_IMG}
              alt="Image"
            />
          </div>
        </div>
      ) : null}
    </>
  )
}

export default DisplayImageIfAvailable
