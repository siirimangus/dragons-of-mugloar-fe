import ambassadorOnPaper from '../../assets/ambassador-on-paper.webp';
import dragonInBarn from '../../assets/dragon-in-barn.webp';
import zeldaOnPaper from '../../assets/zelda-on-paper.webp';
import styles from './Illustration.module.css';

export type IllustrationSlot = 'hero' | 'empty-board' | 'summary';

type Artwork = {
    readonly src: string;
    readonly alt: string;
    readonly width: number;
    readonly height: number;
};

const ARTWORK: Record<IllustrationSlot, Artwork> = {
    hero: {
        src: zeldaOnPaper,
        alt: 'Parchment poster reading "Missing: Zelda, reward on return", with a pen sketch of a bird pecking at the ground',
        width: 1200,
        height: 1092,
    },
    'empty-board': {
        src: ambassadorOnPaper,
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

export function Illustration({ slot }: { readonly slot: IllustrationSlot }) {
    const { src, alt, width, height } = ARTWORK[slot];
    return (
        <img
            className={`${styles.artwork} ${styles[`artwork-${slot}`] ?? ''}`}
            src={src}
            alt={alt}
            width={width}
            height={height}
            data-slot={slot}
        />
    );
}
