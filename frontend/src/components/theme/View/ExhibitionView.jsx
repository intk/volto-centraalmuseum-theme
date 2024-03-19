/**
 * EventView view component.
 * @module components/theme/View/EventView
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  hasBlocksData,
  // flattenHTMLToAppURL,
  getBaseUrl,
} from '@plone/volto/helpers';
// import { Image, Grid } from 'semantic-ui-react';
import RenderBlocks from '@plone/volto/components/theme/View/RenderBlocks';
// import { EventDetails } from '@plone/volto/components';
import { useDispatch, useSelector } from 'react-redux';
import config from '@plone/volto/registry';
import { getSchema } from '@plone/volto/actions';
import {
  Container as SemanticContainer,
  Segment,
  Grid,
  Label,
} from 'semantic-ui-react';
import { isEqual } from 'lodash';
import { getWidget } from '@plone/volto/helpers/Widget/utils';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  artist: {
    id: 'artist',
    defaultMessage: 'Vervaardiger',
  },
  title: {
    id: 'title',
    defaultMessage: 'Titel',
  },
  materialTechnique: {
    id: 'materialTechnique',
    defaultMessage: 'Materiaal / Techniek',
  },
  inventoryNumber: {
    id: 'inventoryNumber',
    defaultMessage: 'Inventarisnummer',
  },
  date: {
    id: 'date',
    defaultMessage: 'Datering',
  },
  objectExplanation: {
    id: 'objectExplanation',
    defaultMessage: 'Fysieke beschrijving',
  },
  credit: {
    id: 'credit',
    defaultMessage: 'Opmerkingen',
  },
  objectNumber: {
    id: 'objectNumber',
    defaultMessage: 'Objectnummer',
  },
  question: {
    id: 'question',
    defaultMessage: 'Vragen?',
  },
  questionText: {
    id: 'questionText',
    defaultMessage:
      'Ziet u een fout? Of heeft u extra informatie over dit object? ',
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
  objectName: {
    id: 'objectName',
    defaultMessage: 'Objectnaam',
  },
  acquisition: {
    id: 'acquisition',
    defaultMessage: 'Verwerving',
  },
  dimensions: {
    id: 'dimensions',
    defaultMessage: 'Afmetingen',
  },
  inscriptions: {
    id: 'inscriptions',
    defaultMessage: 'Opschriften / merken',
  },
  category: {
    id: 'category',
    defaultMessage: 'Geassocieerd onderwerp',
  },
  remarks: {
    id: 'remarks',
    defaultMessage: 'Opmerkingen',
  },
  documentation: {
    id: 'documentation',
    defaultMessage: 'Documentatie',
  },
  exhibitions: {
    id: 'exhibitions',
    defaultMessage: 'Tentoonstellingen',
  },
  physicaldescription: {
    id: 'physicaldescription',
    defaultMessage: 'Fysieke beschrijving',
  },
  associatedPeriods: {
    id: 'associatedPeriods',
    defaultMessage: 'Geassocieerde periode',
  },
  associatedPeople: {
    id: 'associatedPeople',
    defaultMessage: 'Geassocieerde persoon',
  },
  motifs: {
    id: 'motifs',
    defaultMessage: 'Motief',
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

/**
 * EventView view component class.
 * @function EventView
 * @params {object} content Content object.
 * @returns {string} Markup of the component.
 */
const ExhibitionView = (props) => {
  const { content, location } = props;
  const path = getBaseUrl(location?.pathname || '');
  const dispatch = useDispatch();
  const { views } = config.widgets;
  const contentSchema = useSelector((state) => state.schema?.schema);
  const fieldsetsToExclude = [
    'categorization',
    'dates',
    'ownership',
    'settings',
  ];
  const fieldsets = contentSchema?.fieldsets.filter(
    (fs) => !fieldsetsToExclude.includes(fs.id),
  );
  // const description = content?.description;
  let hasLeadImage = content?.preview_image;

  content.hide_top_image !== null
    ? (hasLeadImage = content?.preview_image && !content.hide_top_image)
    : (hasLeadImage = content?.preview_image);

  const filteredContent = hasLeadImage
    ? filterBlocks(content, ['title'])
    : content;

  const [showAllDocumentation, setShowAllDocumentation] = useState(false);
  const intl = useIntl();

  // TL;DR: There is a flash of the non block-based view because of the reset
  // of the content on route change. Subscribing to the content change at this
  // level has nasty implications, so we can't watch the Redux state for loaded
  // content flag here (because it forces an additional component update)
  // Instead, we can watch if the content is "empty", but this has a drawback
  // since the locking mechanism inserts a `lock` key before the content is there.
  // So "empty" means `content` is present, but only with a `lock` key, thus the next
  // ugly condition comes to life
  const contentLoaded = content && !isEqual(Object.keys(content), ['lock']);

  React.useEffect(() => {
    content?.['@type'] &&
      !hasBlocksData(content) &&
      dispatch(getSchema(content['@type'], location.pathname));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          >
            <strong>{translations.expired[lang]}</strong>
          </p>
        ) : (
          ''
        )}
        <RenderBlocks {...props} path={path} content={filteredContent} />
        <table>
          <tbody>
            {content.designer && (
              <tr>
                <td className="columnone">
                  {/* <p>{intl.formatMessage(messages.designer)}</p> */}
                  <p>Vormgever</p>
                </td>
                <td className="columntwo">
                  <p>{content.designer}</p>
                </td>
              </tr>
            )}
            {content.documentation && content.documentation?.length !== 0 && (
              <tr>
                <td className="columnone">
                  <p>{intl.formatMessage(messages.documentation)}</p>
                </td>
                <td className="columntwo">
                  {/* {content.documentation.map((document) => (
                        <p>
                          <li>{document}</li>
                        </p>
                      ))} */}
                  <ul>
                    {showAllDocumentation
                      ? content?.documentation?.map((doc, index) => (
                          <li>
                            <p key={index}>
                              {doc}
                              {index === 2 && content.documentation.length > 3 && (
                                <button
                                  className={`expand-data-button ${showAllDocumentation}`}
                                  onClick={() =>
                                    setShowAllDocumentation(
                                      !showAllDocumentation,
                                    )
                                  }
                                >
                                  {`${intl.formatMessage(messages.showless)} -`}
                                </button>
                              )}
                            </p>
                          </li>
                        ))
                      : content.documentation
                          ?.slice(0, 3)
                          ?.filter((el) => el.trim() !== '')
                          .map((doc, index) => (
                            <li>
                              <p key={index}>
                                {doc}
                                {index === 2 &&
                                  content.documentation.length > 3 && (
                                    <button
                                      className="expand-data-button"
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
            {content.objects && (
              <tr>
                <td className="columnone">
                  {/* <p>{intl.formatMessage(messages.materialTechnique)}</p> */}
                  Collectie in deze tentoonstelling
                </td>
                <td className="columntwo">
                  <p>
                    {content?.objects.map(({ title, url }, index) => (
                      <>
                        <span>
                          <a href={`/${url[2]}/${url[3]}/${url[4]}/${url[5]}`}>
                            {title}
                          </a>
                        </span>
                        <span>
                          {index !== content.objects.length - 1 ? ', ' : ''}
                        </span>
                      </>
                    ))}
                  </p>
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
                  <a href="mailto:documentatie@centraalmuseum.nl?subject=opmerking%20over%20object:%2010786">
                    {intl.formatMessage(messages.letusknow)}
                  </a>
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </Container>
    ) : (
      <Container id="page-document">
        {fieldsets?.map((fs) => {
          return (
            <div className="fieldset" key={fs.id}>
              {fs.id !== 'default' && <h2>{fs.title}</h2>}
              {fs.fields?.map((f, key) => {
                let field = {
                  ...contentSchema?.properties[f],
                  id: f,
                  widget: getWidget(f, contentSchema?.properties[f]),
                };
                let Widget = views?.getWidget(field);
                return f !== 'title' ? (
                  <Grid celled="internally" key={key}>
                    <Grid.Row>
                      <Label title={field.id}>{field.title}:</Label>
                    </Grid.Row>
                    <Grid.Row>
                      <Segment basic>
                        <Widget value={content[f]} />
                      </Segment>
                    </Grid.Row>
                  </Grid>
                ) : (
                  <Widget key={key} value={content[f]} />
                );
              })}
            </div>
          );
        })}
      </Container>
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
    attendees: PropTypes.arrayOf(PropTypes.string).isRequired,
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
