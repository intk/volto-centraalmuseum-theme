import React, { useState, useEffect } from 'react';

function XMLInfoComponent({ xmlString }) {
  const [data, setData] = useState({});
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [showAllDocumentation, setShowAllDocumentation] = useState(false);
  const [showAllExhibition, setShowAllExhibition] = useState(false);

  const HandleClick = () => {
    setDescriptionOpen(!descriptionOpen);
  };

  useEffect(() => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const getDescription = () => {
      const labels = xmlDoc.querySelectorAll('record > Label');
      return labels.length ? labels[0].textContent : null;
    };

    const motifs = xmlDoc.querySelectorAll('content\\.motif\\.general > term');
    const motifList = [...motifs].map((motif) => motif.textContent);
    const motifString = motifList.join(', ');

    const dimensions = xmlDoc.querySelectorAll('Dimension');

    const dimensionList = [...dimensions].map((dimension) => {
      const type = dimension.querySelector('dimension\\.type > term')
        ?.textContent;
      const unit = dimension.querySelector('dimension\\.unit > term')
        ?.textContent;
      const value = dimension.querySelector('dimension\\.value')?.textContent;
      return `${type} ${value} ${unit}`;
    });

    const exhibitionElements = xmlDoc.querySelectorAll(
      'record > Exhibition > exhibition',
    );

    const exhibitionList = [...exhibitionElements].map((exhibition) => {
      const title = exhibition.querySelector('title')?.textContent || '';
      const venue =
        exhibition.querySelector('venue > venue')?.textContent || '';
      const place =
        exhibition.querySelector('venue > venue\\.place')?.textContent || '';
      const dateStart = exhibition.querySelector('venue > venue\\.date\\.start')
        ?.textContent;
      const shortDate = dateStart ? dateStart.substring(0, 4) : ''; // getting first 4 characters

      return `${title}, ${venue}, ${place}, ${shortDate}`;
    });

    const documentationElements = xmlDoc.querySelectorAll(
      'record > Documentation',
    );

    const documentationList = [...documentationElements].map((doc) => {
      const title =
        doc.querySelector('documentation\\.title > Title > title')
          ?.textContent || '';
      const placeOfPublication =
        doc.querySelector(
          'documentation\\.title > Publisher > place_of_publication',
        )?.textContent || '';
      const yearOfPublication =
        doc.querySelector(
          'documentation\\.title > Publisher > year_of_publication',
        )?.textContent || '';
      const pageReference =
        doc.querySelector('documentation\\.page_reference')?.textContent || '';
      const authorFullName =
        doc.querySelector('Author > author\\.name')?.textContent || '';
      const authorNameParts = authorFullName
        .split(',')
        .map((name) => name.trim());
      const authorName =
        authorNameParts.length > 1
          ? `${authorNameParts[1]} ${authorNameParts[0]}`
          : authorFullName;

      return `${title}, ${authorName}, (${placeOfPublication}, ${yearOfPublication}), ${pageReference}`;
    });
    const PIDworkURI = xmlDoc.querySelector('record > PIDwork > PID_work_URI')
      ?.textContent;
    const PIDworkURL = xmlDoc.querySelector('record > PIDwork > PID_work_URL')
      ?.textContent;

    const creatorInfo = xmlDoc.querySelector('record > Production > creator');
    const creatorName = creatorInfo?.querySelector('name')?.textContent;
    const birthPlace = creatorInfo?.querySelector('birth\\.place')?.textContent;
    const birthDate = creatorInfo?.querySelector('birth\\.date\\.start')
      ?.textContent;
    const deathPlace = creatorInfo?.querySelector('death\\.place')?.textContent;
    const deathDate = creatorInfo?.querySelector('death\\.date\\.start')
      ?.textContent;

    // Reformatting the creator name from "Honthorst, Gerard van" to "Gerard van Honthorst"
    const formattedCreatorName = creatorName
      ? creatorName.split(', ').reverse().join(' ')
      : '';

    const creatorDetails = `(${birthPlace} ${birthDate?.slice(
      0,
      4,
    )} - ${deathDate?.slice(0, 4)} ${deathPlace})`;

    setData({
      description: getDescription(),
      title: xmlDoc.querySelector('record > Title > title')?.textContent,
      datering: xmlDoc.querySelector('production\\.date\\.start')?.textContent,
      materialTechnique: xmlDoc.querySelector('techniek\\.vrije\\.tekst')
        ?.textContent,
      inventarishnummer: xmlDoc.querySelector('record > object_number')
        ?.textContent,
      objectnaam:
        xmlDoc.querySelector('record > Object_name > object_name > term')
          ?.textContent || '',
      verwerving: `${
        xmlDoc.querySelector('acquisition\\.method')?.textContent || ''
      } ${
        xmlDoc.querySelector('acquisition\\.date')?.textContent || ''
      }`.trim(),
      opsschriften: `${
        xmlDoc.querySelector('inscription\\.type')?.textContent || ''
      } ${xmlDoc.querySelector('inscription\\.position')?.textContent || ''} (${
        xmlDoc.querySelector('inscription\\.method')?.textContent || ''
      }): ${
        xmlDoc.querySelector('inscription\\.content')?.textContent || ''
      } (${
        xmlDoc.querySelector('inscription\\.notes')?.textContent || ''
      }) `.trim(),
      motifs: motifString,
      opmerkingen: xmlDoc.querySelector('record > notes')?.textContent,
      afmetingen: dimensionList,
      exhibition: exhibitionList,
      documentation: documentationList,
      PIDworkLink: PIDworkURL
        ? `<a href="${PIDworkURL}">${PIDworkURI}</a>`
        : PIDworkURI,
      creator: formattedCreatorName,
      creatorDetails: creatorDetails,
    });
  }, [xmlString]);

  return (
    <div className="data-wrapper">
      {data.description && (
        <div className="description-wrapper">
          <p id="description" className={`data-description ${descriptionOpen}`}>
            {data.description}
          </p>
          <button className="expand-button" onClick={HandleClick}>
            {' '}
            {descriptionOpen ? 'Toon minder -' : 'Toon minder +'}
          </button>
        </div>
      )}
      <table>
        <tbody>
          {data.title && (
            <tr>
              <td className="columnone">
                <p>Titel</p>
              </td>
              <td className="columntwo">
                <p>{data.title}</p>
              </td>
            </tr>
          )}
          {data.creator && (
            <tr>
              <td className="columnone">
                <p>Creator</p>
              </td>
              <td className="columntwo">
                <p>
                  <a href="https://www.centraalmuseum.nl/nl/maker/{data.creator}">
                    {data.creator}
                  </a>
                  <span> </span>
                  {data.creatorDetails}
                </p>
              </td>
            </tr>
          )}
          {data.datering && (
            <tr>
              <td className="columnone">
                <p>Datering</p>
              </td>
              <td className="columntwo">
                <p>{data.datering}</p>
              </td>
            </tr>
          )}
          {data.materialTechnique && (
            <tr>
              <td className="columnone">
                <p>Materiaal / Techniek</p>
              </td>
              <td className="columntwo">
                <p>
                  <a
                    href={`https://www.centraalmuseum.nl/nl/zoeken#b_start=0&c16=${data.materialTechnique}`}
                  >
                    {data.materialTechnique}
                  </a>
                </p>
              </td>
            </tr>
          )}
          {data.inventarishnummer && (
            <tr>
              <td className="columnone">
                <p>Inventarisnummer</p>
              </td>
              <td className="columntwo">
                <p>{data.inventarishnummer}</p>
              </td>
            </tr>
          )}
          {data.objectnaam && (
            <tr>
              <td className="columnone">
                <p>Objectnaam</p>
              </td>
              <td className="columntwo">
                <p>
                  <a
                    href={`https://www.centraalmuseum.nl/nl/zoeken#b_start=0&c32=${data.objectnaam}`}
                  >
                    {data.objectnaam}
                  </a>
                </p>
              </td>
            </tr>
          )}
          {data.verwerving && (
            <tr>
              <td className="columnone">
                <p>Verwerving</p>
              </td>
              <td className="columntwo">
                <p>{data.verwerving}</p>
              </td>
            </tr>
          )}
          {data.afmetingen && (
            <tr>
              <td className="columnone">
                <p>Afmetingen</p>
              </td>
              <td className="columntwo">
                <p>
                  {' '}
                  {data.afmetingen.map((dim, index) => (
                    <p key={index}>{dim}</p>
                  ))}
                </p>
              </td>
            </tr>
          )}
          {data.opsschriften && (
            <tr>
              <td className="columnone">
                <p>Opsschriften / Merken</p>
              </td>
              <td className="columntwo">
                <p>{data.opsschriften}</p>
              </td>
            </tr>
          )}
          {data.motifs && (
            <tr>
              <td className="columnone">
                <p>Motief</p>
              </td>
              <td className="columntwo">
                <p>{data.motifs}</p>
              </td>
            </tr>
          )}
          {data.opmerkingen && (
            <tr>
              <td className="columnone">
                <p>Opmerkingen</p>
              </td>
              <td className="columntwo">
                <p>{data.opmerkingen}</p>
              </td>
            </tr>
          )}
          {data.documentation && (
            <tr>
              <td className="columnone">
                <p>Documentatie</p>
              </td>
              <td className="columntwo">
                {showAllDocumentation
                  ? data.documentation.map((doc, index) => (
                      <p key={index}>
                        {doc}
                        {index === 2 && data.documentation.length > 3 && (
                          <button
                            className="expand-button"
                            onClick={() =>
                              setShowAllDocumentation(!showAllDocumentation)
                            }
                          >
                            Toon minder -
                          </button>
                        )}
                      </p>
                    ))
                  : data.documentation.slice(0, 3).map((doc, index) => (
                      <p key={index}>
                        {doc}
                        {index === 2 && (
                          <button
                            className="expand-button"
                            onClick={() =>
                              setShowAllDocumentation(!showAllDocumentation)
                            }
                          >
                            Toon minder +
                          </button>
                        )}
                      </p>
                    ))}
              </td>
            </tr>
          )}

          {data.exhibition && (
            <tr>
              <td className="columnone">
                <p>Tentoonstellingen</p>
              </td>
              <td className="columntwo">
                {showAllExhibition
                  ? data.exhibition.map((exh, index) => (
                      <p key={index}>
                        {exh}
                        {index === 2 && data.exhibition.length > 3 && (
                          <button
                            className="expand-button"
                            onClick={() =>
                              setShowAllExhibition(!showAllExhibition)
                            }
                          >
                            Toon minder -
                          </button>
                        )}
                      </p>
                    ))
                  : data.exhibition.slice(0, 3).map((exh, index) => (
                      <p key={index}>
                        {exh}
                        {index === 2 && (
                          <button
                            className="expand-button"
                            onClick={() =>
                              setShowAllExhibition(!showAllExhibition)
                            }
                          >
                            Toon minder +
                          </button>
                        )}
                      </p>
                    ))}
              </td>
            </tr>
          )}

          {data.PIDworkLink && (
            <tr>
              <td className="columnone">
                <p>PIDworkLink</p>
              </td>
              <td className="columntwo">
                <p>
                  <p>
                    Als u naar dit object wilt verwijzen gebruik dan de duurzame
                    URL:
                  </p>
                  <div dangerouslySetInnerHTML={{ __html: data.PIDworkLink }} />
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
                Ziet u een fout? Of heeft u extra informatie over dit object?
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
  );
}

export default XMLInfoComponent;
