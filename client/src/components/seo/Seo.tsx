import { useEffect } from 'react';
import { setSeo, type SeoMeta } from '../../lib/seo';

export const Seo: React.FC<SeoMeta> = (props) => {
  useEffect(() => {
    setSeo(props);
  }, [props.title, props.description, props.image, props.url, props.type]);
  return null;
};