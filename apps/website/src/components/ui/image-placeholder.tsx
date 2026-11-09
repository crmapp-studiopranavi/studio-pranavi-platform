import { cn } from '@/lib/utils';

interface ImagePlaceholderProps {
  src?: string | null;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchpriority?: 'high' | 'low' | 'auto';
  width?: number;
  height?: number;
}

export function ImagePlaceholder({
  src,
  alt,
  className,
  loading = 'lazy',
  fetchpriority,
  width,
  height,
}: ImagePlaceholderProps) {
  if (!src) {
    return (
      <div
        className={cn('sp-img-placeholder', className)}
        role="img"
        aria-label={alt}
        style={{ backgroundColor: 'var(--sp-stone)' }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('h-full w-full object-cover', className)}
      loading={loading}
      fetchPriority={fetchpriority}
      width={width}
      height={height}
    />
  );
}
