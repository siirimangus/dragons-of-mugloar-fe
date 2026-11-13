import ambassadorOnPaper from '../../assets/ambassador-on-paper.webp';
import dragonInBarn from '../../assets/dragon-in-barn.webp';
import zeldaOnPaper from '../../assets/zelda-on-paper.webp';
import styles from './Illustration.module.css';

export type IllustrationSlot = 'hero' | 'empty-board' | 'summary' | 'ad';

type Artwork = {
    readonly src: string;
    readonly alt: string;
    readonly width: number;
    readonly height: number;
};

/** Slots that already have real artwork. Every other slot still draws a placeholder. */
const ARTWORK: Partial<Record<IllustrationSlot, Artwork>> = {
    hero: {
        src: zeldaOnPaper,
        // The picture contains text, so the description carries it.
        alt: 'Parchment poster reading "Missing: Zelda, reward on return", with a pen sketch of a bird pecking at the ground',
        width: 1200,
        height: 1092,
    },
    'empty-board': {
        src: ambassadorOnPaper,
        // The picture contains text, so the description carries it.
        alt: 'Parchment titled "Royal Request of Escort": the Shacoman ambassador Mr Tao is to arrive safely in the capital, cape included, beside a pen sketch of a hooded figure',
        width: 800,
        height: 571,
    },
    summary: {
        src: dragonInBarn,
        alt: 'Pen sketch on parchment of a dragon looking out of a small barn, with a burning tree and a fire nearby',
        width: 1200,
        height: 857,
    },
};

const PLACEHOLDER_LABELS: Record<'ad', string> = {
    ad: 'Message',
};

/** A named slot for artwork: the picture if there is one, otherwise a labelled placeholder. */
export function Illustration({ slot }: { readonly slot: IllustrationSlot }) {
    const artwork = ARTWORK[slot];
    if (artwork) {
        return (
            <img
                className={`${styles.artwork} ${styles[`artwork-${slot}`] ?? ''}`}
                src={artwork.src}
                alt={artwork.alt}
                width={artwork.width}
                height={artwork.height}
                data-slot={slot}
            />
        );
    }
    // Only slots without artwork reach this point, so a label always exists.
    const label = PLACEHOLDER_LABELS[slot as keyof typeof PLACEHOLDER_LABELS];
    return (
        <div
            className={`${styles.slot} ${styles[slot] ?? ''}`}
            role="img"
            aria-label={`${label} illustration placeholder`}
            data-slot={slot}
        >
            <span aria-hidden="true">{label}</span>
        </div>
    );
}
