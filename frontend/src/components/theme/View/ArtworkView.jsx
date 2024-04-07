// http://localhost:8080/Plone/nl/archief/@@import_vubis?import=artwork&max=10&query=authorName=Douglas%20Gordon
// import { RenderBlocks } from '@plone/volto/components';
import React, { useState, useEffect, useRef } from 'react';
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
import { SeeMore } from '../../index';
import { BodyClass } from '@plone/volto/helpers';
import { useDispatch, useSelector } from 'react-redux';
import { isCmsUi } from '@plone/volto/helpers';
import { Link } from 'react-router-dom';
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

function formatExhibitionDate(startDate, endDate) {
  if (!startDate && !endDate) return '';

  const startYear = startDate?.split('-')[0];
  const endYear = endDate?.split('-')[0];

  if (startYear && endYear) {
    if (startYear === endYear) {
      return startYear; // Same year, just show the start year
    } else {
      return `${startYear} - ${endYear}`; // Different years, show range
    }
  } else if (startYear) {
    return startYear; // Only start date is available
  } else if (endYear) {
    return endYear; // Only end date is available
  }
}

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

  useEffect(() => {
    if (props.content?.items.length === 0) {
      setDataExpand(true);
    }
  }, [props.content.items.length]);

  const dispatch = useDispatch();
  const pathname = useSelector((state) => state.router.location.pathname);
  const cmsView = isCmsUi(pathname);
  const id = content.id;

  const [exhibitionURL, setExhibitionUrl] = useState([]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(
          `/++api++/${pathname}/@@artwork_exhibition?language=${
            intl.locale
          }&exhibitions_list=${encodeURIComponent(
            JSON.stringify(content.exhibitions_list),
          )}`,
        );
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        if (data.exhibitions_url_list) {
          setExhibitionUrl(data.exhibitions_url_list);
        } else {
          setExhibitionUrl([]);
        }
      } catch (error) {
        setExhibitionUrl([]);
      }
    };
    if (!cmsView) {
      fetchContent();
    }
  }, [dispatch, intl, id, pathname, content, cmsView]);

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
              {props.content?.items.length === 0 && (
                <>
                  <BodyClass className="artwork-no-image" />
                </>
              )}
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
            {content.objectExplanation.data && (
              <div className="description-wrapper">
                <div
                  id="description"
                  className={`data-description ${descriptionOpen}`}
                  dangerouslySetInnerHTML={{
                    __html: content.objectExplanation.data,
                  }}
                />
                <button className="expand-button" onClick={HandleClick}>
                  {' '}
                  {descriptionOpen
                    ? `${intl.formatMessage(messages.showless)} -`
                    : `${intl.formatMessage(messages.showmore)} +`}
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
                        {content.ObjOnDisplay === true ? (
                          <>
                            {intl.formatMessage(messages.nowonview)}
                            {content.exhibitions_list[0] ? ' in ' : ' '}
                            {content.exhibitions_list[0] &&
                              (exhibitionURL[
                                content.exhibitions_list[0].cm_nummer
                              ] ? (
                                <Link
                                  to={
                                    exhibitionURL[
                                      content.exhibitions_list[0].cm_nummer
                                    ]
                                  }
                                >
                                  {content.exhibitions_list[0].name}
                                </Link>
                              ) : (
                                content.exhibitions_list[0].name
                              ))}
                          </>
                        ) : (
                          intl.formatMessage(messages.notonview)
                        )}
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
                {content.creator &&
                  content.creator.data !== '' &&
                  content.creator.data !== '<div></div>' &&
                  content.creator.data !== ' ' && (
                    <tr>
                      <td className="columnone">
                        <p>{intl.formatMessage(messages.artist)}</p>
                      </td>
                      <td className="columntwo">
                        {/* {content?.creator?.map((artist) => (
                        <p>{artist}</p>
                      ))} */}{' '}
                        <div
                          id="creator"
                          className={`data-description ${descriptionOpen}`}
                          dangerouslySetInnerHTML={{
                            __html: content.creator.data,
                          }}
                        />
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
                        {content?.materialTechnique
                          ?.filter((el) => el.trim() !== '')
                          .map((technique, index) => (
                            <>
                              <span>
                                <a
                                  href={`/search?artwork_material=${technique}&Language=${intl.locale}`}
                                >
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
                        {content?.objectName
                          ?.filter((el) => el.trim() !== '')
                          .map((material, index) => (
                            <span>
                              <a
                                href={`/search?artwork_type=${material}&Language=${intl.locale}`}
                              >
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
                      {content?.dimensions
                        ?.filter((el) => el.trim() !== '')
                        .map((dimension) => (
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
                        {content?.inscriptions
                          ?.filter((el) => el.trim() !== '')
                          .map((inscription) => (
                            <li>
                              <p>{inscription} </p>
                            </li>
                          ))}
                      </ul>
                    </td>
                  </tr>
                )}
                {content.physicaldescription && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.physicaldescription)}</p>
                    </td>
                    <td className="columntwo">
                      <p>{content.physicaldescription}</p>
                    </td>
                  </tr>
                )}
                {content.category != null && content.category?.length !== 0 && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.category)}</p>
                    </td>
                    <td className="columntwo">
                      {content?.category
                        ?.filter((el) => el.trim() !== '')
                        .map((subject, index) => (
                          <p>
                            <a
                              href={`/search?artwork_associated_subjects=${content?.associatedSubjects[index]}&Language=${intl.locale}`}
                            >
                              {subject}
                            </a>
                            {/* {index !== content.subjects.length - 1 ? ', ' : ''} */}
                          </p>
                        ))}
                    </td>
                  </tr>
                )}
                {content.associatedPeriods != null &&
                  content.associatedPeriods?.length !== 0 && (
                    <tr>
                      <td className="columnone">
                        <p>{intl.formatMessage(messages.associatedPeriods)}</p>
                      </td>
                      <td className="columntwo">
                        <p>
                          {content?.associatedPeriods
                            ?.filter((el) => el.trim() !== '')
                            .map((period, index) => (
                              <span>
                                <a
                                  href={`/search?associatedPeriods=${period}&Language=${intl.locale}`}
                                >
                                  {period}
                                </a>
                                {index !== content.associatedPeriods.length - 1
                                  ? ', '
                                  : ''}
                              </span>
                            ))}
                        </p>
                      </td>
                    </tr>
                  )}
                {content.associatedPeople != null &&
                  content.associatedPeople?.length !== 0 && (
                    <tr>
                      <td className="columnone">
                        <p>{intl.formatMessage(messages.associatedPeople)}</p>
                      </td>
                      <td className="columntwo">
                        {content?.associatedPeople
                          ?.filter((el) => el.trim() !== '')
                          .map((person, index) => (
                            <p>
                              <a
                                href={`/search?associatedPeople=${person}&Language=${intl.locale}`}
                              >
                                {person}
                              </a>
                            </p>
                          ))}
                      </td>
                    </tr>
                  )}

                {content.motifs != null && content.motifs?.length !== 0 && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.motifs)}</p>
                    </td>
                    <td className="columntwo">
                      <p>
                        {content?.motifs
                          ?.filter((el) => el.trim() !== '')
                          .map((motif, index) => (
                            <span>
                              <a
                                href={`/search?artwork_motif=${motif}&Language=${intl.locale}`}
                              >
                                {motif}
                              </a>
                              {index !== content.motifs.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                      </p>
                    </td>
                  </tr>
                )}
                {content.remarks && content.remarks?.length !== 0 && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.credit)}</p>
                    </td>
                    <td className="columntwo">
                      {content?.remarks
                        ?.filter((remark) => remark.trim() !== '')
                        .map((remark) => (
                          <p>{remark}</p>
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
                      {/* {content.documentation.map((document) => (
                        <p>
                          <li>{document}</li>
                        </p>
                      ))} */}
                      <ul>
                        {showAllDocumentation
                          ? content?.documentation?.map((doc, index) => (
                              <li key={index}>
                                <p>
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

                {content.exhibitions_list &&
                  content.exhibitions_list.length !== 0 && (
                    <tr>
                      <td className="columnone" id="intoview">
                        <p>{intl.formatMessage(messages.exhibitions)}</p>
                      </td>
                      <td className="columntwo">
                        <ul>
                          {showAllExhibition
                            ? content.exhibitions_list.map(
                                (exhibition, index) => {
                                  const formattedDate = formatExhibitionDate(
                                    exhibition.venue_start,
                                    exhibition.venue_end,
                                  );
                                  const exhibitionUrl =
                                    exhibitionURL[exhibition.cm_nummer];
                                  return (
                                    <li key={index}>
                                      {exhibitionUrl ? (
                                        <Link to={exhibitionUrl}>
                                          {' '}
                                          {exhibition.name}
                                          {exhibition.venue_name &&
                                            `, ${exhibition.venue_name}`}
                                          {exhibition.venue_place &&
                                            `, ${exhibition.venue_place}`}
                                          {formattedDate &&
                                            `, ${formattedDate}`}
                                        </Link>
                                      ) : (
                                        <p>
                                          {exhibition.name}
                                          {exhibition.venue_name &&
                                            `, ${exhibition.venue_name}`}
                                          {exhibition.venue_place &&
                                            `, ${exhibition.venue_place}`}
                                          {formattedDate &&
                                            `, ${formattedDate}`}
                                        </p>
                                      )}
                                      <p>
                                        {' '}
                                        {index === 2 &&
                                          content.exhibitions_list.length >
                                            3 && (
                                            <button
                                              className="expand-data-button"
                                              onClick={() =>
                                                setShowAllExhibition(
                                                  !showAllExhibition,
                                                )
                                              }
                                            >
                                              {intl.formatMessage(
                                                messages.showless,
                                              )}{' '}
                                              -
                                            </button>
                                          )}
                                      </p>
                                    </li>
                                  );
                                },
                              )
                            : content.exhibitions_list
                                .slice(0, 3)
                                .map((exhibition, index) => {
                                  const formattedDate = formatExhibitionDate(
                                    exhibition.venue_start,
                                    exhibition.venue_end,
                                  );
                                  const exhibitionUrl =
                                    exhibitionURL[exhibition.cm_nummer];
                                  return (
                                    <li key={index}>
                                      {exhibitionUrl ? (
                                        <Link to={exhibitionUrl}>
                                          {' '}
                                          {exhibition.name}
                                          {exhibition.venue_name &&
                                            `, ${exhibition.venue_name}`}
                                          {exhibition.venue_place &&
                                            `, ${exhibition.venue_place}`}
                                          {formattedDate &&
                                            `, ${formattedDate}`}
                                        </Link>
                                      ) : (
                                        <p>
                                          {exhibition.name}
                                          {exhibition.venue_name &&
                                            `, ${exhibition.venue_name}`}
                                          {exhibition.venue_place &&
                                            `, ${exhibition.venue_place}`}
                                          {formattedDate &&
                                            `, ${formattedDate}`}
                                        </p>
                                      )}
                                      <p>
                                        {index === 2 &&
                                          content.exhibitions_list.length >
                                            3 && (
                                            <button
                                              className="expand-data-button"
                                              onClick={() =>
                                                setShowAllExhibition(
                                                  !showAllExhibition,
                                                )
                                              }
                                            >
                                              {intl.formatMessage(
                                                messages.showmore,
                                              )}{' '}
                                              +
                                            </button>
                                          )}
                                      </p>
                                    </li>
                                  );
                                })}
                        </ul>
                      </td>
                    </tr>
                  )}

                {content.PIDworkLink && (
                  <tr>
                    <td className="columnone">
                      <p>{intl.formatMessage(messages.duurzameurl)}</p>
                    </td>
                    <td className="columntwo">
                      <p>
                        <p>{intl.formatMessage(messages.duurzameurltext)}</p>
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
                    <p>{intl.formatMessage(messages.question)}</p>{' '}
                  </td>
                  <td className="columntwo">
                    <p>
                      {intl.formatMessage(messages.questionText)}
                      <span> </span>
                      <a
                        href={`mailto:documentatie@centraalmuseum.nl?subject=opmerking%20over%20object:%20${content.inventoryNumber}`}
                      >
                        {intl.formatMessage(messages.letusknow)}
                      </a>
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <SeeMore {...props} />
        </div>
      </Container>
    </div>
  );
}
