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
import { asyncConnect } from '@plone/volto/helpers';
import qs from 'query-string';

const messages = defineMessages({
  imagepurpose1: {
    id: 'imagepurpose1',
    defaultMessage:
      'U kunt deze afbeelding gebruiken voor studie of privédoeleinden. Omdat het werk auteursrechtelijk beschermd is (de maker leeft, of is minder dan 70 jaar geleden overleden), zijn er waarschijnlijk voorwaarden (en mogelijk kosten) verbonden aan ander gebruik. Vult u het ',
  },
  imagepurpose2: {
    id: 'imagepurpose2',
    defaultMessage: ' in, dan laten we u weten wat de mogelijkheden zijn.',
  },
  imagepurpose3: {
    id: 'imagepurpose3',
    defaultMessage:
      'Toch auteursrechtenvrij? Het kan zijn dat de informatie in onze database nog niet helemaal up-to-date is. Vul ook in dat geval onderstaand ',
  },
  imagepurpose4: {
    id: 'imagepurpose4',
    defaultMessage:
      ' in, dan kunnen we onze informatie waar nodig actualiseren.',
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
    defaultMessage: 'formulier',
  },
  terug: {
    id: 'terug',
    defaultMessage: 'Terug naar de website',
  },
  publicdomain1: {
    id: 'publicdomain1',
    defaultMessage:
      'Dit werk bevindt zich in het Publiek Domein. Dat betekent dat u de afbeelding voor alle doeleinden mag gebruiken.',
  },
  publicdomain2: {
    id: 'publicdomain2',
    defaultMessage:
      'We stellen het op prijs als u - indien van toepassing - de vervaardiger en titel van het werk noemt en verwijst naar het Centraal Museum.',
  },
  notcopyright1: {
    id: 'notcopyright1',
    defaultMessage:
      'Dit werk is niet (meer) auteursrechtelijk beschermd. Dat betekent dat u de afbeelding voor alle, niet-commerciële, doeleinden mag gebruiken. Hierbij geldt de volgende licentie ',
  },
  notcopyright2: {
    id: 'notcopyright2',
    defaultMessage:
      ' (dit betekent dat u minimaal indien van toepassing de naam van de fotograaf moet vermelden.)',
  },
  notcopyright3: {
    id: 'notcopyright3',
    defaultMessage:
      'We stellen het op prijs als u - indien van toepassing - de vervaardiger en titel van het werk noemt en verwijst naar het Centraal Museum.',
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
    this.state = {
      grandparentData: null,
      parentdata: null,
    };
  }

  componentDidMount() {
    this.fetchGrandparentData();
    this.fetchParentData();
  }

  fetchGrandparentData = () => {
    const grandparentPath = this.props.pathname
      .split('/')
      .slice(0, -2)
      .join('/');
    const options = {
      portal_type: 'artwork',
      path: grandparentPath,
      metadata_fields: ['freeofcopyright', 'rights', 'objectName'],
    };

    this.props
      .searchContent('', options)
      .then((response) => {
        if (response?.items?.length) {
          const data = response.items[0];
          this.setState({
            grandparentData: data,
          });
        }
      })
      .catch((error) => '');
  };

  fetchParentData = () => {
    const parentPath = this.props.pathname.split('/').slice(0, -1).join('/');
    const options = {
      portal_type: 'Image',
      path: parentPath,
      metadata_fields: ['title', 'description'],
    };

    this.props
      .searchContent('', options)
      .then((response) => {
        if (response?.items?.length) {
          const data = response.items[0];
          this.setState({
            parentdata: data,
          });
        }
      })
      .catch((error) => '');
  };

  /**
   * Render method.
   * @method render
   * @returns {string} Markup for the component.
   */
  render() {
    const { intl } = this.props;
    const copyright = this.state.grandparentData?.freeofcopyright;
    const rights = this.state.parentdata?.description;
    const objectName = this.state.grandparentData?.objectName?.[0];
    const copyrightWName =
      objectName === 'schilderij' ||
      objectName === 'tekening' ||
      objectName === 'prent';

    const imagepath = `${this.props?.pathname
      .split('/')
      .slice(0, -1)
      .join('/')}/@@images/image/`;
    const parentpath = `${this.props?.pathname
      .split('/')
      .slice(0, -2)
      .join('/')}`;

    return (
      <Container id="page-search">
        <div className="home-link">
          <Link to={parentpath}>{intl.formatMessage(messages.terug)}</Link>
        </div>
        <p>
          {copyright ? (
            copyrightWName ? (
              intl.formatMessage(messages.publicdomain1)
            ) : (
              <>
                {intl.formatMessage(messages.notcopyright1)}
                <a
                  href="
                  https://creativecommons.org/licenses/by-nc/4.0/deed.nl"
                >
                  https://creativecommons.org/licenses/by-nc/4.0/deed.nl
                </a>
                {intl.formatMessage(messages.notcopyright2)}
              </>
            )
          ) : (
            <>
              {intl.formatMessage(messages.imagepurpose1)}
              <Link
                to={
                  intl.locale === 'nl' ? '/nl/beeldaanvraag' : '/en/orderimage'
                }
              >
                {intl.formatMessage(messages.bestelformulier)}
              </Link>
              {intl.formatMessage(messages.imagepurpose2)}
            </>
          )}
        </p>
        <p>
          {copyright ? (
            copyrightWName ? (
              <>
                {intl.formatMessage(messages.publicdomain2)}{' '}
                <i>{rights && `${rights}`}</i>
              </>
            ) : (
              intl.formatMessage(messages.notcopyright3)
            )
          ) : (
            <>
              {intl.formatMessage(messages.imagepurpose3)}
              <Link
                to={
                  intl.locale === 'nl' ? '/nl/beeldaanvraag' : '/en/orderimage'
                }
              >
                {intl.formatMessage(messages.bestelformulier)}
              </Link>
              {intl.formatMessage(messages.imagepurpose4)}
            </>
          )}
        </p>
        {!copyright && rights && (
          <p>
            {intl.formatMessage(messages.include)}{' '}
            <i>{rights && `${rights}`}</i>
          </p>
        )}
        {copyright && rights && !copyrightWName && (
          <p>
            {intl.formatMessage(messages.include)}{' '}
            <i>{rights && `${rights}`}</i>
          </p>
        )}
        <div className="image-section">
          <a
            className="button"
            href={imagepath}
            role="button"
            aria-label="download button"
            download
          >
            <img src={`${imagepath}`} alt="artwork"></img>
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
      items: state.search.items,
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
      searchableText: qs.parse(props.history.location.search).SearchableText,
      pathname: props.location.pathname,
      currentLang: state.intl?.locale,
    }),
    { searchContent },
  ),
  asyncConnect([
    {
      key: 'search',
      promise: ({ location, store: { dispatch } }) =>
        dispatch(
          searchContent('', {
            ...qs.parse(location.search),
            use_site_search_settings: 1,
          }),
        ),
    },
  ]),
)(ImageViewFullscreen);
