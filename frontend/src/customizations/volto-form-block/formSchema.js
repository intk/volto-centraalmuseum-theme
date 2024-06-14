import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  form: {
    id: 'form',
    defaultMessage: 'Form',
  },
  title: {
    id: 'title',
    defaultMessage: 'Title',
  },
  description: {
    id: 'description',
    defaultMessage: 'Description',
  },
  default_to: {
    id: 'form_to',
    defaultMessage: 'Recipients',
  },
  default_from: {
    id: 'form_default_from',
    defaultMessage: 'Default sender',
  },
  default_subject: {
    id: 'form_default_subject',
    defaultMessage: 'Mail subject',
  },
  submit_label: {
    id: 'form_submit_label',
    defaultMessage: 'Submit button label',
  },
  captcha: {
    id: 'captcha',
    defaultMessage: 'Captcha provider',
  },
  store: {
    id: 'form_save_persistent_data',
    defaultMessage: 'Store compiled data',
  },
  attachmentSendEmail: {
    id: 'form_attachment_send_email_info_text',
    defaultMessage: 'Attached file will be sent via email, but not stored',
  },
  send: {
    id: 'form_send_email',
    defaultMessage: 'Send email to receipent',
  },
});

export default (formData) => {
  var intl = useIntl();
  const emailFields =
    formData?.subblocks?.reduce((acc, field) => {
      return ['from', 'email'].includes(field.field_type)
        ? [...acc, [field.id, field.label]]
        : acc;
    }, []) ?? [];
  const checkboxFields =
    formData?.subblocks?.reduce((acc, field) => {
      return ['checkbox'].includes(field.field_type)
        ? [...acc, [field.id, field.label]]
        : acc;
    }, []) ?? [];

  return {
    title: intl.formatMessage(messages.form),
    fieldsets: [
      {
        id: 'default',
        title: 'Default',
        fields: [
          'title',
          'description',
          'default_to',
          'default_from',
          'default_subject',
          'submit_label',
          'captcha',
          'store',
          'send',
          ...(formData?.store &&
          Array.isArray(formData.store) &&
          formData.store.includes('acknowledgement')
            ? ['acknowledgementFields', 'acknowledgementMessage']
            : []),
          ...(formData?.store &&
          Array.isArray(formData.store) &&
          formData.store.includes('newsletter')
            ? ['list_id', 'newsletterFields', 'newsletterEmailFields']
            : ''),
        ],
      },
    ],
    properties: {
      title: {
        title: intl.formatMessage(messages.title),
      },
      description: {
        title: intl.formatMessage(messages.description),
        type: 'textarea',
      },
      default_to: {
        title: intl.formatMessage(messages.default_to),
      },
      default_from: {
        title: intl.formatMessage(messages.default_from),
      },
      default_subject: {
        title: intl.formatMessage(messages.default_subject),
      },
      submit_label: {
        title: intl.formatMessage(messages.submit_label),
      },
      captcha: {
        title: intl.formatMessage(messages.captcha),
        type: 'string',
        vocabulary: {
          '@id': 'collective.volto.formsupport.captcha.providers',
        },
      },
      list_id: {
        title: 'List ID for newsletter',
      },
      store: {
        title: intl.formatMessage(messages.store),
        isMulti: 'true',
        default: 'recipient',
        choices: [
          ['recipient', 'Recipient'],
          ['acknowledgement', 'Acknowledgement'],
          ['newsletter', 'Newsletter'],
        ],
      },
      acknowledgementMessage: {
        // TODO: i18n
        title: 'Acknowledgement message',
        widget: 'richtext',
      },
      acknowledgementFields: {
        // TODO: i18n
        title: 'Acknowledgement field',
        decription:
          'Select which fields will contain an email address to send an acknowledgement to.',
        isMulti: false,
        noValueOption: false,
        choices: formData?.subblocks ? emailFields : [],
        ...(emailFields.length === 1 && { default: emailFields[0][0] }),
      },
      newsletterFields: {
        // TODO: i18n
        title: 'Newsletter field',
        decription:
          'Select which fields will be used for checking the signing up for the newsletter',
        isMulti: false,
        noValueOption: false,
        choices: formData?.subblocks ? checkboxFields : [],
        ...(checkboxFields.length === 1 && { default: checkboxFields[0][0] }),
      },
      newsletterEmailFields: {
        // TODO: i18n
        title: 'Newsletter email field',
        decription:
          'Select which fields will be used as an email for signing up for the newsletter',
        isMulti: false,
        noValueOption: false,
        choices: formData?.subblocks ? emailFields : [],
        ...(checkboxFields.length === 1 && { default: emailFields[0][0] }),
      },
      send: {
        type: 'boolean',
        title: intl.formatMessage(messages.send),
        description: intl.formatMessage(messages.attachmentSendEmail),
      },
    },
    required: ['default_to', 'default_from', 'default_subject'],
  };
};
