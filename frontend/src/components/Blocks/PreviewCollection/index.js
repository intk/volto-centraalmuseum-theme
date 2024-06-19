import imagerightSVG from '@plone/volto/icons/image-right.svg';
import PreviewCollectionView from './PreviewCollectionView';
import PreviewCollectionEdit from './PreviewCollectionEdit';

const installPreviewCollectionBlock = (config) => {
  config.blocks.blocksConfig.previewCollectionBlock = {
    id: 'previewCollectionBlock',
    title: 'Praktisch Info Block',
    icon: imagerightSVG,
    group: 'Storytelling',
    view: PreviewCollectionView,
    edit: PreviewCollectionEdit,
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

export default installPreviewCollectionBlock;
