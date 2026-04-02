'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import FallbackAvatar from '@/components/shared/FallbackAvatar';
import { updateUserProfile } from '@/store/authSlice';
import { useTranslations } from '@/hooks/useTranslations';

type RoleFlow = 'client' | 'freelancer';
type ExperienceLevel = 'beginner' | 'intermediate' | 'expert';
type ActionChoice = 'post-job' | 'browse-gigs' | '';

interface PortfolioItem {
  title: string;
  link: string;
  image: string;
}

interface OnboardingData {
  fullName: string;
  profilePicture: string;
  title: string;
  bio: string;
  skills: string[];
  skillInput: string;
  experienceLevel: ExperienceLevel;
  portfolioUrl: string;
  githubUrl: string;
  portfolioItems: PortfolioItem[];
  interests: string[];
  actionChoice: ActionChoice;
  gig: {
    title: string;
    description: string;
    category: string;
    deliveryDays: number;
    pricing: {
      basic: number;
      standard: number;
      premium: number;
    };
  };
}

const CLIENT_CATEGORIES = ['Web Development', 'AI', 'Design', 'Marketing', 'Writing', 'Video'];
const FREELANCER_SUGGESTED_SKILLS = ['React', 'Node.js', 'TypeScript', 'Python', 'UI/UX', 'Next.js'];
const GIG_CATEGORIES = ['Programming', 'Design', 'Writing', 'Marketing', 'Business', 'AI Services'];

const STORAGE_KEY = 'noretmy_onboarding_draft';

const defaultData: OnboardingData = {
  fullName: '',
  profilePicture: '',
  title: '',
  bio: '',
  skills: [],
  skillInput: '',
  experienceLevel: 'beginner',
  portfolioUrl: '',
  githubUrl: '',
  portfolioItems: [],
  interests: [],
  actionChoice: '',
  gig: {
    title: '',
    description: '',
    category: '',
    deliveryDays: 3,
    pricing: {
      basic: 10,
      standard: 20,
      premium: 40,
    },
  },
};

const OnboardingPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { t } = useTranslations('onboarding');

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
  const role: RoleFlow = user?.role === 'freelancer' || user?.isSeller ? 'freelancer' : 'client';
  const totalSteps = role === 'freelancer' ? 5 : 4;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [gigFiles, setGigFiles] = useState<File[]>([]);

  const progressPercent = useMemo(() => Math.round((currentStep / totalSteps) * 100), [currentStep, totalSteps]);

  const persistDraftLocal = (nextData: OnboardingData, nextStep: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: nextData, step: nextStep }));
    } catch (error) {
      console.error('Failed to store onboarding draft:', error);
    }
  };

  const uploadImages = async (files: File[]) => {
    if (!files.length) return [] as string[];

    const form = new FormData();
    files.forEach((f) => form.append('images', f));

    const response = await axios.post(`${BACKEND_URL}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });

    return response?.data?.urls || [];
  };

  const saveProgressToServer = async (stepOverride?: number) => {
    const step = stepOverride ?? currentStep;
    setIsSaving(true);
    try {
      await axios.put(
        `${BACKEND_URL}/users/onboarding/progress`,
        {
          step,
          data: {
            fullName: data.fullName,
            profilePicture: data.profilePicture,
            profileHeadline: data.title,
            description: data.bio,
            skills: data.skills,
            experienceLevel: data.experienceLevel,
            portfolioUrl: data.portfolioUrl,
            githubUrl: data.githubUrl,
            portfolioItems: data.portfolioItems,
            interests: data.interests,
          },
        },
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const load = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/users/onboarding/status`, {
          withCredentials: true,
        });
        const status = response?.data?.data;

        if (status?.isOnboarded) {
          if (status.role === 'freelancer') {
            router.push('/seller-board');
          } else {
            router.push('/');
          }
          return;
        }

        const localDraft = localStorage.getItem(STORAGE_KEY);
        const parsedLocal = localDraft ? JSON.parse(localDraft) : null;

        const mergedData: OnboardingData = {
          ...defaultData,
          ...parsedLocal?.data,
          fullName: status?.profile?.fullName || user.fullName || parsedLocal?.data?.fullName || '',
          profilePicture: status?.profile?.profilePicture || parsedLocal?.data?.profilePicture || '',
          title: status?.profile?.profileHeadline || parsedLocal?.data?.title || '',
          bio: status?.profile?.description || parsedLocal?.data?.bio || '',
          skills: status?.profile?.skills || parsedLocal?.data?.skills || [],
          experienceLevel: status?.profile?.experienceLevel || parsedLocal?.data?.experienceLevel || 'beginner',
          portfolioUrl: status?.profile?.portfolioUrl || parsedLocal?.data?.portfolioUrl || '',
          githubUrl: status?.profile?.githubUrl || parsedLocal?.data?.githubUrl || '',
          portfolioItems: status?.profile?.portfolioItems || parsedLocal?.data?.portfolioItems || [],
          interests: status?.profile?.interests || parsedLocal?.data?.interests || [],
        };

        setData(mergedData);
        setCurrentStep(Math.min(parsedLocal?.step || status?.onboardingStep || 1, totalSteps));
      } catch (error) {
        console.error('Failed to load onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [BACKEND_URL, router, totalSteps, user]);

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      persistDraftLocal(data, currentStep);
      saveProgressToServer(currentStep);
    }, 600);

    return () => clearTimeout(timer);
  }, [currentStep, data, isLoading]);

  const goNext = async () => {
    if (role === 'freelancer' && currentStep === 4) {
      if (!data.gig.title || !data.gig.description || !data.gig.category || data.gig.pricing.basic <= 0) {
        toast.error('Please fill all required gig fields.');
        return;
      }

      if (!gigFiles.length) {
        toast.error('Please upload at least one gig image.');
        return;
      }

      try {
        const form = new FormData();
        form.append('title', data.gig.title);
        form.append('cat', data.gig.category);
        form.append('description', data.gig.description);
        form.append('pricingPlan', JSON.stringify({
          basic: {
            title: 'Basic',
            description: data.gig.description,
            deliveryTime: data.gig.deliveryDays,
            price: data.gig.pricing.basic,
          },
          standard: {
            title: 'Standard',
            description: data.gig.description,
            deliveryTime: data.gig.deliveryDays,
            price: data.gig.pricing.standard,
          },
          premium: {
            title: 'Premium',
            description: data.gig.description,
            deliveryTime: data.gig.deliveryDays,
            price: data.gig.pricing.premium,
          },
        }));
        form.append('jobStatus', 'Active');

        if (gigFiles.length) {
          gigFiles.forEach((file) => form.append('images', file));
        }

        await axios.post(`${BACKEND_URL}/job/add-job`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });

        toast.success('First gig created successfully.');
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to create your first gig.');
        return;
      }
    }

    const nextStep = Math.min(currentStep + 1, totalSteps);
    setCurrentStep(nextStep);
    await saveProgressToServer(nextStep);
  };

  const complete = async () => {
    try {
      await axios.post(
        `${BACKEND_URL}/users/onboarding/complete`,
        { actionChoice: data.actionChoice || undefined },
        { withCredentials: true }
      );

      dispatch(updateUserProfile({ isOnboarded: true, onboardingStep: totalSteps }));

      localStorage.removeItem(STORAGE_KEY);

      if (role === 'freelancer') {
        toast.success('Your profile is ready. Start receiving orders!', { duration: 3000 });
        router.push('/seller-board');
        return;
      }

      if (data.actionChoice === 'post-job') {
        router.push('/order-request');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to complete onboarding.');
    }
  };

  const skipOptional = async () => {
    const nextStep = Math.min(currentStep + 1, totalSteps);
    setCurrentStep(nextStep);
    await saveProgressToServer(nextStep);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('loading') || 'Loading onboarding...'}</div>
      </div>
    );
  }

  const isLastStep = currentStep === totalSteps;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('title') || 'Complete Your Onboarding'}</h1>
            <span className="text-sm text-gray-500">{(t('step') || 'Step {{currentStep}} of {{totalSteps}}').replace('{{currentStep}}', String(currentStep)).replace('{{totalSteps}}', String(totalSteps))}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-2 bg-orange-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">{isSaving ? (t('saving') || 'Saving progress...') : (t('autosave') || 'Progress auto-saves.')}</p>
        </div>

        {role === 'freelancer' && currentStep === 1 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">{t('freelancer.basicInfo.title') || 'Basic Information'}</h2>
            <div className="flex items-center gap-4">
              <FallbackAvatar src={data.profilePicture} alt={data.fullName || 'User'} name={data.fullName || 'User'} size="lg" />
              <label className="text-sm text-gray-700">
                <span className="block mb-2">{t('freelancer.basicInfo.profilePicture') || 'Profile picture'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const previewUrl = URL.createObjectURL(file);
                    setData((prev) => ({ ...prev, profilePicture: previewUrl }));
                    dispatch(updateUserProfile({ profilePicture: previewUrl }));
                    try {
                      const urls = await uploadImages([file]);
                      const nextPicture = urls[0] || previewUrl;
                      setData((prev) => ({ ...prev, profilePicture: nextPicture }));
                      dispatch(updateUserProfile({ profilePicture: nextPicture }));
                    } catch (error) {
                      console.error('Failed to upload profile picture:', error);
                    }
                  }}
                />
              </label>
            </div>
            <input className="w-full border rounded-lg px-3 py-2" placeholder={t('freelancer.basicInfo.fullName') || 'Full Name'} value={data.fullName} onChange={(e) => setData((p) => ({ ...p, fullName: e.target.value }))} />
            <input className="w-full border rounded-lg px-3 py-2" placeholder={t('freelancer.basicInfo.headline') || 'Title (e.g. MERN Stack Developer)'} value={data.title} onChange={(e) => setData((p) => ({ ...p, title: e.target.value }))} />
            <textarea className="w-full border rounded-lg px-3 py-2" rows={4} placeholder={t('freelancer.basicInfo.bio') || 'Description / Bio'} value={data.bio} onChange={(e) => setData((p) => ({ ...p, bio: e.target.value }))} />
          </section>
        )}

        {role === 'freelancer' && currentStep === 2 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">{t('freelancer.skills.title') || 'Skills & Expertise'}</h2>
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2"
                placeholder="Add a skill"
                value={data.skillInput}
                onChange={(e) => setData((p) => ({ ...p, skillInput: e.target.value }))}
              />
              <button
                className="px-4 py-2 rounded-lg bg-gray-900 text-white"
                onClick={() => {
                  const skill = data.skillInput.trim();
                  if (!skill || data.skills.includes(skill)) return;
                  setData((p) => ({ ...p, skills: [...p.skills, skill], skillInput: '' }));
                }}
              >
                {t('freelancer.skills.add') || 'Add'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {FREELANCER_SUGGESTED_SKILLS.map((s) => (
                <button
                  key={s}
                  className="text-xs px-3 py-1 rounded-full border border-gray-300 hover:border-orange-400"
                  onClick={() => {
                    if (data.skills.includes(s)) return;
                    setData((p) => ({ ...p, skills: [...p.skills, s] }));
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((s) => (
                <span key={s} className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                  {s}
                </span>
              ))}
            </div>
            <select className="w-full border rounded-lg px-3 py-2" value={data.experienceLevel} onChange={(e) => setData((p) => ({ ...p, experienceLevel: e.target.value as ExperienceLevel }))}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </section>
        )}

        {role === 'freelancer' && currentStep === 3 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">{t('freelancer.portfolio.title') || 'Portfolio / Work (Optional)'}</h2>
            <input className="w-full border rounded-lg px-3 py-2" placeholder={t('freelancer.portfolio.url') || 'Portfolio URL'} value={data.portfolioUrl} onChange={(e) => setData((p) => ({ ...p, portfolioUrl: e.target.value }))} />
            <input className="w-full border rounded-lg px-3 py-2" placeholder={t('freelancer.portfolio.github') || 'GitHub URL'} value={data.githubUrl} onChange={(e) => setData((p) => ({ ...p, githubUrl: e.target.value }))} />
            <label className="block text-sm text-gray-700">
              <span className="block mb-2">{t('freelancer.portfolio.upload') || 'Upload project images'}</span>
              <input type="file" accept="image/*" multiple onChange={(e) => setPortfolioFiles(Array.from(e.target.files || []))} />
            </label>
            <button
              className="px-4 py-2 rounded-lg border border-gray-300"
              onClick={async () => {
                if (!portfolioFiles.length) return;
                const urls = await uploadImages(portfolioFiles);
                const newItems = urls.map((url, i) => ({ title: `Project ${data.portfolioItems.length + i + 1}`, image: url, link: '' }));
                setData((p) => ({ ...p, portfolioItems: [...p.portfolioItems, ...newItems] }));
                setPortfolioFiles([]);
              }}
            >
              {t('freelancer.portfolio.uploadButton') || 'Upload portfolio images'}
            </button>
          </section>
        )}

        {role === 'freelancer' && currentStep === 4 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">{t('freelancer.gig.title') || 'Create Your First Gig (Mandatory)'}</h2>
            <input className="w-full border rounded-lg px-3 py-2" placeholder={t('freelancer.gig.gigTitle') || 'Gig Title'} value={data.gig.title} onChange={(e) => setData((p) => ({ ...p, gig: { ...p.gig, title: e.target.value } }))} />
            <textarea className="w-full border rounded-lg px-3 py-2" rows={4} placeholder={t('freelancer.gig.gigDescription') || 'Gig Description'} value={data.gig.description} onChange={(e) => setData((p) => ({ ...p, gig: { ...p.gig, description: e.target.value } }))} />
            <select className="w-full border rounded-lg px-3 py-2" value={data.gig.category} onChange={(e) => setData((p) => ({ ...p, gig: { ...p.gig, category: e.target.value } }))}>
              <option value="">{t('freelancer.gig.selectCategory') || 'Select category'}</option>
              {GIG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" min={1} className="w-full border rounded-lg px-3 py-2" placeholder={t('freelancer.gig.deliveryTime') || 'Delivery time (days)'} value={data.gig.deliveryDays} onChange={(e) => setData((p) => ({ ...p, gig: { ...p.gig, deliveryDays: Number(e.target.value) || 1 } }))} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="number" min={1} className="border rounded-lg px-3 py-2" placeholder={t('freelancer.gig.basicPrice') || 'Basic price'} value={data.gig.pricing.basic} onChange={(e) => setData((p) => ({ ...p, gig: { ...p.gig, pricing: { ...p.gig.pricing, basic: Number(e.target.value) || 1 } } }))} />
              <input type="number" min={1} className="border rounded-lg px-3 py-2" placeholder={t('freelancer.gig.standardPrice') || 'Standard price'} value={data.gig.pricing.standard} onChange={(e) => setData((p) => ({ ...p, gig: { ...p.gig, pricing: { ...p.gig.pricing, standard: Number(e.target.value) || 1 } } }))} />
              <input type="number" min={1} className="border rounded-lg px-3 py-2" placeholder={t('freelancer.gig.premiumPrice') || 'Premium price'} value={data.gig.pricing.premium} onChange={(e) => setData((p) => ({ ...p, gig: { ...p.gig, pricing: { ...p.gig.pricing, premium: Number(e.target.value) || 1 } } }))} />
            </div>
            <label className="block text-sm text-gray-700">
              <span className="block mb-2">{t('freelancer.gig.images') || 'Gig images'}</span>
              <input type="file" accept="image/*" multiple onChange={(e) => setGigFiles(Array.from(e.target.files || []))} />
            </label>
          </section>
        )}

        {role === 'freelancer' && currentStep === 5 && (
          <section className="space-y-3 text-center">
            <h2 className="text-lg font-semibold">{t('freelancer.completion.title') || 'Completion'}</h2>
            <p className="text-gray-700">{t('freelancer.completion.message') || 'Your profile is ready. Start receiving orders!'}</p>
          </section>
        )}

        {role === 'client' && currentStep === 1 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">{t('client.basicInfo.title') || 'Basic Information'}</h2>
            <div className="flex items-center gap-4">
              <FallbackAvatar src={data.profilePicture} alt={data.fullName || 'User'} name={data.fullName || 'User'} size="lg" />
              <label className="text-sm text-gray-700">
                <span className="block mb-2">{t('client.basicInfo.profilePicture') || 'Profile picture'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const previewUrl = URL.createObjectURL(file);
                    setData((prev) => ({ ...prev, profilePicture: previewUrl }));
                    dispatch(updateUserProfile({ profilePicture: previewUrl }));
                    try {
                      const urls = await uploadImages([file]);
                      const nextPicture = urls[0] || previewUrl;
                      setData((prev) => ({ ...prev, profilePicture: nextPicture }));
                      dispatch(updateUserProfile({ profilePicture: nextPicture }));
                    } catch (error) {
                      console.error('Failed to upload profile picture:', error);
                    }
                  }}
                />
              </label>
            </div>
            <input className="w-full border rounded-lg px-3 py-2" placeholder={t('client.basicInfo.fullName') || 'Full Name'} value={data.fullName} onChange={(e) => setData((p) => ({ ...p, fullName: e.target.value }))} />
          </section>
        )}

        {role === 'client' && currentStep === 2 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">{t('client.preferences.title') || 'Preferences'}</h2>
            <p className="text-sm text-gray-600">{t('client.preferences.description') || 'Select categories/interests'}</p>
            <div className="flex flex-wrap gap-2">
              {CLIENT_CATEGORIES.map((cat) => {
                const active = data.interests.includes(cat);
                return (
                  <button
                    key={cat}
                    className={`px-3 py-1 rounded-full text-sm border ${active ? 'bg-orange-100 text-orange-700 border-orange-300' : 'border-gray-300 text-gray-700'}`}
                    onClick={() => {
                      setData((p) => ({
                        ...p,
                        interests: active ? p.interests.filter((i) => i !== cat) : [...p.interests, cat],
                      }));
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {role === 'client' && currentStep === 3 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">{t('client.actionChoice.title') || 'Action Choice'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button className={`p-4 rounded-xl border text-left ${data.actionChoice === 'post-job' ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}`} onClick={() => setData((p) => ({ ...p, actionChoice: 'post-job' }))}>
                <h3 className="font-semibold">{t('client.actionChoice.postJob.title') || 'Post a Job'}</h3>
                <p className="text-sm text-gray-600 mt-1">{t('client.actionChoice.postJob.description') || 'Describe your project and receive proposals.'}</p>
              </button>
              <button className={`p-4 rounded-xl border text-left ${data.actionChoice === 'browse-gigs' ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}`} onClick={() => setData((p) => ({ ...p, actionChoice: 'browse-gigs' }))}>
                <h3 className="font-semibold">{t('client.actionChoice.browseGigs.title') || 'Browse Gigs'}</h3>
                <p className="text-sm text-gray-600 mt-1">{t('client.actionChoice.browseGigs.description') || 'Explore freelancer services and hire fast.'}</p>
              </button>
            </div>
          </section>
        )}

        {role === 'client' && currentStep === 4 && (
          <section className="space-y-3 text-center">
            <h2 className="text-lg font-semibold">{t('client.completion.title') || 'Completion'}</h2>
            <p className="text-gray-700">{t('client.completion.message') || 'Your account is ready. Choose your next action.'}</p>
          </section>
        )}

        <div className="mt-8 flex flex-wrap gap-3 justify-between">
          <button
            className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          >
            {t('buttons.back') || 'Back'}
          </button>

          <div className="flex gap-3">
            {((role === 'freelancer' && currentStep === 3) || (role === 'client' && currentStep === 2)) && (
              <button className="px-4 py-2 rounded-lg border border-gray-300" onClick={skipOptional}>
                {t('buttons.skip') || 'Skip'}
              </button>
            )}

            {!isLastStep ? (
              <button className="px-4 py-2 rounded-lg bg-orange-500 text-white" onClick={goNext}>
                {t('buttons.next') || 'Next'}
              </button>
            ) : (
              <button className="px-4 py-2 rounded-lg bg-green-600 text-white" onClick={complete}>
                {t('buttons.finish') || 'Finish'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default OnboardingPage;
