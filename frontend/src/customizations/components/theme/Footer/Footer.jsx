/* eslint-disable no-unused-vars */
/**
 * Footer component.
 * @module components/theme/Footer/Footer
 */

import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { defineMessages, injectIntl } from 'react-intl';
import { useSelector, shallowEqual } from 'react-redux';
import { Image } from 'semantic-ui-react';
import {
  getScaleUrl,
  getPath,
} from '@package/components/Blocks/SiteData/utils';
import { Container, Segment, Grid, Label } from 'semantic-ui-react';
import RenderBlocks from './RenderBlocks';
import MailchimpSubscribe from 'react-mailchimp-subscribe';
import { Link } from 'react-router-dom';
import { SeeMoreNewsBlogs } from '@package/components/index';
import { useSiteDataContent } from '@package/helpers';

const messages = defineMessages({
  copyright: {
    id: 'Copyright',
    defaultMessage: 'Copyright',
  },
  newsletter: {
    id: 'Newsletter',
    defaultMessage: 'Nieuwsbrief ontvangen?',
  },
  approve: {
    id: 'Approve',
    defaultMessage:
      'Bedankt voor je aanmelding. Je ontvangt een e-mail die je inschrijving bevestigt',
  },
  unable: {
    id: 'Unable',
    defaultMessage: 'Aanmelden op nieuwsbrief mislukt.',
  },
  error: {
    id: 'Error',
    defaultMessage: 'Aanmelden op nieuwsbrief mislukt.',
  },
});

const cookietranslations = {
  more_info_link: {
    en: '/nl/over-ons/over-het-museum/privacyverklaring-en-cookies',
    nl: '/nl/over-ons/over-het-museum/privacyverklaring-en-cookies',
  },
  more_info_text: {
    en: 'Read more',
    nl: 'Meer info',
  },
  text: {
    en: 'We use cookies to enhance our website.',
    nl: 'Wij gebruiken cookies om onze website te verbeteren.',
  },
  button_text: {
    en: 'Accept',
    nl: 'Accepteren',
  },
};

const MailChimpForm = ({ status, message, onValidated }) => {
  let email;
  const submit = () =>
    email &&
    email.value.indexOf('@') > -1 &&
    onValidated({
      EMAIL: email.value,
    });

  return (
    <>
      <div id="newsletter-form">
        <div id="formfield-form-widgets-email">
          <input
            id="form-widgets-email"
            ref={(node) => (email = node)}
            type="email"
            placeholder="Mijn e-mail"
          />
          <br />
        </div>
        <div className="formControls">
          <button id="form-buttons-subscribe" onClick={submit}>
            Inschrijven
          </button>
        </div>
      </div>

      {/* <div>
        <div className="message">
          {status === 'sending' && <div style={{ color: 'blue' }}>...</div>}
          {status === 'error' && (
            <div
              style={{ color: 'red' }}
              dangerouslySetInnerHTML={{ __html: message }}
            />
          )}
          {status === 'success' && (
            <div
              className="success-msg"
              style={{ color: 'blue' }}
              dangerouslySetInnerHTML={{ __html: message }}
            />
          )}
        </div>
      </div> */}
    </>
  );
};

/**
 * Component to display the footer.
 * @function Footer
 * @param {Object} intl Intl object
 * @returns {string} Markup of the component
 */

const Footer = (props) => {
  const { intl } = props;
  const siteDataContent = useSiteDataContent();
  const mailchimp_url =
    'https://centraalmuseum.us2.list-manage.com/subscribe/post?u=c04600e3ceefae8c502cbabec&id=f30ce644bb&group%5B15905%5D%5B16%5D=1';

  const content = {
    blocks: siteDataContent.blocks,
    blocks_layout: siteDataContent.blocks_layout,
  };

  const path = getPath(siteDataContent['@id']);

  const { siteActions = [] } = useSelector(
    (state) => ({
      siteActions: state.actions?.actions?.site_actions,
    }),
    shallowEqual,
  );

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const history = useHistory();

  const [status, setStatus] = useState(undefined);

  useEffect(() => {
    return history.listen(() => {
      setMessage(null); // Clear the message when route changes
    });
  }, [history]);

  return (
    <Container id="Footer-wrapper">
      {intl.locale === 'nl' && (
        <div id="Newsletter">
          <h3 className="Header">{intl.formatMessage(messages.newsletter)}</h3>
          <MailchimpSubscribe
            url={mailchimp_url}
            render={({ subscribe, status, message }) => (
              <>
                {setStatus(status)}
                <MailChimpForm
                  status={status}
                  message={message}
                  onValidated={(formData) => subscribe(formData)}
                />
              </>
            )}
          />
          <div className="privacy-statement">
            <Link to="/nl/over-het-museum/voorwaarden/privacy/privacyreglement_stichting_centraal_museum.pdf/@@display-file/file">
              Privacy statement
            </Link>
          </div>
          <div className="message-wrapper">
            <div className="message">
              {status === 'sending' && <div style={{ color: 'blue' }}>...</div>}
              {status === 'error' && (
                <div style={{ color: 'red' }}>
                  <p> {intl.formatMessage(messages.error)}</p>
                </div>
              )}
              {status === 'success' && (
                <div className="success-msg" style={{ color: 'blue' }}>
                  <p> {intl.formatMessage(messages.approve)}</p>{' '}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {props.type === 'LRF' && props.language === 'nl' && (
        <div className="news-blogs">
          <SeeMoreNewsBlogs />
        </div>
      )}
      <div id="view">
        <Container id="page-document" className="Footer">
          <RenderBlocks content={siteDataContent} path={path} intl={intl} />
        </Container>
      </div>
    </Container>
  );
};

/**
 * Property types.
 * @property {Object} propTypes Property types.
 * @static
 */
Footer.propTypes = {
  /**
   * i18n object
   */
};

export default injectIntl(Footer);
