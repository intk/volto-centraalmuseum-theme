import { defineMessages } from 'react-intl';

const messages = defineMessages({
  Model: {
    id: 'Model',
    defaultMessage: 'Model',
  },
});

const ModelSchema = ({ onChangeBlock, intl, data, openObjectBrowser }) => ({
  title: intl.formatMessage(messages.Model),
  fieldsets: [
    {
      id: 'default',
      fields: ['heading', 'embedCodes'],
      title: 'Default',
    },
  ],

  properties: {
    heading: {
      title: 'Title',
    },
    embedCodes: {
      title: 'Embedded codes',
      widget: 'textarea',
    },
  },
  required: [],
});

export default ModelSchema;
