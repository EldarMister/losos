"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { categories, promoCards, type Category, type Product } from "../data/catalog";

type CartLine = { product: Product; quantity: number };
type DeliveryType = "delivery" | "pickup";

const money = (value: number) => new Intl.NumberFormat("ru-RU").format(value) + " ₽";

export function Storefront({ categorySlug }: { categorySlug?: string }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [compositionOpen, setCompositionOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [draftAddress, setDraftAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const [pickupLocationSelected, setPickupLocationSelected] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [catalogCategories, setCatalogCategories] = useState<Category[]>(categories);
  const [activeCategory, setActiveCategory] = useState(categorySlug || "novinki");
  const categoryNavRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;
    const controller = new AbortController();
    fetch(`${apiUrl}/categories`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Catalog request failed")))
      .then((data: Array<Category & { products: Product[] }>) => setCatalogCategories(data.map((category) => ({
        slug: category.slug,
        title: category.title,
        products: category.products.map((product) => ({ ...product, category: category.slug })),
      }))))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const visibleCategories = useMemo(() => {
    const source = categorySlug ? catalogCategories.filter((category) => category.slug === categorySlug) : catalogCategories;
    if (!search.trim()) return source;
    const query = search.trim().toLocaleLowerCase("ru");
    return source
      .map((category) => ({ ...category, products: category.products.filter((product) => product.name.toLocaleLowerCase("ru").includes(query)) }))
      .filter((category) => category.products.length > 0);
  }, [catalogCategories, categorySlug, search]);

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const highlightedCategory = categorySlug || activeCategory;

  const openProduct = (product: Product) => {
    setModalQuantity(1);
    setCompositionOpen(false);
    setSelected(product);
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
    setAddress("Ростов-на-Дону, Будённовский пр-кт 42");
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
    setSelected(null);
  };

  const openDeliveryType = (type: DeliveryType) => {
    setDeliveryType(type);
    if (type === "pickup") setPickupLocationSelected(false);
    setAddressOpen(true);
  };

  const allCatalogProducts = catalogCategories.flatMap((category) => category.products);
  const relatedNames = [
    "Шаурдельфия",
    "Шаурфорния",
    "Соус спайси",
    "Темпура с креветками спайси",
    "Запечённый с лососем терияки",
    "Рисовый сэндвич с лососем (темпура)",
  ];
  const related = selected
    ? (selected.id === 11301
      ? relatedNames.map((name) => allCatalogProducts.find((product) => product.name === name)).filter((product): product is Product => Boolean(product))
      : allCatalogProducts.filter((product) => product.id !== selected.id).slice(0, 6))
    : [];

  useEffect(() => {
    if (categorySlug) return;

    let frame = 0;
    const updateActiveCategory = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const anchor = window.innerWidth <= 720 ? 208 : 156;
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

  return (
    <div className="site">
      <section className="brand-hero" aria-label="Salmon Lovers Club">
        <img className="brand-wordmark" src="https://mnogolososya.ru/_nuxt/brand-name-logo.BwYmwvxd.svg" alt="Много лосося" />
        <picture>
          <source media="(max-width: 720px)" srcSet="https://mnogolososya.ru/_nuxt/main-pic-bg-mobile.BduSm_pt.webp" />
          <img className="brand-main" src="https://mnogolososya.ru/_nuxt/main-pic-bg.CBG-DW8k.webp" alt="Salmon Lovers Club" />
        </picture>
        <img className="brand-smile" src="https://mnogolososya.ru/_nuxt/main-pic-face.DkOigqua.webp" alt="" />
        <img className="download-app" src="https://mnogolososya.ru/_nuxt/download-app.BLqCltS2.svg" alt="Скачайте приложение" />
      </section>

      <div className="store-shell">
        <header className="delivery-header">
          <button className="cat-avatar" aria-label="Открыть меню"><img src="https://mnogolososya.ru/_nuxt/avatar.D_l_kHnY.png" alt="" /></button>
          <div className="brand-shortcuts" aria-label="Способ получения заказа">
            <button className={`brand-shortcut ${deliveryType === "delivery" ? "active" : "muted"}`} aria-label="Доставка" onClick={() => openDeliveryType("delivery")}><img src="/доставка.png" alt="" /></button>
            <button className={`brand-shortcut pickup-shortcut ${deliveryType === "pickup" ? "active" : "muted"}`} aria-label="Самовывоз" onClick={() => openDeliveryType("pickup")}><img src="/самовызов.png" alt="" /></button>
          </div>
          <button className="city-button" onClick={() => setAddressOpen(true)}>Ростов-на-Дону <span>⌄</span></button>
          <button className="address-button" onClick={() => setAddressOpen(true)}>{address || (deliveryType === "pickup" ? "Выберите ресторан для самовывоза" : "Введите адрес доставки")}</button>
          <div className="delivery-mode" aria-label={`${deliveryType === "pickup" ? "Самовывоз" : "Доставка"} от 45 минут`}><span className="bag-icon">🛍️</span><div><strong>{deliveryType === "pickup" ? "Самовывоз" : "Доставка"}</strong><small>от ~45 минут</small></div></div>
          <button className="cart-button" onClick={() => setCartOpen(true)}>Корзина{cartCount > 0 ? ` · ${cartCount}` : ""}</button>
        </header>

        <div className="promo-row" aria-label="Акции">
          {promoCards.map((card) => <img key={card.src} src={card.src} alt={card.alt} />)}
        </div>

        <nav className="category-nav" aria-label="Категории меню" ref={categoryNavRef}>
          <label className="search-pill"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск" aria-label="Поиск" /></label>
          {catalogCategories.map((category) => (
            <a
              key={category.slug}
              href={categorySlug ? `/category/${category.slug}` : `#${category.slug}`}
              data-category-slug={category.slug}
              className={category.slug === highlightedCategory ? "active" : ""}
              onClick={() => setActiveCategory(category.slug)}
            >{category.title}</a>
          ))}
        </nav>

        <main className="catalog">
          {categorySlug && visibleCategories[0] ? <h1>{visibleCategories[0].title} в Ростове-на-Дону</h1> : null}
          {visibleCategories.length === 0 ? <div className="empty-search">Ничего не нашли — попробуйте другое название</div> : null}
          {visibleCategories.map((category) => (
            <section className="category-section" id={category.slug} key={category.slug}>
              {!categorySlug ? <Link href={`/category/${category.slug}`} className="category-title">{category.title}</Link> : null}
              <div className="product-grid">
                {category.products.map((product) => (
                  <article className="product-card" data-product-id={product.id} key={`${category.slug}-${product.id}`} role="button" aria-label={`Открыть ${product.name}`} onClick={() => openProduct(product)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openProduct(product); } }}>
                    <div className="product-image-wrap">
                      <img src={product.image} alt={product.name} loading="lazy" />
                      {product.badge ? <span className="product-badge">{product.badge}</span> : null}
                    </div>
                    <div className="product-body">
                      <div className="product-name">{product.name}</div>
                      <div className="product-actions"><span>{money(product.price)}</span><button aria-label={`Добавить ${product.name}`} onClick={(event) => { event.stopPropagation(); addToCart(product); }}>+</button></div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </main>

        <footer className="footer">
          <div><img src="https://mnogolososya.ru/_nuxt/brand-name-logo.BwYmwvxd.svg" alt="Много лосося" /><p>© 2026 ООО «Гастрономия»</p></div>
          <div className="footer-links"><a href="#">Правовая информация</a><a href="#">Работа</a><a href="#">Бонусы</a></div>
          <p>ОГРН 1197746601326, 109029, г. Москва, ул. Средняя Калитниковская, д. 28, стр. 4</p>
        </footer>
      </div>

      {selected && !addressOpen ? (
        <div className="overlay product-overlay" role="dialog" aria-modal="true" aria-label={selected.name} onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <div className="product-modal">
            <button className="modal-close" onClick={() => { setCompositionOpen(false); setSelected(null); }} aria-label="Закрыть">×</button>
            <div className={`modal-art ${selected.badge ? "has-badge" : ""}`}>{selected.badge ? <span className="flavour-badge">{selected.badge}</span> : null}<img src={selected.image} alt={selected.name} /></div>
            <div className="modal-info">
              <div className="modal-arrows">← &nbsp; Предыдущее · Следующее &nbsp; →</div>
              <div className="modal-description"><h2>{selected.name}</h2><p>{selected.description}</p></div>
              <div className="nutrition">
                <div><b>{selected.weight}</b><small>граммы</small></div><div><b>{selected.calories}</b><small>ккал</small></div><div><b>{selected.protein}</b><small>белок</small></div><div><b>{selected.fat}</b><small>жиры</small></div><div><b>{selected.carbs}</b><small>углеводы</small></div>
                <div className="nutrition-actions"><button onClick={() => setCompositionOpen(true)}>Состав</button></div>
              </div>
              <h3>Вместе вкуснее</h3>
              <div className="related-row">{related.map((product) => <article key={`${product.category}-${product.id}`} onClick={() => openProduct(product)}><div className="related-image"><img src={product.image} alt={product.name} />{product.badge ? <span className="related-badge">{product.badge}</span> : null}</div><span>{product.name}</span><div className="related-actions"><b>{money(product.price)}</b><button aria-label={`Добавить ${product.name}`} onClick={(event) => { event.stopPropagation(); addToCart(product); }}>+</button></div></article>)}</div>
              <div className="modal-buy"><div className="quantity"><button aria-label="Уменьшить количество" onClick={() => setModalQuantity((current) => Math.max(1, current - 1))}>−</button><span>{modalQuantity}</span><button aria-label="Увеличить количество" onClick={() => setModalQuantity((current) => current + 1)}>+</button></div><button className="buy-button" onClick={() => addToCart(selected, modalQuantity)}>Добавить {money(selected.price * modalQuantity)}</button></div>
            </div>
          </div>
        </div>
      ) : null}

      {compositionOpen && selected ? (
        <div className="overlay composition-overlay" role="dialog" aria-modal="true" aria-labelledby="composition-title">
          <section className="composition-modal">
            <button className="composition-back" onClick={() => setCompositionOpen(false)} aria-label="Назад">←</button>
            <button className="composition-close" onClick={() => setCompositionOpen(false)} aria-label="Закрыть">×</button>
            <h2 id="composition-title">Состав</h2>
            <div className="composition-copy">{selected.composition || selected.description}</div>
            <button className="composition-return" onClick={() => setCompositionOpen(false)}>Назад</button>
          </section>
        </div>
      ) : null}

      {addressOpen ? (
        <div className="overlay address-overlay" role="dialog" aria-modal="true" aria-label={deliveryType === "pickup" ? "Самовывоз" : "Адрес доставки"}>
          <div className="address-modal">
            <div className={`map-placeholder ${deliveryType === "pickup" ? "pickup-map" : ""}`}><button className="map-back" onClick={() => setAddressOpen(false)} aria-label="Назад">←</button><div className="map-pin">●</div><div className="map-controls"><button>+</button><button>−</button></div></div>
            <div className="address-panel">
              <button className="modal-close" onClick={() => setAddressOpen(false)} aria-label="Закрыть">×</button>
              <div className="delivery-mode wide"><span className="bag-icon">🛍️</span><div><strong>{deliveryType === "pickup" ? "Самовывоз" : "Доставка"}</strong><small>от ~45 минут</small></div></div>
              {deliveryType === "pickup" ? <>
                <h2>Самовывоз</h2><p>Выберите точку для самовывоза<br />из доступных в списке или на карте</p>
                <div className="address-input muted">Ростов-на-Дону <span>×</span></div>
                <button className={`pickup-location ${pickupLocationSelected ? "selected" : ""}`} onClick={() => setPickupLocationSelected(true)}><span className="pickup-radio" /><span><b>Ростов-на-Дону, Будённовский пр-кт 42</b><small>Ежедневно, без выходных<br />11:30 – 22:30</small></span></button>
                <button className="save-address" disabled={!pickupLocationSelected} onClick={savePickup}>Забрать здесь</button>
              </> : <>
                <h2>Адрес доставки</h2><p>Введите адрес для доставки курьером<br />или передвигайте пин на карте</p>
                <div className="address-input muted">Ростов-на-Дону <span>×</span></div>
                <input className="address-input" autoFocus value={draftAddress} onChange={(event) => setDraftAddress(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveAddress(); }} placeholder="Введите адрес доставки" />
                <button className="save-address" disabled={!draftAddress.trim()} onClick={saveAddress}>Сохранить адрес</button>
              </>}
            </div>
          </div>
        </div>
      ) : null}

      {cartOpen ? (
        <div className="drawer-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
          <aside className="cart-drawer" aria-label="Корзина">
            <button className="modal-close" onClick={() => setCartOpen(false)} aria-label="Закрыть">×</button>
            <h2>Корзина</h2>
            {cart.length === 0 ? <div className="cart-empty"><span>🐟</span><h3>Пока пусто</h3><p>Добавьте что-нибудь вкусное из меню</p></div> : cart.map((line) => (
              <div className="cart-line" key={line.product.id}><img src={line.product.image} alt="" /><div><b>{line.product.name}</b><span>{money(line.product.price)}</span></div><div className="line-controls"><button onClick={() => changeQuantity(line.product.id, -1)}>−</button><span>{line.quantity}</span><button onClick={() => changeQuantity(line.product.id, 1)}>+</button></div></div>
            ))}
            {cart.length > 0 ? <button className="checkout">Оформить заказ · {money(cartTotal)}</button> : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
