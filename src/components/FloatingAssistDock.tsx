import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUp, Bot, ChevronLeft, ChevronRight, ExternalLink, MessageCircle, PhoneCall, Send, ShoppingBag, Sparkles, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';
import { resolveMediaUrl } from '../lib/media';
import { getTierPriceRange, type VolumePriceTier } from '../lib/pricing';

interface RecommendedProductCard {
  id: number;
  slug: string;
  sku: string;
  sub_category?: string;
  category: string;
  name_vi: string;
  name_en: string;
  price_vnd: number;
  price_usd: number;
  image_key: string;
  tasting_notes_vi?: string;
  tasting_notes_en?: string;
  pricing_tiers?: VolumePriceTier[];
  variants?: Array<{ label: string; priceVnd: number; priceUsd: number }>;
  to: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  recommendedProducts?: RecommendedProductCard[];
  quickLinks?: Array<{ label: string; to: string }>;
}

const RecommendedProductStrip: React.FC<{
  products: RecommendedProductCard[];
  lang: 'vi' | 'en';
  t: (vi: string, en: string) => string;
  localePath: (p: string) => string;
  formatPrice: (vnd: number, usd?: number) => string;
  onAdd: (p: RecommendedProductCard) => void;
  onNavigate: () => void;
}> = ({ products, lang, t, localePath, formatPrice, onAdd, onNavigate }) => {
  const stripRef = useRef<HTMLDivElement | null>(null);

  const scrollByAmount = (delta: number) => {
    stripRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className="w-full space-y-1">
      {products.length > 1 && (
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] font-semibold text-[#202020]/55 dark:text-[#F1EFEA]/55">
            {t(`Gợi ý (${products.length} sản phẩm)`, `Suggested (${products.length})`)}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollByAmount(-220)}
              aria-label={t('Sản phẩm trước', 'Previous product')}
              className="w-5 h-5 rounded-full bg-white dark:bg-[#16221C] border border-[#00552B]/25 dark:border-[#C6A667]/30 text-[#00552B] dark:text-[#C6A667] hover:bg-[#00552B] hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount(220)}
              aria-label={t('Sản phẩm tiếp theo', 'Next product')}
              className="w-5 h-5 rounded-full bg-white dark:bg-[#16221C] border border-[#00552B]/25 dark:border-[#C6A667]/30 text-[#00552B] dark:text-[#C6A667] hover:bg-[#00552B] hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
      <div
        ref={stripRef}
        onWheel={(e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && stripRef.current) {
            stripRef.current.scrollLeft += e.deltaY;
          }
        }}
        className="w-full flex items-stretch gap-1.5 overflow-x-auto pb-1 scroll-smooth select-none"
      >
        {products.map((p) => {
          const range = getTierPriceRange(p.pricing_tiers);
          return (
            <div
              key={p.slug}
              className="w-[215px] shrink-0 bg-white dark:bg-[#16221C] border border-[#00552B]/20 dark:border-[#C6A667]/25 rounded-lg p-1.5 flex items-center gap-2 shadow-2xs"
            >
              <Link to={localePath(p.to)} onClick={onNavigate} className="shrink-0">
                <img
                  src={resolveMediaUrl(p.image_key)}
                  alt={p.name_vi}
                  className="w-9 h-9 rounded-md object-cover border border-[#202020]/10"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={localePath(p.to)}
                  onClick={onNavigate}
                  className="block text-[11px] font-bold leading-tight text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] truncate"
                  title={lang === 'en' ? p.name_en : p.name_vi}
                >
                  {lang === 'en' ? p.name_en : p.name_vi}
                </Link>
                <p className="text-[10px] font-mono text-[#00552B] dark:text-[#C6A667] font-semibold tabular-nums truncate mt-0.5">
                  {range
                    ? `${t('Từ', 'From')} ${formatPrice(range.minVnd, range.minUsd)}/kg`
                    : formatPrice(p.price_vnd, p.price_usd)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAdd(p)}
                title={t('Thêm vào giỏ hàng', 'Add to cart')}
                className="px-2 py-1.5 rounded-md bg-[#00552B] hover:bg-[#003D25] text-white font-semibold text-[10px] inline-flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <ShoppingBag className="w-3 h-3" />
                <span>{t('Mua', 'Add')}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const FloatingAssistDock: React.FC = () => {
  const { lang, t, localePath } = useI18n();
  const { apiFetch, settings, formatPrice, addToCart, showToast } = useStore();
  const { pathname } = useLocation();

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text:
        lang === 'en'
          ? 'Hello! I am ROAR COFFEE® AI Barista. Ask me about our 7 Brand Personalities, Roasted Coffee Beans (5-tier kg pricing), 27 B2B Green Coffee SKUs, or brewing tips!'
          : 'Xin chào! Mình là Trợ lý AI Barista của ROAR COFFEE®. Bạn cần tư vấn chọn cà phê theo gu, bảng giá Cà phê Hạt rang theo kg, Nhân xanh B2B hay cách pha Phin / Espresso ạ?',
    },
  ]);

  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 260);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (chatOpen) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  // Hide floating dock inside Admin CMS
  if (pathname.includes('/admin')) return null;

  const hotlineRaw = (settings.hotline || settings.contact_phone || '0901234567').replace(/\s+/g, '');
  const zaloPhone = (settings.zalo_phone || hotlineRaw).replace(/\D/g, '') || '0901234567';

  const quickPrompts =
    lang === 'en'
      ? [
          'Recommend a coffee for Vietnamese Phin',
          'Roasted coffee beans 5-tier kg pricing',
          'Tell me about Signature Reserve',
          'B2B green coffee S18 CBU inquiry',
        ]
      : [
          'Tư vấn cà phê pha Phin đậm đà',
          'Bảng giá Cà phê Hạt rang 5 mức kg',
          'Giới thiệu dòng Signature Reserve',
          'Báo giá Nhân xanh B2B S18 CBU',
        ];

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    setInput('');

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setSending(true);

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 12000);
    try {
      const res = await apiFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          lang,
          history: nextHistory.slice(-6).map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      window.clearTimeout(timer);
      const d = await res.json().catch(() => ({}));
      const reply =
        d.reply ||
        t(
          'Xin lỗi, hệ thống AI đang bận. Bạn có thể liên hệ trực tiếp qua Zalo hoặc Hotline nhé!',
          'Sorry, AI Barista is briefly busy. Feel free to reach us via Zalo or Hotline!'
        );
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: reply,
          recommendedProducts: Array.isArray(d.recommendedProducts) ? d.recommendedProducts : [],
          quickLinks: Array.isArray(d.quickLinks) ? d.quickLinks : [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: t('Không thể kết nối AI lúc này. Vui lòng thử lại sau giây lát.', 'Unable to reach AI right now. Please try again.'),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* AI Chat Panel */}
      {chatOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[370px] max-h-[72vh] bg-white dark:bg-[#131F19] border border-[#00552B]/25 dark:border-[#C6A667]/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-[#003D25] text-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#C6A667] text-[#111111] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">ROAR AI Barista</p>
                <p className="text-[10px] text-[#C6A667] truncate">
                  {t('Tư vấn cà phê & báo giá 24/7', '24/7 Coffee & Pricing Advisor')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/15 text-white cursor-pointer"
              aria-label={t('Đóng khung chat AI', 'Close AI chat')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs bg-[#F8F5EF]/60 dark:bg-[#0E1512]">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} gap-2`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-line ${
                    m.role === 'user'
                      ? 'bg-[#00552B] text-white rounded-br-sm'
                      : 'bg-white dark:bg-[#16221C] text-[#202020] dark:text-[#F1EFEA] border border-[#202020]/10 dark:border-white/10 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>

                {/* Compact Horizontal Product Recommendation Strip */}
                {m.role === 'assistant' && m.recommendedProducts && m.recommendedProducts.length > 0 && (
                  <RecommendedProductStrip
                    products={m.recommendedProducts}
                    lang={lang}
                    t={t}
                    localePath={localePath}
                    formatPrice={formatPrice}
                    onNavigate={() => setChatOpen(false)}
                    onAdd={(p) => {
                      const isKg = p.category === 'roasted_beans' || (p.pricing_tiers?.length || 0) > 0;
                      const firstVar = p.variants?.[0];
                      addToCart({
                        productId: p.id,
                        slug: p.slug,
                        sku: p.sku,
                        nameVi: p.name_vi,
                        nameEn: p.name_en,
                        variantLabel: isKg ? '1 kg' : firstVar?.label || 'Standard',
                        unitPriceVnd: isKg ? p.pricing_tiers?.[0]?.priceVnd || p.price_vnd : firstVar?.priceVnd || p.price_vnd,
                        unitPriceUsd: isKg ? p.pricing_tiers?.[0]?.priceUsd || p.price_usd : firstVar?.priceUsd || p.price_usd,
                        quantity: 1,
                        imageKey: p.image_key,
                        unit: isKg ? 'kg' : 'unit',
                        pricingTiers: isKg ? p.pricing_tiers : undefined,
                      });
                      showToast(t(`Đã thêm ${p.name_vi} vào giỏ`, `Added ${p.name_en} to cart`));
                    }}
                  />
                )}

                {/* Quick Navigation Links */}
                {m.role === 'assistant' && m.quickLinks && m.quickLinks.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-w-[94%]">
                    {m.quickLinks.map((ql) => (
                      <Link
                        key={ql.to}
                        to={localePath(ql.to)}
                        onClick={() => setChatOpen(false)}
                        className="px-2 py-0.5 rounded-md bg-[#00552B]/10 dark:bg-[#C6A667]/15 text-[#00552B] dark:text-[#C6A667] font-semibold text-[10px] inline-flex items-center gap-1 hover:underline"
                      >
                        <span>{ql.label}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 rounded-2xl rounded-bl-sm px-3.5 py-2 text-[#202020]/60 dark:text-[#F1EFEA]/60 inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C6A667] animate-spin" />
                  <span>{t('ROAR AI đang trả lời...', 'ROAR AI is typing...')}</span>
                </div>
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-white dark:bg-[#131F19] border-t border-[#202020]/10 dark:border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((qp) => (
              <button
                key={qp}
                type="button"
                disabled={sending}
                onClick={() => sendMessage(qp)}
                className="px-2.5 py-1 rounded-full bg-[#F8F5EF] dark:bg-white/10 hover:bg-[#00552B]/10 text-[#00552B] dark:text-[#C6A667] border border-[#00552B]/15 dark:border-[#C6A667]/25 text-[10px] font-medium whitespace-nowrap shrink-0 cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-2.5 bg-white dark:bg-[#131F19] border-t border-[#202020]/10 dark:border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('Hỏi về cà phê, giá sỉ kg, cách pha...', 'Ask about coffee, kg pricing, brewing...')}
              className="flex-1 bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#202020] dark:text-[#F1EFEA] focus:outline-none focus:border-[#00552B]"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="w-9 h-9 rounded-xl bg-[#00552B] hover:bg-[#003D25] text-white flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40"
              aria-label={t('Gửi tin nhắn', 'Send message')}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Right Dock: Scroll-to-Top + Zalo + Call + AI Chat */}
      <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-5 z-40 flex flex-col items-end gap-2.5">
        {/* Scroll Back to Top */}
        {showScrollTop && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label={t('Lên đầu trang', 'Scroll back to top')}
            title={t('Lên đầu trang', 'Scroll to top')}
            className="w-11 h-11 rounded-full bg-white/95 dark:bg-[#16221C]/95 text-[#00552B] dark:text-[#C6A667] border border-[#00552B]/25 dark:border-[#C6A667]/35 shadow-lg hover:bg-[#00552B] hover:text-white transition-all flex items-center justify-center cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}

        {/* Zalo Floating Button */}
        <a
          href={`https://zalo.me/${zaloPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat Zalo ROAR COFFEE"
          title={`Zalo: ${zaloPhone}`}
          className="group relative flex items-center"
        >
          <span className="hidden sm:inline-block mr-2 px-2.5 py-1 rounded-lg bg-[#0068FF] text-white text-[11px] font-semibold shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Chat Zalo
          </span>
          <span className="relative w-12 h-12 rounded-full bg-[#0068FF] text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
            <span className="absolute inset-0 rounded-full bg-[#0068FF]/40 animate-ping" />
            <span className="relative font-extrabold text-[12px] tracking-tight">Zalo</span>
          </span>
        </a>

        {/* Hotline Call Floating Button */}
        <a
          href={`tel:${hotlineRaw}`}
          aria-label={`Hotline ${hotlineRaw}`}
          title={`Gọi ngay: ${hotlineRaw}`}
          className="group relative flex items-center"
        >
          <span className="hidden sm:inline-block mr-2 px-2.5 py-1 rounded-lg bg-[#D92D20] text-white text-[11px] font-mono font-bold shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {hotlineRaw}
          </span>
          <span className="relative w-12 h-12 rounded-full bg-[#D92D20] text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
            <span className="absolute inset-0 rounded-full bg-[#D92D20]/40 animate-ping" />
            <PhoneCall className="relative w-5 h-5" />
          </span>
        </a>

        {/* AI Chat Toggle Button */}
        <button
          type="button"
          onClick={() => setChatOpen((o) => !o)}
          aria-label={t('Mở trợ lý AI ROAR COFFEE', 'Open ROAR AI Chat')}
          title={t('Chat với Trợ lý AI ROAR', 'Chat with ROAR AI Barista')}
          className="group relative flex items-center cursor-pointer"
        >
          <span className="hidden sm:inline-block mr-2 px-2.5 py-1 rounded-lg bg-[#003D25] text-[#C6A667] border border-[#C6A667]/30 text-[11px] font-semibold shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {t('Chat AI Barista', 'AI Barista Chat')}
          </span>
          <span className="relative w-12 h-12 rounded-full bg-[#00552B] text-[#C6A667] border-2 border-[#C6A667]/70 shadow-xl flex items-center justify-center hover:bg-[#003D25] hover:scale-105 transition-all">
            {chatOpen ? <X className="w-5 h-5 text-white" /> : <MessageCircle className="w-5 h-5" />}
            {!chatOpen && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#C6A667] text-[#111111] text-[9px] font-extrabold leading-none">
                AI
              </span>
            )}
          </span>
        </button>
      </div>
    </>
  );
};
