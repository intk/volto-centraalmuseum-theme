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
import { UniversalLink } from '@plone/volto/components';

// const messages = defineMessages({
//   permanent: {
//     id: 'permanent',
//     defaultMessage: 'VASTE COLLECTIE',
//   },
// });

const messages = defineMessages({
  daily: {
    id: 'daily',
    defaultMessage: 'dagelijks',
  },
  weekly: {
    id: 'weekly',
    defaultMessage: 'wekelijks',
  },
  monthly: {
    id: 'monthly',
    defaultMessage: 'maandelijks',
  },
});

// const getDateRangeDescription = (intl, start, end) => {
//   const format = (date, options) =>
//     new Intl.DateTimeFormat(intl.locale, options).format(date);
//   const defaultOptions = { day: 'numeric', month: 'short', year: 'numeric' };
//   const dayOptions = { day: 'numeric' };
//   if end?.getFullYear() === 2100) {
//     return intl.formatMessage(messages.permanent);
//   }

//   if (
//     !end ||
//     (start.getDate() === end.getDate() &&
//       start.getMonth() === end.getMonth() &&
//       start.getFullYear() === end.getFullYear())
//   ) {
//     return format(start, defaultOptions);
//   }

//   if (
//     start.getMonth() === end.getMonth() &&
//     start.getFullYear() === end.getFullYear()
//   ) {
//     return `${format(start, dayOptions)} — ${format(end, defaultOptions)}`;
//   }

//   return `${format(start, defaultOptions)} — ${format(end, defaultOptions)}`;
// };

function HeroSection(props) {
  const intl = useIntl();
  // eslint-disable-next-line no-unused-vars
  const { image_url, content } = props;
  const {
    title,
    description,
    preview_caption,
    multiple_content_view,
    // start,
    // end,
  } = content || {};

  const isEvent =
    content?.['@type'] === 'Event' ||
    content?.['@type'] === 'exhibition' ||
    content?.['@type'] === 'News Item';
  // const endDate = new Date(end || Date.now());
  // const startDate = new Date(start || Date.now());
  const fallback_image =
    content &&
    flattenToAppURL(content['@id'] + '/@@fallback-image/images/great');

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

  let recurrenceText;
  const hasDailyFrequency = props.content?.recurrence?.includes('FREQ=DAILY');
  const hasWeeklyFrequency = props.content?.recurrence?.includes('FREQ=WEEKLY');
  const hasMonthlyFrequency = props.content?.recurrence?.includes(
    'FREQ=MONTHLY',
  );

  if (hasDailyFrequency) {
    recurrenceText = intl.formatMessage(messages.daily);
  } else if (hasWeeklyFrequency) {
    recurrenceText = intl.formatMessage(messages.weekly);
  } else if (hasMonthlyFrequency) {
    recurrenceText = intl.formatMessage(messages.monthly);
  }

  const end = new Date(content?.end);
  const isPermanent = end?.getFullYear() === 2100;
  const recurrence = props.content?.recurrence;
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
    if (isEvent && !cmsView) {
      fetchContent();
    }
  }, [dispatch, id, slideshowPath, pathname, content, cmsView, isEvent]);

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
                alt={preview_caption || title}
              />

              {preview_caption && (
                <figcaption className="content-image-caption">
                  {preview_caption}
                </figcaption>
              )}
            </figure>
          </>
        ) : albumItems.length > 0 && isEvent ? (
          <>
            <BodyClass className="has-hero-image" />
            <figure className="herosection-content-image document-image">
              <Image
                src={fallback_image}
                width="100vw"
                height="90vh"
                size="large"
                image=""
                alt={preview_caption || title}
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
            {content && isEvent ? (
              <div className="hero-dates">
                {props?.content?.recurrence == null ? (
                  <When
                    start={content.start}
                    end={content.end}
                    whole_day={content.whole_day}
                    open_end={content.open_end}
                    type={content?.['@type']}
                    published={content?.effective || content?.created}
                  />
                ) : (
                  recurrenceText
                )}
              </div>
            ) : (
              ''
            )}
          </div>
          <h1 className="hero-title-floating">{title}</h1>
          <div className="description-container">
            <div className="buttons">
              {(isPermanent || recurrence) && (
                <UniversalLink
                  href={`https://tickets.centraalmuseum.nl/${intl.locale}/tickets`}
                >
                  <button className={`ticket-button`}>TICKETS</button>
                </UniversalLink>
              )}
              {albumItems.length > 1 && (
                <ImageAlbum
                  items={albumItems}
                  itemTitle={props.content?.objectTitle}
                  image="false"
                  item-type={content?.['@type']}
                />
              )}
            </div>
            <Container>
              {description && !isPermanent && (
                <p className="content-description">{description}</p>
              )}
            </Container>
          </div>
        </div>
      </div>
      {/* {title && albumItems?.length === 0 && (
        <Container>
          <h1 className="documentFirstHeading">{title}</h1>
          {startDate && isEvent && (
            <p className="hero-dates">
              <When
                start={content.start}
                end={content.end}
                whole_day={content.whole_day}
                open_end={content.open_end}
              />
            </p>
          )}
        </Container>
      )} */}
    </div>
  );
}

export default HeroSection;
