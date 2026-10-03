import { HERO_SIZES, type Picture } from "../lib/assets";

/** An imagetools `?hero` picture: AVIF/WebP sources with an <img> fallback. */
export default function ResponsivePicture({
  picture,
  alt,
  eager,
  sizes = HERO_SIZES,
  className,
}: {
  picture: Picture;
  alt: string;
  eager: boolean;
  sizes?: string;
  className?: string;
}) {
  return (
    <picture className={className}>
      {Object.entries(picture.sources).map(([format, srcset]) => (
        <source key={format} type={`image/${format}`} srcSet={srcset} sizes={sizes} />
      ))}
      <img
        src={picture.img.src}
        width={picture.img.w}
        height={picture.img.h}
        alt={alt}
        decoding="async"
        fetchPriority={eager ? "high" : undefined}
        loading={eager ? "eager" : "lazy"}
      />
    </picture>
  );
}
