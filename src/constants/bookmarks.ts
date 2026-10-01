export interface Bookmark {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
}

export const SAFARI_FAVORITES: Bookmark[] = [
  { id: 'azota', name: 'Azota', url: 'https://azota.vn', icon: 'school', color: '#00A86B' },
  { id: 'google', name: 'Google', url: 'https://www.google.com', icon: 'logo-google', color: '#4285F4' },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', icon: 'chatbubbles', color: '#10A37F' },
  { id: 'youtube', name: 'YouTube', url: 'https://m.youtube.com', icon: 'logo-youtube', color: '#FF0000' },
  { id: 'apple', name: 'Apple', url: 'https://www.apple.com', icon: 'logo-apple', color: '#FFFFFF' },
  { id: 'facebook', name: 'Facebook', url: 'https://m.facebook.com', icon: 'logo-facebook', color: '#1877F2' },
  { id: 'vnexpress', name: 'VnExpress', url: 'https://vnexpress.net', icon: 'newspaper', color: '#9F224E' },
  { id: 'wikipedia', name: 'Wikipedia', url: 'https://m.wikipedia.org', icon: 'book', color: '#E5E5EA' },

];

export const POPULAR_BOOKMARKS = SAFARI_FAVORITES;

