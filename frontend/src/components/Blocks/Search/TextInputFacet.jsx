import React, { useState } from 'react';
import { Input, Header } from 'semantic-ui-react';
import {
  selectFacetSchemaEnhancer,
  selectFacetStateToValue,
  selectFacetValueToQuery,
} from './base';

const TextInputFacet = (props) => {
  const { facet, onChange, value } = props;
  const [inputValue, setInputValue] = useState(value || '');

  const handleInputChange = (e, { value }) => {
    setInputValue(value);
    onChange(facet.field.value, value ? value : null);
  };

  return (
    <div className="text-input-facet">
      <Header as="h4">{facet.title ?? facet?.field?.label}</Header>
      <Input value={inputValue} onChange={handleInputChange} placeholder={``} />
    </div>
  );
};

TextInputFacet.schemaEnhancer = selectFacetSchemaEnhancer;
TextInputFacet.stateToValue = selectFacetStateToValue;
TextInputFacet.valueToQuery = selectFacetValueToQuery;

export default TextInputFacet;
