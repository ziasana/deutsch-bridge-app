import Svg, { G, Mask, Path, Rect } from 'react-native-svg';

const NAVY = '#16324F';
const AMBER = '#F2B544';
const D_PATH = 'M14 8H29A24 24 0 0 1 29 56H14Z';
const CHECK_PATH = 'M27 33l7 7 19-26';

type Props = {
  size?: number;
  /** tile = amber mark on a navy rounded tile (default); bare = amber mark only, for navy surfaces. */
  variant?: 'tile' | 'bare';
};

/** DeutschCertify brand mark: an outlined "D" with a check breaking out of it. Decorative - pair with a text label. */
export function BrandMark({ size = 120, variant = 'tile' }: Props) {
  const tile = variant === 'tile';
  const k = tile ? 0.78 : 0.9;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {tile ? <Rect width={64} height={64} rx={14} fill={NAVY} /> : null}
      <G transform={`translate(${32 - 34 * k} ${32 - 32 * k}) scale(${k})`}>
        <Mask id="check-gap" x="0" y="0" width="64" height="64" maskUnits="userSpaceOnUse">
          <Rect width={64} height={64} fill="#fff" />
          <Path d={CHECK_PATH} stroke="#000" strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Mask>
        <Path d={D_PATH} mask="url(#check-gap)" stroke={AMBER} strokeWidth={7} strokeLinejoin="round" fill="none" />
        <Path d={CHECK_PATH} stroke={AMBER} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
    </Svg>
  );
}
