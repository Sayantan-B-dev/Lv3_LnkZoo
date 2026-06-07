'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function CategoryRedirect({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/categories?category=${encodeURIComponent(category)}`);
  }, [category, router]);

  return null;
}
