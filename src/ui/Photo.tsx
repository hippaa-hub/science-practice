/** A generated illustration from public/img. Decorative support for the text, so alt text describes it briefly. */
export function Photo({ name, alt = '' }: { name: string; alt?: string }) {
  return (
    <figure className="photo">
      <img src={`./img/${name}.webp`} alt={alt} decoding="async" width={960} height={640} />
    </figure>
  );
}
