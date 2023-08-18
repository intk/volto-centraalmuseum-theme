import React, { useState, useEffect } from 'react';

function XMLInfoComponent({ xmlString }) {
  const [data, setData] = useState({});
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  const HandleClick = () => {
    setDescriptionOpen(!descriptionOpen);
    console.log(descriptionOpen);
  };

  useEffect(() => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const getDescription = () => {
      const labels = xmlDoc.querySelectorAll('record > Label');
      return labels.length ? labels[0].textContent : null;
    };

    setData({
      description: getDescription(),
      title: xmlDoc.querySelector('record > Title > title')?.textContent,
      datering: xmlDoc.querySelector('production\\.date\\.start')?.textContent,
      materialTechnique: xmlDoc.querySelector('techniek\\.vrije\\.tekst')
        ?.textContent,
      inventarishnummer: xmlDoc.querySelector('object\\.object_number')
        ?.textContent,
      objectnaam: xmlDoc.querySelector('Object_name object-name term')
        ?.textContent,
      verwerving: `${
        xmlDoc.querySelector('acquisition\\.method')?.textContent || ''
      } ${
        xmlDoc.querySelector('acquisition\\.date')?.textContent || ''
      }`.trim(),
    });
  }, [xmlString]);

  return (
    <div className="data-wrapper">
      {data.description && (
        <div className="description-wrapper">
          <p id="description" className={`data-description ${descriptionOpen}`}>
            {data.description}
          </p>
          <button className='expand-button' onClick={HandleClick}>
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
                <p>{data.materialTechnique}</p>
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
                <p>{data.objectnaam}</p>
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
        </tbody>
      </table>
    </div>
  );
}

export default XMLInfoComponent;
