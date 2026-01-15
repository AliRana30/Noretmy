"use client";
import ResetPasswordScreen from '@/components/shared/ResetPassword';
import 'material-icons/iconfont/material-icons.css';
import { Suspense } from 'react';

const ResetPassword = () => {
  return (
    <main className="overflow-x-hidden">
      {/* <CaseStudyTop></CaseStudyTop> */}
      {/* <CaseStudyLogoRow></CaseStudyLogoRow> */}
      {/* <CaseStudyMain></CaseStudyMain> */}
      {/* <LatestCaseStudies></LatestCaseStudies> */}
      {/* <ReadytoInnovate></ReadytoInnovate> */}
      {/* <SearchGigs></SearchGigs> */}
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <ResetPasswordScreen />
      </Suspense>
    </main>
  );
};

export default ResetPassword;
