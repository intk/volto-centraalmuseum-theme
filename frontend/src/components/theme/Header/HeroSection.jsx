import React, { useState, useEffect } from 'react';
import { Container } from 'semantic-ui-react';
import { BodyClass } from '@plone/volto/helpers';
import Image from '../../Image/Image';
// eslint-disable-next-line no-unused-vars
import { defineMessages, useIntl } from 'react-intl';
import { When } from '@package/customizations/components/theme/View/EventDatesInfo';
import { flattenToAppURL } from '@plone/volto/helpers';
import ImageAlbum from '../../theme/ImageAlbum/ImageAlbum';
import { useDispatch, useSelector } from 'react-redux';
import { GET_CONTENT } from '@plone/volto/constants/ActionTypes';
import { isCmsUi } from '@plone/volto/helpers';

const getDateRangeDescription = (lang, start, end) => {
  const format = (date, options) =>
    new Intl.DateTimeFormat(lang, options).format(date);
  const defaultOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const dayOptions = { day: 'numeric' };

  if (
    !end ||
    (start.getDate() === end.getDate() &&
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear())
  ) {
    return format(start, defaultOptions);
  }

  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${format(start, dayOptions)} — ${format(end, defaultOptions)}`;
  }

  return `${format(start, defaultOptions)} — ${format(end, defaultOptions)}`;
};

function HeroSection(props) {
  const intl = useIntl();
  const { image_url, content } = props;
  const {
    title,
    description,
    preview_caption,
    multiple_content_view,
    start,
    end,
  } = content || {};

  const isEvent =
    content?.['@type'] === 'Event' || content?.['@type'] === 'exhibition';
  const endDate = new Date(end || Date.now());
  const startDate = new Date(start || Date.now());
  const fallback_image =
    content &&
    flattenToAppURL(content['@id'] + '/@@fallback-image/images/great');

  //Source of the error 404
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

  const pathname = useSelector((state) => state.router.location.pathname);
  const slideshowPath = `${pathname}/slideshow`;
  const id = `full-items@${slideshowPath}`;

  const dispatch = useDispatch();
  const cmsView = isCmsUi(pathname);

  const [albumItems, setAlbumItems] = useState([]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(
          `/++api++/${pathname}/@@has_fallback_image`,
        );
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        if (data.hasFallbackImage) {
          try {
            const action = getContent(slideshowPath, id);
            const contentActionResponse = await dispatch(action);
            const content = await contentActionResponse;

            if (content && content.items) {
              setAlbumItems(content.items);
            } else {
              setAlbumItems([]);
            }
          } catch (error) {
            setAlbumItems([]);
          }
        } else {
          setAlbumItems([]);
        }
      } catch (error) {}
    };
    if (content?.['@type'] === 'exhibition' && !cmsView) {
      fetchContent();
    }
  }, [dispatch, id, slideshowPath, pathname, content, cmsView]);

  return (
    <div className="herosection">
      {multiple_content_view && <BodyClass className="multiple-content-view" />}
      <div className="herosection-content-wrapper">
        {content?.preview_image ? (
          <>
            <BodyClass className="has-hero-image" />
            <figure className="herosection-content-image document-image">
              <Image
                image={content.preview_image}
                width="100vw"
                height="90vh"
              />

              {preview_caption && (
                <figcaption className="content-image-caption">
                  {preview_caption}
                </figcaption>
              )}
            </figure>
          </>
        ) : albumItems.length > 0 && content?.['@type'] === 'exhibition' ? (
          <>
            <BodyClass className="has-hero-image" />
            <figure className="herosection-content-image document-image">
              <Image
                src={fallback_image}
                width="100vw"
                height="90vh"
                size="large"
                image=""
              />
              {preview_caption && (
                <figcaption className="content-image-caption">
                  {preview_caption}
                </figcaption>
              )}
            </figure>
          </>
        ) : (
          <>
            <BodyClass className="hide-top-image"></BodyClass>
          </>
        )}

        <div className="header-title-dates">
          <div className="hero-dates-wrapper">
            {content &&
            (content['@type'] === 'Event' ||
              content['@type'] === 'exhibition') ? (
              <div className="hero-dates">
                <When
                  start={content.start}
                  end={content.end}
                  whole_day={content.whole_day}
                  open_end={content.open_end}
                />
              </div>
            ) : (
              ''
            )}
          </div>
          <h1 className="hero-title-floating">{title}</h1>
          <div className="description-container">
            {albumItems.length > 1 && (
              <ImageAlbum
                items={albumItems}
                itemTitle={props.content?.objectTitle}
                image="false"
              />
            )}
            <Container>
              {description && (
                <p className="content-description">{description}</p>
              )}
            </Container>
          </div>
        </div>
      </div>
      {title && !image_url && (
        <Container>
          <h1 className="documentFirstHeading">{title}</h1>
          {startDate && isEvent && (
            <p className="hero-dates">
              {getDateRangeDescription(intl.locale, startDate, endDate)}
            </p>
          )}
        </Container>
      )}
    </div>
  );
}

export default HeroSection;
