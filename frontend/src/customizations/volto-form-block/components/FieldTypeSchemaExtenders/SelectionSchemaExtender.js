import { defineMessages } from 'react-intl';
const messages = defineMessages({
  field_input_values: {
    id: 'form_field_input_values',
    defaultMessage: 'Possible values',
  },
  field_default_value: {
    id: 'form_field_default_value',
    defaultMessage: 'Default value',
  },
});

export const SelectionSchemaExtender = (intl) => {
  return {
    fields: ['input_values', 'default_values'],
    properties: {
      input_values: {
        title: intl.formatMessage(messages.field_input_values),
        type: 'array',
        creatable: true,
      },
      default_values: {
        title: intl.formatMessage(messages.field_default_value),
        type: 'string',
        creatable: true,
      },
    },
    required: ['input_values'],
  };
};
