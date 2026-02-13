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
        d="M50 46 C33 46, 14 58, 16 78 C17 86, 25 95, 34 96 C40 97, 44 91, 47 88 C49 87, 51 87, 53 88 C56 91, 60 97, 66 96 C75 95, 83 86, 84 78 C86 58, 67 46, 50 46Z"
        fill={PAW_COLOR}
      />
      <Path
        d="M24 76 L36 76 L40 65 L46 86 L50 70 L54 79 L58 76 L76 76"
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
