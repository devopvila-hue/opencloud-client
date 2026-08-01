import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, HelpCircle, Sparkles, User, Building, Globe } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardSection } from '@/components/Card';
import { ProgressBar } from '@/components/Chart';
import { cn } from '@/design-system/cn';
import { pageTransition } from '@/design-system/motion';

type Step = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const steps: Step[] = [
  {
    id: 'welcome',
    title: 'Welcome to your Business Operating System',
    description: 'Onboard the Executive Director and get your departments running.',
    icon: Sparkles,
  },
  {
    id: 'profile',
    title: 'Company profile',
    description: 'Configure your organization name, sector and visual branding.',
    icon: Building,
  },
  {
    id: 'departments',
    title: 'Activate departments',
    description: 'Choose which departments to install from the Marketplace.',
    icon: Globe,
  },
  {
    id: 'ai',
    title: 'AI provider keys',
    description: 'Configure BYOK keys for the providers your departments need.',
    icon: User,
  },
  {
    id: 'complete',
    title: 'You\'re ready',
    description: 'Review and launch your BOS command center.',
    icon: Check,
  },
];

const PROGRESS_KEY = 'opencloud-onboarding-progress';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(PROGRESS_KEY) : null;
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < steps.length) return parsed;
    }
    return 0;
  });
  const [completed, setCompleted] = useState<Set<string>>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`${PROGRESS_KEY}-completed`) : null;
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, String(currentStep));
    localStorage.setItem(`${PROGRESS_KEY}-completed`, JSON.stringify([...completed]));
  }, [currentStep, completed]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  function CurrentStepIcon() {
    const Icon = steps[currentStep].icon;
    return <Icon className="h-6 w-6" />;
  }

  const handleNext = () => {
    setCompleted((c) => new Set(c).add(steps[currentStep].id));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleComplete = () => {
    setCompleted((c) => new Set(c).add(steps[currentStep].id));
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(`${PROGRESS_KEY}-completed`);
    window.location.href = '/executive-office';
  };

  return (
    <motion.div
      initial={pageTransition}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mx-auto w-full max-w-2xl space-y-6 p-4 md:p-6 lg:p-8"
    >
      {/* Progress bar */}
      <div className="space-y-2">
        <ProgressBar value={progress} colorVar="--accent" className="h-1" />
        <div className="flex justify-between text-xs text-[color:var(--muted-foreground)]">
          {steps.map((step, i) => (
            <span key={step.id} className={cn(i === currentStep && 'text-[color:var(--foreground)] font-medium')}>
              Step {i + 1} of {steps.length}
            </span>
          ))}
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center gap-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isDone = completed.has(step.id);
          const isActive = i === currentStep;
          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(i)}
              type="button"
              className={cn(
                'relative flex h-10 w-10 items-center justify-center rounded-full border transition-all',
                isDone
                  ? 'border-[color:var(--color-emerald)] bg-[color:var(--color-emerald)]/10 text-[color:var(--color-emerald)]'
                  : isActive
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
                    : 'border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--muted-foreground)]',
              )}
            >
              <Icon className="h-4 w-4" />
              {isDone && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-[color:var(--color-emerald)] text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Check className="h-3 w-3" />
                </motion.div>
              )}
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Card variant="elevated">
            <CardSection>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] text-white"
                    style={{
                      background: `linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 60%, var(--color-fg-1)))`,
                    }}
                  >
                    {steps[currentStep].icon ? <CurrentStepIcon /> : null}
                  </div>
                  <div>
                    <h2 className="font-display text-[1.125rem] tracking-[-0.01em] text-[color:var(--foreground)]">
                      {steps[currentStep].title}
                    </h2>
                    <p className="mt-2 max-w-md text-sm text-[color:var(--muted-foreground)] text-pretty">
                      {steps[currentStep].description}
                    </p>
                  </div>
                </div>

                <StepContent stepId={steps[currentStep].id} />

                {currentStep === 0 && (
                  <motion.div
                    className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface-soft)]/30 p-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-start gap-2.5">
                      <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent)]" />
                      <div>
                        <p className="text-xs font-medium text-[color:var(--foreground)]">Why am I seeing this?</p>
                        <p className="mt-1 text-xs text-[color:var(--muted-foreground)] text-pretty">
                          This wizard helps you configure your Business Operating System. Your progress is saved
                          automatically, so you can close this at any time and pick up where you left off.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardSection>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          iconLeft={<ChevronLeft className="h-4 w-4" />}
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem(PROGRESS_KEY); localStorage.removeItem(`${PROGRESS_KEY}-completed`); setCurrentStep(0); setCompleted(new Set()); }}>
            Restart
          </Button>
          {currentStep === steps.length - 1 ? (
            <Button
              variant="primary"
              iconRight={<Sparkles className="h-4 w-4" />}
              onClick={handleComplete}
            >
              Launch BOS
            </Button>
          ) : (
            <Button variant="primary" iconRight={<ChevronRight className="h-4 w-4" />} onClick={handleNext}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StepContent({ stepId }: { stepId: string }) {
  const content: Record<string, React.ReactNode> = {
    welcome: (
      <ul className="space-y-2 text-sm text-[color:var(--muted-foreground)]">
        <li>• This wizard takes less than 2 minutes</li>
        <li>• Your progress is saved automatically</li>
        <li>• You can change anything later in Settings</li>
      </ul>
    ),
    profile: (
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Company name"
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
        />
        <input
          type="text"
          placeholder="Sector (e.g. Technology)"
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
        />
      </div>
    ),
    departments: (
      <p className="text-sm text-[color:var(--muted-foreground)]">
        You'll choose departments from the Marketplace. This step is completed when you activate your first department.
      </p>
    ),
    ai: (      <p className="text-sm text-[color:var(--muted-foreground)]">
        You'll configure your AI providers in Settings → AI Providers. This step is completed when at least one key is saved.
      </p>
    ),
    complete: (
      <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-emerald)]/30 bg-[color:var(--emerald-soft)] p-4">
        <p className="text-sm text-[color:var(--color-emerald)]">
          All steps are complete. You're ready to launch your Business Operating System.
        </p>
      </div>
    ),
  };

  return <div className="pt-4">{content[stepId] ?? null}</div>;
}
