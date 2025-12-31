// import CaseStudyLogoRow from '@/components/shared/CaseStudyLogoRow';
import CaseStudyMain from '@/components/shared/CaseStudyMain';
import CaseStudyTop from '@/components/shared/CaseStudyTop';
import { LatestCaseStudies } from '@/components/shared/LatestCaseStudies';
import { ReadytoInnovate } from '@/components/shared/ReadytoInnovate';

const Casestudies = () => {
  return (
    <main className="overflow-x-hidden">
      <CaseStudyTop></CaseStudyTop>
      {/* <CaseStudyLogoRow></CaseStudyLogoRow> */}
      {/* <PricingPlans /> */}
      {/* <FaqComponent /> */}
      <CaseStudyMain></CaseStudyMain>
      <LatestCaseStudies></LatestCaseStudies>
      <ReadytoInnovate></ReadytoInnovate>
    </main>
  );
};

export default Casestudies;
