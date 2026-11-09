import { Helmet } from 'react-helmet-async';

interface PageMetaProps {
  title: string;
  description?: string;
  path?: string;
}

const SITE_NAME = 'Studio Pranavi';
const BASE_URL = import.meta.env.VITE_SITE_URL ?? '';

export function PageMeta({ title, description, path }: PageMetaProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonical = path ? `${BASE_URL}${path}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:site_name" content={SITE_NAME} />
    </Helmet>
  );
}
