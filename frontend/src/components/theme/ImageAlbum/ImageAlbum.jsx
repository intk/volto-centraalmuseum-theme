import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Modal, Image } from 'semantic-ui-react';
import { flattenToAppURL } from '@plone/volto/helpers';
import { GET_CONTENT } from '@plone/volto/constants/ActionTypes';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './image-album.less';
import loadable from '@loadable/component';
import { debounce } from 'lodash'; // Import debounce from lodash
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  view: {
    id: 'view',
    defaultMessage: 'BEKIJK',
  },
});

const Slider = loadable(() => import('react-slick'));
const MAX_THUMBS = 1;

const getContent = (url, subrequest) => {
  const query = { b_size: 1000000 };
  let qs = Object.keys(query)
    .map((key) => key + '=' + query[key])
    .join('&');
  return {
    type: GET_CONTENT,
    subrequest,
    request: {
      op: 'get',
      path: `${url}${qs ? `?${qs}` : ''}`,
    },
  };
};

const ImageAlbum = (props) => {
  const pathname = useSelector((state) => state.router.location.pathname);
  const slideshowPath = `${pathname}/slideshow`;
  const id = `full-items@${slideshowPath}`;

  const dispatch = useDispatch();

  const [albumItems, setAlbumItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const sliderRef = useRef(null);

  useEffect(() => {
    const fetchContentConditionally = async () => {
      try {
        const response = await fetch(
          `/++api++/${pathname}/@@has_fallback_image`,
        );
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        if (data.hasFallbackImage) {
          const action = getContent(slideshowPath, id);
          const content = await dispatch(action);

          setAlbumItems(content.items || []);
        } else {
          setAlbumItems([]);
        }
      } catch (error) {
        setAlbumItems([]);
      }
    };

    // Call the async function
    fetchContentConditionally();
  }, [dispatch, id, slideshowPath, pathname]);

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
          width="35"
          height="30"
          viewBox="0 0 85 85"
        >
          <path
            d="M50.2548,48.3175l3.1236-3.1165,7.5786,7.56,3.1236,3.1156v.0009l-3.124,3.1165h0l-5.0458,5.034v-.0009l-.0005.0009L45.2085,53.3514l3.1236-3.1165,7.5782,7.56,1.9222-1.9175ZM38.591,36.6825,48.3317,46.4l3.1241-3.1165-9.7412-9.7174ZM85,77.283l-.159.155.0212.0212L77.4514,85H43.4729l-7.568-7.5408L43.4729,70H70V43.426l7.432-7.5408L85,43.426ZM70,73.2175H44.813l-3.4685,3.5352H70Zm6.7676-31.9119-3.5352,3.4559V70h3.5352ZM46.41,48.3175,36.6683,38.6l-3.1241,3.1165,9.7412,9.7174ZM41.7245,15H15V41.3775L7.5685,48.9183,0,41.3775V7.5214L7.5685.1374,7.59.1586,7.7455,0h33.979l7.568,7.5408ZM11.7676,15H8.2324V43.4989l3.5352-3.4569Zm28.6163-3.2166,3.469-3.5352H15v3.5343ZM27.1675,29.1224,29.09,27.2049l7.5786,7.5592,3.1241-3.1164-7.5786-7.5593h0L29.09,20.9719l-5.0468,5.034h0l-.864.8614-2.26,2.2551h0L31.6221,39.7981l3.1236-3.1165Z"
            fill="#216d6a"
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

  const thumbsToShow = albumItems.slice(1, MAX_THUMBS);
  const moreImagesLength =
    albumItems.length > MAX_THUMBS ? albumItems.length - MAX_THUMBS : null;

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
    if (albumItems.length) {
      setActiveSlideIndex(0);
      setOpen(true);
    }
  };

  const intl = useIntl();

  return (
    <div className="image-album">
      <div
        tabIndex={0}
        role="button"
        onKeyDown={handleClick}
        onClick={handleClick}
        className="preview-image-wrapper"
      >
        {props.image === 'false' ? (
          <button onClick={() => setOpen(true)} className={`button button1`}>
            {intl.formatMessage(messages.view)}
          </button>
        ) : (
          <div className="imagethumb" style={{ position: 'relative' }}>
            <Image
              key="prev-image"
              src={
                albumItems[0]
                  ? flattenToAppURL(
                      `${albumItems[0]?.['@id']}/@@images/${
                        albumItems[0]?.image_field || 'image'
                      }/great`,
                    )
                  : ''
              }
              alt={albumItems[0]?.title}
              className="modal-slide-img"
            />
            <CustomExpandButton
              onClick={() => setOpen(true)}
              className="expandbutton"
            />
          </div>
        )}
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
                  albumItems[0]
                    ? flattenToAppURL(
                        `${albumItems[0]?.['@id']}/@@images/${
                          albumItems[0]?.image_field || 'image'
                        }/great`,
                      )
                    : ''
                }
                alt={albumItems[0]?.title}
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
            {albumItems.map((item, i) => (
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
            {activeSlideIndex + 1}/{albumItems.length}
          </div>
        </Modal.Content>
      </Modal>
    </div>
  );
};

export default ImageAlbum;
