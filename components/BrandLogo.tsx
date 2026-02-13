import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';
import Colors from '@/constants/colors';

const C = Colors.dark;

const PAW_COLOR = '#1B2D3B';
const PULSE_COLOR = '#2D6A4F';

interface BrandLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  showSubtitle?: boolean;
}

function PawWithPulse({ scale = 1 }: { scale?: number }) {
  const w = 100 * scale;
  const h = 100 * scale;
  return (
    <Svg width={w} height={h} viewBox="0 0 100 100">
      <Ellipse cx="30" cy="18" rx="10" ry="13" fill={PAW_COLOR} />
      <Ellipse cx="50" cy="12" rx="10" ry="13" fill={PAW_COLOR} />
      <Ellipse cx="70" cy="18" rx="10" ry="13" fill={PAW_COLOR} />
      <Path
        d="M50 38 C36 38, 20 50, 22 65 C24 78, 36 85, 42 82 C46 80, 48 76, 50 76 C52 76, 54 80, 58 82 C64 85, 76 78, 78 65 C80 50, 64 38, 50 38Z"
        fill={PAW_COLOR}
      />
      <Path
        d="M28 62 L38 62 L42 52 L46 72 L50 58 L54 66 L58 62 L72 62"
        stroke={PULSE_COLOR}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export default function BrandLogo({ size = 'large', showText = true, showSubtitle = true }: BrandLogoProps) {
  const scale = size === 'large' ? 1.4 : size === 'medium' ? 1 : 0.7;
  const titleSize = size === 'large' ? 36 : size === 'medium' ? 28 : 20;
  const subtitleSize = size === 'large' ? 16 : size === 'medium' ? 13 : 11;

  return (
    <View style={styles.container}>
      <PawWithPulse scale={scale} />
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
