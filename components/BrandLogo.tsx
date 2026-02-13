import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse, G } from 'react-native-svg';
import Colors from '@/constants/colors';

const C = Colors.dark;

const PAW_COLOR = '#1B2D3B';
const PULSE_COLOR = '#2D6A4F';

interface BrandLogoProps {
  size?: 'small' | 'medium' | 'large';
  showPaw?: boolean;
  showText?: boolean;
  showSubtitle?: boolean;
}

function PawWithPulse({ scale = 1 }: { scale?: number }) {
  const w = 100 * scale;
  const h = 100 * scale;
  return (
    <Svg width={w} height={h} viewBox="0 0 100 100">
      <G rotation="-25" origin="20, 20">
        <Ellipse cx="20" cy="20" rx="8" ry="13" fill={PAW_COLOR} />
      </G>
      <G rotation="-8" origin="38, 8">
        <Ellipse cx="38" cy="8" rx="9" ry="14" fill={PAW_COLOR} />
      </G>
      <G rotation="8" origin="62, 8">
        <Ellipse cx="62" cy="8" rx="9" ry="14" fill={PAW_COLOR} />
      </G>
      <G rotation="25" origin="80, 20">
        <Ellipse cx="80" cy="20" rx="8" ry="13" fill={PAW_COLOR} />
      </G>
      <Path
        d="M50 35 C34 35, 16 48, 18 66 C19 74, 26 82, 34 84 C39 85, 43 80, 47 77 C49 76, 51 76, 53 77 C57 80, 61 85, 66 84 C74 82, 81 74, 82 66 C84 48, 66 35, 50 35Z"
        fill={PAW_COLOR}
      />
      <Path
        d="M26 63 L36 63 L40 53 L45 73 L50 58 L55 67 L60 63 L74 63"
        stroke={PULSE_COLOR}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export default function BrandLogo({ size = 'large', showPaw = true, showText = true, showSubtitle = true }: BrandLogoProps) {
  const scale = size === 'large' ? 1.4 : size === 'medium' ? 1 : 0.7;
  const titleSize = size === 'large' ? 36 : size === 'medium' ? 28 : 20;
  const subtitleSize = size === 'large' ? 16 : size === 'medium' ? 13 : 11;

  return (
    <View style={styles.container}>
      {showPaw && <PawWithPulse scale={scale} />}
      {showText && (
        <View style={styles.textRow}>
          <Text style={[styles.titlePet, { fontSize: titleSize }]}>Pet</Text>
          <Text style={[styles.titleParent, { fontSize: titleSize }]}>Parent</Text>
        </View>
      )}
      {showText && showSubtitle && (
        <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>AI Vet Assistant & Pet Health Log</Text>
      )}
    </View>
  );
}

export { PawWithPulse };

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  titlePet: {
    fontFamily: 'Inter_700Bold',
    color: PAW_COLOR,
  },
  titleParent: {
    fontFamily: 'Inter_700Bold',
    color: PULSE_COLOR,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
});
