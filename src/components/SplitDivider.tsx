import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SplitDividerProps {
  ratio: number; // 0.15 to 0.85
  containerHeight: number;
  onRatioChange: (newRatio: number) => void;
  onDragStatusChange: (isDragging: boolean) => void;
  onSwapScreens: () => void;
  onResetRatio: () => void;
}

export const DIVIDER_HEIGHT = 38;

export const SplitDivider: React.FC<SplitDividerProps> = ({
  ratio,
  containerHeight,
  onRatioChange,
  onDragStatusChange,
  onSwapScreens,
  onResetRatio,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startRatioRef = useRef(ratio);
  const lastTapRef = useRef<number>(0);

  const availableHeight = Math.max(containerHeight - DIVIDER_HEIGHT, 1);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRatioRef.current = ratio;
        setIsDragging(true);
        onDragStatusChange(true);
      },
      onPanResponderMove: (_, gestureState) => {
        const deltaRatio = gestureState.dy / availableHeight;
        let newRatio = startRatioRef.current + deltaRatio;
        // Clamp between 15% and 85%
        newRatio = Math.min(0.85, Math.max(0.15, newRatio));
        onRatioChange(newRatio);
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        onDragStatusChange(false);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        onDragStatusChange(false);
      },
    })
  ).current;

  // Double tap to quickly reset to 50:50
  const handleGripPress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      onResetRatio();
    }
    lastTapRef.current = now;
  };

  const topPercent = Math.round(ratio * 100);
  const bottomPercent = 100 - topPercent;

  return (
    <View style={[styles.divider, isDragging && styles.dividerActive]}>
      {/* Quick 50:50 reset button / percentage badge */}
      <TouchableOpacity
        style={[styles.badgeButton, isDragging && styles.badgeButtonActive]}
        onPress={onResetRatio}
        activeOpacity={0.7}
      >
        <Text style={[styles.badgeText, isDragging && styles.badgeTextActive]}>
          {topPercent}% : {bottomPercent}%
        </Text>
      </TouchableOpacity>

      {/* Dynamic Draggable Center Handle */}
      <View
        style={styles.draggableArea}
        {...panResponder.panHandlers}
        onTouchEnd={handleGripPress}
      >
        <View style={[styles.gripBar, isDragging && styles.gripBarActive]}>
          <View style={[styles.dragDots, isDragging && styles.dragDotsActive]} />
        </View>
        <Text style={styles.dragHint}>
          {isDragging ? 'Kéo để chỉnh tỉ lệ' : 'Vuốt để kéo • Chạm 2 lần về 50:50'}
        </Text>
      </View>

      {/* Swap screens button */}
      <TouchableOpacity
        style={styles.swapButton}
        onPress={onSwapScreens}
        activeOpacity={0.7}
      >
        <Ionicons name="swap-vertical" size={16} color="#0A84FF" />
        <Text style={styles.swapText}>Đổi chỗ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  divider: {
    height: DIVIDER_HEIGHT,
    backgroundColor: '#1E1E22',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#38383E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    zIndex: 99,
  },
  dividerActive: {
    backgroundColor: '#26262C',
    borderColor: '#0A84FF',
  },
  badgeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#2C2C32',
  },
  badgeButtonActive: {
    backgroundColor: '#0A84FF',
  },
  badgeText: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
  draggableArea: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  gripBar: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#545458',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  gripBarActive: {
    width: 64,
    height: 6,
    backgroundColor: '#0A84FF',
  },
  dragDots: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dragDotsActive: {
    backgroundColor: '#FFFFFF',
  },
  dragHint: {
    color: '#636366',
    fontSize: 9,
    fontWeight: '500',
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C32',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  swapText: {
    color: '#0A84FF',
    fontSize: 11,
    fontWeight: '600',
  },
});
