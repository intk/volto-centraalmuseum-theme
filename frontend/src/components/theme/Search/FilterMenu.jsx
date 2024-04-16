/**
 * Navigation components.
 * @module components/theme/Navigation/Navigation
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { defineMessages, injectIntl } from 'react-intl';
import cx from 'classnames';
import { Container } from 'semantic-ui-react';
import { BodyClass, getBaseUrl, hasApiExpander } from '@plone/volto/helpers';
import config from '@plone/volto/registry';
import { getNavigation } from '@plone/volto/actions';
import { CSSTransition } from 'react-transition-group';
import Accordion from '@mui/material/Accordion';
// import AccordionActions from '@mui/material/AccordionActions';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
// import Button from '@mui/material/Button';
// import NavItems from './NavItems';
// import LanguageSelector from '../LanguageSelector/LanguageSelector';
// import SearchWidget from '../SearchWidget/SearchWidget';
// import { Logo } from '@plone/volto/components';

const messages = defineMessages({
  closeMobileMenu: {
    id: 'Close menu',
    defaultMessage: 'Close menu',
  },
  openMobileMenu: {
    id: 'Open menu',
    defaultMessage: 'Open menu',
  },
});

const translations = {
  filterArtworks: {
    en: 'Only in the collection',
    nl: 'Alleen in de collectie',
    de: 'Nur in der Sammlung',
  },
  excludeArtworks: {
    en: 'Only in the website',
    nl: 'Alleen in de website',
    de: 'Nur auf der Website',
  },
  hasImage: {
    nl: 'Met beeld',
    en: 'With image',
    de: 'Mit Bild',
  },
  onDisplay: {
    en: 'Collection now on view',
    nl: 'Collectie nu te zien',
    de: 'Sammlung jetzt zu sehen',
  },
  filter: {
    nl: 'Filter de resultaten',
    en: 'Filter the results',
    de: 'Filtern Sie die Ergebnisse',
  },
};

/**
 * Navigation container class.
 * @class Navigation
 * @extends Component
 */
class FilterMenu extends Component {
  /**
   * Property types.
   * @property {Object} propTypes Property types.
   * @static
   */
  static propTypes = {
    getNavigation: PropTypes.func.isRequired,
    pathname: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        url: PropTypes.string,
      }),
    ).isRequired,
    lang: PropTypes.string.isRequired,
  };

  static defaultProps = {
    token: null,
  };

  /**
   * Constructor
   * @method constructor
   * @param {Object} props Component properties
   * @constructs Navigation
   */
  constructor(props) {
    super(props);
    this.toggleMobileMenu = this.toggleMobileMenu.bind(this);
    this.closeMobileMenu = this.closeMobileMenu.bind(this);
    this.state = {
      isMobileMenuOpen: false,
    };
  }

  componentDidMount() {
    const { settings } = config;
    if (!hasApiExpander('navigation', getBaseUrl(this.props.pathname))) {
      this.props.getNavigation(
        getBaseUrl(this.props.pathname),
        settings.navDepth,
      );
    }
  }

  /**
   * Component will receive props
   * @method componentWillReceiveProps
   * @param {Object} nextProps Next properties
   * @returns {undefined}
   */
  UNSAFE_componentWillReceiveProps(nextProps) {
    const { settings } = config;
    if (
      nextProps.pathname !== this.props.pathname ||
      nextProps.token !== this.props.token
    ) {
      if (!hasApiExpander('navigation', getBaseUrl(this.props.pathname))) {
        this.props.getNavigation(
          getBaseUrl(nextProps.pathname),
          settings.navDepth,
        );
      }
    }
  }

  /**
   * Toggle mobile menu's open state
   * @method toggleMobileMenu
   * @returns {undefined}
   */
  toggleMobileMenu() {
    this.setState({ isMobileMenuOpen: !this.state.isMobileMenuOpen });
  }

  /**
   * Close mobile menu
   * @method closeMobileMenu
   * @returns {undefined}
   */
  closeMobileMenu() {
    if (!this.state.isMobileMenuOpen) {
      return;
    }
    this.setState({ isMobileMenuOpen: false });
  }

  /**
   * Render method.
   * @method render
   * @returns {string} Markup for the component.
   */
  render() {
    const { intl } = this.props;
    return (
      <nav className="navigation" id="navigation" aria-label="navigation">
        <div className="hamburger-wrapper">
          <div id="filter-section" className="artwork-search-check button">
            <button
              // className="filter-button text-button btn-block"
              onClick={this.toggleMobileMenu}
              className={cx('filter-button text-button btn-block', {
                'is-active': this.state.isMobileMenuOpen,
              })}
              aria-label={
                this.state.isMobileMenuOpen
                  ? this.props.intl.formatMessage(messages.closeMobileMenu, {
                      type: this.props.type,
                    })
                  : this.props.intl.formatMessage(messages.openMobileMenu, {
                      type: this.props.type,
                    })
              }
              title={
                this.state.isMobileMenuOpen
                  ? this.props.intl.formatMessage(messages.closeMobileMenu, {
                      type: this.props.type,
                    })
                  : this.props.intl.formatMessage(messages.openMobileMenu, {
                      type: this.props.type,
                    })
              }
            >
              Filter »
            </button>
          </div>
        </div>
        <CSSTransition
          in={this.state.isMobileMenuOpen}
          classNames="filter-menu"
          appear
          mountOnEnter
          timeout={500}
          onEntering={() => {
            document.body.classList.add('filter-menu-opening');
            document.body.classList.add('filter-menu-visible');
          }}
          onEntered={() => {
            document.body.classList.add('filter-menu-opened');
          }}
          onExiting={() => {
            document.body.classList.remove('filter-menu-opening');
            document.body.classList.remove('filter-menu-opened');
          }}
          unmountOnExit
        >
          <div key="filter-menu-key" className="filter-menu">
            <BodyClass className="has-filter-menu-open" />
            <div className="nav-seach-wrapper">
              <button
                className="transparent-empty-section"
                onClick={this.toggleMobileMenu}
              ></button>
              <div className="filter-menu-nav">
                <Container>
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ArrowForwardIosSharpIcon />}
                      aria-controls="panel1-content"
                      id="panel1-header"
                    >
                      {translations.filter[intl.locale]}
                    </AccordionSummary>
                    <AccordionDetails>
                      <div>{this.props.renderOnlyartworksbutton()}</div>
                      <div>{this.props.renderExcludeartworksbutton()}</div>
                    </AccordionDetails>
                  </Accordion>
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ArrowForwardIosSharpIcon />}
                      aria-controls="panel2-content"
                      id="panel2-header"
                    >
                      {translations.hasImage[intl.locale]}
                    </AccordionSummary>
                    <AccordionDetails>
                      {this.props.renderPreviewimagebutton()}
                    </AccordionDetails>
                  </Accordion>
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ArrowForwardIosSharpIcon />}
                      aria-controls="panel2-content"
                      id="panel2-header"
                    >
                      {translations.onDisplay[intl.locale]}
                    </AccordionSummary>
                    <AccordionDetails>
                      {this.props.renderOndisplaybutton()}
                    </AccordionDetails>
                  </Accordion>
                </Container>
              </div>
            </div>
          </div>
        </CSSTransition>
      </nav>
    );
  }
}

export default compose(
  injectIntl,
  connect(
    (state) => ({
      token: state.userSession.token,
      items: state.navigation.items,
      lang: state.intl.locale,
    }),
    { getNavigation },
  ),
)(FilterMenu);
