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

const ObjectBlockView = (props) => {
  let reactSwipeEl;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
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

  const zoomIn = () => {
    if (zoomLevel < 2) {
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
                    <img
                      src={`${item.url}/@@images/image`}
                      loading="lazy"
                      alt="test"
                      style={{ transform: `scale(${zoomLevel})` }}
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
            <button className="button share" onClick={togglePopup}>
              <GoShare
                icon
                className="Sharebutton"
                aria-label="share button"
                height="2em"
              />
              {popupVisible && (
                <div className="social-media-popup">
                  {socialLinks.map((link, index) => (
                    <div key={index}>
                      <a
                        aria-label={link.ariaLabel}
                        data-linktype="external"
                        target="_blank"
                        href={link.href}
                        rel="noreferrer"
                        data-val={link.href}
                      >
                        <link.IconComponent />
                      </a>
                    </div>
                  ))}
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
