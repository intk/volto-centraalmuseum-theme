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
import installSearchBlock from './Search';
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
  )(config);
};

export default installBlocks;
