"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { categories, promoCards, type Category, type Product } from "../data/catalog";

type CartLine = { product: Product; quantity: number };
type DeliveryType = "delivery" | "pickup";
type RegionOption = { slug: "bishkek" | "osh"; name: string };
type Promotion = { id: number; title: string; image: string; cta?: string };

const defaultRegions: RegionOption[] = [
  { slug: "bishkek", name: "Бишкек" },
  { slug: "osh", name: "Ош" },
];

const money = (value: number) => new Intl.NumberFormat("ru-RU").format(value) + " ₽";

const writeOverlayQuery = (name: "product" | "storyInspect", value: string | null, mode: "push" | "replace") => {
  const url = new URL(window.location.href);
  const other = name === "product" ? "storyInspect" : "product";
  url.searchParams.delete(other);
  if (value) url.searchParams.set(name, value);
  else url.searchParams.delete(name);
  const state = { ...(window.history.state || {}), storefrontOverlay: value ? name : null };
  window.history[`${mode}State`](state, "", url);
};

type StoryGroup = {
  title: string;
  kind: "student" | "telegram" | "pleasure" | "kids" | "cashback" | "sticks" | "cats";
  pages: Array<{ src: string }>;
  cta?: string;
};

const defaultStoryGroups: StoryGroup[] = [
  {
    title: "Скидка студентам",
    kind: "student",
    cta: "Заполнить форму",
    pages: [{ src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/b92972a55683d636714fea75d11469ce_resize_in_box_2048_2048.png" }],
  },
  {
    title: "Telegram: промокоды и мемы",
    kind: "telegram",
    cta: "Подарки в студию!",
    pages: [{ src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/c1a7cfbda01814519b617dda85ec062a_resize_in_box_2048_2048.jpg" }],
  },
  {
    title: "Много лосося — удовольствие есть",
    kind: "pleasure",
    pages: [{ src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/19fb66365769d651613e33c969235601_resize_in_box_2048_2048.jpg" }],
  },
  {
    title: "Всё вкусное — детям!",
    kind: "kids",
    cta: "Кавабанга!",
    pages: [{ src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/2720f66e5f628289ea1c761222a24eb4_resize_in_box_2048_2048.jpg" }],
  },
  {
    title: "Кешбэк до 100%",
    kind: "cashback",
    pages: [
      { src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/e258569da4e992205d8f3ae006d151eb_resize_in_box_2048_2048.jpg" },
      { src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/268df916388b662e094cc8fdbab4095f_resize_in_box_2048_2048.jpg" },
      { src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/5f085f197e1afcf72c9ac61c8959140f_resize_in_box_2048_2048.jpg" },
      { src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/ce627f513c731ba28069085078e433dc_resize_in_box_2048_2048.jpg" },
    ],
  },
  {
    title: "Мноооооого палочки?",
    kind: "sticks",
    cta: "Хорошо",
    pages: [{ src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/1ebd0558c6daa570f029071ce7bb1648_resize_in_box_2048_2048.jpg" }],
  },
  {
    title: "Помогаем котикам вместе",
    kind: "cats",
    cta: "Мяу!",
    pages: [{ src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/7c7596a0dba0e9fff9f96d6e65df547d_resize_in_box_2048_2048.jpg" }],
  },
];

function ProductArt({ product, mode, loading }: { product: Product; mode: "card" | "detail" | "related" | "cart"; loading?: "lazy" }) {
  if (mode === "detail" && product.referenceDetail === "popcorn") {
    return <span className={`reference-detail-art reference-detail-${product.referenceDetail}`} role="img" aria-label={product.name} />;
  }
  if (product.referenceCard) {
    const detailFallback = mode === "detail" ? " reference-detail-card-art" : "";
    return <span className={`reference-card-art reference-card-${product.referenceCard}${detailFallback}`} role="img" aria-label={product.name} />;
  }
  return <img src={product.image} alt={product.name} loading={loading} />;
}

export function Storefront({ categorySlug }: { categorySlug?: string }) {
  const searchParams = useSearchParams();
  const initialRegion = searchParams.get("region") === "osh" ? "osh" : "bishkek";
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [city, setCity] = useState(initialRegion === "osh" ? "Ош" : "Бишкек");
  const [regionSlug, setRegionSlug] = useState<"bishkek" | "osh">(initialRegion);
  const [regionOptions, setRegionOptions] = useState<RegionOption[]>(defaultRegions);
  const [cityOpen, setCityOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [compositionOpen, setCompositionOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [draftAddress, setDraftAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const [pickupLocationSelected, setPickupLocationSelected] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoSlide, setPromoSlide] = useState(0);
  const [promoPage, setPromoPage] = useState(0);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [utensilsCount, setUtensilsCount] = useState(1);
  const [noUtensils, setNoUtensils] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<Category[]>(categories);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>(defaultStoryGroups);
  const [regionalPromotions, setRegionalPromotions] = useState<Promotion[] | null>(null);
  const [activeCategory, setActiveCategory] = useState(categorySlug || "novinki");
  const [headerPinned, setHeaderPinned] = useState(false);
  const categoryNavRef = useRef<HTMLElement>(null);
  const promoRowRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const citySelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;
    const controller = new AbortController();
    const baseUrl = apiUrl.replace(/\/$/, "");

    fetch(`${baseUrl}/regions`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Regions request failed")))
      .then((data: RegionOption[]) => { if (data.length > 0) setRegionOptions(data); })
      .catch(() => undefined);

    fetch(`${baseUrl}/categories?region=${regionSlug}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Catalog request failed")))
      .then((data: Array<Category & { products: Product[] }>) => setCatalogCategories(data.map((category) => ({
        slug: category.slug,
        title: category.title,
        products: category.products.map((product) => {
          const localProduct = categories.flatMap((entry) => entry.products)
            .find((entry) => entry.name === product.name);
          return { ...localProduct, ...product, category: category.slug };
        }),
      }))))
      .catch(() => undefined);

    fetch(`${baseUrl}/promotions?region=${regionSlug}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Promotions request failed")))
      .then((data: Promotion[]) => {
        setRegionalPromotions(data);
        if (data.length > 0) {
          setStoryGroups(data.map((promotion) => ({
            title: promotion.title,
            kind: "pleasure",
            pages: [{ src: promotion.image }],
            cta: promotion.cta || undefined,
          })));
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [regionSlug]);

  useEffect(() => {
    if (!cityOpen) return;
    const closeCityMenu = (event: PointerEvent) => {
      if (!citySelectRef.current?.contains(event.target as Node)) setCityOpen(false);
    };
    document.addEventListener("pointerdown", closeCityMenu);
    return () => document.removeEventListener("pointerdown", closeCityMenu);
  }, [cityOpen]);

  const visibleCategories = useMemo(() => {
    const source = categorySlug ? catalogCategories.filter((category) => category.slug === categorySlug) : catalogCategories;
    if (!search.trim()) return source;
    const query = search.trim().toLocaleLowerCase("ru");
    const matches = source.flatMap((category) => category.products)
      .filter((product) => product.name.toLocaleLowerCase("ru").includes(query))
      .filter((product, index, products) => products.findIndex((candidate) => candidate.name === product.name) === index);
    return matches.length > 0 ? [{ slug: "search-results", title: "Нашли для вас", products: matches }] : [];
  }, [catalogCategories, categorySlug, search]);

  const currentStory = storyGroups[promoSlide] || storyGroups[0] || defaultStoryGroups[0];
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const highlightedCategory = categorySlug || activeCategory;

  const openProduct = (product: Product, historyMode: "push" | "replace" = "push") => {
    setModalQuantity(1);
    setSelectedAddons([]);
    setCompositionOpen(false);
    setSelected(product);
    writeOverlayQuery("product", product.slug, historyMode);
  };

  const closeProduct = () => {
    if (window.history.state?.storefrontOverlay === "product") {
      window.history.back();
      return;
    }
    writeOverlayQuery("product", null, "replace");
    setCompositionOpen(false);
    setSelectedAddons([]);
    setSelected(null);
  };

  const addToCart = (product: Product, quantity = 1) => {
    if (!address) {
      setSelected(product);
      setAddressOpen(true);
      return;
    }
    setCart((current) => {
      const found = current.find((line) => line.product.id === product.id);
      return found
        ? current.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + quantity } : line)
        : [...current, { product, quantity }];
    });
    writeOverlayQuery("product", null, "replace");
    setSelected(null);
  };

  const changeQuantity = (productId: number, delta: number) => {
    setCart((current) => current
      .map((line) => line.product.id === productId ? { ...line, quantity: line.quantity + delta } : line)
      .filter((line) => line.quantity > 0));
  };

  const saveAddress = () => {
    const next = draftAddress.trim();
    if (!next) return;
    setAddress(next);
    setAddressOpen(false);
    if (selected) addToCartAfterAddress(selected, modalQuantity);
  };

  const savePickup = () => {
    if (!pickupLocationSelected) return;
    setAddress(regionSlug === "osh" ? "Ош, улица Курманжан-Датка, 123" : "Бишкек, проспект Чуй, 123");
    setAddressOpen(false);
    if (selected) addToCartAfterAddress(selected, modalQuantity);
  };

  const addToCartAfterAddress = (product: Product, quantity = 1) => {
    setCart((current) => {
      const found = current.find((line) => line.product.id === product.id);
      return found
        ? current.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + quantity } : line)
        : [...current, { product, quantity }];
    });
    writeOverlayQuery("product", null, "replace");
    setSelected(null);
  };

  const openDeliveryType = (type: DeliveryType) => {
    setDeliveryType(type);
    if (type === "pickup") setPickupLocationSelected(false);
    setAddressOpen(true);
  };

  const openPromo = (index: number) => {
    setPromoSlide(index);
    setPromoPage(0);
    setPromoOpen(true);
    writeOverlayQuery("storyInspect", String(index + 1), "push");
  };

  const changePromo = (delta: number) => {
    const pageCount = currentStory.pages.length;
    if (delta > 0 && promoPage < pageCount - 1) {
      setPromoPage((current) => current + 1);
      return;
    }
    if (delta < 0 && promoPage > 0) {
      setPromoPage((current) => current - 1);
      return;
    }

    const nextGroup = (promoSlide + delta + storyGroups.length) % storyGroups.length;
    setPromoSlide(nextGroup);
    setPromoPage(delta < 0 ? storyGroups[nextGroup].pages.length - 1 : 0);
    writeOverlayQuery("storyInspect", String(nextGroup + 1), "replace");
  };

  const closePromo = () => {
    if (window.history.state?.storefrontOverlay === "storyInspect") {
      window.history.back();
      return;
    }
    writeOverlayQuery("storyInspect", null, "replace");
    setPromoOpen(false);
  };

  const allCatalogProducts = catalogCategories.flatMap((category) => category.products);
  const relatedNames = [
    "Шаурдельфия",
    "Шаурфорния",
    "Соус спайси",
    "Темпура с креветками спайси",
    "Запечённый с лососем терияки",
    "Соус соевый",
    "Филадельфия лайт",
    "Филадельфия с лососем",
    "Том Ям с кальмаром и креветками",
    "Хрустящая креветка и соус аригато",
    "Том Ям с креветками",
    "Запеченная калифорния",
    "Запечённый с креветками",
    "Запечённый с кальмаром и пармезаном",
    "Темпура с лососем терияки",
    "Просто огурец",
    "Имбирь маринованный",
    "Даку 2.0",
  ];
  const potatoRelatedNames = [
    "Филадельфия с лососем",
    "Филадельфия лайт",
    "Запечённый с лососем терияки",
    "Снежная калифорния",
    "Запеченная калифорния",
    "Том Ям с креветками",
    "Просто огурец",
    "Темпура с лососем терияки",
    "Запечённый с креветками",
    "Темпура с лососем",
    "Хитовый",
    "Наггетсы куриные",
    "Хрустящая креветка и соус аригато",
    "Темпура с креветками спайси",
    "Том Ям с кальмаром и креветками",
    "Соус спайси",
    "Соус соевый",
    "Даку 2.0",
  ];
  const relatedForSelected = selected?.name === "Картофель фри" ? potatoRelatedNames : relatedNames;
  const related = selected?.modalKind === "related" || selected?.modalKind === "addons"
    ? (selected.id === 11301 || selected.name === "Картофель фри"
      ? relatedForSelected.map((name) => allCatalogProducts.find((product) => product.name === name)).filter((product): product is Product => Boolean(product))
      : allCatalogProducts.filter((product) => product.id !== selected.id).slice(0, 18))
    : [];
  const selectedAddonItems = selected?.addonGroups?.flatMap((group) => group.items).filter((item) => selectedAddons.includes(item.id)) || [];
  const addonTotal = selectedAddonItems.reduce((sum, item) => sum + item.price, 0);

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((current) => current.includes(addonId) ? current.filter((id) => id !== addonId) : [...current, addonId]);
  };

  const navigateProduct = (delta: number) => {
    if (!selected) return;
    const uniqueProducts = allCatalogProducts.filter((product, index, items) => items.findIndex((item) => item.id === product.id) === index);
    const index = uniqueProducts.findIndex((product) => product.id === selected.id);
    if (index < 0) return;
    openProduct(uniqueProducts[(index + delta + uniqueProducts.length) % uniqueProducts.length], "replace");
  };

  useEffect(() => {
    if (!promoOpen) return;
    const timer = window.setTimeout(() => {
      if (promoPage < currentStory.pages.length - 1) {
        setPromoPage((current) => current + 1);
        return;
      }
      const nextGroup = (promoSlide + 1) % storyGroups.length;
      setPromoSlide(nextGroup);
      setPromoPage(0);
      writeOverlayQuery("storyInspect", String(nextGroup + 1), "replace");
    }, 30_000);
    return () => window.clearTimeout(timer);
  }, [currentStory.pages.length, promoOpen, promoPage, promoSlide, storyGroups]);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const productSlug = params.get("product");
      const product = productSlug
        ? catalogCategories.flatMap((category) => category.products).find((item) => item.slug === productSlug)
        : null;
      setSelected(product || null);
      if (!product) {
        setCompositionOpen(false);
        setSelectedAddons([]);
      }

      const storyNumber = Number(params.get("storyInspect"));
      if (Number.isInteger(storyNumber) && storyNumber >= 1 && storyNumber <= storyGroups.length) {
        setPromoSlide(storyNumber - 1);
        setPromoPage(0);
        setPromoOpen(true);
      } else {
        setPromoOpen(false);
      }
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [catalogCategories, storyGroups]);

  useEffect(() => {
    const locked = Boolean(selected || compositionOpen || addressOpen || cartOpen || promoOpen || menuOpen);
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [selected, compositionOpen, addressOpen, cartOpen, promoOpen, menuOpen]);

  useEffect(() => {
    if (categorySlug) return;

    let frame = 0;
    const updateActiveCategory = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const isDesktop = window.innerWidth > 720;
        setHeaderPinned(isDesktop && window.scrollY >= 315);
        const anchor = isDesktop ? 190 : 208;
        let nextCategory = visibleCategories[0]?.slug || "novinki";

        for (const category of visibleCategories) {
          const section = document.getElementById(category.slug);
          if (section && section.getBoundingClientRect().top <= anchor) {
            nextCategory = category.slug;
          } else {
            break;
          }
        }

        setActiveCategory((current) => current === nextCategory ? current : nextCategory);
        frame = 0;
      });
    };

    updateActiveCategory();
    window.addEventListener("scroll", updateActiveCategory, { passive: true });
    window.addEventListener("resize", updateActiveCategory);
    return () => {
      window.removeEventListener("scroll", updateActiveCategory);
      window.removeEventListener("resize", updateActiveCategory);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [categorySlug, visibleCategories]);

  useEffect(() => {
    if (!categorySlug) return;
    const updatePinnedHeader = () => setHeaderPinned(window.innerWidth > 720 && window.scrollY >= 315);
    updatePinnedHeader();
    window.addEventListener("scroll", updatePinnedHeader, { passive: true });
    window.addEventListener("resize", updatePinnedHeader);
    return () => {
      window.removeEventListener("scroll", updatePinnedHeader);
      window.removeEventListener("resize", updatePinnedHeader);
    };
  }, [categorySlug]);

  useEffect(() => {
    const nav = categoryNavRef.current;
    const item = nav?.querySelector<HTMLElement>(`[data-category-slug="${highlightedCategory}"]`);
    if (!nav || !item) return;
    const targetLeft = window.innerWidth <= 720
      ? 100
      : (nav.clientWidth - item.clientWidth) / 2;
    nav.scrollTo({
      left: item.offsetLeft - targetLeft,
      behavior: "smooth",
    });
  }, [highlightedCategory]);

  useEffect(() => {
    const row = promoRowRef.current;
    if (!row) return;
    if (window.innerWidth > 720) {
      row.scrollLeft = 92;
      return;
    }
    let index = 0;
    const timer = window.setInterval(() => {
      const lastIndex = Math.max(0, Math.floor((row.scrollWidth - row.clientWidth) / 132));
      index = index >= lastIndex ? 0 : index + 1;
      row.scrollTo({ left: index * 132, behavior: "smooth" });
    }, 5_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="site">
      <section className="brand-hero" aria-label="Salmon Lovers Club">
        <img className="brand-wordmark" src="https://mnogolososya.ru/_nuxt/brand-name-logo.BwYmwvxd.svg" alt="Много лосося" />
        <picture>
          <source media="(max-width: 720px)" srcSet="https://mnogolososya.ru/_nuxt/main-pic-bg-mobile.BduSm_pt.webp" />
          <img className="brand-main" src="https://mnogolososya.ru/_nuxt/main-pic-bg.CBG-DW8k.webp" alt="Salmon Lovers Club" />
        </picture>
        <img className="brand-smile" src="https://mnogolososya.ru/_nuxt/main-pic-face.DkOigqua.webp" alt="" />
        <a href="https://trk.mail.ru/c/a7gh71" aria-label="Скачайте приложение"><img className="download-app" src="https://mnogolososya.ru/_nuxt/download-app.BLqCltS2.svg" alt="Скачайте приложение" /></a>
      </section>

      <div className={`store-shell ${headerPinned ? "header-pinned" : ""}`}>
        <header className="delivery-header">
          <button className="cat-avatar" aria-label="Открыть меню" onClick={() => setMenuOpen(true)}><span className="cat-reference" aria-hidden="true" /></button>
          <div className="brand-shortcuts" aria-label="Способ получения заказа">
            <button className={`brand-shortcut ${deliveryType === "delivery" ? "active" : "muted"}`} aria-label="Доставка" onClick={() => openDeliveryType("delivery")}><img src="/delivery.png" alt="" /></button>
            <button className={`brand-shortcut pickup-shortcut ${deliveryType === "pickup" ? "active" : "muted"}`} aria-label="Самовывоз" onClick={() => openDeliveryType("pickup")}><img src="/pickup.png" alt="" /></button>
          </div>
          <div className="order-location-bar">
            <div className="city-select" ref={citySelectRef}>
              <button className="city-button" aria-expanded={cityOpen} aria-haspopup="listbox" onClick={() => setCityOpen((current) => !current)}>{city} <span className={`city-chevron${cityOpen ? " open" : ""}`} aria-hidden="true" /></button>
              {cityOpen ? <div className="city-dropdown" role="listbox" aria-label="Город">
                {regionOptions.filter((option) => option.name !== city).map((option) => <button key={option.slug} role="option" aria-selected={city === option.name} onClick={() => { const url = new URL(window.location.href); url.searchParams.set("region", option.slug); window.history.replaceState(window.history.state, "", url); setCity(option.name); setCatalogCategories(categories); setStoryGroups(defaultStoryGroups); setRegionalPromotions(null); setRegionSlug(option.slug); setCityOpen(false); setAddress(""); setCart([]); setSelected(null); }}>{option.name}</button>)}
              </div> : null}
            </div>
            <button className="address-button" onClick={() => setAddressOpen(true)}>{address || (deliveryType === "pickup" ? "Выберите ресторан для самовывоза" : "Введите адрес доставки")}</button>
            <div className="delivery-mode" aria-label={`${deliveryType === "pickup" ? "Самовывоз ~40 минут" : "Доставка от ~45 минут"}`}>
              <div className="desktop-mode-icons"><button className={deliveryType === "delivery" ? "active" : "muted"} aria-label="Выбрать доставку" onClick={() => openDeliveryType("delivery")}><img src="/delivery.png" alt="" /></button><button className={deliveryType === "pickup" ? "active" : "muted"} aria-label="Выбрать самовывоз" onClick={() => openDeliveryType("pickup")}><img src="/pickup.png" alt="" /></button></div>
              <span className="delivery-connector" aria-hidden="true" />
              <div className="delivery-status"><strong>{deliveryType === "pickup" ? "Самовывоз" : "Доставка"}</strong><small>{deliveryType === "pickup" ? "~40 минут" : "от ~45 минут"}</small></div>
            </div>
          </div>
          <button className="cart-button" onClick={() => setCartOpen(true)}>Корзина{cartCount > 0 ? ` ${money(cartTotal)}` : ""}</button>
        </header>

        <div className="promo-row" aria-label="Акции" ref={promoRowRef}>
          {regionalPromotions
            ? regionalPromotions.map((promotion, index) => <button className="promo-card" key={promotion.id} onClick={() => openPromo(index)} aria-label={`Открыть акцию: ${promotion.title}`}><img src={promotion.image} alt={promotion.title} /></button>)
            : promoCards.map((card, index) => <button className="promo-card" key={card.alt} onClick={() => openPromo(index)} aria-label={`Открыть акцию: ${card.alt}`}>{"referenceCrop" in card ? <span className={`promo-reference promo-reference-${card.referenceCrop}`} role="img" aria-label={card.alt} /> : <img src={card.src} alt={card.alt} />}</button>)}
        </div>

        <nav className="category-nav" aria-label="Категории меню" ref={categoryNavRef}>
          <label className={`search-pill ${searchOpen || search ? "search-open" : ""}`} onClick={() => { setSearchOpen(true); window.setTimeout(() => searchInputRef.current?.focus(), 0); }}><span>⌕</span><input ref={searchInputRef} value={search} onFocus={() => setSearchOpen(true)} onBlur={() => { if (!search) setSearchOpen(false); }} onChange={(event) => setSearch(event.target.value)} placeholder={searchOpen ? "Что ищем?" : "Поиск"} aria-label="Поиск" /></label>
          {catalogCategories.map((category) => (
            <a
              key={category.slug}
              href={categorySlug ? `/category/${category.slug}?region=${regionSlug}` : `#${category.slug}`}
              data-category-slug={category.slug}
              className={category.slug === highlightedCategory ? "active" : ""}
              onClick={() => setActiveCategory(category.slug)}
            >{category.title}</a>
          ))}
        </nav>

        <main className="catalog">
          {categorySlug && visibleCategories[0] ? <h1>{visibleCategories[0].title} в {city}</h1> : null}
          {visibleCategories.length === 0 ? <div className="empty-search">Ничего не нашли — попробуйте другое название</div> : null}
          {visibleCategories.map((category) => (
            <section className="category-section" id={category.slug} key={category.slug}>
              {!categorySlug ? search.trim()
                ? <h2 className="category-title">{category.title}</h2>
                : <Link href={`/category/${category.slug}?region=${regionSlug}`} className="category-title">{category.title}</Link>
                : null}
              <div className="product-grid">
                {category.products.map((product) => (
                  <article className={`product-card${product.available === false ? " unavailable" : ""}`} data-product-id={product.id} key={`${category.slug}-${product.id}`} role="button" aria-label={`Открыть ${product.name}`} onClick={() => openProduct(product)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openProduct(product); } }}>
                    <div className="product-image-wrap">
                      <ProductArt product={product} mode="card" loading="lazy" />
                      {product.badge ? <span className="product-badge">{product.badge}</span> : null}
                      {product.available === false ? <span className="product-finished">Закончилось</span> : null}
                    </div>
                    <div className="product-body">
                      <div className="product-name">{product.name}</div>
                      <div className="product-actions"><span>{money(product.price)}</span>{product.available === false ? null : <button aria-label={`Добавить ${product.name}`} onClick={(event) => { event.stopPropagation(); addToCart(product); }}>+</button>}</div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>

      <footer className="footer">
        <div className="footer-brand"><img className="footer-logo" src="https://mnogolososya.ru/_nuxt/brand-name-logo.BwYmwvxd.svg" alt="Много лосося" /><span>© 2026 ООО «Гастрономия»</span></div>
        <a href="https://trk.mail.ru/c/a7gh71" aria-label="Скачайте приложение"><img className="footer-app" src="https://mnogolososya.ru/_nuxt/download-app.BLqCltS2.svg" alt="Скачайте приложение" /></a>
        <div className="footer-links"><a href="https://about.mnogolososya.ru/">Правовая информация</a><span>•</span><a href="https://rabota.mnogolososya.ru/?utm_source=web_site&utm_medium=web&utm_campaign=hr">Работа</a></div>
        <p className="footer-legal">ОГРН 1197746601326, 109029, г. Москва, вн.тер.г. муниципальный округ Нижегородский, ул. Средняя Калитниковская, д.28, стр.4, этаж/пом/ком 1/VIII/№48</p>
      </footer>

      {cartCount > 0 ? <button className="mobile-cart-button" onClick={() => setCartOpen(true)}>Корзина · {money(cartTotal)}</button> : null}

      {menuOpen ? (
        <div className="overlay profile-overlay" role="dialog" aria-modal="true" aria-label="Профиль" onMouseDown={(event) => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
          <section className="profile-modal">
            <button className="profile-close" onClick={() => setMenuOpen(false)} aria-label="Закрыть">×</button>
            <div className="profile-user"><span className="cat-reference" aria-hidden="true" /><div><span>Привет!</span><strong>Войдите в профиль</strong></div></div>
            <img className="profile-award" src="https://mnogolososya.ru/_nuxt/auth-roskachestvo-banner.CHXK7t8d.png" alt="Официально лучшее приложение 2025 года для доставки готовой еды по итогам проверки Роскачества. Проверьте сами!" />
            <nav className="profile-links" aria-label="Меню профиля"><a href="https://mnogolososya.ru/support"><img src="https://mnogolososya.ru/_nuxt/Support.xyJ2YVkd.png" alt="" />Поддержка</a><a href="https://mnogolososya.ru/page/o-nas"><img src="https://mnogolososya.ru/_nuxt/About.TR1tfEtn.png" alt="" />О нас</a></nav>
            <button className="profile-login">Войти</button>
          </section>
        </div>
      ) : null}

      {promoOpen ? (
        <div className="promo-overlay" role="dialog" aria-modal="true" aria-label={currentStory.title} onMouseDown={(event) => { if (event.target === event.currentTarget) closePromo(); }}>
          <button className="story-arrow story-arrow-left" onClick={() => changePromo(-1)} aria-label="Предыдущая акция">←</button>
          <article className={`story-card story-${currentStory.kind}`}>
            <img key={currentStory.pages[promoPage]?.src || currentStory.pages[0].src} className="story-image" src={currentStory.pages[promoPage]?.src || currentStory.pages[0].src} alt={currentStory.title} />
            <div className="story-progress" aria-label="Следующая страница через 30 секунд">
              {currentStory.pages.map((page, index) => (
                <span className={`story-progress-segment${index < promoPage ? " complete" : ""}${index === promoPage ? " active" : ""}`} key={page.src}>
                  {index === promoPage ? <i key={`${promoSlide}-${promoPage}`} /> : null}
                </span>
              ))}
            </div>
            <button className="story-close" onClick={closePromo} aria-label="Закрыть">×</button>
            {currentStory.cta ? <button className="story-cta" type="button">{currentStory.cta}</button> : null}
          </article>
          <button className="story-arrow story-arrow-right" onClick={() => changePromo(1)} aria-label="Следующая акция">→</button>
        </div>
      ) : null}

      {selected && !addressOpen ? (
        <div className="overlay product-overlay" role="dialog" aria-modal="true" aria-label={selected.name} onMouseDown={(event) => { if (event.target === event.currentTarget) closeProduct(); }}>
          <div className={`product-modal product-modal-${selected.modalKind || "related"}`}>
            <button className="modal-close" onClick={closeProduct} aria-label="Закрыть">×</button>
            <div className={`modal-art ${selected.badge ? "has-badge" : ""}`}>{selected.badge ? <span className="flavour-badge">{selected.badge}</span> : null}<ProductArt product={selected} mode="detail" /></div>
            <div className="modal-info">
              <div className="modal-arrows"><button onClick={() => navigateProduct(-1)}>← &nbsp; Предыдущее</button><span>·</span><button onClick={() => navigateProduct(1)}>Следующее &nbsp; →</button></div>
              <div className="modal-description"><h2>{selected.name}</h2>{selected.description ? <p>{selected.description}</p> : null}</div>
              <div className="nutrition">
                <div><b>{selected.weight}</b><small>граммы</small></div><div><b>{selected.calories}</b><small>ккал</small></div><div><b>{selected.protein}</b><small>белок</small></div><div><b>{selected.fat}</b><small>жиры</small></div><div><b>{selected.carbs}</b><small>углеводы</small></div>
                <div className="nutrition-actions"><button onClick={() => setCompositionOpen(true)}>Состав</button></div>
              </div>
              {selected.modalKind === "addons" ? <div className="addon-groups">{selected.addonGroups?.map((group) => <section className="addon-group" key={group.title}><h3>{group.title}</h3>{group.items.map((item) => { const chosen = selectedAddons.includes(item.id); return <div className={`addon-row ${chosen ? "selected" : ""}`} key={item.id}><img src={item.image} alt="" /><div><strong>{item.name}</strong><small>{item.price ? `+${money(item.price)}` : money(0)}</small></div><button onClick={() => toggleAddon(item.id)} aria-label={`${chosen ? "Убрать" : "Добавить"} ${item.name}`}>{chosen ? "−" : "+"}</button></div>; })}</section>)}</div> : null}
              {selected.modalKind === "related" || selected.modalKind === "addons" ? <><h3>Вместе вкуснее</h3><div className="related-row">{related.map((product) => <article key={`${product.category}-${product.id}`} onClick={() => openProduct(product)}><div className="related-image"><ProductArt product={product} mode="related" />{product.badge ? <span className="related-badge">{product.badge}</span> : null}</div><span>{product.name}</span><div className="related-actions"><b>{money(product.price)}</b><button aria-label={`Добавить ${product.name}`} onClick={(event) => { event.stopPropagation(); addToCart(product); }}>+</button></div></article>)}</div></> : null}
              <div className="modal-buy"><div className="quantity"><button aria-label="Уменьшить количество" disabled={modalQuantity === 1} onClick={() => setModalQuantity((current) => Math.max(1, current - 1))}>−</button><span>{modalQuantity}</span><button aria-label="Увеличить количество" onClick={() => setModalQuantity((current) => current + 1)}>+</button></div><button className="buy-button" onClick={() => addToCart(selected, modalQuantity)}>Добавить {money((selected.price + addonTotal) * modalQuantity)}</button></div>
            </div>
          </div>
        </div>
      ) : null}

      {compositionOpen && selected ? (
        <div className="overlay composition-overlay" role="dialog" aria-modal="true" aria-labelledby="composition-title">
          <section className="composition-modal">
            <div className="composition-navigation">
              <button className="composition-back" onClick={() => setCompositionOpen(false)} aria-label="Назад">←</button>
              <button className="composition-close" onClick={() => setCompositionOpen(false)} aria-label="Закрыть">×</button>
            </div>
            <h2 id="composition-title">Состав</h2>
            <div className="composition-copy">{selected.composition || selected.description}</div>
            <button className="composition-return" onClick={() => setCompositionOpen(false)}>Назад</button>
          </section>
        </div>
      ) : null}

      {addressOpen ? (
        <div className="overlay address-overlay" role="dialog" aria-modal="true" aria-label={deliveryType === "pickup" ? "Самовывоз" : "Адрес доставки"}>
          <div className="address-modal">
            <div className={`map-placeholder ${deliveryType === "pickup" ? `pickup-map${pickupLocationSelected ? " pickup-map-selected" : ""}` : `delivery-map delivery-map-${regionSlug}`}`}>
              <button className="map-back" onClick={() => setAddressOpen(false)} aria-label="Назад">←</button>
              <button className="map-locate" type="button" aria-label="Определить моё местоположение">➤</button>
              <img
                className={`map-marker${deliveryType === "pickup" ? " pickup-map-marker" : ""}`}
                src={deliveryType === "pickup"
                  ? "https://mnogolososya.ru/_nuxt/pickup-marker-disabled.DSAcVKbt.svg"
                  : "https://mnogolososya.ru/_nuxt/active-marker.O4wBI7zK.svg"}
                alt=""
              />
              <div className="map-controls"><button aria-label="Увеличить карту">+</button><button aria-label="Уменьшить карту">−</button></div>
              <div className="map-attribution"><span>📍 Открыть Яндекс Карты</span><small>© Яндекс&nbsp; Условия использования</small></div>
            </div>
            <div className="address-panel">
              <button className="modal-close" onClick={() => setAddressOpen(false)} aria-label="Закрыть">×</button>
              <div className="modal-mode-switch" aria-label="Способ получения заказа">
                <div className="modal-mode-icons">
                  <button className={deliveryType === "delivery" ? "active" : "muted"} aria-label="Выбрать доставку" onClick={() => openDeliveryType("delivery")}><img src="/delivery.png" alt="" /></button>
                  <button className={deliveryType === "pickup" ? "active" : "muted"} aria-label="Выбрать самовывоз" onClick={() => openDeliveryType("pickup")}><img src="/pickup.png" alt="" /></button>
                </div>
                <div><strong>{deliveryType === "pickup" ? "Самовывоз" : "Доставка"}</strong><small>{deliveryType === "pickup" ? "~45 минут" : "от ~45 минут"}</small></div>
              </div>
              {deliveryType === "pickup" ? <>
                <h2>Самовывоз</h2><p>Выберите точку для самовывоза<br />из доступных в списке или на карте</p>
                <div className="address-input muted">{city} <span>×</span></div>
                <button className={`pickup-location ${pickupLocationSelected ? "selected" : ""}`} onClick={() => setPickupLocationSelected(true)}><span className="pickup-radio" /><span><b>{regionSlug === "osh" ? "Ош, улица Курманжан-Датка, 123" : "Бишкек, проспект Чуй, 123"}</b><small>Ежедневно, без выходных<br />11:30 – 22:30</small></span></button>
                <button className="save-address save-pickup" disabled={!pickupLocationSelected} onClick={savePickup}>Забрать здесь</button>
              </> : <>
                <h2>Адрес доставки</h2><p>Введите адрес для доставки курьером<br />или передвигайте пин на карте</p>
                <div className="address-input muted">{city} <span>×</span></div>
                <input className="address-input" autoFocus value={draftAddress} onChange={(event) => setDraftAddress(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveAddress(); }} placeholder="Введите адрес доставки" />
                {draftAddress.trim() ? <button className="save-address" onClick={saveAddress}>Сохранить адрес</button> : null}
              </>}
            </div>
          </div>
        </div>
      ) : null}

      {cartOpen ? (
        <div className="drawer-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
          <aside className="cart-drawer" data-filled={cart.length > 0 ? "true" : "false"} aria-label="Корзина">
            <button className="modal-close" onClick={() => setCartOpen(false)} aria-label="Закрыть">×</button>
            {cart.length === 0 ? <div className="cart-empty"><img src="https://mnogolososya.ru/_nuxt/empty-cart.CYKZtHDV.svg" alt="" /><div>Место сбора<br />вкусных блюд</div></div> : <>
              <div className="cart-address">{address}</div>
              <div className="cart-layout">
                <section className="cart-products">
                  <div className="cart-section-heading"><h2>Корзина</h2><button aria-label="Очистить корзину" onClick={() => setCart([])}>⌫</button></div>
                  {cart.map((line) => (
                    <div className="cart-line" key={line.product.id}><div className="cart-line-art"><ProductArt product={line.product} mode="cart" /></div><div><b>{line.product.name}</b><span>{money(line.product.price)}</span></div><div className="line-controls"><button aria-label={`Уменьшить ${line.product.name}`} onClick={() => changeQuantity(line.product.id, -1)}>−</button><span>{line.quantity}</span><button aria-label={`Увеличить ${line.product.name}`} onClick={() => changeQuantity(line.product.id, 1)}>+</button></div></div>
                  ))}
                </section>
                <section className="cart-options">
                  <div className="cart-kit">
                    <h2>Комплектация</h2>
                    <div className="kit-row"><span className="chopsticks-art" aria-hidden="true">╱╱</span><div><b>Палочки</b><div className="kit-quantity"><button disabled={noUtensils || utensilsCount === 0} onClick={() => setUtensilsCount((current) => Math.max(0, current - 1))}>−</button><span>{noUtensils ? 0 : utensilsCount}</span><button disabled={noUtensils} onClick={() => setUtensilsCount((current) => current + 1)}>+</button></div></div><label className="no-utensils"><span><b>Без<br />приборов</b><small>Если не<br />используете –<br />это экологично</small></span><button role="switch" aria-checked={noUtensils} className={noUtensils ? "active" : ""} onClick={() => setNoUtensils((current) => !current)}><i /></button></label></div>
                  </div>
                  <div className="cart-benefit"><h2>Выгода</h2><div><span><b>Промокод или акция</b><small>Нужно будет авторизоваться</small></span><button>Выбрать</button></div></div>
                  <div className="cart-summary"><div className="cart-delivery-summary"><img src={deliveryType === "pickup" ? "/pickup.png" : "/delivery.png"} alt="" /><span><b>{deliveryType === "pickup" ? "Самовывоз" : "Доставка"}</b><small>{deliveryType === "pickup" ? "Примерно через 40 минут" : "Примерно через 45 минут"}</small></span></div><button className="checkout"><span>Далее</span><b>{money(cartTotal)}</b></button></div>
                </section>
              </div>
            </>}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
