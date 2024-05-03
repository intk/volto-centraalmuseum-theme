import React from 'react';

const DiscreetView = ({ data, mode = 'view' }) => {
  return (
    <>
      {data?.text ? (
        <p
          className="callout"
          dangerouslySetInnerHTML={{ __html: data.text }}
        />
      ) : (
        ''
      )}
    </>
  );
};
export default DiscreetView;
