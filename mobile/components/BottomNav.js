// ============================================
// components/BottomNav.js - v2.0
// ✅ useCallback on press handlers
// ✅ Haptics added
// ✅ Performance optimized
// ============================================
import { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppContext } from '../context/AppContext';
import {
  colors,
  shadowMd,
  borderRadius,
} from '../theme';

export default function BottomNav() {
  const {
    screen,
    setScreen,
    cartCount,
    navTabs,
  } = useAppContext();

  // ✅ useCallback prevents re-creation on every render
  const handlePress = useCallback((tabScreen) => {
    Haptics.impactAsync(
      Haptics.ImpactFeedbackStyle.Light
    ).catch(() => {});
    setScreen(tabScreen);
  }, [setScreen]);

  return (
    <View style={styles.bottomNav}>
      {navTabs.map((tab) => {
        const isActive = screen === tab.s;
        return (
          <TouchableOpacity
            key={tab.s}
            style={styles.navItem}
            onPress={() => handlePress(tab.s)}
            activeOpacity={0.7}>
            <View style={styles.navIconWrap}>
              <Text style={[
                styles.navIcon,
                isActive && styles.navIconActive,
              ]}>
                {tab.icon}
              </Text>
              {tab.s === 'market' && cartCount > 0 && (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[
              styles.navLabel,
              isActive && styles.navLabelActive,
            ]}>
              {tab.label}
            </Text>
            {isActive && (
              <View style={styles.navDot} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position:       'absolute',
    bottom:         0,
    width:          '100%',
    height:         66,
    backgroundColor: colors.navBg,
    flexDirection:  'row',
    justifyContent: 'space-around',
    alignItems:     'center',
    borderTopWidth: 1,
    borderTopColor: colors.navBorder,
    ...shadowMd,
  },
  navItem: {
    alignItems:    'center',
    flex:          1,
    paddingVertical: 6,
  },
  navIconWrap: {
    position:     'relative',
    marginBottom: 3,
  },
  navIcon: {
    fontSize: 20,
  },
  navIconActive: {
    fontSize: 22,
  },
  navLabel: {
    fontSize:      9,
    color:         colors.navInactive,
    fontWeight:    '700',
    letterSpacing: 0.3,
  },
  navLabelActive: {
    fontSize:      9,
    color:         colors.navActive,
    fontWeight:    '900',
    letterSpacing: 0.3,
  },
  navDot: {
    width:           4,
    height:          4,
    borderRadius:    2,
    backgroundColor: colors.primary,
    marginTop:       3,
  },
  navBadge: {
    position:        'absolute',
    top:             -6,
    right:           -8,
    minWidth:        16,
    height:          16,
    borderRadius:    8,
    backgroundColor: colors.danger,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1.5,
    borderColor:     colors.navBg,
    paddingHorizontal: 3,
  },
  navBadgeText: {
    color:      colors.textWhite,
    fontSize:   8,
    fontWeight: '900',
  },
});