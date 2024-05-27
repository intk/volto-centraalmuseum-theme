/**
 * EventView view component.
 * @module components/theme/View/EventView
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  hasBlocksData,
  // flattenHTMLToAppURL,
  // getBaseUrl,
} from '@plone/volto/helpers';
// import { Image, Grid } from 'semantic-ui-react';
import RenderBlocks from '@plone/volto/components/theme/View/RenderBlocks';
// import { EventDetails } from '@plone/volto/components';
import { useDispatch, useSelector } from 'react-redux';
import config from '@plone/volto/registry';
import { getSchema } from '@plone/volto/actions';
import { Container as SemanticContainer } from 'semantic-ui-react';
import { isEqual } from 'lodash';
// import { getWidget } from '@plone/volto/helpers/Widget/utils';
import { defineMessages, useIntl } from 'react-intl';
import './css/exhibitionview.less';
import { BodyClass } from '@plone/volto/helpers';
import { isCmsUi } from '@plone/volto/helpers';

const messages = defineMessages({
  artist: {
    id: 'artist',
    defaultMessage: 'Vervaardiger',
  },
  title: {
    id: 'title',
    defaultMessage: 'Titel',
  },
  designer: {
    id: 'designer',
    defaultMessage: 'Vormgever',
  },
  location: {
    id: 'location',
    defaultMessage: 'Locatie',
  },
  objects: {
    id: 'objects',
    defaultMessage: 'Collectie in deze tentoonstelling',
  },
  noObjects: {
    id: 'noObjects',
    defaultMessage:
      'In deze tentoonstelling waren geen objecten uit de collectie van het Centraal Museum te zien',
  },
  question: {
    id: 'question',
    defaultMessage: 'Vragen?',
  },
  questionText: {
    id: 'questionText',
    defaultMessage:
      'Ziet u een fout? Of heeft u extra informatie over deze tentoonstelling? ',
  },
  letusknow: {
    id: 'letusknow',
    defaultMessage: 'Laat het ons weten!',
  },
  share: {
    id: 'share',
    defaultMessage: 'Delen',
  },
  details: {
    id: 'details',
    defaultMessage: 'Objectgegevens',
  },
  nowonview: {
    id: 'nowonview',
    defaultMessage: 'Nu in het museum',
  },
  notonview: {
    id: 'notonview',
    defaultMessage: 'Dit object is nu niet in het museum te zien',
  },
  documentation: {
    id: 'documentation',
    defaultMessage: 'Documentatie',
  },
  duurzameurl: {
    id: 'duurzameurl',
    defaultMessage: 'Duurzame url',
  },
  duurzameurltext: {
    id: 'duurzameurltext',
    defaultMessage:
      'Als u naar dit object wilt verwijzen gebruik dan de duurzame URL:',
  },
  showmore: {
    id: 'showmore',
    defaultMessage: 'Toon alles',
  },
  showless: {
    id: 'showless',
    defaultMessage: 'Toon minder',
  },
  permanent: {
    id: 'permanent',
    defaultMessage: 'VASTE COLLECTIE',
  },
});

const translations = {
  expired: {
    en: 'PAST EXHIBITION',
    nl: 'TENTOONSTELLING IS AFGELOPEN',
    de: 'VERLEDEN TENTOONSTELLING',
  },
};

function filterBlocks(content, types) {
  if (!(content.blocks && content.blocks_layout?.items)) return content;

  return {
    ...content,
    blocks_layout: {
      ...content.blocks_layout,
      items: content.blocks_layout.items.filter(
        (id) => types.indexOf(content.blocks[id]?.['@type']) === -1,
      ),
    },
  };
}

const getDateRangeDescription = (lang, start, end) => {
  const format = (date, options) =>
    new Intl.DateTimeFormat(lang.locale, options).format(date);
  const defaultOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const dayOptions = { day: 'numeric' };

  if (end?.getFullYear() === 2100) {
    return lang.formatMessage(messages.permanent);
  }

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

/**
 * EventView view component class.
 * @function EventView
 * @params {object} content Content object.
 * @returns {string} Markup of the component.
 */
const ExhibitionView = (props) => {
  const { content, location } = props;
  // const path = getBaseUrl(location?.pathname || '');
  const dispatch = useDispatch();
  // const { views } = config.widgets;
  // const contentSchema = useSelector((state) => state.schema?.schema);
  // const fieldsetsToExclude = [
  //   'categorization',
  //   'dates',
  //   'ownership',
  //   'settings',
  // ];
  // const fieldsets = contentSchema?.fieldsets.filter(
  //   (fs) => !fieldsetsToExclude.includes(fs.id),
  // );
  // const description = content?.description;
  let hasLeadImage = content?.preview_image;

  content.hide_top_image !== null
    ? (hasLeadImage = content?.preview_image && !content.hide_top_image)
    : (hasLeadImage = content?.preview_image);

  const filteredContent = hasLeadImage
    ? filterBlocks(content, ['title'])
    : content;

  const [showAllDocumentation, setShowAllDocumentation] = useState(false);
  const [showAllObjects, setShowAllObjects] = useState(false);
  const [eventExpired, setEventExpired] = useState(false);
  const intl = useIntl();

  const contentLoaded = content && !isEqual(Object.keys(content), ['lock']);

  React.useEffect(() => {
    content?.['@type'] &&
      !hasBlocksData(content) &&
      dispatch(getSchema(content['@type'], location.pathname));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    if (new Date(props?.content?.end) < new Date()) {
      setEventExpired(true);
    } else {
      setEventExpired(false);
    }
  }, [props.content.end]);

  const [artworkURL, setArtworkUrl] = useState([]);
  const cmsView = isCmsUi(location.pathname);
  React.useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(
          `/++api++/${location.pathname}/@@exhibition_artwork?language=${
            intl.locale
          }&artworks_list=${encodeURIComponent(
            JSON.stringify(content.objects),
          )}`,
        );
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        if (data.artworks_url_list) {
          setArtworkUrl(data.artworks_url_list);
        } else {
          setArtworkUrl([]);
        }
      } catch (error) {
        setArtworkUrl([]);
      }
    };
    if (!cmsView) {
      fetchContent();
    }
  }, [dispatch, intl, location.pathname, content, cmsView]);

  const Container =
    config.getComponent({ name: 'Container' }).component || SemanticContainer;

  const lang = useSelector((state) => state?.intl?.locale);
  const startDate = new Date(props?.content?.start);
  const endDate = new Date(props?.content?.end);
  const format = new Intl.DateTimeFormat(lang, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const startHour = format.format(startDate);
  const endHour = format.format(endDate);

  return contentLoaded ? (
    hasBlocksData(content) ? (
      <Container id="page-document">
        {(!(startHour === '00:00' || endHour === '23:59') &&
          startDate.getDate() === endDate?.getDate() &&
          startDate.getMonth() === endDate?.getMonth() &&
          startDate.getFullYear() === endDate?.getFullYear()) ||
        (!(
          startDate.getDate() === endDate?.getDate() &&
          startDate.getMonth() === endDate?.getMonth() &&
          startDate.getFullYear() === endDate?.getFullYear()
        ) &&
          new Date(props?.content?.end) < new Date()) ? (
          <p
            style={{
              fontFamily: "'FranklinMed', Arial, sans-serif",
              fontSize: '17px',
              letterSpacing: '0.85px',
              marginBottom: '22px',
              marginTop: '36px',
            }}
            className="date-indicator"
          >
            <strong>{translations.expired[lang]}</strong>
            <BodyClass className="expired-exhibition" />
          </p>
        ) : (
          ''
        )}
        {hasBlocksData(content) && content.blocks_layout.items.length > 0 ? (
          <>
            {startDate && (
              <div className="block-date hero-dates">
                {getDateRangeDescription(intl, startDate, endDate)}
              </div>
            )}
            <RenderBlocks {...props} content={filteredContent} />
          </>
        ) : (
          <>
            {startDate && (
              <div className="block-date hero-dates">
                {getDateRangeDescription(intl, startDate, endDate)}
              </div>
            )}
            <h1 className="documentFirstHeading">{content.title}</h1>
          </>
        )}
        {content?.show_notes && content?.notes?.data !== '' && eventExpired && (
          <p
            dangerouslySetInnerHTML={{
              __html: content?.notes?.data,
            }}
          />
        )}
        {eventExpired && (
          <div id="rawdata" className="rawdata-section">
            <table>
              <tbody>
                {content?.exhibition_designer &&
                  content?.exhibition_designer?.length > 0 && (
                    <tr>
                      <td className="columnone">
                        <p>{intl.formatMessage(messages.designer)}</p>
                      </td>
                      <td className="columntwo">
                        {content.exhibition_designer.map((designer, index) => (
                          <p key={index}>
                            {designer.designer}{' '}
                            {designer.role && `(${designer.role})`}
                          </p>
                        ))}
                      </td>
                    </tr>
                  )}

                {content.documentation && content.documentation?.length !== 0 && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.documentation)}</p>
                    </td>
                    <td className="columntwo">
                      <ul>
                        {showAllDocumentation
                          ? content?.documentation?.map((doc, index) => (
                              <li key={`li-${index}`}>
                                <p key={index}>
                                  {doc}
                                  {index === 2 &&
                                    content.documentation.length > 3 && (
                                      <button
                                        className={`expand-data-button ${showAllDocumentation}`}
                                        onClick={() =>
                                          setShowAllDocumentation(
                                            !showAllDocumentation,
                                          )
                                        }
                                      >
                                        {`${intl.formatMessage(
                                          messages.showless,
                                        )} -`}
                                      </button>
                                    )}
                                </p>
                              </li>
                            ))
                          : content.documentation
                              ?.slice(0, 3)
                              ?.filter((el) => el.trim() !== '')
                              .map((doc, index) => (
                                <li key={`li-${index}`}>
                                  <p key={index}>
                                    {doc}
                                    {index === 2 &&
                                      content.documentation.length > 3 && (
                                        <button
                                          className={`expand-data-button ${showAllDocumentation}`}
                                          onClick={() =>
                                            setShowAllDocumentation(
                                              !showAllDocumentation,
                                            )
                                          }
                                        >
                                          {/* Toon alles + */}
                                          {`${intl.formatMessage(
                                            messages.showmore,
                                          )} +`}
                                        </button>
                                      )}
                                  </p>
                                </li>
                              ))}
                      </ul>
                    </td>
                  </tr>
                )}
                {content.objects && content.objects?.length !== 0 ? (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.objects)}</p>
                    </td>
                    <td className="columntwo">
                      <ul>
                        {showAllObjects
                          ? content?.objects?.map(
                              ({ priref, title }, index) => {
                                const artworkUrl = artworkURL[priref];
                                return (
                                  title && (
                                    <li key={`li-${index}`}>
                                      <p key={index}>
                                        {artworkUrl ? (
                                          <a href={artworkUrl}>{title}</a>
                                        ) : (
                                          title
                                        )}

                                        {index === 2 &&
                                          content.objects.length > 3 && (
                                            <button
                                              className={`expand-data-button ${showAllObjects}`}
                                              onClick={() =>
                                                setShowAllObjects(
                                                  !showAllObjects,
                                                )
                                              }
                                            >
                                              {`${intl.formatMessage(
                                                messages.showless,
                                              )} -`}
                                            </button>
                                          )}
                                      </p>
                                    </li>
                                  )
                                );
                              },
                            )
                          : content?.objects
                              ?.slice(0, 3)
                              .map(({ priref, title }, index) => {
                                const artworkUrl = artworkURL[priref];
                                return (
                                  <li key={`li-${index}`}>
                                    <p key={index}>
                                      {artworkUrl ? (
                                        <a href={artworkUrl}>{title}</a>
                                      ) : (
                                        title
                                      )}
                                      {index === 2 &&
                                        content.objects.length > 3 && (
                                          <button
                                            className="expand-data-button"
                                            onClick={() =>
                                              setShowAllObjects(!showAllObjects)
                                            }
                                          >
                                            {/* Toon alles + */}
                                            {`${intl.formatMessage(
                                              messages.showmore,
                                            )} +`}
                                          </button>
                                        )}
                                    </p>
                                  </li>
                                );
                              })}
                      </ul>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.objects)}</p>
                    </td>
                    <td className="columntwo">
                      <ul>
                        <li>
                          <p>{intl.formatMessage(messages.noObjects)}</p>
                        </li>
                      </ul>
                    </td>
                  </tr>
                )}
                {content.persistent_url && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.duurzameurl)}</p>
                    </td>
                    <td className="columntwo">
                      <p>
                        <p>{intl.formatMessage(messages.duurzameurltext)}</p>
                        <a href={content.persistent_url}>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: content.persistent_url,
                            }}
                          />
                        </a>
                      </p>
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="columnone">
                    <p>{intl.formatMessage(messages.question)}</p>{' '}
                  </td>
                  <td className="columntwo">
                    <p>
                      {intl.formatMessage(messages.questionText)}
                      <span> </span>
                      <a
                        href={`mailto:documentatie@centraalmuseum.nl?subject=opmerking%20over%20tentoonstelling:%20${content.title}`}
                      >
                        {intl.formatMessage(messages.letusknow)}
                      </a>
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Container>
    ) : (
      <Container id="page-document"></Container>
    )
  ) : null;
};

/**
 * Property types.
 * @property {Object} propTypes Property types.
 * @static
 */
ExhibitionView.propTypes = {
  content: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    text: PropTypes.shape({
      data: PropTypes.string,
    }),
    contact_email: PropTypes.string,
    contact_name: PropTypes.string,
    contact_phone: PropTypes.string,
    end: PropTypes.string.isRequired,
    event_url: PropTypes.string,
    location: PropTypes.string,
    open_end: PropTypes.bool,
    recurrence: PropTypes.any,
    start: PropTypes.string.isRequired,
    subjects: PropTypes.arrayOf(PropTypes.string).isRequired,
    whole_day: PropTypes.bool,
  }).isRequired,
};

export default ExhibitionView;
