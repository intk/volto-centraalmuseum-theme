import { defineMessages } from 'react-intl';

const messages = defineMessages({
  Callout: {
    id: 'Callout',
    defaultMessage: 'Callout',
  },
});

const CalloutSchema = ({ onChangeBlock, intl, data, openObjectBrowser }) => ({
  title: intl.formatMessage(messages.Callout),
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

export default CalloutSchema;
