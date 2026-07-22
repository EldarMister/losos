"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { categories, promoCards, type Category, type Product } from "../data/catalog";

type CartLine = { product: Product; quantity: number };

const money = (value: number) => new Intl.NumberFormat("ru-RU").format(value) + " ₽";

export function Storefront({ categorySlug }: { categorySlug?: string }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [addressOpen, setAddressOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [draftAddress, setDraftAddress] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<Category[]>(categories);

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

  const addToCart = (product: Product) => {
    if (!address) {
      setSelected(product);
      setAddressOpen(true);
      return;
    }
    setCart((current) => {
      const found = current.find((line) => line.product.id === product.id);
      return found
        ? current.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line)
        : [...current, { product, quantity: 1 }];
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
    if (selected) addToCartAfterAddress(selected);
  };

  const addToCartAfterAddress = (product: Product) => {
    setCart((current) => [...current, { product, quantity: 1 }]);
    setSelected(null);
  };

  const related = selected ? catalogCategories.flatMap((category) => category.products).filter((product) => product.id !== selected.id).slice(0, 2) : [];

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
          <button className="cat-avatar" aria-label="Открыть меню">🐱</button>
          <button className="city-button" onClick={() => setAddressOpen(true)}>Ростов-на-Дону <span>⌄</span></button>
          <button className="address-button" onClick={() => setAddressOpen(true)}>{address || "Введите адрес доставки"}</button>
          <div className="delivery-mode" aria-label="Доставка от 45 минут"><span className="bag-icon">🛍️</span><div><strong>Доставка</strong><small>от ~45 минут</small></div></div>
          <button className="cart-button" onClick={() => setCartOpen(true)}>Корзина{cartCount > 0 ? ` · ${cartCount}` : ""}</button>
        </header>

        <div className="promo-row" aria-label="Акции">
          {promoCards.map((card) => <img key={card.src} src={card.src} alt={card.alt} />)}
        </div>

        <nav className="category-nav" aria-label="Категории меню">
          <label className="search-pill"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск" aria-label="Поиск" /></label>
          {catalogCategories.map((category) => (
            <a key={category.slug} href={categorySlug ? `/category/${category.slug}` : `#${category.slug}`} className={category.slug === (categorySlug || "novinki") ? "active" : ""}>{category.title}</a>
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
                  <article className="product-card" data-product-id={product.id} key={`${category.slug}-${product.id}`} role="button" aria-label={`Открыть ${product.name}`} onClick={() => setSelected(product)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(product); } }}>
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
        <div className="overlay" role="dialog" aria-modal="true" aria-label={selected.name} onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <div className="product-modal">
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="Закрыть">×</button>
            <div className="modal-art"><span className="flavour-badge">{selected.badge || "●"}</span><img src={selected.image} alt={selected.name} /></div>
            <div className="modal-info">
              <div className="modal-arrows">← &nbsp; Предыдущее · Следующее &nbsp; →</div>
              <div className="modal-description"><h2>{selected.name}</h2><p>{selected.description}</p></div>
              <div className="nutrition">
                <div><b>{selected.weight}</b><small>граммы</small></div><div><b>{selected.calories}</b><small>ккал</small></div><div><b>{selected.protein}</b><small>белок</small></div><div><b>{selected.fat}</b><small>жиры</small></div><div><b>{selected.carbs}</b><small>углеводы</small></div>
                <button>Состав</button>
              </div>
              <h3>Вместе вкуснее</h3>
              <div className="related-row">{related.map((product) => <article key={product.id}><img src={product.image} alt={product.name} /><span>{product.name}</span><b>{money(product.price)}</b></article>)}</div>
              <div className="modal-buy"><div className="quantity"><button>−</button><span>1</span><button>+</button></div><button className="buy-button" onClick={() => addToCart(selected)}>Добавить {money(selected.price)}</button></div>
            </div>
          </div>
        </div>
      ) : null}

      {addressOpen ? (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Адрес доставки">
          <div className="address-modal">
            <div className="map-placeholder"><div className="map-pin">●</div><div className="map-controls"><button>+</button><button>−</button></div></div>
            <div className="address-panel">
              <button className="modal-close" onClick={() => setAddressOpen(false)} aria-label="Закрыть">×</button>
              <div className="delivery-mode wide"><span className="bag-icon">🛍️</span><div><strong>Доставка</strong><small>от ~45 минут</small></div></div>
              <h2>Адрес доставки</h2><p>Введите адрес для доставки курьером<br />или передвигайте пин на карте</p>
              <div className="address-input muted">Ростов-на-Дону <span>×</span></div>
              <input className="address-input" autoFocus value={draftAddress} onChange={(event) => setDraftAddress(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveAddress(); }} placeholder="Введите адрес доставки" />
              <button className="save-address" disabled={!draftAddress.trim()} onClick={saveAddress}>Сохранить адрес</button>
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
