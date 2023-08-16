import downloadSVG from '@plone/volto/icons/download.svg';

import ObjectBlockView from './ObjectBlockView';
import ObjectBlockEdit from './ObjectBlockEdit';

const installObjectBlock = (config) => {
  config.blocks.blocksConfig.objectblock = {
    id: 'objectblock',
    title: 'Object Block',
    icon: downloadSVG,
    group: 'Homepage',
    view: ObjectBlockView,
    edit: ObjectBlockEdit,
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

export default installObjectBlock;
