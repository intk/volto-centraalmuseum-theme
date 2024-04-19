/**
 * Search component.
 * @module components/theme/Search/Search
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
// eslint-disable-next-line no-unused-vars
import { Container, Pagination, Button, Header } from 'semantic-ui-react';
// import classNames from 'classnames';
import { defineMessages, injectIntl } from 'react-intl';
import { searchContent } from '@plone/volto/actions';
// eslint-disable-next-line no-unused-vars
import { SearchTags, Toolbar, Icon } from '@plone/volto/components';
import { Link } from 'react-router-dom';
import './css/ImageViewFullscreen.less';

const messages = defineMessages({
  imagepurpose: {
    id: 'imagepurpose',
    defaultMessage:
      'Gebruik voor studie of privédoeleinden. Beeldrecht is van toepassing. Aanvragen voorwaarden copyright en/of hogere resolutie:',
  },
  include: {
    id: 'include',
    defaultMessage: 'Bij gebruik deze gegevens vermelden: ',
  },
  mercis: {
    id: 'mercis',
    defaultMessage: 'Mercis Publishing/Centraal Museum, Utrecht',
  },
  bestelformulier: {
    id: 'bestelformulier',
    defaultMessage: 'Bestelformulier',
  },
});

// const test = withQuerystringResults(this.props);
// console.log(test);

/**
 * Search class.
 * @class SearchComponent
 * @extends Component
 */
class ImageViewFullscreen extends Component {
  /**
   * Property types.
   * @property {Object} propTypes Property types.
   * @static
   */
  static propTypes = {
    subject: PropTypes.string,
    path: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        '@id': PropTypes.string,
        '@type': PropTypes.string,
        title: PropTypes.string,
        description: PropTypes.string,
      }),
    ),
    pathname: PropTypes.string.isRequired,
  };

  /**
   * Default properties.
   * @property {Object} defaultProps Default properties.
   * @static
   */
  static defaultProps = {
    items: [],
    searchableText: null,
    subject: null,
    path: null,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  /**
   * Render method.
   * @method render
   * @returns {string} Markup for the component.
   */
  render() {
    const { intl } = this.props;
    const imagepath = `${this.props?.pathname
      .split('/')
      .slice(0, -1)
      .join('/')}/@@images/preview_image/`;
    return (
      <Container id="page-search">
        <div className="home-link">
          <Link to={`/${intl.locale}`}>Home</Link>
        </div>
        <p>
          {intl.formatMessage(messages.imagepurpose)}{' '}
          <Link
            to={intl.locale === 'nl' ? '/nl/beeldaanvraag' : '/en/orderimage'}
          >
            {intl.formatMessage(messages.bestelformulier)}
          </Link>
        </p>
        <p>
          {intl.formatMessage(messages.include)}{' '}
          <i>{intl.formatMessage(messages.mercis)}</i>
        </p>
        <div className="image-section">
          <a
            className="button"
            href={imagepath}
            role="button"
            aria-label="download button"
            download
          >
            <img src={imagepath} alt="artwork"></img>
          </a>
        </div>
      </Container>
    );
  }
}

export const __test__ = compose(
  injectIntl,
  connect(
    (state, props) => ({
      pathname: props.history.location.pathname,
    }),
    { searchContent },
  ),
)(ImageViewFullscreen);

export default compose(
  injectIntl,
  connect(
    (state, props) => ({
      items: state.search.items,
      pathname: props.location.pathname,
      currentLang: state.intl?.locale,
    }),
    { searchContent },
  ),
)(ImageViewFullscreen);
