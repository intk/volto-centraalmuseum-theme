import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { searchContent } from '@plone/volto/actions';
import { Link } from 'react-router-dom';
import { flattenToAppURL } from '@plone/volto/helpers';

const FetchAuthor = ({ item }) => {
  const [authorDetails, setAuthorDetails] = useState(); // Initialize with item to ensure all data is preserved
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchBlogWriterData = async () => {
      if (!item?.Creator) return;

      const params = new URLSearchParams({
        // portal_type: 'blogwriter',
        blogWriterID: item.Creator.toLowerCase(),
        // metadata_fields: JSON.stringify(['title', 'description']),
      });

      {
        console.log(`/++api++/nl/search_blogwriters?${params.toString()}`);
      }

      try {
        const response = await fetch(
          `/++api++/nl/search_blogwriters?${params.toString()}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data) {
          setAuthorDetails(data[0]);
        }
      } catch (error) {
        console.error('Error fetching blog writer data:', error);
      }
    };

    fetchBlogWriterData();
  }, [item]);

  return (
    <div>
      {console.log(authorDetails)}
      {authorDetails && (
        <div className="blog-writer">
          {authorDetails.preview_image_url && (
            <div className="writer-image-wrapper">
              <Link to={flattenToAppURL(authorDetails['@id'])}>
                <img
                  src={flattenToAppURL(authorDetails.preview_image_url)}
                  alt="writer"
                ></img>
              </Link>
            </div>
          )}
          <Link to={flattenToAppURL(authorDetails['@id'])}>
            <p>{authorDetails.title}</p>
          </Link>
        </div>
      )}{' '}
    </div>
  );
};

export default FetchAuthor;
