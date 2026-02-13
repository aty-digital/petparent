import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';
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
    <Svg width={w} height={h} viewBox="0 0 100 110">
      <Ellipse cx="22" cy="28" rx="9" ry="14" fill={PAW_COLOR} transform="rotate(-30, 22, 28)" />
      <Ellipse cx="40" cy="16" rx="10" ry="15" fill={PAW_COLOR} transform="rotate(-10, 40, 16)" />
      <Ellipse cx="60" cy="16" rx="10" ry="15" fill={PAW_COLOR} transform="rotate(10, 60, 16)" />
      <Ellipse cx="78" cy="28" rx="9" ry="14" fill={PAW_COLOR} transform="rotate(30, 78, 28)" />
      <Path
        d="M50 44 C42 44, 30 44, 20 54 C10 64, 12 78, 20 88 C28 98, 40 100, 46 94 C48 92, 49 90, 50 90 C51 90, 52 92, 54 94 C60 100, 72 98, 80 88 C88 78, 90 64, 80 54 C70 44, 58 44, 50 44Z"
        fill={PAW_COLOR}
      />
      <Path
        d="M22 72 L34 72 L38 61 L44 82 L50 66 L56 76 L60 72 L78 72"
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
