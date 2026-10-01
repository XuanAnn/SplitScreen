import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Bookmark, POPULAR_BOOKMARKS } from '../constants/bookmarks';

interface WebViewPaneProps {
  id: 'top' | 'bottom';
  title: string;
  defaultUrl?: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  safeAreaPaddingTop?: number;
  safeAreaPaddingBottom?: number;
}

export const WebViewPane: React.FC<WebViewPaneProps> = ({
  title,
  defaultUrl = '',
  isFullscreen,
  onToggleFullscreen,
  safeAreaPaddingTop = 0,
  safeAreaPaddingBottom = 0,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(defaultUrl);
  const [inputUrl, setInputUrl] = useState<string>(defaultUrl);
  const [pageTitle, setPageTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [canGoForward, setCanGoForward] = useState<boolean>(false);
  const [showBookmarks, setShowBookmarks] = useState<boolean>(!defaultUrl);

  const formatAndNavigate = (rawInput: string) => {
    let url = rawInput.trim();
    if (!url) return;

    // Check if input looks like a valid URL or a search query
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i;
    if (urlPattern.test(url)) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
    } else {
      url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    }

    setCurrentUrl(url);
    setInputUrl(url);
    setShowBookmarks(false);
    Keyboard.dismiss();
  };

  const handleSelectBookmark = (bookmark: Bookmark) => {
    setCurrentUrl(bookmark.url);
    setInputUrl(bookmark.url);
    setShowBookmarks(false);
  };

  const handleHomePress = () => {
    setShowBookmarks(true);
    setInputUrl('');
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    if (navState.title) {
      setPageTitle(navState.title);
    }
    if (navState.url) {
      setInputUrl(navState.url);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: safeAreaPaddingTop,
          paddingBottom: safeAreaPaddingBottom,
        },
      ]}
    >
      {/* Header bar / Address input */}
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{title}</Text>
        </View>

        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={15} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nhập link hoặc tìm kiếm..."
            placeholderTextColor="#8E8E93"
            value={inputUrl}
            onChangeText={setInputUrl}
            onSubmitEditing={() => formatAndNavigate(inputUrl)}
            returnKeyType="go"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            clearButtonMode="while-editing"
          />
          {inputUrl.length > 0 && Platform.OS !== 'ios' && (
            <TouchableOpacity onPress={() => setInputUrl('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={16} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

        {/* Action Controls */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => formatAndNavigate(inputUrl)}
          >
            <Ionicons name="arrow-forward-circle" size={24} color="#0A84FF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerIconButton} onPress={onToggleFullscreen}>
            <Ionicons
              name={isFullscreen ? 'contract-outline' : 'expand-outline'}
              size={19}
              color="#F2F2F7"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Progress Bar */}
      {isLoading && (
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBar, { width: `${Math.max(progress * 100, 10)}%` }]} />
        </View>
      )}

      {/* Main Content: WebView or Bookmarks */}
      <View style={styles.body}>
        {showBookmarks || !currentUrl ? (
          <ScrollView
            contentContainerStyle={styles.bookmarksContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.sectionTitle}>Mở nhanh ứng dụng Web</Text>
            <View style={styles.grid}>
              {POPULAR_BOOKMARKS.map((item: Bookmark) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.bookmarkCard}
                  onPress={() => handleSelectBookmark(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconCircle, { backgroundColor: item.color + '25' }]}>
                    <Ionicons name={item.icon as any} size={26} color={item.color} />
                  </View>
                  <Text style={styles.bookmarkName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.tipsBox}>
              <Ionicons name="bulb-outline" size={18} color="#FFD60A" style={{ marginRight: 6 }} />
              <Text style={styles.tipsText}>
                Gõ từ khoá để tìm Google hoặc dán URL bất kỳ để mở trang web.
              </Text>
            </View>
          </ScrollView>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: currentUrl }}
            style={styles.webView}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
            onNavigationStateChange={handleNavigationStateChange}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsBackForwardNavigationGestures
            allowsPictureInPictureMediaPlayback
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="small" color="#0A84FF" />
              </View>
            )}
          />
        )}
      </View>

      {/* Mini Bottom Toolbar */}
      <View style={styles.bottomToolbar}>
        <TouchableOpacity
          style={[styles.toolButton, !canGoBack && styles.disabledButton]}
          disabled={!canGoBack}
          onPress={() => webViewRef.current?.goBack()}
        >
          <Ionicons name="chevron-back" size={20} color={canGoBack ? '#F2F2F7' : '#48484A'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolButton, !canGoForward && styles.disabledButton]}
          disabled={!canGoForward}
          onPress={() => webViewRef.current?.goForward()}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={canGoForward ? '#F2F2F7' : '#48484A'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolButton}
          onPress={() => {
            if (isLoading) {
              webViewRef.current?.stopLoading();
            } else {
              webViewRef.current?.reload();
            }
          }}
        >
          <Ionicons
            name={isLoading ? 'close-outline' : 'reload-outline'}
            size={18}
            color="#F2F2F7"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolButton} onPress={handleHomePress}>
          <Ionicons
            name={showBookmarks ? 'apps' : 'apps-outline'}
            size={18}
            color={showBookmarks ? '#0A84FF' : '#F2F2F7'}
          />
        </TouchableOpacity>

        <View style={styles.pageTitleWrapper}>
          <Text style={styles.pageTitleText} numberOfLines={1}>
            {showBookmarks ? 'Trang chủ Phím tắt' : pageTitle || currentUrl}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161618',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#1E1E22',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2C2C30',
  },
  badge: {
    backgroundColor: '#2C2C34',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  badgeText: {
    color: '#0A84FF',
    fontSize: 11,
    fontWeight: '700',
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2F',
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 34,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    gap: 4,
  },
  headerIconButton: {
    padding: 4,
  },
  progressBarBackground: {
    height: 2,
    backgroundColor: 'transparent',
    width: '100%',
  },
  progressBar: {
    height: 2,
    backgroundColor: '#0A84FF',
  },
  body: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121214',
  },
  bookmarksContainer: {
    padding: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#A1A1A8',
    fontSize: 13,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  bookmarkCard: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  bookmarkName: {
    color: '#E5E5EA',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  tipsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F24',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2F2F36',
  },
  tipsText: {
    color: '#8E8E93',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  bottomToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1E',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2C2C30',
    height: 34,
    paddingHorizontal: 8,
  },
  toolButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  disabledButton: {
    opacity: 0.35,
  },
  pageTitleWrapper: {
    flex: 1,
    marginLeft: 6,
  },
  pageTitleText: {
    color: '#8E8E93',
    fontSize: 11,
  },
});
