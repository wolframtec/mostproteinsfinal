import type { Metadata } from 'next';
import AboutPage from '@/views/AboutPage';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about Most Proteins, our mission, and our commitment to research-only compliance.',
  alternates: { canonical: '/about' },
};

export default function About() {
  return <AboutPage />;
}
