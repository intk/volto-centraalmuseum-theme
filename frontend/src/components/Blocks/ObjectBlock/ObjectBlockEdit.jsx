import React from 'react';
import { BlockDataForm, SidebarPortal } from '@plone/volto/components';
import { getBaseUrl } from '@plone/volto/helpers';
import ObjectBlockSchema from './schema';
import ObjectBlockView from './ObjectBlockView';
import './css/objectblock.less';

const ObjectBlockEdit = (props) => {
  const { block, onChangeBlock, data = {}, selected } = props;
  const schema = ObjectBlockSchema(props);

  return (
    <>
      <ObjectBlockView
        {...props}
        path={getBaseUrl(props.pathname)}
        mode="edit"
      />

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
export default ObjectBlockEdit;
