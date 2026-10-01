import React, { useState } from 'react';
import { StyleSheet, View, LayoutChangeEvent } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafariPane } from './src/components/SafariPane';
import { SplitDivider, DIVIDER_HEIGHT } from './src/components/SplitDivider';

function DualSafariMain() {
  const insets = useSafeAreaInsets();
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [ratio, setRatio] = useState<number>(0.5); // 0.15 to 0.85
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fullscreenPane, setFullscreenPane] = useState<'safari-1' | 'safari-2' | null>(null);
  const [isSwapped, setIsSwapped] = useState<boolean>(false);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    if (height > 0) {
      setContainerHeight(height);
    }
  };

  const toggleFullscreen = (target: 'safari-1' | 'safari-2') => {
    setFullscreenPane((prev) => (prev === target ? null : target));
  };

  const handleSwap = () => {
    setIsSwapped((prev) => !prev);
  };

  const handleResetRatio = () => {
    setRatio(0.5);
  };

  // Safari Windows Configuration
  const safariOne = {
    key: 'safari-1',
    id: 'safari-1' as const,
    title: 'Safari 1',
    defaultUrl: 'https://www.google.com',
  };

  const safariTwo = {
    key: 'safari-2',
    id: 'safari-2' as const,
    title: 'Safari 2',
    defaultUrl: 'https://m.youtube.com',
  };

  const topConfig = isSwapped ? safariTwo : safariOne;
  const bottomConfig = isSwapped ? safariOne : safariTwo;

  // Calculate pixel heights dynamically
  const availableHeight = Math.max(containerHeight - DIVIDER_HEIGHT, 100);
  const topHeight = Math.round(availableHeight * ratio);
  const bottomHeight = availableHeight - topHeight;

  return (
    <View style={styles.rootContainer} onLayout={handleLayout}>
      <StatusBar style="light" />

      {/* Safari Top Window */}
      {(fullscreenPane === null || fullscreenPane === topConfig.id) && (
        <View
          style={[
            styles.paneWrapper,
            fullscreenPane === topConfig.id
              ? { flex: 1 }
              : containerHeight > 0
              ? { height: topHeight }
              : { flex: 1 },
          ]}
          pointerEvents={isDragging ? 'none' : 'auto'}
        >
          <SafariPane
            key={topConfig.key}
            id={topConfig.id}
            title={topConfig.title}
            defaultUrl={topConfig.defaultUrl}
            isFullscreen={fullscreenPane === topConfig.id}
            onToggleFullscreen={() => toggleFullscreen(topConfig.id)}
            safeAreaPaddingTop={insets.top}
          />
        </View>
      )}

      {/* Draggable Dynamic Split Divider */}
      {fullscreenPane === null && containerHeight > 0 && (
        <SplitDivider
          ratio={ratio}
          containerHeight={containerHeight}
          onRatioChange={setRatio}
          onDragStatusChange={setIsDragging}
          onSwapScreens={handleSwap}
          onResetRatio={handleResetRatio}
        />
      )}

      {/* Safari Bottom Window */}
      {(fullscreenPane === null || fullscreenPane === bottomConfig.id) && (
        <View
          style={[
            styles.paneWrapper,
            fullscreenPane === bottomConfig.id
              ? { flex: 1 }
              : containerHeight > 0
              ? { height: bottomHeight }
              : { flex: 1 },
          ]}
          pointerEvents={isDragging ? 'none' : 'auto'}
        >
          <SafariPane
            key={bottomConfig.key}
            id={bottomConfig.id}
            title={bottomConfig.title}
            defaultUrl={bottomConfig.defaultUrl}
            isFullscreen={fullscreenPane === bottomConfig.id}
            onToggleFullscreen={() => toggleFullscreen(bottomConfig.id)}
            safeAreaPaddingTop={fullscreenPane === bottomConfig.id ? insets.top : 0}
            safeAreaPaddingBottom={insets.bottom}
          />
        </View>
      )}

      {/* Invisible overlay while dragging to guarantee smooth touch capture */}
      {isDragging && <View style={styles.dragShieldOverlay} pointerEvents="none" />}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <DualSafariMain />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  paneWrapper: {
    overflow: 'hidden',
  },
  dragShieldOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    zIndex: 90,
  },
});
