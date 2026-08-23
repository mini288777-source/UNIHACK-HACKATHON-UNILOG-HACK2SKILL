import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../services/api';
import { ProcessingJob } from '../../types';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { gsap } from 'gsap';

interface ProcessingStatusProps {
  jobId: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

const STAGES = [
  { key: 'INGESTING', label: 'PDF File Validation', desc: 'Sanitizing upload & validating format' },
  { key: 'PARSING', label: 'Deterministic Parsing', desc: 'Extracting paginated text & table blocks' },
  { key: 'EXTRACTING', label: 'Schema-Aware LLM Extraction', desc: 'Extracting attributes & quoted page quotes' },
  { key: 'NORMALIZING', label: 'Unit & Material Normalization', desc: 'Converting units & standardizing materials' },
  { key: 'VALIDATING', label: 'Fastener Domain Rules Engine', desc: 'Validating thread pitch & grade compatibility' },
  { key: 'PERSISTING', label: 'Confidence & Trust Ledger', desc: 'Calculating confidence & saving product' }
];

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ jobId, onComplete, onError }) => {
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const activeStageRef = useRef<HTMLDivElement | null>(null);
  const pulseAnimRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    let intervalId: any = null;

    const pollJob = async () => {
      try {
        const currentJob = await api.getJobStatus(jobId);
        setJob(currentJob);

        if (currentJob.status === 'COMPLETED') {
          clearInterval(intervalId);
          setTimeout(() => {
            onComplete();
          }, 1000);
        } else if (currentJob.status === 'FAILED') {
          clearInterval(intervalId);
          onError(currentJob.error_message || 'Processing job failed.');
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    };

    pollJob();
    intervalId = setInterval(pollJob, 1500);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId, onComplete, onError]);

  // Handle active stage pulsing animation
  useEffect(() => {
    if (pulseAnimRef.current) {
      pulseAnimRef.current.kill();
      pulseAnimRef.current = null;
    }

    const isReduced = document.documentElement.classList.contains('motion-reduced');
    if (isReduced || !activeStageRef.current) return;

    pulseAnimRef.current = gsap.fromTo(
      activeStageRef.current,
      { scale: 1.0, borderColor: 'rgba(255, 171, 0, 0.4)' },
      {
        scale: 1.01,
        borderColor: 'rgba(255, 171, 0, 0.8)',
        duration: 1.0,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      }
    );

    return () => {
      if (pulseAnimRef.current) {
        pulseAnimRef.current.kill();
      }
    };
  }, [job?.current_stage]);

  if (!job) {
    return (
      <div className="p-8 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 text-[#FFAB00] animate-spin mb-3" />
        <p className="text-sm font-semibold text-white">Initializing AI Pipeline...</p>
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex(s => s.key === job.current_stage);
  const progressPct = job.progress_pct || 10.0;

  return (
    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl shadow-2xl space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#DD2E18]/20 border border-[#FFAB00]/30 flex items-center justify-center text-[#FFAB00]">
            {job.status === 'COMPLETED' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : job.status === 'FAILED' ? (
              <AlertCircle className="w-5 h-5 text-[#DD2E18]" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin text-[#FFAB00]" />
            )}
          </div>
          <div className="text-left">
            <h3 className="text-base font-bold text-white font-heading">
              {job.status === 'COMPLETED'
                ? 'Processing Complete!'
                : job.status === 'FAILED'
                ? 'Processing Failed'
                : 'AI Pipeline Executing...'}
            </h3>
            <p className="text-[10px] font-mono text-slate-500">ID: {jobId}</p>
          </div>
        </div>
        <span className="text-xs font-bold text-[#FFAB00] bg-[#DD2E18]/20 px-3 py-1 rounded-full border border-[#FFAB00]/30 shadow-md">
          {progressPct}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-dark-900 rounded-full h-2 overflow-hidden border border-white/5 shadow-inner">
        <div
          className="bg-gradient-to-r from-[#DD2E18] via-[#FF6F00] to-[#FFAB00] h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        ></div>
      </div>

      {/* Pipeline Stage Timeline */}
      <div className="space-y-2.5 pt-2 text-left">
        {STAGES.map((stg, idx) => {
          const isDone = idx < currentStageIndex || job.status === 'COMPLETED';
          const isCurrent = idx === currentStageIndex && job.status !== 'COMPLETED';

          return (
            <div
              key={stg.key}
              ref={isCurrent ? activeStageRef : null}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                isCurrent
                  ? 'bg-[#DD2E18]/15 border-[#FFAB00]/40 glow-ring-orange shadow-lg'
                  : isDone
                  ? 'bg-white/5 border-white/5 opacity-70'
                  : 'bg-transparent border-transparent opacity-30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner'
                      : isCurrent
                      ? 'bg-[#FFAB00] text-black font-extrabold shadow-md'
                      : 'bg-white/5 text-slate-500 border border-white/5'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white font-heading">{stg.label}</h4>
                  <p className="text-[10px] text-slate-400 leading-normal">{stg.desc}</p>
                </div>
              </div>
              {isCurrent && <Loader2 className="w-4 h-4 animate-spin text-[#FFAB00]" />}
            </div>
          );
        })}
      </div>

      {job.error_message && (
        <div className="p-4 rounded-xl bg-[#DD2E18]/15 border border-[#DD2E18]/30 text-[#FFAB00] text-xs flex items-center gap-2 shadow-inner">
          <AlertCircle className="w-4 h-4 shrink-0 animate-bounce text-[#DD2E18]" />
          <span>{job.error_message}</span>
        </div>
      )}
    </div>
  );
};
