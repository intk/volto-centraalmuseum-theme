// Customized to use the HeroSection

import React from 'react';
import { InView } from 'react-intersection-observer';
import { useSelector } from 'react-redux';
// eslint-disable-next-line no-unused-vars
import { Logo, Navigation } from '@plone/volto/components';
import { BodyClass, isCmsUi } from '@plone/volto/helpers';
import HeroSection from '@package/components/theme/Header/HeroSection'; // , StickyHeader
import cx from 'classnames';
import { useIntl } from 'react-intl';
import usePreviewImage from '@package/components/theme/Header/usePreviewImage';
import { useLocation } from 'react-router-dom';

const Header = (props) => {
  const { navigationItems } = props;
  const intl = useIntl();
  // eslint-disable-next-line no-unused-vars
  const { pathname, search } = useLocation();

  const content = useSelector((state) => state.content.data);

  const previewImage = usePreviewImage(pathname);

  const previewImageUrl = previewImage?.scales?.preview?.download;

  const contentType = content?.['@type'];
  const isHomePage = contentType === 'Plone Site' || contentType === 'LRF';
  const isSearch = pathname === `/${intl.locale}/search`;
  const cmsView = isCmsUi(pathname);
  const homePageView = isHomePage && !cmsView && !isSearch;
  const [inView, setInView] = React.useState();

  return (
    <div className="portal-top">
      {homePageView && <BodyClass className="homepage-view" />}
      {!cmsView && !isSearch && <BodyClass className="has-image" />}
      {!((cmsView && isSearch) || isHomePage) && (
        <BodyClass className="has-hero-section" />
      )}
      {isSearch && <BodyClass className="has-hero-section" />}

      {/* Added when applying the changes of the RSH */}
      <div className="right-section">
        <Navigation pathname={pathname} navigation={navigationItems} />
      </div>
      {/*  */}
      <div
        className={cx(
          'header-wrapper',
          homePageView ? 'homepage' : 'contentpage',
          inView ? 'header-in-view' : 'header-out-of-view fadeInDown',
        )}
        role="banner"
      >
        <div className="header">
          <div
            className={`logo-nav-wrapper ${
              homePageView ? 'home-nav' : 'page-nav'
            }`}
          >
            <div className="logo">
              <Logo black={content?.hide_top_image} />
            </div>

            <div className="right-section">
              <Navigation pathname={pathname} navigation={navigationItems} />
            </div>
          </div>
        </div>
      </div>
      <div id="header-spacer"></div>
      <InView
        as="div"
        className="header-visibility-sensor"
        onChange={(inView, entry) => setInView(inView)}
      >
        {' '}
      </InView>

      {!((cmsView && isSearch) || isHomePage) && (
        <div className="header-bg">
          <div className="header-container">
            <HeroSection image_url={previewImageUrl} content={content} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
