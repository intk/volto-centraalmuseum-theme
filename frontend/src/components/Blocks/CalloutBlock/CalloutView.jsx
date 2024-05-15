import React from 'react';

const CalloutView = ({ data }) => {
  return (
    <>
      {data?.text ? (
        <div id="blockquote" dangerouslySetInnerHTML={{ __html: data.text }} />
      ) : (
        ''
      )}
    </>
  );
};
export default CalloutView;
