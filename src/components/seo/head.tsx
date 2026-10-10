import { Helmet, HelmetData } from 'react-helmet-async';

type HeadProps = {
  title?: string;
  description?: string;
};

const helmetData = new HelmetData({});

export const Head = ({ title = '', description = '' }: HeadProps = {}) => {
  return (
    <Helmet
      helmetData={helmetData}
      title={title ? `AI Advisor | ${title}` : undefined}
      defaultTitle="AI Advisor"
    >
      <meta name="description" content={description} />
    </Helmet>
  );
};
