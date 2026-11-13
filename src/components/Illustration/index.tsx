import heroImage from '../../assets/dragon-in-barn.webp';
import styles from './Illustration.module.css';

export type IllustrationSlot = 'hero' | 'empty-board' | 'summary' | 'ad';

const LABELS: Record<Exclude<IllustrationSlot, 'hero'>, string> = {
    'empty-board': 'Empty message board',
    summary: 'Dragon at rest',
    ad: 'Message',
};

/**
 * A named slot for artwork. The hero slot shows the dragon sketch; the other slots still draw a
 * simple placeholder until their artwork exists.
 */
export function Illustration({ slot }: { readonly slot: IllustrationSlot }) {
    if (slot === 'hero') {
        return (
            <img
                className={styles.heroImage}
                src={heroImage}
                alt="Pen sketch on parchment of a dragon looking out of a small barn, with a burning tree and a fire nearby"
                width={1200}
                height={857}
                data-slot="hero"
            />
        );
    }
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
