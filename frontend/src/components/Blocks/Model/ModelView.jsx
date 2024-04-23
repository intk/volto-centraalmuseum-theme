import React from 'react';
// import cx from 'classnames';
import { Container } from 'semantic-ui-react';
import './less/ModelView.less';

const ModelView = ({ data, mode = 'view' }) => {
  return (
    <Container>
      <div className="model">
        <h1>
          <b>{data?.heading}</b>
        </h1>
        <div
          className="model-embedded"
          dangerouslySetInnerHTML={{ __html: data.embedCodes }}
        />
      </div>
    </Container>
  );
};
export default ModelView;
