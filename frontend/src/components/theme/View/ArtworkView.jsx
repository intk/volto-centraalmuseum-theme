// http://localhost:8080/Plone/nl/archief/@@import_vubis?import=artwork&max=10&query=authorName=Douglas%20Gordon
// import { RenderBlocks } from '@plone/volto/components';
import React, { useState, useRef } from 'react';
// import { FormattedMessage } from 'react-intl';
import { Container } from 'semantic-ui-react';
// import { Card } from '@package/components'; // SocialLinks,
// import ImageAlbum from '../ImageAlbum/ImageAlbum';
// import config from '@plone/volto/registry';
// import { useSiteDataContent } from '@package/helpers';
// import { LuFileVideo, LuFileAudio } from 'react-icons/lu';
// import { injectIntl } from 'react-intl';
import './css/artworkview.less';
import ReactSwipe from 'react-swipe';
// import { BsArrowRight, BsArrowLeft } from 'react-icons/bs';
// import { GoArrowRight } from 'react-icons/go';
import { HiOutlineArrowLongRight } from 'react-icons/hi2';
import { HiOutlineArrowLongLeft } from 'react-icons/hi2';
import { SlMagnifierAdd, SlMagnifierRemove } from 'react-icons/sl';
import { GoShare } from 'react-icons/go';
import { GoDownload } from 'react-icons/go';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import fbbutton from './assets/soc_fb_wBG.svg';
import twbutton from './assets/share_button_twitter.svg';
// import downloadbutton from './assets/download.svg';
import { defineMessages, useIntl } from 'react-intl';
// import Icon from '@plone/volto/components/theme/Icon/Icon';

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
  material: {
    id: 'material',
    defaultMessage: 'Materialen',
  },
  technique: {
    id: 'technique',
    defaultMessage: 'Techniek',
  },
  dimension: {
    id: 'dimension',
    defaultMessage: 'Afmetingen',
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
    defaultMessage: 'Nu te zien',
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
});

export default function ArtworkView(props) {
  const intl = useIntl();
  const { content } = props;
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [showAllDocumentation, setShowAllDocumentation] = useState(false);
  const [showAllExhibition, setShowAllExhibition] = useState(false);

  const HandleClick = () => {
    setDescriptionOpen(!descriptionOpen);
  };

  let reactSwipeEl;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dataExpand, setDataExpand] = useState(false);
  const currentImageUrl = props.content?.items[currentIndex]?.url;
  const downloadLink = `${currentImageUrl}/@@images/image`;

  const [popupVisible, setPopupVisible] = useState(false);
  const zoomUtilsRefs = useRef([]);

  const togglePopup = () => {
    setPopupVisible(!popupVisible);
  };
  const closePopup = () => {
    setPopupVisible(false);
  };

  const expandData = () => {
    setDataExpand(!dataExpand);
    const sliderElement = document.getElementById('swipe-slider');
    const rawDataElement = document.getElementById('rawdata');
    const viewportHeight = window.innerHeight;

    if (dataExpand === false && sliderElement) {
      const topPosition = rawDataElement.offsetTop - 124;
      setTimeout(function () {
        window.scrollTo({
          top: topPosition,
          behavior: 'smooth',
        });
      }, 100);
    } else if (dataExpand === true && rawDataElement) {
      const topPosition = sliderElement.offsetTop - viewportHeight / 4;
      window.scrollTo({ top: topPosition, behavior: 'smooth' });
    }
  };

  // Buttons for the image and text
  const Controls = ({ zoomIn, zoomOut, resetTransform }) => (
    <>
      <button
        className={dataExpand ? 'button expand expanded' : 'button expand'}
        onClick={expandData}
      >
        {dataExpand === true
          ? `− ${intl.formatMessage(messages.details)}`
          : `+ ${intl.formatMessage(messages.details)}`}
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
          <div className="social-media-popup" role="tooltip" id="popover825468">
            <h3 className="popover-title">
              {intl.formatMessage(messages.share)}
            </h3>
            <div className="popover-content">
              <div className="row facebook-row">
                <a
                  onclick="return !window.open(this.href, 'Facebook', 'width=500,height=500')"
                  className="share-btn-social"
                  href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`}
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
                  href={`http://twitter.com/share?text=${''}&url=${
                    window.location.href
                  }`}
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
                  href={`http://www.pinterest.com/pin/create/button/?url=${window.location.href}`}
                  data-pin-do="buttonPin"
                  data-pin-config="none"
                >
                  <img
                    alt="Delen op Pinterest"
                    src="//assets.pinterest.com/images/pidgets/pinit_fg_en_rect_gray_20.png"
                    href={`http://www.pinterest.com/pin/create/button/?url=${window.location.href}`}
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
        download
      >
        <GoDownload
          icon
          className="Downloadbutton"
          aria-label="download button"
          height="2em"
        />
        {/* <Icon name={downloadbutton} size="18px" />{' '} */}
      </a>
      <button
        className="button zoomplus"
        onClick={() => zoomUtilsRefs.current[currentIndex]?.zoomIn()}
      >
        <SlMagnifierAdd
          icon
          className="MagnifierPlus"
          aria-label="magnifier plus"
          height="2em"
        />
      </button>

      <button className="button zoomminus" onClick={() => zoomOut()}>
        <SlMagnifierRemove
          icon
          className="MagnifierPlus"
          aria-label="magnifier plus"
          height="2em"
        />
      </button>
    </>
  );

  return (
    <div id="object-block">
      <Container>
        <div className="object-wrapper full-width">
          <div id="swipe-slider">
            <ReactSwipe
              className="carousel"
              swipeOptions={{
                continuous: true,
                transitionEnd: (index) => {
                  setCurrentIndex(index);
                },
              }}
              ref={(el) => (reactSwipeEl = el)}
            >
              {props.content?.items.map((item, index) => {
                if (item['@type'] === 'Image') {
                  return (
                    <div className="zoom-container">
                      <TransformWrapper
                        initialScale={1}
                        key={index}
                        minScale={0.5}
                        maxScale={3}
                        wheel={{
                          activationKeys: ['Control', 'Shift'],
                        }}
                      >
                        {(utils) => {
                          zoomUtilsRefs.current[index] = utils;
                          return (
                            <React.Fragment>
                              <TransformComponent>
                                <img
                                  src={`${item.url}/@@images/image`}
                                  id="imgExample"
                                  alt=""
                                />
                              </TransformComponent>
                            </React.Fragment>
                          );
                        }}
                      </TransformWrapper>
                    </div>
                  );
                }
                return null;
              })}
            </ReactSwipe>
            {props.content?.items_total > 1 && (
              <div className="leftrightbuttons">
                <button
                  onClick={() => {
                    reactSwipeEl.prev();
                  }}
                >
                  <HiOutlineArrowLongLeft
                    icon
                    className="leftarrow"
                    aria-label="left arrow"
                  />
                </button>
                <span className="paginator">
                  <p>{`${currentIndex + 1}/${props.content?.items_total}`}</p>
                </span>{' '}
                <button
                  onClick={() => {
                    reactSwipeEl.next();
                  }}
                >
                  <HiOutlineArrowLongRight
                    icon
                    className="rightarrow"
                    aria-label="right arrow"
                  />
                </button>
              </div>
            )}
            <div className="buttons">
              <Controls {...zoomUtilsRefs.current[currentIndex]} />
            </div>
          </div>
          <div
            id="rawdata"
            className={`rawdata-section ${dataExpand ? 'expanded' : ''}`}
          >
            {content.objectExplanation && (
              <div className="description-wrapper">
                <p
                  id="description"
                  className={`data-description ${descriptionOpen}`}
                >
                  {content.objectExplanation}
                </p>
                <button className="expand-button" onClick={HandleClick}>
                  {' '}
                  {descriptionOpen ? 'Toon minder -' : 'Toon alles +'}
                </button>
              </div>
            )}
            <table>
              <tbody>
                {
                  <tr>
                    <td className="columnone">
                      <p></p>
                    </td>
                    <td className="columntwo">
                      <p>
                        {content.ObjOnDisplay === true
                          ? intl.formatMessage(messages.nowonview)
                          : intl.formatMessage(messages.notonview)}
                      </p>
                    </td>
                  </tr>
                }
                {content.title && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.title)}</p>
                    </td>
                    <td className="columntwo">
                      <p>{content.title}</p>
                    </td>
                  </tr>
                )}

                {content.creator && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.artist)}</p>
                    </td>
                    <td className="columntwo">
                      {content.creator.map((artist) => (
                        <p>{artist}</p>
                      ))}
                    </td>
                  </tr>
                )}

                {content.dating && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.date)}</p>
                    </td>
                    <td className="columntwo">
                      <p>{content.dating}</p>
                    </td>
                  </tr>
                )}
                {content.materialTechnique && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.materialTechnique)}</p>
                    </td>
                    <td className="columntwo">
                      <p>
                        {/* <a
                          href={`/search?SearchableText=${content.materialTechnique}`}
                        >
                          {content.materialTechnique}
                        </a> */}
                        {content.materialTechnique.map((technique, index) => (
                          <>
                            <span>
                              <a href={`/search?SearchableText=${technique}`}>
                                {technique}
                              </a>
                            </span>
                            <span>
                              {index !== content.materialTechnique.length - 1
                                ? ', '
                                : ''}
                            </span>
                          </>
                        ))}
                      </p>
                    </td>
                  </tr>
                )}
                {content.inventoryNumber && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.inventoryNumber)}</p>
                    </td>
                    <td className="columntwo">
                      <p>{content.inventoryNumber}</p>
                    </td>
                  </tr>
                )}
                {content.objectName && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.objectName)}</p>
                    </td>
                    <td className="columntwo">
                      <p>
                        {content.objectName.map((material, index) => (
                          <span>
                            <a href={`/search?SearchableText=${material}`}>
                              {material}
                            </a>
                            {index !== content.objectName.length - 1
                              ? ', '
                              : ''}
                          </span>
                        ))}
                        {/* {content.objectName} */}
                      </p>
                    </td>
                  </tr>
                )}
                {content.acquisition && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.acquisition)}</p>
                    </td>
                    <td className="columntwo">
                      <p>{content.acquisition}</p>
                    </td>
                  </tr>
                )}
                {content.dimensions && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.dimensions)}</p>
                    </td>
                    <td className="columntwo">
                      {content.dimensions.map((dimension) => (
                        <p> {dimension} </p>
                      ))}
                    </td>
                  </tr>
                )}
                {content.inscriptions && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.inscriptions)}</p>
                    </td>
                    <td className="columntwo">
                      <ul>
                        {content.inscriptions.map((inscription) => (
                          <li>
                            <p>{inscription} </p>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
                {content.category && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.category)}</p>
                    </td>
                    <td className="columntwo">
                      <p>
                        {content.category.map((subject, index) => (
                          <span>
                            <a href={`/search?SearchableText=${subject}`}>
                              {subject}
                            </a>
                            {index !== content.subjects.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </p>
                    </td>
                  </tr>
                )}
                {content.remarks && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.credit)}</p>
                    </td>
                    <td className="columntwo">
                      <p>{content.remarks}</p>
                    </td>
                  </tr>
                )}
                {content.documentation && (
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
                          ? content.documentation.map((doc, index) => (
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
                                        Toon minder -
                                      </button>
                                    )}
                                </p>
                              </li>
                            ))
                          : content.documentation
                              .slice(0, 3)
                              .map((doc, index) => (
                                <li>
                                  <p key={index}>
                                    {doc}
                                    {index === 2 && (
                                      <button
                                        className="expand-data-button"
                                        onClick={() =>
                                          setShowAllDocumentation(
                                            !showAllDocumentation,
                                          )
                                        }
                                      >
                                        Toon alles +
                                      </button>
                                    )}
                                  </p>
                                </li>
                              ))}
                      </ul>
                    </td>
                  </tr>
                )}
                {content.exhibitions && (
                  <tr>
                    <td className="columnone" id="intoview">
                      <p>{intl.formatMessage(messages.exhibitions)}</p>
                    </td>
                    <td className="columntwo">
                      {/* {content.exhibitions.map((exhibition) => (
                        <p>
                          <li>{exhibition}</li>
                        </p>
                      ))} */}
                      <ul>
                        {showAllExhibition
                          ? content.exhibitions.map((exhibition, index) => (
                              <li>
                                <p key={index}>
                                  {exhibition}
                                  {index === 2 &&
                                    content.exhibitions.length > 3 && (
                                      <button
                                        className="expand-data-button"
                                        onClick={() =>
                                          setShowAllExhibition(
                                            !showAllExhibition,
                                          )
                                        }
                                      >
                                        Toon minder -
                                      </button>
                                    )}
                                </p>
                              </li>
                            ))
                          : content.exhibitions
                              .slice(0, 3)
                              .map((exhibition, index) => (
                                <li>
                                  <p key={index}>
                                    {exhibition}
                                    {index === 2 && (
                                      <button
                                        className="expand-data-button"
                                        onClick={() =>
                                          setShowAllExhibition(
                                            !showAllExhibition,
                                          )
                                        }
                                      >
                                        Toon alles +
                                      </button>
                                    )}
                                  </p>
                                </li>
                              ))}
                      </ul>
                    </td>
                  </tr>
                )}
                {content.PIDworkLink && (
                  <tr>
                    <td className="columnone">
                      <p>Duurzame url</p>
                    </td>
                    <td className="columntwo">
                      <p>
                        <p>
                          Als u naar dit object wilt verwijzen gebruik dan de
                          duurzame URL:
                        </p>
                        <a href={content.PIDworkLink}>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: content.PIDworkLink,
                            }}
                          />
                        </a>
                      </p>
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="columnone">
                    <p>Vragen?</p>
                  </td>
                  <td className="columntwo">
                    <p>
                      Ziet u een fout? Of heeft u extra informatie over dit
                      object?
                      <span> </span>
                      <a href="mailto:documentatie@centraalmuseum.nl?subject=opmerking%20over%20object:%2010786">
                        Laat het ons weten!
                      </a>
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    </div>
  );
}
