import installSiteDataBlock from './SiteData';
import installQuoteblock from './Quoteblock';
import installImageAndTextBlock from './ImageAndTextBlock';
import installSlidingTextBlock from './SlidingTextBlock';
import installVideoPageBlock from './VideoPageBlock';
import installVimeoBlock from './VimeoBlock';
import installObjectBlock from './ObjectBlock';
import installSeethehouseBlock from './SeethehouseBlock';
import installListingBlock from './Listing';
import installAdvancedSearch from './AdvancedSearch';
import installAdvancedSearchExhibition from './AdvancedSearchExhibition';
import installSearchBlock from './Search';
import installModelBlock from './Model';
import installDiscreetBlock from './DiscreetBlock';
import installCalloutBlock from './CalloutBlock';
import installPreviewCollectionBlock from './PreviewCollection';
import { compose } from 'redux';

const installBlocks = (config) => {
  return compose(
    installSiteDataBlock,
    installQuoteblock,
    installImageAndTextBlock,
    installSlidingTextBlock,
    installVideoPageBlock,
    installVimeoBlock,
    installSeethehouseBlock,
    installObjectBlock,
    installListingBlock,
    installAdvancedSearch,
    installSearchBlock,
    installAdvancedSearchExhibition,
    installModelBlock,
    installDiscreetBlock,
    installCalloutBlock,
    installPreviewCollectionBlock,
  )(config);
};

export default installBlocks;
