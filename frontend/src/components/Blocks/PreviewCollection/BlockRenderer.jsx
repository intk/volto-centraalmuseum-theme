import React from 'react';
import PropTypes from 'prop-types';
import config from '@plone/volto/registry';
import withObjectBrowser from '@plone/volto/components/manage/Sidebar/ObjectBrowser';
// import { UniversalLink } from '@plone/volto/components';

/**
 * BlockRenderer container class.
 * @class Form
 * @extends Component
 */
function BlockRenderer(props) {
  // eslint-disable-next-line no-unused-vars
  const { edit, type, blocksConfig, buttonData } = props;

  if (!type) {
    // We could have an empty block, although should be handled somewhere else
    return null;
  }

  const EditBlock =
    blocksConfig?.[type]?.edit || config.blocks.blocksConfig[type].edit;
  const ViewBlock =
    blocksConfig?.[type]?.view || config.blocks.blocksConfig[type].view;

  // let href = buttonData?.linkHref?.[0]?.['@id'] || '';
  return (
    <div>
      {/* Render the edit or view block based on the edit state */}
      {!edit ? (
        <ViewBlock {...props} detached onChangeBlock={() => {}} />
      ) : (
        <EditBlock {...props} detached index={0} />
      )}

      {/* Render "Click Me" button if block type is 'text' */}
      {/* {type === 'text' && buttonData.linkTitle && (
        <UniversalLink href={href} className={`text-button btn-block primary`}>
          {buttonData.linkTitle || href}
        </UniversalLink>
      )} */}
    </div>
  );
}

BlockRenderer.propTypes = {
  edit: PropTypes.bool.isRequired,
  type: PropTypes.string.isRequired,
  block: PropTypes.string.isRequired,
  onChangeBlock: PropTypes.func,
  data: PropTypes.objectOf(PropTypes.any).isRequired,
  blocksConfig: PropTypes.objectOf(PropTypes.any),
};

BlockRenderer.defaultProps = {
  edit: false,
};

export default withObjectBrowser(BlockRenderer);
