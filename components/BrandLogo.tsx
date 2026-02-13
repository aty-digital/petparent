import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

const C = Colors.dark;

const PAW_COLOR = '#1B2D3B';
const PULSE_COLOR = '#2D6A4F';

const pawLogoImage = require('@/assets/images/paw-logo.png');

interface BrandLogoProps {
  size?: 'small' | 'medium' | 'large';
  showPaw?: boolean;
  showText?: boolean;
  showSubtitle?: boolean;
}

function PawImage({ size = 100 }: { size?: number }) {
  return (
    <Image
      source={pawLogoImage}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

export default function BrandLogo({ size = 'large', showPaw = true, showText = true, showSubtitle = true }: BrandLogoProps) {
  const pawSize = size === 'large' ? 280 : size === 'medium' ? 180 : 90;
  const titleSize = size === 'large' ? 36 : size === 'medium' ? 28 : 20;
  const subtitleSize = size === 'large' ? 16 : size === 'medium' ? 13 : 11;

  return (
    <View style={styles.container}>
      {showPaw && <PawImage size={pawSize} />}
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

export { PawImage };

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
