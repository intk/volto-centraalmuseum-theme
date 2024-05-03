import React from 'react';
import { BlockDataForm, SidebarPortal } from '@plone/volto/components';

import DiscreetSchema from './schema';
import DiscreetView from './DiscreetView.jsx';

const DiscreetEdit = (props) => {
  const { block, onChangeBlock, data = {}, selected } = props;
  const schema = DiscreetSchema(props);

  return (
    <>
      <DiscreetView {...props} mode="edit" />

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

export default DiscreetEdit;
