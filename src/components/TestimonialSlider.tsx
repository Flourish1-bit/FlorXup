import React, { useState, useEffect } from 'react';
import { Quote, Star, ShieldCheck } from 'lucide-react';
import { supabaseService } from '../lib/supabase';

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  organization: string;
  avatar: string;
  content: string;
  rating: number;
  badge: string;
  verified: boolean;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    name: 'Dr. Elena Rostova',
    role: 'Crisis Response Lead',
    organization: 'Global Aid Relief Network',
    avatar:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    content:
      'During emergency disaster deployments where cellular networks fail or are compromised, Florxup gives our teams instant, tamper-proof private coordination with zero setup friction.',
    rating: 5,
    badge: 'Humanitarian Responder',
    verified: true,
  },
  {
    id: 't-2',
    name: 'Marcus Vance',
    role: 'Investigative Journalist',
    organization: 'Freedom Press Initiative',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    content:
      'The ability to communicate with whistleblowers without requesting their phone numbers or personal metadata is a game changer. The client-side ECDH encryption is rock solid.',
    rating: 5,
    badge: 'Press & Privacy Advocate',
    verified: true,
  },
  {
    id: 't-3',
    name: 'Amina Al-Mansoor',
    role: 'Cybersecurity Researcher',
    organization: 'Open Cryptographic Alliance',
    avatar:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    content:
      'Auditing Florxup was a breath of fresh air: keys stay strictly in IndexedDB, the AES-GCM ciphertexts are non-recoverable by servers, and the WebCrypto implementation is textbook precision.',
    rating: 5,
    badge: 'Security Auditor',
    verified: true,
  },
  {
    id: 't-4',
    name: 'Kaito Tanaka',
    role: 'Open-Source Maintainer',
    organization: 'CivicTech Foundation',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    content:
      'The real-time global channels combined with seamless one-on-one encrypted rooms make community organizing faster than any legacy social tool I have used.',
    rating: 5,
    badge: 'Civic Tech Builder',
    verified: true,
  },
  {
    id: 't-5',
    name: 'Sofia Benitez',
    role: 'Human Rights Defender',
    organization: 'Defensores Libres LATAM',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    content:
      'In regions under active digital censorship, Florxup allowed our grassroots volunteers to safely dispatch medical logistics without exposing identities.',
    rating: 5,
    badge: 'Grassroots Coordinator',
    verified: true,
  },
  {
    id: 't-6',
    name: 'Lena Ortiz',
    role: 'Logistics Coordinator',
    organization: 'ReliefTrack',
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    content:
      'Florxup enabled our supply chain teams to coordinate drop-offs across municipalities securely — even when standard comms were down.',
    rating: 5,
    badge: 'Logistics',
    verified: true,
  },
  {
    id: 't-7',
    name: 'Noor Al-Hassan',
    role: 'Field Advocate',
    organization: 'SafeVoices',
    avatar:
      'https://images.unsplash.com/photo-1545996124-1b6f2d1b6b7a?w=150&auto=format&fit=crop&q=80',
    content:
      "The platform's privacy model helped protect vulnerable contacts while we coordinated safe passage and shelter logistics in hostile regions.",
    rating: 5,
    badge: 'Field Advocate',
    verified: true,
  },
];

export const TestimonialSlider: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS);
  const [currentIndex, setCurrentIndex] = useState(0);

  const SLIDE_DURATION = 5000;

  // Fetch testimonials from Supabase; fallback to defaults
  useEffect(() => {
    const client = supabaseService.getClient();
    if (!client) return;

    let mounted = true;
    const loadTestimonials = async () => {
      try {
        const res: any = await client
          .from('testimonials')
          .select('*')
          .order('created_at', { ascending: false });

        if (!mounted) return;
        if (res.error) {
          console.warn('Could not load testimonials from Supabase:', res.error);
          return;
        }
        if (Array.isArray(res.data) && res.data.length > 0) {
          setTestimonials(res.data as Testimonial[]);
          setCurrentIndex(0);
        }
      } catch (err: any) {
        console.warn('Supabase fetch error:', err);
      }
    };

    loadTestimonials();

    return () => {
      mounted = false;
    };
  }, []);

  // Simple autoplay loop
  useEffect(() => {
    if (!testimonials || testimonials.length === 0) return;
    const id = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % testimonials.length);
    }, SLIDE_DURATION);
    return () => clearInterval(id);
  }, [testimonials]);

  const current = testimonials[currentIndex % testimonials.length];

  return (
    <div id="testimonial-slideshow-container" className="w-full max-w-4xl mx-auto py-8">
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800/90 p-6 sm:p-10 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-emerald-400">
            <Quote className="w-5 h-5" />
          </div>
          <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{current.badge}</span>
          </div>
        </div>

        <p className="text-base sm:text-lg md:text-xl font-medium text-slate-200 leading-relaxed italic mb-6">"{current.content}"</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={current.avatar} alt={current.name} className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500/40" />
            <div>
              <div className="text-sm font-bold text-white">{current.name}</div>
              <div className="text-xs text-slate-400">{current.role} • <span className="text-slate-300">{current.organization}</span></div>
            </div>
          </div>
          <div className="text-amber-400 flex items-center gap-1">
            {Array.from({ length: current.rating }).map((_, i) => (
              <Star key={i} className="w-4 h-4" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialSlider;
