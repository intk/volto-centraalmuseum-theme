import targetsvg from '@plone/volto/icons/target.svg';

import AdvancedSearchView from './AdvancedSearchView';
import AdvancedSearchEdit from './AdvancedSearchEdit';

const installAdvancedSearch = (config) => {
  config.blocks.blocksConfig.AdvancedSearch = {
    id: 'AdvancedSearch',
    title: 'AdvancedSearch',
    icon: targetsvg,
    group: 'common',
    view: AdvancedSearchView,
    edit: AdvancedSearchEdit,
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

export default installAdvancedSearch;
