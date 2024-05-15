import React from 'react';
import { BlockDataForm, SidebarPortal } from '@plone/volto/components';

import CalloutSchema from './schema.js';
import CalloutView from './CalloutView.jsx';

const CalloutEdit = (props) => {
  const { block, onChangeBlock, data = {}, selected } = props;
  const schema = CalloutSchema(props);

  return (
    <>
      <CalloutView {...props} mode="edit" />

      <SidebarPortal selected={selected}>
        <BlockDataForm
          key={Object.keys(data?.cards || {}).length}
          schema={schema}
          onChangeField={(id, value) => {
            onChangeBlock(block, {
              ...data,
              [id]: value,
            });
          }}
          formData={data}
        />
      </SidebarPortal>
    </>
  );
};

export default CalloutEdit;
