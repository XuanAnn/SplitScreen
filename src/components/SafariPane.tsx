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
  Share,
  Modal,
  Alert,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Bookmark, SAFARI_FAVORITES } from '../constants/bookmarks';

const MOBILE_SAFARI_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

const DESKTOP_SAFARI_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

const ANTI_BLUR_SCRIPT = `
  (function() {
    try {
      Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
      Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
      document.addEventListener('visibilitychange', function(e) { e.stopImmediatePropagation(); }, true);
      window.addEventListener('blur', function(e) { e.stopImmediatePropagation(); }, true);
    } catch(e) {}
  })();
  true;
`;

interface SafariPaneProps {
  id: 'safari-1' | 'safari-2';
  title: string;
  defaultUrl?: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  safeAreaPaddingTop?: number;
  safeAreaPaddingBottom?: number;
}

export const SafariPane: React.FC<SafariPaneProps> = ({
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
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [displayDomain, setDisplayDomain] = useState<string>('');
  const [pageTitle, setPageTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [canGoForward, setCanGoForward] = useState<boolean>(false);
  const [showStartPage, setShowStartPage] = useState<boolean>(!defaultUrl);
  const [isDesktopMode, setIsDesktopMode] = useState<boolean>(false);
  const [showAaMenu, setShowAaMenu] = useState<boolean>(false);

  // Extract host domain for Safari address bar display (e.g., "google.com")
  const extractDomain = (url: string) => {
    try {
      const match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/im);
      return match ? match[1] : url;
    } catch {
      return url;
    }
  };

  const handleNavigate = (rawInput: string) => {
    let url = rawInput.trim();
    if (!url) return;

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
    setDisplayDomain(extractDomain(url));
    setShowStartPage(false);
    setIsEditingUrl(false);
    Keyboard.dismiss();
  };

  const handleSelectFavorite = (item: Bookmark) => {
    setCurrentUrl(item.url);
    setInputUrl(item.url);
    setDisplayDomain(extractDomain(item.url));
    setShowStartPage(false);
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    if (navState.title) {
      setPageTitle(navState.title);
    }
    if (navState.url) {
      setInputUrl(navState.url);
      setDisplayDomain(extractDomain(navState.url));
    }
  };

  const handleShare = async () => {
    if (!currentUrl) return;
    try {
      await Share.share({
        url: currentUrl,
        title: pageTitle || 'Safari',
        message: currentUrl,
      });
    } catch (error) {
      // User cancelled or share failed
    }
  };

  const toggleDesktopMode = () => {
    setIsDesktopMode(!isDesktopMode);
    setShowAaMenu(false);
    setTimeout(() => {
      webViewRef.current?.reload();
    }, 100);
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
      {/* Safari Top Navigation Bar */}
      <View style={styles.safariTopBar}>
        <View style={styles.safariBadge}>
          <Ionicons name="compass" size={13} color="#0A84FF" style={{ marginRight: 3 }} />
          <Text style={styles.safariBadgeText}>{title}</Text>
        </View>

        {isEditingUrl ? (
          <View style={styles.urlInputActiveRow}>
            <View style={styles.activeInputWrapper}>
              <Ionicons name="search" size={14} color="#8E8E93" style={styles.searchIcon} />
              <TextInput
                style={styles.activeTextInput}
                value={inputUrl}
                onChangeText={setInputUrl}
                onSubmitEditing={() => handleNavigate(inputUrl)}
                returnKeyType="go"
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder="Tìm kiếm hoặc nhập địa chỉ web"
                placeholderTextColor="#8E8E93"
              />
              {inputUrl.length > 0 && (
                <TouchableOpacity onPress={() => setInputUrl('')} style={styles.clearIconBtn}>
                  <Ionicons name="close-circle" size={16} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => {
                setIsEditingUrl(false);
                setInputUrl(currentUrl);
              }}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Huỷ</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.urlPill}>
            {/* 'aA' Page settings button */}
            <TouchableOpacity
              style={styles.aaButton}
              onPress={() => setShowAaMenu(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.aaText}>aA</Text>
            </TouchableOpacity>

            {/* Middle Domain Display / Tap to edit */}
            <TouchableOpacity
              style={styles.domainDisplayTouch}
              onPress={() => setIsEditingUrl(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showStartPage ? 'search' : 'lock-closed'}
                size={12}
                color={showStartPage ? '#8E8E93' : '#30D158'}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.domainText} numberOfLines={1}>
                {showStartPage ? 'Tìm kiếm hoặc nhập địa chỉ' : displayDomain || 'Safari'}
              </Text>
            </TouchableOpacity>

            {/* Reload or Stop loading button */}
            <TouchableOpacity
              style={styles.pillActionBtn}
              onPress={() => {
                if (showStartPage) {
                  setIsEditingUrl(true);
                } else if (isLoading) {
                  webViewRef.current?.stopLoading();
                } else {
                  webViewRef.current?.reload();
                }
              }}
            >
              <Ionicons
                name={showStartPage ? 'arrow-forward' : isLoading ? 'close' : 'reload'}
                size={15}
                color="#8E8E93"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Maximize Button */}
        <TouchableOpacity
          style={styles.fullscreenBtn}
          onPress={onToggleFullscreen}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isFullscreen ? 'contract-outline' : 'expand-outline'}
            size={18}
            color="#8E8E93"
          />
        </TouchableOpacity>
      </View>

      {/* Safari Loading Progress Bar */}
      {isLoading && (
        <View style={styles.loadingBarTrack}>
          <View style={[styles.loadingBarFill, { width: `${Math.max(progress * 100, 15)}%` }]} />
        </View>
      )}

      {/* Safari Content Body: Start Page or Real WKWebView */}
      <View style={styles.contentBody}>
        {showStartPage || !currentUrl ? (
          <ScrollView
            contentContainerStyle={styles.startPageScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.startPageHeader}>
              <Text style={styles.startPageTitle}>Mục ưa thích</Text>
            </View>

            <View style={styles.favoritesGrid}>
              {SAFARI_FAVORITES.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.favoriteItem}
                  onPress={() => handleSelectFavorite(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.favoriteIconBox, { backgroundColor: item.color + '22' }]}>
                    <Ionicons name={item.icon as any} size={28} color={item.color} />
                  </View>
                  <Text style={styles.favoriteLabel} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Privacy & Safari Info Card */}
            <View style={styles.privacyCard}>
              <Ionicons name="shield-checkmark" size={20} color="#30D158" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.privacyCardTitle}>Bảo mật Safari (WebKit)</Text>
                <Text style={styles.privacyCardDesc}>
                  Chạy trên lõi Apple WebKit độc lập, hỗ trợ âm thanh video nền và chế độ duyệt web bảo mật.
                </Text>
              </View>
            </View>
          </ScrollView>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: currentUrl }}
            style={styles.webView}
            userAgent={isDesktopMode ? DESKTOP_SAFARI_UA : MOBILE_SAFARI_UA}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
            onNavigationStateChange={handleNavigationStateChange}
            javaScriptEnabled
            domStorageEnabled
            allowFileAccess
            injectedJavaScriptBeforeContentLoaded={ANTI_BLUR_SCRIPT}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsBackForwardNavigationGestures
            allowsPictureInPictureMediaPlayback
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loadingCover}>
                <ActivityIndicator size="small" color="#0A84FF" />
              </View>
            )}
          />
        )}
      </View>

      {/* Safari Bottom Toolbar */}
      <View style={styles.safariToolbar}>
        {/* Back */}
        <TouchableOpacity
          style={styles.toolbarIconBtn}
          disabled={!canGoBack}
          onPress={() => webViewRef.current?.goBack()}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={canGoBack ? '#0A84FF' : '#48484A'}
          />
        </TouchableOpacity>

        {/* Forward */}
        <TouchableOpacity
          style={styles.toolbarIconBtn}
          disabled={!canGoForward}
          onPress={() => webViewRef.current?.goForward()}
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={canGoForward ? '#0A84FF' : '#48484A'}
          />
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity
          style={styles.toolbarIconBtn}
          disabled={!currentUrl || showStartPage}
          onPress={handleShare}
        >
          <Ionicons
            name="share-outline"
            size={20}
            color={!currentUrl || showStartPage ? '#48484A' : '#0A84FF'}
          />
        </TouchableOpacity>

        {/* Bookmarks / Favorites Start Page */}
        <TouchableOpacity
          style={styles.toolbarIconBtn}
          onPress={() => {
            setShowStartPage(true);
            setIsEditingUrl(false);
          }}
        >
          <Ionicons
            name={showStartPage ? 'book' : 'book-outline'}
            size={20}
            color="#0A84FF"
          />
        </TouchableOpacity>

        {/* New Tab / Home */}
        <TouchableOpacity
          style={styles.toolbarIconBtn}
          onPress={() => {
            setInputUrl('');
            setShowStartPage(true);
            setIsEditingUrl(true);
          }}
        >
          <Ionicons name="add-circle-outline" size={22} color="#0A84FF" />
        </TouchableOpacity>
      </View>

      {/* 'aA' Safari Menu Modal */}
      <Modal visible={showAaMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAaMenu(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuHeaderTitle}>{displayDomain || 'Safari'}</Text>
            </View>

            <TouchableOpacity style={styles.menuItem} onPress={toggleDesktopMode}>
              <Ionicons
                name={isDesktopMode ? 'phone-portrait-outline' : 'desktop-outline'}
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 12 }}
              />
              <Text style={styles.menuItemText}>
                {isDesktopMode ? 'Yêu cầu trang web cho di động' : 'Yêu cầu trang web cho máy tính'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowAaMenu(false);
                webViewRef.current?.reload();
              }}
            >
              <Ionicons name="reload" size={20} color="#FFFFFF" style={{ marginRight: 12 }} />
              <Text style={styles.menuItemText}>Tải lại trang</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowAaMenu(false);
                Alert.alert('Đã sao chép liên kết', currentUrl);
              }}
            >
              <Ionicons name="copy-outline" size={20} color="#FFFFFF" style={{ marginRight: 12 }} />
              <Text style={styles.menuItemText}>Sao chép địa chỉ</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  safariTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#242426',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#38383A',
  },
  safariBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141416',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  safariBadgeText: {
    color: '#0A84FF',
    fontSize: 11,
    fontWeight: '700',
  },
  urlPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#323236',
    borderRadius: 10,
    height: 34,
    paddingHorizontal: 8,
  },
  aaButton: {
    paddingRight: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#48484A',
  },
  aaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  domainDisplayTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  domainText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  pillActionBtn: {
    paddingLeft: 4,
  },
  fullscreenBtn: {
    padding: 6,
    marginLeft: 4,
  },
  urlInputActiveRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#323236',
    borderRadius: 10,
    height: 34,
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginRight: 6,
  },
  activeTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 0,
  },
  clearIconBtn: {
    padding: 2,
  },
  cancelButton: {
    marginLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  cancelButtonText: {
    color: '#0A84FF',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingBarTrack: {
    height: 2,
    backgroundColor: 'transparent',
    width: '100%',
  },
  loadingBarFill: {
    height: 2,
    backgroundColor: '#0A84FF',
  },
  contentBody: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121214',
  },
  startPageScroll: {
    padding: 16,
  },
  startPageHeader: {
    marginBottom: 14,
  },
  startPageTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  favoritesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  favoriteItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 16,
  },
  favoriteIconBox: {
    width: 52,
    height: 52,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  favoriteLabel: {
    color: '#D1D1D6',
    fontSize: 11,
    textAlign: 'center',
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242428',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#38383E',
  },
  privacyCardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  privacyCardDesc: {
    color: '#8E8E93',
    fontSize: 11,
    lineHeight: 15,
  },
  safariToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#242426',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#38383A',
    height: 38,
    paddingHorizontal: 8,
  },
  toolbarIconBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: '80%',
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuHeader: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3A3A3C',
    alignItems: 'center',
  },
  menuHeaderTitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3A3A3C',
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
