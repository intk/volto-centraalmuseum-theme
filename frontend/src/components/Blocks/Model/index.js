import globeSVG from '@plone/volto/icons/globe.svg';

import ModelView from './ModelView';
import ModelEdit from './ModelEdit';

const installModelBlock = (config) => {
  config.blocks.blocksConfig.modelBlock = {
    id: 'modelBlock',
    title: 'Model',
    icon: globeSVG,
    group: 'common',
    view: ModelView,
    edit: ModelEdit,
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

export default installModelBlock;
