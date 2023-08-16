import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import './css/objectblock.less';
import ReactSwipe from 'react-swipe';
import { BsArrowRight } from 'react-icons/bs';
import { BsArrowLeft } from 'react-icons/bs';

const ObjectBlockView = (props) => {
  let reactSwipeEl;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

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
            <button onClick={zoomIn}>+</button>
            <button onClick={zoomOut}>-</button>
          </div>
        </div>
        <div className="rawdata">{props.content?.rawdata}</div>
      </div>
    </div>
  );
};

export default injectIntl(ObjectBlockView);
