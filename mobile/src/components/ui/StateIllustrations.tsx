import { View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

const BLUE = '#3F86F0';
const SOFT = '#EAF3FE';
const NAVY = '#344268';

/** A sad cloud with wind streaks: shown when the device has no connection. Decoration only. */
export function NoConnectionIllustration({ width = 260 }: { width?: number }) {
  return (
    <View
      style={{ width, height: width * 0.62 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" viewBox="0 0 260 160">
        {/* wind streaks */}
        <Rect x="8" y="76" width="92" height="22" rx="11" fill={SOFT} />
        <Rect x="28" y="52" width="70" height="20" rx="10" fill={SOFT} />
        <Rect x="150" y="62" width="100" height="22" rx="11" fill={SOFT} />
        <Rect x="170" y="100" width="70" height="22" rx="11" fill={SOFT} />
        <Circle cx="238" cy="112" r="10" fill={SOFT} />
        {/* sparkles */}
        <Circle cx="92" cy="28" r="5" fill="#BBD9FA" />
        <Circle cx="198" cy="26" r="4" fill="none" stroke="#BBD9FA" strokeWidth="2" />
        <Circle cx="226" cy="48" r="5" fill="#BBD9FA" />
        <Path d="M56 56l8 8M64 56l-8 8" stroke="#BBD9FA" strokeWidth="3" strokeLinecap="round" />
        <Path d="M166 36l8 8M174 36l-8 8" stroke="#BBD9FA" strokeWidth="3" strokeLinecap="round" />
        {/* cloud */}
        <Path
          d="M78 132c-16 0-28-10-28-24 0-12 9-22 22-24 2-22 20-38 42-38 20 0 36 13 41 31 20 0 36 14 36 32 0 12-8 23-20 23z"
          fill={SOFT}
          stroke={BLUE}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <Path
          d="M104 62c10-4 24-4 34 4"
          stroke="#BBD9FA"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* face */}
        <G stroke={BLUE} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <Path d="M98 92l12 7-12 7" />
          <Path d="M160 92l-12 7 12 7" />
        </G>
        <Circle cx="129" cy="116" r="7" fill="none" stroke={BLUE} strokeWidth="5" />
      </Svg>
    </View>
  );
}

/** A reader on a stack of books next to a big letter and a question mark: nothing was found. Decoration only. */
export function NotFoundIllustration({ width = 260 }: { width?: number }) {
  return (
    <View
      style={{ width, height: width * 0.78 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" viewBox="0 0 260 200">
        {/* sparkles and leaves */}
        <Circle cx="28" cy="70" r="4" fill={BLUE} />
        <Circle cx="78" cy="132" r="4" fill={BLUE} />
        <Circle cx="48" cy="104" r="3" fill="#D5DBE6" />
        <Circle cx="50" cy="160" r="4" fill="#D5DBE6" />
        <Path d="M96 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#D5DBE6" />
        <Path d="M30 150l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#D5DBE6" />
        <Circle cx="64" cy="140" r="7" fill="#E6E9EF" />
        {/* books */}
        <Rect x="44" y="168" width="108" height="14" rx="7" fill={NAVY} />
        <Rect x="62" y="154" width="86" height="13" rx="6.5" fill="#FFFFFF" stroke="#E2E6EE" />
        <Rect x="50" y="142" width="96" height="13" rx="6.5" fill={BLUE} />
        <Rect x="68" y="130" width="72" height="12" rx="6" fill={NAVY} />
        {/* reader */}
        <Path d="M84 124l36-6" stroke={NAVY} strokeWidth="15" strokeLinecap="round" fill="none" />
        <Path d="M120 118l-4 14" stroke={NAVY} strokeWidth="13" strokeLinecap="round" fill="none" />
        <Path
          d="M112 134l12 2"
          stroke="#F2B9A3"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <Path d="M78 74q-2 -6 6 -8l22 -2q10 2 8 12l-4 40-30 2z" fill={BLUE} />
        <Circle cx="94" cy="48" r="15" fill={NAVY} />
        <Circle cx="98" cy="54" r="12" fill="#F2B9A3" />
        <Path d="M84 52q4 -16 22 -10q-8 0 -10 10z" fill={NAVY} />
        <Path d="M104 96l30 -4 4 24 -30 4z" fill={NAVY} />
        <Path d="M92 84l16 14" stroke="#F2B9A3" strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* big letter A */}
        <Path
          d="M146 176l32-104c2-6 6-6 8 0l32 104"
          stroke={NAVY}
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path d="M162 148h46" stroke={NAVY} strokeWidth="14" strokeLinecap="round" />
        {/* question mark bubble */}
        <Circle cx="174" cy="58" r="34" fill="#F1F3F7" />
        <Path
          d="M164 50c0-8 6-13 12-13 7 0 12 5 12 11 0 8-9 9-10 17"
          stroke={BLUE}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx="178" cy="80" r="3.5" fill="none" stroke={BLUE} strokeWidth="3" />
      </Svg>
    </View>
  );
}
