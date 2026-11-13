import styles from './Illustration.module.css';

export type IllustrationSlot = 'hero' | 'empty-board' | 'summary' | 'ad';

const LABELS: Record<IllustrationSlot, string> = {
  hero: 'Dragon',
  'empty-board': 'Empty message board',
  summary: 'Dragon at rest',
  ad: 'Message',
};

/** A named slot for artwork. Today it draws a simple placeholder; drop real art in here later. */
export function Illustration({ slot }: { readonly slot: IllustrationSlot }) {
  return (
    <div
      className={`${styles.slot} ${styles[slot] ?? ''}`}
      role="img"
      aria-label={`${LABELS[slot]} illustration placeholder`}
      data-slot={slot}
    >
      <span aria-hidden="true">{LABELS[slot]}</span>
    </div>
  );
}
