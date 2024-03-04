import React from 'react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';
import {
  Option,
  DropdownIndicator,
  MultiValueContainer,
} from '@plone/volto/components/manage/Widgets/SelectStyling';
import { selectTheme, customSelectStyles } from './SelectStyling';
import {
  selectFacetSchemaEnhancer,
  selectFacetStateToValue,
  selectFacetValueToQuery,
} from '@package/components/Blocks/Search/base';
import { Header } from 'semantic-ui-react';

const SelectFacet = (props) => {
  const {
    facet,
    choices,
    reactSelect,
    isMulti,
    onChange,
    value,
    isEditMode,
  } = props;
  const Select = reactSelect.default;
  const v = Array.isArray(value) && value.length === 0 ? null : value;

  return (
    <div className="select-facet">
      <Header as="h4">{facet.title ?? facet?.field?.label}</Header>
      <Select
        placeholder={`Typ om te zoeken`}
        className="react-select-container"
        classNamePrefix="react-select"
        options={choices}
        styles={customSelectStyles}
        theme={selectTheme}
        components={{ DropdownIndicator, Option, MultiValueContainer }}
        isDisabled={isEditMode}
        onChange={(data) => {
          if (data) {
            onChange(
              facet.field.value,
              isMulti ? data.map(({ value }) => value) : data.value,
            );
          } else {
            // data has been removed
            onChange(facet.field.value, isMulti ? [] : '');
          }
        }}
        isMulti={facet.multiple}
        isClearable
        value={v}
      />
    </div>
  );
};

SelectFacet.schemaEnhancer = selectFacetSchemaEnhancer;
SelectFacet.stateToValue = selectFacetStateToValue;
SelectFacet.valueToQuery = selectFacetValueToQuery;

export default injectLazyLibs('reactSelect')(SelectFacet);
