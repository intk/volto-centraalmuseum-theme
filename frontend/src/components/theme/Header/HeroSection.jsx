import React from 'react';
import { Container } from 'semantic-ui-react';
import { BodyClass } from '@plone/volto/helpers';
import Image from '../../Image/Image';
// eslint-disable-next-line no-unused-vars
import { defineMessages, useIntl } from 'react-intl';
import { When } from '@package/customizations/components/theme/View/EventDatesInfo';

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
    content?.['@type'] === 'Event' || content?.['@type'] === 'Exhibition';
  const endDate = new Date(end || Date.now());
  const startDate = new Date(start || Date.now());

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
            <div className="header-title-dates">
              <div className="hero-dates-wrapper">
                {content['@type'] === 'Event' ||
                content['@type'] === 'Exhibition' ? (
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
                <Container>
                  {description && (
                    <p className="content-description">{description}</p>
                  )}
                </Container>
              </div>
            </div>
          </>
        ) : (
          <div className="herosection-missing-image"></div>
        )}
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
