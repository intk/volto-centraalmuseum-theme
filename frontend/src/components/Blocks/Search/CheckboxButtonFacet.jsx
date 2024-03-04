import React from 'react';
import { Icon } from '@plone/volto/components';
import { Checkbox, Header } from 'semantic-ui-react';
import {
  selectFacetSchemaEnhancer,
  selectFacetStateToValue,
  selectFacetValueToQuery,
} from '@plone/volto/components/manage/Blocks/Search/components/base';

import addSVG from '@plone/volto/icons/add.svg';

const CheckboxButtonFacet = (props) => {
  const { facet, choices, isMulti, onChange, value, isEditMode } = props;
  const facetValue = value;

  return (
    <div className="button-facet">
      <Header as="h4">{facet.title ?? facet?.field?.label}</Header>
      <div className="entries">
        {choices.map(({ label, value }, i) => {
          const checked = isMulti
            ? !!facetValue?.find((f) => f.value === value)
            : facetValue && facetValue.value === value;

          return (
            <div key={value} className={`entry ${checked ? 'add' : 'clear'}`}>
              <Checkbox
                disabled={isEditMode}
                label={label}
                checked={checked}
                onChange={(e, { checked }) =>
                  onChange(
                    facet.field.value,
                    isMulti
                      ? [
                          ...facetValue
                            .filter((f) => f.value !== value)
                            .map((f) => f.value),
                          ...(checked ? [value] : []),
                        ]
                      : checked
                      ? value
                      : null,
                  )
                }
              />
              <div className="facet-btn-icon">
                <Icon name={addSVG} size="25px" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

CheckboxButtonFacet.schemaEnhancer = selectFacetSchemaEnhancer;
CheckboxButtonFacet.stateToValue = selectFacetStateToValue;
CheckboxButtonFacet.valueToQuery = selectFacetValueToQuery;

export default CheckboxButtonFacet;
