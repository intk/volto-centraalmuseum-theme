import React from 'react';
import { BlockDataForm, SidebarPortal } from '@plone/volto/components';

import ModelSchema from './schema';
import ModelView from './ModelView';

const ModelEdit = (props) => {
  const { block, onChangeBlock, data = {}, selected } = props;
  const schema = ModelSchema(props);

  return (
    <>
      <ModelView {...props} mode="edit" />

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

export default ModelEdit;
