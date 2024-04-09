import React, { useState, useRef, useCallback } from 'react';
import { Modal, Image } from 'semantic-ui-react';
import { flattenToAppURL } from '@plone/volto/helpers';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './image-album.less';
import loadable from '@loadable/component';
import { debounce } from 'lodash'; // Import debounce from lodash

const Slider = loadable(() => import('react-slick'));
const MAX_THUMBS = 1;

const ImageAlbum = (props) => {
  const [open, setOpen] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const sliderRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetIndex = useCallback(
    debounce((newIndex) => {
      setActiveSlideIndex(newIndex);
    }, 100),
    [],
  );

  // Custom method to change slide
  const changeSlide = useCallback(
    (newIndex) => {
      debouncedSetIndex(newIndex); // Use debounced method to set index
      sliderRef.current.slickGoTo(newIndex); // Change the slide
    },
    [debouncedSetIndex],
  );

  const CustomCloseIcon = ({ onClick }) => {
    const handleKeyDown = (event) => {
      // Trigger click on Enter or Space key press
      if (event.key === 'Enter' || event.key === ' ') {
        onClick();
      }
    };

    return (
      <div
        className="icon close"
        role="button"
        tabIndex="0"
        onKeyDown={handleKeyDown}
        onClick={onClick}
        // style={{ display: 'block', cursor: 'pointer' }}
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          x="0px"
          y="0px"
          width="35"
          height="30"
          viewBox="0,0,256,256"
          fill="#000"
          style={{ opacity: '0.5' }}
        >
          <g
            fill="none"
            fill-rule="nonzero"
            stroke="none"
            stroke-width="none"
            stroke-linecap="butt"
            stroke-linejoin="none"
            stroke-miterlimit="10"
            stroke-dasharray=""
            stroke-dashoffset="0"
            font-family="none"
            font-weight="none"
            font-size="none"
            text-anchor="none"
            style={{ mixBlendMode: 'normal' }}
          >
            <path
              transform="scale(16,16)"
              d="M3.10156,2.39844l4.89844,4.89453l5.25,-5.25l0.70703,0.70703l-5.25,5.25l4.89844,4.89453l0.35156,0.35547l-0.70703,0.70703l-0.35547,-0.35156l-4.89453,-4.89844l-5.25,5.25l-0.70703,-0.70703l5.25,-5.25l-4.89453,-4.89844l-0.35547,-0.35156l0.70703,-0.70703z"
              id="strokeMainSVG"
              fill="#dddddd"
              stroke="#000"
              stroke-width="1"
              stroke-linejoin="round"
            ></path>
            <g
              transform="scale(16,16)"
              fill="#000000"
              stroke="none"
              stroke-width="1"
              stroke-linejoin="miter"
            >
              <path d="M2.75,2.04297l-0.70703,0.70703l0.35547,0.35156l4.89453,4.89844l-5.25,5.25l0.70703,0.70703l5.25,-5.25l4.89453,4.89844l0.35547,0.35156l0.70703,-0.70703l-0.35156,-0.35547l-4.89844,-4.89453l5.25,-5.25l-0.70703,-0.70703l-5.25,5.25l-4.89844,-4.89453z"></path>
            </g>
          </g>
        </svg>
      </div>
    );
  };

  const CustomExpandButton = (props) => {
    const { className, onClick } = props;

    // Function to handle key down events
    const handleKeyDown = (event) => {
      // Trigger click on Enter or Space key press
      if (event.key === 'ArrowLeft' || event.key === ' ') {
        onClick();
      }
    };

    return (
      <div
        className={className}
        style={{
          position: 'absolute',
          cursor: 'pointer',
          top: '10px',
          right: '12px',
        }}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex="0" // Make the div focusable
        role="button" // Indicate that the div is a button
        aria-label="Previous Slide" // Accessibility label for screen readers
      >
        <svg
          id="expand-svg"
          data-name="Layer 1"
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 22 22"
        >
          <path
            d="M3.4 20.2L9 14.5 7.5 13l-5.7 5.6L1 14H0v7.5l.5.5H8v-1l-4.6-.8M18.7 1.9L13 7.6 14.4 9l5.7-5.7.5 4.7h1.2V.6l-.5-.5H14v1.2l4.7.6"
            fill="#fff"
          ></path>
        </svg>
      </div>
    );
  };
  const CustomPrevArrow = (props) => {
    const { className, style, onClick } = props;

    // Function to handle key down events
    const handleKeyDown = (event) => {
      // Trigger click on Enter or Space key press
      if (event.key === 'ArrowLeft' || event.key === ' ') {
        onClick();
      }
    };

    return (
      <div
        className={className}
        style={{ ...style, display: 'block' }}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex="0" // Make the div focusable
        role="button" // Indicate that the div is a button
        aria-label="Previous Slide" // Accessibility label for screen readers
      >
        <svg
          width="70"
          height="90"
          viewBox="0 0 50 85"
          fill="none"
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
              fill="#282931"
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
      </div>
    );
  };

  const CustomNextArrow = (props) => {
    const { className, style, onClick } = props;

    // Function to handle key down events
    const handleKeyDown = (event) => {
      // Trigger click on Enter or Space key press
      if (event.key === 'ArrowRight' || event.key === ' ') {
        onClick();
      }
    };

    return (
      <div
        className={className}
        style={{ ...style, display: 'block' }}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex="0" // Make the div focusable
        role="button" // Indicate that the div is a button
        aria-label="Previous Slide" // Accessibility label for screen readers
      >
        <svg
          width="70"
          height="90"
          viewBox="0 0 50 85"
          fill="none"
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
              fill="#282931"
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
      </div>
    );
  };

  const thumbsToShow = props.items.slice(1, MAX_THUMBS);
  const moreImagesLength =
    props.items.length > MAX_THUMBS ? props.items.length - MAX_THUMBS : null;

  const carouselSettings = {
    // afterChange: (current) => setActiveSlideIndex(current),
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    dots: false,
    // arrows: true,
    adaptiveHeight: true,
    autoplay: false,
    fade: false,
    useTransform: false,
    lazyLoad: 'ondemand',
    initialSlide: activeSlideIndex,
    nextArrow: <CustomNextArrow />,
    prevArrow: <CustomPrevArrow />,
  };

  const handleClick = () => {
    if (props.items.length) {
      setActiveSlideIndex(0);
      setOpen(true);
    }
  };

  return (
    <div className="listing-image-album">
      <div
        tabIndex={0}
        role="button"
        onKeyDown={handleClick}
        onClick={handleClick}
        className="preview-image-wrapper"
      >
        <div className="imagethumb" style={{ position: 'relative' }}>
          <Image
            key="prev-image"
            src={
              props.items[0]
                ? flattenToAppURL(
                    `${props.items[0]?.['@id']}/@@images/${
                      props.items[0]?.image_field || 'image'
                    }/great`,
                  )
                : ''
            }
            alt={props.items[0]?.title}
            className="modal-slide-img"
          />
          <CustomExpandButton
            onClick={() => setOpen(true)}
            className="expandbutton"
          />
        </div>
      </div>

      {thumbsToShow.length > 0 && (
        <div className="thumbnails">
          {thumbsToShow.map((thumb, i) => (
            <div
              key={i}
              tabIndex={0}
              role="button"
              onKeyDown={() => {
                setActiveSlideIndex(i + 1);
                setOpen(true);
              }}
              onClick={() => {
                setActiveSlideIndex(i + 1);
                setOpen(true);
              }}
            >
              <Image
                key={i}
                src={
                  props.items[0]
                    ? flattenToAppURL(
                        `${props.items[0]?.['@id']}/@@images/${
                          props.items[0]?.image_field || 'image'
                        }/great`,
                      )
                    : ''
                }
                alt={props.items[0]?.title}
                className="modal-slide-img"
              />
            </div>
          ))}
          {moreImagesLength && (
            <div className="images-number">
              <div>+{moreImagesLength}</div>
            </div>
          )}
        </div>
      )}

      <Modal
        closeIcon={<CustomCloseIcon onClick={() => setOpen(false)} />}
        // closeIcon
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        className="slider-modal"
      >
        <Modal.Content>
          <Slider
            {...carouselSettings}
            ref={sliderRef}
            beforeChange={(current, next) => changeSlide(next)}
          >
            {props.items.map((item, i) => (
              <Image
                key={i}
                src={
                  item
                    ? flattenToAppURL(
                        `${item?.['@id']}/@@images/${
                          item?.image_field || 'image'
                        }/great`,
                      )
                    : ''
                }
                alt={item?.title}
                className="modal-slide-img"
              />
            ))}
          </Slider>
          <div className="slide-image-count">
            {activeSlideIndex + 1}/{props.items.length}
          </div>
        </Modal.Content>
      </Modal>
    </div>
  );
};

export default ImageAlbum;
