import globeSVG from '@plone/volto/icons/globe.svg';

import DiscreetView from './DiscreetView';
import DiscreetEdit from './DiscreetEdit';

const installDiscreetBlock = (config) => {
  config.blocks.blocksConfig.discreetBlock = {
    id: 'discreetBlock',
    title: 'discreet',
    icon: globeSVG,
    group: 'common',
    view: DiscreetView,
    edit: DiscreetEdit,
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

export default installDiscreetBlock;
