import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import './css/objectblock.less';
import ReactSwipe from 'react-swipe';
import { BsArrowRight, BsArrowLeft } from 'react-icons/bs';
import { SlMagnifierAdd, SlMagnifierRemove } from 'react-icons/sl';
import { GoShare, GoDownload } from 'react-icons/go';
import {
  TiSocialTwitter,
  TiSocialFacebook,
  TiSocialYoutube,
} from 'react-icons/ti';
import { SiInstagram } from 'react-icons/si';
import InnerImageZoom from 'react-inner-image-zoom';
import fbbutton from './assets/soc_fb_wBG.svg';
import twbutton from './assets/share_button_twitter.svg';

const ObjectBlockView = (props) => {
  let reactSwipeEl;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1.5);
  const [dataExpand, setDataExpand] = useState(false);
  const currentImageUrl = props.content?.items[currentIndex]?.url;
  const downloadLink = `${currentImageUrl}/@@images/image`;

  const [popupVisible, setPopupVisible] = useState(false);

  const socialLinks = [
    {
      href: 'https://twitter.com/centraalmuseum?lang=en',
      ariaLabel: 'Share on Twitter',
      IconComponent: TiSocialTwitter,
    },
    {
      href: 'https://www.facebook.com/centraalmuseum/',
      ariaLabel: 'Share on Facebook',
      IconComponent: TiSocialFacebook,
    },
    {
      href: 'https://www.instagram.com/centraalmuseum/',
      ariaLabel: 'Share on Instagram',
      IconComponent: SiInstagram,
    },
    {
      href: 'https://www.youtube.com/channel/UCc2cHNtGFZ5pzccEXemfL7g',
      ariaLabel: 'Share on Youtube',
      IconComponent: TiSocialYoutube,
    },
  ];

  const togglePopup = () => {
    setPopupVisible(!popupVisible);
  };
  const closePopup = () => {
    setPopupVisible(false);
  };

  const zoomIn = () => {
    if (zoomLevel < 4) {
      setZoomLevel(zoomLevel + 0.2);
    }
  };

  const zoomOut = () => {
    if (zoomLevel > 1) {
      setZoomLevel(zoomLevel - 0.2);
    }
  };

  const expandData = () => {
    setDataExpand(!dataExpand);
  };

  return (
    <div id="object-block">
      <div className="object-wrapper">
        <div id="swipe-slider">
          <ReactSwipe
            className="carousel"
            swipeOptions={{
              continuous: false,
              transitionEnd: (index) => {
                setCurrentIndex(index);
                setZoomLevel(1);
              },
            }}
            ref={(el) => (reactSwipeEl = el)}
          >
            {props.content?.items.map((item, index) => {
              if (item['@type'] === 'Image') {
                return (
                  <div className="zoom-container">
                    <InnerImageZoom
                      key={zoomLevel}
                      src={`${item.url}/@@images/image`}
                      moveType="drag"
                      zoomScale={zoomLevel}
                    />
                  </div>
                );
              }
              return null;
            })}
          </ReactSwipe>
          <div className="leftrightbuttons">
            <button onClick={() => reactSwipeEl.prev()}>
              <BsArrowLeft
                icon
                className="leftarrow"
                aria-label="left arrow"
              ></BsArrowLeft>
            </button>
            <span className="paginator">
              <p>{`${currentIndex + 1}/${props.content?.items_total}`}</p>
            </span>{' '}
            <button onClick={() => reactSwipeEl.next()}>
              <BsArrowRight
                icon
                className="rightarrow"
                aria-label="right arrow"
                height="2em"
              ></BsArrowRight>
            </button>
          </div>
          <div className="buttons">
            <button className="button" onClick={expandData}>
              + Objectgegevens
            </button>
            <button
              className="button share"
              onClick={togglePopup}
              onMouseLeave={closePopup}
            >
              <GoShare
                icon
                className="Sharebutton"
                aria-label="share button"
                height="2em"
              />
              {popupVisible && (
                <div
                  className="social-media-popup"
                  role="tooltip"
                  id="popover825468"
                >
                  <h3 className="popover-title">Delen</h3>
                  <div className="popover-content">
                    <div className="row facebook-row">
                      <a
                        onclick="return !window.open(this.href, 'Facebook', 'width=500,height=500')"
                        className="share-btn-social"
                        href="https://www.facebook.com/sharer/sharer.php?u=https://www.centraalmuseum.nl/nl/collectie/10786-de-koppelaarster-gerard-van-honthorst"
                      >
                        <img
                          className="share-button"
                          alt="Delen op Facebook"
                          src={fbbutton}
                        />
                      </a>
                    </div>

                    <div className="row twitter-row">
                      <a
                        onclick="return !window.open(this.href, 'Twitter', 'width=500,height=500')"
                        className="share-btn-social"
                        href="http://twitter.com/share?text=De koppelaarster&amp;url=https://www.centraalmuseum.nl/nl/collectie/10786-de-koppelaarster-gerard-van-honthorst"
                      >
                        <img
                          className="share-button"
                          alt="Delen op Twitter"
                          src={twbutton}
                        />
                      </a>
                    </div>

                    <div className="row pinterest-row">
                      <a
                        id="pinterest-btn"
                        href="http://www.pinterest.com/pin/create/button/?url=https://www.centraalmuseum.nl/nl/collectie/10786-de-koppelaarster-gerard-van-honthorst&amp;media=https://www.centraalmuseum.nl/nl/collectie/10786-de-koppelaarster-gerard-van-honthorst/slideshow/10786_10-tif/@@images/image/large"
                        data-pin-do="buttonPin"
                        data-pin-config="none"
                      >
                        <img
                          alt="Delen op Pinterest"
                          src="//assets.pinterest.com/images/pidgets/pinit_fg_en_rect_gray_20.png"
                          href="http://www.pinterest.com/pin/create/button/?url=https://www.centraalmuseum.nl/nl/collectie/10786-de-koppelaarster-gerard-van-honthorst"
                        />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </button>
            <a
              className="button"
              href={downloadLink}
              role="button"
              aria-label="download button"
            >
              <GoDownload
                icon
                className="Downloadbutton"
                aria-label="download button"
                height="2em"
              />
            </a>
            <button onClick={zoomIn} className="button">
              <SlMagnifierAdd
                icon
                className="MagnifierPlus"
                aria-label="magnifier plus"
                height="2em"
              />
            </button>
            <button onClick={zoomOut} className="button">
              <SlMagnifierRemove
                icon
                className="MagnifierPlus"
                aria-label="magnifier plus"
                height="2em"
              />
            </button>
          </div>
        </div>
        <div className={`rawdata-section ${dataExpand ? 'expanded' : ''}`}>
          <p>{props.content?.rawdata}</p>
        </div>{' '}
      </div>
    </div>
  );
};

export default injectIntl(ObjectBlockView);
