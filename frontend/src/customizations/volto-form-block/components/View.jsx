/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useReducer, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { useIntl, defineMessages } from 'react-intl';
import { submitForm } from 'volto-form-block/actions';
import { getFieldName } from 'volto-form-block/components/utils';
import FormView from 'volto-form-block/components/FormView';
import { formatDate } from '@plone/volto/helpers/Utils/Date';
import config from '@plone/volto/registry';
import { Captcha } from 'volto-form-block/components/Widget';
// import MailchimpSubscribe from 'react-mailchimp-subscribe';
import './View.less';

const messages = defineMessages({
  formSubmitted: {
    id: 'formSubmitted',
    defaultMessage: 'Form successfully submitted',
  },
});

const tempTranslations = {
  success: {
    en:
      'Please note: your application is not yet final. We will contact you within two working days to confirm your request.',
    nl:
      'Let op: uw aanvraag is nog niet definitief. Wij nemen binnen twee werkdagen contact met u op om uw aanvraag te bevestigen.',
    de:
      'Bitte beachten Sie: Ihre Bewerbung ist noch nicht endgültig. Wir werden uns innerhalb von zwei Werktagen mit Ihnen in Verbindung setzen, um Ihre Anfrage zu bestätigen.',
  },
  error: {
    en: 'Error while sending',
    nl: 'Fout tijdens het verzenden',
    de: 'Fehler beim Senden',
  },
};

const initialState = {
  loading: false,
  error: null,
  result: null,
};

const FORM_STATES = {
  normal: 'normal',
  loading: 'loading',
  error: 'error',
  success: 'success',
};

const formStateReducer = (state, action) => {
  switch (action.type) {
    case FORM_STATES.normal:
      return initialState;

    case FORM_STATES.loading:
      return { loading: true, error: null, result: null };

    case FORM_STATES.error:
      return { loading: false, error: action.error, result: null };

    case FORM_STATES.success:
      return { loading: false, error: null, result: action.result };

    default:
      return initialState;
  }
};

const getInitialData = (data) => ({
  ...data.reduce(
    (acc, field) => ({ ...acc, [getFieldName(field.label, field.id)]: field }),
    {},
  ),
});

/**
 * Form view
 * @class View
 */
const View = ({ data, id, path }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const { static_fields = [] } = data;
  const mailchimp_url =
    'https://centraalmuseum.us2.list-manage.com/subscribe/post?u=c04600e3ceefae8c502cbabec&id=f30ce644bb&group%5B15905%5D%5B16%5D=1';

  function subscribeToMailchimp(email, list_id) {
    const script = document.createElement('script');
    const url = `https://centraalmuseum.us2.list-manage.com/subscribe/post-json?u=c04600e3ceefae8c502cbabec&id=${list_id}&EMAIL=${encodeURIComponent(
      email,
    )}&c=callback`;
    script.src = url;
    window.callback = function (data) {
      if (data.result === 'success') {
        console.log('Subscribed successfully!');
      } else {
        console.error('Subscription failed:', data.msg);
      }
    };
    document.body.appendChild(script);
    document.body.removeChild(script);
  }

  const [formData, setFormData] = useReducer((state, action) => {
    if (action.reset) {
      return getInitialData(static_fields);
    }

    return {
      ...state,
      [action.field]: action.value,
    };
  }, getInitialData(static_fields));

  const [formState, setFormState] = useReducer(formStateReducer, initialState);
  const [formErrors, setFormErrors] = useState([]);
  const submitResults = useSelector((state) => state.submitForm);
  const captchaToken = useRef();

  const onChangeFormData = (field_id, field, value, extras) => {
    setFormData({ field, value: { field_id, value, ...extras } });
  };

  useEffect(() => {
    if (formErrors.length > 0) {
      isValidForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const isValidForm = () => {
    const v = [];
    data.subblocks.forEach((subblock, index) => {
      const name = getFieldName(subblock.label, subblock.id);
      const fieldType = subblock.field_type;
      const additionalField =
        config.blocks.blocksConfig.form.additionalFields?.filter(
          (f) => f.id === fieldType && f.isValid !== undefined,
        )?.[0] ?? null;
      if (
        subblock.required &&
        additionalField &&
        !additionalField?.isValid(formData, name)
      ) {
        v.push(name);
      } else if (
        subblock.required &&
        fieldType === 'checkbox' &&
        !formData[name]?.value
      ) {
        v.push(name);
      } else if (
        subblock.required &&
        (!formData[name] ||
          formData[name]?.value?.length === 0 ||
          JSON.stringify(formData[name]?.value ?? {}) === '{}')
      ) {
        v.push(name);
      }
    });

    if (data.captcha && !captchaToken.current) {
      v.push('captcha');
    }

    setFormErrors(v);
    return v.length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    captcha
      .verify()
      .then(() => {
        if (isValidForm()) {
          let attachments = {};
          let captcha = {
            provider: data.captcha,
            token: captchaToken.current,
          };
          if (data.captcha === 'honeypot') {
            captcha.value = formData[data.captcha_props.id]?.value ?? '';
          }

          let formattedFormData = { ...formData };
          data.subblocks.forEach((subblock) => {
            let name = getFieldName(subblock.label, subblock.id);
            if (!formattedFormData[name]?.value && subblock.default_values) {
              formattedFormData[name] = {
                ...formattedFormData[name],
                label: subblock.label,
                value: subblock.default_values,
              };
            }
            if (formattedFormData[name]?.value) {
              formattedFormData[name].field_id = subblock.field_id;
              const isAttachment = subblock.field_type === 'attachment';
              const isDate = subblock.field_type === 'date';

              if (isAttachment) {
                attachments[name] = formattedFormData[name].value;
                delete formattedFormData[name];
              }

              if (isDate) {
                formattedFormData[name].value = formatDate({
                  date: formattedFormData[name].value,
                  format: 'DD-MM-YYYY',
                  locale: intl.locale,
                });
              }
            }
          });
          dispatch(
            submitForm(
              path,
              id,
              Object.keys(formattedFormData).map((name) => ({
                ...formattedFormData[name],
              })),
              attachments,
              captcha,
            ),
          );
          setFormState({ type: FORM_STATES.loading });

          // Check if the newsletterFields checkbox is checked
          const newsletterFieldId = data.newsletterFields;
          const newsletterField = Object.values(formattedFormData).find(
            (field) => field.field_id === newsletterFieldId,
          );

          if (newsletterField && newsletterField.value) {
            // Find the email field for the Mailchimp subscription
            const emailFieldId = data.acknowledgementFields;
            const emailField = Object.values(formattedFormData).find(
              (field) => field.field_id === emailFieldId,
            );

            if (emailField && emailField.value) {
              // console.log('emailField:', emailField.value); // Debugging line
              subscribeToMailchimp(
                emailField.value,
                data.list_id || 'f30ce644bb',
              );
            }
          }
        } else {
          setFormState({ type: FORM_STATES.error });
        }
      })
      .catch(() => {
        setFormState({ type: FORM_STATES.error });
      });
  };

  const resetFormState = () => {
    setFormData({ reset: true });
    setFormState({ type: FORM_STATES.normal });
  };

  const resetFormOnError = () => {
    setFormState({ type: FORM_STATES.normal });
  };

  const captcha = new Captcha({
    captchaToken,
    captcha: data.captcha,
    captcha_props: data.captcha_props,
    onChangeFormData,
  });

  const formid = `form-${id}`;
  const currentLang = useSelector((state) => state.intl.locale);
  useEffect(() => {
    if (submitResults?.loaded) {
      setFormState({
        type: FORM_STATES.success,
        // result: intl.formatMessage(messages.formSubmitted),
        result: tempTranslations['success'][currentLang],
      });
      captcha.reset();
      const formItem = document.getElementById(formid);
      if (formItem !== null) {
        const formItemPosition = formItem.getBoundingClientRect();
        formItemPosition !== null &&
          window.scrollTo({
            top: formItemPosition.x,
            left: formItemPosition.y,
            behavior: 'smooth',
          });
      }
    } else if (submitResults?.error) {
      // eslint-disable-next-line no-unused-vars
      let errorDescription = `${
        JSON.parse(submitResults.error.response?.text ?? '{}')?.message
      }`;

      setFormState({
        type: FORM_STATES.error,
        error: tempTranslations['error'][currentLang],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitResults]);

  useEffect(() => {
    resetFormState();
  }, []);

  return (
    <FormView
      id={formid}
      formState={formState}
      formErrors={formErrors}
      formData={formData}
      captcha={captcha}
      onChangeFormData={onChangeFormData}
      data={data}
      onSubmit={submit}
      resetFormState={resetFormState}
      resetFormOnError={resetFormOnError}
    />
  );
};

/**
 * Property types.
 * @property {Object} propTypes Property types.
 * @static
 */
View.propTypes = {
  data: PropTypes.objectOf(PropTypes.any).isRequired,
};

export default View;
