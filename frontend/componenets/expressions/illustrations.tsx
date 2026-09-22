import { ReactElement, SVGProps } from "react";

type IllustrationProps = SVGProps<SVGSVGElement>;
type IllustrationComponent = (props: IllustrationProps) => ReactElement;

/** "ins kalte Wasser springen" - jumping off a cliff into open water. */
function JumpingIntoWaterIllustration(props: IllustrationProps) {
    return (
        <svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="" {...props}>
            <rect width="400" height="180" fill="#bfe3f2" />
            <circle cx="340" cy="40" r="22" fill="#fde68a" />
            <path d="M0 60 L110 60 L150 0 L0 0 Z" fill="#60a5fa" />
            <path d="M0 60 L120 60 L155 15 L30 15 Z" fill="#3b82f6" />
            <circle cx="163" cy="35" r="9" fill="#1e293b" />
            <path d="M163 44 L170 70 L158 78" stroke="#1e293b" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M163 50 L182 58" stroke="#1e293b" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M163 50 L148 42" stroke="#1e293b" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M170 70 L188 66" stroke="#1e293b" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M158 78 L145 92" stroke="#1e293b" strokeWidth="5" fill="none" strokeLinecap="round" />
            <rect y="118" width="400" height="62" fill="#0ea5e9" />
            <path
                d="M0 118 Q20 112 40 118 T80 118 T120 118 T160 118 T200 118 T240 118 T280 118 T320 118 T360 118 T400 118 V180 H0 Z"
                fill="#38bdf8"
            />
            <path
                d="M0 132 Q20 126 40 132 T80 132 T120 132 T160 132 T200 132 T240 132 T280 132 T320 132 T360 132 T400 132 V180 H0 Z"
                fill="#0ea5e9"
                opacity="0.6"
            />
        </svg>
    );
}

/** "den Kopf in den Sand stecken" - burying one's head in the sand instead of facing a problem. */
function HeadInSandIllustration(props: IllustrationProps) {
    return (
        <svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="" {...props}>
            <rect width="400" height="180" fill="#fde9c8" />
            <circle cx="60" cy="35" r="18" fill="#fde68a" />
            <ellipse cx="200" cy="150" rx="220" ry="60" fill="#e9c185" />
            <ellipse cx="200" cy="145" rx="220" ry="45" fill="#f2d19f" />
            <rect x="176" y="70" width="26" height="70" rx="13" fill="#1e293b" />
            <ellipse cx="189" cy="128" rx="30" ry="16" fill="#e9c185" />
            <path d="M150 150 L165 100" stroke="#1e293b" strokeWidth="9" strokeLinecap="round" />
            <path d="M230 150 L215 100" stroke="#1e293b" strokeWidth="9" strokeLinecap="round" />
            <path d="M176 150 L172 108" stroke="#1e293b" strokeWidth="9" strokeLinecap="round" />
            <path d="M202 150 L206 108" stroke="#1e293b" strokeWidth="9" strokeLinecap="round" />
        </svg>
    );
}

/** "zwei Fliegen mit einer Klappe schlagen" - hitting two flies with one swat. */
function TwoBirdsOneStoneIllustration(props: IllustrationProps) {
    return (
        <svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="" {...props}>
            <rect width="400" height="180" fill="#dbeafe" />
            <circle cx="80" cy="60" r="7" fill="#334155" />
            <path d="M80 60 L64 52 M80 60 L96 52 M80 60 L70 68 M80 60 L90 68" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
            <circle cx="150" cy="30" r="7" fill="#334155" />
            <path d="M150 30 L134 22 M150 30 L166 22 M150 30 L140 38 M150 30 L160 38" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
            <g transform="rotate(28 260 90)">
                <rect x="250" y="20" width="14" height="90" rx="7" fill="#92400e" />
                <path d="M215 0 h90 a10 10 0 0 1 10 10 v40 a10 10 0 0 1 -10 10 h-90 a10 10 0 0 1 -10 -10 v-40 a10 10 0 0 1 10 -10 Z" fill="#f87171" />
                <rect x="222" y="14" width="6" height="6" fill="#fecaca" />
                <rect x="238" y="14" width="6" height="6" fill="#fecaca" />
                <rect x="254" y="14" width="6" height="6" fill="#fecaca" />
                <rect x="270" y="14" width="6" height="6" fill="#fecaca" />
                <rect x="222" y="30" width="6" height="6" fill="#fecaca" />
                <rect x="238" y="30" width="6" height="6" fill="#fecaca" />
                <rect x="254" y="30" width="6" height="6" fill="#fecaca" />
                <rect x="270" y="30" width="6" height="6" fill="#fecaca" />
            </g>
        </svg>
    );
}

/** "den Faden verlieren" - losing the thread of what one was saying. */
function LostTheThreadIllustration(props: IllustrationProps) {
    return (
        <svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="" {...props}>
            <rect width="400" height="180" fill="#ede9fe" />
            <circle cx="110" cy="90" r="34" fill="#a78bfa" />
            <circle cx="110" cy="90" r="34" fill="none" stroke="#7c3aed" strokeWidth="3" strokeDasharray="6 5" />
            <path
                d="M140 90 C 190 60, 230 130, 280 90 S 340 50, 380 90"
                fill="none"
                stroke="#7c3aed"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="2 8"
            />
            <circle cx="380" cy="90" r="5" fill="#7c3aed" />
        </svg>
    );
}

const normalize = (expression: string) => expression.trim().toLowerCase();

export const EXPRESSION_ILLUSTRATIONS: Record<string, IllustrationComponent> = {
    [normalize("ins kalte Wasser springen")]: JumpingIntoWaterIllustration,
    [normalize("den Kopf in den Sand stecken")]: HeadInSandIllustration,
    [normalize("zwei Fliegen mit einer Klappe schlagen")]: TwoBirdsOneStoneIllustration,
    [normalize("den Faden verlieren")]: LostTheThreadIllustration,
};

export function getIllustrationFor(expression: string): IllustrationComponent | null {
    return EXPRESSION_ILLUSTRATIONS[normalize(expression)] ?? null;
}
