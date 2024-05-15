import globeSVG from '@plone/volto/icons/globe.svg';

import CalloutView from './CalloutView';
import CalloutEdit from './CalloutEdit';

const installCalloutBlock = (config) => {
  config.blocks.blocksConfig.calloutBlock = {
    id: 'calloutBlock',
    title: 'callout',
    icon: globeSVG,
    group: 'common',
    view: CalloutView,
    edit: CalloutEdit,
    restricted: false,
    mostUsed: false,
    sidebarTab: 1,
    security: {
      addPermission: [],
      view: [],
    },
  };

  return config;
};

export default installCalloutBlock;
