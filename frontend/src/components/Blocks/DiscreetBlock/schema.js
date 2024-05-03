import { defineMessages } from 'react-intl';

const messages = defineMessages({
  Discreet: {
    id: 'Discreet',
    defaultMessage: 'Discreet',
  },
});

const DiscreetSchema = ({ onChangeBlock, intl, data, openObjectBrowser }) => ({
  title: intl.formatMessage(messages.Discreet),
  fieldsets: [
    {
      id: 'default',
      fields: ['text'],
      title: 'Default',
    },
  ],

  properties: {
    text: {
      title: 'Text',
      // type: 'richtext',
      // widget: 'richtext',
    },
  },
  required: [],
});

export default DiscreetSchema;
