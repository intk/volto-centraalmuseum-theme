/**
 * Logo component.
 * @module components/theme/Logo/Logo
 */

import { defineMessages, useIntl } from 'react-intl';
import { Image } from 'semantic-ui-react';
import { useSelector } from 'react-redux';
import config from '@plone/volto/registry';
import { UniversalLink } from '@plone/volto/components';
import { toBackendLang } from '@plone/volto/helpers';
import LogoImage from './Logo.svg';
import blackLogoImage from './Logo.svg';
import navigationLogo from './Logo.svg';

const messages = defineMessages({
  site: {
    id: 'Site',
    defaultMessage: 'Site',
  },
  plonesite: {
    id: 'Plone Site',
    defaultMessage: 'Plone Site',
  },
});

/**
 * Logo component class.
 * @function Logo
 * @param {Object} intl Intl object
 * @returns {string} Markup of the component.
 */
const Logo = (props) => {
  const { settings } = config;
  const lang = useSelector((state) => state.intl.locale);
  const intl = useIntl();

  const clickHandler = () => {
    props.onCloseMobileMenu && props.onCloseMobileMenu();
  };

  return (
    <UniversalLink
      href={settings.isMultilingual ? `/${toBackendLang(lang)}` : '/'}
      title={intl.formatMessage(messages.site)}
    >
      <Image
        src={
          props.black === true
            ? blackLogoImage
            : props.navigation === true
            ? navigationLogo
            : LogoImage
        }
        alt={intl.formatMessage(messages.plonesite)}
        title={intl.formatMessage(messages.plonesite)}
        onClick={clickHandler}
      />
    </UniversalLink>
  );
};

export default Logo;
