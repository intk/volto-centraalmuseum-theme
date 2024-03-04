import TopFiltersLayout from './TopFiltersLayout';
import CheckboxButtonFacet from './CheckboxButtonFacet';
import ToggleSingleValueFacet from './ToggleSingleValueFacet';
import TextInputFacet from './TextInputFacet';
import { SelectFacetFilterListEntry } from '@plone/volto/components/manage/Blocks/Search/components';
// import {
//   hasNonValueOperation,
//   hasDateOperation,
// } from '@plone/volto/components/manage/Blocks/Search/utils';

export default function installSearchBlock(config) {
  config.blocks.blocksConfig.search = {
    ...config.blocks.blocksConfig.search,
    variations: [
      {
        id: 'facetsTopSide',
        title: 'Facets on top',
        view: TopFiltersLayout,
        isDefault: true,
        schemaEnhancer: ({ schema }) => {
          const { facets } = schema.properties;
          const { schemaExtender } = facets;
          facets.schemaExtender = (originalSchema, formData) => {
            const schema = schemaExtender(originalSchema, formData);

            // allow all the fields
            delete schema.properties.field.filterOptions;
            // schema.properties.field.filterOptions = (options) => {
            //   // Only allows indexes that provide simple, fixed vocabularies.
            //   // This should be improved, together with the facets. The querystring
            //   // widget implementation should serve as inspiration for those dynamic
            //   // types of facets.
            //   return Object.assign(
            //     {},
            //     ...Object.keys(options).map((k) =>
            //       Object.keys(options[k].values || {}).length ||
            //       hasNonValueOperation(options[k].operations) ||
            //       hasDateOperation(options[k].operations) ||
            //       k === 'authorID'
            //         ? { [k]: options[k] }
            //         : {},
            //     ),
            //   );
            // };
            return schema;
          };

          return schema;
        },
      },
    ],
    extensions: {
      ...config.blocks.blocksConfig.search.extensions,
      facetWidgets: {
        ...config.blocks.blocksConfig.search.extensions.facetWidgets,
        types: [
          {
            id: 'checkboxButtonFacet',
            title: 'Button',
            view: CheckboxButtonFacet,
            isDefault: false,
            stateToValue: CheckboxButtonFacet.stateToValue,
            valueToQuery: CheckboxButtonFacet.valueToQuery,
            filterListComponent: SelectFacetFilterListEntry,
            schemaEnhancer: CheckboxButtonFacet.schemaEnhancer,
          },
          {
            id: 'toggleSingleValueFacet',
            title: 'Single Value',
            view: ToggleSingleValueFacet,
            isDefault: false,
            stateToValue: CheckboxButtonFacet.stateToValue,
            valueToQuery: CheckboxButtonFacet.valueToQuery,
            filterListComponent: SelectFacetFilterListEntry,
            schemaEnhancer: CheckboxButtonFacet.schemaEnhancer,
            showFacet: () => true,
          },
          {
            id: 'TextInputFacet',
            title: 'Text Value',
            view: TextInputFacet,
            isDefault: false,
            stateToValue: TextInputFacet.stateToValue,
            valueToQuery: TextInputFacet.valueToQuery,
            filterListComponent: SelectFacetFilterListEntry,
            schemaEnhancer: TextInputFacet.schemaEnhancer,
            showFacet: () => true,
          },
          ...config.blocks.blocksConfig.search.extensions.facetWidgets.types,
        ],
      },
    },
  };

  return config;
}
