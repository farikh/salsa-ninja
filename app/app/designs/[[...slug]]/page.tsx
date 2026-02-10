import { readFile } from 'fs/promises';
import { join } from 'path';
import { notFound } from 'next/navigation';

export const dynamic = 'force-static';

const DESIGN_FILES = [
  'index.html',
  'dark-ninja.html',
  'design-10-organic-earth.html',
  'design-5-minimal-zen.html',
  'design-6-fiery-motion.html',
  'design-7-luxe-gold.html',
  'design-8-retro-havana.html',
  'design-9-neon-pulse.html',
  'design3-tropical-fiesta.html',
  'design4-bold-street.html',
  'warm-elegance.html',
];

export async function generateStaticParams() {
  return [
    { slug: [] }, // for /designs
    ...DESIGN_FILES.filter(f => f !== 'index.html').map(file => ({
      slug: [file.replace('.html', '')],
    })),
  ];
}

export default async function DesignsPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const slug = params.slug || [];
  const filename = slug.length === 0
    ? 'index.html'
    : `${slug.join('/')}.html`;

  if (!DESIGN_FILES.includes(filename)) {
    notFound();
  }

  try {
    const filePath = join(process.cwd(), 'public', 'designs', filename);
    const content = await readFile(filePath, 'utf-8');

    return (
      <div dangerouslySetInnerHTML={{ __html: content }} />
    );
  } catch (error) {
    notFound();
  }
}
