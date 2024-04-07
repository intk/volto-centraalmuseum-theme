import React from 'react';
import PropTypes from 'prop-types';
import { UniversalLink } from '@plone/volto/components';
import ArtworkPreview from '../../theme/ArtworkPreview/ArtworkPreview';
// import { useIntl } from 'react-intl';
import Slider from 'react-slick';
import './less/CollectionBrowseTemplate.less';
import './less/CollectionSliderTemplate.less';

// const messages = defineMessages({
//   collectie_online: {
//     id: 'collectie_online',
//     defaultMessage: 'COLLECTIE ONLINE',
//   },
//   browse_collection: {
//     id: 'browse_collection',
//     defaultMessage: 'Blader door de collectie',
//   },
// });

const Card = ({ item, showDescription = true }) => {
  return (
    <div className="plone-item-card">
      {/* <BodyClass className="masonary-listing-page" /> */}
      <UniversalLink href={item['@id']} className="plone-item-card-link">
        <div className="content">
          <div className="image-description-wrapper">
            <ArtworkPreview {...item} />
            <div className="title-description">
              <h3 className="plone-item-title">
                <p>{item.title}</p>
              </h3>
              <div className="desctiption">
                <div className="description">
                  <p>
                    {(item.artwork_author?.length > 0 || item.dating) && (
                      <span className="item-description dash">— </span>
                    )}
                    {item.artwork_author && (
                      <span className="item-description">
                        {item.artwork_author[0]}
                      </span>
                    )}
                    {item.artwork_author &&
                      item.artwork_author?.length > 0 &&
                      item.dating && (
                        <span className="item-description">, </span>
                      )}
                    {item.dating && (
                      <span className="item-description">
                        {String(item.dating.split('(')[0])}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UniversalLink>
    </div>
  );
};

const CollectionBrowseTemplate = (props) => {
  const { items } = props;
  // const intl = useIntl();
  // const titleInView = useInViewHomepage(ref);
  let settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 3,
    initialSlide: 0,
    nextArrow: (
      <svg
        width="58px"
        height="34px"
        viewBox="0 0 58 34"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>cloud-down-path</title>
        <desc>Created with Sketch.</desc>
        <defs></defs>
        <g
          id="design"
          stroke="none"
          stroke-width="1"
          fill="none"
          fill-rule="evenodd"
        >
          <g
            id="01-home"
            transform="translate(-1151.000000, -1374.000000)"
            fill="#4d4d4d"
          >
            <g id="expo-1" transform="translate(70.000000, 899.000000)">
              <g id="Group-3" transform="translate(690.000000, 53.000000)">
                <path
                  d="M418.180606,462.378208 L418.180606,411.812897 C418.180606,410.811661 418.995177,410 420,410 C421.004823,410 421.819394,410.811661 421.819394,411.812897 L421.819394,462.378208 L434.396113,450.153846 C434.797128,449.890828 435.295428,449.821001 435.753691,449.963609 C436.211954,450.106217 436.581807,450.446207 436.761325,450.889882 C437.244044,451.840049 436.976051,452.998223 436.124537,453.641859 L421.400933,467.309286 C421.184111,467.537572 421.029855,467.670373 420.855115,467.771575 C420.649461,467.889588 420.418894,467.95789 420.181939,467.970994 C420.054582,467.983684 420.036388,468 420,468 C419.836648,467.965628 419.818369,467.961985 419.799867,467.960116 C419.638236,467.953306 419.47865,467.921503 419.326824,467.865846 C419.272242,467.838652 419.217661,467.796956 419.144885,467.764323 C419.022289,467.697072 418.90652,467.618144 418.7992,467.528647 C418.744618,467.47426 418.70823,467.396305 418.653649,467.334667 L403.875463,453.629169 C403.023949,452.985533 402.755956,451.827359 403.238675,450.877192 C403.420807,450.435696 403.791771,450.09866 404.249738,449.958602 C404.707704,449.818543 405.204548,449.89018 405.603887,450.153846 L418.180606,462.378208 Z"
                  id="cloud-down-path"
                  transform="translate(420.000000, 439.000000) rotate(-90.000000) translate(-420.000000, -439.000000) "
                ></path>
              </g>
            </g>
          </g>
        </g>
      </svg>
    ),
    prevArrow: (
      <svg
        width="58px"
        height="34px"
        viewBox="0 0 58 34"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>cloud-down-path</title>
        <desc>Created with Sketch.</desc>
        <defs></defs>
        <g
          id="design"
          stroke="none"
          stroke-width="1"
          fill="none"
          fill-rule="evenodd"
        >
          <g
            id="01-home"
            transform="translate(-760.000000, -1374.000000)"
            fill="#4d4d4d"
          >
            <g id="expo-1" transform="translate(70.000000, 899.000000)">
              <g id="Group-3" transform="translate(690.000000, 53.000000)">
                <path
                  d="M27.1806062,462.378208 L27.1806062,411.812897 C27.1806062,410.811661 27.9951765,410 29,410 C30.0048235,410 30.8193938,410.811661 30.8193938,411.812897 L30.8193938,462.378208 L43.3961132,450.153846 C43.7971277,449.890828 44.2954284,449.821001 44.7536913,449.963609 C45.2119542,450.106217 45.5818074,450.446207 45.7613251,450.889882 C46.2440445,451.840049 45.9760514,452.998223 45.1245373,453.641859 L30.4009332,467.309286 C30.1841108,467.537572 30.0298551,467.670373 29.8551151,467.771575 C29.6494613,467.889588 29.4188943,467.95789 29.1819394,467.970994 C29.0545818,467.983684 29.0363879,468 29,468 C28.8366477,467.965628 28.8183692,467.961985 28.7998667,467.960116 C28.6382362,467.953306 28.4786502,467.921503 28.3268243,467.865846 C28.2722425,467.838652 28.2176607,467.796956 28.1448849,467.764323 C28.0222893,467.697072 27.9065203,467.618144 27.7992001,467.528647 C27.7446183,467.47426 27.7082304,467.396305 27.6536486,467.334667 L12.8754627,453.629169 C12.0239486,452.985533 11.7559555,451.827359 12.2386749,450.877192 C12.4208069,450.435696 12.7917712,450.09866 13.2497375,449.958602 C13.7077039,449.818543 14.2045485,449.89018 14.6038868,450.153846 L27.1806062,462.378208 Z"
                  id="cloud-down-path"
                  transform="translate(29.000000, 439.000000) scale(-1, 1) rotate(-90.000000) translate(-29.000000, -439.000000) "
                ></path>
              </g>
            </g>
          </g>
        </g>
      </svg>
    ),
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          initialSlide: 2,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="collection-slider-template">
      <div className="collectie-header">
        <div>
          <p className="collectie_online">
            {/* {intl.formatMessage(messages.collectie_online)} */}
            {props?.headline}
          </p>
          <UniversalLink
            className="browse_collection"
            href={props?.linkHref[0]?.['@id']}
          >
            {/* {intl.formatMessage(messages.browse_collection)} */}
            {props?.linkTitle}
          </UniversalLink>
        </div>
      </div>
      <div className="content-wrapper">
        <Slider {...settings}>
          {items.map((item, index) => (
            <Card key={index} item={item} showDescription={true} />
          ))}
        </Slider>
      </div>
    </div>
  );
};

CollectionBrowseTemplate.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
};

export default CollectionBrowseTemplate;
