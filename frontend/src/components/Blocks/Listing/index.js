import ArtworkTemplate from './ArtworkTemplate';
import ArtworkListingTemplate from './ArtworkListingTemplate';
import DefaultTemplate from './DefaultTemplate';
import AdvancedSearchTemplate from './AdvancedSearchTemplate';
import CollectionSliderTemplate from './CollectionSliderTemplate';
import CollectionBrowseTemplate from './CollectionBrowseTemplate';
import RecommendedTemplate from './RecommendedTemplate';
// import MasonryTemplate from './MasonryTemplate';

export default (config) => {
  config.blocks.blocksConfig.listing.schemaEnhancer = ({ schema }) => {
    // move querystring to its own fieldset;
    schema.fieldsets[0].fields = schema.fieldsets[0].fields.filter(
      (f) => f !== 'querystring',
    );
    schema.fieldsets.splice(1, 0, {
      id: 'querystring',
      title: 'Query',
      fields: ['querystring'],
    });

    schema.properties = {
      ...schema.properties,
      linkTitle: {
        title: 'Button title',
      },
      linkHref: {
        title: 'Call to action',
        widget: 'object_browser',
        mode: 'link',
        selectedItemAttrs: ['Title', 'Description'],
        allowExternals: true,
      },
      showDescription: {
        title: 'Show description',
        type: 'boolean',
        default: false,
      },
    };

    schema.fieldsets[0].fields.splice(
      2,
      0,
      'linkHref',
      'linkTitle',
      'showDescription',
    );

    return schema;
  };

  config.blocks.blocksConfig.listing.variations = [
    {
      id: 'Artwork',
      isDefault: false,
      title: 'Artwork Listing',
      template: ArtworkTemplate,
    },
    {
      id: 'Artwork Listing',
      isDefault: false,
      title: 'Artwork Listing Template',
      template: ArtworkListingTemplate,
    },
    {
      id: 'Default',
      isDefault: true,
      title: 'Default Listing',
      template: DefaultTemplate,
    },
    {
      id: 'AdvancedSearch',
      isDefault: true,
      title: 'Advanced Search Listing',
      template: AdvancedSearchTemplate,
    },
    {
      id: 'collectionsliderview',
      isDefault: false,
      title: 'Collection Slider Wiew',
      template: CollectionSliderTemplate,
    },
    {
      id: 'collectionbrowseview',
      isDefault: false,
      title: 'Collection Browse Wiew',
      template: CollectionBrowseTemplate,
    },
    {
      id: 'RecommendedTemplate',
      isDefault: false,
      title: 'Exhibition Recommended Wiew',
      template: RecommendedTemplate,
    },
  ];

  return config;
};
